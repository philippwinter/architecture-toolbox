import { describe, expect, it } from 'vitest';
import { parseCapabilityDocument } from '../domain/parser';
import { SAMPLE_YAML } from '../sample';
import { buildExportScene } from './scene';
import { buildFullPptxSlides } from './pptxDeck';
import {
  PPTX_CAPABILITY_FONT_CEILINGS,
  PPTX_LAYOUT_DENSITY,
  PPTX_LAYOUT,
  PPTX_PAGE,
  createPptxTypographyProfile,
  derivePptxReflowDefinitions,
  fitExportOnWideSlide,
  measureArialTextInches,
  resolveCapabilityTypography,
  resolveDeckTypographyProfile,
  wrapPptxText,
} from './pptx';
import type { ExportScene } from './types';
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

  it('keeps a token intact when fewer than three trailing characters exceed the width', () => {
    const fontSize = 10;
    const widthForThreeCharacters = measureArialTextInches('ABC', fontSize);
    const nearMiss = wrapPptxText('ABCDE', widthForThreeCharacters, 1, fontSize, true);
    const clearOverflow = wrapPptxText('ABCDEF', widthForThreeCharacters, 1, fontSize, true);

    expect(nearMiss.lines).toEqual(['ABCDE']);
    expect(nearMiss.complete).toBe(false);
    expect(clearOverflow.lines[0]).not.toBe('ABCDEF');
    expect(clearOverflow.lines[0]).toMatch(/…$/);
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
      hiddenDescendantCount: 0,
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

    expect(level?.fontSizePt).toBe(11);
    expect([...level?.items.values() ?? []].every((item) => !item.showIcon)).toBe(true);
  });

  it('builds the full-deck typography ladder bottom-up and keeps strict hierarchy', () => {
    const profile = createPptxTypographyProfile(6);

    expect(profile.overviewGroupPt).toBe(16);
    expect([...profile.openGroupPt.values()]).toEqual([12, 10]);
    expect([...profile.collapsedGroupPt.values()]).toEqual([8, 7]);
    expect([...profile.capabilityPt.values()]).toEqual([10, 8, 7, 6, 5.4, 4.9, 4.4]);
    const capabilityLadder = [...profile.capabilityPt.values()];
    capabilityLadder.slice(1).forEach((size, index) => {
      expect(size).toBeLessThan(capabilityLadder[index] ?? 0);
      if (size > 7) expect(Number.isInteger(size)).toBe(true);
    });
    expect(profile.openGroupPt.get(1)).toBeGreaterThan(profile.openGroupPt.get(2) ?? 0);
    expect(PPTX_LAYOUT_DENSITY).toEqual({ gap: 8, padding: 8 });
  });

  it('reduces an insufficient capability level once for the complete deck', () => {
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
      (element): element is ExportCapabilityElement => element.kind === 'capability' && element.depth === 0,
    );
    if (!source) throw new Error('Capability fehlt');
    const constrained: ExportCapabilityElement = {
      ...source,
      name: 'UnteilbarerSehrLangerCapabilityName',
      geometry: {
        ...source.geometry,
        contentRect: { x: 0, y: 0, width: 70, height: 30 },
      },
    };
    const constrainedScene: ExportScene = { ...scene, elements: [constrained] };
    const profile = resolveDeckTypographyProfile(
      [constrainedScene, constrainedScene],
      createPptxTypographyProfile(3),
      0.01,
    );

    expect(profile.capabilityPt.get(0)).toBe(9);
    expect(profile.capabilityPt.get(0)).toBeGreaterThan(profile.capabilityPt.get(1) ?? 0);
  });

  it('never splits an unbreakable name into character columns', () => {
    const wrapped = wrapPptxText(
      'Bedarfserfassung',
      0.18,
      0.4,
      7,
      true,
    );

    expect(wrapped.lines).toHaveLength(1);
    expect(wrapped.lines[0]).toContain('…');
    expect(wrapped.lines[0]).not.toHaveLength(1);
  });

  it('derives soft vertical flushes for a narrow value-stream sequence', () => {
    const parsed = parseCapabilityDocument(SAMPLE_YAML);
    if (!parsed.ok) throw new Error('Referenzmap ist ungültig');
    const definition = buildFullPptxSlides(parsed.value).find((slide) =>
      slide.id.endsWith('execution-system-level-4'));
    if (!definition) throw new Error('Wertstrom-Folie fehlt');
    const width = 1600;
    const height = width * (PPTX_LAYOUT.map.height / PPTX_LAYOUT.map.width);
    const scene = buildExportScene({
      map: parsed.value,
      roots: definition.roots,
      profile: 'all',
      filters: {},
      filterOptions: [],
      layoutOptions: { width, height },
    });
    const narrowScene: ExportScene = {
      ...scene,
      elements: scene.elements.map((element) => ({
        ...element,
        rect: { ...element.rect, width: Math.min(element.rect.width, 200) },
      })),
    };
    const [derived] = derivePptxReflowDefinitions(
      [definition],
      [narrowScene],
      createPptxTypographyProfile(3),
    );
    if (!derived) throw new Error('Abgeleitete Wertstrom-Folie fehlt');
    const countVerticalFlushes = (items: typeof derived.roots): number => items.reduce(
      (count, item) => count + (item.kind === 'flush' && item.direction === 'vertical' ? 1 : 0) +
        (item.kind === 'group'
          ? countVerticalFlushes(item.capabilities)
          : item.kind === 'capability'
            ? countVerticalFlushes(item.children)
            : 0),
      0,
    );

    expect(countVerticalFlushes(derived?.roots ?? [])).toBeGreaterThan(
      countVerticalFlushes(definition.roots),
    );
  });
});
