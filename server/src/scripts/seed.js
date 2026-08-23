const Workflow = require('../models/Workflow');
const authService = require('../services/authService');

const seedSampleWorkflows = async () => {
  try {
    const count = await Workflow.countDocuments();
    if (count === 0) {
      console.log('[Seed] Seeding sample production workflows...');

      // Sample 1: Automated Invoice Processing & Audit Flow
      await Workflow.create({
        name: 'Automated Invoice Processing & Ledger Sync',
        description: 'Ingests vendor invoice notifications from Gmail, uses AI to extract billing metadata, logs transaction to Google Sheets, and alerts the finance channel on Slack.',
        status: 'active',
        tags: ['finance', 'ai-agent', 'gmail', 'sheets', 'slack'],
        version: 1,
        triggerConfig: {
          type: 'manual',
          enabled: true,
        },
        nodes: [
          {
            id: 'node-trigger',
            type: 'gmail',
            position: { x: 80, y: 220 },
            data: {
              label: 'Gmail: Invoice Ingest',
              category: 'trigger',
              description: 'Polls incoming emails matching "subject:invoice"',
              action: 'read_emails',
              params: { query: 'is:unread subject:invoice', maxResults: 5 },
              requiredFields: ['query'],
              retryCount: 2,
            },
          },
          {
            id: 'node-ai',
            type: 'ai_agent',
            position: { x: 380, y: 220 },
            data: {
              label: 'AI Billing Extraction Agent',
              category: 'ai',
              description: 'Extracts vendor, tax ID, line items, and invoice amount',
              action: 'analyze_and_extract',
              params: {
                promptTemplate: 'Extract invoice number, total amount, line items, and vendor name from email payload.',
                requiredFields: ['summary'],
              },
              requiredFields: ['promptTemplate'],
              retryCount: 2,
            },
          },
          {
            id: 'node-sheets',
            type: 'google-sheets',
            position: { x: 680, y: 130 },
            data: {
              label: 'Google Sheets: Append Ledger Row',
              category: 'integration',
              description: 'Appends extracted transaction to Master Finance Ledger',
              action: 'append_row',
              params: {
                spreadsheetId: 'finance_ledger_2026',
                range: 'Invoices!A:E',
                values: ['{{timestamp}}', 'INV-9821', 'CloudCorp Services', '$1,250.00', 'APPROVED'],
              },
              requiredFields: ['spreadsheetId', 'range'],
              retryCount: 3,
            },
          },
          {
            id: 'node-slack',
            type: 'slack',
            position: { x: 680, y: 310 },
            data: {
              label: 'Slack: Finance Channel Broadcast',
              category: 'integration',
              description: 'Notifies #finance-approvals of newly audited invoice',
              action: 'post_message',
              params: {
                channel: '#finance-approvals',
                message: '📋 **New Invoice Processed**: CloudCorp Services ($1,250.00) logged to Google Sheets and verified by AI Agent.',
              },
              requiredFields: ['channel', 'message'],
              retryCount: 2,
            },
          },
        ],
        edges: [
          { id: 'e-1', source: 'node-trigger', target: 'node-ai', animated: true, label: 'Email Content' },
          { id: 'e-2', source: 'node-ai', target: 'node-sheets', animated: true, label: 'Parsed Entities' },
          { id: 'e-3', source: 'node-ai', target: 'node-slack', animated: true, label: 'Audit Alert' },
        ],
      });

      // Sample 2: Incident Escalation & Multi-Channel Alert
      await Workflow.create({
        name: 'Critical Incident Triage & Multi-Channel Alert',
        description: 'Listens for high-severity webhook alerts, executes AI root-cause categorization, and simultaneously broadcasts alerts across Discord and Slack.',
        status: 'active',
        tags: ['devops', 'incident', 'slack', 'discord', 'webhook'],
        version: 1,
        triggerConfig: {
          type: 'webhook',
          webhookPath: '/webhook/v1/incident',
          enabled: true,
        },
        nodes: [
          {
            id: 'node-webhook',
            type: 'trigger',
            position: { x: 80, y: 220 },
            data: {
              label: 'Webhook: Alert Ingest',
              category: 'trigger',
              description: 'Receives incident payload from monitoring service',
              action: 'webhook_receive',
              params: { webhookPath: '/webhook/v1/incident' },
              requiredFields: [],
            },
          },
          {
            id: 'node-ai-triage',
            type: 'ai_agent',
            position: { x: 380, y: 220 },
            data: {
              label: 'AI Incident Triage Agent',
              category: 'ai',
              description: 'Classifies incident severity and recommends mitigation playbook',
              action: 'analyze_and_extract',
              params: {
                promptTemplate: 'Analyze system stack trace, calculate severity index, and generate executive summary.',
              },
              requiredFields: ['promptTemplate'],
            },
          },
          {
            id: 'node-slack-ops',
            type: 'slack',
            position: { x: 680, y: 130 },
            data: {
              label: 'Slack: #incident-response',
              category: 'integration',
              description: 'Pings on-call engineering team on Slack',
              action: 'post_message',
              params: {
                channel: '#incident-response',
                message: '🚨 **SEV-1 Incident Detected**: High latency detected in payment gateway cluster. On-call paged.',
              },
              requiredFields: ['channel', 'message'],
            },
          },
          {
            id: 'node-discord-ops',
            type: 'discord',
            position: { x: 680, y: 310 },
            data: {
              label: 'Discord: War-Room Embed',
              category: 'integration',
              description: 'Posts structured telemetry alert into Discord war room',
              action: 'send_message',
              params: {
                channelId: 'devops-war-room',
                content: '🔥 **SEV-1 War Room Initiated**: Payment cluster latency exceeding 2.5s. AI Triage in progress.',
              },
              requiredFields: ['content'],
            },
          },
        ],
        edges: [
          { id: 'e-1', source: 'node-webhook', target: 'node-ai-triage', animated: true, label: 'Incident Payload' },
          { id: 'e-2', source: 'node-ai-triage', target: 'node-slack-ops', animated: true, label: 'Triage Summary' },
          { id: 'e-3', source: 'node-ai-triage', target: 'node-discord-ops', animated: true, label: 'War Room Alert' },
        ],
      });

      console.log('[Seed] Sample production workflows seeded successfully.');
    }
  } catch (err) {
    console.warn('[Seed] Note on sample seeding:', err.message);
  }
};

const runSeed = async () => {
  await authService.seedDefaultUsers();
  await seedSampleWorkflows();
};

module.exports = { runSeed, seedSampleWorkflows };
