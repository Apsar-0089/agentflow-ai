import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Zap,
  Bot,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  GitBranch,
  Code,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';

const BaseNodeContainer = ({ selected, borderColor, icon: Icon, iconBg, title, category, description, action, children }) => {
  return (
    <div
      className={`relative min-w-[240px] max-w-[300px] rounded-xl bg-surface border transition-all duration-200 shadow-lg ${
        selected
          ? `border-${borderColor || 'brand-500'} ring-2 ring-brand-500/50 shadow-glow-brand`
          : 'border-surfaceBorder hover:border-slate-500'
      }`}
    >
      <div className="p-3.5 flex items-start gap-3 border-b border-surfaceBorder/60 bg-slate-900/40 rounded-t-xl">
        <div className={`p-2 rounded-lg flex items-center justify-center ${iconBg || 'bg-brand-500/20 text-brand-400'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-slate-100 truncate">{title}</span>
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              {category}
            </span>
          </div>
          {action && <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{action}</div>}
        </div>
      </div>

      <div className="p-3 text-xs text-slate-300">
        {description && <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">{description}</p>}
        {children}
      </div>
    </div>
  );
};

export const TriggerNode = memo(({ data, selected }) => {
  return (
    <BaseNodeContainer
      selected={selected}
      borderColor="emerald-500"
      icon={Zap}
      iconBg="bg-emerald-500/20 text-emerald-400"
      title={data.label || 'Trigger'}
      category={data.category || 'Trigger'}
      description={data.description}
      action={data.action}
    >
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded">
        <Play className="w-3 h-3 fill-emerald-400" />
        <span>Workflow Entry Point</span>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!bg-emerald-400" />
    </BaseNodeContainer>
  );
});

export const AIAgentNode = memo(({ data, selected }) => {
  return (
    <BaseNodeContainer
      selected={selected}
      borderColor="brand-500"
      icon={Bot}
      iconBg="bg-indigo-500/20 text-indigo-400"
      title={data.label || 'AI Agent'}
      category={data.category || 'AI Core'}
      description={data.description}
      action={data.action}
    >
      <Handle type="target" position={Position.Left} id="in" className="!bg-indigo-400" />
      <div className="flex items-center justify-between text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 px-2 py-1 rounded">
        <span>Reasoning Engine</span>
        <span className="font-mono text-[10px] bg-indigo-900/60 px-1 rounded">Autonomous</span>
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!bg-indigo-400" />
    </BaseNodeContainer>
  );
});

export const GmailNode = memo(({ data, selected }) => {
  return (
    <BaseNodeContainer
      selected={selected}
      borderColor="rose-500"
      icon={Mail}
      iconBg="bg-rose-500/20 text-rose-400"
      title={data.label || 'Gmail'}
      category="Gmail"
      description={data.description}
      action={data.action}
    >
      <Handle type="target" position={Position.Left} id="in" className="!bg-rose-400" />
      <div className="text-[11px] text-slate-400 truncate">
        {data.params?.recipient ? `To: ${data.params.recipient}` : data.params?.query ? `Query: ${data.params.query}` : 'OAuth Connected'}
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!bg-rose-400" />
    </BaseNodeContainer>
  );
});

export const SlackNode = memo(({ data, selected }) => {
  return (
    <BaseNodeContainer
      selected={selected}
      borderColor="amber-500"
      icon={MessageSquare}
      iconBg="bg-amber-500/20 text-amber-400"
      title={data.label || 'Slack'}
      category="Slack"
      description={data.description}
      action={data.action}
    >
      <Handle type="target" position={Position.Left} id="in" className="!bg-amber-400" />
      <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded truncate">
        {data.params?.channel || '#general'}
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!bg-amber-400" />
    </BaseNodeContainer>
  );
});

export const DiscordNode = memo(({ data, selected }) => {
  return (
    <BaseNodeContainer
      selected={selected}
      borderColor="purple-500"
      icon={MessageSquare}
      iconBg="bg-purple-500/20 text-purple-400"
      title={data.label || 'Discord'}
      category="Discord"
      description={data.description}
      action={data.action}
    >
      <Handle type="target" position={Position.Left} id="in" className="!bg-purple-400" />
      <div className="text-[11px] text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded truncate">
        {data.params?.channelId || 'Bot Dispatcher'}
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!bg-purple-400" />
    </BaseNodeContainer>
  );
});

export const GoogleSheetsNode = memo(({ data, selected }) => {
  return (
    <BaseNodeContainer
      selected={selected}
      borderColor="emerald-500"
      icon={FileSpreadsheet}
      iconBg="bg-emerald-500/20 text-emerald-400"
      title={data.label || 'Google Sheets'}
      category="Sheets"
      description={data.description}
      action={data.action}
    >
      <Handle type="target" position={Position.Left} id="in" className="!bg-emerald-400" />
      <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2 py-1 rounded truncate">
        {data.params?.range || 'Append Record'}
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!bg-emerald-400" />
    </BaseNodeContainer>
  );
});

export const ConditionNode = memo(({ data, selected }) => {
  return (
    <BaseNodeContainer
      selected={selected}
      borderColor="cyan-500"
      icon={GitBranch}
      iconBg="bg-cyan-500/20 text-cyan-400"
      title={data.label || 'Condition Branch'}
      category="Logic"
      description={data.description}
      action={data.action}
    >
      <Handle type="target" position={Position.Left} id="in" className="!bg-cyan-400" />
      <div className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-1 rounded">
        If {data.params?.operator || 'equals'} → True / False
      </div>
      <Handle type="source" position={Position.Right} id="out" className="!bg-cyan-400" />
    </BaseNodeContainer>
  );
});

export const CodeNode = memo(({ data, selected }) => {
  return (
    <BaseNodeContainer
      selected={selected}
      borderColor="slate-400"
      icon={Code}
      iconBg="bg-slate-700 text-slate-300"
      title={data.label || 'Code Transform'}
      category="Custom Code"
      description={data.description}
      action={data.action}
    >
      <Handle type="target" position={Position.Left} id="in" />
      <div className="text-[11px] text-slate-400 font-mono">JS Transformer</div>
      <Handle type="source" position={Position.Right} id="out" />
    </BaseNodeContainer>
  );
});

export const nodeTypes = {
  trigger: TriggerNode,
  ai_agent: AIAgentNode,
  gmail: GmailNode,
  slack: SlackNode,
  discord: DiscordNode,
  'google-sheets': GoogleSheetsNode,
  condition: ConditionNode,
  code: CodeNode,
  custom: AIAgentNode,
};
