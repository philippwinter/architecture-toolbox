import {
  Blocks,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  CircleHelp,
  Compass,
  Factory,
  Gauge,
  Globe2,
  Handshake,
  Landmark,
  Layers3,
  Lightbulb,
  Package,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export const capabilityIcons = {
  blocks: Blocks,
  boxes: Boxes,
  briefcase: BriefcaseBusiness,
  building: Building2,
  chart: ChartNoAxesCombined,
  compass: Compass,
  factory: Factory,
  gauge: Gauge,
  globe: Globe2,
  handshake: Handshake,
  landmark: Landmark,
  layers: Layers3,
  lightbulb: Lightbulb,
  package: Package,
  settings: Settings2,
  shield: ShieldCheck,
  shopping: ShoppingCart,
  target: Target,
  users: Users,
  workflow: Workflow,
} satisfies Record<string, LucideIcon>;

export type CapabilityIconName = keyof typeof capabilityIcons;

export const capabilityIconNames = Object.keys(capabilityIcons).sort();

export function hasCapabilityIcon(name: string): name is CapabilityIconName {
  return name in capabilityIcons;
}

export function getCapabilityIcon(name?: string): LucideIcon {
  return name && hasCapabilityIcon(name) ? capabilityIcons[name] : CircleHelp;
}
