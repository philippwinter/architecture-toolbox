import { stringify } from 'yaml';
import type {
  CapabilityChildInput,
  CapabilityGroupInput,
  CapabilityInput,
  CapabilityMapInput,
  GroupItemInput,
  RootItemInput,
} from './domain/types';

interface SubgroupDefinition {
  id: string;
  name: string;
  parents: string[];
}

interface GroupDefinition {
  id: string;
  name: string;
  backgroundColor: string;
  capabilityColor: string;
  icon: string;
  subgroups: SubgroupDefinition[];
  directParents?: string[];
}

const groupDefinitions: GroupDefinition[] = [
  {
    id: 'strategy-governance-group',
    name: 'Strategy & Governance',
    backgroundColor: '#E8F1F8',
    capabilityColor: '#D7E9F7',
    icon: 'compass',
    subgroups: [
      {
        id: 'enterprise-direction-group',
        name: 'Enterprise Direction',
        parents: ['Strategy', 'Business Model', 'Purpose & Vision', 'Strategic Foresight', 'Corporate Development'],
      },
      {
        id: 'portfolio-investment-group',
        name: 'Portfolio & Investment',
        parents: ['Enterprise Portfolio', 'Investment Governance', 'Transformation Portfolio', 'Benefits Realisation', 'Capital Allocation'],
      },
      {
        id: 'governance-performance-group',
        name: 'Governance & Performance',
        parents: ['Corporate Governance', 'Performance Management', 'Decision Governance', 'Policy Management', 'Executive Reporting'],
      },
    ],
  },
  {
    id: 'market-customer-group',
    name: 'Market & Customer',
    backgroundColor: '#FFF1DF',
    capabilityColor: '#F8DFC0',
    icon: 'users',
    subgroups: [
      {
        id: 'market-intelligence-group',
        name: 'Market Intelligence & Growth',
        parents: ['Market Intelligence', 'Growth Strategy', 'Brand Management', 'Channel Strategy', 'Partner Development'],
      },
      {
        id: 'customer-lifecycle-group',
        name: 'Customer Lifecycle',
        parents: ['Customer', 'Marketing', 'Sales', 'Customer Service', 'Customer Experience'],
      },
    ],
  },
  {
    id: 'products-operations-group',
    name: 'Products & Operations',
    backgroundColor: '#EDF5E7',
    capabilityColor: '#DDECCF',
    icon: 'factory',
    subgroups: [
      {
        id: 'product-service-group',
        name: 'Product & Service Management',
        parents: ['Product Strategy', 'Product Management', 'Service Design', 'Innovation Management', 'Lifecycle Management'],
      },
      {
        id: 'operations-supply-group',
        name: 'Operations & Supply Network',
        parents: ['Operations', 'Supply Chain', 'Production', 'Quality Management', 'Asset Management'],
      },
    ],
  },
  {
    id: 'people-organisation-group',
    name: 'People & Organisation',
    backgroundColor: '#F7EAF0',
    capabilityColor: '#F2DDE7',
    icon: 'building',
    subgroups: [
      {
        id: 'workforce-organisation-group',
        name: 'Workforce & Organisation',
        parents: ['Workforce Strategy', 'Organisation Design', 'Talent Acquisition', 'People Development', 'Workforce Administration'],
      },
      {
        id: 'culture-change-group',
        name: 'Culture & Change',
        parents: ['Culture Management', 'Change Enablement', 'Leadership Development', 'Employee Experience', 'Internal Communication'],
      },
    ],
  },
  {
    id: 'enablers-risk-group',
    name: 'Technology, Risk & Enablers',
    backgroundColor: '#F0ECF8',
    capabilityColor: '#E5DDF4',
    icon: 'layers',
    subgroups: [],
    directParents: ['Technology', 'Data & Analytics', 'Cybersecurity', 'Enterprise Risk & Compliance', 'Procurement & Facilities'],
  },
];

