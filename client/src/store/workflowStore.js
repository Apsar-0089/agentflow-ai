import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

export const useWorkflowStore = create((set, get) => ({
  workflowId: null,
  name: 'New Automation Workflow',
  description: '',
  status: 'active',
  tags: ['general'],
  triggerConfig: { type: 'manual', enabled: true },
  version: 1,
  nodes: [],
  edges: [],
  selectedNode: null,
  isDirty: false,

  setWorkflowMeta: (meta) =>
    set((state) => ({
      ...state,
      ...meta,
      isDirty: true,
    })),

  loadWorkflow: (wf) => {
    set({
      workflowId: wf._id || wf.id,
      name: wf.name || 'Untitled Workflow',
      description: wf.description || '',
      status: wf.status || 'active',
      tags: wf.tags || ['general'],
      triggerConfig: wf.triggerConfig || { type: 'manual', enabled: true },
      version: wf.version || 1,
      nodes: wf.nodes || [],
      edges: wf.edges || [],
      selectedNode: null,
      isDirty: false,
    });
  },

  resetStore: () => {
    set({
      workflowId: null,
      name: 'New Automation Workflow',
      description: '',
      status: 'active',
      tags: ['general'],
      triggerConfig: { type: 'manual', enabled: true },
      version: 1,
      nodes: [],
      edges: [],
      selectedNode: null,
      isDirty: false,
    });
  },

  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: '#6366F1', strokeWidth: 2 },
        },
        get().edges
      ),
      isDirty: true,
    });
  },

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
      selectedNode: node,
      isDirty: true,
    }));
  },

  setSelectedNode: (node) => {
    set({ selectedNode: node });
  },

  updateNodeData: (nodeId, updatedData) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) => {
        if (node.id === nodeId) {
          const mergedData = { ...node.data, ...updatedData };
          const updatedNode = { ...node, data: mergedData };
          return updatedNode;
        }
        return node;
      });

      const updatedSelected =
        state.selectedNode && state.selectedNode.id === nodeId
          ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...updatedData } }
          : state.selectedNode;

      return {
        nodes: updatedNodes,
        selectedNode: updatedSelected,
        isDirty: true,
      };
    });
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      isDirty: true,
    }));
  },
}));
