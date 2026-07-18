import { describe, expect, it } from 'vitest';
import { SAMPLE_YAML } from '../sample';
import { parseCapabilityDocument } from '../domain/parser';
import { collapsedIdsForProfile } from '../domain/viewState';
import { buildFilterOptions, computeVisibleTree } from '../domain/visibility';
import { createSvgExport } from './exportSvg';

function sampleExport() {
  const result = parseCapabilityDocument(SAMPLE_YAML);
  if (!result.ok) throw new Error('Startbeispiel ist ungültig');
  const map = result.value;
  const roots = computeVisibleTree(map, {
    collapsedIds: collapsedIdsForProfile(map, 'level-1'),
    collapsedGroupIds: new Set(),
    filters: {},
    search: '',
  });
  return createSvgExport({
    map,
    roots,
    profile: 'level-1',
    filters: {},
    filterOptions: buildFilterOptions(map),
    createdAt: new Date(2026, 6, 18, 14, 5, 9),
  });
}

describe('SVG export', () => {
  it('builds a framework-neutral scene from the current visible tree', () => {
    const { filename, scene } = sampleExport();
    const capabilities = scene.elements.filter((element) => element.kind === 'capability');
    const groups = scene.elements.filter((element) => element.kind === 'group');

    expect(filename).toBe('enterprise-capabilities-level-1-20260718-140509.svg');
    expect(scene.mapName).toBe('Enterprise Capability Map');
    expect(scene.profileLabel).toBe('Ebene 1');
    expect(capabilities).toHaveLength(50);
    expect(groups.length).toBeGreaterThan(5);
    expect(scene.mapBounds).toMatchObject({ x: 32, y: 124 });
    expect(scene.mapBounds.width).toBeGreaterThanOrEqual(1600);
    expect(scene.mapBounds.height).toBeGreaterThanOrEqual(900);
    expect(scene.legend.map((entry) => entry.kind)).toEqual(
      expect.arrayContaining(['group', 'capability']),
    );

    const nestedCapability = capabilities.find((element) => element.id === 'corporate-development');
    const parentGroup = groups.find((element) => element.id === 'enterprise-direction-group');
    expect(nestedCapability).toBeDefined();
    expect(parentGroup).toBeDefined();
    expect(nestedCapability?.rect.x).toBeGreaterThan(parentGroup?.rect.x ?? 0);
    expect(nestedCapability?.rect.y).toBeGreaterThan(parentGroup?.rect.y ?? 0);
    expect(nestedCapability?.iconNode.length).toBeGreaterThan(0);
  });

  it('renders a self-contained, valid SVG with native text and vector icons', () => {
    const { scene, svg } = sampleExport();
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const root = document.documentElement;

    expect(root.tagName).toBe('svg');
    expect(root.getAttribute('viewBox')).toBe(`0 0 ${scene.width} ${scene.height}`);
    expect(document.querySelector('parsererror')).toBeNull();
    expect(document.querySelector('foreignObject')).toBeNull();
    expect(document.querySelector('script')).toBeNull();
    expect(svg).not.toMatch(/(?:href|src)=["'](?:https?:|\/\/)/);
    expect(document.querySelectorAll('[data-kind="capability"]')).toHaveLength(50);
    expect(document.querySelector('[data-id="corporate-development"] path')).not.toBeNull();
    expect(document.querySelector('text')?.textContent).toContain('Enterprise Capability Map');
    expect(document.querySelector('[aria-label="Legende"]')).not.toBeNull();
  });

  it('uses an explicit portable baseline offset for capability text lines', () => {
    const { svg } = sampleExport();
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const capability = document.querySelector('[data-id="corporate-development"]');
    const text = capability?.querySelector('text');
    const lineCenters = [...(text?.querySelectorAll('tspan') ?? [])].map((line) =>
      Number(line.getAttribute('y')),
    );
    const iconTransform = capability?.querySelector('g[transform]')?.getAttribute('transform') ?? '';
    const iconMatch = iconTransform.match(/translate\([^ ]+ ([^)]+)\) scale\(([^)]+)\)/);
    const iconTop = Number(iconMatch?.[1]);
    const iconSize = Number(iconMatch?.[2]) * 24;
    const textCenter = lineCenters.reduce((sum, center) => sum + center, 0) / lineCenters.length;

    expect(text?.hasAttribute('dominant-baseline')).toBe(false);
    expect(
      [...(text?.querySelectorAll('tspan') ?? [])].every(
        (line) => line.getAttribute('dy') === '0.35em',
      ),
    ).toBe(true);
    expect(textCenter).toBeCloseTo(iconTop + iconSize / 2);
  });

  it('includes active focus and filter context in the export frame', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);
    if (!result.ok) throw new Error('Startbeispiel ist ungültig');
    const map = result.value;
    const filters = { owner: ['Strategy Office'] };
    const roots = computeVisibleTree(map, {
      collapsedIds: new Set(),
      collapsedGroupIds: new Set(),
      filters,
      search: 'portfolio',
      focusId: 'strategy',
    });
    const { scene, svg } = createSvgExport({
      map,
      roots,
      profile: 'custom',
      filters,
      filterOptions: buildFilterOptions(map),
      search: 'portfolio',
      focusPath: ['Strategy'],
      createdAt: new Date(2026, 6, 18, 14, 5, 9),
    });

    expect(scene.contextLines).toEqual([
      'Fokus: Strategy',
      'Filter: Suche: „portfolio“ · Owner: Strategy Office',
    ]);
    expect(svg).toContain('Fokus: Strategy');
    expect(svg).toContain('Ansicht: Individuell');
  });

  it('exports only vertical-layout value streams as chevrons', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);
    if (!result.ok) throw new Error('Startbeispiel ist ungültig');
    const map = result.value;
    const roots = computeVisibleTree(map, {
      collapsedIds: new Set(),
      collapsedGroupIds: new Set(),
      filters: {},
      search: '',
    });
    const { svg } = createSvgExport({
      map,
      roots,
      profile: 'all',
      filters: {},
      filterOptions: buildFilterOptions(map),
      createdAt: new Date(2026, 6, 18, 14, 5, 9),
    });
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const verticalStream = document.querySelector('[data-id="strategy-step-1"]');
    const horizontalStream = document.querySelector('[data-id="enterprise-portfolio-step-1"]');

    expect(verticalStream?.querySelectorAll('polygon')).toHaveLength(2);
    expect(horizontalStream?.querySelector('polygon')).toBeNull();
    expect(horizontalStream?.querySelector('rect')).not.toBeNull();
  });
});
