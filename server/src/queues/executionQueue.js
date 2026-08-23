const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const env = require('../config/env');
const orchestrator = require('../agents/orchestrator');

let executionQueue = null;
let queueWorker = null;
let isUsingInMemoryQueue = false;

// Initialize BullMQ with Redis or Fallback to In-Memory Queue
const initQueue = async () => {
  try {
    const redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy: () => null, // Don't hang indefinitely if Redis isn't running
      enableOfflineQueue: false,
    });

    await new Promise((resolve, reject) => {
      redisClient.once('ready', resolve);
      redisClient.once('error', reject);
    });

    console.log('[Queue] Redis connected. Initializing BullMQ execution queue...');

    executionQueue = new Queue('workflow-executions', {
      connection: redisClient,
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    queueWorker = new Worker(
      'workflow-executions',
      async (job) => {
        const { executionId, userId } = job.data;
        console.log(`[BullMQ Worker] Processing execution job ${job.id} for execution ${executionId}`);
        return orchestrator.runExecution(executionId, userId);
      },
      { connection: redisClient }
    );

    queueWorker.on('completed', (job) => {
      console.log(`[BullMQ Worker] Job ${job.id} completed.`);
    });

    queueWorker.on('failed', (job, err) => {
      console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
    });
  } catch (err) {
    console.warn(`[Queue] Redis not available at ${env.redisUrl} (${err.message}). Using Async In-Memory Task Runner.`);
    isUsingInMemoryQueue = true;
  }
};

/**
 * Dispatch execution job to queue or in-memory runner
 */
const addExecutionJob = async (executionId, userId = null) => {
  if (executionQueue && !isUsingInMemoryQueue) {
    try {
      const job = await executionQueue.add('execute-workflow', {
        executionId: executionId.toString(),
        userId: userId ? userId.toString() : null,
      });
      return { queueType: 'bullmq', jobId: job.id };
    } catch (e) {
      console.warn('[Queue] BullMQ push failed, running in-memory:', e.message);
    }
  }

  // In-Memory Asynchronous Job Runner
  setImmediate(async () => {
    try {
      await orchestrator.runExecution(executionId, userId);
    } catch (err) {
      console.error('[In-Memory Runner] Execution error:', err.message);
    }
  });

  return { queueType: 'in-memory', jobId: `mem_${Date.now()}` };
};

module.exports = {
  initQueue,
  addExecutionJob,
  isInMemory: () => isUsingInMemoryQueue,
};
