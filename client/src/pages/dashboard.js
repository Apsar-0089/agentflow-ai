import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Sparkles,
  Plus,
  Play,
  ArrowRight,
  Activity,
  GitFork,
  Radio,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import { workflowApi } from '../services/api';
import { getSocket } from '../services/socket';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await workflowApi.getDashboard();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Real-time live execution updates
    const socket = getSocket();
    if (socket) {
      const handleStream = () => {
        fetchDashboardData();
      };
      socket.on('execution:stream', handleStream);
      socket.on('execution:status_change', handleStream);

      return () => {
        socket.off('execution:stream', handleStream);
        socket.off('execution:status_change', handleStream);
      };
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleExecute = async (workflowId) => {
    try {
      const res = await workflowApi.executeWorkflow(workflowId);
      if (res?.data?._id) {
        router.push(`/executions/${res.data._id}`);
      }
    } catch (err) {
      alert(`Execution failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Operations Command Center"
        subtitle="Real-time multi-agent execution telemetry and active pipeline state"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-surfaceLight hover:bg-slate-700 text-slate-300 hover:text-white border border-surfaceBorder transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/workflows/builder"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate with AI</span>
            </Link>
          </div>
        }
      >
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Metric Grid */}
          <MetricGrid metrics={data?.metrics} />

          {/* Quick AI Launch Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-slate-950/90 border border-brand-500/30 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-cyan shrink-0 border border-brand-500/30 shadow-glow-cyan">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Autonomous Prompt-to-Workflow Generator</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  Turn plain English into a live executable workflow graph. The AI engine automatically generates nodes, configures OAuth tools (Gmail, Slack, Sheets), and routes executions through the 5-agent chain.
                </p>
              </div>
            </div>
            <Link
              href="/workflows/builder"
              className="px-5 py-2.5 rounded-xl bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/40 text-xs font-mono font-bold tracking-wider uppercase transition-all shrink-0 flex items-center gap-2 hover:scale-105"
            >
              <span>Launch AI Prompt Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Executions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-cyan" />
                  <h3 className="text-sm font-bold text-slate-100">Live Execution Runs</h3>
                </div>
                <Link
                  href="/executions"
                  className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
                >
                  <span>View all runs</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="rounded-2xl border border-surfaceBorder bg-surface/80 overflow-hidden shadow-md">
                {data?.recentExecutions?.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">No execution runs yet. Trigger a workflow to start live agent streams.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-surfaceBorder">
                        <tr>
                          <th className="py-3 px-4">Workflow</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surfaceBorder/60">
                        {data?.recentExecutions?.map((exec) => {
                          const status = exec.status;
                          const isSuccess = status === 'COMPLETED';
                          const isFailed = status === 'FAILED';
                          const isRunning = status === 'RUNNING' || status === 'RETRYING';
                          const isPaused = status === 'PAUSED';

                          return (
                            <tr key={exec._id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-200">
                                <Link
                                  href={`/executions/${exec._id}`}
                                  className="hover:text-brand-cyan transition-colors"
                                >
                                  {exec.workflowId?.name || 'Automated Pipeline'}
                                </Link>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider ${
                                    isSuccess
                                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                      : isFailed
                                      ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                                      : isRunning
                                      ? 'bg-brand-950/60 text-brand-cyan border border-brand-800/40 animate-pulse'
                                      : isPaused
                                      ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {isSuccess && <CheckCircle2 className="w-3 h-3" />}
                                  {isFailed && <XCircle className="w-3 h-3" />}
                                  {isRunning && <Radio className="w-3 h-3" />}
                                  <span>{status}</span>
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-400">
                                {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : '--'}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-500">
                                {new Date(exec.createdAt).toLocaleTimeString()}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  href={`/executions/${exec._id}`}
                                  className="px-2.5 py-1 rounded-lg bg-surfaceLight hover:bg-brand-600 text-slate-300 hover:text-white font-mono text-[11px] transition-colors"
                                >
                                  Inspect Timeline
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Live AI & Agent Activity Stream */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-brand-purple animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-100">Live Agent Stream</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Socket.IO</span>
              </div>

              <div className="rounded-2xl border border-surfaceBorder bg-surface/80 p-4 space-y-3 shadow-md max-h-[460px] overflow-y-auto">
                {data?.recentLogs?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-xs">No agent logs recorded yet.</p>
                  </div>
                ) : (
                  data?.recentLogs?.map((log, idx) => {
                    const agent = log.agent;
                    const isSuccess = log.level === 'success';
                    const isError = log.level === 'error';
                    const isWarning = log.level === 'warning';

                    return (
                      <div
                        key={log._id || idx}
                        className="p-3 rounded-xl bg-slate-900/60 border border-surfaceBorder/60 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                              agent === 'planner'
                                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40'
                                : agent === 'execution'
                                ? 'bg-blue-950/80 text-blue-400 border border-blue-800/40'
                                : agent === 'validation'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                                : agent === 'recovery'
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                                : 'bg-purple-950/80 text-purple-400 border border-purple-800/40'
                            }`}
                          >
                            {agent} agent
                          </span>
                          <span className="text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">{log.message}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
