import type { IconNode } from 'lucide-react';
import PptxGenJS from 'pptxgenjs';
import { capabilityPresentationTokens } from '../domain/presentation';
import { resolveCapabilityShapeLegend } from '../domain/shapes';
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

function splitLongWord(word: string, maxWidth: number, fontSizePt: number): string[] {
  const parts: string[] = [];
  let current = '';
  for (const character of word) {
    const candidate = `${current}${character}`;
    if (current && measureArialTextInches(candidate, fontSizePt) > maxWidth) {
      parts.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapText(
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
  const tokens = text.trim().split(/\s+/).flatMap((word) =>
    measureArialTextInches(word, fontSizePt) <= maxWidth
      ? [word]
      : splitLongWord(word, maxWidth, fontSizePt),
  );
  const lines: string[] = [];
  let current = '';
  let processedTokens = 0;
  let overflow = false;

  for (const token of tokens) {
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
  return {
    width: Math.max(
      0.01,
      contentWidth - leftPadding - rightPadding - (withIcon ? iconSize + iconGap : 0),
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
  const wrapped = wrapText(
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

function buildScene(
  request: PptxExportRequest,
  definition: PptxSlideDefinition,
  createdAt: Date,
): ExportScene {
  const shared = {
    layoutOptions: {
      width: PPTX_LOGICAL_MAP_WIDTH,
      height: PPTX_LOGICAL_MAP_HEIGHT,
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
  return buildExportScene({
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
): PptxPlacement {
  const slide = presentation.addSlide();
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

  addText(definition.title, PPTX_LAYOUT.title, {
    objectName: 'Slide title',
    fontSize: 28,
    bold: true,
    color: '18202B',
    valign: 'middle',
    wrap: true,
  });

  const positionRect = (rect: ExportRect): ExportRect => ({
    x: x(rect.x),
    y: y(rect.y),
    width: size(rect.width),
    height: size(rect.height),
  });
  const capabilities = scene.elements.filter(
    (element): element is ExportCapabilityElement => element.kind === 'capability',
  );
  const typography = resolveCapabilityTypography(capabilities, scale);

  const renderGroup = (element: ExportGroupElement) => {
    const rect = positionRect(element.rect);
    const fill = mixColors(element.backgroundColor, '#ffffff', 0.78);
    const stroke = mixColors(element.backgroundColor, '#75808d', 0.72);
    const cornerRadius = effectiveCornerRadius(element.cornerRadius, element.rect) * scale;
    slide.addShape(presentation.ShapeType.roundRect, {
      x: rect.x,
      y: rect.y,
      w: rect.width,
      h: rect.height,
      objectName: `${element.id} group surface`,
      fill: { color: fill },
      line: { color: stroke, width: 0.7, dashType: element.autoCollapsed ? 'dash' : 'solid' },
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
        fontSize: 18,
        color: '4C5867',
        align: 'center',
        valign: 'middle',
        wrap: true,
      });
      return;
    }

    const verticalLabel =
      (element.direction === 'horizontal' && (!element.collapsed || element.collapsedTrackFill)) ||
      (element.direction === 'vertical' && element.collapsed && !element.collapsedBandFill);
    const labelRect: ExportRect = element.collapsed
      ? rect
      : element.direction === 'vertical'
        ? { x: rect.x, y: rect.y, width: rect.width, height: size(element.labelSize) }
        : { x: rect.x, y: rect.y, width: size(element.labelSize), height: rect.height };
    if (!element.collapsed) {
      const logicalCornerRadius = effectiveCornerRadius(element.cornerRadius, element.rect);
      const dividerInset = element.direction === 'vertical'
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
        element.direction === 'vertical'
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
    const verticalTextRect: ExportRect = {
      x: labelRect.x + labelRect.width / 2 - labelRect.height / 2 + GROUP_TEXT_INSET,
      y: labelRect.y + labelRect.height / 2 - labelRect.width / 2 + GROUP_TEXT_INSET,
      width: Math.max(0.01, labelRect.height - GROUP_TEXT_INSET * 2),
      height: Math.max(0.01, labelRect.width - GROUP_TEXT_INSET * 2),
    };
    const groupFontSize = element.groupLevel === 1 ? 16 : 14;
    addText(
      element.name,
      verticalLabel
        ? verticalTextRect
        : {
            x: labelRect.x + GROUP_TEXT_INSET,
            y: labelRect.y + GROUP_TEXT_INSET,
            width: Math.max(0.01, labelRect.width - GROUP_TEXT_INSET * 2),
            height: Math.max(0.01, labelRect.height - GROUP_TEXT_INSET * 2),
          },
      {
        objectName: `${element.id} group name`,
        fontSize: groupFontSize,
        color: '4C5867',
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
    const transparency = element.contextOnly ? 52 : 0;
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
          color: renderedChevron ? '52606D' : '141E28',
          transparency: renderedChevron ? 44 : 79,
          width: 0.7,
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
    const textWidth = Math.max(0.01, contentRect.x + contentRect.width - rightPadding - textX);
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
  const definitions = request.mode === 'current'
    ? buildCurrentPptxSlides({ ...request.options, createdAt })
    : buildFullPptxSlides(request.map);
  const scenes = definitions.map((definition) => buildScene(request, definition, createdAt));
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
