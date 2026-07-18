import type { IconNode } from 'lucide-react';
import {
  capabilityPresentationTokens,
  groupPresentationTokens,
} from '../domain/presentation';
import type {
  ExportCapabilityElement,
  ExportGroupElement,
  ExportLegendEntry,
  ExportRect,
  ExportScene,
} from './types';
import { EXPORT_CORNER_RADII, effectiveCornerRadius, roundedDividerInset } from './style';

const FONT_FAMILY = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function number(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function hexToRgb(color: string): [number, number, number] | undefined {
  const value = color.match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!value) return undefined;
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function mixColors(first: string, second: string, firstRatio: number): string {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  if (!firstRgb || !secondRgb) return first;
  const values = firstRgb.map((value, index) =>
    Math.round(value * firstRatio + (secondRgb[index] ?? 0) * (1 - firstRatio)),
  );
  return `#${values.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function wrapText(text: string, maxWidth: number, fontSize: number, maxLines: number): string[] {
  if (maxWidth <= 0 || maxLines <= 0) return [];
  const maxCharacters = Math.max(1, Math.floor(maxWidth / (fontSize * 0.58)));
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  const pushLongWord = (word: string) => {
    let rest = word;
    while (rest.length > maxCharacters && lines.length < maxLines) {
      lines.push(rest.slice(0, maxCharacters));
      rest = rest.slice(maxCharacters);
    }
    current = rest;
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = '';
    if (lines.length >= maxLines) break;
    if (word.length > maxCharacters) pushLongWord(word);
    else current = word;
  }
  if (current && lines.length < maxLines) lines.push(current);
  const consumed = lines.join(' ').replaceAll(/\s+/g, '').length;
  const original = text.replaceAll(/\s+/g, '').length;
  if (consumed < original && lines.length > 0) {
    const lastIndex = lines.length - 1;
    const last = lines[lastIndex] ?? '';
    lines[lastIndex] = `${last.slice(0, Math.max(1, maxCharacters - 1)).trimEnd()}…`;
  }
  return lines;
}

function textLines(
  lines: string[],
  x: number,
  centerY: number,
  fontSize: number,
  color: string,
  anchor: 'start' | 'middle' = 'start',
  weight = 700,
): string {
  if (lines.length === 0) return '';
  const lineHeight = fontSize * capabilityPresentationTokens.nameLineHeight;
  const firstLineCenter = centerY - ((lines.length - 1) * lineHeight) / 2;
  return `<text x="${number(x)}" y="${number(centerY)}" fill="${color}" font-family="${FONT_FAMILY}" font-size="${fontSize}" font-weight="${weight}" text-anchor="${anchor}">${lines
    .map((line, index) => `<tspan x="${number(x)}" y="${number(firstLineCenter + index * lineHeight)}" dy="0.35em">${escapeXml(line)}</tspan>`)
    .join('')}</text>`;
}

function iconAttributes(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .filter(([name]) => name !== 'key')
    .map(([name, value]) => {
      const attribute = name === 'className' ? 'class' : name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${attribute}="${escapeXml(value)}"`;
    })
    .join(' ');
}

function renderIcon(iconNode: IconNode, x: number, y: number, size: number, color: string): string {
  const children = iconNode
    .map(([tag, attributes]) => `<${tag} ${iconAttributes(attributes)} />`)
    .join('');
  return `<g transform="translate(${number(x)} ${number(y)}) scale(${number(size / 24)})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${children}</g>`;
}

function chevronPoints(rect: ExportRect, inset = 0): string {
  const width = Math.max(1, rect.width - inset * 2);
  const height = Math.max(1, rect.height - inset * 2);
  const x = rect.x + inset;
  const y = rect.y + inset;
  const tip = Math.min(22, width * 0.22, height * 0.4);
  const notch = Math.min(18, width * 0.18, height * 0.34);
  return [
    [x, y],
    [x + width - tip, y],
    [x + width, y + height / 2],
    [x + width - tip, y + height],
    [x, y + height],
    [x + notch, y + height / 2],
  ]
    .map(([pointX, pointY]) => `${number(pointX ?? 0)},${number(pointY ?? 0)}`)
    .join(' ');
}

