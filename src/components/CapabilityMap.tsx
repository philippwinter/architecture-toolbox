import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import '@xyflow/react/dist/style.css';
import { layoutRootItems } from '../domain/layout';
import { getCapabilityPresentation } from '../domain/presentation';
import type { VisibleRootItem } from '../domain/types';
import {
  CapabilityGroupNode,
  type CapabilityGroupFlowNode,
} from './CapabilityGroupNode';
import { CapabilityNode, type CapabilityFlowNode } from './CapabilityNode';

interface CapabilityMapProps {
  roots: VisibleRootItem[];
  mapKey: string;
  focusId?: string;
  fitVersion: number;
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
  mapKey,
  focusId,
  fitVersion,
  collapsedIds,
  selectedId,
  onSelect,
  onToggle,
  onToggleGroup,
  onFocus,
}: CapabilityMapProps) {
  const { getViewport, setViewport } = useReactFlow<MapFlowNode>();
  const hostRef = useRef<HTMLDivElement>(null);
  const pendingAnchorRef = useRef<{ id: string; x: number; y: number } | undefined>(undefined);
  const previousMapKeyRef = useRef<string | undefined>(undefined);
  const previousFitVersionRef = useRef<number | undefined>(undefined);
  const previousFocusIdRef = useRef<string | undefined>(undefined);
  const rootViewportRef = useRef<ReturnType<typeof getViewport> | undefined>(undefined);

  const findNodeElement = useCallback((id: string): HTMLElement | null => {
    const escapedId = typeof CSS === 'undefined' ? id : CSS.escape(id);
    return hostRef.current?.querySelector<HTMLElement>(`[data-id="${escapedId}"]`) ?? null;
  }, []);

  const preserveAnchorAndRun = useCallback(
    (id: string, action: (targetId: string) => void) => {
      const element = findNodeElement(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        pendingAnchorRef.current = {
          id,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
      action(id);
    },
    [findNodeElement],
  );

  const handleToggle = useCallback(
    (id: string) => preserveAnchorAndRun(id, onToggle),
    [onToggle, preserveAnchorAndRun],
  );
  const handleToggleGroup = useCallback(
    (id: string) => preserveAnchorAndRun(id, onToggleGroup),
    [onToggleGroup, preserveAnchorAndRun],
  );

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
          parentId: layoutNode.parentId,
          style: { width: rect.width, height: rect.height },
          draggable: false,
          selectable: false,
          zIndex: item.group.groupLevel - 2,
          data: {
            group: item.group,
            collapsed: item.collapsed,
            autoCollapsed: item.autoCollapsed,
            labelSize: layoutNode.labelSize,
            collapsedTrackFill: layoutNode.collapsedTrackFill,
            onToggle: handleToggleGroup,
          },
        };
      }

      const { item } = layoutNode;
      const presentation = getCapabilityPresentation(
        rect.height,
        item.children.some((child) => child.kind !== 'flush'),
      );
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
          compact: presentation.compact,
          minimal: presentation.minimal,
          nameLineCount: presentation.nameLineCount,
          hiddenDescendantCount: layoutNode.hiddenDescendantCount,
          hasChildren: item.capability.children.some((child) => child.kind === 'capability'),
          chevronContinues: layoutNode.chevronContinues,
          onToggle: handleToggle,
          onFocus,
        },
      };
    });
  }, [collapsedIds, handleToggle, handleToggleGroup, onFocus, roots, selectedId]);
  const rootNodesForFit = useMemo(() => nodes.filter((node) => !node.parentId), [nodes]);

  const fitRootView = useCallback(
    (duration = 0, padding = 0.04) => {
      const host = hostRef.current;
      if (!host || rootNodesForFit.length === 0) return;
      const minX = Math.min(...rootNodesForFit.map((node) => node.position.x));
      const minY = Math.min(...rootNodesForFit.map((node) => node.position.y));
      const maxX = Math.max(
        ...rootNodesForFit.map((node) => node.position.x + (node.width ?? 0)),
      );
      const maxY = Math.max(
        ...rootNodesForFit.map((node) => node.position.y + (node.height ?? 0)),
      );
      const boundsWidth = Math.max(1, maxX - minX);
      const boundsHeight = Math.max(1, maxY - minY);
      const usableWidth = host.clientWidth * Math.max(0.1, 1 - padding * 2);
      const usableHeight = host.clientHeight * Math.max(0.1, 1 - padding * 2);
      const zoom = Math.min(
        1.4,
        Math.max(0.001, Math.min(usableWidth / boundsWidth, usableHeight / boundsHeight)),
      );
      void setViewport(
        {
          x: (host.clientWidth - boundsWidth * zoom) / 2 - minX * zoom,
          y: (host.clientHeight - boundsHeight * zoom) / 2 - minY * zoom,
          zoom,
        },
        { duration },
      );
    },
    [rootNodesForFit, setViewport],
  );

  useEffect(() => {
    const anchor = pendingAnchorRef.current;
    if (!anchor) return;
    const animationFrame = window.requestAnimationFrame(() => {
      const element = findNodeElement(anchor.id);
      if (!element) {
        pendingAnchorRef.current = undefined;
        return;
      }
      const rect = element.getBoundingClientRect();
      const nextX = rect.left + rect.width / 2;
      const nextY = rect.top + rect.height / 2;
      const viewport = getViewport();
      void setViewport(
        {
          ...viewport,
          x: viewport.x + anchor.x - nextX,
          y: viewport.y + anchor.y - nextY,
        },
        { duration: 0 },
      );
      pendingAnchorRef.current = undefined;
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [findNodeElement, getViewport, nodes, setViewport]);

  useEffect(() => {
    const previousMapKey = previousMapKeyRef.current;
    const previousFitVersion = previousFitVersionRef.current;
    const previousFocusId = previousFocusIdRef.current;
    const mapChanged = previousMapKey === undefined || previousMapKey !== mapKey;
    const fitRequested = previousFitVersion !== undefined && previousFitVersion !== fitVersion;
    const focusChanged = previousFocusId !== focusId;

    const timeout = window.setTimeout(() => {
      previousMapKeyRef.current = mapKey;
      previousFitVersionRef.current = fitVersion;
      previousFocusIdRef.current = focusId;
      if (mapChanged || fitRequested) {
        rootViewportRef.current = undefined;
        fitRootView();
        return;
      }
      if (!focusChanged) return;
      if (focusId) {
        if (!previousFocusId) rootViewportRef.current = getViewport();
        fitRootView(180, 0.08);
      } else if (rootViewportRef.current) {
        void setViewport(rootViewportRef.current, { duration: 180 });
        rootViewportRef.current = undefined;
      }
    }, 100);
    return () => window.clearTimeout(timeout);
  }, [fitRootView, fitVersion, focusId, getViewport, mapKey, setViewport]);

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
    <div ref={hostRef} className="map-flow-host">
      <ReactFlow<MapFlowNode>
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onPaneClick={() => onSelect(undefined)}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        deleteKeyCode={null}
        minZoom={0.001}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d8dde5" gap={24} size={1} />
        <Controls
          showInteractive={false}
          position="bottom-right"
          onFitView={() => fitRootView(180)}
        />
      </ReactFlow>
    </div>
  );
}

export function CapabilityMap(props: CapabilityMapProps) {
  return (
    <ReactFlowProvider>
      <MapCanvas {...props} />
    </ReactFlowProvider>
  );
}
