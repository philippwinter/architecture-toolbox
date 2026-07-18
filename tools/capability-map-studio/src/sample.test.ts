import { describe, expect, it } from 'vitest';
import { parseCapabilityDocument } from './domain/parser';
import { SAMPLE_YAML } from './sample';

describe('reference map icons', () => {
  it('assigns a valid explicit icon to every capability', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const capabilities = [...result.value.capabilitiesById.values()];
    const icons = capabilities.map((capability) => capability.explicitIcon);
    expect(capabilities).toHaveLength(500);
    expect(icons.every(Boolean)).toBe(true);
    expect(new Set(icons).size).toBeGreaterThanOrEqual(50);
  });

  it('uses domain-specific icons for representative top-level capabilities', () => {
    const result = parseCapabilityDocument(SAMPLE_YAML);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.capabilitiesById.get('corporate-development')?.icon).toBe('Building2');
    expect(result.value.capabilitiesById.get('customer-service')?.icon).toBe('Headset');
    expect(result.value.capabilitiesById.get('cybersecurity')?.icon).toBe('ShieldCheck');
    expect(result.value.capabilitiesById.get('supply-chain')?.icon).toBe('Truck');
  });
});
