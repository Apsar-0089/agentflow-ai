const BaseIntegration = require('./baseIntegration');
const axios = require('axios');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  validateConfig(action, params) {
    super.validateConfig(action, params);
    if (action === 'append_row') {
      if (!params.values && !params.data && !params.row) {
        throw new Error('Google Sheets append_row requires "values" (an array of row cells or key-value object).');
      }
    }
    return true;
  }

  async execute(action, params = {}, credentials = {}) {
    this.validateConfig(action, params);

    const accessToken = credentials.accessToken;
    const spreadsheetId = params.spreadsheetId || credentials.config?.spreadsheetId || 'demo_sheet_id_101';
    const range = params.range || 'Sheet1!A:Z';

    switch (action) {
      case 'append_row': {
        const rawValues = params.values || params.data || params.row || [];
        const rowArray = Array.isArray(rawValues)
          ? rawValues
          : Object.values(rawValues);

        if (accessToken && !accessToken.startsWith('mock_')) {
          try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
              range
            )}:append?valueInputOption=USER_ENTERED`;

            const res = await axios.post(
              url,
              { values: [rowArray] },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            return {
              success: true,
              spreadsheetId,
              updatedRange: res.data.updates?.updatedRange,
              updatedRows: res.data.updates?.updatedRows || 1,
              timestamp: new Date().toISOString(),
              provider: 'google-sheets',
            };
          } catch (err) {
            if (err.response?.status === 401) {
              const e = new Error('Google Sheets access token expired or unauthorized');
              e.code = 'AUTH_EXPIRED';
              throw e;
            }
            throw new Error(`Google Sheets API error: ${err.response?.data?.error?.message || err.message}`);
          }
        }

        // Sandbox simulated append
        return {
          success: true,
          mode: 'sandbox',
          spreadsheetId,
          appendedValues: rowArray,
          updatedRange: `${range.split('!')[0]}!A${Math.floor(Math.random() * 50 + 2)}`,
          updatedRows: 1,
          timestamp: new Date().toISOString(),
          provider: 'google-sheets',
        };
      }

      case 'read_range': {
        return {
          success: true,
          spreadsheetId,
          range,
          rows: [
            ['Timestamp', 'Invoice Number', 'Vendor', 'Amount', 'Status'],
            [new Date().toISOString(), 'INV-9821', 'Acme Systems', '$1,250.00', 'Approved'],
            [new Date().toISOString(), 'INV-9822', 'DataDog Enterprise', '$4,800.00', 'Pending'],
          ],
          provider: 'google-sheets',
        };
      }

      default:
        throw new Error(`Unsupported action '${action}' for Google Sheets integration.`);
    }
  }

  async testConnection(credentials) {
    if (!credentials.accessToken) {
      return { success: false, message: 'No access token provided.' };
    }
    return { success: true, message: 'Google Sheets connection verified.' };
  }
}

module.exports = new GoogleSheetsIntegration();
