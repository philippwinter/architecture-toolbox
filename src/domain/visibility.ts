import type {
  FilterOption,
  FilterSelection,
  MetadataValue,
  NormalizedCapability,
  NormalizedMap,
  VisibleCapability,
  VisibleCapabilityGroup,
  VisibleRootItem,
} from './types';

function scalarValues(value: MetadataValue | undefined): string[] {
  if (value === undefined || value === null) return [];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean'
        ? [String(entry)]
        : [],
    );
  }
  return [];
}

function fieldValues(capability: NormalizedCapability, field: string): string[] {
  if (field === 'owner') return capability.owner ? [capability.owner] : [];
  if (field === 'tags') return capability.tags;
  if (field === 'responsibilities') return capability.responsibilities;
  if (field.startsWith('metadata.')) {
    return scalarValues(capability.metadata[field.slice('metadata.'.length)]);
  }
  return [];
}

function allCapabilities(roots: NormalizedCapability[]): NormalizedCapability[] {
  return roots.flatMap((capability) => [capability, ...allCapabilities(capability.children)]);
}

export function buildFilterOptions(map: NormalizedMap): FilterOption[] {
  const valuesByField = new Map<string, Set<string>>();
  const addValues = (field: string, values: string[]) => {
    if (values.length === 0) return;
    const current = valuesByField.get(field) ?? new Set<string>();
    values.forEach((value) => current.add(value));
    valuesByField.set(field, current);
  };

  allCapabilities(map.capabilities).forEach((capability) => {
    addValues('owner', capability.owner ? [capability.owner] : []);
    addValues('tags', capability.tags);
    addValues('responsibilities', capability.responsibilities);
    Object.entries(capability.metadata).forEach(([key, value]) => {
      addValues(`metadata.${key}`, scalarValues(value));
    });
  });

  const labels: Record<string, string> = {
    owner: 'Owner',
    tags: 'Tags',
    responsibilities: 'Verantwortlichkeiten',
  };

  return [...valuesByField.entries()]
    .map(([field, values]) => ({
      field,
      label: labels[field] ?? field.replace(/^metadata\./, ''),
      values: [...values].sort((a, b) => a.localeCompare(b, 'de')),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));
}

function matchesFilters(capability: NormalizedCapability, filters: FilterSelection): boolean {
  return Object.entries(filters).every(([field, selected]) => {
    if (selected.length === 0) return true;
    const actual = new Set(fieldValues(capability, field));
    return selected.some((value) => actual.has(value));
  });
}

function searchText(capability: NormalizedCapability): string {
  const metadata = Object.values(capability.metadata).flatMap(scalarValues);
  return [
    capability.name,
    capability.description,
    capability.owner,
    ...capability.responsibilities,
    ...capability.tags,
    ...metadata,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('de');
}

interface VisibilityArguments {
  search: string;
  filters: FilterSelection;
  collapsedIds: Set<string>;
  collapsedGroupIds?: Set<string>;
  focusId?: string;
}

export function computeVisibleTree(
  map: NormalizedMap,
  { search, filters, collapsedIds, collapsedGroupIds = new Set(), focusId }: VisibilityArguments,
): VisibleRootItem[] {
  const filterActive = Object.values(filters).some((values) => values.length > 0);
  const normalizedSearch = search.trim().toLocaleLowerCase('de');
  const containsSearchMatch = (item: VisibleCapability): boolean =>
    item.searchMatch || item.children.some(containsSearchMatch);

  const visit = (capability: NormalizedCapability): VisibleCapability | undefined => {
    const directFilterMatch = !filterActive || matchesFilters(capability, filters);
    const directSearchMatch =
      normalizedSearch.length > 0 && searchText(capability).includes(normalizedSearch);
    const descendantResults = capability.children
      .map(visit)
      .filter((child): child is VisibleCapability => child !== undefined);
    const hasRequiredDescendant = descendantResults.length > 0;

    if (filterActive && !directFilterMatch && !hasRequiredDescendant) return undefined;

    const forceOpen =
      (filterActive && hasRequiredDescendant) ||
      (normalizedSearch.length > 0 && descendantResults.some(containsSearchMatch));
    const children = collapsedIds.has(capability.id) && !forceOpen ? [] : descendantResults;

    return {
      kind: 'capability',
      capability,
      children,
      contextOnly: filterActive && !directFilterMatch,
      searchMatch: directSearchMatch,
    };
  };

  if (focusId) {
    const focused = map.capabilitiesById.get(focusId);
    const visibleFocused = focused ? visit(focused) : undefined;
    return visibleFocused ? [visibleFocused] : [];
  }

  const roots: VisibleRootItem[] = [];
  map.rootItems.forEach((item) => {
    if (item.kind === 'capability') {
      const visibleCapability = visit(item);
      if (visibleCapability) roots.push(visibleCapability);
      return;
    }

    const visibleCapabilities = item.capabilities
      .map(visit)
      .filter((capability): capability is VisibleCapability => capability !== undefined);
    const autoCollapsed = filterActive && visibleCapabilities.length === 0;
    const containsRequiredMatch =
      visibleCapabilities.length > 0 &&
      (filterActive ||
        (normalizedSearch.length > 0 && visibleCapabilities.some(containsSearchMatch)));
    const collapsed =
      (collapsedGroupIds.has(item.id) || autoCollapsed) && !containsRequiredMatch;
    const group: VisibleCapabilityGroup = {
      kind: 'group',
      group: item,
      capabilities: collapsed ? [] : visibleCapabilities,
      collapsed,
      autoCollapsed,
    };
    roots.push(group);
  });
  return roots;
}
