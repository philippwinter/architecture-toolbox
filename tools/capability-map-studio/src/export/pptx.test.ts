import { describe, expect, it } from 'vitest';
import { PPTX_PAGE, fitExportOnWideSlide } from './pptx';
import { effectiveCornerRadius, roundedDividerInset } from './style';

describe('fitExportOnWideSlide', () => {
  it('fits and centers a wide export within the configured margins', () => {
    const placement = fitExportOnWideSlide(2000, 1000);
    expect(placement.width).toBeCloseTo(PPTX_PAGE.widthIn - PPTX_PAGE.marginIn * 2);
    expect(placement.x).toBeCloseTo(PPTX_PAGE.marginIn);
    expect(placement.y).toBeCloseTo((PPTX_PAGE.heightIn - placement.height) / 2);
  });

  it('rejects empty export scenes', () => {
    expect(() => fitExportOnWideSlide(0, 100)).toThrow('Exportfläche ist leer');
  });

  it('keeps design radii absolute and only clamps geometrically small shapes', () => {
    expect(effectiveCornerRadius(10, { width: 1000, height: 80 })).toBe(10);
    expect(effectiveCornerRadius(10, { width: 12, height: 80 })).toBe(6);
    expect(effectiveCornerRadius(9, { width: 100, height: 8 })).toBe(4);
  });

  it('only insets dividers that intersect a rounded corner', () => {
    expect(roundedDividerInset(10, 20)).toBe(0);
    expect(roundedDividerInset(10, 0)).toBe(10);
    expect(roundedDividerInset(10, 5)).toBeGreaterThan(1);
    expect(roundedDividerInset(10, 5)).toBeLessThan(2);
  });
});
