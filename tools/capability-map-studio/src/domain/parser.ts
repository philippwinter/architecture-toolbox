import { isNode, LineCounter, parseDocument, type Document, type Node } from 'yaml';
import { hasCapabilityIcon } from './icons';
import { buildHierarchyIndex } from './hierarchy';
import { capabilityMapSchema } from './schema';
import type {
  CapabilityChildInput,
  CapabilityGroupInput,
  CapabilityInput,
  CapabilityMapInput,
  Diagnostic,
  DocumentResult,
  FlushInput,
  GroupItemInput,
  NormalizedCapability,
  NormalizedCapabilityGroup,
  NormalizedFlush,
  NormalizedGroupItem,
  NormalizedMap,
  RootItemInput,
} from './types';

export const DEFAULT_COLOR = '#DCE8F5';
export const DEFAULT_GROUP_COLOR = '#EDF1F5';

function isFlushInput(item: RootItemInput | CapabilityChildInput): item is FlushInput {
  return 'type' in item && item.type === 'flush';
}

function isGroupInput(item: RootItemInput): item is CapabilityGroupInput {
  return 'type' in item && item.type === 'group';
}

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) return '$';
  return path.reduce<string>((result, segment) => {
    if (typeof segment === 'number') return `${result}[${segment}]`;
    return result ? `${result}.${String(segment)}` : String(segment);
  }, '');
}

function locatePath(document: Document, rawPath: PropertyKey[]): { from: number; to: number } {
  const path = rawPath.map(String).map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
  let node: Node | undefined;

  for (let length = path.length; length >= 0; length -= 1) {
    const candidate = length === 0 ? document.contents : document.getIn(path.slice(0, length), true);
    if (isNode(candidate)) {
      node = candidate;
      break;
    }
  }

  const range = node?.range;
  return range ? { from: range[0], to: Math.max(range[1], range[0] + 1) } : { from: 0, to: 1 };
}

function withLinePosition(
  diagnostic: Omit<Diagnostic, 'line' | 'column'>,
  lineCounter: LineCounter,
): Diagnostic {
  const position = lineCounter.linePos(diagnostic.from);
  return { ...diagnostic, line: position.line, column: position.col };
}

function normalizeFlush(input: FlushInput): NormalizedFlush {
  return { kind: 'flush', direction: input.direction };
}

function normalizeCapability(
  input: CapabilityInput,
  inherited: { color: string; icon?: string },
  parentId: string | undefined,
  path: string[],
  pathNames: string[],
  depth: number,
  index: Map<string, NormalizedCapability>,
): NormalizedCapability {
  const color = input.visualization?.color ?? inherited.color;
  const icon = input.visualization?.icon ?? inherited.icon;
  const capability: NormalizedCapability = {
    kind: 'capability',
    id: input.id,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    owner: input.owner?.trim() || undefined,
    responsibilities: input.responsibilities?.map((value) => value.trim()) ?? [],
    tags: input.tags?.map((value) => value.trim()) ?? [],
    metadata: input.metadata ?? {},
    explicitColor: input.visualization?.color,
    color,
    explicitIcon: input.visualization?.icon,
    icon,
    shape: input.visualization?.shape ?? 'box',
    layout: {
      direction: input.layout?.direction ?? 'vertical',
      layerWeight: input.layout?.layerWeight,
      trackWeight: input.layout?.trackWeight,
    },
    children: [],
    parentId,
    path: [...path, input.id],
    pathNames: [...pathNames, input.name.trim()],
    depth,
    descendantCount: 0,
  };

  index.set(capability.id, capability);
  capability.children = (input.children ?? []).map((child) =>
    isFlushInput(child)
      ? normalizeFlush(child)
      : normalizeCapability(
          child,
          { color, icon },
          capability.id,
          capability.path,
          capability.pathNames,
          depth + 1,
          index,
        ),
  );
  capability.descendantCount = capability.children.reduce(
    (count, child) => count + (child.kind === 'capability' ? child.descendantCount + 1 : 0),
    0,
  );
  return capability;
}

function countCapabilities(items: NormalizedGroupItem[]): number {
  return items.reduce((count, item) => {
    if (item.kind === 'flush') return count;
    if (item.kind === 'group') return count + item.capabilityCount;
    return count + item.descendantCount + 1;
  }, 0);
}

