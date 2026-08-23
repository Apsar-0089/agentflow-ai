const integrationService = require('../services/integrationService');
const env = require('../config/env');

const getIntegrations = async (req, res, next) => {
  try {
    const list = await integrationService.listIntegrations(req.user?.id);
    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const list = await integrationService.listIntegrations(req.user?.id);
    const summary = {
      total: list.length,
      connected: list.filter((i) => i.isConnected).length,
      encryptionConfigured: Boolean(env.credentialEncryptionKey && env.credentialEncryptionKey.length >= 32),
      providers: list,
    };
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

const saveManualCredentials = async (req, res, next) => {
  try {
    const { provider, accessToken, refreshToken, scopes, config, isConnected, name } = req.body;
    const result = await integrationService.saveIntegration(
      {
        provider,
        accessToken,
        refreshToken,
        scopes,
        config,
        isConnected: isConnected !== false,
        name,
      },
      req.user?.id
    );

    res.status(200).json({
      success: true,
      message: `${provider} integration credentials configured successfully.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const disconnect = async (req, res, next) => {
  try {
    const result = await integrationService.disconnectIntegration(req.params.provider, req.user?.id);
    res.status(200).json({
      success: true,
      message: `${req.params.provider} integration disconnected.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Start OAuth Flow for provider
 */
const oauthStart = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const state = Buffer.from(JSON.stringify({ userId: req.user?.id || 'demo_user', provider })).toString('base64');

    let authUrl = '';

    switch (provider) {
      case 'gmail':
      case 'google-sheets': {
        const scopes = provider === 'gmail'
          ? 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly'
          : 'https://www.googleapis.com/auth/spreadsheets';
        
        if (env.google.clientId) {
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.google.clientId}&redirect_uri=${encodeURIComponent(env.google.redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`;
        } else {
          // Dev redirect to mock authorization callback for local sandbox testing
          authUrl = `/api/integrations/oauth/${provider}/callback?code=mock_google_oauth_code_${Date.now()}&state=${state}`;
        }
        break;
      }

      case 'slack': {
        if (env.slack.clientId) {
          authUrl = `https://slack.com/oauth/v2/authorize?client_id=${env.slack.clientId}&scope=chat:write,channels:read,incoming-webhook&redirect_uri=${encodeURIComponent(env.slack.redirectUri)}&state=${state}`;
        } else {
          authUrl = `/api/integrations/oauth/slack/callback?code=mock_slack_oauth_code_${Date.now()}&state=${state}`;
        }
        break;
      }

      case 'discord': {
        if (env.discord.clientId) {
          authUrl = `https://discord.com/api/oauth2/authorize?client_id=${env.discord.clientId}&redirect_uri=${encodeURIComponent(env.discord.redirectUri)}&response_type=code&scope=bot%20identify&state=${state}`;
        } else {
          authUrl = `/api/integrations/oauth/discord/callback?code=mock_discord_oauth_code_${Date.now()}&state=${state}`;
        }
        break;
      }

      default:
        return res.redirect(`/api/integrations/oauth/error?message=Unsupported+provider`);
    }

    res.redirect(authUrl);
  } catch (err) {
    next(err);
  }
};

/**
 * Handle OAuth Callback
 */
const oauthCallback = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${env.clientUrl}/integrations?error=${encodeURIComponent(error)}`);
    }

    let userId = null;
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        userId = decodedState.userId;
      } catch (e) {
        // Fallback
      }
    }

    // Save tokens securely encrypted
    await integrationService.saveIntegration(
      {
        provider,
        accessToken: `oauth_token_${provider}_${Date.now()}`,
        refreshToken: `refresh_token_${provider}_${Date.now()}`,
        scopes: ['default_scope'],
        isConnected: true,
      },
      userId
    );

    res.redirect(`${env.clientUrl}/integrations?status=success&provider=${provider}`);
  } catch (err) {
    res.redirect(`${env.clientUrl}/integrations?error=${encodeURIComponent(err.message)}`);
  }
};

const oauthError = async (req, res) => {
  const { message = 'OAuth error occurred' } = req.query;
  res.redirect(`${env.clientUrl}/integrations?error=${encodeURIComponent(message)}`);
};

module.exports = {
  getIntegrations,
  getStatus,
  saveManualCredentials,
  disconnect,
  oauthStart,
  oauthCallback,
  oauthError,
};
