import { describe, expect, it } from 'vitest';
import { parseCapabilityDocument } from '../domain/parser';
import type { CapabilityMapInput } from '../domain/types';
import { SAMPLE_YAML } from '../sample';
import { buildFullPptxSlides } from './pptxDeck';

function parsedMap(input: CapabilityMapInput) {
  const result = parseCapabilityDocument(JSON.stringify(input));
  if (!result.ok) throw new Error(result.diagnostics.map((entry) => entry.message).join('\n'));
  return result.value;
}

describe('buildFullPptxSlides', () => {
  it('creates one reference slide per expandable capability in hierarchical order', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);
    if (!result.ok) throw new Error('Referenzmap ist ungültig');
    const slides = buildFullPptxSlides(result.value);

    expect(slides).toHaveLength(95);
    expect(slides.slice(0, 10).map((slide) => slide.id)).toEqual([
      'overview',
      'level-1',
      'strategy-governance-group-level-1',
      'market-customer-group-level-1',
      'products-operations-group-level-1',
      'people-organisation-group-level-1',
      'enablers-risk-group-level-1',
      'strategy-governance-group-enterprise-direction-group-strategy-level-2',
      'strategy-governance-group-enterprise-direction-group-business-model-level-2',
      'strategy-governance-group-enterprise-direction-group-purpose-and-vision-level-2',
    ]);
    expect(slides.slice(0, 4).map((slide) => slide.title)).toEqual([
      'Enterprise Capability Map – Übersicht',
      'Enterprise Capability Map – Ebene 1',
      'Enterprise Capability Map – Ebene 1 – Strategy & Governance',
      'Enterprise Capability Map – Ebene 1 – Market & Customer',
    ]);
    expect(slides[7]?.title).toBe(
      'Enterprise Capability Map – Ebene 2 – Strategy & Governance › Enterprise Direction · Fokus: Strategy',
    );
    expect(slides[7]).toMatchObject({
      primaryTitle: 'Enterprise Capability Map – Ebene 2',
      contextTitle: 'Strategy & Governance › Enterprise Direction · Fokus: Strategy',
      metadataParts: [],
    });
    expect(slides[7]?.series).toBe('subgroup');
    expect(slides.at(-1)?.id).toBe(
      'enablers-risk-group-procurement-and-facilities-execution-system-level-4',
    );
  });

  it('opens only the active group path and collapses all other groups', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);
    if (!result.ok) throw new Error('Referenzmap ist ungültig');
    const slide = buildFullPptxSlides(result.value).find(
      (candidate) => candidate.id ===
        'market-customer-group-market-intelligence-group-market-intelligence-level-2',
    );
    const groups = slide?.roots.filter((root) => root.kind === 'group') ?? [];

    expect(groups.find((root) => root.kind === 'group' && root.group.id === 'market-customer-group')?.collapsed).toBe(false);
    expect(groups.filter((root) => root.kind === 'group' && root.group.id !== 'market-customer-group').every((root) => root.kind === 'group' && root.collapsed)).toBe(true);
    expect(slide?.roots.some((root) => root.kind === 'capability')).toBe(false);
  });

  it('focuses one capability branch and collapses its sibling capabilities', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);
    if (!result.ok) throw new Error('Referenzmap ist ungültig');
    const slide = buildFullPptxSlides(result.value).find(
      (candidate) => candidate.id ===
        'strategy-governance-group-enterprise-direction-group-strategy-level-2',
    );
    const topGroups = slide?.roots.filter((root) => root.kind === 'group') ?? [];
    const activeTop = topGroups.find(
      (root) => root.kind === 'group' && root.group.id === 'strategy-governance-group',
    );
    const subgroups = activeTop?.kind === 'group'
      ? activeTop.capabilities.filter((item) => item.kind === 'group')
      : [];

    expect(slide?.focus).toEqual({
      kind: 'capability',
      capabilityId: 'strategy',
      topGroupId: 'strategy-governance-group',
      subgroupId: 'enterprise-direction-group',
    });
    expect(activeTop?.kind === 'group' && activeTop.collapsed).toBe(false);
    expect(subgroups.find((group) => group.kind === 'group' && group.group.id === 'enterprise-direction-group')?.collapsed).toBe(false);
    expect(subgroups.filter((group) => group.kind === 'group' && group.group.id !== 'enterprise-direction-group').every((group) => group.kind === 'group' && group.collapsed)).toBe(true);
    expect(activeTop?.kind === 'group' && activeTop.capabilities.some((item) => item.kind === 'capability')).toBe(false);
    expect(topGroups.filter((group) => group.kind === 'group' && group.group.id !== 'strategy-governance-group').every((group) => group.kind === 'group' && group.collapsed)).toBe(true);

    const activeSubgroup = subgroups.find(
      (group) => group.kind === 'group' && group.group.id === 'enterprise-direction-group',
    );
    const capabilities = activeSubgroup?.kind === 'group'
      ? activeSubgroup.capabilities.filter((item) => item.kind === 'capability')
      : [];
    const focused = capabilities.find(
      (item) => item.kind === 'capability' && item.capability.id === 'strategy',
    );
    expect(focused?.kind === 'capability' && focused.collapsed).toBe(false);
    expect(focused?.kind === 'capability' && focused.children.length).toBeGreaterThan(0);
    expect(focused?.kind === 'capability' && focused.presentationRole).toBe('focus');
    expect(focused?.kind === 'capability' && focused.children.every((child) =>
      child.kind === 'flush' || child.presentationRole === 'focus-child')).toBe(true);
    expect(capabilities.filter(
      (item) => item.kind === 'capability' && item.capability.id !== 'strategy',
    ).every((item) => item.kind === 'capability' && item.collapsed &&
      item.presentationRole === 'context')).toBe(true);
  });

  it('adds an ungrouped detail series only when ungrouped roots have descendants', () => {
    const map = parsedMap({
      version: 1,
      map: {
        id: 'mixed',
        name: 'Mixed',
        capabilities: [
          {
            type: 'group',
            id: 'grouped',
            name: 'Grouped',
            capabilities: [{ id: 'grouped-root', name: 'Grouped root' }],
          },
          {
            id: 'ungrouped-root',
            name: 'Ungrouped root',
            children: [{ id: 'ungrouped-child', name: 'Ungrouped child' }],
          },
        ],
      },
    });

    const slides = buildFullPptxSlides(map);
    expect(slides.map((slide) => slide.id)).toContain('ungrouped-root-level-2');
    expect(slides.map((slide) => slide.id)).not.toContain('grouped-grouped-root-level-2');
    const ungrouped = slides.find((slide) => slide.id === 'ungrouped-root-level-2');
    expect(ungrouped?.roots.find((root) => root.kind === 'group')?.collapsed).toBe(true);
    expect(ungrouped?.focus).toEqual({
      kind: 'capability',
      capabilityId: 'ungrouped-root',
    });
  });

  it('uses large top-group shells without rendering their contents on the overview', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);
    if (!result.ok) throw new Error('Referenzmap ist ungültig');
    const overview = buildFullPptxSlides(result.value)[0];
    const groups = overview?.roots.filter((root) => root.kind === 'group') ?? [];

    expect(overview?.kind).toBe('overview');
    expect(groups).toHaveLength(5);
    expect(groups.every((root) => root.kind === 'group' && !root.collapsed && root.capabilities.length === 0)).toBe(true);
  });
});
