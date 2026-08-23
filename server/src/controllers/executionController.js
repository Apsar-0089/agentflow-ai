const executionService = require('../services/executionService');

const getExecutions = async (req, res, next) => {
  try {
    const { status, workflowId, page, limit } = req.query;
    const result = await executionService.getExecutions({
      status,
      workflowId,
      page,
      limit,
    });
    res.status(200).json({
      success: true,
      data: result.executions,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

const getExecutionById = async (req, res, next) => {
  try {
    const execution = await executionService.getExecutionById(req.params.id);
    res.status(200).json({
      success: true,
      data: execution,
    });
  } catch (err) {
    next(err);
  }
};

const getExecutionTimeline = async (req, res, next) => {
  try {
    const timeline = await executionService.getExecutionTimeline(req.params.id);
    res.status(200).json({
      success: true,
      data: timeline,
    });
  } catch (err) {
    next(err);
  }
};

const pauseExecution = async (req, res, next) => {
  try {
    const result = await executionService.pauseExecution(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const resumeExecution = async (req, res, next) => {
  try {
    const result = await executionService.resumeExecution(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const cancelExecution = async (req, res, next) => {
  try {
    const result = await executionService.cancelExecution(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExecutions,
  getExecutionById,
  getExecutionTimeline,
  pauseExecution,
  resumeExecution,
  cancelExecution,
};
