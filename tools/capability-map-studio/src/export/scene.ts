import { getCapabilityIconNode } from '../domain/icons';
import { layoutRootItems, type LayoutRect } from '../domain/layout';
import { getCapabilityPresentation } from '../domain/presentation';
import {
  getCapabilityShapeDefinition,
  resolveCapabilityShape,
} from '../domain/shapes';
import type {
  FilterOption,
  FilterSelection,
  NormalizedMap,
  VisibleRootItem,
} from '../domain/types';
import type { ViewProfile } from '../domain/viewState';
import type {
  ExportLegendEntry,
  ExportRect,
  ExportScene,
  ExportSceneElement,
} from './types';
import { EXPORT_CORNER_RADII } from './style';

const FRAME_PADDING = 32;
const HEADER_HEIGHT = 92;
const LEGEND_HEIGHT = 58;

const PROFILE_LABELS: Record<ViewProfile, string> = {
  'level-1': 'Ebene 1',
  'level-2': 'Ebene 2',
  'level-3': 'Ebene 3',
  all: 'Vollständig',
  custom: 'Individuell',
};

export interface BuildExportSceneOptions {
  map: NormalizedMap;
  roots: VisibleRootItem[];
  profile: ViewProfile;
  filters: FilterSelection;
  filterOptions: FilterOption[];
  search?: string;
  focusPath?: string[];
  createdAt?: Date;
}

function idOf(element: ExportSceneElement): string {
  return element.id;
}

function absoluteRect(rect: LayoutRect, parent?: ExportSceneElement): ExportRect {
  return {
    x: rect.x + (parent?.rect.x ?? 0),
    y: rect.y + (parent?.rect.y ?? 0),
    width: rect.width,
    height: rect.height,
  };
}

function readableTextColor(background: string): string {
  const red = Number.parseInt(background.slice(1, 3), 16);
  const green = Number.parseInt(background.slice(3, 5), 16);
  const blue = Number.parseInt(background.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.57 ? '#17202a' : '#ffffff';
}

function formatCreationTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

function describeFilters(
  selection: FilterSelection,
  options: FilterOption[],
  search?: string,
): string | undefined {
  const labels = new Map(options.map((option) => [option.field, option.label]));
  const parts = Object.entries(selection).flatMap(([field, values]) =>
    values.length > 0 ? [`${labels.get(field) ?? field}: ${values.join(', ')}`] : [],
  );
  const trimmedSearch = search?.trim();
  if (trimmedSearch) parts.unshift(`Suche: „${trimmedSearch}“`);
  return parts.length > 0 ? `Filter: ${parts.join(' · ')}` : undefined;
}

function buildLegend(elements: ExportSceneElement[]): ExportLegendEntry[] {
  const capabilities = elements.filter((element) => element.kind === 'capability');
  const entries: ExportLegendEntry[] = [];
  if (elements.some((element) => element.kind === 'group')) {
    entries.push({ kind: 'group', label: 'Gruppe' });
  }
  const renderedShapes = new Set(capabilities.map((element) => element.renderedShape));
  for (const shapeId of renderedShapes) {
    const definition = getCapabilityShapeDefinition(shapeId);
    if (definition) {
      entries.push({ kind: `shape:${shapeId}`, label: definition.legendLabel, shapeId });
    }
  }
  if (capabilities.some((element) => element.hiddenDescendantCount > 0)) {
    entries.push({ kind: 'hidden-descendants', label: 'Ausgeblendete Nachfahren' });
  }
  if (capabilities.some((element) => element.contextOnly)) {
    entries.push({ kind: 'context', label: 'Kontext' });
  }
  return entries;
}

export function buildExportScene({
  map,
  roots,
  profile,
  filters,
  filterOptions,
  search,
  focusPath,
  createdAt = new Date(),
}: BuildExportSceneOptions): ExportScene {
  const layout = layoutRootItems(roots);
  const positioned = new Map<string, ExportSceneElement>();
  const elements: ExportSceneElement[] = [];

  for (const node of layout) {
    const parent = node.parentId ? positioned.get(node.parentId) : undefined;
    const rect = absoluteRect(node.rect, parent);
    const element: ExportSceneElement =
      node.kind === 'group'
        ? {
            kind: 'group',
            id: node.item.group.id,
            name: node.item.group.name,
            rect,
            cornerRadius: EXPORT_CORNER_RADII.group,
            backgroundColor: node.item.group.backgroundColor,
            direction: node.item.group.layout.direction,
            collapsed: node.item.collapsed,
            autoCollapsed: node.item.autoCollapsed,
            collapsedTrackFill: node.collapsedTrackFill,
            labelSize: node.labelSize,
          }
        : (() => {
            const presentation = getCapabilityPresentation(
              rect.height,
              node.item.children.some((child) => child.kind !== 'flush'),
            );
            const geometry = resolveCapabilityShape(
              node.item.capability.shape,
              node.item.capability.layout.direction,
              rect.width,
              rect.height,
            );
            return {
              kind: 'capability',
              id: node.item.capability.id,
              name: node.item.capability.name,
              rect,
              cornerRadius: geometry.cornerRadius,
              color: node.item.capability.color,
              textColor: readableTextColor(node.item.capability.color),
              shape: node.item.capability.shape,
              renderedShape: geometry.renderedShapeId,
              geometry,
              direction: node.item.capability.layout.direction,
              iconNode: getCapabilityIconNode(node.item.capability.icon),
              compact: presentation.compact,
              minimal: presentation.minimal,
              nameLineCount: presentation.nameLineCount,
              hiddenDescendantCount: node.hiddenDescendantCount,
              contextOnly: node.item.contextOnly,
            };
          })();
    positioned.set(idOf(element), element);
    elements.push(element);
  }

  const rootElements = layout.flatMap((node) => {
    if (node.parentId) return [];
    const id = node.kind === 'group' ? node.item.group.id : node.item.capability.id;
    const element = positioned.get(id);
    return element ? [element] : [];
  });
  const logicalWidth = Math.max(1, ...rootElements.map((element) => element.rect.x + element.rect.width));
  const logicalHeight = Math.max(1, ...rootElements.map((element) => element.rect.y + element.rect.height));
  const legend = buildLegend(elements);
  const contextLines = [
    focusPath && focusPath.length > 0 ? `Fokus: ${focusPath.join(' › ')}` : undefined,
    describeFilters(filters, filterOptions, search),
  ].filter((line): line is string => Boolean(line));
  const legendHeight = legend.length > 0 ? LEGEND_HEIGHT : 0;

  return {
    width: logicalWidth + FRAME_PADDING * 2,
    height: logicalHeight + FRAME_PADDING * 2 + HEADER_HEIGHT + legendHeight,
    mapBounds: {
      x: FRAME_PADDING,
      y: FRAME_PADDING + HEADER_HEIGHT,
      width: logicalWidth,
      height: logicalHeight,
    },
    mapId: map.id,
    mapName: map.name,
    profile,
    profileLabel: PROFILE_LABELS[profile],
    createdAtIso: createdAt.toISOString(),
    createdAtLabel: formatCreationTime(createdAt),
    contextLines,
    elements,
    legend,
  };
}
