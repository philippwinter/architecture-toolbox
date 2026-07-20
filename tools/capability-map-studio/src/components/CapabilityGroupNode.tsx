import { memo, useEffect, useRef } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import { groupPresentationTokens } from '../domain/presentation';
import type { NormalizedCapabilityGroup } from '../domain/types';

export interface CapabilityGroupNodeData extends Record<string, unknown> {
  group: NormalizedCapabilityGroup;
  collapsed: boolean;
  autoCollapsed: boolean;
  labelSize: number;
  collapsedTrackFill: boolean;
  collapsedBandFill: boolean;
  onToggle: (id: string) => void;
  onFocus: (id: string) => void;
}

export type CapabilityGroupFlowNode = Node<CapabilityGroupNodeData, 'capabilityGroup'>;

export const CapabilityGroupNode = memo(function CapabilityGroupNode({
  data,
}: NodeProps<CapabilityGroupFlowNode>) {
  const { group, collapsed, autoCollapsed } = data;
  const vertical = group.layout.direction === 'vertical';
  const actionLabel = collapsed ? `${group.name} ausklappen` : `${group.name} einklappen`;
  const toggleTimerRef = useRef<number | undefined>(undefined);
  const cancelPendingToggle = () => {
    if (toggleTimerRef.current === undefined) return;
    window.clearTimeout(toggleTimerRef.current);
    toggleTimerRef.current = undefined;
  };

  useEffect(
    () => () => {
      if (toggleTimerRef.current !== undefined) {
        window.clearTimeout(toggleTimerRef.current);
      }
    },
    [],
  );

  const focusGroup = (event: React.MouseEvent) => {
    event.stopPropagation();
    cancelPendingToggle();
    data.onFocus(group.id);
  };

  return (
    <section
      className={`capability-group ${vertical ? 'vertical' : 'horizontal'}${
        collapsed ? ' collapsed' : ''
      }${autoCollapsed ? ' auto-collapsed' : ''}${
        data.collapsedTrackFill ? ' collapsed-track-fill' : ''
      }${data.collapsedBandFill ? ' collapsed-band-fill' : ''
      }`}
      style={
        {
          '--group-color': group.backgroundColor,
          '--group-label-size': `${data.labelSize}px`,
        } as React.CSSProperties
      }
      aria-label={`Gruppe ${group.name}`}
      title={collapsed ? group.name : undefined}
      onDoubleClickCapture={focusGroup}
    >
      <button
        type="button"
        className="capability-group__label"
        aria-label={actionLabel}
        title={autoCollapsed ? 'Keine Treffer in dieser Gruppe' : actionLabel}
        onClick={(event) => {
          event.stopPropagation();
          cancelPendingToggle();
          if (event.detail > 1) return;
          toggleTimerRef.current = window.setTimeout(() => {
            toggleTimerRef.current = undefined;
            data.onToggle(group.id);
          }, 220);
        }}
      >
        <strong
          style={{
            fontSize: collapsed
              ? groupPresentationTokens.collapsedNameFontSize
              : groupPresentationTokens.regularNameFontSize,
          }}
        >
          {group.name}
        </strong>
      </button>
    </section>
  );
});
