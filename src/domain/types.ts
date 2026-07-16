export type LayoutDirection = 'horizontal' | 'vertical';

export type MetadataValue =
  | boolean
  | number
  | string
  | null
  | MetadataValue[]
  | { [key: string]: MetadataValue };

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
  };
  layout?: {
    direction?: LayoutDirection;
    weight?: number;
    trackWeight?: number;
  };
  metadata?: Record<string, MetadataValue>;
  children?: CapabilityInput[];
}

export interface CapabilityGroupInput {
  type: 'group';
  id: string;
  name: string;
  visualization?: {
    backgroundColor?: string;
  };
  layout?: {
    direction?: LayoutDirection;
    weight?: number;
    trackWeight?: number;
  };
  capabilities: CapabilityInput[];
}

export type RootItemInput = CapabilityInput | CapabilityGroupInput;

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
  layout: {
    direction: LayoutDirection;
    weight: number;
    trackWeight?: number;
  };
  children: NormalizedCapability[];
  parentId?: string;
  path: string[];
  pathNames: string[];
  depth: number;
  descendantCount: number;
}

export interface NormalizedCapabilityGroup {
  kind: 'group';
  id: string;
  name: string;
  backgroundColor: string;
  layout: {
    direction: LayoutDirection;
    weight: number;
    trackWeight?: number;
  };
  capabilities: NormalizedCapability[];
  capabilityCount: number;
}

export type NormalizedRootItem = NormalizedCapability | NormalizedCapabilityGroup;

export interface NormalizedMap {
  id: string;
  name: string;
  description?: string;
  defaultColor: string;
  rootItems: NormalizedRootItem[];
  capabilities: NormalizedCapability[];
  capabilitiesById: Map<string, NormalizedCapability>;
  groupsById: Map<string, NormalizedCapabilityGroup>;
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

export interface VisibleCapability {
  kind: 'capability';
  capability: NormalizedCapability;
  children: VisibleCapability[];
  contextOnly: boolean;
  searchMatch: boolean;
}

export interface VisibleCapabilityGroup {
  kind: 'group';
  group: NormalizedCapabilityGroup;
  capabilities: VisibleCapability[];
  collapsed: boolean;
  autoCollapsed: boolean;
}

export type VisibleRootItem = VisibleCapability | VisibleCapabilityGroup;

export type FilterSelection = Record<string, string[]>;

export interface FilterOption {
  field: string;
  label: string;
  values: string[];
}
