import { describe, expect, it } from 'vitest';
import { SAMPLE_YAML } from '../sample';
import { parseCapabilityDocument } from './parser';

describe('parseCapabilityDocument', () => {
  it('parses and normalizes the start example', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);

    expect(result.ok, JSON.stringify(result.diagnostics, null, 2)).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('Enterprise Capability Map');
    expect(result.value.capabilitiesById).toHaveLength(500);
    expect(result.value.groupsById).toHaveLength(14);
    expect(result.value.rootItems.map((item) => item.kind)).toEqual([
      'group',
      'group',
      'flush',
      'group',
      'group',
      'flush',
      'group',
    ]);
    expect(result.value.capabilitiesById.get('customer-insights')).toMatchObject({
      color: '#F8DFC0',
      icon: 'Search',
      parentId: 'customer',
      path: ['customer', 'customer-insights'],
      depth: 1,
    });
    expect(result.value.capabilitiesById.get('corporate-governance')).toMatchObject({
      color: '#D7E9F7',
      icon: 'Scale',
      layout: { direction: 'horizontal' },
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
    expect(result.diagnostics[0]?.message).toContain('ersten fachlichen Element');
  });

  it('supports multiple mixed flushes and rejects empty layout segments', () => {
    const valid = parseCapabilityDocument(`version: 1
map:
  id: flush-map
  name: Flushes
  capabilities:
    - id: one
      name: One
    - type: flush
      direction: horizontal
    - id: two
      name: Two
    - type: flush
      direction: vertical
    - id: three
      name: Three
`);
    expect(valid.ok).toBe(true);

    const invalid = parseCapabilityDocument(`version: 1
map:
  id: flush-map
  name: Flushes
  capabilities:
    - type: flush
      direction: horizontal
    - id: one
      name: One
`);
    expect(invalid.ok).toBe(false);
    expect(invalid.diagnostics[0]?.message).toContain('Anfang oder Ende');
  });

  it('validates layerWeight, removed weight and chevron leaves', () => {
    const removedWeight = parseCapabilityDocument(`version: 1
map:
  id: old-layout
  name: Old
  capabilities:
    - id: one
      name: One
      layout:
        weight: 2
`);
    expect(removedWeight.ok).toBe(false);
    expect(removedWeight.diagnostics[0]?.message).toContain('layerWeight');

    const invalidChevron = parseCapabilityDocument(`version: 1
map:
  id: chevron-map
  name: Chevron
  capabilities:
    - id: parent
      name: Parent
      visualization:
        shape: chevron
      children:
        - id: child
          name: Child
`);
    expect(invalidChevron.ok).toBe(false);
    expect(invalidChevron.diagnostics[0]?.message).toContain('Blatt-Capabilities');

    const invalidLayer = parseCapabilityDocument(`version: 1
map:
  id: layer-map
  name: Layer
  capabilities:
    - id: one
      name: One
      layout:
        direction: vertical
        layerWeight: 2
`);
    expect(invalidLayer.ok).toBe(false);
    expect(invalidLayer.diagnostics[0]?.message).toContain('direction: horizontal');
  });

  it('allows exactly two group levels', () => {
    const invalid = parseCapabilityDocument(`version: 1
map:
  id: group-map
  name: Groups
  capabilities:
    - type: group
      id: level-one
      name: One
      capabilities:
        - type: group
          id: level-two
          name: Two
          capabilities:
            - type: group
              id: level-three
              name: Three
              capabilities:
                - id: capability
                  name: Capability
`);
    expect(invalid.ok).toBe(false);
    expect(invalid.diagnostics.some((entry) => entry.message.includes('höchstens zwei'))).toBe(true);
  });

  it('accepts every installed Lucide icon and rejects unknown names', () => {
    const valid = parseCapabilityDocument(`version: 1
map:
  id: icon-map
  name: Icons
  capabilities:
    - id: rocket-capability
      name: Rocket
      visualization:
        icon: rocket
    - id: brain-capability
      name: Brain
      visualization:
        icon: BrainCircuit
`);

    expect(valid.ok).toBe(true);
    if (!valid.ok) return;
    expect(valid.value.capabilitiesById.get('rocket-capability')?.icon).toBe('rocket');
    expect(valid.value.capabilitiesById.get('brain-capability')?.icon).toBe('BrainCircuit');

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
    expect(result.diagnostics[0]?.message).toContain('Unbekanntes Lucide-Icon');
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
