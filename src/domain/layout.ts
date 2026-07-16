import type {
  VisibleCapability,
  VisibleCapabilityGroup,
  VisibleRootItem,
} from './types';

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CapabilityLayoutNode {
  kind: 'capability';
  item: VisibleCapability;
  rect: LayoutRect;
  parentId?: string;
  renderedChildCount: number;
  hiddenDescendantCount: number;
}

export interface GroupLayoutNode {
  kind: 'group';
  item: VisibleCapabilityGroup;
  rect: LayoutRect;
}

export type RootLayoutNode = CapabilityLayoutNode | GroupLayoutNode;

export interface LayoutOptions {
  width?: number;
  height?: number;
  gap?: number;
  padding?: number;
  headerHeight?: number;
  minChildWidth?: number;
  minChildHeight?: number;
  groupHeaderHeight?: number;
  groupLabelWidth?: number;
  collapsedGroupSize?: number;
}

type CapabilityTrack =
  | { kind: 'vertical'; items: [VisibleCapability]; weight: number }
  | { kind: 'horizontal'; items: VisibleCapability[]; weight: number };

type RootTrack =
  | { kind: 'vertical'; items: [VisibleRootItem]; weight: number; fixedSize?: number }
  | { kind: 'horizontal'; items: VisibleRootItem[]; weight: number };

const DEFAULTS: Required<LayoutOptions> = {
  width: 1600,
  height: 900,
  gap: 12,
  padding: 12,
  headerHeight: 48,
  minChildWidth: 120,
  minChildHeight: 72,
  groupHeaderHeight: 38,
  groupLabelWidth: 118,
  collapsedGroupSize: 22,
};

function directionOf(item: VisibleRootItem) {
  return item.kind === 'group'
    ? item.group.layout.direction
    : item.capability.layout.direction;
}

function weightOf(item: VisibleRootItem) {
  return item.kind === 'group' ? item.group.layout.weight : item.capability.layout.weight;
}

function trackWeightOf(item: VisibleRootItem) {
  return item.kind === 'group'
    ? item.group.layout.trackWeight
    : item.capability.layout.trackWeight;
}

export function groupIntoTracks(items: VisibleCapability[]): CapabilityTrack[] {
  const tracks: CapabilityTrack[] = [];
  let index = 0;
  while (index < items.length) {
    const item = items[index];
    if (!item) break;
    if (item.capability.layout.direction === 'vertical') {
      tracks.push({ kind: 'vertical', items: [item], weight: item.capability.layout.weight });
      index += 1;
      continue;
    }

    const block: VisibleCapability[] = [];
    while (items[index]?.capability.layout.direction === 'horizontal') {
      block.push(items[index] as VisibleCapability);
      index += 1;
    }
    tracks.push({
      kind: 'horizontal',
      items: block,
      weight: block[0]?.capability.layout.trackWeight ?? 1,
    });
  }
  return tracks;
}

function groupRootItemsIntoTracks(
  items: VisibleRootItem[],
  collapsedGroupSize: number,
): RootTrack[] {
  const tracks: RootTrack[] = [];
  let index = 0;
  while (index < items.length) {
    const item = items[index];
    if (!item) break;
    if (directionOf(item) === 'vertical') {
      tracks.push({
        kind: 'vertical',
        items: [item],
        weight: weightOf(item),
        fixedSize: item.kind === 'group' && item.collapsed ? collapsedGroupSize : undefined,
      });
      index += 1;
      continue;
    }

    const block: VisibleRootItem[] = [];
    while (items[index] && directionOf(items[index] as VisibleRootItem) === 'horizontal') {
      block.push(items[index] as VisibleRootItem);
      index += 1;
    }
    tracks.push({
      kind: 'horizontal',
      items: block,
      weight: trackWeightOf(block[0] as VisibleRootItem) ?? 1,
    });
  }
  return tracks;
}

function countVisibleDescendants(item: VisibleCapability): number {
  return item.children.reduce((count, child) => count + 1 + countVisibleDescendants(child), 0);
}

function allocateSizes(
  entries: Array<{ weight: number; fixedSize?: number }>,
  totalSize: number,
  gap: number,
): number[] {
  const usableSize = Math.max(0, totalSize - gap * Math.max(0, entries.length - 1));
  const fixedSize = entries.reduce((sum, entry) => sum + (entry.fixedSize ?? 0), 0);
  const flexibleSize = Math.max(0, usableSize - fixedSize);
  const totalWeight = entries.reduce(
    (sum, entry) => sum + (entry.fixedSize === undefined ? entry.weight : 0),
    0,
  );

  return entries.map((entry) => {
    if (entry.fixedSize !== undefined) return entry.fixedSize;
    return totalWeight > 0 ? (flexibleSize * entry.weight) / totalWeight : 0;
  });
}

