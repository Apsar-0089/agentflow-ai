const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const orchestrator = require('../agents/orchestrator');
const { addExecutionJob } = require('../queues/executionQueue');

/**
 * Execution Service
 * Handles execution initialization, job queue dispatching, state lifecycle, and timeline queries.
 */
const triggerExecution = async (workflowId, inputs = {}, userId = null) => {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    const error = new Error('Workflow not found');
    error.statusCode = 404;
    throw error;
  }

  // Create immutable snapshot of the workflow graph at trigger time
  const workflowSnapshot = {
    _id: workflow._id,
    name: workflow.name,
    description: workflow.description,
    version: workflow.version,
    nodes: workflow.nodes,
    edges: workflow.edges,
    triggerConfig: workflow.triggerConfig,
    tags: workflow.tags,
  };

  const execution = await Execution.create({
    workflowId: workflow._id,
    workflowSnapshot,
    status: 'PENDING',
    inputs: inputs || {},
    retryCount: 0,
    startTime: new Date(),
  });

  // Dispatch to background queue or async in-memory runner
  const queueResult = await addExecutionJob(execution._id, userId);

  return {
    execution,
    queue: queueResult,
  };
};

const getExecutions = async ({ status, workflowId, page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (workflowId) query.workflowId = workflowId;

  const skip = (page - 1) * limit;

  const [executions, total] = await Promise.all([
    Execution.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('workflowId', 'name tags status')
      .lean(),
    Execution.countDocuments(query),
  ]);

  return {
    executions,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

const getExecutionById = async (id) => {
  const execution = await Execution.findById(id).populate('workflowId', 'name description tags status');
  if (!execution) {
    const error = new Error('Execution not found');
    error.statusCode = 404;
    throw error;
  }
  return execution;
};

const getExecutionTimeline = async (id) => {
  const execution = await Execution.findById(id);
  if (!execution) {
    const error = new Error('Execution not found');
    error.statusCode = 404;
    throw error;
  }

  const logs = await ExecutionLog.find({ executionId: id })
    .sort({ timestamp: 1 })
    .lean();

  return {
    executionId: id,
    status: execution.status,
    currentNode: execution.currentNode,
    duration: execution.duration,
    confidenceScore: execution.confidenceScore,
    langGraphStatus: execution.langGraphStatus,
    logs,
  };
};

const pauseExecution = async (id) => {
  const execution = await Execution.findById(id);
  if (!execution) {
    const error = new Error('Execution not found');
    error.statusCode = 404;
    throw error;
  }

  if (execution.status !== 'RUNNING' && execution.status !== 'RETRYING') {
    const error = new Error(`Cannot pause execution with status: ${execution.status}`);
    error.statusCode = 400;
    throw error;
  }

  orchestrator.setControlSignal(id, 'PAUSE');
  execution.status = 'PAUSED';
  await execution.save();

  return { success: true, message: 'Pause signal sent to execution orchestrator', execution };
};

const resumeExecution = async (id) => {
  const execution = await Execution.findById(id);
  if (!execution) {
    const error = new Error('Execution not found');
    error.statusCode = 404;
    throw error;
  }

  if (execution.status !== 'PAUSED') {
    const error = new Error(`Cannot resume execution with status: ${execution.status}`);
    error.statusCode = 400;
    throw error;
  }

  orchestrator.setControlSignal(id, 'RESUME');
  execution.status = 'RUNNING';
  await execution.save();

  return { success: true, message: 'Resume signal sent to execution orchestrator', execution };
};

const cancelExecution = async (id) => {
  const execution = await Execution.findById(id);
  if (!execution) {
    const error = new Error('Execution not found');
    error.statusCode = 404;
    throw error;
  }

  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution.status)) {
    const error = new Error(`Cannot cancel execution that is already ${execution.status}`);
    error.statusCode = 400;
    throw error;
  }

  orchestrator.setControlSignal(id, 'CANCEL');
  execution.status = 'CANCELLED';
  execution.endTime = new Date();
  execution.duration = Date.now() - new Date(execution.startTime).getTime();
  await execution.save();

  return { success: true, message: 'Cancel signal sent to execution orchestrator', execution };
};

module.exports = {
  triggerExecution,
  getExecutions,
  getExecutionById,
  getExecutionTimeline,
  pauseExecution,
  resumeExecution,
  cancelExecution,
};
