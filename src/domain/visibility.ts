import type {
  FilterOption,
  FilterSelection,
  MetadataValue,
  NormalizedCapability,
  NormalizedGroupItem,
  NormalizedMap,
  VisibleCapability,
  VisibleCapabilityChild,
  VisibleCapabilityGroup,
  VisibleGroupItem,
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
  return roots.flatMap((capability) => [
    capability,
    ...allCapabilities(
      capability.children.filter((child): child is NormalizedCapability => child.kind === 'capability'),
    ),
  ]);
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

function cleanFlushes<T extends { kind: string }>(items: T[]): T[] {
  return items.filter((item, index) => {
    if (item.kind !== 'flush') return true;
    if (index === 0 || index === items.length - 1) return false;
    return items[index - 1]?.kind !== 'flush' && items[index + 1]?.kind !== 'flush';
  });
}

export function computeVisibleTree(
  map: NormalizedMap,
  { search, filters, collapsedIds, collapsedGroupIds = new Set(), focusId }: VisibilityArguments,
): VisibleRootItem[] {
  const filterActive = Object.values(filters).some((values) => values.length > 0);
  const normalizedSearch = search.trim().toLocaleLowerCase('de');
  const containsSearchMatch = (item: VisibleCapability): boolean =>
    item.searchMatch ||
    item.children.some(
      (child) => child.kind === 'capability' && containsSearchMatch(child),
    );

  const visitCapability = (capability: NormalizedCapability): VisibleCapability | undefined => {
    const directFilterMatch = !filterActive || matchesFilters(capability, filters);
    const directSearchMatch =
      normalizedSearch.length > 0 && searchText(capability).includes(normalizedSearch);
    const descendantResults = cleanFlushes(
      capability.children.flatMap<VisibleCapabilityChild>((child) => {
        if (child.kind === 'flush') return [{ kind: 'flush', direction: child.direction }];
        const visible = visitCapability(child);
        return visible ? [visible] : [];
      }),
    );
    const visibleDescendants = descendantResults.filter(
      (child): child is VisibleCapability => child.kind === 'capability',
    );
    const hasRequiredDescendant = visibleDescendants.length > 0;

    if (filterActive && !directFilterMatch && !hasRequiredDescendant) return undefined;

    const forceOpen =
      (filterActive && hasRequiredDescendant) ||
      (normalizedSearch.length > 0 && visibleDescendants.some(containsSearchMatch));
    const children = collapsedIds.has(capability.id) && !forceOpen ? [] : descendantResults;

    return {
      kind: 'capability',
      capability,
      children,
      contextOnly: filterActive && !directFilterMatch,
      searchMatch: directSearchMatch,
    };
  };

  const groupContainsRequiredMatch = (items: VisibleGroupItem[]): boolean =>
    items.some((item) => {
      if (item.kind === 'flush') return false;
      if (item.kind === 'group') return groupContainsRequiredMatch(item.capabilities);
      return filterActive || (normalizedSearch.length > 0 && containsSearchMatch(item));
    });

  const visitGroup = (
    group: Extract<NormalizedGroupItem, { kind: 'group' }>,
  ): VisibleCapabilityGroup => {
    const visibleItems = cleanFlushes(
      group.capabilities.flatMap<VisibleGroupItem>((item) => {
        if (item.kind === 'flush') return [{ kind: 'flush', direction: item.direction }];
        if (item.kind === 'group') return [visitGroup(item)];
        const visible = visitCapability(item);
        return visible ? [visible] : [];
      }),
    );
    const hasVisibleCapability = visibleItems.some((item) => {
      if (item.kind === 'capability') return true;
      return item.kind === 'group' && item.capabilities.some((nested) => nested.kind !== 'flush');
    });
    const autoCollapsed = filterActive && !hasVisibleCapability;
    const containsRequiredMatch = groupContainsRequiredMatch(visibleItems);
    const collapsed = (collapsedGroupIds.has(group.id) || autoCollapsed) && !containsRequiredMatch;
    return {
      kind: 'group',
      group,
      capabilities: collapsed ? [] : visibleItems,
      collapsed,
      autoCollapsed,
    };
  };

  if (focusId) {
    const focused = map.capabilitiesById.get(focusId);
    const visibleFocused = focused ? visitCapability(focused) : undefined;
    return visibleFocused ? [visibleFocused] : [];
  }

  return cleanFlushes(
    map.rootItems.flatMap<VisibleRootItem>((item) => {
      if (item.kind === 'flush') return [{ kind: 'flush', direction: item.direction }];
      if (item.kind === 'group') return [visitGroup(item)];
      const visible = visitCapability(item);
      return visible ? [visible] : [];
    }),
  );
}
