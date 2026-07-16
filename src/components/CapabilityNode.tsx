import { ChevronDown, ChevronRight, Focus, Layers3 } from 'lucide-react';
import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { NormalizedCapability } from '../domain/types';
import { CapabilityIcon } from './CapabilityIcon';

export interface CapabilityNodeData extends Record<string, unknown> {
  capability: NormalizedCapability;
  contextOnly: boolean;
  searchMatch: boolean;
  collapsed: boolean;
  compact: boolean;
  minimal: boolean;
  hiddenDescendantCount: number;
  hasChildren: boolean;
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
  const stop = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <article
      className={`capability-node${selected ? ' selected' : ''}${
        data.contextOnly ? ' context-only' : ''
      }${data.searchMatch ? ' search-match' : ''}${compact ? ' compact' : ''}${
        minimal ? ' minimal' : ''
      }`}
      style={{ '--cap-color': capability.color, '--cap-text': foreground } as React.CSSProperties}
      title={capability.name}
    >
      <header className="capability-node__header">
        {!minimal && (
          <CapabilityIcon
            name={capability.icon}
            className="capability-node__icon"
            size={compact ? 14 : 17}
          />
        )}
        <strong>{capability.name}</strong>
        <span className="capability-node__actions">
          {!minimal && (
            <button
              type="button"
              title="Teilbaum fokussieren"
              aria-label={`${capability.name} fokussieren`}
              onClick={(event) => {
                stop(event);
                data.onFocus(capability.id);
              }}
            >
              <Focus size={14} />
            </button>
          )}
          {hasChildren && (
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
      {!compact && capability.children.length === 0 && capability.description && (
        <p>{capability.description}</p>
      )}
      {hiddenDescendantCount > 0 && (
        <span className="hidden-count">
          <Layers3 size={13} /> +{hiddenDescendantCount}
        </span>
      )}
    </article>
  );
});