function layoutCapabilities(
  items: VisibleCapability[],
  bounds: LayoutRect,
  parentId: string | undefined,
  config: Required<LayoutOptions>,
  result: CapabilityLayoutNode[],
): void {
  if (items.length === 0 || bounds.width <= 0 || bounds.height <= 0) return;
  const tracks = groupIntoTracks(items);
  const trackSizes = allocateSizes(tracks, bounds.width, config.gap);
  let trackX = bounds.x;

  tracks.forEach((track, trackIndex) => {
    const trackWidth = trackSizes[trackIndex] ?? 0;
    if (track.kind === 'vertical') {
      layoutCapability(
        track.items[0],
        { x: trackX, y: bounds.y, width: trackWidth, height: bounds.height },
        parentId,
        config,
        result,
      );
    } else {
      const itemSizes = allocateSizes(
        track.items.map((item) => ({ weight: item.capability.layout.weight })),
        bounds.height,
        config.gap,
      );
      let itemY = bounds.y;
      track.items.forEach((item, itemIndex) => {
        const itemHeight = itemSizes[itemIndex] ?? 0;
        layoutCapability(
          item,
          { x: trackX, y: itemY, width: trackWidth, height: itemHeight },
          parentId,
          config,
          result,
        );
        itemY += itemHeight + config.gap;
      });
    }
    trackX += trackWidth + config.gap;
  });
}

function layoutCapability(
  item: VisibleCapability,
  rect: LayoutRect,
  parentId: string | undefined,
  config: Required<LayoutOptions>,
  result: CapabilityLayoutNode[],
): void {
  const childBounds = {
    x: config.padding,
    y: config.headerHeight + config.padding,
    width: rect.width - config.padding * 2,
    height: rect.height - config.headerHeight - config.padding * 2,
  };
  const canRenderChildren =
    item.children.length > 0 &&
    childBounds.width >= config.minChildWidth &&
    childBounds.height >= config.minChildHeight;
  result.push({
    kind: 'capability',
    item,
    rect,
    parentId,
    renderedChildCount: canRenderChildren ? item.children.length : 0,
    hiddenDescendantCount: canRenderChildren ? 0 : countVisibleDescendants(item),
  });
  if (canRenderChildren) {
    layoutCapabilities(item.children, childBounds, item.capability.id, config, result);
  }
}

export function layoutCapabilityTree(
  roots: VisibleCapability[],
  options: LayoutOptions = {},
): CapabilityLayoutNode[] {
  const config = { ...DEFAULTS, ...options };
  const result: CapabilityLayoutNode[] = [];
  layoutCapabilities(
    roots,
    { x: 0, y: 0, width: config.width, height: config.height },
    undefined,
    config,
    result,
  );
  return result;
}

export function layoutRootItems(
  roots: VisibleRootItem[],
  options: LayoutOptions = {},
): RootLayoutNode[] {
  const config = { ...DEFAULTS, ...options };
  const result: RootLayoutNode[] = [];
  const bounds = { x: 0, y: 0, width: config.width, height: config.height };
  const tracks = groupRootItemsIntoTracks(roots, config.collapsedGroupSize);
  const trackSizes = allocateSizes(tracks, bounds.width, config.gap);
  let trackX = bounds.x;

  const layoutRootItem = (item: VisibleRootItem, rect: LayoutRect) => {
    if (item.kind === 'capability') {
      const capabilityNodes: CapabilityLayoutNode[] = [];
      layoutCapability(item, rect, undefined, config, capabilityNodes);
      result.push(...capabilityNodes);
      return;
    }

    result.push({ kind: 'group', item, rect });
    if (item.collapsed) return;
    const vertical = item.group.layout.direction === 'vertical';
    const contentBounds: LayoutRect = vertical
      ? {
          x: config.padding,
          y: config.groupHeaderHeight + config.padding,
          width: rect.width - config.padding * 2,
          height: rect.height - config.groupHeaderHeight - config.padding * 2,
        }
      : {
          x: config.groupLabelWidth,
          y: config.padding,
          width: rect.width - config.groupLabelWidth - config.padding,
          height: rect.height - config.padding * 2,
        };
    const capabilityNodes: CapabilityLayoutNode[] = [];
    layoutCapabilities(
      item.capabilities,
      contentBounds,
      item.group.id,
      config,
      capabilityNodes,
    );
    result.push(...capabilityNodes);
  };

  tracks.forEach((track, trackIndex) => {
    const trackWidth = trackSizes[trackIndex] ?? 0;
    if (track.kind === 'vertical') {
      layoutRootItem(track.items[0], {
        x: trackX,
        y: bounds.y,
        width: trackWidth,
        height: bounds.height,
      });
    } else {
      const itemSizes = allocateSizes(
        track.items.map((item) => ({
          weight: weightOf(item),
          fixedSize:
            item.kind === 'group' && item.collapsed ? config.collapsedGroupSize : undefined,
        })),
        bounds.height,
        config.gap,
      );
      let itemY = bounds.y;
      track.items.forEach((item, itemIndex) => {
        const itemHeight = itemSizes[itemIndex] ?? 0;
        layoutRootItem(item, {
          x: trackX,
          y: itemY,
          width: trackWidth,
          height: itemHeight,
        });
        itemY += itemHeight + config.gap;
      });
    }
    trackX += trackWidth + config.gap;
  });

  return result;
}
