import type { LayoutDirection } from './types';

export const CAPABILITY_SHAPE_IDS = ['box', 'chevron'] as const;

export type CapabilityShapeId = (typeof CAPABILITY_SHAPE_IDS)[number];
export type ShapeStrokeLinejoin = 'miter' | 'round' | 'bevel';

export interface ShapeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CapabilityShapeGeometry {
  configuredShapeId: CapabilityShapeId;
  renderedShapeId: CapabilityShapeId;
  bounds: ShapeRect;
  path: string;
  contentRect: ShapeRect;
  strokeWidth: number;
  strokeLinejoin: ShapeStrokeLinejoin;
  cornerRadius: number;
  pptxStrategy:
    | { kind: 'preset'; preset: 'roundRect' | 'chevron' }
    | { kind: 'freeform' };
}

export interface CapabilityShapeDefinition {
  id: CapabilityShapeId;
  displayName: string;
  legendLabel: string;
  leafOnly: boolean;
  fallbackByDirection?: Partial<Record<LayoutDirection, CapabilityShapeId>>;
  preferredHorizontalOverhead: number;
  resolve: (width: number, height: number) => Omit<
    CapabilityShapeGeometry,
    'configuredShapeId' | 'renderedShapeId'
  >;
}

export const capabilityShapeTokens = {
  strokeWidth: 1,
  boxCornerRadius: 9,
  chevronTipDepth: 22,
  chevronNotchDepth: 18,
  chevronSegmentGap: 4,
} as const;

