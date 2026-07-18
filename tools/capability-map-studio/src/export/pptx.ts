import PptxGenJS from 'pptxgenjs';
import type { IconNode } from 'lucide-react';
import {
  capabilityPresentationTokens,
  groupPresentationTokens,
} from '../domain/presentation';
import type { BuildExportSceneOptions } from './scene';
import type {
  ExportCapabilityElement,
  ExportGroupElement,
  ExportLegendEntry,
  ExportRect,
  ExportScene,
} from './types';
import { createSvgExport } from './exportSvg';
import { EXPORT_CORNER_RADII, effectiveCornerRadius, roundedDividerInset } from './style';

export const PPTX_PAGE = {
  widthIn: 13.333,
  heightIn: 7.5,
  marginIn: 0.25,
} as const;

export interface PptxPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
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

function wrapText(text: string, maxWidth: number, fontSize: number, maxLines: number): string[] {
  if (maxWidth <= 0 || maxLines <= 0) return [];
  const maxCharacters = Math.max(1, Math.floor(maxWidth / (fontSize * 0.58)));
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    while (current.length > maxCharacters && lines.length < maxLines) {
      lines.push(current.slice(0, maxCharacters));
      current = current.slice(maxCharacters);
    }
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const consumed = lines.join('').replaceAll(/\s+/g, '').length;
  if (consumed < text.replaceAll(/\s+/g, '').length && lines.length > 0) {
    const index = lines.length - 1;
    const last = lines[index] ?? '';
    lines[index] = `${last.slice(0, Math.max(1, maxCharacters - 1)).trimEnd()}…`;
  }
  return lines;
}

