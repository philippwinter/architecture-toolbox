import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCollapsedIds,
  clearCollapsedGroupIds,
  clearYaml,
  loadCollapsedIds,
  loadCollapsedGroupIds,
  loadYaml,
  saveCollapsedIds,
  saveCollapsedGroupIds,
  saveYaml,
} from './storage';

describe('local storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('stores YAML and collapse state separately', () => {
    saveYaml('version: 1');
    saveCollapsedIds(new Set(['b', 'a']));
    saveCollapsedGroupIds(new Set(['group-b', 'group-a']));

    expect(loadYaml('fallback')).toBe('version: 1');
    expect([...loadCollapsedIds()]).toEqual(['a', 'b']);
    expect([...loadCollapsedGroupIds()]).toEqual(['group-a', 'group-b']);

    clearCollapsedIds();
    expect(loadCollapsedIds()).toEqual(new Set());
    expect(loadYaml('fallback')).toBe('version: 1');

    clearCollapsedGroupIds();
    expect(loadCollapsedGroupIds()).toEqual(new Set());

    clearYaml();
    expect(loadYaml('fallback')).toBe('fallback');
  });

  it('ignores malformed collapse state', () => {
    window.localStorage.setItem('capmap.collapsed.v1', '{broken');
    expect(loadCollapsedIds()).toEqual(new Set());
  });
});
