import type { NormalizedCapability, NormalizedMap } from './types';

export type ViewProfile = 'level-1' | 'level-2' | 'level-3' | 'all' | 'custom';

function capabilityChildren(capability: NormalizedCapability): NormalizedCapability[] {
  return capability.children.filter(
    (child): child is NormalizedCapability => child.kind === 'capability',
  );
}

function allCollapsibleCapabilities(map: NormalizedMap): NormalizedCapability[] {
  return [...map.capabilitiesById.values()].filter(
    (capability) => capabilityChildren(capability).length > 0,
  );
}

export function collapsedIdsForProfile(
  map: NormalizedMap,
  profile: Exclude<ViewProfile, 'custom'>,
): Set<string> {
  const collapsible = allCollapsibleCapabilities(map);
  if (profile === 'all') return new Set();
  const deepestVisibleDepth = profile === 'level-1' ? 0 : profile === 'level-2' ? 1 : 2;
  return new Set(
    collapsible
      .filter((capability) => capability.depth >= deepestVisibleDepth)
      .map((capability) => capability.id),
  );
}

export function mapStructureSignature(map: NormalizedMap): string {
  const source = [
    map.id,
    ...map.rootItems.flatMap((item) => (item.kind === 'flush' ? [] : [item.id])),
    ...map.capabilitiesById.keys(),
    ...map.groupsById.keys(),
  ].join('|');
  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 33) ^ source.charCodeAt(index);
  }
  return `${map.id}:${map.capabilitiesById.size}:${(hash >>> 0).toString(36)}`;
}
