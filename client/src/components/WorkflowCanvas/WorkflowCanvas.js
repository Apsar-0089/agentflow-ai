import React, { useRef, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useWorkflowStore } from '../../store/workflowStore';
import { nodeTypes } from './CustomNodes';

function CanvasInternal() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange);
  const onConnect = useWorkflowStore((state) => state.onConnect);
  const addNode = useWorkflowStore((state) => state.addNode);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type');
      const dataRaw = event.dataTransfer.getData('application/reactflow-data');

      if (!type || !dataRaw) return;

      const itemData = JSON.parse(dataRaw);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: {
          label: itemData.label,
          category: itemData.category,
          description: itemData.description,
          action: itemData.action,
          params: { ...itemData.defaultParams },
          requiredFields: itemData.type === 'gmail' ? ['recipient', 'subject'] : [],
          retryCount: 2,
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative bg-[#090D16]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6366F1', strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.5}
          color="rgba(51, 65, 85, 0.4)"
        />
        <Controls className="!m-4 !border-surfaceBorder !bg-surface" showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            if (n.type === 'trigger') return '#10B981';
            if (n.type === 'ai_agent') return '#6366F1';
            if (n.type === 'gmail') return '#F43F5E';
            if (n.type === 'slack') return '#F59E0B';
            if (n.type === 'discord') return '#8B5CF6';
            if (n.type === 'google-sheets') return '#10B981';
            return '#3B82F6';
          }}
          maskColor="rgba(9, 13, 22, 0.7)"
          className="!m-4 !border-surfaceBorder"
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInternal />
    </ReactFlowProvider>
  );
}
