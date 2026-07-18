import { describe, expect, it } from 'vitest';
import type {
  NormalizedCapability,
  NormalizedCapabilityGroup,
  VisibleCapability,
  VisibleCapabilityGroup,
  VisibleGroupItem,
  VisibleRootItem,
} from './types';
import { groupIntoTracks, layoutCapabilityTree, layoutRootItems } from './layout';
import { SAMPLE_YAML } from '../sample';
import { parseCapabilityDocument } from './parser';
import { computeVisibleTree } from './visibility';

function item(
  id: string,
  direction: 'horizontal' | 'vertical',
  layerWeight?: number,
  trackWeight?: number,
): VisibleCapability {
  const capability: NormalizedCapability = {
    kind: 'capability',
    id,
    name: id,
    responsibilities: [],
    tags: [],
    metadata: {},
    color: '#ffffff',
    shape: 'box',
    layout: { direction, layerWeight, trackWeight },
    children: [],
    path: [id],
    pathNames: [id],
    depth: 0,
    descendantCount: 0,
  };
  return {
    kind: 'capability',
    capability,
    children: [],
    contextOnly: false,
    searchMatch: false,
    collapsed: false,
  };
}

function group(
  id: string,
  direction: 'horizontal' | 'vertical',
  capabilities: VisibleGroupItem[],
  collapsed = false,
  trackWeight?: number,
  groupLevel: 1 | 2 = 1,
): VisibleCapabilityGroup {
  const normalized: NormalizedCapabilityGroup = {
    kind: 'group',
    id,
    name: id,
    backgroundColor: '#eeeeee',
    layout: { direction, trackWeight },
    capabilities: capabilities.map((entry) => {
      if (entry.kind === 'group') return entry.group;
      if (entry.kind === 'flush') return entry;
      return entry.capability;
    }),
    capabilityCount: capabilities.filter((entry) => entry.kind === 'capability').length,
    groupLevel,
  };
  return {
    kind: 'group',
    group: normalized,
    capabilities: collapsed ? [] : capabilities,
    collapsed,
    autoCollapsed: false,
  };
}

