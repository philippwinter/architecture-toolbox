import { describe, expect, it } from 'vitest';
import { SAMPLE_YAML } from '../sample';
import { parseCapabilityDocument } from './parser';
import { collapsedIdsForProfile, mapStructureSignature } from './viewState';
import { computeVisibleTree } from './visibility';

const parsed = parseCapabilityDocument(SAMPLE_YAML);
if (!parsed.ok) throw new Error('Sample document must be valid.');
const map = parsed.value;

function visibleCapabilityCount(collapsedIds: Set<string>): number {
  const tree = computeVisibleTree(map, { search: '', filters: {}, collapsedIds });
  const count = (items: typeof tree): number =>
    items.reduce((sum, item) => {
      if (item.kind === 'flush') return sum;
      if (item.kind === 'group') return sum + count(item.capabilities);
      return sum + 1 + count(item.children);
    }, 0);
  return count(tree);
}

describe('view state profiles', () => {
  it('shows only first-level capabilities in the level-1 profile', () => {
    const collapsed = collapsedIdsForProfile(map, 'level-1');
    const tree = computeVisibleTree(map, { search: '', filters: {}, collapsedIds: collapsed });

    expect(visibleCapabilityCount(collapsed)).toBe(50);
    expect(tree.filter((item) => item.kind === 'group')).toHaveLength(5);
    expect(
      tree
        .filter((item) => item.kind === 'group')
        .every((group) => group.kind === 'group' && group.capabilities.length > 0),
    ).toBe(true);
  });

  it('provides progressively deeper predefined views', () => {
    const level1 = visibleCapabilityCount(collapsedIdsForProfile(map, 'level-1'));
    const level2 = visibleCapabilityCount(collapsedIdsForProfile(map, 'level-2'));
    const level3 = visibleCapabilityCount(collapsedIdsForProfile(map, 'level-3'));
    const all = visibleCapabilityCount(collapsedIdsForProfile(map, 'all'));

    expect(level1).toBeLessThan(level2);
    expect(level2).toBeLessThan(level3);
    expect(level3).toBeLessThan(all);
    expect(all).toBe(500);
  });

  it('signs map structure deterministically', () => {
    expect(mapStructureSignature(map)).toBe(mapStructureSignature(map));
  });
});
