import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Key,
  Lock,
  CheckCircle2,
  Cpu,
  Database,
  Radio,
  Server,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState(false);

  return (
    <ProtectedRoute>
      <AppShell
        title="System & Operator Settings"
        subtitle="Security configurations, encryption status, role permissions, and environment telemetry"
      >
        <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {/* Operator Profile Card */}
          <div className="p-6 rounded-3xl bg-surface/90 border border-surfaceBorder shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Active Operator Identity</h3>
                <p className="text-xs text-slate-400">Authenticated user profile and RBAC permissions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Name</span>
                <span className="text-xs font-semibold text-slate-200 mt-1 block">{user?.name || 'Operator'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Email</span>
                <span className="text-xs font-semibold text-slate-200 mt-1 block font-mono">
                  {user?.email || 'operator@agentflow.ai'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Role</span>
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-brand-cyan bg-brand-950/60 px-2 py-0.5 rounded border border-brand-800/40 mt-1">
                  <Shield className="w-3 h-3" />
                  {user?.role?.toUpperCase() || 'OPERATOR'}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Token Encryption Health */}
          <div className="p-6 rounded-3xl bg-surface/90 border border-surfaceBorder shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Application Security & Credential Encryption</h3>
                <p className="text-xs text-slate-400">At-rest encryption, password hashing, and API protection</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Credential Encryption Key</h4>
                  <p className="text-[11px] text-slate-400">AES-256-GCM symmetric encryption for OAuth tokens</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>32-Byte Key Active</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Password Hashing Algorithm</h4>
                  <p className="text-[11px] text-slate-400">bcrypt password protection at cost factor 12</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Bcrypt Cost 12</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Session Protocol</h4>
                  <p className="text-[11px] text-slate-400">Stateless JSON Web Tokens with 7-day expiration</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-brand-300 font-mono bg-brand-950/60 px-2.5 py-1 rounded-lg border border-brand-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>JWT Signed</span>
                </span>
              </div>
            </div>
          </div>

          {/* Engine & Substrate Telemetry */}
          <div className="p-6 rounded-3xl bg-surface/90 border border-surfaceBorder shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Substrate Architecture</h3>
                <p className="text-xs text-slate-400">Underlying orchestration frameworks and queue runners</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Orchestrator</span>
                <span className="text-xs font-semibold text-purple-300 mt-1 block">LangChain & LangGraph</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Queue Substrate</span>
                <span className="text-xs font-semibold text-brand-cyan mt-1 block">BullMQ + In-Memory Fallback</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-surfaceBorder">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Real-time Stream</span>
                <span className="text-xs font-semibold text-emerald-400 mt-1 block">Socket.IO WebSockets</span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
