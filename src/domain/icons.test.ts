import { describe, expect, it } from 'vitest';
import { getCapabilityIcon, hasCapabilityIcon } from './icons';

describe('Lucide icon catalog', () => {
  it('resolves canonical PascalCase and kebab-case names without a manual allowlist', () => {
    expect(hasCapabilityIcon('Rocket')).toBe(true);
    expect(hasCapabilityIcon('rocket')).toBe(true);
    expect(hasCapabilityIcon('BrainCircuit')).toBe(true);
    expect(hasCapabilityIcon('brain-circuit')).toBe(true);
    expect(getCapabilityIcon('BrainCircuit')).toBe(getCapabilityIcon('brain-circuit'));
  });

  it('preserves legacy aliases and falls back for unknown names', () => {
    expect(hasCapabilityIcon('chart')).toBe(true);
    expect(hasCapabilityIcon('definitely-unknown')).toBe(false);
    expect(getCapabilityIcon('definitely-unknown')).toBe(getCapabilityIcon());
  });
});
