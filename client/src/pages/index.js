import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Layers,
  Cpu,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  GitFork,
  Radio,
  FileSpreadsheet,
  MessageSquare,
  Mail,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const AGENTS = [
  {
    name: 'Planner Agent',
    role: 'Graph Topology & Plan',
    desc: 'Analyzes execution graph acyclicity, dependency levels, and topological ordering with confidence scoring.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
  },
  {
    name: 'Execution Agent',
    role: 'Tool & Provider Runtime',
    desc: 'Executes individual nodes against real third-party integrations (Gmail, Slack, Discord, Google Sheets) or AI models.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/30',
  },
  {
    name: 'Validation Agent',
    role: 'Constraint & Schema Guard',
    desc: 'Verifies required parameters and schema outputs before permitting downstream state propagation.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
  },
  {
    name: 'Recovery Agent',
    role: 'Error Triage & Backoff',
    desc: 'Classifies runtime exceptions (MISSING_FIELDS, API_FAILURE, AUTH_EXPIRED, RATE_LIMIT) and coordinates exponential retries.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
  },
  {
    name: 'Monitoring Agent',
    role: 'Live Socket.IO Streamer',
    desc: 'Emits granular timeline logs in real time, manages agent memory context, and drives the audit timeline.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-slate-100 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.2),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B15_1px,transparent_1px),linear-gradient(to_bottom,#1E293B15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-surfaceBorder/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-cyan flex items-center justify-center shadow-glow-brand">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Agentflow<span className="text-brand-cyan font-mono">_AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all flex items-center gap-2"
            >
              <span>Go to Operator Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-surfaceLight transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-surfaceBorder text-slate-300 text-xs font-mono mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          <span>Next-Generation Multi-Agent Automation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-none">
          Describe the automation. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-cyan to-brand-500">
            Agents execute the workflow.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Agentflow_AI turns natural-language operational prompts into interactive visual DAG graphs, orchestrating execution through a 5-agent chain with OAuth tool integration, automated failure recovery, and real-time Socket.IO telemetry.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/workflows/builder"
            className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand transition-all flex items-center gap-2 scale-100 hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Workflow with AI</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-surface border border-surfaceBorder hover:border-slate-500 text-slate-200 hover:text-white transition-all flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-brand-cyan" />
            <span>Launch Operator Console</span>
          </Link>
        </div>

        {/* Integration Badges */}
        <div className="mt-12 pt-8 border-t border-surfaceBorder/40 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <span className="font-mono uppercase text-slate-500">Supported Integrations:</span>
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-surfaceBorder">
            <Mail className="w-3.5 h-3.5 text-rose-400" /> Gmail OAuth
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-surfaceBorder">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Slack Bot / Webhooks
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-surfaceBorder">
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Discord Bot
          </span>
          <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-surfaceBorder">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Google Sheets
          </span>
        </div>
      </section>

      {/* 5-Agent Architecture Showcase */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-brand-cyan">Autonomous Orchestration</h2>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-1">The 5-Agent Cooperating Chain</p>
          <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">
            Every workflow is validated, planned, executed, monitored, and auto-recovered by a dedicated multi-agent chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {AGENTS.map((agent, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border ${agent.bg} bg-surface/70 backdrop-blur-md flex flex-col justify-between transition-all hover:scale-[1.02]`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Agent {idx + 1}</span>
                  <Bot className={`w-4 h-4 ${agent.color}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-100 mt-2">{agent.name}</h3>
                <p className={`text-[11px] font-mono font-semibold ${agent.color} mt-0.5`}>{agent.role}</p>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{agent.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-surfaceBorder/40 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Deterministic Safety</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 border-t border-surfaceBorder/40 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          Agentflow_AI &bull; AI Operations Automation Platform &bull; Built with Next.js, React Flow, LangGraph & Socket.IO
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-slate-300">
            Sign In
          </Link>
          <Link href="/workflows/builder" className="hover:text-slate-300">
            AI Generator
          </Link>
          <Link href="/dashboard" className="hover:text-slate-300">
            Console
          </Link>
        </div>
      </footer>
    </div>
  );
}
