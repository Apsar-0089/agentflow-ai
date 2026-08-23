import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  GitFork,
  Sparkles,
  Plus,
  Play,
  Copy,
  Trash2,
  Search,
  Tag,
  Clock,
  Layers,
  MoreVertical,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import { workflowApi } from '../../services/api';

export default function WorkflowsListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await workflowApi.getWorkflows({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      if (res?.data) {
        setWorkflows(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load workflows.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [search, statusFilter]);

  const handleDuplicate = async (id) => {
    try {
      const res = await workflowApi.duplicateWorkflow(id);
      if (res?.data) {
        fetchWorkflows();
      }
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await workflowApi.deleteWorkflow(id);
      fetchWorkflows();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleExecute = async (id) => {
    try {
      const res = await workflowApi.executeWorkflow(id);
      if (res?.data?._id) {
        router.push(`/executions/${res.data._id}`);
      }
    } catch (err) {
      alert(`Execution trigger failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Automated Workflows"
        subtitle="Manage, configure, version, and execute visual AI automation pipelines"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/workflows/builder"
              className="px-3.5 py-2 rounded-xl bg-surfaceLight hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-surfaceBorder transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>Generate with AI</span>
            </Link>
            <Link
              href="/workflows/new"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-brand transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Blank Canvas</span>
            </Link>
          </div>
        }
      >
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/80 p-4 rounded-2xl border border-surfaceBorder shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows by name or tag..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-surfaceBorder rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-surfaceBorder rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Workflow Cards Grid */}
          {workflows.length === 0 && !loading ? (
            <div className="p-16 text-center rounded-3xl border border-surfaceBorder bg-surface/50 text-slate-500 space-y-4">
              <GitFork className="w-12 h-12 mx-auto text-slate-600 stroke-[1.2]" />
              <div>
                <h3 className="text-base font-bold text-slate-300">No workflows found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Get started by generating your first workflow using natural language or creating a blank canvas.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href="/workflows/builder"
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Prompt Builder</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflows.map((wf) => (
                <div
                  key={wf._id}
                  className="rounded-2xl border border-surfaceBorder bg-surface/80 hover:border-brand-500/50 transition-all p-5 flex flex-col justify-between shadow-md hover:shadow-glow-brand/20 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          <GitFork className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 group-hover:text-brand-300 transition-colors">
                            {wf.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">v{wf.version || 1} &bull; {wf.status}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          wf.status === 'active'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {wf.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {wf.description || 'No description provided.'}
                    </p>

                    {/* Nodes Preview Badge */}
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="bg-slate-900 px-2 py-1 rounded-md border border-surfaceBorder">
                        {wf.nodes?.length || 0} Nodes
                      </span>
                      <span className="bg-slate-900 px-2 py-1 rounded-md border border-surfaceBorder">
                        {wf.edges?.length || 0} Edges
                      </span>
                    </div>

                    {/* Tags */}
                    {wf.tags?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {wf.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-brand-cyan bg-brand-950/40 border border-brand-800/30 px-2 py-0.5 rounded-md font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-surfaceBorder/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDuplicate(wf._id)}
                        title="Duplicate Workflow"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(wf._id, wf.name)}
                        title="Delete Workflow"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/workflows/${wf._id}`}
                        className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-surfaceBorder transition-colors"
                      >
                        Edit Canvas
                      </Link>
                      <button
                        onClick={() => handleExecute(wf._id)}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
