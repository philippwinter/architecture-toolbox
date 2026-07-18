import type {
  LayoutDirection,
  VisibleCapability,
  VisibleCapabilityGroup,
  VisibleGroupItem,
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
  chevronContinues: boolean;
}

export interface GroupLayoutNode {
  kind: 'group';
  item: VisibleCapabilityGroup;
  rect: LayoutRect;
  labelSize: number;
  collapsedTrackFill: boolean;
  parentId?: string;
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
  leafHeight?: number;
}

type VisibleElement = VisibleCapability | VisibleCapabilityGroup;
type ElementList = VisibleRootItem[] | VisibleGroupItem[];

interface IntrinsicSize {
  width: number;
  height: number;
}

export interface LayoutTrack {
  kind: 'vertical' | 'horizontal';
  items: VisibleElement[];
}

interface LayoutBand {
  tracks: LayoutTrack[];
}

const DEFAULTS: Required<LayoutOptions> = {
  width: 1600,
  height: 900,
  gap: 12,
  padding: 12,
  headerHeight: 48,
  minChildWidth: 1,
  minChildHeight: 1,
  groupHeaderHeight: 38,
  groupLabelWidth: 118,
  collapsedGroupSize: 22,
  leafHeight: 58,
};

const MIN_AUTO_WEIGHT = 0.5;
const MAX_AUTO_WEIGHT = 3;
const MIN_LEAF_WIDTH = 150;
const MAX_LEAF_WIDTH = 340;
const GROUP_LABEL_AVERAGE_CHARACTER_WIDTH = 6.4;
const GROUP_LABEL_PADDING = 20;

function directionOf(item: VisibleElement): LayoutDirection {
  return item.kind === 'group' ? item.group.layout.direction : item.capability.layout.direction;
}

function layerWeightOf(item: VisibleElement): number | undefined {
  return item.kind === 'group' ? item.group.layout.layerWeight : item.capability.layout.layerWeight;
}

function trackWeightOf(item: VisibleElement): number | undefined {
  return item.kind === 'group' ? item.group.layout.trackWeight : item.capability.layout.trackWeight;
}

function median(values: number[]): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 1) + (sorted[middle] ?? 1)) / 2
    : (sorted[middle] ?? 1);
}

function clampWeight(value: number): number {
  return Math.min(MAX_AUTO_WEIGHT, Math.max(MIN_AUTO_WEIGHT, value));
}

function splitIntoBands(items: ElementList): LayoutBand[] {
  const bands: LayoutBand[] = [];
  let currentTokens: VisibleRootItem[] = [];
  const finishBand = () => {
    if (currentTokens.length > 0) bands.push({ tracks: tokensIntoTracks(currentTokens) });
    currentTokens = [];
  };

  items.forEach((item) => {
    if (item.kind === 'flush' && item.direction === 'vertical') {
      finishBand();
    } else {
      currentTokens.push(item);
    }
  });
  finishBand();
  return bands;
}

function tokensIntoTracks(tokens: VisibleRootItem[]): LayoutTrack[] {
  const tracks: LayoutTrack[] = [];
  let horizontalBlock: VisibleElement[] = [];
  const finishHorizontalBlock = () => {
    if (horizontalBlock.length > 0) {
      tracks.push({ kind: 'horizontal', items: horizontalBlock });
      horizontalBlock = [];
    }
  };

  tokens.forEach((token) => {
    if (token.kind === 'flush') {
      finishHorizontalBlock();
      return;
    }
    if (directionOf(token) === 'vertical') {
      finishHorizontalBlock();
      tracks.push({ kind: 'vertical', items: [token] });
    } else {
      horizontalBlock.push(token);
    }
  });
  finishHorizontalBlock();
  return tracks;
}

export function groupIntoTracks(items: VisibleCapability[]): LayoutTrack[] {
  return tokensIntoTracks(items);
}

function fachChildren(item: VisibleCapability): VisibleCapability[] {
  return item.children.filter((child): child is VisibleCapability => child.kind === 'capability');
}

function countVisibleDescendants(item: VisibleCapability): number {
  return fachChildren(item).reduce((count, child) => count + 1 + countVisibleDescendants(child), 0);
}

