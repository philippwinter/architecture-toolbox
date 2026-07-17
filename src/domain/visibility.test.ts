import { describe, expect, it } from 'vitest';
import { SAMPLE_YAML } from '../sample';
import { parseCapabilityDocument } from './parser';
import type { VisibleCapability, VisibleRootItem } from './types';
import { buildFilterOptions, computeVisibleTree } from './visibility';

const parsed = parseCapabilityDocument(SAMPLE_YAML);
if (!parsed.ok) throw new Error('Sample document must be valid.');
const map = parsed.value;

function findInTree(
  roots: VisibleRootItem[],
  id: string,
): VisibleCapability | undefined {
  for (const root of roots) {
    if (root.kind === 'flush') continue;
    if (root.kind === 'group') {
      const groupedCapability = findInTree(root.capabilities, id);
      if (groupedCapability) return groupedCapability;
      continue;
    }
    if (root.capability.id === id) return root;
    const child = findInTree(root.children, id);
    if (child) return child;
  }
  return undefined;
}

describe('visibility', () => {
  it('keeps an unrelated collapsed subtree closed during search', () => {
    const roots = computeVisibleTree(map, {
      search: 'Technology',
      filters: {},
      collapsedIds: new Set(['operations']),
    });

    expect(findInTree(roots, 'technology')?.searchMatch).toBe(true);
    expect(findInTree(roots, 'operations')?.children).toEqual([]);
  });

  it('temporarily opens collapsed ancestors for an actual search hit', () => {
    const roots = computeVisibleTree(map, {
      search: 'Konkrete Ausprägung innerhalb von Customer.',
      filters: {},
      collapsedIds: new Set(['customer']),
    });

    expect(findInTree(roots, 'customer-insights')?.searchMatch).toBe(true);
    expect(findInTree(roots, 'customer')?.children.length).toBeGreaterThan(0);
  });

  it('keeps context ancestors and distinguishes them from direct filter matches', () => {
    const roots = computeVisibleTree(map, {
      search: '',
      filters: { owner: ['Commercial'] },
      collapsedIds: new Set(),
    });

    expect(findInTree(roots, 'customer')).toBeDefined();
    expect(findInTree(roots, 'customer')?.contextOnly).toBe(true);
    expect(findInTree(roots, 'value-proposition')?.contextOnly).toBe(false);
  });

  it('derives filter options from scalar values and scalar lists', () => {
    const options = buildFilterOptions(map);

    expect(options.find((option) => option.field === 'tags')?.values).toContain('reference');
    expect(options.find((option) => option.field === 'metadata.criticality')?.values).toEqual([
      'high',
      'medium',
    ]);
    expect(options.find((option) => option.field === 'owner')?.values).toContain('COO');
  });

  it('keeps collapsed group structure and temporarily opens it for matches', () => {
    const collapsed = computeVisibleTree(map, {
      search: '',
      filters: {},
      collapsedIds: new Set(),
      collapsedGroupIds: new Set(['strategy-governance-group']),
    });
    const collapsedGroup = collapsed.find(
      (root) => root.kind === 'group' && root.group.id === 'strategy-governance-group',
    );
    expect(collapsedGroup?.kind === 'group' ? collapsedGroup.collapsed : false).toBe(true);
    expect(collapsedGroup?.kind === 'group' ? collapsedGroup.capabilities : []).toEqual([]);

    const searched = computeVisibleTree(map, {
      search: 'Strategy',
      filters: {},
      collapsedIds: new Set(),
      collapsedGroupIds: new Set(['strategy-governance-group']),
    });
    const openedGroup = searched.find(
      (root) => root.kind === 'group' && root.group.id === 'strategy-governance-group',
    );
    expect(openedGroup?.kind === 'group' ? openedGroup.collapsed : true).toBe(false);
    expect(findInTree(searched, 'strategy')?.searchMatch).toBe(true);
  });
});
