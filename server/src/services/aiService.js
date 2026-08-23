const axios = require('axios');
const env = require('../config/env');

const WORKFLOW_PROMPT_SYSTEM_INSTRUCTION = `
You are an expert AI Operations Automation Architect. Convert the user's natural language automation description into an executable visual workflow graph.
Return ONLY valid JSON matching this schema:
{
  "name": "Short Descriptive Title",
  "description": "Clear 1-sentence description of the automated pipeline",
  "tags": ["tag1", "tag2"],
  "triggerConfig": { "type": "manual|schedule|webhook|event", "scheduleCron": "", "webhookPath": "" },
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger|ai_agent|gmail|slack|discord|google-sheets|code|condition",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Node Label",
        "category": "trigger|ai|integration|logic",
        "description": "Short explanation",
        "action": "action_name",
        "params": { ... },
        "requiredFields": ["field1"],
        "retryCount": 2
      }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "node-1",
      "target": "node-2",
      "animated": true,
      "label": "Data Flow"
    }
  ]
}
`;

/**
 * Generate workflow via OpenRouter API
 */
const generateWithOpenRouter = async (prompt) => {
  if (!env.openRouterApiKey) return null;

  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: WORKFLOW_PROMPT_SYSTEM_INSTRUCTION },
          { role: 'user', content: `Generate an automated workflow graph for: "${prompt}"` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${env.openRouterApiKey}`,
          'HTTP-Referer': 'https://agentflow.ai',
          'X-Title': 'Agentflow AI',
        },
        timeout: 20000,
      }
    );

    const content = res.data.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return sanitizeGeneratedWorkflow(parsed, 'OpenRouter (gpt-4o-mini)');
    }
  } catch (err) {
    console.warn('[AI Service] OpenRouter generation failed, trying fallback:', err.message);
  }
  return null;
};

/**
 * Generate workflow via Google Gemini SDK
 */
const generateWithGemini = async (prompt) => {
  if (!env.geminiApiKey) return null;

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const result = await model.generateContent([
      WORKFLOW_PROMPT_SYSTEM_INSTRUCTION,
      `Generate an automated workflow graph for: "${prompt}"`,
    ]);

    const text = result.response.text();
    if (text) {
      const parsed = JSON.parse(text);
      return sanitizeGeneratedWorkflow(parsed, 'Google Gemini 1.5 Flash');
    }
  } catch (err) {
    console.warn('[AI Service] Gemini generation failed, falling back to deterministic builder:', err.message);
  }
  return null;
};

/**
 * Deterministic Rule-Based Workflow Builder
 * Provides guaranteed, runnable graphs for common ops automation prompts.
 */
const generateDeterministic = (prompt) => {
  const p = prompt.toLowerCase();
  
  let name = 'Automated Operations Pipeline';
  let description = 'Intelligent multi-step automation generated from prompt';
  let tags = ['automation', 'agentic'];
  let triggerConfig = { type: 'manual', enabled: true };
  let nodes = [];
  let edges = [];

  // Determine Trigger
  let triggerNode = {
    id: 'node-trigger',
    type: 'trigger',
    position: { x: 100, y: 220 },
    data: {
      label: 'Manual / Event Trigger',
      category: 'trigger',
      description: 'Initiates workflow pipeline upon event or manual operator trigger',
      action: 'manual_trigger',
      params: { event: 'manual_dispatch' },
      requiredFields: [],
    },
  };

  if (p.includes('email') || p.includes('gmail') || p.includes('inbox') || p.includes('invoice')) {
    triggerNode = {
      id: 'node-trigger',
      type: 'gmail',
      position: { x: 100, y: 220 },
      data: {
        label: 'Gmail: New Message Ingest',
        category: 'trigger',
        description: 'Polls incoming emails with queries or attachments',
        action: 'read_emails',
        params: { query: 'is:unread category:primary', maxResults: 5 },
        requiredFields: ['query'],
      },
    };
    tags.push('email-ingest');
  } else if (p.includes('schedule') || p.includes('every') || p.includes('daily') || p.includes('hourly')) {
    triggerNode = {
      id: 'node-trigger',
      type: 'trigger',
      position: { x: 100, y: 220 },
      data: {
        label: 'Cron Scheduler',
        category: 'trigger',
        description: 'Triggers on a recurring cron interval',
        action: 'cron_tick',
        params: { scheduleCron: '0 * * * *' },
        requiredFields: ['scheduleCron'],
      },
    };
    triggerConfig = { type: 'schedule', scheduleCron: '0 * * * *', enabled: true };
    tags.push('scheduled');
  } else if (p.includes('webhook') || p.includes('api') || p.includes('http') || p.includes('payload')) {
    triggerNode = {
      id: 'node-trigger',
      type: 'trigger',
      position: { x: 100, y: 220 },
      data: {
        label: 'Webhook Listener',
        category: 'trigger',
        description: 'Receives POST payloads from external systems',
        action: 'webhook_receive',
        params: { webhookPath: '/webhook/v1/ingest' },
        requiredFields: ['webhookPath'],
      },
    };
    triggerConfig = { type: 'webhook', webhookPath: '/webhook/v1/ingest', enabled: true };
    tags.push('webhook');
  }

  nodes.push(triggerNode);

  // Determine AI Processing Step
  const aiNode = {
    id: 'node-ai-process',
    type: 'ai_agent',
    position: { x: 420, y: 220 },
    data: {
      label: 'AI Data Intelligence Agent',
      category: 'ai',
      description: 'Extracts structured entities, summarizes content, and determines priority',
      action: 'analyze_and_extract',
      params: {
        promptTemplate: `Analyze input payload from ${triggerNode.data.label}: extract key entities, summarize context, and assign confidence score.`,
        outputSchema: {
          summary: 'string',
          priority: 'HIGH | MEDIUM | LOW',
          status: 'PROCESSED',
          entities: 'object',
        },
      },
      requiredFields: ['promptTemplate'],
    },
  };
  nodes.push(aiNode);
  edges.push({
    id: `e-${triggerNode.id}-${aiNode.id}`,
    source: triggerNode.id,
    target: aiNode.id,
    animated: true,
    label: 'Payload Stream',
  });

  // Determine Downstream Action Nodes based on keywords
  let downstreamNodes = [];

  if (p.includes('slack') || (!p.includes('discord') && !p.includes('sheet') && !p.includes('send email'))) {
    downstreamNodes.push({
      id: 'node-slack',
      type: 'slack',
      data: {
        label: 'Slack: Post Alert & Status',
        category: 'integration',
        description: 'Broadcasts notifications and operational metrics to Slack channel',
        action: 'post_message',
        params: {
          channel: '#operations-alerts',
          message: '⚡ [Agentflow] New automated pipeline execution completed with AI extraction.',
        },
        requiredFields: ['channel', 'message'],
      },
    });
    tags.push('slack');
  }

  if (p.includes('discord')) {
    downstreamNodes.push({
      id: 'node-discord',
      type: 'discord',
      data: {
        label: 'Discord: Send Embed Alert',
        category: 'integration',
        description: 'Delivers structured event messages to Discord operational channels',
        action: 'send_message',
        params: {
          channelId: 'ops-alerts-101',
          content: '🚀 **Agentflow Automation Event**: Processed incoming payload and updated audit state.',
        },
        requiredFields: ['content'],
      },
    });
    tags.push('discord');
  }

  if (p.includes('sheet') || p.includes('excel') || p.includes('table') || p.includes('record') || p.includes('row') || p.includes('invoice')) {
    downstreamNodes.push({
      id: 'node-sheets',
      type: 'google-sheets',
      data: {
        label: 'Google Sheets: Append Audit Row',
        category: 'integration',
        description: 'Appends extracted transaction data to central operations ledger',
        action: 'append_row',
        params: {
          spreadsheetId: 'ops_ledger_2026',
          range: 'AuditLogs!A:E',
          values: ['{{timestamp}}', '{{executionId}}', '{{ai_summary}}', 'COMPLETED'],
        },
        requiredFields: ['spreadsheetId', 'range'],
      },
    });
    tags.push('sheets');
  }

  if (p.includes('send email') || p.includes('notify user') || p.includes('reply') || p.includes('forward')) {
    downstreamNodes.push({
      id: 'node-gmail-send',
      type: 'gmail',
      data: {
        label: 'Gmail: Dispatch Notification',
        category: 'integration',
        description: 'Dispatches finalized confirmation email to stakeholder',
        action: 'send_email',
        params: {
          recipient: 'operator@agentflow.ai',
          subject: 'Automation Run Summary: Pipeline Executed Successfully',
          body: 'Hello,\n\nThe Agentflow AI pipeline has finished processing your automation task.\n\nBest regards,\nAgentflow_AI System',
        },
        requiredFields: ['recipient', 'subject'],
      },
    });
    tags.push('gmail');
  }

  // Position downstream nodes
  if (downstreamNodes.length === 1) {
    downstreamNodes[0].position = { x: 760, y: 220 };
  } else if (downstreamNodes.length === 2) {
    downstreamNodes[0].position = { x: 760, y: 130 };
    downstreamNodes[1].position = { x: 760, y: 310 };
  } else {
    downstreamNodes.forEach((node, idx) => {
      node.position = { x: 760, y: 90 + idx * 140 };
    });
  }

  downstreamNodes.forEach((node) => {
    nodes.push(node);
    edges.push({
      id: `e-${aiNode.id}-${node.id}`,
      source: aiNode.id,
      target: node.id,
      animated: true,
      label: 'Verified Data',
    });
  });

  // Set descriptive name
  if (p.includes('invoice')) name = 'Automated Invoice Ingest & Audit Pipeline';
  else if (p.includes('email') && p.includes('slack')) name = 'Email to Slack Alert Automation';
  else if (p.includes('discord')) name = 'Multi-Channel Discord Dispatcher';
  else if (p.includes('sheet')) name = 'Operations Data to Google Sheets Ledger';
  else name = `Pipeline: ${prompt.slice(0, 45)}...`;

  return sanitizeGeneratedWorkflow(
    {
      name,
      description: `End-to-end multi-agent workflow generated for: "${prompt}"`,
      tags: Array.from(new Set(tags)),
      triggerConfig,
      nodes,
      edges,
    },
    'Deterministic Rule Engine'
  );
};

/**
 * Validates and sanitizes generated workflow structure
 */
const sanitizeGeneratedWorkflow = (wf, generatorEngine) => {
  return {
    name: wf.name || 'AI Generated Automation Workflow',
    description: wf.description || 'Generated by Agentflow AI',
    tags: Array.isArray(wf.tags) ? wf.tags : ['ai-generated'],
    triggerConfig: wf.triggerConfig || { type: 'manual', enabled: true },
    nodes: Array.isArray(wf.nodes)
      ? wf.nodes.map((node, i) => ({
          id: node.id || `node-${i + 1}`,
          type: node.type || 'ai_agent',
          position: node.position || { x: 100 + i * 280, y: 200 },
          data: {
            label: node.data?.label || `Step ${i + 1}`,
            category: node.data?.category || (i === 0 ? 'trigger' : 'action'),
            description: node.data?.description || '',
            action: node.data?.action || 'default_action',
            params: node.data?.params || {},
            requiredFields: node.data?.requiredFields || [],
            retryCount: node.data?.retryCount || 2,
            ...node.data,
          },
        }))
      : [],
    edges: Array.isArray(wf.edges)
      ? wf.edges.map((edge, i) => ({
          id: edge.id || `edge-${i + 1}`,
          source: edge.source,
          target: edge.target,
          animated: edge.animated !== false,
          label: edge.label || '',
        }))
      : [],
    generatorMetadata: {
      engine: generatorEngine,
      generatedAt: new Date().toISOString(),
    },
  };
};

/**
 * Public generate method with multi-tier fallback
 */
const generateWorkflowFromPrompt = async (prompt) => {
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('Please provide a valid natural-language prompt describing your automation.');
  }

  // 1. Try OpenRouter if API key configured
  if (env.openRouterApiKey) {
    const result = await generateWithOpenRouter(prompt);
    if (result) return result;
  }

  // 2. Try Gemini if API key configured
  if (env.geminiApiKey) {
    const result = await generateWithGemini(prompt);
    if (result) return result;
  }

  // 3. Fall back to robust Deterministic Rule Builder
  return generateDeterministic(prompt);
};

module.exports = {
  generateWorkflowFromPrompt,
};
