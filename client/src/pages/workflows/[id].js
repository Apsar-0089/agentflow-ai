import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Save,
  Play,
  Copy,
  Trash2,
  ChevronLeft,
  Settings,
  Sparkles,
  GitFork,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas';
import NodePalette from '../../components/NodePalette/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import { workflowApi } from '../../services/api';

export default function WorkflowStudioPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    name,
    description,
    status,
    tags,
    triggerConfig,
    version,
    nodes,
    edges,
    isDirty,
    loadWorkflow,
    setWorkflowMeta,
    resetStore,
  } = useWorkflowStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchWorkflow = async () => {
        setLoading(true);
        try {
          const res = await workflowApi.getWorkflowById(id);
          if (res?.data) {
            loadWorkflow(res.data);
          }
        } catch (err) {
          setError(err.message || 'Failed to load workflow.');
        } finally {
          setLoading(false);
        }
      };
      fetchWorkflow();
    } else if (id === 'new') {
      resetStore();
      setLoading(false);
    }
  }, [id, loadWorkflow, resetStore]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (id === 'new') {
        const res = await workflowApi.createWorkflow({
          name: name || 'Untitled Workflow',
          description,
          status,
          tags,
          triggerConfig,
          nodes,
          edges,
        });
        if (res?.data?._id) {
          router.replace(`/workflows/${res.data._id}`);
        }
      } else {
        const res = await workflowApi.updateWorkflow(id, {
          name,
          description,
          status,
          tags,
          triggerConfig,
          nodes,
          edges,
        });
        if (res?.data) {
          loadWorkflow(res.data);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    if (nodes.length === 0) {
      setError('Cannot execute an empty workflow.');
      return;
    }

    setExecuting(true);
    try {
      // Auto save before execute
      if (id === 'new') {
        const res = await workflowApi.createWorkflow({
          name,
          description,
          status,
          tags,
          triggerConfig,
          nodes,
          edges,
        });
        const execRes = await workflowApi.executeWorkflow(res.data._id);
        router.push(`/executions/${execRes.data._id}`);
      } else {
        await workflowApi.updateWorkflow(id, { name, description, status, tags, triggerConfig, nodes, edges });
        const execRes = await workflowApi.executeWorkflow(id);
        router.push(`/executions/${execRes.data._id}`);
      }
    } catch (err) {
      setError(err.message || 'Execution initiation failed.');
    } finally {
      setExecuting(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ name, description, tags, triggerConfig, nodes, edges, version }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${name.replace(/\s+/g, '_')}_v${version}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell title="Loading Workflow...">
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin mb-2" />
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell
        title={name || 'Workflow Studio'}
        subtitle={`v${version || 1} • ${nodes.length} nodes • ${isDirty ? 'Unsaved changes' : 'All changes saved'}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              title="Export Workflow JSON"
              className="p-2 rounded-xl bg-surfaceLight hover:bg-slate-700 text-slate-300 hover:text-white border border-surfaceBorder transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-surfaceBorder transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? 'Saved!' : 'Save'}</span>
            </button>

            <button
              onClick={handleExecute}
              disabled={executing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-brand transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>Execute Run</span>
            </button>
          </div>
        }
      >
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Studio Top Control Strip */}
          <div className="h-12 px-4 border-b border-surfaceBorder bg-surface/90 flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setWorkflowMeta({ name: e.target.value })}
                placeholder="Workflow Name..."
                className="bg-transparent text-xs font-bold text-slate-100 hover:bg-slate-900 px-2 py-1 rounded focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 border border-transparent hover:border-surfaceBorder"
              />

              <div className="h-4 w-[1px] bg-surfaceBorder" />

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-[11px] uppercase text-slate-500">Trigger:</span>
                <select
                  value={triggerConfig.type || 'manual'}
                  onChange={(e) =>
                    setWorkflowMeta({ triggerConfig: { ...triggerConfig, type: e.target.value } })
                  }
                  className="bg-slate-900 border border-surfaceBorder rounded px-2 py-0.5 text-xs text-slate-200"
                >
                  <option value="manual">Manual Execution</option>
                  <option value="schedule">Cron Scheduler</option>
                  <option value="webhook">HTTP Webhook</option>
                  <option value="event">Event Ingest</option>
                </select>
              </div>
            </div>

            {error && <span className="text-xs text-rose-400 font-medium truncate max-w-xs">{error}</span>}
          </div>

          {/* Canvas + 3-Column Layout */}
          <div className="flex-1 flex min-h-0 relative">
            {/* Left Column: Node Palette */}
            <NodePalette />

            {/* Center: React Flow Canvas */}
            <div className="flex-1 relative h-full">
              <WorkflowCanvas />
            </div>

            {/* Right Column: Node Inspector & Config */}
            <NodeConfigPanel />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
