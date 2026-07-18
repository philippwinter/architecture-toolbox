export type LayoutDirection = 'horizontal' | 'vertical';
export type CapabilityShape = 'box' | 'chevron';

export type MetadataValue =
  | boolean
  | number
  | string
  | null
  | MetadataValue[]
  | { [key: string]: MetadataValue };

export interface FlushInput {
  type: 'flush';
  direction: LayoutDirection;
}

export interface CapabilityInput {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  responsibilities?: string[];
  tags?: string[];
  visualization?: {
    color?: string;
    icon?: string;
    shape?: CapabilityShape;
  };
  layout?: {
    direction?: LayoutDirection;
    layerWeight?: number;
    trackWeight?: number;
  };
  metadata?: Record<string, MetadataValue>;
  children?: CapabilityChildInput[];
}

export type CapabilityChildInput = CapabilityInput | FlushInput;

export interface CapabilityGroupInput {
  type: 'group';
  id: string;
  name: string;
  visualization?: {
    backgroundColor?: string;
  };
  layout?: {
    direction?: LayoutDirection;
    layerWeight?: number;
    trackWeight?: number;
  };
  capabilities: GroupItemInput[];
}

export type GroupItemInput = CapabilityInput | CapabilityGroupInput | FlushInput;
export type RootItemInput = GroupItemInput;

export interface CapabilityMapInput {
  version: 1;
  map: {
    id: string;
    name: string;
    description?: string;
    theme?: {
      defaultColor?: string;
    };
    capabilities: RootItemInput[];
  };
}

export interface NormalizedFlush {
  kind: 'flush';
  direction: LayoutDirection;
}

export interface NormalizedCapability {
  kind: 'capability';
  id: string;
  name: string;
  description?: string;
  owner?: string;
  responsibilities: string[];
  tags: string[];
  metadata: Record<string, MetadataValue>;
  explicitColor?: string;
  color: string;
  explicitIcon?: string;
  icon?: string;
  shape: CapabilityShape;
  layout: {
    direction: LayoutDirection;
    layerWeight?: number;
    trackWeight?: number;
  };
  children: NormalizedCapabilityChild[];
  parentId?: string;
  path: string[];
  pathNames: string[];
  depth: number;
  descendantCount: number;
}

export type NormalizedCapabilityChild = NormalizedCapability | NormalizedFlush;

export interface NormalizedCapabilityGroup {
  kind: 'group';
  id: string;
  name: string;
  backgroundColor: string;
  layout: {
    direction: LayoutDirection;
    layerWeight?: number;
    trackWeight?: number;
  };
  capabilities: NormalizedGroupItem[];
  capabilityCount: number;
  groupLevel: 1 | 2;
  parentGroupId?: string;
}

export type NormalizedGroupItem =
  | NormalizedCapability
  | NormalizedCapabilityGroup
  | NormalizedFlush;
export type NormalizedRootItem = NormalizedGroupItem;

export interface NormalizedHierarchyEntry {
  kind: 'capability' | 'group';
  id: string;
  name: string;
  parentId?: string;
  path: string[];
  pathNames: string[];
}

export interface NormalizedMap {
  id: string;
  name: string;
  description?: string;
  defaultColor: string;
  rootItems: NormalizedRootItem[];
  capabilities: NormalizedCapability[];
  capabilitiesById: Map<string, NormalizedCapability>;
  groupsById: Map<string, NormalizedCapabilityGroup>;
  hierarchyById: Map<string, NormalizedHierarchyEntry>;
}

export interface Diagnostic {
  severity: 'error' | 'warning';
  message: string;
  path: string;
  from: number;
  to: number;
  line?: number;
  column?: number;
}

export type DocumentResult =
  | { ok: true; value: NormalizedMap; diagnostics: Diagnostic[] }
  | { ok: false; diagnostics: Diagnostic[] };

export interface VisibleFlush {
  kind: 'flush';
  direction: LayoutDirection;
}

export interface VisibleCapability {
  kind: 'capability';
  capability: NormalizedCapability;
  children: VisibleCapabilityChild[];
  contextOnly: boolean;
  searchMatch: boolean;
  collapsed: boolean;
}

export type VisibleCapabilityChild = VisibleCapability | VisibleFlush;

export interface VisibleCapabilityGroup {
  kind: 'group';
  group: NormalizedCapabilityGroup;
  capabilities: VisibleGroupItem[];
  collapsed: boolean;
  autoCollapsed: boolean;
}

export type VisibleGroupItem = VisibleCapability | VisibleCapabilityGroup | VisibleFlush;
export type VisibleRootItem = VisibleGroupItem;

export type FilterSelection = Record<string, string[]>;

export interface FilterOption {
  field: string;
  label: string;
  values: string[];
}
