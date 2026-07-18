import type {
  NormalizedGroupItem,
  NormalizedHierarchyEntry,
} from './types';

export function buildHierarchyIndex(
  rootItems: NormalizedGroupItem[],
): Map<string, NormalizedHierarchyEntry> {
  const hierarchyById = new Map<string, NormalizedHierarchyEntry>();

  const visit = (
    items: NormalizedGroupItem[],
    parent: NormalizedHierarchyEntry | undefined,
  ) => {
    items.forEach((item) => {
      if (item.kind === 'flush') return;
      const entry: NormalizedHierarchyEntry = {
        kind: item.kind,
        id: item.id,
        name: item.name,
        parentId: parent?.id,
        path: [...(parent?.path ?? []), item.id],
        pathNames: [...(parent?.pathNames ?? []), item.name],
      };
      hierarchyById.set(entry.id, entry);
      const children = item.kind === 'group' ? item.capabilities : item.children;
      visit(children, entry);
    });
  };

  visit(rootItems, undefined);
  return hierarchyById;
}
