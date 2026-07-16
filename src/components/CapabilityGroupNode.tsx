import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { NormalizedCapabilityGroup } from '../domain/types';

export interface CapabilityGroupNodeData extends Record<string, unknown> {
  group: NormalizedCapabilityGroup;
  collapsed: boolean;
  autoCollapsed: boolean;
  labelSize: number;
  onToggle: (id: string) => void;
}

export type CapabilityGroupFlowNode = Node<CapabilityGroupNodeData, 'capabilityGroup'>;

export const CapabilityGroupNode = memo(function CapabilityGroupNode({
  data,
}: NodeProps<CapabilityGroupFlowNode>) {
  const { group, collapsed, autoCollapsed } = data;
  const vertical = group.layout.direction === 'vertical';
  const actionLabel = collapsed ? `${group.name} ausklappen` : `${group.name} einklappen`;

  return (
    <section
      className={`capability-group ${vertical ? 'vertical' : 'horizontal'}${
        collapsed ? ' collapsed' : ''
      }${autoCollapsed ? ' auto-collapsed' : ''}`}
      style={
        {
          '--group-color': group.backgroundColor,
          '--group-label-size': `${data.labelSize}px`,
        } as React.CSSProperties
      }
      aria-label={`Gruppe ${group.name}`}
      title={collapsed ? group.name : undefined}
    >
      <button
        type="button"
        className="capability-group__label"
        aria-label={actionLabel}
        title={autoCollapsed ? 'Keine Treffer in dieser Gruppe' : actionLabel}
        onClick={(event) => {
          event.stopPropagation();
          data.onToggle(group.id);
        }}
      >
        <strong>{group.name}</strong>
      </button>
    </section>
  );
});
