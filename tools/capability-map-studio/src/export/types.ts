import type { IconNode } from 'lucide-react';
import type { CapabilityShape, LayoutDirection } from '../domain/types';
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
  cornerRadius: number;
  color: string;
  textColor: string;
  shape: CapabilityShape;
  direction: LayoutDirection;
  iconNode: IconNode;
  compact: boolean;
  minimal: boolean;
  nameLineCount: number;
  hiddenDescendantCount: number;
  contextOnly: boolean;
  chevronContinues: boolean;
}

export interface ExportGroupElement {
  kind: 'group';
  id: string;
  name: string;
  rect: ExportRect;
  cornerRadius: number;
  backgroundColor: string;
  direction: LayoutDirection;
  collapsed: boolean;
  autoCollapsed: boolean;
  collapsedTrackFill: boolean;
  labelSize: number;
}

export type ExportSceneElement = ExportCapabilityElement | ExportGroupElement;

export type ExportLegendKind =
  | 'group'
  | 'capability'
  | 'value-stream'
  | 'hidden-descendants'
  | 'context';

export interface ExportLegendEntry {
  kind: ExportLegendKind;
  label: string;
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
