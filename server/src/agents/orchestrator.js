const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const Execution = require('../models/Execution');
const notificationService = require('../services/notificationService');
const { emitExecutionStatus } = require('../config/socket');

// Detect LangGraph availability
let langGraphStatus = 'not-installed';
try {
  require('@langchain/langgraph');
  langGraphStatus = 'available';
} catch (e) {
  langGraphStatus = 'not-installed';
}

/**
 * In-memory execution control registry for pause/cancel signals
 */
const executionControls = new Map();

/**
 * Multi-Agent Orchestrator Engine
 */
class Orchestrator {
  constructor() {
    this.langGraphStatus = langGraphStatus;
  }

  /**
   * Set control state (PAUSE, RESUME, CANCEL)
   */
  setControlSignal(executionId, signal) {
    executionControls.set(executionId.toString(), signal);
  }

  getControlSignal(executionId) {
    return executionControls.get(executionId.toString());
  }

  clearControlSignal(executionId) {
    executionControls.delete(executionId.toString());
  }

  /**
   * Run full multi-agent orchestration lifecycle
   * @param {Object} execution - Mongoose Execution document or ID
   * @param {String} userId - Triggering user ID
   */
  async runExecution(executionId, userId = null) {
    let execution = await Execution.findById(executionId).populate('workflowId');
    if (!execution) {
      throw new Error(`Execution ${executionId} not found.`);
    }

    const workflow = execution.workflowSnapshot || execution.workflowId;
    const workflowId = execution.workflowId?._id || execution.workflowId;

    const startTime = Date.now();
    execution.status = 'RUNNING';
    execution.startTime = new Date(startTime);
    execution.langGraphStatus = this.langGraphStatus;
    await execution.save();

    emitExecutionStatus(executionId.toString(), {
      status: 'RUNNING',
      langGraphStatus: this.langGraphStatus,
      startTime: execution.startTime,
    });

    // 1. MONITORING AGENT: Execution Started
    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'monitoring',
      level: 'info',
      message: `Execution pipeline initiated. Orchestration substrate: LangGraph (${this.langGraphStatus}).`,
      metadata: { workflowName: workflow.name, version: workflow.version },
    });

    try {
      // 2. PLANNER AGENT: Formulate topological execution plan
      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'planner',
        level: 'info',
        message: 'Planner Agent analyzing graph topology, dependencies, and execution order...',
      });

      const { plan, confidenceScore, analysis } = await plannerAgent.plan(workflow);
      execution.confidenceScore = confidenceScore;
      await execution.save();

      await monitoringAgent.recordMemory({
        executionId,
        workflowId,
        agentId: 'planner',
        key: 'execution_plan',
        value: plan.map((n) => n.id),
        confidenceScore,
      });

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'planner',
        level: 'success',
        message: `Planner generated optimal sequence (${plan.length} steps) with ${Math.round(confidenceScore * 100)}% confidence.`,
        metadata: { stepCount: plan.length, order: plan.map((n) => n.data?.label || n.id), analysis },
      });

      if (!plan || plan.length === 0) {
        throw new Error('Workflow graph has no executable nodes.');
      }

      // Step execution loop
      const stepOutputs = {};
      let accumulatedContext = { ...execution.inputs };

      for (let stepIndex = 0; stepIndex < plan.length; stepIndex++) {
        const node = plan[stepIndex];
        const stepNum = stepIndex + 1;

        // Check for CANCEL signal
        if (this.getControlSignal(executionId) === 'CANCEL') {
          execution.status = 'CANCELLED';
          execution.endTime = new Date();
          execution.duration = Date.now() - startTime;
          await execution.save();

          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution manually cancelled by operator at Step ${stepNum} (${node.data?.label}).`,
          });

          emitExecutionStatus(executionId.toString(), { status: 'CANCELLED', duration: execution.duration });
          this.clearControlSignal(executionId);
          return execution;
        }

        // Check for PAUSE signal (wait until resumed or cancelled)
        while (this.getControlSignal(executionId) === 'PAUSE') {
          execution.status = 'PAUSED';
          await execution.save();
          emitExecutionStatus(executionId.toString(), { status: 'PAUSED' });

          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution paused by operator before executing Step ${stepNum} (${node.data?.label}).`,
          });

          // Wait in 1s intervals
          while (this.getControlSignal(executionId) === 'PAUSE') {
            await new Promise((r) => setTimeout(r, 1000));
          }

          if (this.getControlSignal(executionId) === 'CANCEL') {
            break;
          }

          execution.status = 'RUNNING';
          await execution.save();
          emitExecutionStatus(executionId.toString(), { status: 'RUNNING' });
          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'info',
            message: `Execution resumed by operator. Proceeding with Step ${stepNum}.`,
          });
        }

        execution.currentNode = node.id;
        await execution.save();

        let nodeSuccess = false;
        let retryAttempt = 0;
        const maxNodeRetries = node.data?.retryCount ?? 2;
        let nodeOutput = null;

        while (!nodeSuccess && retryAttempt <= maxNodeRetries) {
          try {
            // 3. EXECUTION AGENT: Run node against integration or AI
            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: node.id,
              agent: 'execution',
              level: 'info',
              message: `[Step ${stepNum}/${plan.length}] Execution Agent running: "${node.data?.label || node.id}" (Type: ${node.type})`,
              metadata: { attempt: retryAttempt + 1, action: node.data?.action },
            });

            nodeOutput = await executionAgent.executeNode(node, accumulatedContext, userId);

            // 4. VALIDATION AGENT: Verify required output fields
            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: node.id,
              agent: 'validation',
              level: 'info',
              message: `Validation Agent verifying output schema and required constraints for "${node.data?.label}"...`,
            });

            const validationResult = await validationAgent.validate(node, nodeOutput);

            if (!validationResult.isValid) {
              const valError = new Error(`Validation failed: ${validationResult.errors.join('; ')}`);
              valError.missingFields = validationResult.missingFields;
              throw valError;
            }

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: node.id,
              agent: 'validation',
              level: 'success',
              message: `Validation passed: All required fields and constraints satisfied for "${node.data?.label}".`,
              metadata: { outputKeys: Object.keys(nodeOutput) },
            });

            nodeSuccess = true;
          } catch (nodeError) {
            // 5. RECOVERY AGENT: Classify failure & decide recovery strategy
            const recoveryDecision = recoveryAgent.classifyAndPlan(nodeError, {
              currentRetry: retryAttempt,
              node,
              maxRetries: maxNodeRetries,
            });

            await monitoringAgent.logEvent({
              executionId,
              workflowId,
              nodeId: node.id,
              agent: 'recovery',
              level: recoveryDecision.canRetry ? 'warning' : 'error',
              message: `Recovery Agent: ${recoveryDecision.reason}`,
              metadata: {
                error: nodeError.message,
                classification: recoveryDecision.classification,
                strategy: recoveryDecision.strategy,
                backoffDelayMs: recoveryDecision.backoffDelayMs,
              },
            });

            if (recoveryDecision.canRetry) {
              retryAttempt++;
              execution.retryCount += 1;
              execution.status = 'RETRYING';
              await execution.save();
              emitExecutionStatus(executionId.toString(), { status: 'RETRYING', retryCount: execution.retryCount });

              await new Promise((r) => setTimeout(r, recoveryDecision.backoffDelayMs));
              execution.status = 'RUNNING';
              await execution.save();
            } else {
              // Escalation required
              execution.status = 'FAILED';
              execution.endTime = new Date();
              execution.duration = Date.now() - startTime;
              execution.error = {
                message: nodeError.message,
                code: nodeError.code || 'STEP_FAILURE',
                classification: recoveryDecision.classification,
                step: node.data?.label || node.id,
              };
              await execution.save();

              await notificationService.createNotification({
                owner: userId,
                workflowId,
                executionId,
                type: 'escalation',
                title: `Automation Failed: ${workflow.name}`,
                message: `Step "${node.data?.label}" failed (${recoveryDecision.classification}): ${nodeError.message}`,
              });

              emitExecutionStatus(executionId.toString(), {
                status: 'FAILED',
                error: execution.error,
                duration: execution.duration,
              });

              this.clearControlSignal(executionId);
              return execution;
            }
          }
        }

        // Store step output in execution context and memory
        stepOutputs[node.id] = nodeOutput;
        accumulatedContext = {
          ...accumulatedContext,
          ...nodeOutput,
          [`step_${stepNum}`]: nodeOutput,
          [node.id]: nodeOutput,
        };

        await monitoringAgent.recordMemory({
          executionId,
          workflowId,
          agentId: 'execution',
          key: `output_${node.id}`,
          value: nodeOutput,
        });

        // Step delay for smooth visual timeline streaming in UI
        await new Promise((r) => setTimeout(r, 600));
      }

      // Workflow execution successfully finished
      const endTime = Date.now();
      execution.status = 'COMPLETED';
      execution.endTime = new Date(endTime);
      execution.duration = endTime - startTime;
      execution.outputs = stepOutputs;
      execution.currentNode = null;
      await execution.save();

      // 1. MONITORING AGENT: Final success event
      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'monitoring',
        level: 'success',
        message: `Workflow completed successfully in ${(execution.duration / 1000).toFixed(2)}s across ${plan.length} steps.`,
        metadata: { duration: execution.duration, outputsCount: Object.keys(stepOutputs).length },
      });

      // Send success notification
      await notificationService.createNotification({
        owner: userId,
        workflowId,
        executionId,
        type: 'success',
        title: `Automation Succeeded: ${workflow.name}`,
        message: `All ${plan.length} agentic steps completed cleanly in ${(execution.duration / 1000).toFixed(2)}s.`,
      });

      emitExecutionStatus(executionId.toString(), {
        status: 'COMPLETED',
        duration: execution.duration,
        outputs: stepOutputs,
      });

      this.clearControlSignal(executionId);
      return execution;
    } catch (fatalError) {
      const endTime = Date.now();
      execution.status = 'FAILED';
      execution.endTime = new Date(endTime);
      execution.duration = endTime - startTime;
      execution.error = {
        message: fatalError.message,
        code: 'ORCHESTRATOR_FATAL_ERROR',
        classification: 'SYSTEM_ERROR',
      };
      await execution.save();

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'orchestrator',
        level: 'error',
        message: `Fatal pipeline exception: ${fatalError.message}`,
      });

      await notificationService.createNotification({
        owner: userId,
        workflowId,
        executionId,
        type: 'failure',
        title: `Execution Error: ${workflow.name}`,
        message: fatalError.message,
      });

      emitExecutionStatus(executionId.toString(), {
        status: 'FAILED',
        error: execution.error,
        duration: execution.duration,
      });

      this.clearControlSignal(executionId);
      return execution;
    }
  }
}

module.exports = new Orchestrator();
