export const capabilityPresentationTokens = {
  compactHeight: 110,
  compactIconMinHeight: 28,
  regularHeaderHeight: 47,
  regularNameFontSize: 13,
  compactNameFontSize: 11,
  nameLineHeight: 1.2,
  nameVerticalInset: 4,
  maxNameLines: 3,
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