function normalizeGroup(
  input: CapabilityGroupInput,
  defaultColor: string,
  groupLevel: 1 | 2,
  parentGroupId: string | undefined,
  capabilitiesById: Map<string, NormalizedCapability>,
  groupsById: Map<string, NormalizedCapabilityGroup>,
): NormalizedCapabilityGroup {
  const capabilities: NormalizedGroupItem[] = input.capabilities.map((item) => {
    if (isFlushInput(item)) return normalizeFlush(item);
    if (isGroupInput(item)) {
      return normalizeGroup(
        item,
        defaultColor,
        2,
        input.id,
        capabilitiesById,
        groupsById,
      );
    }
    return normalizeCapability(
      item,
      { color: defaultColor },
      undefined,
      [],
      [],
      0,
      capabilitiesById,
    );
  });
  const group: NormalizedCapabilityGroup = {
    kind: 'group',
    id: input.id,
    name: input.name.trim(),
    backgroundColor: input.visualization?.backgroundColor ?? DEFAULT_GROUP_COLOR,
    layout: {
      direction: input.layout?.direction ?? 'vertical',
      layerWeight: input.layout?.layerWeight,
      trackWeight: input.layout?.trackWeight,
    },
    capabilities,
    capabilityCount: countCapabilities(capabilities),
    groupLevel,
    parentGroupId,
  };
  groupsById.set(group.id, group);
  return group;
}

function capabilityRoots(items: NormalizedGroupItem[]): NormalizedCapability[] {
  return items.flatMap((item) => {
    if (item.kind === 'flush') return [];
    if (item.kind === 'group') return capabilityRoots(item.capabilities);
    return [item];
  });
}

function normalizeMap(input: CapabilityMapInput): NormalizedMap {
  const capabilitiesById = new Map<string, NormalizedCapability>();
  const groupsById = new Map<string, NormalizedCapabilityGroup>();
  const defaultColor = input.map.theme?.defaultColor ?? DEFAULT_COLOR;
  const rootItems: NormalizedGroupItem[] = input.map.capabilities.map((item) => {
    if (isFlushInput(item)) return normalizeFlush(item);
    if (isGroupInput(item)) {
      return normalizeGroup(item, defaultColor, 1, undefined, capabilitiesById, groupsById);
    }
    return normalizeCapability(item, { color: defaultColor }, undefined, [], [], 0, capabilitiesById);
  });

  return {
    id: input.map.id,
    name: input.map.name.trim(),
    description: input.map.description?.trim() || undefined,
    defaultColor,
    rootItems,
    capabilities: capabilityRoots(rootItems),
    capabilitiesById,
    groupsById,
    hierarchyById: buildHierarchyIndex(rootItems),
  };
}

type LayoutItem = CapabilityInput | CapabilityGroupInput;

