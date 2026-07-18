import type { ExportRect } from './types';

export const EXPORT_CORNER_RADII = {
  capability: 9,
  group: 10,
  hiddenBadge: 7,
  legend: 3,
} as const;

export function effectiveCornerRadius(radius: number, rect: Pick<ExportRect, 'width' | 'height'>): number {
  return Math.max(0, Math.min(radius, rect.width / 2, rect.height / 2));
}

export function roundedDividerInset(radius: number, edgeDistance: number): number {
  if (radius <= 0 || edgeDistance >= radius) return 0;
  const distanceFromCenter = radius - Math.max(0, edgeDistance);
  return radius - Math.sqrt(Math.max(0, radius ** 2 - distanceFromCenter ** 2));
}
