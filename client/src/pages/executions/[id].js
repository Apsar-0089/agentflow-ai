import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Activity,
  Play,
  Pause,
  XCircle,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Cpu,
  Bot,
  Layers,
  ArrowLeft,
  RefreshCw,
  Shield,
  FileCode,
  Sparkles,
} from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../../components/AppShell/AppShell';
import { executionApi, workflowApi } from '../../services/api';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../../services/socket';

const AGENT_BADGE_CONFIG = {
  planner: {
    label: 'Planner Agent',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/80 border-cyan-800/40',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
  },
  execution: {
    label: 'Execution Agent',
    color: 'text-blue-400',
    bg: 'bg-blue-950/80 border-blue-800/40',
    iconBg: 'bg-blue-500/20 text-blue-400',
  },
  validation: {
    label: 'Validation Agent',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/80 border-emerald-800/40',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
  recovery: {
    label: 'Recovery Agent',
    color: 'text-amber-400',
    bg: 'bg-amber-950/80 border-amber-800/40',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
  monitoring: {
    label: 'Monitoring Agent',
    color: 'text-purple-400',
    bg: 'bg-purple-950/80 border-purple-800/40',
    iconBg: 'bg-purple-500/20 text-purple-400',
  },
  orchestrator: {
    label: 'Master Orchestrator',
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/80 border-indigo-800/40',
    iconBg: 'bg-indigo-500/20 text-indigo-400',
  },
};

export default function ExecutionDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'outputs' | 'snapshot'
  const [controlLoading, setControlLoading] = useState(false);
  const timelineEndRef = useRef(null);

  const fetchExecution = async () => {
    if (!id) return;
    try {
      const [execRes, timelineRes] = await Promise.all([
        executionApi.getExecutionById(id),
        executionApi.getTimeline(id),
      ]);
      if (execRes?.data) setExecution(execRes.data);
      if (timelineRes?.data?.logs) setLogs(timelineRes.data.logs);
    } catch (err) {
      console.error('Error fetching execution detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecution();

    if (!id) return;

    // Join Socket room
    joinExecutionRoom(id);

    const socket = getSocket();
    if (socket) {
      const handleEvent = (eventLog) => {
        setLogs((prev) => {
          if (prev.some((l) => l.timestamp === eventLog.timestamp && l.message === eventLog.message)) {
            return prev;
          }
          return [...prev, eventLog];
        });
      };

      const handleStatus = (statusData) => {
        setExecution((prev) => (prev ? { ...prev, ...statusData } : prev));
      };

      socket.on('execution:event', handleEvent);
      socket.on('execution:status', handleStatus);

      return () => {
        leaveExecutionRoom(id);
        socket.off('execution:event', handleEvent);
        socket.off('execution:status', handleStatus);
      };
    }
  }, [id]);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handlePause = async () => {
    setControlLoading(true);
    try {
      await executionApi.pause(id);
      fetchExecution();
    } catch (err) {
      alert(`Pause failed: ${err.message}`);
    } finally {
      setControlLoading(false);
    }
  };

  const handleResume = async () => {
    setControlLoading(true);
    try {
      await executionApi.resume(id);
      fetchExecution();
    } catch (err) {
      alert(`Resume failed: ${err.message}`);
    } finally {
      setControlLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this running execution?')) return;
    setControlLoading(true);
    try {
      await executionApi.cancel(id);
      fetchExecution();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setControlLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!execution?.workflowId) return;
    const wfId = execution.workflowId._id || execution.workflowId;
    try {
      const res = await workflowApi.executeWorkflow(wfId, execution.inputs);
      if (res?.data?._id) {
        router.push(`/executions/${res.data._id}`);
      }
    } catch (err) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  const status = execution?.status || 'PENDING';
  const isRunning = status === 'RUNNING' || status === 'RETRYING';
  const isPaused = status === 'PAUSED';
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';
  const isCancelled = status === 'CANCELLED';

  return (
    <ProtectedRoute>
      <AppShell
        title={execution?.workflowSnapshot?.name || execution?.workflowId?.name || 'Execution Run'}
        subtitle={`Run ID: ${id} • Status: ${status}`}
        actions={
          <div className="flex items-center gap-2">
            {isRunning && (
              <>
                <button
                  onClick={handlePause}
                  disabled={controlLoading}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Pause className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={controlLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {isPaused && (
              <button
                onClick={handleResume}
                disabled={controlLoading}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-emerald-300" />
                <span>Resume Run</span>
              </button>
            )}

            {(isCompleted || isFailed || isCancelled) && (
              <button
                onClick={handleRetry}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-1.5 transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Re-Run Pipeline</span>
              </button>
            )}
          </div>
        }
      >
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Status Telemetry Banner */}
          <div className="p-5 rounded-2xl bg-surface/90 border border-surfaceBorder grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-md">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                Execution State
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold uppercase tracking-wider ${
                    isCompleted
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
                  {isRunning && <Radio className="w-3 h-3" />}
                  {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                  {isFailed && <XCircle className="w-3 h-3" />}
                  <span>{status}</span>
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Duration</span>
              <span className="text-base font-mono font-bold text-slate-100 mt-1 block">
                {execution?.duration ? `${(execution.duration / 1000).toFixed(2)}s` : isRunning ? 'Streaming...' : '--'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                Orchestration Substrate
              </span>
              <span className="text-xs font-mono font-bold text-brand-300 mt-1 block flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-brand-cyan" />
                LangGraph ({execution?.langGraphStatus || 'available'})
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                Confidence Score
              </span>
              <span className="text-base font-mono font-bold text-emerald-400 mt-1 block">
                {execution?.confidenceScore ? `${Math.round(execution.confidenceScore * 100)}%` : '100%'}
              </span>
            </div>
          </div>

          {/* Failure & Recovery Alert Banner */}
          {execution?.error && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Execution Escalation • {execution.error.classification || 'FAILURE'}</span>
              </div>
              <p className="text-xs text-rose-200 font-mono bg-black/40 p-2.5 rounded-lg">
                {execution.error.message}
              </p>
              <div className="text-[11px] text-rose-400 flex items-center gap-2">
                <span>Failed at step: <strong>{execution.error.step || execution.currentNode}</strong></span>
                <span>&bull;</span>
                <span>Retried {execution.retryCount || 0} times with exponential backoff</span>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-surfaceBorder pb-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'timeline'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Live Agent Timeline ({logs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('outputs')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'outputs'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Outputs & Step Payloads</span>
            </button>

            <button
              onClick={() => setActiveTab('snapshot')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'snapshot'
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Workflow Snapshot</span>
            </button>
          </div>

          {/* TAB 1: LIVE AGENT TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="rounded-2xl border border-surfaceBorder bg-surface/90 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-brand-cyan" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Agent Chain Telemetry Log
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                  <Radio className={`w-3 h-3 ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                  <span>{isRunning ? 'Real-Time Socket Stream Active' : 'Execution Finished'}</span>
                </div>
              </div>

              <div className="space-y-3">
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
                    <p className="text-xs">Waiting for initial agent events...</p>
                  </div>
                ) : (
                  logs.map((log, idx) => {
                    const agentCfg = AGENT_BADGE_CONFIG[log.agent] || AGENT_BADGE_CONFIG.monitoring;
                    const isSuccess = log.level === 'success';
                    const isError = log.level === 'error';
                    const isWarning = log.level === 'warning';

                    return (
                      <div
                        key={log._id || idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isError
                            ? 'bg-rose-950/30 border-rose-800/50'
                            : isSuccess
                            ? 'bg-slate-900/70 border-surfaceBorder hover:border-slate-600'
                            : isWarning
                            ? 'bg-amber-950/20 border-amber-800/40'
                            : 'bg-slate-900/50 border-surfaceBorder/80'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] font-bold uppercase tracking-wider ${agentCfg.bg} ${agentCfg.color}`}
                            >
                              {agentCfg.label}
                            </span>

                            {log.nodeId && (
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                                Node: {log.nodeId}
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 font-sans leading-relaxed">{log.message}</p>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-surfaceBorder/40 overflow-x-auto">
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={timelineEndRef} />
              </div>
            </div>
          )}

          {/* TAB 2: OUTPUTS */}
          {activeTab === 'outputs' && (
            <div className="rounded-2xl border border-surfaceBorder bg-surface/90 p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                Execution Output Artifacts
              </h3>
              <pre className="p-4 rounded-xl bg-slate-950 border border-surfaceBorder text-slate-300 font-mono text-xs overflow-x-auto">
                {JSON.stringify(execution?.outputs || {}, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 3: SNAPSHOT */}
          {activeTab === 'snapshot' && (
            <div className="rounded-2xl border border-surfaceBorder bg-surface/90 p-6 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2">
                Runtime Workflow Graph Snapshot
              </h3>
              <pre className="p-4 rounded-xl bg-slate-950 border border-surfaceBorder text-slate-300 font-mono text-xs overflow-x-auto">
                {JSON.stringify(execution?.workflowSnapshot || {}, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
