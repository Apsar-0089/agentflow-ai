import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Sparkles,
  Play,
  Save,
  ArrowRight,
  RotateCcw,
  Bot,
  Layers,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import { workflowApi } from '../../services/api';

const SAMPLE_PROMPTS = [
  'When an invoice is received in Gmail, extract the data with AI and post an alert to Slack and append a row to Google Sheets',
  'Monitor API webhook alerts, summarize incident with AI, and post emergency triage alert to Discord and Slack',
  'Daily cron scheduler: poll customer feedback, categorize sentiment using AI reasoning, and send daily summary email via Gmail',
  'Process incoming support ticket webhook, determine priority with AI, and dispatch alert to on-call Slack channel',
];

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const { nodes, edges, name, description, triggerConfig, tags, loadWorkflow, resetStore, isDirty } = useWorkflowStore();

  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [generationMeta, setGenerationMeta] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (customPrompt = prompt) => {
    const textToGenerate = customPrompt || prompt;
    if (!textToGenerate.trim()) {
      setError('Please provide a prompt describing the automation workflow.');
      return;
    }

    setError('');
    setGenerating(true);
    try {
      const res = await workflowApi.generateWorkflow(textToGenerate);
      if (res?.data) {
        loadWorkflow(res.data);
        setGenerationMeta(res.data.generatorMetadata || { engine: 'AI Core' });
      }
    } catch (err) {
      setError(err.message || 'AI workflow generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveWorkflow = async () => {
    if (nodes.length === 0) {
      setError('Cannot save empty workflow. Generate or add nodes first.');
      return;
    }

    setSaving(true);
    try {
      const res = await workflowApi.createWorkflow({
        name: name || 'AI Generated Automation',
        description,
        nodes,
        edges,
        triggerConfig,
        tags,
        status: 'active',
      });

      if (res?.data?._id) {
        router.push(`/workflows/${res.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save workflow.');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteNow = async () => {
    if (nodes.length === 0) {
      setError('Cannot execute empty workflow. Generate or add nodes first.');
      return;
    }

    setExecuting(true);
    try {
      // 1. Save workflow first
      const savedRes = await workflowApi.createWorkflow({
        name: name || 'AI Generated Automation',
        description,
        nodes,
        edges,
        triggerConfig,
        tags,
        status: 'active',
      });

      const wfId = savedRes.data._id;

      // 2. Trigger execution
      const execRes = await workflowApi.executeWorkflow(wfId);
      if (execRes?.data?._id) {
        router.push(`/executions/${execRes.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Execution initiation failed.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="AI Prompt-to-Workflow Generator"
        subtitle="Transform natural language into live executable visual workflow graphs"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                resetStore();
                setGenerationMeta(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-surfaceLight hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-surfaceBorder transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSaveWorkflow}
              disabled={saving || nodes.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-surfaceBorder transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Workflow</span>
            </button>

            <button
              onClick={handleExecuteNow}
              disabled={executing || nodes.length === 0}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-brand transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>Save & Run Now</span>
            </button>
          </div>
        }
      >
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Top Prompt Input Panel */}
          <div className="p-4 border-b border-surfaceBorder bg-surface/90 backdrop-blur-md z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-brand-cyan" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Automation Prompt Studio
                </span>
              </div>
              {generationMeta && (
                <span className="text-[11px] font-mono text-brand-400 bg-brand-950/80 px-2 py-0.5 rounded border border-brand-800/40">
                  Engine: {generationMeta.engine}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your automation pipeline (e.g. Ingest invoice from Gmail, extract items with AI, alert Slack #finance, append to Google Sheets)..."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-surfaceBorder rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>
              <button
                onClick={() => handleGenerate()}
                disabled={generating}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-glow-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Generate Graph</span>
                  </>
                )}
              </button>
            </div>

            {/* Suggested Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 font-mono shrink-0">Try Prompt:</span>
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleGenerate(p);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-surfaceBorder/80 whitespace-nowrap transition-colors truncate max-w-xs"
                >
                  {p}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Center Canvas & Side Inspector */}
          <div className="flex-1 flex min-h-0 relative">
            <div className="flex-1 relative h-full">
              {nodes.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-500 bg-[#090D16] z-0">
                  <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 shadow-glow-brand">
                    <Sparkles className="w-8 h-8 text-brand-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300">Ready to synthesize automation graph</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Enter your natural language prompt above or click one of the suggested templates to instantly generate an interactive visual DAG.
                  </p>
                </div>
              ) : (
                <WorkflowCanvas />
              )}
            </div>

            {/* Node Config Inspector */}
            <NodeConfigPanel />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
