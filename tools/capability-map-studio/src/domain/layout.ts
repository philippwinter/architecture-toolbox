import type {
  LayoutDirection,
  VisibleCapability,
  VisibleCapabilityGroup,
  VisibleGroupItem,
  VisibleRootItem,
} from './types';
import {
  capabilityShapeTokens,
  isRenderedChevron,
  preferredShapeHorizontalOverhead,
} from './shapes';

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
  labelSize: number;
  collapsedTrackFill: boolean;
  collapsedBandFill: boolean;
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
  breakBefore?: boolean;
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
  let horizontalBlockBreakBefore = false;
  let breakBeforeNextTrack = false;
  const finishHorizontalBlock = () => {
    if (horizontalBlock.length > 0) {
      tracks.push({
        kind: 'horizontal',
        items: horizontalBlock,
        breakBefore: horizontalBlockBreakBefore,
      });
      horizontalBlock = [];
      horizontalBlockBreakBefore = false;
    }
  };

  tokens.forEach((token) => {
    if (token.kind === 'flush') {
      finishHorizontalBlock();
      breakBeforeNextTrack = true;
      return;
    }
    if (directionOf(token) === 'vertical') {
      finishHorizontalBlock();
      tracks.push({ kind: 'vertical', items: [token], breakBefore: breakBeforeNextTrack });
      breakBeforeNextTrack = false;
    } else {
      if (horizontalBlock.length === 0) {
        horizontalBlockBreakBefore = breakBeforeNextTrack;
        breakBeforeNextTrack = false;
      }
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

function collapsedGroupNameDemand(
  item: VisibleCapabilityGroup,
  config: Required<LayoutOptions>,
): number {
  return Math.max(
    config.groupLabelWidth,
    GROUP_LABEL_PADDING + item.group.name.length * GROUP_LABEL_AVERAGE_CHARACTER_WIDTH,
  );
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
    const textWidth =
      68 +
      item.capability.name.length * 6.2 +
      preferredShapeHorizontalOverhead(
        item.capability.shape,
        item.capability.layout.direction,
      );
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
  const gaps = trackGaps(band.tracks, config.gap);
  return {
    width: sizes.reduce((sum, size) => sum + size.width, 0) + gaps.reduce((sum, gap) => sum + gap, 0),
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

function allocateSizes(
  entries: AllocationEntry[],
  totalSize: number,
  gapOrGaps: number | number[],
): number[] {
  const totalGap = Array.isArray(gapOrGaps)
    ? gapOrGaps.reduce((sum, gap) => sum + gap, 0)
    : gapOrGaps * Math.max(0, entries.length - 1);
  const usableSize = Math.max(0, totalSize - totalGap);
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

function isChevronTrack(track: LayoutTrack): boolean {
  const item = track.kind === 'vertical' ? track.items[0] : undefined;
  return Boolean(
    item?.kind === 'capability' &&
      isRenderedChevron(item.capability.shape, item.capability.layout.direction),
  );
}

function trackGaps(tracks: LayoutTrack[], defaultGap: number): number[] {
  return tracks.slice(0, -1).map((track, index) => {
    const next = tracks[index + 1];
    return next && !next.breakBefore && isChevronTrack(track) && isChevronTrack(next)
      ? capabilityShapeTokens.chevronSegmentGap
      : defaultGap;
  });
}

function isCollapsedVerticalGroupBand(band: LayoutBand): boolean {
  return band.tracks.length > 0 && band.tracks.every((track) => {
    const item = track.kind === 'vertical' ? track.items[0] : undefined;
    return item?.kind === 'group' && item.collapsed && directionOf(item) === 'vertical';
  });
}

function collapsedVerticalBandHeight(
  band: LayoutBand,
  availableWidth: number,
  config: Required<LayoutOptions>,
): number {
  const gaps = trackGaps(band.tracks, config.gap);
  const usableWidth = Math.max(
    1,
    availableWidth - gaps.reduce((sum, gap) => sum + gap, 0),
  );
  const totalNameDemand = band.tracks.reduce((sum, track) => {
    const item = track.items[0];
    return sum + (
      item?.kind === 'group' ? collapsedGroupNameDemand(item, config) : 0
    );
  }, 0);
  const lineCount = Math.max(1, Math.ceil(totalNameDemand / usableWidth));
  return config.collapsedGroupSize + (lineCount - 1) * 14;
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
  const collapsedVerticalBands = bands.map(isCollapsedVerticalGroupBand);
  const bandHeights = allocateSizes(
    bandSizes.map((size, index) => ({
      preferred: size.height,
      explicitWeight: collapsedVerticalBands[index] ? undefined : Math.max(1, size.height),
      fixedSize: collapsedVerticalBands[index]
        ? collapsedVerticalBandHeight(bands[index] as LayoutBand, bounds.width, config)
        : undefined,
    })),
    bounds.height,
    config.gap,
  );
  let bandY = bounds.y;

  bands.forEach((band, bandIndex) => {
    const bandHeight = bandHeights[bandIndex] ?? 0;
    const trackSizes = band.tracks.map((track) => intrinsicTrack(track, config, cache));
    const gaps = trackGaps(band.tracks, config.gap);
    const collapsedBandFill = collapsedVerticalBands[bandIndex] ?? false;
    const trackWidths = allocateSizes(
      band.tracks.map((track, trackIndex) => ({
        preferred: collapsedBandFill
          ? collapsedGroupNameDemand(
              track.items[0] as VisibleCapabilityGroup,
              config,
            )
          : trackSizes[trackIndex]?.width ?? 1,
        explicitWeight: collapsedBandFill
          ? undefined
          : trackWeightOf(track.items[0] as VisibleElement),
        fixedSize: collapsedBandFill ? undefined : fixedTrackWidth(track, config),
      })),
      bounds.width,
      gaps,
    );
    let trackX = bounds.x;

    band.tracks.forEach((track, trackIndex) => {
      const trackWidth = trackWidths[trackIndex] ?? 0;
      if (track.kind === 'vertical') {
        const item = track.items[0];
        if (item) {
          layoutElement(
            item,
            { x: trackX, y: bandY, width: trackWidth, height: bandHeight },
            parentId,
            false,
            collapsedBandFill,
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
            preferred: collapsedTrackFill && item.kind === 'group'
              ? collapsedGroupNameDemand(item, config)
              : itemSizes[itemIndex]?.height ?? 1,
            explicitWeight: collapsedTrackFill ? undefined : layerWeightOf(item),
            fixedSize: collapsedTrackFill ? undefined : fixedLayerHeight(item, config),
          })),
          bandHeight,
          config.gap,
        );
        let itemY = bandY;
        track.items.forEach((item, itemIndex) => {
          const itemHeight = itemHeights[itemIndex] ?? 0;
          layoutElement(
            item,
            { x: trackX, y: itemY, width: trackWidth, height: itemHeight },
            parentId,
            collapsedTrackFill,
            false,
            config,
            cache,
            result,
          );
          itemY += itemHeight + config.gap;
        });
      }
      trackX += trackWidth + (gaps[trackIndex] ?? 0);
    });
    bandY += bandHeight + config.gap;
  });
}

function layoutElement(
  item: VisibleElement,
  slot: LayoutRect,
  parentId: string | undefined,
  collapsedTrackFill: boolean,
  collapsedBandFill: boolean,
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
              ? collapsedBandFill
                ? slot.width
                : Math.min(slot.width, config.collapsedGroupSize)
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
    result.push({
      kind: 'group',
      item,
      rect,
      labelSize,
      collapsedTrackFill,
      collapsedBandFill,
      parentId,
    });
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
    hiddenDescendantCount: canRenderChildren
      ? 0
      : item.hiddenDescendantCount ?? countVisibleDescendants(item),
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
