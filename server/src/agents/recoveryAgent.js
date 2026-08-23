/**
 * Recovery Agent
 * Classifies runtime and validation failures:
 * - MISSING_FIELDS
 * - API_FAILURE
 * - AUTH_EXPIRED
 * - RATE_LIMIT
 * - TRANSIENT
 *
 * Decides whether to retry_with_backoff or escalate to human operator.
 */
class RecoveryAgent {
  constructor() {
    this.name = 'recovery';
    this.maxRetryLimit = 3;
  }

  /**
   * Classify error and decide recovery strategy
   * @param {Error|Object} error - The encountered error or validation failure
   * @param {Object} context - Execution context { currentRetry, node, maxRetries }
   * @returns {Object} { classification, strategy, backoffDelayMs, canRetry, reason }
   */
  classifyAndPlan(error, context = {}) {
    const message = (error?.message || error?.errors?.join(', ') || String(error)).toLowerCase();
    const currentRetry = context.currentRetry || 0;
    const maxRetries = context.node?.data?.retryCount ?? this.maxRetryLimit;

    let classification = 'TRANSIENT';
    let canRetry = currentRetry < maxRetries;
    let strategy = 'retry_with_backoff';

    // 1. Missing Fields
    if (error?.missingFields?.length > 0 || message.includes('missing required') || message.includes('missing_fields')) {
      classification = 'MISSING_FIELDS';
      // Missing fields cannot be resolved by blind retry; escalate to operator
      canRetry = false;
      strategy = 'escalate';
    }
    // 2. Authentication Expired
    else if (
      error?.code === 'AUTH_EXPIRED' ||
      error?.code === 'INTEGRATION_NOT_CONNECTED' ||
      message.includes('auth_expired') ||
      message.includes('unauthorized') ||
      message.includes('401') ||
      message.includes('not connected')
    ) {
      classification = 'AUTH_EXPIRED';
      canRetry = false;
      strategy = 'escalate';
    }
    // 3. Rate Limit
    else if (
      error?.code === 'RATE_LIMIT' ||
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      classification = 'RATE_LIMIT';
      canRetry = currentRetry < maxRetries;
      strategy = canRetry ? 'retry_with_backoff' : 'escalate';
    }
    // 4. API Failure
    else if (message.includes('api error') || message.includes('500') || message.includes('502') || message.includes('503')) {
      classification = 'API_FAILURE';
      canRetry = currentRetry < maxRetries;
      strategy = canRetry ? 'retry_with_backoff' : 'escalate';
    }
    // 5. Transient
    else {
      classification = 'TRANSIENT';
      canRetry = currentRetry < maxRetries;
      strategy = canRetry ? 'retry_with_backoff' : 'escalate';
    }

    // Exponential Backoff calculation: 1s, 2s, 4s, 8s...
    const backoffDelayMs = canRetry ? Math.pow(2, currentRetry) * 1000 : 0;

    return {
      classification,
      strategy,
      canRetry,
      backoffDelayMs,
      currentRetry,
      maxRetries,
      reason: canRetry
        ? `Classified as ${classification}. Scheduling automatic retry in ${backoffDelayMs}ms (attempt ${currentRetry + 1}/${maxRetries}).`
        : `Classified as ${classification}. Escalating to human operator for review.`,
    };
  }
}

module.exports = new RecoveryAgent();
