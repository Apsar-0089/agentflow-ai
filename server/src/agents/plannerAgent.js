/**
 * Planner Agent
 * Decides node execution ordering, validates acyclic graph topology,
 * resolves dependency trees, and calculates a confidence score.
 */
class PlannerAgent {
  constructor() {
    this.name = 'planner';
  }

  /**
   * Plan execution ordering for a workflow graph
   * @param {Object} workflow - Workflow object containing nodes and edges
   * @returns {Object} { plan: Array<Node>, confidenceScore: Number, analysis: Object }
   */
  async plan(workflow) {
    const { nodes = [], edges = [] } = workflow;

    if (!nodes || nodes.length === 0) {
      return {
        plan: [],
        confidenceScore: 0,
        analysis: { error: 'Workflow has no nodes to execute.' },
      };
    }

    // Build Adjacency List & In-Degree Map for Kahn's Topological Sort
    const inDegree = {};
    const adjList = {};
    const nodeMap = {};

    nodes.forEach((node) => {
      inDegree[node.id] = 0;
      adjList[node.id] = [];
      nodeMap[node.id] = node;
    });

    edges.forEach((edge) => {
      if (adjList[edge.source] && inDegree[edge.target] !== undefined) {
        adjList[edge.source].push(edge.target);
        inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
      }
    });

    // Queue of nodes with 0 incoming dependencies
    const queue = [];
    nodes.forEach((node) => {
      if (inDegree[node.id] === 0) {
        queue.push(node.id);
      }
    });

    const plannedOrder = [];
    const executionLevels = {};
    queue.forEach((id) => (executionLevels[id] = 0));

    while (queue.length > 0) {
      const currentId = queue.shift();
      plannedOrder.push(nodeMap[currentId]);

      const neighbors = adjList[currentId] || [];
      for (const neighborId of neighbors) {
        inDegree[neighborId]--;
        executionLevels[neighborId] = Math.max(
          executionLevels[neighborId] || 0,
          (executionLevels[currentId] || 0) + 1
        );

        if (inDegree[neighborId] === 0) {
          queue.push(neighborId);
        }
      }
    }

    // Check for cycles or unreached nodes
    const hasCycle = plannedOrder.length < nodes.length;
    let confidenceScore = 0.98;

    if (hasCycle) {
      // Add unreached nodes at the end to prevent total crash, but penalize confidence
      const unreached = nodes.filter((n) => !plannedOrder.some((p) => p.id === n.id));
      plannedOrder.push(...unreached);
      confidenceScore = 0.45;
    }

    // Penalize if trigger node is not first
    if (plannedOrder.length > 0 && plannedOrder[0].type !== 'trigger' && plannedOrder[0].type !== 'gmail') {
      confidenceScore -= 0.05;
    }

    // Bonus for clear linear or structured DAG
    if (edges.length >= nodes.length - 1 && !hasCycle) {
      confidenceScore = Math.min(1.0, confidenceScore + 0.02);
    }

    return {
      plan: plannedOrder,
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      analysis: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        hasCycle,
        executionLevels,
        rootNodes: nodes.filter((n) => (inDegree[n.id] || 0) === 0).map((n) => n.id),
      },
    };
  }
}

module.exports = new PlannerAgent();
