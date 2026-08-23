const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');

/**
 * Workflow Service
 * Pure business logic for workflow persistence, duplication, versioning, and dashboard analytics.
 */
const createWorkflow = async (data, userId = null) => {
  const { name, description, triggerConfig, nodes = [], edges = [], tags = ['general'], status = 'active' } = data;

  const workflow = await Workflow.create({
    name: name || 'Untitled Automation Workflow',
    description: description || '',
    owner: userId,
    status,
    triggerConfig: triggerConfig || { type: 'manual', enabled: true },
    nodes,
    edges,
    version: 1,
    tags: tags.length > 0 ? tags : ['general'],
  });

  return workflow;
};

const getWorkflows = async ({ userId, search, tag, status, page = 1, limit = 20 }) => {
  const query = {};
  if (userId) {
    query.$or = [{ owner: userId }, { owner: null }];
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  if (tag) {
    query.tags = tag;
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [workflows, total] = await Promise.all([
    Workflow.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    Workflow.countDocuments(query),
  ]);

  return {
    workflows,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

const getWorkflowById = async (id, userId = null) => {
  const workflow = await Workflow.findById(id);
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    throw error;
  }
  return workflow;
};

const updateWorkflow = async (id, data, userId = null) => {
  const workflow = await Workflow.findById(id);
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    throw error;
  }

  // Increment version if graph nodes or edges changed
  const graphChanged =
    (data.nodes && JSON.stringify(data.nodes) !== JSON.stringify(workflow.nodes)) ||
    (data.edges && JSON.stringify(data.edges) !== JSON.stringify(workflow.edges));

  if (data.name !== undefined) workflow.name = data.name;
  if (data.description !== undefined) workflow.description = data.description;
  if (data.status !== undefined) workflow.status = data.status;
  if (data.triggerConfig !== undefined) workflow.triggerConfig = data.triggerConfig;
  if (data.nodes !== undefined) workflow.nodes = data.nodes;
  if (data.edges !== undefined) workflow.edges = data.edges;
  if (data.tags !== undefined) workflow.tags = data.tags;

  if (graphChanged) {
    workflow.version += 1;
  }

  await workflow.save();
  return workflow;
};

const duplicateWorkflow = async (id, userId = null) => {
  const original = await Workflow.findById(id);
  if (!original) {
    const error = new Error('Original workflow not found to duplicate');
    error.statusCode = 404;
    throw error;
  }

  const clone = await Workflow.create({
    name: `${original.name} (Copy)`,
    description: original.description,
    owner: userId || original.owner,
    status: 'draft',
    triggerConfig: original.triggerConfig,
    nodes: original.nodes,
    edges: original.edges,
    version: 1,
    tags: [...(original.tags || []), 'cloned'],
  });

  return clone;
};

const deleteWorkflow = async (id, userId = null) => {
  const workflow = await Workflow.findById(id);
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    throw error;
  }

  await Workflow.findByIdAndDelete(id);
  return { success: true, message: 'Workflow deleted successfully' };
};

const getDashboardStats = async (userId = null) => {
  const wfQuery = userId ? { $or: [{ owner: userId }, { owner: null }] } : {};

  const [
    totalWorkflows,
    activeWorkflows,
    totalExecutions,
    completedExecutions,
    failedExecutions,
    recentExecutions,
    recentLogs,
  ] = await Promise.all([
    Workflow.countDocuments(wfQuery),
    Workflow.countDocuments({ ...wfQuery, status: 'active' }),
    Execution.countDocuments(),
    Execution.countDocuments({ status: 'COMPLETED' }),
    Execution.countDocuments({ status: 'FAILED' }),
    Execution.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('workflowId', 'name tags status')
      .lean(),
    ExecutionLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean(),
  ]);

  const successRate =
    totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100) : 100;

  return {
    metrics: {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      successRate,
    },
    recentExecutions,
    recentLogs,
  };
};

module.exports = {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  updateWorkflow,
  duplicateWorkflow,
  deleteWorkflow,
  getDashboardStats,
};