function renderPresentation(scene: ExportScene, presentation: PptxGenJS): PptxPlacement {
  const placement = fitExportOnWideSlide(scene.width, scene.height);
  const slide = presentation.addSlide();
  slide.background = { color: 'FFFFFF' };
  const x = (value: number) => placement.x + value * placement.scale;
  const y = (value: number) => placement.y + value * placement.scale;
  const size = (value: number) => value * placement.scale;
  const font = (pixels: number) => Math.max(4, pixels * placement.scale * 72);
  const addText = (
    text: string,
    rect: ExportRect,
    options: Partial<PptxGenJS.TextPropsOptions> = {},
  ) => slide.addText(text, {
    x: x(rect.x),
    y: y(rect.y),
    w: size(rect.width),
    h: size(rect.height),
    margin: 0,
    fontFace: 'Arial',
    breakLine: false,
    fit: 'shrink',
    ...options,
  });

  addText(scene.mapName, { x: scene.mapBounds.x, y: 20, width: scene.mapBounds.width * 0.7, height: 38 }, {
    objectName: 'Map title',
    fontSize: font(24),
    bold: true,
    color: '18202B',
    valign: 'middle',
  });
  addText(`Erstellt: ${scene.createdAtLabel}`, {
    x: scene.mapBounds.x + scene.mapBounds.width * 0.62,
    y: 27,
    width: scene.mapBounds.width * 0.38,
    height: 17,
  }, {
    objectName: 'Creation timestamp',
    fontSize: font(11),
    color: '4C5867',
    align: 'right',
    valign: 'middle',
  });
  addText(`Ansicht: ${scene.profileLabel}`, {
    x: scene.mapBounds.x + scene.mapBounds.width * 0.62,
    y: 45,
    width: scene.mapBounds.width * 0.38,
    height: 17,
  }, {
    objectName: 'View profile',
    fontSize: font(11),
    color: '697383',
    align: 'right',
    valign: 'middle',
  });
  scene.contextLines.forEach((line, index) => addText(line, {
    x: scene.mapBounds.x,
    y: 71 + index * 16,
    width: scene.mapBounds.width,
    height: 14,
  }, {
    objectName: `Context ${index + 1}`,
    fontSize: font(11),
    color: '697383',
    valign: 'middle',
  }));

  const positionRect = (rect: ExportRect): ExportRect => ({
    ...rect,
    x: rect.x + scene.mapBounds.x,
    y: rect.y + scene.mapBounds.y,
  });

  const renderGroup = (element: ExportGroupElement) => {
    const rect = positionRect(element.rect);
    const fill = mixColors(element.backgroundColor, '#ffffff', 0.78);
    const stroke = mixColors(element.backgroundColor, '#75808d', 0.72);
    const cornerRadius = effectiveCornerRadius(element.cornerRadius, rect);
    slide.addShape(presentation.ShapeType.roundRect, {
      x: x(rect.x), y: y(rect.y), w: size(rect.width), h: size(rect.height),
      objectName: `${element.id} group surface`,
      fill: { color: fill },
      line: { color: stroke, width: 0.7, dashType: element.autoCollapsed ? 'dash' : 'solid' },
      rectRadius: size(cornerRadius),
    });
    const verticalLabel =
      (element.direction === 'horizontal' && (!element.collapsed || element.collapsedTrackFill)) ||
      (element.direction === 'vertical' && element.collapsed);
    const labelRect: ExportRect = element.collapsed
      ? rect
      : element.direction === 'vertical'
        ? { x: rect.x, y: rect.y, width: rect.width, height: element.labelSize }
        : { x: rect.x, y: rect.y, width: element.labelSize, height: rect.height };
    if (!element.collapsed) {
      const dividerInset = element.direction === 'vertical'
        ? roundedDividerInset(cornerRadius, Math.min(element.labelSize, rect.height - element.labelSize))
        : roundedDividerInset(cornerRadius, Math.min(element.labelSize, rect.width - element.labelSize));
      slide.addShape(presentation.ShapeType.line, element.direction === 'vertical'
        ? {
            x: x(rect.x + dividerInset), y: y(rect.y + element.labelSize), w: size(rect.width - dividerInset * 2), h: 0,
            objectName: `${element.id} label divider`,
            line: { color: '465260', transparency: 87, width: 0.5 },
          }
        : {
            x: x(rect.x + element.labelSize), y: y(rect.y + dividerInset), w: 0, h: size(rect.height - dividerInset * 2),
            objectName: `${element.id} label divider`,
            line: { color: '465260', transparency: 87, width: 0.5 },
          });
    }
    const verticalTextRect: ExportRect = {
      x: labelRect.x + labelRect.width / 2 - labelRect.height / 2,
      y: labelRect.y + labelRect.height / 2 - labelRect.width / 2,
      width: labelRect.height,
      height: labelRect.width,
    };
    addText(element.name, verticalLabel ? verticalTextRect : {
      x: labelRect.x + 10,
      y: labelRect.y,
      width: labelRect.width - 20,
      height: labelRect.height,
    }, {
      objectName: `${element.id} group name`,
      fontSize: font(
        element.collapsed
          ? groupPresentationTokens.collapsedNameFontSize
          : groupPresentationTokens.regularNameFontSize,
      ),
      bold: true,
      color: '4C5867',
      valign: 'middle',
      align: verticalLabel ? 'center' : 'left',
      rotate: verticalLabel ? 270 : 0,
      charSpacing: verticalLabel ? 0.35 : 0,
      wrap: true,
    });
  };

  const renderCapability = (element: ExportCapabilityElement) => {
    const rect = positionRect(element.rect);
    const renderedChevron = element.shape === 'chevron' && element.direction === 'vertical';
    const transparency = element.contextOnly ? 52 : 0;
    const cornerRadius = effectiveCornerRadius(element.cornerRadius, rect);
    slide.addShape(renderedChevron ? presentation.ShapeType.chevron : presentation.ShapeType.roundRect, {
      x: x(rect.x), y: y(rect.y),
      w: size(rect.width + (renderedChevron && element.chevronContinues ? 8 : 0)),
      h: size(rect.height),
      objectName: `${element.id} capability surface`,
      fill: { color: color(element.color), transparency },
      line: { color: renderedChevron ? '52606D' : '141E28', transparency: renderedChevron ? 44 : 79, width: 0.7 },
      rectRadius: renderedChevron ? undefined : size(cornerRadius),
    });
    const headerHeight = element.compact
      ? rect.height
      : Math.min(capabilityPresentationTokens.regularHeaderHeight, rect.height);
    const leftPadding = renderedChevron ? 25 : element.compact ? 7 : 9;
    const rightPadding = renderedChevron ? 25 : 9;
    const iconSize = element.compact
      ? capabilityPresentationTokens.compactIconSize
      : capabilityPresentationTokens.regularIconSize;
    const showIcon = !element.minimal && rect.width >= leftPadding + rightPadding + iconSize + 18;
    if (
      !element.compact &&
      !renderedChevron &&
      rect.height > capabilityPresentationTokens.regularHeaderHeight
    ) {
      slide.addShape(presentation.ShapeType.line, {
        x: x(rect.x),
        y: y(rect.y + capabilityPresentationTokens.regularHeaderHeight),
        w: size(rect.width),
        h: 0,
        objectName: `${element.id} header divider`,
        line: { color: '141E28', transparency: 87, width: 0.5 },
      });
    }
    const iconX = rect.x + leftPadding;
    if (showIcon) {
      slide.addImage({
        data: iconData(element.iconNode, element.textColor),
        x: x(iconX),
        y: y(rect.y + (headerHeight - iconSize) / 2),
        w: size(iconSize),
        h: size(iconSize),
        objectName: `${element.id} icon`,
        altText: `${element.name} icon`,
        transparency,
      });
    }
    const textX = showIcon
      ? iconX + iconSize + capabilityPresentationTokens.iconTextGap
      : rect.x + leftPadding;
    const availableTextWidth = Math.max(1, rect.x + rect.width - rightPadding - textX);
    const fontSize = element.minimal
      ? capabilityPresentationTokens.minimalNameFontSize
      : element.compact
        ? capabilityPresentationTokens.compactNameFontSize
        : capabilityPresentationTokens.regularNameFontSize;
    const lines = wrapText(element.name, availableTextWidth, fontSize, element.nameLineCount);
    addText(lines.join('\n'), {
      x: element.minimal ? rect.x + leftPadding : textX,
      y: rect.y,
      width: element.minimal ? rect.width - leftPadding - rightPadding : availableTextWidth,
      height: headerHeight,
    }, {
      objectName: `${element.id} capability name`,
      fontSize: font(fontSize),
      bold: true,
      color: color(element.textColor),
      align: element.minimal ? 'center' : 'left',
      valign: 'middle',
      wrap: true,
      transparency,
    });
    if (element.hiddenDescendantCount > 0 && rect.width >= 42 && rect.height >= 24) {
      slide.addShape(presentation.ShapeType.roundRect, {
        x: x(rect.x + rect.width - 35), y: y(rect.y + rect.height - 20),
        w: size(28), h: size(14),
        objectName: `${element.id} hidden descendants badge`,
        fill: { color: 'FFFFFF', transparency: 75 },
        line: { transparency: 100 },
        rectRadius: size(EXPORT_CORNER_RADII.hiddenBadge),
      });
      addText(`+${element.hiddenDescendantCount}`, {
        x: rect.x + rect.width - 35,
        y: rect.y + rect.height - 20,
        width: 28,
        height: 14,
      }, {
        objectName: `${element.id} hidden descendants count`,
        fontSize: font(9), bold: true, color: color(element.textColor),
        align: 'center', valign: 'middle', transparency,
      });
    }
  };

  scene.elements.forEach((element) => {
    if (element.kind === 'group') renderGroup(element);
    else renderCapability(element);
  });

  if (scene.legend.length > 0) {
    let legendX = scene.mapBounds.x;
    const legendY = scene.mapBounds.y + scene.mapBounds.height + 28;
    const renderLegendSymbol = (entry: ExportLegendEntry) => {
      const objectName = `Legend ${entry.kind}`;
      if (entry.kind === 'value-stream') {
        slide.addShape(presentation.ShapeType.chevron, {
          x: x(legendX), y: y(legendY), w: size(20), h: size(14), objectName,
          fill: { color: '7BA9A0' }, line: { color: '52606D', transparency: 44, width: 0.5 },
        });
      } else {
        const symbolColor = entry.kind === 'group' ? 'E6EBEF' : entry.kind === 'hidden-descendants' ? 'DCEEE9' : '7BA9A0';
        slide.addShape(presentation.ShapeType.roundRect, {
          x: x(legendX), y: y(legendY), w: size(entry.kind === 'hidden-descendants' ? 21 : 18), h: size(14), objectName,
          fill: { color: symbolColor, transparency: entry.kind === 'context' ? 52 : 0 },
          line: { color: entry.kind === 'group' ? '89939F' : '141E28', transparency: entry.kind === 'group' ? 0 : 79, width: 0.5 },
          rectRadius: size(entry.kind === 'hidden-descendants' ? EXPORT_CORNER_RADII.hiddenBadge : EXPORT_CORNER_RADII.legend),
        });
      }
    };
    scene.legend.forEach((entry) => {
      renderLegendSymbol(entry);
      addText(entry.label, { x: legendX + 28, y: legendY, width: entry.label.length * 7, height: 14 }, {
        objectName: `Legend ${entry.kind} label`,
        fontSize: font(11), color: '4C5867', valign: 'middle',
      });
      legendX += 48 + entry.label.length * 6.2;
    });
  }
  return placement;
}

export async function createPptxExport(options: BuildExportSceneOptions): Promise<{
  blob: Blob;
  filename: string;
  placement: PptxPlacement;
}> {
  const createdAt = options.createdAt ?? new Date();
  const { filename: svgFilename, scene } = createSvgExport({ ...options, createdAt });
  const presentation = new PptxGenJS();
  presentation.layout = 'LAYOUT_WIDE';
  presentation.author = 'Capability Map Studio';
  presentation.company = 'Capability Map Studio';
  presentation.subject = `Capability Map · ${scene.profileLabel}`;
  presentation.title = scene.mapName;
  presentation.revision = '1';
  presentation.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };
  presentation.defineLayout({ name: 'CAPMAP_WIDE', width: PPTX_PAGE.widthIn, height: PPTX_PAGE.heightIn });
  presentation.layout = 'CAPMAP_WIDE';
  const placement = renderPresentation(scene, presentation);
  const output = await presentation.write({ outputType: 'blob', compression: true });
  if (!(output instanceof Blob)) throw new Error('Die PowerPoint-Datei konnte nicht erzeugt werden.');
  return {
    blob: output,
    filename: svgFilename.replace(/\.svg$/i, '.pptx'),
    placement,
  };
}
