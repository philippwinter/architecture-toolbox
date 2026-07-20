import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_SHAPE_IDS,
  capabilityShapeTokens,
  getCapabilityShapeDefinition,
  getCapabilityShapeDefinitions,
  isCapabilityShapeId,
  resolveCapabilityShape,
} from './shapes';

describe('capability shape registry', () => {
  it('exposes the initial integrated catalog and rejects unknown IDs', () => {
    expect(CAPABILITY_SHAPE_IDS).toEqual(['box', 'chevron']);
    expect(getCapabilityShapeDefinitions().map((definition) => definition.id)).toEqual([
      'box',
      'chevron',
    ]);
    expect(isCapabilityShapeId('chevron')).toBe(true);
    expect(isCapabilityShapeId('diamond')).toBe(false);
    expect(getCapabilityShapeDefinition('diamond')).toBeUndefined();
  });

  it('resolves the canonical chevron path, stroke and safe content rectangle', () => {
    const geometry = resolveCapabilityShape('chevron', 'vertical', 200, 60);

    expect(geometry.configuredShapeId).toBe('chevron');
    expect(geometry.renderedShapeId).toBe('chevron');
    expect(geometry.strokeWidth).toBe(capabilityShapeTokens.strokeWidth);
    expect(geometry.strokeLinejoin).toBe('round');
    expect(geometry.path).toBe(
      'M 0.5 0.5 L 177.5 0.5 L 199.5 30 L 177.5 59.5 L 0.5 59.5 L 18.5 30 Z',
    );
    expect(geometry.contentRect).toEqual({ x: 18.5, y: 0.5, width: 159, height: 59 });
  });

  it('clamps chevron depths for very small rectangles without leaving the bounds', () => {
    const geometry = resolveCapabilityShape('chevron', 'vertical', 20, 10);

    expect(geometry.path).toBe(
      'M 0.5 0.5 L 15 0.5 L 19.5 5 L 15 9.5 L 0.5 9.5 L 5 5 Z',
    );
    expect(geometry.contentRect).toEqual({ x: 5, y: 0.5, width: 10, height: 9 });
    expect(geometry.contentRect.x + geometry.contentRect.width).toBeLessThanOrEqual(20);
  });

  it('keeps the configured chevron while resolving its horizontal fallback to a box', () => {
    const geometry = resolveCapabilityShape('chevron', 'horizontal', 160, 40);

    expect(geometry.configuredShapeId).toBe('chevron');
    expect(geometry.renderedShapeId).toBe('box');
    expect(geometry.cornerRadius).toBe(9);
    expect(geometry.pptxStrategy).toEqual({ kind: 'preset', preset: 'roundRect' });
  });
});
