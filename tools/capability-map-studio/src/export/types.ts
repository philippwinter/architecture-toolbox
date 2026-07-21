import type { IconNode } from 'lucide-react';
import type { CapabilityShapeGeometry, CapabilityShapeId } from '../domain/shapes';
import type { CapabilityShape, LayoutDirection, PresentationRole } from '../domain/types';
import type { ViewProfile } from '../domain/viewState';

export interface ExportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExportCapabilityElement {
  kind: 'capability';
  id: string;
  name: string;
  rect: ExportRect;
  parentId?: string;
  cornerRadius: number;
  color: string;
  textColor: string;
  shape: CapabilityShape;
  renderedShape: CapabilityShapeId;
  geometry: CapabilityShapeGeometry;
  direction: LayoutDirection;
  depth: number;
  iconNode: IconNode;
  compact: boolean;
  minimal: boolean;
  nameLineCount: number;
  hiddenDescendantCount: number;
  contextOnly: boolean;
  presentationRole: PresentationRole;
}

export interface ExportGroupElement {
  kind: 'group';
  id: string;
  name: string;
  rect: ExportRect;
  parentId?: string;
  cornerRadius: number;
  backgroundColor: string;
  direction: LayoutDirection;
  groupLevel: 1 | 2;
  collapsed: boolean;
  autoCollapsed: boolean;
  collapsedTrackFill: boolean;
  collapsedBandFill: boolean;
  labelSize: number;
  labelOrientation: 'horizontal' | 'vertical';
  presentationRole: PresentationRole;
}

export type ExportSceneElement = ExportCapabilityElement | ExportGroupElement;

export type ExportLegendKind =
  | 'group'
  | `shape:${CapabilityShapeId}`
  | 'hidden-descendants'
  | 'context';

export interface ExportLegendEntry {
  kind: ExportLegendKind;
  label: string;
  shapeId?: CapabilityShapeId;
}

export interface ExportScene {
  width: number;
  height: number;
  mapBounds: ExportRect;
  mapId: string;
  mapName: string;
  profile: ViewProfile;
  profileLabel: string;
  createdAtIso: string;
  createdAtLabel: string;
  contextLines: string[];
  elements: ExportSceneElement[];
  legend: ExportLegendEntry[];
}
