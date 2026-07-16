const YAML_KEY = 'capmap.yaml.v1';
const COLLAPSE_KEY = 'capmap.collapsed.v1';
const GROUP_COLLAPSE_KEY = 'capmap.groups.collapsed.v1';

export function loadYaml(fallback: string): string {
  try {
    return window.localStorage.getItem(YAML_KEY) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveYaml(value: string): void {
  try {
    window.localStorage.setItem(YAML_KEY, value);
  } catch {
    // The editor remains usable when storage is unavailable.
  }
}

export function clearYaml(): void {
  try {
    window.localStorage.removeItem(YAML_KEY);
  } catch {
    // Nothing else to do.
  }
}

export function loadCollapsedIds(): Set<string> {
  try {
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (!stored) return new Set();
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value): value is string => typeof value === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

export function saveCollapsedIds(ids: Set<string>): void {
  try {
    window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...ids].sort()));
  } catch {
    // The view state simply becomes session-only.
  }
}

export function clearCollapsedIds(): void {
  try {
    window.localStorage.removeItem(COLLAPSE_KEY);
  } catch {
    // Nothing else to do.
  }
}

export function loadCollapsedGroupIds(): Set<string> {
  try {
    const stored = window.localStorage.getItem(GROUP_COLLAPSE_KEY);
    if (!stored) return new Set();
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value): value is string => typeof value === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

export function saveCollapsedGroupIds(ids: Set<string>): void {
  try {
    window.localStorage.setItem(GROUP_COLLAPSE_KEY, JSON.stringify([...ids].sort()));
  } catch {
    // The view state simply becomes session-only.
  }
}

export function clearCollapsedGroupIds(): void {
  try {
    window.localStorage.removeItem(GROUP_COLLAPSE_KEY);
  } catch {
    // Nothing else to do.
  }
}