const owners = ['Corporate Development', 'Commercial', 'Product', 'COO', 'People', 'CIO', 'Risk'];
const parentIcons: Record<string, string> = {
  Strategy: 'Route',
  'Business Model': 'Blocks',
  'Purpose & Vision': 'Telescope',
  'Strategic Foresight': 'Binoculars',
  'Corporate Development': 'Building2',
  'Enterprise Portfolio': 'BriefcaseBusiness',
  'Investment Governance': 'BadgeDollarSign',
  'Transformation Portfolio': 'IterationCw',
  'Benefits Realisation': 'CircleCheckBig',
  'Capital Allocation': 'Coins',
  'Corporate Governance': 'Scale',
  'Performance Management': 'Gauge',
  'Decision Governance': 'Gavel',
  'Policy Management': 'ScrollText',
  'Executive Reporting': 'Presentation',
  'Market Intelligence': 'Radar',
  'Growth Strategy': 'TrendingUp',
  'Brand Management': 'Sparkles',
  'Channel Strategy': 'Waypoints',
  'Partner Development': 'Handshake',
  Customer: 'UserRound',
  Marketing: 'Megaphone',
  Sales: 'HandCoins',
  'Customer Service': 'Headset',
  'Customer Experience': 'HeartHandshake',
  'Product Strategy': 'Map',
  'Product Management': 'Package',
  'Service Design': 'PencilRuler',
  'Innovation Management': 'Lightbulb',
  'Lifecycle Management': 'RefreshCcw',
  Operations: 'Cog',
  'Supply Chain': 'Truck',
  Production: 'Factory',
  'Quality Management': 'BadgeCheck',
  'Asset Management': 'Boxes',
  'Workforce Strategy': 'UsersRound',
  'Organisation Design': 'Network',
  'Talent Acquisition': 'UserPlus',
  'People Development': 'GraduationCap',
  'Workforce Administration': 'ClipboardList',
  'Culture Management': 'Heart',
  'Change Enablement': 'Replace',
  'Leadership Development': 'Crown',
  'Employee Experience': 'Smile',
  'Internal Communication': 'MessagesSquare',
  Technology: 'Cpu',
  'Data & Analytics': 'ChartNoAxesCombined',
  Cybersecurity: 'ShieldCheck',
  'Enterprise Risk & Compliance': 'ShieldAlert',
  'Procurement & Facilities': 'Building',
};
const leafIcons = [
  'Search',
  'Goal',
  'Scale',
  'PencilRuler',
  'Workflow',
  'Cog',
  'ShieldCheck',
  'ChartNoAxesCombined',
  'RefreshCcw',
];
const leafNames = [
  'Bedarf und Signale erfassen',
  'Ziele und Leitplanken definieren',
  'Optionen bewerten',
  'Lösung gestalten',
  'Umsetzung orchestrieren',
  'Leistung erbringen',
  'Qualität und Risiken absichern',
  'Ergebnisse und Wirkung messen',
  'Kontinuierliche Verbesserung und bereichsübergreifende Optimierung',
];

