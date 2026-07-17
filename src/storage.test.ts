import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCollapsedIds,
  clearCollapsedGroupIds,
  clearViewStateMetadata,
  clearYaml,
  loadCollapsedIds,
  loadCollapsedGroupIds,
  loadViewProfile,
  loadViewSignature,
  loadYaml,
  saveCollapsedIds,
  saveCollapsedGroupIds,
  saveViewProfile,
  saveViewSignature,
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

  it('stores the view profile and matching map signature separately', () => {
    saveViewProfile('level-3');
    saveViewSignature('map:500:abc');

    expect(loadViewProfile()).toBe('level-3');
    expect(loadViewSignature()).toBe('map:500:abc');

    clearViewStateMetadata();
    expect(loadViewProfile()).toBe('level-1');
    expect(loadViewSignature()).toBeUndefined();
  });

  it('migrates the removed overview profile to level 1', () => {
    window.localStorage.setItem('capmap.view.profile.v1', 'overview');
    window.localStorage.setItem('capmap.view.signature.v1', 'map:500:legacy');

    expect(loadViewProfile()).toBe('level-1');
    expect(loadViewSignature()).toBeUndefined();
  });
});
