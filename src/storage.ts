import type { ViewProfile } from './domain/viewState';

const YAML_KEY = 'capmap.yaml.v1';
const COLLAPSE_KEY = 'capmap.collapsed.v1';
const GROUP_COLLAPSE_KEY = 'capmap.groups.collapsed.v1';
const VIEW_PROFILE_KEY = 'capmap.view.profile.v1';
const VIEW_SIGNATURE_KEY = 'capmap.view.signature.v1';

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

export function loadViewProfile(): ViewProfile {
  try {
    const value = window.localStorage.getItem(VIEW_PROFILE_KEY);
    if (value === 'overview') {
      window.localStorage.setItem(VIEW_PROFILE_KEY, 'level-1');
      window.localStorage.removeItem(VIEW_SIGNATURE_KEY);
      return 'level-1';
    }
    return value === 'level-1' ||
      value === 'level-2' ||
      value === 'level-3' ||
      value === 'all' ||
      value === 'custom'
      ? value
      : 'level-1';
  } catch {
    return 'level-1';
  }
}

export function saveViewProfile(profile: ViewProfile): void {
  try {
    window.localStorage.setItem(VIEW_PROFILE_KEY, profile);
  } catch {
    // The view state simply becomes session-only.
  }
}

export function loadViewSignature(): string | undefined {
  try {
    return window.localStorage.getItem(VIEW_SIGNATURE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function saveViewSignature(signature: string): void {
  try {
    window.localStorage.setItem(VIEW_SIGNATURE_KEY, signature);
  } catch {
    // The view state simply becomes session-only.
  }
}

export function clearViewStateMetadata(): void {
  try {
    window.localStorage.removeItem(VIEW_PROFILE_KEY);
    window.localStorage.removeItem(VIEW_SIGNATURE_KEY);
  } catch {
    // Nothing else to do.
  }
}
