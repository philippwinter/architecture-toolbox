import type {
  NormalizedCapability,
  NormalizedCapabilityChild,
  NormalizedCapabilityGroup,
  NormalizedGroupItem,
  NormalizedMap,
  VisibleCapability,
  VisibleCapabilityChild,
  VisibleCapabilityGroup,
  VisibleGroupItem,
  VisibleRootItem,
} from '../domain/types';
import type { ViewProfile } from '../domain/viewState';
import type { BuildExportSceneOptions } from './scene';

export type PptxExportMode = 'current' | 'full';

export type PptxExportRequest =
  | {
      mode: 'current';
      options: BuildExportSceneOptions;
      onProgress?: (current: number, total: number) => void;
    }
  | {
      mode: 'full';
      map: NormalizedMap;
      createdAt?: Date;
      onProgress?: (current: number, total: number) => void;
    };

export type PptxSlideKind = 'current' | 'overview' | 'level';
export type PptxSlideSeries =
  | 'current'
  | 'overview'
  | 'level-one'
  | 'top-group'
  | 'subgroup'
  | 'ungrouped';

export type PptxSlideFocus =
  | { kind: 'top-group'; topGroupId: string }
  | { kind: 'subgroup'; topGroupId: string; subgroupId: string }
  | {
      kind: 'capability';
      capabilityId: string;
      topGroupId?: string;
      subgroupId?: string;
    };

export interface PptxSlideDefinition {
  id: string;
  kind: PptxSlideKind;
  series: PptxSlideSeries;
  title: string;
  roots: VisibleRootItem[];
  level?: number;
  focus?: PptxSlideFocus;
  overviewGroupIds: string[];
  metadataParts: string[];
}

const PROFILE_LABELS: Record<ViewProfile, string> = {
  'level-1': 'Ebene 1',
  'level-2': 'Ebene 2',
  'level-3': 'Ebene 3',
  all: 'Vollständig',
  custom: 'Individuell',
};

function cleanFlushes<T extends { kind: string }>(items: T[]): T[] {
  return items.filter((item, index) => {
    if (item.kind !== 'flush') return true;
    if (index === 0 || index === items.length - 1) return false;
    return items[index - 1]?.kind !== 'flush' && items[index + 1]?.kind !== 'flush';
  });
}

function capabilityChildren(capability: NormalizedCapability): NormalizedCapability[] {
  return capability.children.filter(
    (child): child is NormalizedCapability => child.kind === 'capability',
  );
}

function visibleCapability(
  capability: NormalizedCapability,
  maximumVisibleLevel: number,
): VisibleCapability {
  const children = capabilityChildren(capability);
  const canExpand = capability.depth + 1 < maximumVisibleLevel;
  const visibleChildren = canExpand
    ? cleanFlushes(
        capability.children.map<VisibleCapabilityChild>((child: NormalizedCapabilityChild) =>
          child.kind === 'flush'
            ? { kind: 'flush', direction: child.direction }
            : visibleCapability(child, maximumVisibleLevel),
        ),
      )
    : [];

  return {
    kind: 'capability',
    capability,
    children: visibleChildren,
    contextOnly: false,
    searchMatch: false,
    collapsed: children.length > 0 && !canExpand,
    hiddenDescendantCount: children.length > 0 && !canExpand
      ? capability.descendantCount
      : 0,
  };
}

function visibleGroup(
  group: NormalizedCapabilityGroup,
  maximumVisibleLevel: number,
  collapsed = false,
): VisibleCapabilityGroup {
  const capabilities = collapsed
    ? []
    : cleanFlushes(
        group.capabilities.map<VisibleGroupItem>((item: NormalizedGroupItem) => {
          if (item.kind === 'flush') return { kind: 'flush', direction: item.direction };
          if (item.kind === 'group') return visibleGroup(item, maximumVisibleLevel);
          return visibleCapability(item, maximumVisibleLevel);
        }),
      );
  return {
    kind: 'group',
    group,
    capabilities,
    collapsed,
    autoCollapsed: false,
  };
}

