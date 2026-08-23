import React from 'react';
import {
  GitFork,
  CheckCircle2,
  Activity,
  Percent,
  Sparkles,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export default function MetricGrid({ metrics = {} }) {
  const {
    totalWorkflows = 0,
    activeWorkflows = 0,
    totalExecutions = 0,
    completedExecutions = 0,
    failedExecutions = 0,
    successRate = 100,
  } = metrics;

  const CARDS = [
    {
      title: 'Total Automations',
      value: totalWorkflows,
      subtext: `${activeWorkflows} active pipelines`,
      icon: GitFork,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
      trend: '+12% this week',
    },
    {
      title: 'Agent Executions',
      value: totalExecutions,
      subtext: `${completedExecutions} completed runs`,
      icon: Activity,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      trend: 'Live Streamed',
    },
    {
      title: 'Execution Success Rate',
      value: `${successRate}%`,
      subtext: `${failedExecutions} escalations`,
      icon: Percent,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      trend: 'Auto-recovered',
    },
    {
      title: 'Orchestration Engine',
      value: 'LangGraph',
      subtext: '5 Cooperating Agents',
      icon: Cpu,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
      trend: 'Active Core',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl border ${card.bg} bg-surface/80 backdrop-blur-md relative overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-xl bg-slate-900/60 ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight">{card.value}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-surfaceBorder/40">
              <span>{card.subtext}</span>
              <span className="text-[10px] font-mono text-brand-cyan bg-brand-950/60 px-1.5 py-0.5 rounded border border-brand-800/40">
                {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
