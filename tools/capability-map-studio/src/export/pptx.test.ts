import { describe, expect, it } from 'vitest';
import { parseCapabilityDocument } from '../domain/parser';
import { SAMPLE_YAML } from '../sample';
import { buildExportScene } from './scene';
import { buildFullPptxSlides } from './pptxDeck';
import {
  PPTX_CAPABILITY_FONT_CEILINGS,
  PPTX_LAYOUT,
  PPTX_PAGE,
  fitExportOnWideSlide,
  resolveCapabilityTypography,
} from './pptx';
import type { ExportCapabilityElement } from './types';
import { effectiveCornerRadius, roundedDividerInset } from './style';

describe('fitExportOnWideSlide', () => {
  it('fits and centers a wide export within the configured margins', () => {
    const placement = fitExportOnWideSlide(2000, 1000);
    expect(placement.width).toBeCloseTo(PPTX_PAGE.widthIn - PPTX_PAGE.marginIn * 2);
    expect(placement.x).toBeCloseTo(PPTX_PAGE.marginIn);
    expect(placement.y).toBeCloseTo((PPTX_PAGE.heightIn - placement.height) / 2);
  });

  it('rejects empty export scenes', () => {
    expect(() => fitExportOnWideSlide(0, 100)).toThrow('Exportfläche ist leer');
  });

  it('keeps design radii absolute and only clamps geometrically small shapes', () => {
    expect(effectiveCornerRadius(10, { width: 1000, height: 80 })).toBe(10);
    expect(effectiveCornerRadius(10, { width: 12, height: 80 })).toBe(6);
    expect(effectiveCornerRadius(9, { width: 100, height: 8 })).toBe(4);
  });

  it('only insets dividers that intersect a rounded corner', () => {
    expect(roundedDividerInset(10, 20)).toBe(0);
    expect(roundedDividerInset(10, 0)).toBe(10);
    expect(roundedDividerInset(10, 5)).toBeGreaterThan(1);
    expect(roundedDividerInset(10, 5)).toBeLessThan(2);
  });

  it('fills the fixed PowerPoint map aspect ratio and assigns one valid size per depth', () => {
    const parsed = parseCapabilityDocument(SAMPLE_YAML);
    if (!parsed.ok) throw new Error('Referenzmap ist ungültig');
    const definition = buildFullPptxSlides(parsed.value)[2];
    if (!definition) throw new Error('Ebene-2-Folie fehlt');
    const width = 1600;
    const height = width * (PPTX_LAYOUT.map.height / PPTX_LAYOUT.map.width);
    const scene = buildExportScene({
      map: parsed.value,
      roots: definition.roots,
      profile: 'level-2',
      filters: {},
      filterOptions: [],
      layoutOptions: { width, height },
    });
    const capabilities = scene.elements.filter(
      (element): element is ExportCapabilityElement => element.kind === 'capability',
    );
    const typography = resolveCapabilityTypography(
      capabilities,
      PPTX_LAYOUT.map.width / width,
    );

    expect(scene.mapBounds.width).toBe(width);
    expect(scene.mapBounds.height).toBeCloseTo(height);
    typography.forEach((level) => {
      expect(level.fontSizePt).toBeGreaterThan(0);
      if (level.fontSizePt > 7) expect(Number.isInteger(level.fontSizePt)).toBe(true);
      expect(level.iconSizePt).toBe(Math.min(20, level.fontSizePt + 2));
      expect(new Set([...level.items.values()].map((item) => item.showIcon)).size).toBe(1);
    });
    const sizes = [...typography.entries()].sort(([left], [right]) => left - right);
    sizes.forEach(([depth, level], index) => {
      expect(level.fontSizePt).toBeLessThanOrEqual(
        PPTX_CAPABILITY_FONT_CEILINGS[depth] ?? 7 * (0.9 ** (depth - 4)),
      );
      if (index > 0) expect(level.fontSizePt).toBeLessThan(sizes[index - 1]?.[1].fontSizePt ?? 0);
    });
  });

  it('tiles every reference-deck map across the complete fixed target area', () => {
    const parsed = parseCapabilityDocument(SAMPLE_YAML);
    if (!parsed.ok) throw new Error('Referenzmap ist ungültig');
    const width = 1600;
    const height = width * (PPTX_LAYOUT.map.height / PPTX_LAYOUT.map.width);

    buildFullPptxSlides(parsed.value).forEach((definition) => {
      const scene = buildExportScene({
        map: parsed.value,
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
        layoutOptions: { width, height },
      });
      const rootIds = new Set(definition.roots.flatMap((root) =>
        root.kind === 'flush'
          ? []
          : [root.kind === 'group' ? root.group.id : root.capability.id],
      ));
      const roots = scene.elements.filter((element) => rootIds.has(element.id));

      expect(Math.min(...roots.map((element) => element.rect.x)), definition.id).toBeCloseTo(0);
      expect(Math.min(...roots.map((element) => element.rect.y)), definition.id).toBeCloseTo(0);
      expect(
        Math.max(...roots.map((element) => element.rect.x + element.rect.width)),
        definition.id,
      ).toBeCloseTo(width);
      expect(
        Math.max(...roots.map((element) => element.rect.y + element.rect.height)),
        definition.id,
      ).toBeCloseTo(height);
    });
  });

  it('uses the harmonious fitting floor and truncates an impossible label', () => {
    const parsed = parseCapabilityDocument(SAMPLE_YAML);
    if (!parsed.ok) throw new Error('Referenzmap ist ungültig');
    const definition = buildFullPptxSlides(parsed.value)[1];
    if (!definition) throw new Error('Ebene-1-Folie fehlt');
    const scene = buildExportScene({
      map: parsed.value,
      roots: definition.roots,
      profile: 'level-1',
      filters: {},
      filterOptions: [],
      layoutOptions: { width: 1600, height: 650 },
    });
    const source = scene.elements.find(
      (element): element is ExportCapabilityElement => element.kind === 'capability',
    );
    if (!source) throw new Error('Capability fehlt');
    const impossible: ExportCapabilityElement = {
      ...source,
      name: 'Ein außergewöhnlich langer Capability-Name ohne ausreichend verfügbaren Raum',
      geometry: {
        ...source.geometry,
        contentRect: { x: 0, y: 0, width: 3, height: 2 },
      },
    };
    const level = resolveCapabilityTypography([impossible], 0.01).get(impossible.depth);

    expect(level?.fontSizePt).toBe(11);
    expect(level?.items.get(impossible.id)).toMatchObject({
      showIcon: false,
      truncated: true,
    });
    expect(level?.items.get(impossible.id)?.lines.join('')).toContain('…');
  });

  it('hides icons for an entire capability depth when one box cannot accommodate its icon', () => {
    const parsed = parseCapabilityDocument(SAMPLE_YAML);
    if (!parsed.ok) throw new Error('Referenzmap ist ungültig');
    const definition = buildFullPptxSlides(parsed.value)[1];
    if (!definition) throw new Error('Ebene-1-Folie fehlt');
    const scene = buildExportScene({
      map: parsed.value,
      roots: definition.roots,
      profile: 'level-1',
      filters: {},
      filterOptions: [],
      layoutOptions: { width: 1600, height: 650 },
    });
    const source = scene.elements.find(
      (element): element is ExportCapabilityElement => element.kind === 'capability',
    );
    if (!source) throw new Error('Capability fehlt');
    const roomy: ExportCapabilityElement = {
      ...source,
      id: 'roomy',
      name: 'A',
      geometry: {
        ...source.geometry,
        contentRect: { x: 0, y: 0, width: 2, height: 0.5 },
      },
    };
    const tight: ExportCapabilityElement = {
      ...roomy,
      id: 'tight',
      geometry: {
        ...roomy.geometry,
        contentRect: { x: 0, y: 0, width: 2, height: 0.29 },
      },
    };
    const level = resolveCapabilityTypography([roomy, tight], 1).get(source.depth);

    expect(level?.fontSizePt).toBe(12);
    expect([...level?.items.values() ?? []].every((item) => !item.showIcon)).toBe(true);
  });
});
