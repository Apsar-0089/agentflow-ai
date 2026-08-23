import React from 'react';
import {
  Zap,
  Bot,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  GitBranch,
  Code,
  Plus,
  Layers,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

const PALETTE_ITEMS = [
  {
    type: 'trigger',
    label: 'Manual / Webhook Trigger',
    category: 'Trigger',
    description: 'Initiates workflow pipeline manually, on schedule, or via incoming webhook payload.',
    action: 'manual_trigger',
    icon: Zap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    defaultParams: { event: 'manual' },
  },
  {
    type: 'ai_agent',
    label: 'AI Reasoning & Extraction Agent',
    category: 'AI Core',
    description: 'Analyzes context with LLM, extracts structured JSON entities, and summarizes information.',
    action: 'analyze_and_extract',
    icon: Bot,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/30',
    defaultParams: {
      promptTemplate: 'Analyze input payload, extract relevant entities, and structure summary for downstream tools.',
    },
  },
  {
    type: 'gmail',
    label: 'Gmail Dispatcher & Reader',
    category: 'Integration',
    description: 'Send automated notifications or read incoming email threads with search queries.',
    action: 'send_email',
    icon: Mail,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30',
    defaultParams: {
      recipient: 'operator@agentflow.ai',
      subject: 'Automated Pipeline Alert',
      body: 'Workflow step completed successfully.',
    },
  },
  {
    type: 'slack',
    label: 'Slack Channel Broadcast',
    category: 'Integration',
    description: 'Post messages, alerts, and operational updates directly to Slack channels.',
    action: 'post_message',
    icon: MessageSquare,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    defaultParams: {
      channel: '#operations-alerts',
      message: '⚡ [Agentflow] Pipeline task completed.',
    },
  },
  {
    type: 'discord',
    label: 'Discord Channel Alert',
    category: 'Integration',
    description: 'Broadcast embeds and operational messages into Discord war-room channels.',
    action: 'send_message',
    icon: MessageSquare,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
    defaultParams: {
      channelId: 'devops-alerts',
      content: '🚀 **Agentflow Event**: Processed incoming payload.',
    },
  },
  {
    type: 'google-sheets',
    label: 'Google Sheets Append Row',
    category: 'Integration',
    description: 'Appends extracted transaction records and logs to Google Sheets spreadsheet.',
    action: 'append_row',
    icon: FileSpreadsheet,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    defaultParams: {
      spreadsheetId: 'ops_ledger_2026',
      range: 'Sheet1!A:E',
      values: ['{{timestamp}}', 'INV-AUTO', 'Agentflow AI', '$100.00', 'APPROVED'],
    },
  },
  {
    type: 'condition',
    label: 'Condition / Filter Branch',
    category: 'Logic',
    description: 'Branches workflow execution based on variable evaluation and thresholds.',
    action: 'evaluate_condition',
    icon: GitBranch,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    defaultParams: {
      leftValue: '{{summary}}',
      operator: 'contains',
      rightValue: 'APPROVED',
    },
  },
  {
    type: 'code',
    label: 'JavaScript Code Transformer',
    category: 'Custom Code',
    description: 'Execute custom data transformations and format payloads for downstream nodes.',
    action: 'transform_payload',
    icon: Code,
    color: 'text-slate-300',
    bg: 'bg-slate-800 border-slate-700',
    defaultParams: {
      transformCode: 'return { ...input, formatted: true };',
    },
  },
];

export default function NodePalette() {
  const addNode = useWorkflowStore((state) => state.addNode);
  const nodes = useWorkflowStore((state) => state.nodes);

  const onDragStart = (event, nodeData) => {
    event.dataTransfer.setData('application/reactflow-type', nodeData.type);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleQuickAdd = (item) => {
    const id = `node-${Date.now()}`;
    const xPos = 100 + (nodes.length % 4) * 260;
    const yPos = 180 + Math.floor(nodes.length / 4) * 160;

    const newNode = {
      id,
      type: item.type,
      position: { x: xPos, y: yPos },
      data: {
        label: item.label,
        category: item.category,
        description: item.description,
        action: item.action,
        params: { ...item.defaultParams },
        requiredFields: item.type === 'gmail' ? ['recipient', 'subject'] : item.type === 'slack' ? ['channel', 'message'] : [],
        retryCount: 2,
      },
    };

    addNode(newNode);
  };

  return (
    <div className="w-80 border-r border-surfaceBorder bg-surface/90 flex flex-col h-full overflow-hidden select-none">
      <div className="p-4 border-b border-surfaceBorder flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-bold text-slate-100 uppercase tracking-wider">Node Palette</span>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
          Drag & Drop
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <p className="text-[11px] text-slate-400 px-1">
          Drag components onto the visual canvas or click <Plus className="inline w-3 h-3 text-brand-400" /> to add instantly:
        </p>

        {PALETTE_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              onClick={() => handleQuickAdd(item)}
              className={`p-3 rounded-xl border ${item.bg} hover:border-brand-400 transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:translate-x-0.5 group`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg bg-slate-900/60 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white">{item.label}</h4>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{item.category}</span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Add Node"
                  className="p-1 rounded-md bg-slate-800/80 text-slate-400 hover:text-white hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