function fullOverviewRoots(map: NormalizedMap): VisibleRootItem[] {
  return cleanFlushes(
    map.rootItems.map<VisibleRootItem>((item) => {
      if (item.kind === 'flush') return { kind: 'flush', direction: item.direction };
      if (item.kind === 'group') {
        return {
          kind: 'group',
          group: item,
          capabilities: [],
          collapsed: false,
          autoCollapsed: false,
        };
      }
      return visibleCapability(item, 1);
    }),
  );
}

function fullLevelOneRoots(map: NormalizedMap): VisibleRootItem[] {
  return cleanFlushes(
    map.rootItems.map<VisibleRootItem>((item) => {
      if (item.kind === 'flush') return { kind: 'flush', direction: item.direction };
      if (item.kind === 'group') return visibleGroup(item, 1);
      return visibleCapability(item, 1);
    }),
  );
}

function groupedDetailRoots(
  map: NormalizedMap,
  topGroupId: string,
  level: number,
): VisibleRootItem[] {
  return cleanFlushes(
    map.rootItems.flatMap<VisibleRootItem>((item) => {
      if (item.kind === 'flush') return [{ kind: 'flush', direction: item.direction }];
      if (item.kind !== 'group') return [];
      return [visibleGroup(item, level, item.id !== topGroupId)];
    }),
  );
}

function collapsedCapability(capability: NormalizedCapability): VisibleCapability {
  const children = capabilityChildren(capability);
  return {
    kind: 'capability',
    capability,
    children: [],
    contextOnly: false,
    searchMatch: false,
    collapsed: children.length > 0,
    hiddenDescendantCount: children.length > 0 ? capability.descendantCount : 0,
  };
}

function focusedCapability(
  capability: NormalizedCapability,
  focus: NormalizedCapability,
): VisibleCapability {
  if (!focus.path.includes(capability.id)) return collapsedCapability(capability);

  const children = cleanFlushes(
    capability.children.map<VisibleCapabilityChild>((child) => {
      if (child.kind === 'flush') return { kind: 'flush', direction: child.direction };
      return capability.id === focus.id
        ? collapsedCapability(child)
        : focusedCapability(child, focus);
    }),
  );
  return {
    kind: 'capability',
    capability,
    children,
    contextOnly: false,
    searchMatch: false,
    collapsed: false,
    hiddenDescendantCount: 0,
  };
}

interface CapabilitySlideContext {
  capability: NormalizedCapability;
  topGroup?: NormalizedCapabilityGroup;
  subgroup?: NormalizedCapabilityGroup;
}

function capabilitySlideContexts(map: NormalizedMap): CapabilitySlideContext[] {
  const contexts: CapabilitySlideContext[] = [];
  const visitCapability = (
    capability: NormalizedCapability,
    topGroup?: NormalizedCapabilityGroup,
    subgroup?: NormalizedCapabilityGroup,
  ) => {
    if (capabilityChildren(capability).length > 0) {
      contexts.push({ capability, topGroup, subgroup });
    }
    capabilityChildren(capability).forEach((child) => {
      visitCapability(child, topGroup, subgroup);
    });
  };
  const visitTopGroup = (topGroup: NormalizedCapabilityGroup) => {
    topGroup.capabilities.forEach((item) => {
      if (item.kind === 'capability') visitCapability(item, topGroup);
      if (item.kind === 'group') {
        item.capabilities.forEach((subItem) => {
          if (subItem.kind === 'capability') visitCapability(subItem, topGroup, item);
        });
      }
    });
  };

  map.rootItems.forEach((item) => {
    if (item.kind === 'group') visitTopGroup(item);
  });
  map.rootItems.forEach((item) => {
    if (item.kind === 'capability') visitCapability(item);
  });
  return contexts;
}

