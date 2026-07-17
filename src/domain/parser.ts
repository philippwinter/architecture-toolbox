import { isNode, LineCounter, parseDocument, type Document, type Node } from 'yaml';
import { hasCapabilityIcon } from './icons';
import { capabilityMapSchema } from './schema';
import type {
  CapabilityGroupInput,
  CapabilityInput,
  CapabilityMapInput,
  Diagnostic,
  DocumentResult,
  NormalizedCapability,
  NormalizedCapabilityGroup,
  NormalizedMap,
  RootItemInput,
} from './types';

export const DEFAULT_COLOR = '#DCE8F5';
export const DEFAULT_GROUP_COLOR = '#EDF1F5';

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

function locatePath(
  document: Document,
  rawPath: PropertyKey[],
): { from: number; to: number } {
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
    layout: {
      direction: input.layout?.direction ?? 'vertical',
      weight: input.layout?.weight ?? 1,
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
    normalizeCapability(
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
    (count, child) => count + child.descendantCount + 1,
    0,
  );
  return capability;
}

function normalizeMap(input: CapabilityMapInput): NormalizedMap {
  const capabilitiesById = new Map<string, NormalizedCapability>();
  const groupsById = new Map<string, NormalizedCapabilityGroup>();
  const defaultColor = input.map.theme?.defaultColor ?? DEFAULT_COLOR;
  const rootItems = input.map.capabilities.map((item) => {
    if (!isGroupInput(item)) {
      return normalizeCapability(
        item,
        { color: defaultColor },
        undefined,
        [],
        [],
        0,
        capabilitiesById,
      );
    }

    const capabilities = item.capabilities.map((capability) =>
      normalizeCapability(
        capability,
        { color: defaultColor },
        undefined,
        [],
        [],
        0,
        capabilitiesById,
      ),
    );
    const group: NormalizedCapabilityGroup = {
      kind: 'group',
      id: item.id,
      name: item.name.trim(),
      backgroundColor: item.visualization?.backgroundColor ?? DEFAULT_GROUP_COLOR,
      layout: {
        direction: item.layout?.direction ?? 'vertical',
        weight: item.layout?.weight ?? 1,
        trackWeight: item.layout?.trackWeight,
      },
      capabilities,
      capabilityCount: capabilities.reduce(
        (count, capability) => count + capability.descendantCount + 1,
        0,
      ),
    };
    groupsById.set(group.id, group);
    return group;
  });
  const capabilities = rootItems.flatMap((item) =>
    item.kind === 'group' ? item.capabilities : [item],
  );

  return {
    id: input.map.id,
    name: input.map.name.trim(),
    description: input.map.description?.trim() || undefined,
    defaultColor,
    rootItems,
    capabilities,
    capabilitiesById,
    groupsById,
  };
}

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
      withLinePosition(
        { severity: 'error', message, path: formatPath(path), ...location },
        lineCounter,
      ),
    );
  };

  const registerId = (id: string, idPath: PropertyKey[], label: string) => {
    const firstPath = ids.get(id);
    if (firstPath) {
      addError(
        idPath,
        `${label}-ID „${id}“ ist nicht eindeutig (erste Verwendung: ${formatPath(firstPath)}).`,
      );
    } else {
      ids.set(id, idPath);
    }
  };

  const validateTrackWeight = (
    item: { layout?: { direction?: 'horizontal' | 'vertical'; trackWeight?: number } },
    previous:
      | { layout?: { direction?: 'horizontal' | 'vertical'; trackWeight?: number } }
      | undefined,
    path: PropertyKey[],
  ) => {
    if (item.layout?.trackWeight === undefined) return;
    const direction = item.layout.direction ?? 'vertical';
    const previousDirection = previous?.layout?.direction ?? 'vertical';
    if (direction !== 'horizontal' || previousDirection === 'horizontal') {
      addError(
        [...path, 'layout', 'trackWeight'],
        'trackWeight ist nur beim ersten Element eines horizontalen Blocks erlaubt.',
      );
    }
  };

  const visitSiblings = (capabilities: CapabilityInput[], basePath: PropertyKey[]) => {
    capabilities.forEach((capability, index) => {
      const path = [...basePath, index];
      const idPath = [...path, 'id'];
      registerId(capability.id, idPath, 'Die Capability');

      const icon = capability.visualization?.icon;
      if (icon && !hasCapabilityIcon(icon)) {
        addError(
          [...path, 'visualization', 'icon'],
          `Unbekanntes Lucide-Icon „${icon}“. Verwende einen offiziellen Lucide-Namen, zum Beispiel „Rocket“ oder „brain-circuit“.`,
        );
      }

      validateTrackWeight(capability, capabilities[index - 1], path);

      if (capability.children) visitSiblings(capability.children, [...path, 'children']);
    });
  };

  input.map.capabilities.forEach((item, index) => {
    const path: PropertyKey[] = ['map', 'capabilities', index];
    validateTrackWeight(item, input.map.capabilities[index - 1], path);
    if (isGroupInput(item)) {
      registerId(item.id, [...path, 'id'], 'Die Gruppen');
      visitSiblings(item.capabilities, [...path, 'capabilities']);
    } else {
      registerId(item.id, [...path, 'id'], 'Die Capability');
      const icon = item.visualization?.icon;
      if (icon && !hasCapabilityIcon(icon)) {
        addError(
          [...path, 'visualization', 'icon'],
          `Unbekanntes Lucide-Icon „${icon}“. Verwende einen offiziellen Lucide-Namen, zum Beispiel „Rocket“ oder „brain-circuit“.`,
        );
      }
      if (item.children) visitSiblings(item.children, [...path, 'children']);
    }
  });
  return diagnostics;
}

export function parseCapabilityDocument(source: string): DocumentResult {
  const lineCounter = new LineCounter();
  const document = parseDocument(source, {
    lineCounter,
    prettyErrors: false,
    uniqueKeys: true,
  });

  if (document.errors.length > 0) {
    const diagnostics = document.errors.map((error) => {
      const from = error.pos[0] ?? 0;
      const to = Math.max(error.pos[1] ?? from + 1, from + 1);
      return withLinePosition(
        {
          severity: 'error' as const,
          message: error.message,
          path: '$',
          from,
          to,
        },
        lineCounter,
      );
    });
    return { ok: false, diagnostics };
  }

  const rawValue = document.toJS({ maxAliasCount: 100 }) as unknown;
  const result = capabilityMapSchema.safeParse(rawValue);
  if (!result.success) {
    const diagnostics = result.error.issues.map((issue) => {
      const path = issue.path;
      const location = locatePath(document, path);
      return withLinePosition(
        {
          severity: 'error' as const,
          message: issue.message,
          path: formatPath(path),
          ...location,
        },
        lineCounter,
      );
    });
    return { ok: false, diagnostics };
  }

  const semanticDiagnostics = collectSemanticDiagnostics(result.data, document, lineCounter);
  if (semanticDiagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return { ok: false, diagnostics: semanticDiagnostics };
  }

  return {
    ok: true,
    value: normalizeMap(result.data),
    diagnostics: semanticDiagnostics,
  };
}
