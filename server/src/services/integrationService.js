const crypto = require('crypto');
const Integration = require('../models/Integration');
const env = require('../config/env');

const ALGORITHM = 'aes-256-gcm';

// Derive 32-byte encryption buffer safely from CREDENTIAL_ENCRYPTION_KEY
const getEncryptionKey = () => {
  return crypto.createHash('sha256').update(env.credentialEncryptionKey).digest();
};

/**
 * Encrypt plain text using AES-256-GCM
 */
const encrypt = (plainText) => {
  if (!plainText) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt cipher text using AES-256-GCM
 */
const decrypt = (cipherText) => {
  if (!cipherText) return null;
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return null;
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    throw new Error('Failed to decrypt credentials. Encryption key mismatch or corrupted payload.');
  }
};

/**
 * List all integrations for an owner or system
 */
const listIntegrations = async (userId) => {
  const query = userId ? { owner: userId } : {};
  const items = await Integration.find(query).lean();
  
  const providers = ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'];
  
  const providerMap = {};
  items.forEach((item) => {
    providerMap[item.provider] = item;
  });

  return providers.map((prov) => {
    const existing = providerMap[prov];
    return {
      provider: prov,
      isConnected: existing ? existing.isConnected : false,
      name: existing?.name || `${prov.charAt(0).toUpperCase() + prov.slice(1)} Integration`,
      scopes: existing?.scopes || [],
      expiresAt: existing?.expiresAt || null,
      lastTested: existing?.lastTested || null,
      hasToken: Boolean(existing?.encryptedAccessToken),
      config: existing?.config || {},
      id: existing?._id || null,
    };
  });
};

/**
 * Get single integration details with decrypted credentials for internal execution engine only
 */
const getIntegrationCredentials = async (provider, userId) => {
  const query = { provider };
  if (userId) query.owner = userId;

  let integration = await Integration.findOne(query);
  if (!integration) {
    // Check if there is a system-wide or default integration
    integration = await Integration.findOne({ provider });
  }

  if (!integration || !integration.isConnected) {
    const error = new Error(`Integration for '${provider}' is not connected. Please connect it in the Integrations hub.`);
    error.code = 'INTEGRATION_NOT_CONNECTED';
    error.statusCode = 400;
    throw error;
  }

  if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
    const error = new Error(`Authentication token for '${provider}' has expired.`);
    error.code = 'AUTH_EXPIRED';
    error.statusCode = 401;
    throw error;
  }

  const accessToken = decrypt(integration.encryptedAccessToken);
  const refreshToken = decrypt(integration.encryptedRefreshToken);

  return {
    provider: integration.provider,
    accessToken,
    refreshToken,
    config: integration.config || {},
    scopes: integration.scopes || [],
  };
};

/**
 * Save / Update Integration credentials securely
 */
const saveIntegration = async (data, userId) => {
  const { provider, accessToken, refreshToken, scopes = [], config = {}, expiresAt, isConnected = true, name } = data;

  const encryptedAccessToken = accessToken ? encrypt(accessToken) : undefined;
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : undefined;

  const updateFields = {
    isConnected,
    scopes,
    config,
    lastTested: new Date(),
    name: name || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration`,
  };

  if (encryptedAccessToken) updateFields.encryptedAccessToken = encryptedAccessToken;
  if (encryptedRefreshToken) updateFields.encryptedRefreshToken = encryptedRefreshToken;
  if (expiresAt) updateFields.expiresAt = expiresAt;

  const query = { provider };
  if (userId) query.owner = userId;

  const integration = await Integration.findOneAndUpdate(
    query,
    { $set: updateFields, $setOnInsert: { owner: userId, provider } },
    { new: true, upsert: true }
  );

  return {
    provider: integration.provider,
    isConnected: integration.isConnected,
    name: integration.name,
    scopes: integration.scopes,
    config: integration.config,
    lastTested: integration.lastTested,
  };
};

/**
 * Disconnect integration
 */
const disconnectIntegration = async (provider, userId) => {
  const query = { provider };
  if (userId) query.owner = userId;

  await Integration.findOneAndUpdate(
    query,
    {
      $set: {
        isConnected: false,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        expiresAt: null,
      },
    }
  );

  return { provider, isConnected: false };
};

module.exports = {
  encrypt,
  decrypt,
  listIntegrations,
  getIntegrationCredentials,
  saveIntegration,
  disconnectIntegration,
};
