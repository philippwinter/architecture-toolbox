import { CircleHelp, icons, type LucideIcon } from 'lucide-react';

function normalizeIconName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

const iconByNormalizedName = new Map<string, LucideIcon>(
  Object.entries(icons).map(([name, icon]) => [normalizeIconName(name), icon]),
);

// Keep existing YAML documents visually stable while resolving every other
// name directly from Lucide's generated icon catalog.
const legacyAliases: Record<string, string> = {
  blocks: 'Blocks',
  boxes: 'Boxes',
  briefcase: 'BriefcaseBusiness',
  building: 'Building2',
  chart: 'ChartNoAxesCombined',
  compass: 'Compass',
  factory: 'Factory',
  gauge: 'Gauge',
  globe: 'Globe2',
  handshake: 'Handshake',
  landmark: 'Landmark',
  layers: 'Layers3',
  lightbulb: 'Lightbulb',
  package: 'Package',
  settings: 'Settings2',
  shield: 'ShieldCheck',
  shopping: 'ShoppingCart',
  target: 'Target',
  users: 'Users',
  workflow: 'Workflow',
};

for (const [alias, lucideName] of Object.entries(legacyAliases)) {
  const icon = iconByNormalizedName.get(normalizeIconName(lucideName));
  if (icon) iconByNormalizedName.set(normalizeIconName(alias), icon);
}

export function hasCapabilityIcon(name: string): boolean {
  return iconByNormalizedName.has(normalizeIconName(name));
}

export function getCapabilityIcon(name?: string): LucideIcon {
  return (name && iconByNormalizedName.get(normalizeIconName(name))) || CircleHelp;
}
