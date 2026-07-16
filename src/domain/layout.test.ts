import { describe, expect, it } from 'vitest';
import type {
  NormalizedCapability,
  NormalizedCapabilityGroup,
  VisibleCapability,
  VisibleCapabilityGroup,
} from './types';
import { groupIntoTracks, layoutCapabilityTree, layoutRootItems } from './layout';

function item(
  id: string,
  direction: 'horizontal' | 'vertical',
  weight = 1,
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
    layout: { direction, weight, trackWeight },
    children: [],
    path: [id],
    pathNames: [id],
    depth: 0,
    descendantCount: 0,
  };
  return { kind: 'capability', capability, children: [], contextOnly: false, searchMatch: false };
}

function group(
  id: string,
  direction: 'horizontal' | 'vertical',
  capabilities: VisibleCapability[],
  collapsed = false,
  trackWeight?: number,
): VisibleCapabilityGroup {
  const normalized: NormalizedCapabilityGroup = {
    kind: 'group',
    id,
    name: id,
    backgroundColor: '#eeeeee',
    layout: { direction, weight: 1, trackWeight },
    capabilities: capabilities.map((entry) => entry.capability),
    capabilityCount: capabilities.length,
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

    expect(groupIntoTracks(items).map((track) => track.items.map((entry) => entry.capability.id))).toEqual([
      ['cap-1', 'cap-2', 'cap-3'],
      ['cap-4'],
      ['cap-5'],
      ['cap-6', 'cap-7'],
    ]);

    const layout = layoutCapabilityTree(items, {
      width: 400,
      height: 300,
      gap: 0,
      padding: 0,
      headerHeight: 0,
      minChildHeight: 0,
      minChildWidth: 0,
    });
    const rect = (id: string) => layout.find((node) => node.item.capability.id === id)?.rect;

    expect(rect('cap-1')).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(rect('cap-3')).toEqual({ x: 0, y: 200, width: 100, height: 100 });
    expect(rect('cap-4')).toEqual({ x: 100, y: 0, width: 100, height: 300 });
    expect(rect('cap-5')).toEqual({ x: 200, y: 0, width: 100, height: 300 });
    expect(rect('cap-7')).toEqual({ x: 300, y: 150, width: 100, height: 150 });
  });

  it('uses weights for vertical tracks and horizontal stack heights', () => {
    const items = [
      item('horizontal-a', 'horizontal', 1, 2),
      item('horizontal-b', 'horizontal', 3),
      item('vertical', 'vertical', 1),
    ];
    const layout = layoutCapabilityTree(items, {
      width: 300,
      height: 400,
      gap: 0,
      padding: 0,
      headerHeight: 0,
    });
    const byId = new Map(layout.map((node) => [node.item.capability.id, node.rect]));

    expect(byId.get('horizontal-a')).toEqual({ x: 0, y: 0, width: 200, height: 100 });
    expect(byId.get('horizontal-b')).toEqual({ x: 0, y: 100, width: 200, height: 300 });
    expect(byId.get('vertical')).toEqual({ x: 200, y: 0, width: 100, height: 400 });
  });

  it('summarizes descendants when the child area is too small', () => {
    const child = item('child', 'vertical');
    const parent = item('parent', 'vertical');
    parent.capability.children = [child.capability];
    parent.capability.descendantCount = 1;
    parent.children = [child];

    const layout = layoutCapabilityTree([parent], { width: 100, height: 60 });

    expect(layout).toHaveLength(1);
    expect(layout[0]).toMatchObject({ renderedChildCount: 0, hiddenDescendantCount: 1 });
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

  it('reserves a top label for vertical groups and a left label for horizontal groups', () => {
    const vertical = layoutRootItems([group('vertical-group', 'vertical', [item('child', 'vertical')])], {
      width: 400,
      height: 300,
      gap: 0,
      padding: 10,
      groupHeaderHeight: 40,
    });
    expect(vertical[0]).toMatchObject({ kind: 'group', rect: { width: 400, height: 300 } });
    expect(vertical[1]).toMatchObject({
      kind: 'capability',
      parentId: 'vertical-group',
      rect: { x: 10, y: 50, width: 380, height: 240 },
    });

    const horizontal = layoutRootItems(
      [group('horizontal-group', 'horizontal', [item('child', 'vertical')])],
      { width: 400, height: 300, gap: 0, padding: 10, groupHeaderHeight: 40 },
    );
    expect(horizontal[1]).toMatchObject({
      kind: 'capability',
      parentId: 'horizontal-group',
      rect: { x: 50, y: 10, width: 340, height: 280 },
    });
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

    expect(byId.get('horizontal-group')?.height).toBe(20);
    expect(byId.get('vertical-group')?.width).toBe(20);
    expect(byId.has('hidden-a')).toBe(false);
    expect(byId.has('hidden-b')).toBe(false);
  });

  it('releases the trackWeight space of a fully collapsed horizontal group track', () => {
    const roots = [
      group('h', 'horizontal', [item('hidden', 'vertical')], true, 4),
      item('visible-a', 'vertical'),
      item('visible-b', 'vertical'),
    ];
    const layout = layoutRootItems(roots, {
      width: 600,
      height: 300,
      gap: 0,
      groupLabelWidth: 80,
    });
    const byId = new Map(
      layout.map((node) => [
        node.kind === 'group' ? node.item.group.id : node.item.capability.id,
        node.rect,
      ]),
    );

    expect(byId.get('h')).toEqual({ x: 0, y: 0, width: 80, height: 22 });
    expect(byId.get('visible-a')).toEqual({ x: 80, y: 0, width: 260, height: 300 });
    expect(byId.get('visible-b')).toEqual({ x: 340, y: 0, width: 260, height: 300 });
  });
});