function collectSemanticDiagnostics(
  input: CapabilityMapInput,
  document: Document,
  lineCounter: LineCounter,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const ids = new Map<string, PropertyKey[]>();

  const addError = (path: PropertyKey[], message: string) => {
    const location = locatePath(document, path);
    diagnostics.push(
      withLinePosition({ severity: 'error', message, path: formatPath(path), ...location }, lineCounter),
    );
  };

  const registerId = (id: string, idPath: PropertyKey[], label: string) => {
    const firstPath = ids.get(id);
    if (firstPath) {
      addError(idPath, `${label}-ID „${id}“ ist nicht eindeutig (erste Verwendung: ${formatPath(firstPath)}).`);
    } else {
      ids.set(id, idPath);
    }
  };

  const validateLayout = (item: LayoutItem, previous: GroupItemInput | CapabilityChildInput | undefined, path: PropertyKey[]) => {
    const direction = item.layout?.direction ?? 'vertical';
    if (item.layout?.layerWeight !== undefined && direction !== 'horizontal') {
      addError(
        [...path, 'layout', 'layerWeight'],
        'layerWeight ist nur für Elemente mit layout.direction: horizontal erlaubt.',
      );
    }
    if (item.layout?.trackWeight === undefined) return;
    const previousIsHorizontalElement =
      previous !== undefined &&
      !isFlushInput(previous) &&
      (previous.layout?.direction ?? 'vertical') === 'horizontal';
    if (direction === 'horizontal' && previousIsHorizontalElement) {
      addError(
        [...path, 'layout', 'trackWeight'],
        'trackWeight ist nur beim ersten fachlichen Element eines Tracks erlaubt. Füge bei Bedarf vorher einen horizontalen Flush ein.',
      );
    }
  };

  const validateFlushPositions = (
    items: Array<GroupItemInput | CapabilityChildInput>,
    basePath: PropertyKey[],
  ) => {
    items.forEach((item, index) => {
      if (!isFlushInput(item)) return;
      if (index === 0 || index === items.length - 1) {
        addError([...basePath, index], 'Ein Flush darf nicht am Anfang oder Ende einer Elementliste stehen.');
      } else {
        const previous = items[index - 1];
        if (!previous || !isFlushInput(previous)) return;
        addError([...basePath, index], 'Zwei Flushes dürfen nicht unmittelbar aufeinanderfolgen.');
      }
    });
  };

  const countGroupCapabilities = (items: GroupItemInput[]): number =>
    items.reduce((count, item) => {
      if (isFlushInput(item)) return count;
      if (isGroupInput(item)) return count + countGroupCapabilities(item.capabilities);
      return count + 1;
    }, 0);

  const visitCapability = (
    item: CapabilityInput,
    previous: CapabilityChildInput | GroupItemInput | undefined,
    path: PropertyKey[],
  ) => {
      registerId(item.id, [...path, 'id'], 'Die Capability');
      validateLayout(item, previous, path);
      const icon = item.visualization?.icon;
      if (icon && !hasCapabilityIcon(icon)) {
        addError(
          [...path, 'visualization', 'icon'],
          `Unbekanntes Lucide-Icon „${icon}“. Verwende einen offiziellen Lucide-Namen, zum Beispiel „Rocket“ oder „brain-circuit“.`,
        );
      }
      const childCapabilities = (item.children ?? []).filter((child) => !isFlushInput(child));
      if (item.visualization?.shape === 'chevron' && childCapabilities.length > 0) {
        addError(
          [...path, 'visualization', 'shape'],
          'Chevrons sind nur für Blatt-Capabilities erlaubt. Entferne die Children oder verwende shape: box.',
        );
      }
      if (item.children) visitCapabilities(item.children, [...path, 'children']);
  };

  const visitCapabilities = (items: CapabilityChildInput[], basePath: PropertyKey[]) => {
    validateFlushPositions(items, basePath);
    items.forEach((item, index) => {
      if (isFlushInput(item)) return;
      visitCapability(item, items[index - 1], [...basePath, index]);
    });
  };

  const visitGroupItems = (
    items: GroupItemInput[],
    basePath: PropertyKey[],
    groupLevel: 0 | 1 | 2,
  ) => {
    validateFlushPositions(items, basePath);
    items.forEach((item, index) => {
      if (isFlushInput(item)) return;
      const path = [...basePath, index];
      if (isGroupInput(item)) {
        validateLayout(item, items[index - 1], path);
        registerId(item.id, [...path, 'id'], 'Die Gruppen');
        if (groupLevel >= 2) {
          addError(
            [...path, 'type'],
            'Es sind höchstens zwei Gruppenebenen erlaubt. Eine Gruppe der zweiten Ebene darf keine weitere Gruppe enthalten.',
          );
        }
        if (countGroupCapabilities(item.capabilities) === 0) {
          addError([...path, 'capabilities'], 'Eine Gruppe muss mindestens eine Capability enthalten.');
        }
        visitGroupItems(item.capabilities, [...path, 'capabilities'], Math.min(groupLevel + 1, 2) as 1 | 2);
      } else {
        visitCapability(item, items[index - 1], path);
      }
    });
  };

  if (countGroupCapabilities(input.map.capabilities) === 0) {
    addError(
      ['map', 'capabilities'],
      'Die Map muss mindestens eine Capability direkt oder innerhalb einer Gruppe enthalten.',
    );
  }
  visitGroupItems(input.map.capabilities, ['map', 'capabilities'], 0);
  return diagnostics;
}

export function parseCapabilityDocument(source: string): DocumentResult {
  const lineCounter = new LineCounter();
  const document = parseDocument(source, { lineCounter, prettyErrors: false, uniqueKeys: true });

  if (document.errors.length > 0) {
    const diagnostics = document.errors.map((error) => {
      const from = error.pos[0] ?? 0;
      const to = Math.max(error.pos[1] ?? from + 1, from + 1);
      return withLinePosition(
        { severity: 'error' as const, message: error.message, path: '$', from, to },
        lineCounter,
      );
    });
    return { ok: false, diagnostics };
  }

  const rawValue = document.toJS({ maxAliasCount: 100 }) as unknown;
  const result = capabilityMapSchema.safeParse(rawValue);
  if (!result.success) {
    const diagnostics = result.error.issues.map((issue) => {
      const location = locatePath(document, issue.path);
      return withLinePosition(
        { severity: 'error' as const, message: issue.message, path: formatPath(issue.path), ...location },
        lineCounter,
      );
    });
    return { ok: false, diagnostics };
  }

  const semanticDiagnostics = collectSemanticDiagnostics(result.data, document, lineCounter);
  if (semanticDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { ok: false, diagnostics: semanticDiagnostics };
  }

  return { ok: true, value: normalizeMap(result.data), diagnostics: semanticDiagnostics };
}
