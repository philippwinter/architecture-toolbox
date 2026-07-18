import { describe, expect, it } from 'vitest';
import { fitExportOnA3, PDF_PAGE } from './pdf';

describe('PDF placement', () => {
  it('fits a wide export proportionally inside an A3 landscape page with 10 mm margins', () => {
    const placement = fitExportOnA3(2000, 1000);

    expect(placement.width).toBe(400);
    expect(placement.height).toBe(200);
    expect(placement.x).toBe(10);
    expect(placement.y).toBe(48.5);
    expect(placement.scale).toBe(0.2);
  });

  it('fits a tall export without crossing any page margin', () => {
    const placement = fitExportOnA3(1000, 2000);

    expect(placement.x).toBeGreaterThanOrEqual(PDF_PAGE.marginMm);
    expect(placement.y).toBeGreaterThanOrEqual(PDF_PAGE.marginMm);
    expect(placement.x + placement.width).toBeLessThanOrEqual(
      PDF_PAGE.widthMm - PDF_PAGE.marginMm,
    );
    expect(placement.y + placement.height).toBeLessThanOrEqual(
      PDF_PAGE.heightMm - PDF_PAGE.marginMm,
    );
  });
});