function collapsedGroupIntrinsic(
  item: VisibleCapabilityGroup,
  config: Required<LayoutOptions>,
): IntrinsicSize {
  const nameWidth = Math.max(
    config.groupLabelWidth,
    GROUP_LABEL_PADDING + item.group.name.length * GROUP_LABEL_AVERAGE_CHARACTER_WIDTH,
  );
  return item.group.layout.direction === 'vertical'
    ? { width: config.collapsedGroupSize, height: nameWidth }
    : { width: nameWidth, height: config.collapsedGroupSize };
}

function intrinsicElement(
  item: VisibleElement,
  config: Required<LayoutOptions>,
  cache: Map<VisibleElement, IntrinsicSize>,
): IntrinsicSize {
  const cached = cache.get(item);
  if (cached) return cached;

  let size: IntrinsicSize;
  if (item.kind === 'group') {
    if (item.collapsed) {
      size = collapsedGroupIntrinsic(item, config);
    } else {
      const content = intrinsicList(item.capabilities, config, cache);
      const vertical = item.group.layout.direction === 'vertical';
      size = vertical
        ? {
            width: Math.max(config.groupLabelWidth, content.width + config.padding * 2),
            height: config.groupHeaderHeight + content.height + config.padding * 2,
          }
        : {
            width: config.groupHeaderHeight + content.width + config.padding * 2,
            height: Math.max(config.groupHeaderHeight, content.height + config.padding * 2),
          };
    }
  } else if (fachChildren(item).length === 0) {
    const textWidth = 68 + item.capability.name.length * 6.2;
    size = {
      width: Math.min(MAX_LEAF_WIDTH, Math.max(MIN_LEAF_WIDTH, textWidth)),
      height: config.leafHeight,
    };
  } else {
    const content = intrinsicList(item.children, config, cache);
    size = {
      width: Math.max(MIN_LEAF_WIDTH, content.width + config.padding * 2),
      height: config.headerHeight + content.height + config.padding * 2,
    };
  }
  cache.set(item, size);
  return size;
}

function intrinsicTrack(
  track: LayoutTrack,
  config: Required<LayoutOptions>,
  cache: Map<VisibleElement, IntrinsicSize>,
): IntrinsicSize {
  const sizes = track.items.map((item) => intrinsicElement(item, config, cache));
  if (track.kind === 'vertical') return sizes[0] ?? { width: 0, height: 0 };
  return {
    width: Math.max(0, ...sizes.map((size) => size.width)),
    height: sizes.reduce((sum, size) => sum + size.height, 0) + config.gap * Math.max(0, sizes.length - 1),
  };
}

function intrinsicBand(
  band: LayoutBand,
  config: Required<LayoutOptions>,
  cache: Map<VisibleElement, IntrinsicSize>,
): IntrinsicSize {
  const sizes = band.tracks.map((track) => intrinsicTrack(track, config, cache));
  return {
    width: sizes.reduce((sum, size) => sum + size.width, 0) + config.gap * Math.max(0, sizes.length - 1),
    height: Math.max(0, ...sizes.map((size) => size.height)),
  };
}

function intrinsicList(
  items: ElementList,
  config: Required<LayoutOptions>,
  cache: Map<VisibleElement, IntrinsicSize>,
): IntrinsicSize {
  const bands = splitIntoBands(items);
  const sizes = bands.map((band) => intrinsicBand(band, config, cache));
  return {
    width: Math.max(0, ...sizes.map((size) => size.width)),
    height: sizes.reduce((sum, size) => sum + size.height, 0) + config.gap * Math.max(0, sizes.length - 1),
  };
}

interface AllocationEntry {
  preferred: number;
  explicitWeight?: number;
  fixedSize?: number;
}

