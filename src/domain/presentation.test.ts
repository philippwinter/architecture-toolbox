import { describe, expect, it } from 'vitest';
import {
  capabilityPresentationTokens,
  getCapabilityPresentation,
} from './presentation';

describe('getCapabilityPresentation', () => {
  it('uses legible shared sizes for live rendering and exports', () => {
    expect(capabilityPresentationTokens).toMatchObject({
      regularIconSize: 20,
      compactIconSize: 18,
      regularNameFontSize: 15,
      compactNameFontSize: 12,
      minimalNameFontSize: 10,
    });
  });

  it('keeps the icon in a compact node when its header has enough height', () => {
    expect(getCapabilityPresentation(35, false)).toEqual({
      compact: true,
      minimal: false,
      nameLineCount: 2,
    });
  });

  it('uses the minimal presentation only below the compact icon threshold', () => {
    expect(
      getCapabilityPresentation(
        capabilityPresentationTokens.compactIconMinHeight - 0.01,
        false,
      ),
    ).toEqual({ compact: true, minimal: true, nameLineCount: 1 });
  });

  it('keeps spacious nodes with visible content in the regular presentation', () => {
    expect(getCapabilityPresentation(128, true)).toEqual({
      compact: false,
      minimal: false,
      nameLineCount: 2,
    });
  });

  it('allows up to three lines in tall compact capability boxes', () => {
    expect(getCapabilityPresentation(58, false).nameLineCount).toBe(3);
  });
});