describe('capability layout', () => {
  it('groups [H,H,H,V,V,H,H] into four tracks', () => {
    const items = [
      item('cap-1', 'horizontal'),
      item('cap-2', 'horizontal'),
      item('cap-3', 'horizontal'),
      item('cap-4', 'vertical'),
      item('cap-5', 'vertical'),
      item('cap-6', 'horizontal'),
      item('cap-7', 'horizontal'),
    ];

    expect(
      groupIntoTracks(items).map((track) =>
        track.items.flatMap((entry) =>
          entry.kind === 'capability' ? [entry.capability.id] : [],
        ),
      ),
    ).toEqual([
      ['cap-1', 'cap-2', 'cap-3'],
      ['cap-4'],
      ['cap-5'],
      ['cap-6', 'cap-7'],
    ]);
  });

  it('uses explicit trackWeight and layerWeight overrides', () => {
    const items = [
      item('horizontal-a', 'horizontal', 1, 2),
      item('horizontal-b', 'horizontal', 3),
      item('vertical', 'vertical', undefined, 1),
    ];
    const layout = layoutCapabilityTree(items, {
      width: 300,
      height: 400,
      gap: 0,
      leafHeight: 1000,
    });
    const byId = new Map(layout.map((node) => [node.item.capability.id, node.rect]));

    expect(byId.get('horizontal-a')).toEqual({ x: 0, y: 0, width: 200, height: 100 });
    expect(byId.get('horizontal-b')).toEqual({ x: 0, y: 100, width: 200, height: 300 });
    expect(byId.get('vertical')).toEqual({ x: 200, y: 0, width: 100, height: 400 });
  });

  it('starts a new track and a new band at explicit flushes', () => {
    const roots: VisibleRootItem[] = [
      item('one', 'horizontal'),
      { kind: 'flush', direction: 'horizontal' },
      item('two', 'horizontal'),
      { kind: 'flush', direction: 'vertical' },
      item('three', 'vertical'),
    ];
    const layout = layoutRootItems(roots, { width: 400, height: 400, gap: 0, leafHeight: 1000 });
    const byId = new Map(
      layout.flatMap((node) =>
        node.kind === 'capability' ? [[node.item.capability.id, node.rect] as const] : [],
      ),
    );

    expect(byId.get('one')?.x).toBe(0);
    expect(byId.get('two')?.x).toBeGreaterThan(0);
    expect(byId.get('three')?.y).toBeGreaterThan(0);
  });

  it('tiles leaf slots completely and gives wider tracks to larger demand', () => {
    const short = item('short', 'vertical');
    const long = item('a-very-long-capability-name-that-needs-more-space', 'vertical');
    long.capability.name = 'A very long capability name that needs substantially more space';
    const layout = layoutCapabilityTree([short, long], { width: 600, height: 300, gap: 0 });
    const byId = new Map(layout.map((node) => [node.item.capability.id, node.rect]));

    expect(byId.get('short')?.height).toBe(300);
    expect(byId.get(long.capability.id)?.height).toBe(300);
    expect(
      (byId.get('short')?.width ?? 0) + (byId.get(long.capability.id)?.width ?? 0),
    ).toBeCloseTo(600);
    expect(byId.get(long.capability.id)?.width).toBeGreaterThan(byId.get('short')?.width ?? 0);
  });

  it('applies equal top and bottom padding around nested capabilities', () => {
    const child = item('child', 'vertical');
    const parent = item('parent', 'vertical');
    parent.capability.children = [child.capability];
    parent.capability.descendantCount = 1;
    parent.children = [child];

    const layout = layoutCapabilityTree([parent], {
      width: 400,
      height: 300,
      gap: 0,
      padding: 12,
      headerHeight: 48,
      minChildHeight: 0,
      minChildWidth: 0,
    });

    expect(layout[1]).toMatchObject({
      parentId: 'parent',
      rect: { x: 12, y: 60, width: 376, height: 228 },
    });
  });

  it('derives automatic demand only from currently visible children', () => {
    const deepChild = item('deep-child-with-a-long-name', 'vertical');
    deepChild.capability.name = 'A deeply nested visible capability with substantial demand';
    const parent = item('parent', 'vertical');
    parent.capability.children = [deepChild.capability];
    parent.children = [deepChild];
    const sibling = item('sibling', 'vertical');

    const expanded = layoutCapabilityTree([parent, sibling], {
      width: 800,
      height: 300,
      gap: 0,
    });
    const collapsed = layoutCapabilityTree([{ ...parent, children: [] }, sibling], {
      width: 800,
      height: 300,
      gap: 0,
    });
    const expandedParent = expanded.find((node) => node.item.capability.id === 'parent');
    const collapsedParent = collapsed.find((node) => node.item.capability.id === 'parent');

    expect(expandedParent?.rect.width).toBeGreaterThan(collapsedParent?.rect.width ?? 0);
    expect(collapsedParent?.rect.width).toBeCloseTo(400);
  });

  it('lays out nested groups with the correct React Flow parent', () => {
    const nested = group('nested', 'vertical', [item('child', 'vertical')], false, undefined, 2);
    const root = group('root', 'vertical', [nested]);
    const layout = layoutRootItems([root], { width: 500, height: 400, gap: 0 });
    const nestedNode = layout.find(
      (node) => node.kind === 'group' && node.item.group.id === 'nested',
    );
    const childNode = layout.find(
      (node) => node.kind === 'capability' && node.item.capability.id === 'child',
    );

    expect(nestedNode).toMatchObject({ parentId: 'root' });
    expect(childNode).toMatchObject({ parentId: 'nested' });
  });

  it('keeps collapsed groups as thin structural placeholders', () => {
    const roots = [
      group('horizontal-group', 'horizontal', [item('hidden-a', 'vertical')], true),
      group('vertical-group', 'vertical', [item('hidden-b', 'vertical')], true),
      item('visible', 'vertical'),
    ];
    const layout = layoutRootItems(roots, {
      width: 300,
      height: 300,
      gap: 0,
      collapsedGroupSize: 20,
    });
    const byId = new Map(
      layout.map((node) => [
        node.kind === 'group' ? node.item.group.id : node.item.capability.id,
        node.rect,
      ]),
    );

    expect(byId.get('horizontal-group')?.height).toBe(300);
    expect(byId.get('horizontal-group')?.width).toBe(20);
    expect(byId.get('vertical-group')?.width).toBe(20);
    expect(byId.has('hidden-a')).toBe(false);
    expect(byId.has('hidden-b')).toBe(false);
  });

  it('lets an all-collapsed horizontal group track tile the full height', () => {
    const roots = [
      group('collapsed-one', 'horizontal', [item('hidden-one', 'vertical')], true),
      group('collapsed-two', 'horizontal', [item('hidden-two', 'vertical')], true),
      item('visible-track', 'vertical'),
    ];
    const layout = layoutRootItems(roots, {
      width: 300,
      height: 300,
      gap: 0,
      collapsedGroupSize: 20,
    });
    const first = layout.find(
      (node) => node.kind === 'group' && node.item.group.id === 'collapsed-one',
    );
    const second = layout.find(
      (node) => node.kind === 'group' && node.item.group.id === 'collapsed-two',
    );

    expect(first).toMatchObject({
      collapsedTrackFill: true,
      rect: { x: 0, y: 0, width: 20, height: 150 },
    });
    expect(second).toMatchObject({
      collapsedTrackFill: true,
      rect: { x: 0, y: 150, width: 20, height: 150 },
    });
  });

  it('lays out all 500 reference capabilities within a bounded canvas', () => {
    const parsed = parseCapabilityDocument(SAMPLE_YAML);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const visible = computeVisibleTree(parsed.value, {
      search: '',
      filters: {},
      collapsedIds: new Set(),
    });
    const layout = layoutRootItems(visible);
    const rootNodes = layout.filter((node) => node.parentId === undefined);
    const width = Math.max(...rootNodes.map((node) => node.rect.x + node.rect.width));
    const height = Math.max(...rootNodes.map((node) => node.rect.y + node.rect.height));

    expect(layout.filter((node) => node.kind === 'capability')).toHaveLength(500);
    expect(width).toBeLessThan(30_000);
    expect(height).toBeLessThan(10_000);
  });
});