function allocateSizes(entries: AllocationEntry[], totalSize: number, gap: number): number[] {
  const usableSize = Math.max(0, totalSize - gap * Math.max(0, entries.length - 1));
  const fixedSize = entries.reduce((sum, entry) => sum + (entry.fixedSize ?? 0), 0);
  const flexibleSize = Math.max(0, usableSize - fixedSize);
  const automaticPreferred = entries
    .filter((entry) => entry.fixedSize === undefined && entry.explicitWeight === undefined)
    .map((entry) => Math.max(1, entry.preferred));
  const baseline = median(automaticPreferred);
  const weights = entries.map((entry) => {
    if (entry.fixedSize !== undefined) return 0;
    return entry.explicitWeight ?? clampWeight(Math.max(1, entry.preferred) / baseline);
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  return entries.map((entry, index) => {
    if (entry.fixedSize !== undefined) return entry.fixedSize;
    return totalWeight > 0 ? (flexibleSize * (weights[index] ?? 0)) / totalWeight : 0;
  });
}

function groupLabelSize(
  item: VisibleCapabilityGroup,
  rect: LayoutRect,
  config: Required<LayoutOptions>,
): number {
  if (item.collapsed) {
    return item.group.layout.direction === 'vertical' ? rect.height : rect.width;
  }
  if (item.group.layout.direction === 'horizontal') return config.groupHeaderHeight;
  const usableWidth = Math.max(GROUP_LABEL_AVERAGE_CHARACTER_WIDTH, rect.width - GROUP_LABEL_PADDING);
  const charactersPerLine = Math.max(1, Math.floor(usableWidth / GROUP_LABEL_AVERAGE_CHARACTER_WIDTH));
  const lines = Math.ceil(item.group.name.length / charactersPerLine);
  return Math.max(config.groupHeaderHeight, GROUP_LABEL_PADDING + lines * 14);
}

function fixedTrackWidth(
  track: LayoutTrack,
  config: Required<LayoutOptions>,
): number | undefined {
  if (!track.items.every((item) => item.kind === 'group' && item.collapsed)) return undefined;
  return config.collapsedGroupSize;
}

function fixedLayerHeight(item: VisibleElement, config: Required<LayoutOptions>): number | undefined {
  return item.kind === 'group' && item.collapsed && directionOf(item) === 'horizontal'
    ? config.collapsedGroupSize
    : undefined;
}

function layoutList(
  items: ElementList,
  bounds: LayoutRect,
  parentId: string | undefined,
  config: Required<LayoutOptions>,
  cache: Map<VisibleElement, IntrinsicSize>,
  result: RootLayoutNode[],
): void {
  if (bounds.width <= 0 || bounds.height <= 0) return;
  const bands = splitIntoBands(items);
  const bandSizes = bands.map((band) => intrinsicBand(band, config, cache));
  const bandHeights = allocateSizes(
    bandSizes.map((size) => ({ preferred: size.height, explicitWeight: Math.max(1, size.height) })),
    bounds.height,
    config.gap,
  );
  let bandY = bounds.y;

  bands.forEach((band, bandIndex) => {
    const bandHeight = bandHeights[bandIndex] ?? 0;
    const trackSizes = band.tracks.map((track) => intrinsicTrack(track, config, cache));
    const trackWidths = allocateSizes(
      band.tracks.map((track, trackIndex) => ({
        preferred: trackSizes[trackIndex]?.width ?? 1,
        explicitWeight: trackWeightOf(track.items[0] as VisibleElement),
        fixedSize: fixedTrackWidth(track, config),
      })),
      bounds.width,
      config.gap,
    );
    let trackX = bounds.x;

    band.tracks.forEach((track, trackIndex) => {
      const trackWidth = trackWidths[trackIndex] ?? 0;
      if (track.kind === 'vertical') {
        const item = track.items[0];
        if (item) {
          const nextTrack = band.tracks[trackIndex + 1];
          const nextItem = nextTrack?.kind === 'vertical' ? nextTrack.items[0] : undefined;
          const chevronContinues =
            item.kind === 'capability' &&
            item.capability.shape === 'chevron' &&
            nextItem?.kind === 'capability' &&
            nextItem.capability.shape === 'chevron';
          layoutElement(
            item,
            { x: trackX, y: bandY, width: trackWidth, height: bandHeight },
            parentId,
            chevronContinues,
            false,
            config,
            cache,
            result,
          );
        }
      } else {
        const collapsedTrackFill = track.items.every(
          (item) => item.kind === 'group' && item.collapsed,
        );
        const itemSizes = track.items.map((item) => intrinsicElement(item, config, cache));
        const itemHeights = allocateSizes(
          track.items.map((item, itemIndex) => ({
            preferred: itemSizes[itemIndex]?.height ?? 1,
            explicitWeight: layerWeightOf(item),
            fixedSize: collapsedTrackFill ? undefined : fixedLayerHeight(item, config),
          })),
          bandHeight,
          config.gap,
        );
        let itemY = bandY;
        track.items.forEach((item, itemIndex) => {
          const itemHeight = itemHeights[itemIndex] ?? 0;
          const next = track.items[itemIndex + 1];
          const chevronContinues =
            item.kind === 'capability' &&
            item.capability.shape === 'chevron' &&
            next?.kind === 'capability' &&
            next.capability.shape === 'chevron';
          layoutElement(
            item,
            { x: trackX, y: itemY, width: trackWidth, height: itemHeight },
            parentId,
            chevronContinues,
            collapsedTrackFill,
            config,
            cache,
            result,
          );
          itemY += itemHeight + config.gap;
        });
      }
      trackX += trackWidth + config.gap;
    });
    bandY += bandHeight + config.gap;
  });
}

function layoutElement(
  item: VisibleElement,
  slot: LayoutRect,
  parentId: string | undefined,
  chevronContinues: boolean,
  collapsedTrackFill: boolean,
  config: Required<LayoutOptions>,
  cache: Map<VisibleElement, IntrinsicSize>,
  result: RootLayoutNode[],
): void {
  if (item.kind === 'group') {
    const rect = item.collapsed
      ? {
          ...slot,
          width:
            item.group.layout.direction === 'vertical'
              ? Math.min(slot.width, config.collapsedGroupSize)
              : slot.width,
          height:
            item.group.layout.direction === 'horizontal'
              ? collapsedTrackFill
                ? slot.height
                : Math.min(slot.height, config.collapsedGroupSize)
              : slot.height,
        }
      : slot;
    const labelSize = groupLabelSize(item, rect, config);
    result.push({ kind: 'group', item, rect, labelSize, collapsedTrackFill, parentId });
    if (item.collapsed) return;
    const vertical = item.group.layout.direction === 'vertical';
    const contentBounds: LayoutRect = vertical
      ? {
          x: config.padding,
          y: labelSize + config.padding,
          width: rect.width - config.padding * 2,
          height: rect.height - labelSize - config.padding * 2,
        }
      : {
          x: labelSize + config.padding,
          y: config.padding,
          width: rect.width - labelSize - config.padding * 2,
          height: rect.height - config.padding * 2,
        };
    layoutList(item.capabilities, contentBounds, item.group.id, config, cache, result);
    return;
  }

  const children = fachChildren(item);
  const rect = slot;
  const childBounds = {
    x: config.padding,
    y: config.headerHeight + config.padding,
    width: rect.width - config.padding * 2,
    height: rect.height - config.headerHeight - config.padding * 2,
  };
  const canRenderChildren =
    item.children.length > 0 &&
    children.length > 0 &&
    childBounds.width >= config.minChildWidth &&
    childBounds.height >= config.minChildHeight;
  result.push({
    kind: 'capability',
    item,
    rect,
    parentId,
    renderedChildCount: canRenderChildren ? children.length : 0,
    hiddenDescendantCount: canRenderChildren ? 0 : countVisibleDescendants(item),
    chevronContinues,
  });
  if (canRenderChildren) {
    layoutList(item.children, childBounds, item.capability.id, config, cache, result);
  }
}

export function layoutCapabilityTree(
  roots: VisibleCapability[],
  options: LayoutOptions = {},
): CapabilityLayoutNode[] {
  return layoutRootItems(roots, options).filter(
    (node): node is CapabilityLayoutNode => node.kind === 'capability',
  );
}

export function layoutRootItems(
  roots: VisibleRootItem[],
  options: LayoutOptions = {},
): RootLayoutNode[] {
  const config = { ...DEFAULTS, ...options };
  const cache = new Map<VisibleElement, IntrinsicSize>();
  const intrinsic = intrinsicList(roots, config, cache);
  const bounds = {
    x: 0,
    y: 0,
    width: options.width ?? Math.max(config.width, intrinsic.width),
    height: options.height ?? Math.max(config.height, intrinsic.height),
  };
  const result: RootLayoutNode[] = [];
  layoutList(roots, bounds, undefined, config, cache, result);
  return result;
}
