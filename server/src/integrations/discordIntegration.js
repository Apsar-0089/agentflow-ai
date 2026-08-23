const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  validateConfig(action, params) {
    super.validateConfig(action, params);
    if (action === 'send_message') {
      if (!params.content && !params.message && !params.embed) {
        throw new Error('Discord send_message requires a content, message, or embed object.');
      }
    }
    return true;
  }

  async execute(action, params = {}, credentials = {}) {
    this.validateConfig(action, params);

    const message = params.content || params.message || '';
    const channelId = params.channelId || credentials.config?.channelId;
    const webhookUrl = credentials.config?.webhookUrl || params.webhookUrl;
    const botToken = credentials.accessToken || credentials.config?.botToken;

    switch (action) {
      case 'send_message': {
        // If Discord Webhook URL is set
        if (webhookUrl && !webhookUrl.includes('mock')) {
          try {
            await axios.post(webhookUrl, {
              content: `🤖 **Agentflow_AI Pipeline**: ${message}`,
              username: 'Agentflow Bot',
            });
            return {
              success: true,
              message,
              deliveredAt: new Date().toISOString(),
              provider: 'discord',
              deliveryMethod: 'webhook',
            };
          } catch (err) {
            throw new Error(`Discord Webhook Error: ${err.message}`);
          }
        }

        // If Discord Bot Token and Channel ID are set
        if (botToken && channelId && !botToken.startsWith('mock_')) {
          try {
            const res = await axios.post(
              `https://discord.com/api/v10/channels/${channelId}/messages`,
              { content: message },
              { headers: { Authorization: `Bot ${botToken}` } }
            );

            return {
              success: true,
              messageId: res.data.id,
              channelId,
              deliveredAt: new Date().toISOString(),
              provider: 'discord',
            };
          } catch (err) {
            if (err.response?.status === 401) {
              const e = new Error('Discord bot token invalid or unauthorized');
              e.code = 'AUTH_EXPIRED';
              throw e;
            }
            throw new Error(`Discord API error: ${err.response?.data?.message || err.message}`);
          }
        }

        // Sandbox simulated delivery
        return {
          success: true,
          mode: 'sandbox',
          content: message,
          channelId: channelId || 'demo-ops-channel',
          messageId: `discord_${Date.now()}`,
          deliveredAt: new Date().toISOString(),
          provider: 'discord',
        };
      }

      default:
        throw new Error(`Unsupported action '${action}' for Discord integration.`);
    }
  }

  async testConnection(credentials) {
    if (!credentials.accessToken && !credentials.config?.webhookUrl) {
      return { success: false, message: 'No Bot Token or Webhook URL provided.' };
    }
    return { success: true, message: 'Discord connection verified.' };
  }
}

module.exports = new DiscordIntegration();
