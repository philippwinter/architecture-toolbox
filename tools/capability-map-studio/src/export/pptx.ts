import type { IconNode } from 'lucide-react';
import PptxGenJS from 'pptxgenjs';
import { capabilityPresentationTokens } from '../domain/presentation';
import {
  capabilityShapeTokens,
  isRenderedChevron,
  resolveCapabilityShapeLegend,
} from '../domain/shapes';
import type { LayoutDemandHint } from '../domain/layout';
import type {
  PresentationRole,
  VisibleCapability,
  VisibleCapabilityChild,
  VisibleCapabilityGroup,
  VisibleGroupItem,
  VisibleRootItem,
} from '../domain/types';
import { fileSafe, localTimestamp } from './exportSvg';
import {
  buildCurrentPptxSlides,
  buildFullPptxSlides,
  type PptxExportRequest,
  type PptxSlideDefinition,
} from './pptxDeck';
import { buildExportScene } from './scene';
import { effectiveCornerRadius, roundedDividerInset } from './style';
import type {
  ExportCapabilityElement,
  ExportGroupElement,
  ExportLegendEntry,
  ExportRect,
  ExportScene,
} from './types';

export const PPTX_PAGE = {
  widthIn: 13.333,
  heightIn: 7.5,
  marginIn: 0.25,
} as const;

export const PPTX_LAYOUT = {
  title: { x: 0.25, y: 0.25, width: 12.833, height: 0.8 },
  map: { x: 0.25, y: 1.15, width: 12.833, height: 5.25 },
  legend: { x: 0.25, y: 6.52, width: 12.833, height: 0.34 },
  metadata: { x: 0.25, y: 6.94, width: 12.833, height: 0.31 },
} as const satisfies Record<string, ExportRect>;

const PPTX_LOGICAL_MAP_WIDTH = 1600;
const PPTX_LOGICAL_MAP_HEIGHT =
  PPTX_LOGICAL_MAP_WIDTH * (PPTX_LAYOUT.map.height / PPTX_LAYOUT.map.width);
const TEXT_LINE_HEIGHT = 1.12;
const TEXT_MEASUREMENT_SAFETY = 1.08;
const CAPABILITY_HORIZONTAL_INSET = 0.08;
const CAPABILITY_VERTICAL_INSET = 0.05;
const CAPABILITY_ICON_GAP = 0.06;
const GROUP_TEXT_INSET = 0.08;

export const PPTX_CAPABILITY_FONT_CEILINGS = [12, 10, 9, 8, 7] as const;

export interface PptxTypographyProfile {
  overviewGroupPt: number;
  openGroupPt: ReadonlyMap<1 | 2, number>;
  collapsedGroupPt: ReadonlyMap<1 | 2, number>;
  capabilityPt: Map<number, number>;
  iconPt: Map<number, number>;
}

const PPTX_FULL_CAPABILITY_PREFERRED = [10, 8, 7, 6] as const;
const PPTX_FOCUS_ACCENT = '2D7D6F';
const PPTX_LOGICAL_SCALE = PPTX_LAYOUT.map.width / PPTX_LOGICAL_MAP_WIDTH;
export const PPTX_LAYOUT_DENSITY = {
  gap: 8,
  padding: 8,
} as const;

export interface PptxPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface WrappedText {
  lines: string[];
  complete: boolean;
}

export interface CapabilityTextLayout {
  lines: string[];
  showIcon: boolean;
  truncated: boolean;
}

const PPTX_UNFOCUSED_LEVEL_ONE_CAPABILITY_PT = 7;

export interface CapabilityLevelTypography {
  fontSizePt: number;
  iconSizePt: number;
  items: Map<string, CapabilityTextLayout>;
}

export function fitExportOnWideSlide(width: number, height: number): PptxPlacement {
  if (width <= 0 || height <= 0) throw new Error('Die Exportfläche ist leer.');
  const availableWidth = PPTX_PAGE.widthIn - PPTX_PAGE.marginIn * 2;
  const availableHeight = PPTX_PAGE.heightIn - PPTX_PAGE.marginIn * 2;
  const scale = Math.min(availableWidth / width, availableHeight / height);
  const placedWidth = width * scale;
  const placedHeight = height * scale;
  return {
    x: (PPTX_PAGE.widthIn - placedWidth) / 2,
    y: (PPTX_PAGE.heightIn - placedHeight) / 2,
    width: placedWidth,
    height: placedHeight,
    scale,
  };
}

