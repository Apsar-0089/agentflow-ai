const workflowService = require('../services/workflowService');
const aiService = require('../services/aiService');
const executionService = require('../services/executionService');

const getDashboard = async (req, res, next) => {
  try {
    const stats = await workflowService.getDashboardStats(req.user?.id);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

const getWorkflows = async (req, res, next) => {
  try {
    const { search, tag, status, page, limit } = req.query;
    const result = await workflowService.getWorkflows({
      userId: req.user?.id,
      search,
      tag,
      status,
      page,
      limit,
    });
    res.status(200).json({
      success: true,
      data: result.workflows,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getWorkflowById = async (req, res, next) => {
  try {
    const workflow = await workflowService.getWorkflowById(req.params.id, req.user?.id);
    res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (err) {
    next(err);
  }
};

const createWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.createWorkflow(req.body, req.user?.id);
    res.status(201).json({
      success: true,
      data: workflow,
    });
  } catch (err) {
    next(err);
  }
};

const generateWorkflowFromAI = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const generatedGraph = await aiService.generateWorkflowFromPrompt(prompt);
    res.status(200).json({
      success: true,
      data: generatedGraph,
    });
  } catch (err) {
    next(err);
  }
};

const updateWorkflow = async (req, res, next) => {
  try {
    const workflow = await workflowService.updateWorkflow(req.params.id, req.body, req.user?.id);
    res.status(200).json({
      success: true,
      data: workflow,
    });
  } catch (err) {
    next(err);
  }
};

const duplicateWorkflow = async (req, res, next) => {
  try {
    const cloned = await workflowService.duplicateWorkflow(req.params.id, req.user?.id);
    res.status(201).json({
      success: true,
      data: cloned,
    });
  } catch (err) {
    next(err);
  }
};

const executeWorkflow = async (req, res, next) => {
  try {
    const { inputs } = req.body;
    const result = await executionService.triggerExecution(req.params.id, inputs, req.user?.id);
    res.status(200).json({
      success: true,
      data: result.execution,
      queue: result.queue,
    });
  } catch (err) {
    next(err);
  }
};

const deleteWorkflow = async (req, res, next) => {
  try {
    const result = await workflowService.deleteWorkflow(req.params.id, req.user?.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  generateWorkflowFromAI,
  updateWorkflow,
  duplicateWorkflow,
  executeWorkflow,
  deleteWorkflow,
};
