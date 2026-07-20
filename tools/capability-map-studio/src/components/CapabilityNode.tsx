import { ChevronDown, ChevronRight, Layers3 } from 'lucide-react';
import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { capabilityPresentationTokens } from '../domain/presentation';
import type { CapabilityShapeGeometry } from '../domain/shapes';
import type { NormalizedCapability } from '../domain/types';
import { CapabilityIcon } from './CapabilityIcon';

export interface CapabilityNodeData extends Record<string, unknown> {
  capability: NormalizedCapability;
  contextOnly: boolean;
  searchMatch: boolean;
  collapsed: boolean;
  compact: boolean;
  minimal: boolean;
  nameLineCount: number;
  hiddenDescendantCount: number;
  hasChildren: boolean;
  focusExpanded: boolean;
  geometry: CapabilityShapeGeometry;
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
}

export type CapabilityFlowNode = Node<CapabilityNodeData, 'capability'>;

function textColor(background: string): string {
  const red = Number.parseInt(background.slice(1, 3), 16);
  const green = Number.parseInt(background.slice(3, 5), 16);
  const blue = Number.parseInt(background.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.57 ? '#17202a' : '#ffffff';
}

export const CapabilityNode = memo(function CapabilityNode({
  data,
  selected,
}: NodeProps<CapabilityFlowNode>) {
  const {
    capability,
    compact,
    minimal,
    hiddenDescendantCount,
    hasChildren,
    collapsed,
  } = data;
  const foreground = textColor(capability.color);
  const { geometry } = data;
  const iconSize = compact
    ? capabilityPresentationTokens.compactIconSize
    : capabilityPresentationTokens.regularIconSize;
  const nameFontSize = minimal
    ? capabilityPresentationTokens.minimalNameFontSize
    : compact
      ? capabilityPresentationTokens.compactNameFontSize
      : capabilityPresentationTokens.regularNameFontSize;
  const stop = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <article
      className={`capability-node${selected ? ' selected' : ''}${
        data.contextOnly ? ' context-only' : ''
      }${data.searchMatch ? ' search-match' : ''}${compact ? ' compact' : ''}${
        minimal ? ' minimal' : ''
      } shape-${geometry.renderedShapeId} configured-shape-${
        geometry.configuredShapeId
      } direction-${capability.layout.direction}`}
      style={
        {
          '--cap-color': capability.color,
          '--cap-text': foreground,
        } as React.CSSProperties
      }
      title={capability.name}
      aria-label={capability.name}
      onDoubleClickCapture={(event) => {
        event.stopPropagation();
        data.onFocus(capability.id);
      }}
    >
      <svg
        className="capability-node__surface"
        viewBox={`0 0 ${geometry.bounds.width} ${geometry.bounds.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="capability-node__shape"
          d={geometry.path}
          fill={capability.color}
          stroke="rgb(20 30 40 / 21%)"
          strokeWidth={geometry.strokeWidth}
          strokeLinejoin={geometry.strokeLinejoin}
        />
        <path className="capability-node__state-outline" d={geometry.path} />
      </svg>
      <div
        className="capability-node__content nodrag"
        style={{
          left: geometry.contentRect.x,
          top: geometry.contentRect.y,
          width: geometry.contentRect.width,
          height: geometry.contentRect.height,
        }}
      >
        <header
          className="capability-node__header"
          style={{ gap: capabilityPresentationTokens.iconTextGap }}
        >
          {!minimal && (
            <CapabilityIcon
              name={capability.icon}
              className="capability-node__icon"
              size={iconSize}
            />
          )}
          <strong
            style={{
              WebkitLineClamp: data.nameLineCount,
              fontSize: nameFontSize,
              lineHeight: capabilityPresentationTokens.nameLineHeight,
            }}
          >
            {capability.name}
          </strong>
          <span className="capability-node__actions">
            {hasChildren && !data.focusExpanded && (
              <button
                type="button"
                title={collapsed ? 'Kinder einblenden' : 'Kinder ausblenden'}
                aria-label={`${capability.name} ${collapsed ? 'ausklappen' : 'einklappen'}`}
                onClick={(event) => {
                  stop(event);
                  data.onToggle(capability.id);
                }}
              >
                {collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              </button>
            )}
          </span>
        </header>
        {hiddenDescendantCount > 0 && (
          <span className="hidden-count">
            <Layers3 size={13} /> +{hiddenDescendantCount}
          </span>
        )}
      </div>
    </article>
  );
});