function renderCapability(element: ExportCapabilityElement, offsetX: number, offsetY: number): string {
  const rect = {
    ...element.rect,
    x: element.rect.x + offsetX,
    y: element.rect.y + offsetY,
  };
  const renderedChevron = element.shape === 'chevron' && element.direction === 'vertical';
  const displayRect = renderedChevron && element.chevronContinues
    ? { ...rect, width: rect.width + 8 }
    : rect;
  const opacity = element.contextOnly ? 0.48 : 1;
  const cornerRadius = effectiveCornerRadius(element.cornerRadius, rect);
  const surface = renderedChevron
    ? `<polygon points="${chevronPoints(displayRect)}" fill="#52606d" fill-opacity=".56"/><polygon points="${chevronPoints(displayRect, 1)}" fill="${element.color}"/>`
    : `<rect x="${number(rect.x)}" y="${number(rect.y)}" width="${number(rect.width)}" height="${number(rect.height)}" rx="${number(cornerRadius)}" fill="${element.color}" stroke="#141e28" stroke-opacity=".21"/><path d="M ${number(rect.x + cornerRadius)} ${number(rect.y + 1)} H ${number(rect.x + rect.width - cornerRadius)}" stroke="#ffffff" stroke-opacity=".14"/>`;
  const headerHeight = element.compact
    ? rect.height
    : Math.min(capabilityPresentationTokens.regularHeaderHeight, rect.height);
  const leftPadding = renderedChevron ? 25 : element.compact ? 7 : 9;
  const rightPadding = renderedChevron ? 25 : 9;
  const iconSize = element.compact
    ? capabilityPresentationTokens.compactIconSize
    : capabilityPresentationTokens.regularIconSize;
  const showIcon = !element.minimal && rect.width >= leftPadding + rightPadding + iconSize + 18;
  const iconX = rect.x + leftPadding;
  const iconY = rect.y + (headerHeight - iconSize) / 2;
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
  const headerDivider = !element.compact && !renderedChevron && rect.height > capabilityPresentationTokens.regularHeaderHeight
    ? `<line x1="${number(rect.x)}" y1="${number(rect.y + capabilityPresentationTokens.regularHeaderHeight)}" x2="${number(rect.x + rect.width)}" y2="${number(rect.y + capabilityPresentationTokens.regularHeaderHeight)}" stroke="#141e28" stroke-opacity=".13"/>`
    : '';
  const hidden = element.hiddenDescendantCount > 0 && rect.width >= 42 && rect.height >= 24
    ? `<g><rect x="${number(rect.x + rect.width - 35)}" y="${number(rect.y + rect.height - 20)}" width="28" height="14" rx="7" fill="#ffffff" fill-opacity=".25"/><text x="${number(rect.x + rect.width - 21)}" y="${number(rect.y + rect.height - 13)}" fill="${element.textColor}" font-family="${FONT_FAMILY}" font-size="9" font-weight="700" text-anchor="middle" dominant-baseline="middle">+${element.hiddenDescendantCount}</text></g>`
    : '';

  return `<g data-kind="capability" data-id="${escapeXml(element.id)}" opacity="${opacity}">${surface}${headerDivider}${showIcon ? renderIcon(element.iconNode, iconX, iconY, iconSize, element.textColor) : ''}${textLines(lines, element.minimal ? rect.x + rect.width / 2 : textX, rect.y + headerHeight / 2, fontSize, element.textColor, element.minimal ? 'middle' : 'start')}${hidden}</g>`;
}

function renderVerticalLabel(name: string, rect: ExportRect, color: string, fontSize: number): string {
  const maxCharacters = Math.max(1, Math.floor(rect.height / (fontSize * 0.62)));
  const label = name.length > maxCharacters ? `${name.slice(0, Math.max(1, maxCharacters - 1))}…` : name;
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  return `<text x="${number(centerX)}" y="${number(centerY)}" fill="${color}" font-family="${FONT_FAMILY}" font-size="${fontSize}" font-weight="700" letter-spacing=".35" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${number(centerX)} ${number(centerY)})">${escapeXml(label)}</text>`;
}

function renderGroup(element: ExportGroupElement, offsetX: number, offsetY: number): string {
  const rect = {
    ...element.rect,
    x: element.rect.x + offsetX,
    y: element.rect.y + offsetY,
  };
  const fill = mixColors(element.backgroundColor, '#ffffff', 0.78);
  const stroke = mixColors(element.backgroundColor, '#75808d', 0.72);
  const cornerRadius = effectiveCornerRadius(element.cornerRadius, rect);
  const verticalLabel =
    (element.direction === 'horizontal' && (!element.collapsed || element.collapsedTrackFill)) ||
    (element.direction === 'vertical' && element.collapsed);
  const labelRect: ExportRect = element.collapsed
    ? rect
    : element.direction === 'vertical'
      ? { x: rect.x, y: rect.y, width: rect.width, height: element.labelSize }
      : { x: rect.x, y: rect.y, width: element.labelSize, height: rect.height };
  const dividerInset = element.direction === 'vertical'
    ? roundedDividerInset(cornerRadius, Math.min(element.labelSize, rect.height - element.labelSize))
    : roundedDividerInset(cornerRadius, Math.min(element.labelSize, rect.width - element.labelSize));
  const divider = element.collapsed
    ? ''
    : element.direction === 'vertical'
      ? `<line x1="${number(rect.x + dividerInset)}" y1="${number(rect.y + element.labelSize)}" x2="${number(rect.x + rect.width - dividerInset)}" y2="${number(rect.y + element.labelSize)}" stroke="#465260" stroke-opacity=".13"/>`
      : `<line x1="${number(rect.x + element.labelSize)}" y1="${number(rect.y + dividerInset)}" x2="${number(rect.x + element.labelSize)}" y2="${number(rect.y + rect.height - dividerInset)}" stroke="#465260" stroke-opacity=".13"/>`;
  const label = verticalLabel
    ? renderVerticalLabel(
        element.name,
        labelRect,
        '#4c5867',
        element.collapsed
          ? groupPresentationTokens.collapsedNameFontSize
          : groupPresentationTokens.regularNameFontSize,
      )
    : textLines(
        wrapText(
          element.name,
          Math.max(1, labelRect.width - 20),
          groupPresentationTokens.regularNameFontSize,
          Math.max(1, Math.floor(labelRect.height / 14)),
        ),
        labelRect.x + 10,
        labelRect.y + labelRect.height / 2,
        groupPresentationTokens.regularNameFontSize,
        '#4c5867',
      );

  return `<g data-kind="group" data-id="${escapeXml(element.id)}"><rect x="${number(rect.x)}" y="${number(rect.y)}" width="${number(rect.width)}" height="${number(rect.height)}" rx="${number(cornerRadius)}" fill="${fill}" stroke="${stroke}"${element.autoCollapsed ? ' stroke-dasharray="5 4"' : ''}/>${divider}${label}</g>`;
}

