/**
 * Base Integration Class
 * All third-party providers inherit from this class and implement standard interface.
 */
class BaseIntegration {
  constructor(providerName) {
    this.providerName = providerName;
  }

  /**
   * Validate configuration parameters for an action
   */
  validateConfig(action, params) {
    if (!action) {
      throw new Error(`Action is required for ${this.providerName} integration.`);
    }
    return true;
  }

  /**
   * Execute an action with given parameters and decrypted credentials
   */
  async execute(action, params, credentials) {
    throw new Error(`Execute method not implemented for ${this.providerName}.`);
  }

  /**
   * Test if the credentials/tokens are valid
   */
  async testConnection(credentials) {
    return { success: true, message: `Connected to ${this.providerName}` };
  }
}

module.exports = BaseIntegration;
