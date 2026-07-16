import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react';
import { useEffect, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import { layoutRootItems } from '../domain/layout';
import type { VisibleRootItem } from '../domain/types';
import {
  CapabilityGroupNode,
  type CapabilityGroupFlowNode,
} from './CapabilityGroupNode';
import { CapabilityNode, type CapabilityFlowNode } from './CapabilityNode';

interface CapabilityMapProps {
  roots: VisibleRootItem[];
  collapsedIds: Set<string>;
  selectedId?: string;
  onSelect: (id?: string) => void;
  onToggle: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onFocus: (id: string) => void;
}

type MapFlowNode = CapabilityFlowNode | CapabilityGroupFlowNode;

const nodeTypes = {
  capability: CapabilityNode,
  capabilityGroup: CapabilityGroupNode,
};

function MapCanvas({
  roots,
  collapsedIds,
  selectedId,
  onSelect,
  onToggle,
  onToggleGroup,
  onFocus,
}: CapabilityMapProps) {
  const { fitView } = useReactFlow<MapFlowNode>();
  const nodes = useMemo<MapFlowNode[]>(() => {
    const layout = layoutRootItems(roots);
    return layout.map((layoutNode): MapFlowNode => {
      const { rect } = layoutNode;
      if (layoutNode.kind === 'group') {
        const { item } = layoutNode;
        return {
          id: item.group.id,
          type: 'capabilityGroup',
          position: { x: rect.x, y: rect.y },
          width: rect.width,
          height: rect.height,
          style: { width: rect.width, height: rect.height },
          draggable: false,
          selectable: false,
          zIndex: -1,
          data: {
            group: item.group,
            collapsed: item.collapsed,
            autoCollapsed: item.autoCollapsed,
            labelSize: layoutNode.labelSize,
            onToggle: onToggleGroup,
          },
        };
      }

      const { item } = layoutNode;
      return {
        id: item.capability.id,
        type: 'capability',
        parentId: layoutNode.parentId,
        position: { x: rect.x, y: rect.y },
        width: rect.width,
        height: rect.height,
        style: { width: rect.width, height: rect.height },
        draggable: false,
        selectable: true,
        selected: item.capability.id === selectedId,
        zIndex: item.capability.depth + 1,
        data: {
          capability: item.capability,
          contextOnly: item.contextOnly,
          searchMatch: item.searchMatch,
          collapsed: collapsedIds.has(item.capability.id),
          compact: rect.height < 110,
          minimal: rect.height < 58,
          hiddenDescendantCount: layoutNode.hiddenDescendantCount,
          hasChildren: item.capability.children.length > 0,
          onToggle,
          onFocus,
        },
      };
    });
  }, [collapsedIds, onFocus, onToggle, onToggleGroup, roots, selectedId]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      void fitView({ padding: 0.04, duration: 250, minZoom: 0.25, maxZoom: 1.4 });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [fitView, roots]);

  const handleNodeClick: NodeMouseHandler<MapFlowNode> = (_event, node) => {
    if (node.type === 'capability') onSelect(node.id);
  };

  if (roots.length === 0) {
    return (
      <div className="map-empty">
        <strong>Keine Capabilities gefunden</strong>
        <span>Passe die aktiven Filter an.</span>
      </div>
    );
  }

  return (
    <ReactFlow<MapFlowNode>
      nodes={nodes}
      edges={[]}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={() => onSelect(undefined)}
      onNodeDoubleClick={(_event, node) => {
        if (node.type === 'capability') onFocus(node.id);
      }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      deleteKeyCode={null}
      minZoom={0.15}
      maxZoom={2.5}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#d8dde5" gap={24} size={1} />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
}

export function CapabilityMap(props: CapabilityMapProps) {
  const graphKey = useMemo(() => {
    const collectCapabilities = (items: VisibleRootItem[]): string[] =>
      items.flatMap((item) => {
        if (item.kind === 'group') {
          return [item.group.id, ...collectCapabilities(item.capabilities)];
        }
        return [item.capability.id, ...collectCapabilities(item.children)];
      });
    return collectCapabilities(props.roots).join('|');
  }, [props.roots]);

  return (
    <ReactFlowProvider key={graphKey}>
      <MapCanvas {...props} />
    </ReactFlowProvider>
  );
}
