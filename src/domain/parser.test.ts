import { describe, expect, it } from 'vitest';
import { SAMPLE_YAML } from '../sample';
import { parseCapabilityDocument } from './parser';

describe('parseCapabilityDocument', () => {
  it('parses and normalizes the start example', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Enterprise Capability Map');
    expect(result.value.capabilitiesById).toHaveLength(13);
    expect(result.value.groupsById).toHaveLength(2);
    expect(result.value.rootItems.map((item) => item.kind)).toEqual([
      'group',
      'capability',
      'capability',
      'group',
    ]);
    expect(result.value.capabilitiesById.get('customer-insights')).toMatchObject({
      color: '#F8DFC0',
      icon: 'chart',
      parentId: 'customer',
      path: ['customer', 'customer-insights'],
      depth: 1,
    });
    expect(result.value.capabilitiesById.get('governance')).toMatchObject({
      color: '#DCE8F5',
      icon: 'shield',
      layout: { direction: 'horizontal', weight: 1 },
    });
  });

  it('reports duplicate ids with a source location', () => {
    const result = parseCapabilityDocument(`version: 1
map:
  id: duplicate-map
  name: Duplicate
  capabilities:
    - id: same
      name: One
    - id: same
      name: Two
`);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      path: 'map.capabilities[1].id',
      line: 8,
      severity: 'error',
    });
    expect(result.diagnostics[0]?.message).toContain('nicht eindeutig');
  });

  it('rejects trackWeight outside the first horizontal block item', () => {
    const result = parseCapabilityDocument(`version: 1
map:
  id: layout-map
  name: Layout
  capabilities:
    - id: first
      name: First
      layout:
        direction: horizontal
    - id: second
      name: Second
      layout:
        direction: horizontal
        trackWeight: 2
`);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.message).toContain('ersten Element');
  });

  it('rejects icons outside the allowlist', () => {
    const result = parseCapabilityDocument(`version: 1
map:
  id: icon-map
  name: Icons
  capabilities:
    - id: capability
      name: Capability
      visualization:
        icon: definitely-unknown
`);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.message).toContain('Unbekanntes Icon');
  });

  it('returns YAML syntax errors instead of throwing', () => {
    const result = parseCapabilityDocument('version: 1\nmap: [broken');

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({ path: '$', severity: 'error' });
  });

  it('parses top-level groups without inheriting their background into capabilities', () => {
    const result = parseCapabilityDocument(`version: 1
map:
  id: grouped-map
  name: Grouped
  theme:
    defaultColor: "#ABCDEF"
  capabilities:
    - type: group
      id: group-one
      name: Group One
      visualization:
        backgroundColor: "#F0F0F0"
      capabilities:
        - id: grouped-capability
          name: Grouped Capability
`);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.groupsById.get('group-one')?.backgroundColor).toBe('#F0F0F0');
    expect(result.value.capabilitiesById.get('grouped-capability')?.color).toBe('#ABCDEF');
  });

  it('requires at least one capability per group and globally unique ids', () => {
    const empty = parseCapabilityDocument(`version: 1
map:
  id: grouped-map
  name: Grouped
  capabilities:
    - type: group
      id: empty-group
      name: Empty
      capabilities: []
`);
    expect(empty.ok).toBe(false);
    expect(empty.diagnostics[0]?.message).toContain('mindestens eine Capability');

    const duplicate = parseCapabilityDocument(`version: 1
map:
  id: grouped-map
  name: Grouped
  capabilities:
    - type: group
      id: duplicate
      name: Duplicate
      capabilities:
        - id: duplicate
          name: Capability
`);
    expect(duplicate.ok).toBe(false);
    expect(duplicate.diagnostics[0]?.message).toContain('nicht eindeutig');
  });
});