function renderLegendSymbol(entry: ExportLegendEntry, x: number, y: number): string {
  switch (entry.kind) {
    case 'group':
      return `<rect x="${x}" y="${y - 7}" width="18" height="14" rx="${EXPORT_CORNER_RADII.legend}" fill="#e6ebef" stroke="#89939f"/>`;
    case 'value-stream':
      return `<polygon points="${x},${y - 7} ${x + 14},${y - 7} ${x + 20},${y} ${x + 14},${y + 7} ${x},${y + 7} ${x + 5},${y}" fill="#7ba9a0" stroke="#52606d" stroke-opacity=".56"/>`;
    case 'hidden-descendants':
      return `<rect x="${x}" y="${y - 7}" width="21" height="14" rx="${EXPORT_CORNER_RADII.hiddenBadge}" fill="#dceee9"/><text x="${x + 10.5}" y="${y}" fill="#176b5b" font-family="${FONT_FAMILY}" font-size="8" font-weight="700" text-anchor="middle" dominant-baseline="middle">+3</text>`;
    case 'context':
      return `<rect x="${x}" y="${y - 7}" width="18" height="14" rx="${EXPORT_CORNER_RADII.legend}" fill="#7ba9a0" opacity=".48"/>`;
    default:
      return `<rect x="${x}" y="${y - 7}" width="18" height="14" rx="${EXPORT_CORNER_RADII.legend}" fill="#7ba9a0" stroke="#141e28" stroke-opacity=".21"/>`;
  }
}

function renderLegend(scene: ExportScene): string {
  if (scene.legend.length === 0) return '';
  const y = scene.mapBounds.y + scene.mapBounds.height + 35;
  let x = scene.mapBounds.x;
  const items = scene.legend.map((entry) => {
    const symbol = renderLegendSymbol(entry, x, y);
    const labelX = x + 28;
    const label = `<text x="${labelX}" y="${y}" fill="#4c5867" font-family="${FONT_FAMILY}" font-size="11" dominant-baseline="middle">${escapeXml(entry.label)}</text>`;
    x += 48 + entry.label.length * 6.2;
    return `<g data-legend="${entry.kind}">${symbol}${label}</g>`;
  });
  return `<g aria-label="Legende">${items.join('')}</g>`;
}

export function renderSvg(scene: ExportScene): string {
  const titleId = 'export-title';
  const descriptionId = 'export-description';
  const context = scene.contextLines
    .map((line, index) => `<text x="${number(scene.mapBounds.x)}" y="${number(82 + index * 16)}" fill="#697383" font-family="${FONT_FAMILY}" font-size="11">${escapeXml(line)}</text>`)
    .join('');
  const elements = scene.elements
    .map((element) =>
      element.kind === 'group'
        ? renderGroup(element, scene.mapBounds.x, scene.mapBounds.y)
        : renderCapability(element, scene.mapBounds.x, scene.mapBounds.y),
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${number(scene.width)}" height="${number(scene.height)}" viewBox="0 0 ${number(scene.width)} ${number(scene.height)}" role="img" aria-labelledby="${titleId} ${descriptionId}"><title id="${titleId}">${escapeXml(scene.mapName)}</title><desc id="${descriptionId}">Capability Map, erstellt ${escapeXml(scene.createdAtLabel)}, Ansicht ${escapeXml(scene.profileLabel)}</desc><rect width="100%" height="100%" fill="#ffffff"/><text x="${number(scene.mapBounds.x)}" y="48" fill="#18202b" font-family="${FONT_FAMILY}" font-size="24" font-weight="700">${escapeXml(scene.mapName)}</text><text x="${number(scene.mapBounds.x + scene.mapBounds.width)}" y="41" fill="#4c5867" font-family="${FONT_FAMILY}" font-size="11" text-anchor="end">Erstellt: ${escapeXml(scene.createdAtLabel)}</text><text x="${number(scene.mapBounds.x + scene.mapBounds.width)}" y="59" fill="#697383" font-family="${FONT_FAMILY}" font-size="11" text-anchor="end">Ansicht: ${escapeXml(scene.profileLabel)}</text>${context}<g aria-label="Capability Map">${elements}</g>${renderLegend(scene)}</svg>`;
}
