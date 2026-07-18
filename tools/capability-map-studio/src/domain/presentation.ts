export const capabilityPresentationTokens = {
  compactHeight: 110,
  compactIconMinHeight: 28,
  regularHeaderHeight: 47,
  regularIconSize: 20,
  compactIconSize: 18,
  regularNameFontSize: 15,
  compactNameFontSize: 12,
  minimalNameFontSize: 10,
  iconTextGap: 8,
  nameLineHeight: 1.15,
  nameVerticalInset: 4,
  maxNameLines: 3,
} as const;

export const groupPresentationTokens = {
  regularNameFontSize: 12,
  collapsedNameFontSize: 11,
} as const;

export interface CapabilityPresentation {
  compact: boolean;
  minimal: boolean;
  nameLineCount: number;
}

export function getCapabilityPresentation(
  height: number,
  hasVisibleContent: boolean,
): CapabilityPresentation {
  const compact = !hasVisibleContent || height < capabilityPresentationTokens.compactHeight;
  const minimal = height < capabilityPresentationTokens.compactIconMinHeight;
  const availableHeaderHeight = compact
    ? height
    : capabilityPresentationTokens.regularHeaderHeight;
  const fontSize = compact
    ? capabilityPresentationTokens.compactNameFontSize
    : capabilityPresentationTokens.regularNameFontSize;
  const fittingLines = Math.floor(
    Math.max(0, availableHeaderHeight - capabilityPresentationTokens.nameVerticalInset) /
      (fontSize * capabilityPresentationTokens.nameLineHeight),
  );

  return {
    compact,
    minimal,
    nameLineCount: minimal
      ? 1
      : Math.min(capabilityPresentationTokens.maxNameLines, Math.max(1, fittingLines)),
  };
}