function slug(value: string): string {
  return value
    .toLocaleLowerCase('de')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function knownParentId(name: string): string | undefined {
  const ids: Record<string, string> = {
    Strategy: 'strategy',
    Customer: 'customer',
    Operations: 'operations',
    Technology: 'technology',
  };
  return ids[name];
}

function knownLeafId(parentId: string, index: number): string | undefined {
  const ids: Record<string, string[]> = {
    customer: ['customer-insights', 'customer-segmentation', 'value-proposition', 'customer-acquisition', 'customer-sales-journey', 'customer-onboarding', 'customer-support', 'customer-retention', 'customer-feedback'],
    operations: ['operations-demand-planning', 'operations-supply-coordination', 'operations-production-planning', 'operations-execution', 'service-operations', 'quality-control', 'maintenance', 'operations-performance', 'continuous-improvement'],
    technology: ['technology-strategy', 'enterprise-architecture', 'platform-engineering', 'application-management', 'cloud-services', 'digital-workplace', 'technology-operations', 'technology-financial-management', 'technology-innovation'],
  };
  return ids[parentId]?.[index];
}

function leaf(
  parent: CapabilityInput,
  index: number,
  globalParentIndex: number,
  direction: 'horizontal' | 'vertical',
  chevron: boolean,
  suffix = '',
): CapabilityInput {
  const id = knownLeafId(parent.id, index) ?? `${parent.id}${suffix}-step-${index + 1}`;
  return {
    id,
    name: leafNames[index] ?? `Capability-Schritt ${index + 1}`,
    description: `Konkrete Ausprägung innerhalb von ${parent.name}. Die vertiefende Beschreibung bleibt ausschließlich im Detailbereich sichtbar.`,
    owner: owners[(globalParentIndex + index) % owners.length],
    responsibilities: index % 3 === 0 ? ['Standards pflegen', 'Ergebnisse verantworten'] : undefined,
    tags: ['reference', chevron ? 'value-stream' : index % 2 === 0 ? 'delivery' : 'control'],
    visualization: {
      icon: leafIcons[index] ?? 'Circle',
      shape: chevron ? 'chevron' : 'box',
    },
    layout: {
      direction,
      ...(direction === 'horizontal' ? { layerWeight: index % 2 === 0 ? 1 : 1.15 } : {}),
    },
    metadata: {
      maturity: ['initial', 'managed', 'established'][(globalParentIndex + index) % 3] ?? 'managed',
      criticality: index % 4 === 0 ? 'high' : 'medium',
      referenceNumber: globalParentIndex * 10 + index + 1,
    },
  };
}

function arrangeFlatLeaves(parent: CapabilityInput, globalParentIndex: number): CapabilityChildInput[] {
  const hasValueStream = globalParentIndex % 5 === 0;
  if (hasValueStream) {
    const streamDirection = globalParentIndex % 10 === 0 ? 'vertical' : 'horizontal';
    const stream = Array.from({ length: 4 }, (_value, index) =>
      leaf(parent, index, globalParentIndex, streamDirection, true),
    );
    const remainder = Array.from({ length: 5 }, (_value, offset) =>
      leaf(parent, offset + 4, globalParentIndex, streamDirection === 'vertical' ? 'horizontal' : 'vertical', false),
    );
    stream[0] = {
      ...stream[0],
      layout: {
        ...stream[0]?.layout,
        trackWeight: 1.1,
      },
    } as CapabilityInput;
    remainder[0] = {
      ...remainder[0],
      layout: {
        ...remainder[0]?.layout,
        trackWeight: 1,
      },
    } as CapabilityInput;
    return [
      ...stream,
      { type: 'flush', direction: streamDirection === 'vertical' ? 'vertical' : 'horizontal' },
      ...remainder,
    ];
  }

  const leaves = Array.from({ length: 9 }, (_value, index) => {
    const direction = index < 3 || index >= 5 ? 'horizontal' : 'vertical';
    return leaf(parent, index, globalParentIndex, direction, false);
  });
  leaves[0] = { ...leaves[0], layout: { ...leaves[0]?.layout, trackWeight: 1.1 } } as CapabilityInput;
  leaves[3] = { ...leaves[3], layout: { ...leaves[3]?.layout, trackWeight: 0.9 } } as CapabilityInput;
  leaves[5] = { ...leaves[5], layout: { ...leaves[5]?.layout, trackWeight: 1 } } as CapabilityInput;
  return [
    ...leaves.slice(0, 3),
    { type: 'flush', direction: 'horizontal' },
    ...leaves.slice(3, 5),
    { type: 'flush', direction: 'vertical' },
    ...leaves.slice(5),
  ];
}

function arrangeThreeLevelChildren(
  parent: CapabilityInput,
  globalParentIndex: number,
): CapabilityChildInput[] {
  const intermediate = (suffix: string, indexOffset: number): CapabilityInput => ({
    id: `${parent.id}-${suffix}`,
    name: suffix === 'design' ? 'Konzeption und Gestaltung' : 'Steuerung und Absicherung',
    visualization: { icon: suffix === 'design' ? 'lightbulb' : 'shield' },
    layout: { direction: 'horizontal', ...(suffix === 'design' ? { trackWeight: 1.15, layerWeight: 1 } : { layerWeight: 1.1 }) },
    children: [
      leaf(parent, indexOffset, globalParentIndex, 'vertical', false, `-${suffix}`),
      leaf(parent, indexOffset + 1, globalParentIndex, 'vertical', false, `-${suffix}`),
    ],
  });
  const directLeaves = [6, 7, 8].map((index) =>
    leaf(parent, index, globalParentIndex, 'horizontal', true, '-direct'),
  );
  directLeaves[0] = {
    ...directLeaves[0],
    layout: { ...directLeaves[0]?.layout, trackWeight: 1 },
  } as CapabilityInput;
  return [
    intermediate('design', 0),
    intermediate('assurance', 2),
    { type: 'flush', direction: 'horizontal' },
    ...directLeaves,
  ];
}

function arrangeFourLevelChildren(
  parent: CapabilityInput,
  globalParentIndex: number,
): CapabilityChildInput[] {
  const deepestLeaves = Array.from({ length: 7 }, (_value, index) =>
    leaf(parent, index, globalParentIndex, 'vertical', index < 4, '-deep'),
  );
  deepestLeaves[0] = {
    ...deepestLeaves[0],
    layout: { ...deepestLeaves[0]?.layout, trackWeight: 1.1 },
  } as CapabilityInput;
  return [
    {
      id: `${parent.id}-operating-model`,
      name: 'Operating Model',
      visualization: { icon: 'workflow' },
      children: [
        {
          id: `${parent.id}-execution-system`,
          name: 'Execution System',
          visualization: { icon: 'settings' },
          children: deepestLeaves,
        },
      ],
    },
  ];
}

function createParent(
  name: string,
  group: GroupDefinition,
  globalParentIndex: number,
  localIndex: number,
): CapabilityInput {
  const id = knownParentId(name) ?? slug(name);
  const parent: CapabilityInput = {
    id,
    name,
    description: `${name} bündelt die wesentlichen Fähigkeiten dieses fachlichen Bereichs und dient als strukturierender Einstiegspunkt.`,
    owner: owners[globalParentIndex % owners.length],
    responsibilities: ['Zielbild und Leitplanken pflegen', 'Leistung und Weiterentwicklung steuern'],
    tags: ['reference', group.id.replace(/-group$/, '')],
    visualization: { color: group.capabilityColor, icon: parentIcons[name] ?? group.icon },
    layout: {
      direction: localIndex < 2 || localIndex === 4 ? 'horizontal' : 'vertical',
      ...(localIndex === 0 ? { trackWeight: 1.15, layerWeight: 1 } : {}),
      ...(localIndex === 1 ? { layerWeight: 1.2 } : {}),
      ...(localIndex === 2 ? { trackWeight: 1 } : {}),
      ...(localIndex === 4 ? { trackWeight: 1.05, layerWeight: 1.1 } : {}),
    },
    metadata: { criticality: globalParentIndex % 4 === 0 ? 'high' : 'medium' },
  };
  const keepKnownParentFlat = ['strategy', 'customer', 'operations', 'technology'].includes(id);
  parent.children = keepKnownParentFlat
    ? arrangeFlatLeaves(parent, globalParentIndex)
    : globalParentIndex % 7 === 0
      ? arrangeFourLevelChildren(parent, globalParentIndex)
      : globalParentIndex % 3 === 0
        ? arrangeThreeLevelChildren(parent, globalParentIndex)
        : arrangeFlatLeaves(parent, globalParentIndex);
  return parent;
}

function arrangeParents(
  names: string[],
  group: GroupDefinition,
  startIndex: number,
): GroupItemInput[] {
  const parents = names.map((name, localIndex) =>
    createParent(name, group, startIndex + localIndex, localIndex),
  );
  return [
    ...parents.slice(0, 2),
    { type: 'flush', direction: 'horizontal' },
    ...parents.slice(2, 4),
    { type: 'flush', direction: 'vertical' },
    parents[4] as CapabilityInput,
  ];
}

let parentOffset = 0;
const rootGroups = groupDefinitions.map((definition) => {
  let capabilities: GroupItemInput[];
  if (definition.subgroups.length === 0) {
    capabilities = arrangeParents(definition.directParents ?? [], definition, parentOffset);
    parentOffset += definition.directParents?.length ?? 0;
  } else {
    const subgroups: CapabilityGroupInput[] = definition.subgroups.map((subgroup, subgroupIndex) => {
      const subgroupInput: CapabilityGroupInput = {
        type: 'group',
        id: subgroup.id,
        name: subgroup.name,
        visualization: { backgroundColor: definition.backgroundColor },
        layout: {
          direction: subgroupIndex < 2 && definition.subgroups.length === 3 ? 'horizontal' : 'vertical',
          ...(subgroupIndex === 0 && definition.subgroups.length === 3
            ? { trackWeight: 1.1, layerWeight: 1 }
            : {}),
          ...(subgroupIndex === 1 && definition.subgroups.length === 3 ? { layerWeight: 1.15 } : {}),
        },
        capabilities: arrangeParents(subgroup.parents, definition, parentOffset),
      };
      parentOffset += subgroup.parents.length;
      return subgroupInput;
    });
    capabilities =
      subgroups.length === 3
        ? [subgroups[0] as CapabilityGroupInput, subgroups[1] as CapabilityGroupInput, { type: 'flush', direction: 'horizontal' }, subgroups[2] as CapabilityGroupInput]
        : subgroups;
  }

  return {
    type: 'group',
    id: definition.id,
    name: definition.name,
    visualization: { backgroundColor: definition.backgroundColor },
    layout: {
      direction: 'vertical',
      trackWeight: 1,
    },
    capabilities,
  } satisfies CapabilityGroupInput;
});

const rootItems: RootItemInput[] = [
  rootGroups[0] as CapabilityGroupInput,
  rootGroups[1] as CapabilityGroupInput,
  { type: 'flush', direction: 'vertical' },
  rootGroups[2] as CapabilityGroupInput,
  rootGroups[3] as CapabilityGroupInput,
  { type: 'flush', direction: 'vertical' },
  rootGroups[4] as CapabilityGroupInput,
];

const input: CapabilityMapInput = {
  version: 1,
  map: {
    id: 'enterprise-capabilities',
    name: 'Enterprise Capability Map',
    description: 'Ausgewogene Referenzmap mit fünf Hauptgruppen und exakt 500 Capabilities.',
    theme: { defaultColor: '#DCE8F5' },
    capabilities: rootItems,
  },
};

function countCapabilities(items: GroupItemInput[]): number {
  return items.reduce((count, item) => {
    if ('type' in item && item.type === 'flush') return count;
    if ('type' in item && item.type === 'group') return count + countCapabilities(item.capabilities);
    return count + 1 + countCapabilityChildren(item.children ?? []);
  }, 0);
}

function countCapabilityChildren(items: CapabilityChildInput[]): number {
  return items.reduce((count, item) => {
    if ('type' in item) return count;
    return count + 1 + countCapabilityChildren(item.children ?? []);
  }, 0);
}

const capabilityCount = countCapabilities(rootItems);
if (capabilityCount !== 500) {
  throw new Error(`Das Startbeispiel muss exakt 500 Capabilities enthalten, enthält aber ${capabilityCount}.`);
}

export const SAMPLE_YAML = `# Capability Map Studio – ausgewogene Referenzmap
# Fünf fachliche Hauptgruppen, neun Untergruppen und exakt 500 Capabilities.
# Die Standardansicht „Ebene 1“ zeigt zunächst ausschließlich die obersten Capabilities.
# Chevrons markieren ausschließlich zusammenhängende Wertströme.
# Jede Capability besitzt ein semantisch passendes Lucide-Icon.
${stringify(input, { lineWidth: 0 })}`;
