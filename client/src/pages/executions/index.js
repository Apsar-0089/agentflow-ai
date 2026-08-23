import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Radio,
  Clock,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  PauseCircle,
  Ban,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import { executionApi } from '../../services/api';
import { getSocket } from '../../services/socket';

export default function ExecutionsListPage() {
  const [executions, setExecutions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchExecutions = async (page = 1) => {
    try {
      const res = await executionApi.getExecutions({
        page,
        status: statusFilter || undefined,
        limit: 15,
      });
      if (res?.data) {
        setExecutions(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Error fetching executions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExecutions(1);

    // Socket.IO live updates
    const socket = getSocket();
    if (socket) {
      const handleStream = () => {
        fetchExecutions(pagination.page);
      };
      socket.on('execution:stream', handleStream);
      socket.on('execution:status_change', handleStream);

      return () => {
        socket.off('execution:stream', handleStream);
        socket.off('execution:status_change', handleStream);
      };
    }
  }, [statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExecutions(pagination.page);
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Execution Run History"
        subtitle="Full audit trail of AI agent orchestration runs, durations, and state transitions"
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-surfaceLight hover:bg-slate-700 text-slate-300 hover:text-white border border-surfaceBorder transition-colors"
            title="Refresh Executions"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        }
      >
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/80 p-4 rounded-2xl border border-surfaceBorder shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-cyan" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Total Runs: <span className="text-brand-300 font-mono">{pagination.total}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-surfaceBorder rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              >
                <option value="">All Statuses</option>
                <option value="RUNNING">RUNNING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FAILED">FAILED</option>
                <option value="RETRYING">RETRYING</option>
                <option value="PAUSED">PAUSED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Executions Table */}
          <div className="rounded-2xl border border-surfaceBorder bg-surface/80 overflow-hidden shadow-md">
            {executions.length === 0 && !loading ? (
              <div className="p-16 text-center text-slate-500">
                <Activity className="w-10 h-10 mx-auto mb-3 text-slate-600 stroke-[1.2]" />
                <h4 className="text-sm font-bold text-slate-300">No execution runs recorded</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Execute any workflow from the library or AI generator to view live multi-agent execution telemetry.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-surfaceBorder">
                    <tr>
                      <th className="py-3.5 px-4">Run ID & Workflow</th>
                      <th className="py-3.5 px-4">Execution Status</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Retries</th>
                      <th className="py-3.5 px-4">Trigger Time</th>
                      <th className="py-3.5 px-4 text-right">Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surfaceBorder/60">
                    {executions.map((exec) => {
                      const status = exec.status;
                      const isSuccess = status === 'COMPLETED';
                      const isFailed = status === 'FAILED';
                      const isRunning = status === 'RUNNING' || status === 'RETRYING';
                      const isPaused = status === 'PAUSED';
                      const isCancelled = status === 'CANCELLED';

                      return (
                        <tr key={exec._id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-200">
                              {exec.workflowId?.name || exec.workflowSnapshot?.name || 'Automation Workflow'}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {exec._id.slice(-8)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
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
                                  : isCancelled
                                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isSuccess && <CheckCircle2 className="w-3 h-3" />}
                              {isFailed && <XCircle className="w-3 h-3" />}
                              {isRunning && <Radio className="w-3 h-3" />}
                              {isPaused && <PauseCircle className="w-3 h-3" />}
                              {isCancelled && <Ban className="w-3 h-3" />}
                              <span>{status}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : isRunning ? 'Running...' : '--'}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {exec.retryCount || 0}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {new Date(exec.createdAt).toLocaleString()}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/executions/${exec._id}`}
                              className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-brand-600 text-slate-200 hover:text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                            >
                              <span>Inspect Timeline</span>
                              <ExternalLink className="w-3 h-3" />
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
      </AppShell>
    </ProtectedRoute>
  );
}
