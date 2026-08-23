const ExecutionLog = require('../models/ExecutionLog');
const AgentMemory = require('../models/AgentMemory');
const { emitExecutionEvent } = require('../config/socket');

/**
 * Monitoring Agent
 * Emits real-time timeline events, persists execution telemetry logs,
 * and maintains agent memory context across workflow execution steps.
 */
class MonitoringAgent {
  constructor() {
    this.name = 'monitoring';
  }

  /**
   * Log an event across the agent timeline
   * @param {Object} eventParams
   */
  async logEvent({
    executionId,
    workflowId,
    nodeId = null,
    agent,
    level = 'info',
    message,
    metadata = {},
  }) {
    const timestamp = new Date();

    const logEntry = {
      executionId,
      workflowId,
      nodeId,
      agent,
      level,
      message,
      metadata,
      timestamp,
    };

    // 1. Persist to MongoDB ExecutionLogs
    try {
      if (executionId && workflowId) {
        await ExecutionLog.create(logEntry);
      }
    } catch (err) {
      console.warn('[MonitoringAgent] Error persisting execution log:', err.message);
    }

    // 2. Broadcast via Socket.IO in real-time
    if (executionId) {
      emitExecutionEvent(executionId.toString(), {
        ...logEntry,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      });
    }

    return logEntry;
  }

  /**
   * Save agent memory snapshot for inter-step coordination
   */
  async recordMemory({ executionId, workflowId, agentId, key, value, confidenceScore = 1.0 }) {
    try {
      if (executionId) {
        await AgentMemory.create({
          executionId,
          workflowId,
          agentId,
          key,
          value,
          confidenceScore,
        });
      }
    } catch (err) {
      console.warn('[MonitoringAgent] Error saving agent memory:', err.message);
    }
  }
}

module.exports = new MonitoringAgent();