function capabilityDetailRoots(
  map: NormalizedMap,
  context: CapabilitySlideContext,
): VisibleRootItem[] {
  const { capability: focus, topGroup, subgroup } = context;
  return cleanFlushes(
    map.rootItems.flatMap<VisibleRootItem>((item) => {
      if (item.kind === 'flush') return [{ kind: 'flush', direction: item.direction }];
      if (item.kind === 'capability') {
        if (topGroup) return [];
        return [focus.path.includes(item.id)
          ? focusedCapability(item, focus)
          : collapsedCapability(item)];
      }
      if (!topGroup || item.id !== topGroup.id) return [visibleGroup(item, 1, true)];

      const capabilities = cleanFlushes(item.capabilities.flatMap<VisibleGroupItem>((child) => {
        if (child.kind === 'flush') return [{ kind: 'flush', direction: child.direction }];
        if (child.kind === 'group') {
          if (!subgroup || child.id !== subgroup.id) return [visibleGroup(child, 1, true)];
          return [{
            kind: 'group',
            group: child,
            capabilities: cleanFlushes(child.capabilities.map<VisibleGroupItem>((subItem) => {
              if (subItem.kind === 'flush') {
                return { kind: 'flush', direction: subItem.direction };
              }
              if (subItem.kind === 'group') return visibleGroup(subItem, 1, true);
              return focus.path.includes(subItem.id)
                ? focusedCapability(subItem, focus)
                : collapsedCapability(subItem);
            })),
            collapsed: false,
            autoCollapsed: false,
          }];
        }
        if (subgroup) return [];
        return [focus.path.includes(child.id)
          ? focusedCapability(child, focus)
          : collapsedCapability(child)];
      }));
      return [{
        kind: 'group',
        group: item,
        capabilities,
        collapsed: false,
        autoCollapsed: false,
      }];
    }),
  );
}

export function buildCurrentPptxSlides(options: BuildExportSceneOptions): PptxSlideDefinition[] {
  return [{
    id: 'current',
    kind: 'current',
    series: 'current',
    title: `${options.map.name} - ${PROFILE_LABELS[options.profile]}`,
    roots: options.roots,
    overviewGroupIds: [],
    metadataParts: [`Ansicht: ${PROFILE_LABELS[options.profile]}`],
  }];
}

export function buildFullPptxSlides(map: NormalizedMap): PptxSlideDefinition[] {
  const topGroups = map.rootItems.filter(
    (item): item is NormalizedCapabilityGroup => item.kind === 'group',
  );
  const overviewGroupIds = topGroups.map((group) => group.id);
  const slides: PptxSlideDefinition[] = [
    {
      id: 'overview',
      kind: 'overview',
      series: 'overview',
      title: `${map.name} - Übersicht`,
      roots: fullOverviewRoots(map),
      overviewGroupIds,
      metadataParts: [],
    },
    {
      id: 'level-1',
      kind: 'level',
      series: 'level-one',
      title: `${map.name} - Ebene 1`,
      roots: fullLevelOneRoots(map),
      level: 1,
      overviewGroupIds: [],
      metadataParts: [],
    },
  ];

  topGroups.forEach((group) => {
    slides.push({
      id: `${group.id}-level-1`,
      kind: 'level',
      series: 'top-group',
      title: `${map.name} - Ebene 1 - ${group.name}`,
      roots: groupedDetailRoots(map, group.id, 1),
      level: 1,
      focus: { kind: 'top-group', topGroupId: group.id },
      overviewGroupIds: [],
      metadataParts: [],
    });
  });

  capabilitySlideContexts(map).forEach((context) => {
    const { capability, topGroup, subgroup } = context;
    const level = capability.depth + 2;
    const titleParts = [
      map.name,
      `Ebene ${level}`,
      topGroup?.name ?? 'Weitere Capabilities',
      subgroup?.name,
    ].filter((part): part is string => Boolean(part));
    slides.push({
      id: [topGroup?.id, subgroup?.id, capability.id, `level-${level}`]
        .filter(Boolean)
        .join('-'),
      kind: 'level',
      series: subgroup ? 'subgroup' : topGroup ? 'top-group' : 'ungrouped',
      title: titleParts.join(' - '),
      roots: capabilityDetailRoots(map, context),
      level,
      focus: {
        kind: 'capability',
        capabilityId: capability.id,
        ...(topGroup ? { topGroupId: topGroup.id } : {}),
        ...(subgroup ? { subgroupId: subgroup.id } : {}),
      },
      overviewGroupIds: [],
      metadataParts: [`Fokus: ${capability.pathNames.join(' › ')}`],
    });
  });

  return slides;
}