function number(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function clampDimension(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function roundedRectGeometry(
  widthValue: number,
  heightValue: number,
): Omit<CapabilityShapeGeometry, 'configuredShapeId' | 'renderedShapeId'> {
  const width = clampDimension(widthValue);
  const height = clampDimension(heightValue);
  const strokeWidth = capabilityShapeTokens.strokeWidth;
  const inset = strokeWidth / 2;
  const innerWidth = Math.max(0, width - strokeWidth);
  const innerHeight = Math.max(0, height - strokeWidth);
  const radius = Math.min(
    capabilityShapeTokens.boxCornerRadius,
    innerWidth / 2,
    innerHeight / 2,
  );
  const left = inset;
  const top = inset;
  const right = Math.max(left, width - inset);
  const bottom = Math.max(top, height - inset);
  const path = radius <= 0
    ? `M ${number(left)} ${number(top)} H ${number(right)} V ${number(bottom)} H ${number(left)} Z`
    : [
        `M ${number(left + radius)} ${number(top)}`,
        `H ${number(right - radius)}`,
        `A ${number(radius)} ${number(radius)} 0 0 1 ${number(right)} ${number(top + radius)}`,
        `V ${number(bottom - radius)}`,
        `A ${number(radius)} ${number(radius)} 0 0 1 ${number(right - radius)} ${number(bottom)}`,
        `H ${number(left + radius)}`,
        `A ${number(radius)} ${number(radius)} 0 0 1 ${number(left)} ${number(bottom - radius)}`,
        `V ${number(top + radius)}`,
        `A ${number(radius)} ${number(radius)} 0 0 1 ${number(left + radius)} ${number(top)}`,
        'Z',
      ].join(' ');

  return {
    bounds: { x: 0, y: 0, width, height },
    path,
    contentRect: { x: inset, y: inset, width: innerWidth, height: innerHeight },
    strokeWidth,
    strokeLinejoin: 'round',
    cornerRadius: radius,
    pptxStrategy: { kind: 'preset', preset: 'roundRect' },
  };
}

function chevronGeometry(
  widthValue: number,
  heightValue: number,
): Omit<CapabilityShapeGeometry, 'configuredShapeId' | 'renderedShapeId'> {
  const width = clampDimension(widthValue);
  const height = clampDimension(heightValue);
  const strokeWidth = capabilityShapeTokens.strokeWidth;
  const strokeInset = strokeWidth / 2;
  const innerWidth = Math.max(0, width - strokeWidth);
  const innerHeight = Math.max(0, height - strokeWidth);
  const maxDepth = Math.max(0, Math.min(innerWidth / 3, innerHeight / 2));
  const tipDepth = Math.min(capabilityShapeTokens.chevronTipDepth, maxDepth);
  const notchDepth = Math.min(capabilityShapeTokens.chevronNotchDepth, maxDepth);
  const left = strokeInset;
  const top = strokeInset;
  const right = Math.max(left, width - strokeInset);
  const bottom = Math.max(top, height - strokeInset);
  const middleY = top + innerHeight / 2;
  const path = [
    `M ${number(left)} ${number(top)}`,
    `L ${number(right - tipDepth)} ${number(top)}`,
    `L ${number(right)} ${number(middleY)}`,
    `L ${number(right - tipDepth)} ${number(bottom)}`,
    `L ${number(left)} ${number(bottom)}`,
    `L ${number(left + notchDepth)} ${number(middleY)}`,
    'Z',
  ].join(' ');

  return {
    bounds: { x: 0, y: 0, width, height },
    path,
    contentRect: {
      x: left + notchDepth,
      y: top,
      width: Math.max(0, innerWidth - notchDepth - tipDepth),
      height: innerHeight,
    },
    strokeWidth,
    strokeLinejoin: 'round',
    cornerRadius: 0,
    pptxStrategy: { kind: 'preset', preset: 'chevron' },
  };
}

const SHAPE_REGISTRY: Readonly<Record<CapabilityShapeId, CapabilityShapeDefinition>> = {
  box: {
    id: 'box',
    displayName: 'Box',
    legendLabel: 'Capability',
    leafOnly: false,
    preferredHorizontalOverhead: 0,
    resolve: roundedRectGeometry,
  },
  chevron: {
    id: 'chevron',
    displayName: 'Chevron',
    legendLabel: 'Wertstrom',
    leafOnly: true,
    fallbackByDirection: { horizontal: 'box' },
    preferredHorizontalOverhead:
      capabilityShapeTokens.chevronNotchDepth + capabilityShapeTokens.chevronTipDepth,
    resolve: chevronGeometry,
  },
};

export function isCapabilityShapeId(value: string): value is CapabilityShapeId {
  return Object.hasOwn(SHAPE_REGISTRY, value);
}

export function getCapabilityShapeDefinition(
  shapeId: string,
): CapabilityShapeDefinition | undefined {
  return isCapabilityShapeId(shapeId) ? SHAPE_REGISTRY[shapeId] : undefined;
}

export function getCapabilityShapeDefinitions(): CapabilityShapeDefinition[] {
  return CAPABILITY_SHAPE_IDS.map((shapeId) => SHAPE_REGISTRY[shapeId]);
}

export function resolveCapabilityShape(
  configuredShapeId: CapabilityShapeId,
  direction: LayoutDirection,
  width: number,
  height: number,
): CapabilityShapeGeometry {
  const configuredDefinition = SHAPE_REGISTRY[configuredShapeId];
  const renderedShapeId = configuredDefinition.fallbackByDirection?.[direction] ?? configuredShapeId;
  const geometry = SHAPE_REGISTRY[renderedShapeId].resolve(width, height);
  return { configuredShapeId, renderedShapeId, ...geometry };
}

export function preferredShapeHorizontalOverhead(
  shapeId: CapabilityShapeId,
  direction: LayoutDirection,
): number {
  const definition = SHAPE_REGISTRY[shapeId];
  const renderedShapeId = definition.fallbackByDirection?.[direction] ?? shapeId;
  return SHAPE_REGISTRY[renderedShapeId].preferredHorizontalOverhead;
}

export function resolveCapabilityShapeLegend(
  shapeId: CapabilityShapeId,
  width = 20,
  height = 14,
): CapabilityShapeGeometry {
  return resolveCapabilityShape(shapeId, 'vertical', width, height);
}

export function isRenderedChevron(
  shapeId: CapabilityShapeId,
  direction: LayoutDirection,
): boolean {
  return resolveCapabilityShape(shapeId, direction, 1, 1).renderedShapeId === 'chevron';
}