function color(value: string): string {
  return value.replace(/^#/, '').toUpperCase();
}

function hexToRgb(value: string): [number, number, number] | undefined {
  const hex = value.match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!hex) return undefined;
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function mixColors(first: string, second: string, firstRatio: number): string {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  if (!firstRgb || !secondRgb) return color(first);
  return firstRgb
    .map((value, index) =>
      Math.round(value * firstRatio + (secondRgb[index] ?? 0) * (1 - firstRatio)),
    )
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function iconAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .filter(([name]) => name !== 'key')
    .map(([name, value]) => {
      const attribute = name === 'className'
        ? 'class'
        : name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${attribute}="${escapeXml(value)}"`;
    })
    .join(' ');
}

function iconData(iconNode: IconNode, stroke: string): string {
  const children = iconNode
    .map(([tag, attributes]) => `<${tag} ${iconAttributes(attributes)} />`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`;
  const bytes = new TextEncoder().encode(svg);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

let measurementContext: CanvasRenderingContext2D | null | undefined;

function canvasMeasurementContext(): CanvasRenderingContext2D | undefined {
  if (measurementContext !== undefined) return measurementContext ?? undefined;
  if (
    typeof document === 'undefined' ||
    (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom'))
  ) {
    measurementContext = null;
    return undefined;
  }
  try {
    measurementContext = document.createElement('canvas').getContext('2d');
  } catch {
    measurementContext = null;
  }
  return measurementContext ?? undefined;
}

export function measureArialTextInches(text: string, fontSizePt: number): number {
  const context = canvasMeasurementContext();
  if (context) {
    context.font = `400 ${fontSizePt * (96 / 72)}px Arial`;
    return (context.measureText(text).width / 96) * TEXT_MEASUREMENT_SAFETY;
  }
  return (text.length * fontSizePt * 0.52 / 72) * TEXT_MEASUREMENT_SAFETY;
}

function breakableTextTokens(text: string): string[] {
  return text
    .trim()
    .replace(/([/–—-])(?=\S)/g, '$1\u200b')
    .replace(/\u00ad/g, '\u00ad\u200b')
    .split(/[\s\u200b]+/)
    .filter(Boolean);
}

function oversizedCharacterCount(word: string, maxWidth: number, fontSizePt: number): number {
  let fittingPrefix = word;
  let oversizedCharacters = 0;
  while (
    fittingPrefix.length > 1 &&
    measureArialTextInches(fittingPrefix, fontSizePt) > maxWidth
  ) {
    fittingPrefix = fittingPrefix.slice(0, -1).trimEnd();
    oversizedCharacters += 1;
  }
  return oversizedCharacters;
}

function truncateToken(word: string, maxWidth: number, fontSizePt: number): string {
  const oversizedCharacters = oversizedCharacterCount(word, maxWidth, fontSizePt);
  if (oversizedCharacters > 0 && oversizedCharacters < 3) return word;

  let shortened = word;
  while (
    shortened.length > 1 &&
    measureArialTextInches(`${shortened}…`, fontSizePt) > maxWidth
  ) {
    shortened = shortened.slice(0, -1).trimEnd();
  }
  return shortened.length >= 2 ? `${shortened}…` : '…';
}

export function wrapPptxText(
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontSizePt: number,
  truncate: boolean,
): WrappedText {
  const maximumLines = Math.max(
    1,
    Math.floor(maxHeight / ((fontSizePt * TEXT_LINE_HEIGHT) / 72)),
  );
  const tokens = breakableTextTokens(text);
  const lines: string[] = [];
  let current = '';
  let processedTokens = 0;
  let overflow = false;
  let preserveNearMiss = false;

  for (const token of tokens) {
    if (measureArialTextInches(token, fontSizePt) > maxWidth) {
      if (current) lines.push(current);
      if (lines.length < maximumLines) {
        lines.push(truncate ? truncateToken(token, maxWidth, fontSizePt) : token);
        preserveNearMiss = truncate && processedTokens === tokens.length - 1 &&
          oversizedCharacterCount(token, maxWidth, fontSizePt) > 0 &&
          oversizedCharacterCount(token, maxWidth, fontSizePt) < 3;
      }
      overflow = true;
      processedTokens += 1;
      break;
    }
    if (!current) {
      current = token;
      processedTokens += 1;
      continue;
    }
    const candidate = current ? `${current} ${token}` : token;
    if (measureArialTextInches(candidate, fontSizePt) <= maxWidth) {
      current = candidate;
      processedTokens += 1;
      continue;
    }
    lines.push(current);
    if (lines.length >= maximumLines) {
      current = '';
      overflow = true;
      break;
    }
    current = token;
    processedTokens += 1;
  }
  if (current && lines.length < maximumLines) lines.push(current);
  const complete = !overflow && processedTokens >= tokens.length;

  if (!complete && truncate && lines.length > 0) {
    const lastIndex = lines.length - 1;
    let last = lines[lastIndex] ?? '';
    if (last.endsWith('…')) return { lines, complete };
    if (preserveNearMiss) return { lines, complete };
    while (
      last.length > 1 &&
      measureArialTextInches(`${last}…`, fontSizePt) > maxWidth
    ) {
      last = last.slice(0, -1).trimEnd();
    }
    lines[lastIndex] = `${last}…`;
  }
  return { lines, complete };
}

function capabilityTextArea(
  element: ExportCapabilityElement,
  scale: number,
  fontSizePt: number,
  withIcon: boolean,
): { width: number; height: number } {
  const contentWidth = element.geometry.contentRect.width * scale;
  const contentHeight = element.geometry.contentRect.height * scale;
  const headerHeight = element.compact
    ? contentHeight
    : Math.min(capabilityPresentationTokens.regularHeaderHeight * scale, contentHeight);
  const leftPadding = Math.max(CAPABILITY_HORIZONTAL_INSET, (element.compact ? 7 : 9) * scale);
  const rightPadding = Math.max(CAPABILITY_HORIZONTAL_INSET, 9 * scale);
  const iconSize = Math.min(20, fontSizePt + 2) / 72;
  const iconGap = Math.max(CAPABILITY_ICON_GAP, capabilityPresentationTokens.iconTextGap * scale);
  const badgeReserve = element.hiddenDescendantCount > 0 ? 0.34 : 0;
  return {
    width: Math.max(
      0.01,
      contentWidth - leftPadding - rightPadding - badgeReserve -
        (withIcon ? iconSize + iconGap : 0),
    ),
    height: Math.max(0.01, headerHeight - CAPABILITY_VERTICAL_INSET * 2),
  };
}

function layoutCapabilityAtSize(
  element: ExportCapabilityElement,
  scale: number,
  fontSizePt: number,
  withIcon: boolean,
  truncate: boolean,
): CapabilityTextLayout {
  const area = capabilityTextArea(element, scale, fontSizePt, withIcon);
  const wrapped = wrapPptxText(
    element.name,
    area.width,
    area.height,
    fontSizePt,
    truncate,
  );
  const iconSizeIn = Math.min(20, fontSizePt + 2) / 72;
  const contentHeightIn = element.geometry.contentRect.height * scale;
  return {
    lines: wrapped.lines,
    showIcon: withIcon && contentHeightIn >= iconSizeIn + CAPABILITY_VERTICAL_INSET * 2,
    truncated: !wrapped.complete || (withIcon && contentHeightIn < iconSizeIn + CAPABILITY_VERTICAL_INSET * 2),
  };
}

function capabilityFontCeiling(depth: number): number {
  const configured = PPTX_CAPABILITY_FONT_CEILINGS[depth];
  if (configured !== undefined) return configured;
  return 7 * (0.9 ** (depth - (PPTX_CAPABILITY_FONT_CEILINGS.length - 1)));
}

function nextSmallerFontSize(fontSizePt: number): number {
  if (fontSizePt > 8) return Math.floor(fontSizePt) - 1;
  if (fontSizePt > 7) return 7;
  return fontSizePt * 0.9;
}

function fitCapabilityLevelWithoutIcons(
  elements: ExportCapabilityElement[],
  scale: number,
  ceiling: number,
): { fontSizePt: number; items: Map<string, CapabilityTextLayout> } {
  let fontSizePt = ceiling;
  const fittingFloor = ceiling > 7 ? Math.max(7, ceiling - 1) : ceiling * 0.9;
  while (fontSizePt >= fittingFloor) {
    const items = new Map(
      elements.map((element) => [
        element.id,
        layoutCapabilityAtSize(element, scale, fontSizePt, false, false),
      ]),
    );
    if ([...items.values()].every((item) => !item.truncated)) {
      return { fontSizePt, items };
    }
    const next = nextSmallerFontSize(fontSizePt);
    if (next < fittingFloor) break;
    fontSizePt = next;
  }
  return {
    fontSizePt: fittingFloor,
    items: new Map(
      elements.map((element) => [
        element.id,
        layoutCapabilityAtSize(element, scale, fittingFloor, false, true),
      ]),
    ),
  };
}

export function resolveCapabilityTypography(
  elements: ExportCapabilityElement[],
  scale: number,
): Map<number, CapabilityLevelTypography> {
  const byDepth = new Map<number, ExportCapabilityElement[]>();
  elements.forEach((element) => {
    const current = byDepth.get(element.depth) ?? [];
    current.push(element);
    byDepth.set(element.depth, current);
  });

  const resolved = new Map<number, CapabilityLevelTypography>();
  let previousFontSize = 14;
  [...byDepth.entries()].sort(([left], [right]) => left - right).forEach(([depth, levelElements]) => {
    const hierarchyCeiling = previousFontSize > 7
      ? previousFontSize - 1
      : previousFontSize * 0.9;
    const fitted = fitCapabilityLevelWithoutIcons(
      levelElements,
      scale,
      Math.min(capabilityFontCeiling(depth), hierarchyCeiling),
    );
    const withIcons = new Map(
      levelElements.map((element) => [
        element.id,
        layoutCapabilityAtSize(element, scale, fitted.fontSizePt, true, false),
      ]),
    );
    const showIcons = [...withIcons.values()].every((item) => !item.truncated && item.showIcon);
    const selectedItems = showIcons
      ? withIcons
      : new Map(
          [...fitted.items.entries()].map(([id, item]) => [id, { ...item, showIcon: false }]),
        );
    resolved.set(depth, {
      fontSizePt: fitted.fontSizePt,
      iconSizePt: Math.min(20, fitted.fontSizePt + 2),
      items: selectedItems,
    });
    previousFontSize = fitted.fontSizePt;
  });
  return resolved;
}

function roundedPptxSize(value: number): number {
  return value > 7 ? Math.floor(value) : Math.round(value * 10) / 10;
}

export function createPptxTypographyProfile(maximumCapabilityDepth: number): PptxTypographyProfile {
  const capabilityPt = new Map<number, number>();
  for (let depth = 0; depth <= maximumCapabilityDepth; depth += 1) {
    const configured = PPTX_FULL_CAPABILITY_PREFERRED[depth];
    const previous = capabilityPt.get(depth - 1);
    const size = configured ?? roundedPptxSize((previous ?? 6) * 0.9);
    capabilityPt.set(depth, size);
  }
  return {
    overviewGroupPt: 16,
    openGroupPt: new Map([[1, 12], [2, 10]]),
    collapsedGroupPt: new Map([[1, 8], [2, 7]]),
    capabilityPt,
    iconPt: new Map(
      [...capabilityPt].map(([depth, size]) => [depth, Math.min(20, size + 2)]),
    ),
  };
}

function cloneTypographyProfile(profile: PptxTypographyProfile): PptxTypographyProfile {
  return {
    ...profile,
    capabilityPt: new Map(profile.capabilityPt),
    iconPt: new Map(profile.iconPt),
  };
}

function typographyProfileForSlide(
  definition: PptxSlideDefinition,
  profile: PptxTypographyProfile,
): PptxTypographyProfile {
  if (definition.id !== 'level-1') return profile;
  const slideProfile = cloneTypographyProfile(profile);
  slideProfile.capabilityPt.set(0, PPTX_UNFOCUSED_LEVEL_ONE_CAPABILITY_PT);
  slideProfile.iconPt.set(0, PPTX_UNFOCUSED_LEVEL_ONE_CAPABILITY_PT + 2);
  return slideProfile;
}

function nextDeckFontSize(value: number): number {
  if (value > 8) return Math.floor(value) - 1;
  if (value > 7) return 7;
  return Math.round(value * 0.9 * 10) / 10;
}

export function resolveDeckTypographyProfile(
  scenes: ExportScene[],
  baseProfile: PptxTypographyProfile,
  scale = PPTX_LOGICAL_SCALE,
): PptxTypographyProfile {
  const profile = cloneTypographyProfile(baseProfile);
  const capabilities = scenes.flatMap((scene) => scene.elements.filter(
    (element): element is ExportCapabilityElement => element.kind === 'capability',
  ));
  const maximumDepth = Math.max(-1, ...profile.capabilityPt.keys());

  for (let depth = maximumDepth; depth >= 0; depth -= 1) {
    const elements = capabilities.filter((element) => element.depth === depth);
    if (elements.length === 0) continue;
    const preferred = profile.capabilityPt.get(depth) ?? 6;
    const deeper = profile.capabilityPt.get(depth + 1);
    const minimum = Math.max(
      roundedPptxSize(preferred * 0.9),
      deeper === undefined ? 0 : roundedPptxSize(deeper + (deeper >= 7 ? 1 : 0.1)),
    );
    let candidate = preferred;
    while (
      candidate > minimum &&
      elements.some((element) =>
        layoutCapabilityAtSize(element, scale, candidate, false, false).truncated,
      )
    ) {
      candidate = Math.max(minimum, nextDeckFontSize(candidate));
    }
    profile.capabilityPt.set(depth, candidate);
    profile.iconPt.set(depth, Math.min(20, candidate + 2));
  }
  return profile;
}

function resolveDeckIconVisibility(
  scenes: ExportScene[],
  profile: PptxTypographyProfile,
  scale = PPTX_LOGICAL_SCALE,
): Map<number, boolean> {
  const visibility = new Map<number, boolean>();
  profile.capabilityPt.forEach((fontSizePt, depth) => {
    const elements = scenes.flatMap((scene) => scene.elements.filter(
      (element): element is ExportCapabilityElement =>
        element.kind === 'capability' && element.depth === depth,
    ));
    visibility.set(depth, elements.length > 0 && elements.every((element) => {
      const withIcon = layoutCapabilityAtSize(element, scale, fontSizePt, true, false);
      const withoutIcon = layoutCapabilityAtSize(element, scale, fontSizePt, false, false);
      return withIcon.showIcon && (!withIcon.truncated || withoutIcon.truncated);
    }));
  });
  return visibility;
}

function typographyFromProfile(
  elements: ExportCapabilityElement[],
  scale: number,
  profile: PptxTypographyProfile,
  iconVisibility: ReadonlyMap<number, boolean>,
): Map<number, CapabilityLevelTypography> {
  const byDepth = new Map<number, ExportCapabilityElement[]>();
  elements.forEach((element) => {
    const level = byDepth.get(element.depth) ?? [];
    level.push(element);
    byDepth.set(element.depth, level);
  });
  return new Map([...byDepth].map(([depth, levelElements]) => {
    const fontSizePt = profile.capabilityPt.get(depth) ?? 6;
    const showIcons = iconVisibility.get(depth) ?? false;
    return [depth, {
      fontSizePt,
      iconSizePt: profile.iconPt.get(depth) ?? Math.min(20, fontSizePt + 2),
      items: new Map(levelElements.map((element) => [
        element.id,
        layoutCapabilityAtSize(element, scale, fontSizePt, showIcons, true),
      ])),
    }];
  }));
}

function roleGrowWeight(role: PresentationRole): number {
  if (role === 'focus') return 6;
  if (role === 'focus-ancestor') return 5;
  if (role === 'focus-child') return 2;
  if (role === 'context') return 0;
  return 1;
}

function longestBreakableToken(text: string): string {
  return breakableTextTokens(text).sort((left, right) => right.length - left.length)[0] ?? text;
}

function buildPptxDemandHints(
  roots: VisibleRootItem[],
  profile: PptxTypographyProfile,
  scale = PPTX_LOGICAL_SCALE,
  includeHiddenDescendantCounts = true,
): ReadonlyMap<string, LayoutDemandHint> {
  const hints = new Map<string, LayoutDemandHint>();
  const visitCapability = (item: VisibleCapability) => {
    const fontSizePt = profile.capabilityPt.get(item.capability.depth) ?? 6;
    const iconSizeIn = (profile.iconPt.get(item.capability.depth) ?? fontSizePt + 2) / 72;
    const badgeWidth = includeHiddenDescendantCounts &&
      item.hiddenDescendantCount && item.hiddenDescendantCount > 0
      ? 0.34
      : 0;
    const minimumTextWidth = measureArialTextInches(
      longestBreakableToken(item.capability.name),
      fontSizePt,
    );
    hints.set(item.capability.id, {
      minWidth: (
        CAPABILITY_HORIZONTAL_INSET * 2 + minimumTextWidth +
        iconSizeIn + CAPABILITY_ICON_GAP + badgeWidth
      ) / scale,
      minHeight: (
        CAPABILITY_VERTICAL_INSET * 2 + Math.max(
          fontSizePt * TEXT_LINE_HEIGHT / 72,
          iconSizeIn,
        )
      ) / scale,
      growWeight: roleGrowWeight(item.presentationRole ?? 'normal'),
    });
    item.children.forEach((child) => {
      if (child.kind === 'capability') visitCapability(child);
    });
  };
  const visitGroup = (item: VisibleCapabilityGroup) => {
    const level = item.group.groupLevel;
    const fontSizePt = item.collapsed
      ? profile.collapsedGroupPt.get(level) ?? 9
      : profile.openGroupPt.get(level) ?? 12;
    hints.set(item.group.id, {
      groupLabelFontSizePt: fontSizePt,
      groupLabelSize: (fontSizePt * TEXT_LINE_HEIGHT / 72 + GROUP_TEXT_INSET * 2) / scale,
      groupLabelTextWidth: (
        measureArialTextInches(item.group.name, fontSizePt) + GROUP_TEXT_INSET * 2
      ) / scale,
      growWeight: roleGrowWeight(item.presentationRole ?? 'normal'),
    });
    item.capabilities.forEach((child) => {
      if (child.kind === 'group') visitGroup(child);
      if (child.kind === 'capability') visitCapability(child);
    });
  };
  roots.forEach((root) => {
    if (root.kind === 'group') visitGroup(root);
    if (root.kind === 'capability') visitCapability(root);
  });
  return hints;
}

function chevronMinimumWidth(
  item: VisibleCapability,
  profile: PptxTypographyProfile,
  scale = PPTX_LOGICAL_SCALE,
): number {
  const fontSizePt = profile.capabilityPt.get(item.capability.depth) ?? 6;
  const tokenWidth = measureArialTextInches(
    longestBreakableToken(item.capability.name),
    fontSizePt,
  );
  return Math.max(
    0.7 / scale,
    (
      tokenWidth + CAPABILITY_HORIZONTAL_INSET * 2 +
      (profile.iconPt.get(item.capability.depth) ?? fontSizePt + 2) / 72 +
      CAPABILITY_ICON_GAP
    ) / scale,
  );
}

function reflowCapability(
  item: VisibleCapability,
  availableWidths: ReadonlyMap<string, number>,
  profile: PptxTypographyProfile,
): VisibleCapability {
  const availableWidth = Math.max(
    1,
    (availableWidths.get(item.capability.id) ?? PPTX_LOGICAL_MAP_WIDTH) * 0.94,
  );
  return {
    ...item,
    children: reflowCapabilityChildren(item.children, availableWidth, availableWidths, profile),
  };
}

function reflowCapabilityChildren(
  items: VisibleCapabilityChild[],
  availableWidth: number,
  availableWidths: ReadonlyMap<string, number>,
  profile: PptxTypographyProfile,
): VisibleCapabilityChild[] {
  const prepared = items.map<VisibleCapabilityChild>((item) =>
    item.kind === 'capability'
      ? reflowCapability(item, availableWidths, profile)
      : { ...item },
  );
  return insertSoftChevronFlushes(prepared, availableWidth, profile);
}

function reflowGroup(
  item: VisibleCapabilityGroup,
  availableWidths: ReadonlyMap<string, number>,
  profile: PptxTypographyProfile,
): VisibleCapabilityGroup {
  const availableWidth = Math.max(
    1,
    (availableWidths.get(item.group.id) ?? PPTX_LOGICAL_MAP_WIDTH) * 0.94,
  );
  const prepared = item.capabilities.map<VisibleGroupItem>((child) => {
    if (child.kind === 'group') return reflowGroup(child, availableWidths, profile);
    if (child.kind === 'capability') return reflowCapability(child, availableWidths, profile);
    return { ...child };
  });
  return {
    ...item,
    capabilities: insertSoftChevronFlushes(prepared, availableWidth, profile),
  };
}

function insertSoftChevronFlushes<T extends VisibleCapabilityChild | VisibleGroupItem>(
  items: T[],
  availableWidth: number,
  profile: PptxTypographyProfile,
): T[] {
  const result: T[] = [];
  let index = 0;
  while (index < items.length) {
    const item = items[index];
    if (
      item?.kind !== 'capability' ||
      !isRenderedChevron(item.capability.shape, item.capability.layout.direction)
    ) {
      if (item) result.push(item);
      index += 1;
      continue;
    }
    const sequence: VisibleCapability[] = [];
    while (index < items.length) {
      const candidate = items[index];
      if (
        candidate?.kind !== 'capability' ||
        !isRenderedChevron(candidate.capability.shape, candidate.capability.layout.direction)
      ) break;
      sequence.push(candidate);
      index += 1;
    }
    const minimumWidths = sequence.map((candidate) => chevronMinimumWidth(candidate, profile));
    const fallbackToBoxes = minimumWidths.some((minimumWidth) => minimumWidth > availableWidth);
    let consumedWidth = 0;
    sequence.forEach((candidate, sequenceIndex) => {
      const minimumWidth = minimumWidths[sequenceIndex] ?? availableWidth;
      const gap = consumedWidth > 0 ? capabilityShapeTokens.chevronSegmentGap : 0;
      if (!fallbackToBoxes && consumedWidth > 0 && consumedWidth + gap + minimumWidth > availableWidth) {
        result.push({ kind: 'flush', direction: 'vertical' } as T);
        consumedWidth = 0;
      }
      result.push((fallbackToBoxes
        ? {
            ...candidate,
            capability: { ...candidate.capability, shape: 'box' },
          }
        : candidate) as T);
      consumedWidth += (consumedWidth > 0 ? gap : 0) + minimumWidth;
    });
  }
  return result;
}

export function derivePptxReflowDefinitions(
  definitions: PptxSlideDefinition[],
  scenes: ExportScene[],
  profile: PptxTypographyProfile,
): PptxSlideDefinition[] {
  return definitions.map((definition, index) => {
    const scene = scenes[index];
    const widths = new Map(
      scene?.elements.map((element) => [element.id, element.rect.width]) ?? [],
    );
    return {
      ...definition,
      roots: definition.roots.map<VisibleRootItem>((root) => {
        if (root.kind === 'group') return reflowGroup(root, widths, profile);
        if (root.kind === 'capability') return reflowCapability(root, widths, profile);
        return { ...root };
      }),
    };
  });
}

function buildScene(
  request: PptxExportRequest,
  definition: PptxSlideDefinition,
  createdAt: Date,
  typographyProfile?: PptxTypographyProfile,
): ExportScene {
  const suppressHiddenDescendantCounts = request.mode === 'full' && definition.level === 1;
  const slideTypographyProfile = typographyProfile
    ? typographyProfileForSlide(definition, typographyProfile)
    : undefined;
  const demandHints = slideTypographyProfile
    ? buildPptxDemandHints(
        definition.roots,
        slideTypographyProfile,
        PPTX_LOGICAL_SCALE,
        !suppressHiddenDescendantCounts,
      )
    : undefined;
  const shared = {
    layoutOptions: {
      width: PPTX_LOGICAL_MAP_WIDTH,
      height: PPTX_LOGICAL_MAP_HEIGHT,
      gap: PPTX_LAYOUT_DENSITY.gap,
      padding: PPTX_LAYOUT_DENSITY.padding,
      ...(demandHints ? { demandHints } : {}),
    },
    createdAt,
  };
  if (request.mode === 'current') {
    return buildExportScene({
      ...request.options,
      ...shared,
      roots: definition.roots,
    });
  }
  const scene = buildExportScene({
    map: request.map,
    roots: definition.roots,
    profile: definition.level === 1
      ? 'level-1'
      : definition.level === 2
        ? 'level-2'
        : definition.level === 3
          ? 'level-3'
          : 'all',
    filters: {},
    filterOptions: [],
    ...shared,
  });
  if (!suppressHiddenDescendantCounts) return scene;
  return {
    ...scene,
    elements: scene.elements.map((element) =>
      element.kind === 'capability' && element.hiddenDescendantCount > 0
        ? { ...element, hiddenDescendantCount: 0 }
        : element,
    ),
    legend: scene.legend.filter((entry) => entry.kind !== 'hidden-descendants'),
  };
}

function mergeLegends(scenes: ExportScene[]): ExportLegendEntry[] {
  const entries = new Map<string, ExportLegendEntry>();
  scenes.forEach((scene) => scene.legend.forEach((entry) => entries.set(entry.kind, entry)));
  return [...entries.values()];
}

function renderSlide(
  scene: ExportScene,
  definition: PptxSlideDefinition,
  legend: ExportLegendEntry[],
  presentation: PptxGenJS,
  fullExport: boolean,
  typographyProfile?: PptxTypographyProfile,
  iconVisibility: ReadonlyMap<number, boolean> = new Map(),
  titleMasterName?: string,
): PptxPlacement {
  const slide = presentation.addSlide(titleMasterName);
  slide.background = { color: 'FFFFFF' };
  const scale = PPTX_LAYOUT.map.width / scene.mapBounds.width;
  const placement: PptxPlacement = { ...PPTX_LAYOUT.map, scale };
  const x = (value: number) => PPTX_LAYOUT.map.x + value * scale;
  const y = (value: number) => PPTX_LAYOUT.map.y + value * scale;
  const size = (value: number) => value * scale;
  const addText = (
    text: string,
    rect: ExportRect,
    options: Partial<PptxGenJS.TextPropsOptions> = {},
  ) => slide.addText(text, {
    x: rect.x,
    y: rect.y,
    w: rect.width,
    h: rect.height,
    margin: 0,
    fontFace: 'Arial',
    breakLine: false,
    ...options,
  });

  const primaryNeedsTwoLines = measureArialTextInches(definition.primaryTitle, 28) >
    PPTX_LAYOUT.title.width;
  const renderTitle = () => {
    if (!titleMasterName) {
      addText(definition.primaryTitle, PPTX_LAYOUT.title, {
        objectName: 'Slide title',
        fontSize: 28,
        bold: true,
        color: '18202B',
        valign: 'top',
        wrap: true,
      });
    }
    if (definition.contextTitle && !primaryNeedsTwoLines) {
      addText(definition.contextTitle, {
        x: PPTX_LAYOUT.title.x,
        y: PPTX_LAYOUT.title.y + 0.55,
        width: PPTX_LAYOUT.title.width,
        height: 0.24,
      }, {
        objectName: 'Slide context',
        fontSize: 14,
        bold: false,
        color: '4C5867',
        valign: 'middle',
        wrap: false,
      });
    }
  };

  const positionRect = (rect: ExportRect): ExportRect => ({
    x: x(rect.x),
    y: y(rect.y),
    width: size(rect.width),
    height: size(rect.height),
  });
  const capabilities = scene.elements.filter(
    (element): element is ExportCapabilityElement => element.kind === 'capability',
  );
  const slideTypographyProfile = typographyProfile
    ? typographyProfileForSlide(definition, typographyProfile)
    : undefined;
  const typography = slideTypographyProfile
    ? typographyFromProfile(capabilities, scale, slideTypographyProfile, iconVisibility)
    : resolveCapabilityTypography(capabilities, scale);

  const renderGroup = (element: ExportGroupElement) => {
    const rect = positionRect(element.rect);
    const isContext = element.presentationRole === 'context';
    const isFocus = element.presentationRole === 'focus';
    const fill = mixColors(element.backgroundColor, '#ffffff', isContext ? 0.32 : 0.78);
    const stroke = mixColors(element.backgroundColor, '#75808d', 0.72);
    const cornerRadius = effectiveCornerRadius(element.cornerRadius, element.rect) * scale;
    slide.addShape(presentation.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
      objectName: `${element.id} group surface`,
      fill: { color: fill },
      line: {
        color: isFocus ? PPTX_FOCUS_ACCENT : stroke,
        transparency: isContext ? 48 : 0,
        width: isFocus ? 1.4 : 0.7,
        dashType: element.autoCollapsed ? 'dash' : 'solid',
      },
      rectRadius: cornerRadius,
    });

    const isOverview = definition.overviewGroupIds.includes(element.id);
    if (isOverview) {
      addText(element.name, {
        x: rect.x + GROUP_TEXT_INSET,
        y: rect.y + GROUP_TEXT_INSET,
        width: Math.max(0.01, rect.width - GROUP_TEXT_INSET * 2),
        height: Math.max(0.01, rect.height - GROUP_TEXT_INSET * 2),
      }, {
        objectName: `${element.id} group name`,
        fontSize: typographyProfile?.overviewGroupPt ?? 16,
        bold: true,
        color: '4C5867',
        align: 'center',
        valign: 'middle',
        wrap: true,
      });
      return;
    }

    const verticalLabel = element.labelOrientation === 'vertical';
    const labelRect: ExportRect = element.collapsed
      ? rect
      : element.labelOrientation === 'horizontal'
        ? { x: rect.x, y: rect.y, width: rect.width, height: size(element.labelSize) }
        : { x: rect.x, y: rect.y, width: size(element.labelSize), height: rect.height };
    if (!element.collapsed) {
      const logicalCornerRadius = effectiveCornerRadius(element.cornerRadius, element.rect);
      const dividerInset = element.labelOrientation === 'horizontal'
        ? roundedDividerInset(
            logicalCornerRadius,
            Math.min(element.labelSize, element.rect.height - element.labelSize),
          )
        : roundedDividerInset(
            logicalCornerRadius,
            Math.min(element.labelSize, element.rect.width - element.labelSize),
          );
      slide.addShape(
        presentation.ShapeType.line,
        element.labelOrientation === 'horizontal'
          ? {
              x: x(element.rect.x + dividerInset),
              y: y(element.rect.y + element.labelSize),
              w: size(element.rect.width - dividerInset * 2),
              h: 0,
              objectName: `${element.id} label divider`,
              line: { color: '465260', transparency: 87, width: 0.5 },
            }
          : {
              x: x(element.rect.x + element.labelSize),
              y: y(element.rect.y + dividerInset),
              w: 0,
              h: size(element.rect.height - dividerInset * 2),
              objectName: `${element.id} label divider`,
              line: { color: '465260', transparency: 87, width: 0.5 },
            },
      );
    }
    const groupFontSize = isOverview
      ? typographyProfile?.overviewGroupPt ?? 16
      : typographyProfile
        ? element.collapsed
          ? typographyProfile.collapsedGroupPt.get(element.groupLevel) ?? 7
          : typographyProfile.openGroupPt.get(element.groupLevel) ?? 10
        : element.groupLevel === 1 ? 14 : 12;
    const groupTextRect: ExportRect = verticalLabel
      ? {
          x: labelRect.x + labelRect.width / 2 - labelRect.height / 2 + GROUP_TEXT_INSET,
          y: labelRect.y + labelRect.height / 2 - labelRect.width / 2 + GROUP_TEXT_INSET,
          width: Math.max(0.01, labelRect.height - GROUP_TEXT_INSET * 2),
          height: Math.max(0.01, labelRect.width - GROUP_TEXT_INSET * 2),
        }
      : {
          x: labelRect.x + GROUP_TEXT_INSET,
          y: labelRect.y + GROUP_TEXT_INSET,
          width: Math.max(0.01, labelRect.width - GROUP_TEXT_INSET * 2),
          height: Math.max(0.01, labelRect.height - GROUP_TEXT_INSET * 2),
        };
    addText(
      element.name,
      groupTextRect,
      {
        objectName: `${element.id} group name`,
        fontSize: groupFontSize,
        bold: !element.collapsed,
        color: isContext ? '697383' : '4C5867',
        valign: 'middle',
        align: verticalLabel ? 'center' : 'left',
        rotate: verticalLabel ? 270 : 0,
        charSpacing: verticalLabel ? 0.35 : 0,
        wrap: true,
      },
    );
  };

  const renderCapability = (element: ExportCapabilityElement) => {
    const rect = positionRect(element.rect);
    const geometry = element.geometry;
    const contentRect: ExportRect = {
      x: x(element.rect.x + geometry.contentRect.x),
      y: y(element.rect.y + geometry.contentRect.y),
      width: size(geometry.contentRect.width),
      height: size(geometry.contentRect.height),
    };
    const isContext = element.presentationRole === 'context' || element.contextOnly;
    const transparency = isContext ? 52 : 0;
    const isFocus = element.presentationRole === 'focus';
    const renderedChevron = element.renderedShape === 'chevron';
    if (geometry.pptxStrategy.kind !== 'preset') {
      throw new Error(
        `Für die Capability-Form „${element.renderedShape}“ fehlt eine PPTX-Freiformstrategie.`,
      );
    }
    slide.addShape(
      geometry.pptxStrategy.preset === 'chevron'
        ? presentation.ShapeType.chevron
        : presentation.ShapeType.roundRect,
      {
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height,
        objectName: `${element.id} capability surface`,
        fill: { color: color(element.color), transparency },
        line: {
          color: isFocus ? PPTX_FOCUS_ACCENT : renderedChevron ? '52606D' : '141E28',
          transparency: isContext ? 70 : renderedChevron ? 44 : 79,
          width: isFocus ? 1.4 : 0.7,
        },
        rectRadius: renderedChevron
          ? undefined
          : effectiveCornerRadius(geometry.cornerRadius, element.rect) * scale,
      },
    );

    const levelTypography = typography.get(element.depth);
    const itemTypography = levelTypography?.items.get(element.id);
    if (!levelTypography || !itemTypography) return;
    const headerHeight = element.compact
      ? contentRect.height
      : Math.min(size(capabilityPresentationTokens.regularHeaderHeight), contentRect.height);
    if (
      !element.compact &&
      !renderedChevron &&
      contentRect.height > size(capabilityPresentationTokens.regularHeaderHeight)
    ) {
      slide.addShape(presentation.ShapeType.line, {
        x: contentRect.x,
        y: contentRect.y + size(capabilityPresentationTokens.regularHeaderHeight),
        w: contentRect.width,
        h: 0,
        objectName: `${element.id} header divider`,
        line: { color: '141E28', transparency: 87, width: 0.5 },
      });
    }

    const leftPadding = Math.max(CAPABILITY_HORIZONTAL_INSET, size(element.compact ? 7 : 9));
    const rightPadding = Math.max(CAPABILITY_HORIZONTAL_INSET, size(9));
    const iconSize = levelTypography.iconSizePt / 72;
    const iconGap = Math.max(CAPABILITY_ICON_GAP, size(capabilityPresentationTokens.iconTextGap));
    const iconX = contentRect.x + leftPadding;
    if (itemTypography.showIcon) {
      slide.addImage({
        data: iconData(element.iconNode, element.textColor),
        x: iconX,
        y: contentRect.y + (headerHeight - iconSize) / 2,
        w: iconSize,
        h: iconSize,
        objectName: `${element.id} icon`,
        altText: `${element.name} icon`,
        transparency,
      });
    }
    const textX = itemTypography.showIcon ? iconX + iconSize + iconGap : contentRect.x + leftPadding;
    const badgeReserve = element.hiddenDescendantCount > 0 ? 0.34 : 0;
    const textWidth = Math.max(
      0.01,
      contentRect.x + contentRect.width - rightPadding - badgeReserve - textX,
    );
    addText(itemTypography.lines.join('\n'), {
      x: textX,
      y: contentRect.y + CAPABILITY_VERTICAL_INSET,
      width: textWidth,
      height: Math.max(0.01, headerHeight - CAPABILITY_VERTICAL_INSET * 2),
    }, {
      objectName: `${element.id} capability name · ${element.name}`,
      fontSize: levelTypography.fontSizePt,
      color: color(element.textColor),
      align: 'left',
      valign: 'middle',
      wrap: true,
      transparency,
      breakLine: false,
    });

    if (element.hiddenDescendantCount > 0 && contentRect.width >= 0.38 && contentRect.height >= 0.2) {
      slide.addShape(presentation.ShapeType.roundRect, {
        x: contentRect.x + contentRect.width - 0.3,
        y: contentRect.y + contentRect.height - 0.16,
        w: 0.24,
        h: 0.12,
        objectName: `${element.id} hidden descendants badge`,
        fill: { color: 'FFFFFF', transparency: 75 },
        line: { transparency: 100 },
        rectRadius: 0.06,
      });
      addText(`+${element.hiddenDescendantCount}`, {
        x: contentRect.x + contentRect.width - 0.3,
        y: contentRect.y + contentRect.height - 0.16,
        width: 0.24,
        height: 0.12,
      }, {
        objectName: `${element.id} hidden descendants count`,
        fontSize: 7,
        bold: true,
        color: color(element.textColor),
        align: 'center',
        valign: 'middle',
        transparency,
      });
    }
  };

  scene.elements.forEach((element) => {
    if (element.kind === 'group') renderGroup(element);
    else renderCapability(element);
  });
  renderTitle();

  const renderLegendSymbol = (entry: ExportLegendEntry, legendX: number, legendY: number) => {
    const objectName = `Legend ${entry.kind}`;
    if (entry.shapeId) {
      const geometry = resolveCapabilityShapeLegend(entry.shapeId);
      if (geometry.pptxStrategy.kind !== 'preset') {
        throw new Error(`Für die Legendenform „${entry.shapeId}“ fehlt eine PPTX-Freiformstrategie.`);
      }
      slide.addShape(
        geometry.pptxStrategy.preset === 'chevron'
          ? presentation.ShapeType.chevron
          : presentation.ShapeType.roundRect,
        {
          x: legendX,
          y: legendY,
          w: 0.2,
          h: 0.14,
          objectName,
          fill: { color: '7BA9A0' },
          line: { color: '141E28', transparency: 79, width: 0.5 },
          rectRadius: geometry.renderedShapeId === 'box' ? 0.04 : undefined,
        },
      );
      return;
    }
    const symbolColor = entry.kind === 'group'
      ? 'E6EBEF'
      : entry.kind === 'hidden-descendants'
        ? 'DCEEE9'
        : '7BA9A0';
    slide.addShape(presentation.ShapeType.roundRect, {
      x: legendX,
      y: legendY,
      w: entry.kind === 'hidden-descendants' ? 0.21 : 0.18,
      h: 0.14,
      objectName,
      fill: { color: symbolColor, transparency: entry.kind === 'context' ? 52 : 0 },
      line: {
        color: entry.kind === 'group' ? '89939F' : '141E28',
        transparency: entry.kind === 'group' ? 0 : 79,
        width: 0.5,
      },
      rectRadius: entry.kind === 'hidden-descendants' ? 0.07 : 0.03,
    });
  };

  let legendX = PPTX_LAYOUT.legend.x;
  let legendY = PPTX_LAYOUT.legend.y;
  let legendRow = 0;
  legend.forEach((entry) => {
    const labelWidth = measureArialTextInches(entry.label, 10);
    const entryWidth = 0.28 + labelWidth + 0.18;
    if (legendX + entryWidth > PPTX_LAYOUT.legend.x + PPTX_LAYOUT.legend.width) {
      legendRow += 1;
      legendX = PPTX_LAYOUT.legend.x;
      legendY += 0.17;
    }
    if (legendRow > 1) {
      throw new Error('Die vollständige Legende passt nicht in den reservierten Folienbereich.');
    }
    renderLegendSymbol(entry, legendX, legendY + 0.015);
    addText(entry.label, {
      x: legendX + 0.26,
      y: legendY,
      width: labelWidth + 0.03,
      height: 0.17,
    }, {
      objectName: `Legend ${entry.kind} label`,
      fontSize: 10,
      color: '4C5867',
      valign: 'middle',
      wrap: false,
    });
    legendX += entryWidth;
  });

  const metadata = [
    `Erstellt: ${scene.createdAtLabel}`,
    ...(fullExport
      ? ['Vollständiger Export', ...definition.metadataParts]
      : definition.metadataParts),
    ...(!fullExport ? scene.contextLines : []),
    ...(primaryNeedsTwoLines && definition.contextTitle
      ? [`Kontext: ${definition.contextTitle}`]
      : []),
  ];
  addText(metadata.join(' · '), PPTX_LAYOUT.metadata, {
    objectName: 'Export metadata',
    fontSize: 8,
    color: '697383',
    valign: 'middle',
    wrap: true,
  });
  return placement;
}

export async function createPptxExport(request: PptxExportRequest): Promise<{
  blob: Blob;
  filename: string;
  placement: PptxPlacement;
  slideCount: number;
}> {
  const createdAt = request.mode === 'current'
    ? request.options.createdAt ?? new Date()
    : request.createdAt ?? new Date();
  const map = request.mode === 'current' ? request.options.map : request.map;
  let definitions = request.mode === 'current'
    ? buildCurrentPptxSlides({ ...request.options, createdAt })
    : buildFullPptxSlides(request.map);
  let typographyProfile: PptxTypographyProfile | undefined;
  let iconVisibility = new Map<number, boolean>();
  let scenes: ExportScene[];
  if (request.mode === 'full') {
    const maximumDepth = Math.max(0, ...request.map.capabilities.map((capability) => capability.depth));
    typographyProfile = createPptxTypographyProfile(maximumDepth);
    const preliminaryScenes = definitions.map((definition) =>
      buildScene(request, definition, createdAt, typographyProfile));
    definitions = derivePptxReflowDefinitions(definitions, preliminaryScenes, typographyProfile);
    scenes = definitions.map((definition) =>
      buildScene(request, definition, createdAt, typographyProfile));
    typographyProfile = resolveDeckTypographyProfile(scenes, typographyProfile);
    definitions = derivePptxReflowDefinitions(definitions, scenes, typographyProfile);
    scenes = definitions.map((definition) =>
      buildScene(request, definition, createdAt, typographyProfile));
    iconVisibility = resolveDeckIconVisibility(scenes, typographyProfile);
  } else {
    scenes = definitions.map((definition) => buildScene(request, definition, createdAt));
  }
  const legend = mergeLegends(scenes);
  const presentation = new PptxGenJS();
  presentation.author = 'Capability Map Studio';
  presentation.company = 'Capability Map Studio';
  presentation.subject = request.mode === 'full'
    ? 'Vollständiger Capability-Map-Export'
    : `Capability Map · ${scenes[0]?.profileLabel ?? 'Aktuelle Darstellung'}`;
  presentation.title = map.name;
  presentation.revision = '1';
  presentation.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };
  presentation.defineLayout({
    name: 'CAPMAP_WIDE',
    width: PPTX_PAGE.widthIn,
    height: PPTX_PAGE.heightIn,
  });
  presentation.layout = 'CAPMAP_WIDE';

  const titleMasters = new Map<string, string>();
  if (request.mode === 'full') {
    definitions.forEach((definition) => {
      if (titleMasters.has(definition.primaryTitle)) return;
      const masterName = `CAPMAP_TITLE_${titleMasters.size + 1}`;
      presentation.defineSlideMaster({
        title: masterName,
        background: { color: 'FFFFFF' },
        objects: [{
          text: {
            text: definition.primaryTitle,
            options: {
              x: PPTX_LAYOUT.title.x,
              y: PPTX_LAYOUT.title.y,
              w: PPTX_LAYOUT.title.width,
              h: PPTX_LAYOUT.title.height,
              margin: 0,
              fontFace: 'Arial',
              fontSize: 28,
              bold: true,
              color: '18202B',
              valign: 'top',
              wrap: true,
              objectName: 'Slide title',
            },
          },
        }],
        slideNumber: undefined,
      });
      titleMasters.set(definition.primaryTitle, masterName);
    });
  }

  let placement: PptxPlacement = {
    ...PPTX_LAYOUT.map,
    scale: PPTX_LAYOUT.map.width / PPTX_LOGICAL_MAP_WIDTH,
  };
  for (const [index, definition] of definitions.entries()) {
    placement = renderSlide(
      scenes[index] as ExportScene,
      definition,
      legend,
      presentation,
      request.mode === 'full',
      typographyProfile,
      iconVisibility,
      titleMasters.get(definition.primaryTitle),
    );
    request.onProgress?.(index + 1, definitions.length);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  }

  const output = await presentation.write({ outputType: 'blob', compression: true });
  if (!(output instanceof Blob)) {
    throw new Error('Die PowerPoint-Datei konnte nicht erzeugt werden.');
  }
  const scope = request.mode === 'full'
    ? 'vollstaendig'
    : fileSafe(request.options.profile);
  return {
    blob: output,
    filename: `${fileSafe(map.id)}-${scope}-${localTimestamp(createdAt)}.pptx`,
    placement,
    slideCount: definitions.length,
  };
}
