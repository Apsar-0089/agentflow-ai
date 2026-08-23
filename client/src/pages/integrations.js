import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  Bot,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Key,
  ShieldCheck,
  RefreshCw,
  Sliders,
  X,
  AlertTriangle,
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import { integrationApi } from '../services/api';

const INTEGRATION_METAS = {
  gmail: {
    name: 'Gmail Integration',
    category: 'Email & Messaging',
    icon: Mail,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    description: 'Trigger automations on incoming customer/billing emails, extract attachments, and send automated confirmation emails.',
    authType: 'OAuth 2.0 / App Password',
    scopes: ['gmail.send', 'gmail.readonly'],
  },
  slack: {
    name: 'Slack Integration',
    category: 'Chat & Alerts',
    icon: MessageSquare,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    description: 'Broadcast real-time incident reports, workflow summaries, and approval cards directly into team channels.',
    authType: 'OAuth 2.0 / Webhook',
    scopes: ['chat:write', 'channels:read'],
  },
  discord: {
    name: 'Discord Bot Integration',
    category: 'Chat & Ops',
    icon: MessageSquare,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/30',
    description: 'Post structured telemetry embeds into DevOps incident war rooms and dispatch automated bot messages.',
    authType: 'Bot Token / Webhook',
    scopes: ['bot', 'messages.write'],
  },
  'google-sheets': {
    name: 'Google Sheets Integration',
    category: 'Ledger & Database',
    icon: FileSpreadsheet,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Append audited transaction rows, sync invoice records, and read operational datasets directly.',
    authType: 'OAuth 2.0 / Service Account',
    scopes: ['spreadsheets.read_write'],
  },
  openrouter: {
    name: 'OpenRouter AI Core',
    category: 'LLM Orchestration',
    icon: Sparkles,
    iconColor: 'text-brand-cyan',
    iconBg: 'bg-cyan-500/10 border-cyan-500/30',
    description: 'Access state-of-the-art models (Claude 3.5, GPT-4o, Llama 3) for workflow synthesis and reasoning.',
    authType: 'API Key',
    scopes: ['completions.create'],
  },
  gemini: {
    name: 'Google Gemini AI SDK',
    category: 'LLM Reasoning',
    icon: Bot,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10 border-indigo-500/30',
    description: 'Direct integration with Gemini 1.5 Flash and Gemini 2.0 for fast entity extraction and graph generation.',
    authType: 'API Key',
    scopes: ['generateContent'],
  },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [modalConfig, setModalConfig] = useState({ accessToken: '', webhookUrl: '', channel: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchIntegrations = async () => {
    try {
      const res = await integrationApi.getIntegrations();
      if (res?.data) {
        setIntegrations(res.data);
      }
    } catch (err) {
      console.error('Error loading integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleOAuthConnect = (provider) => {
    // Open OAuth start route
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    window.location.href = `${apiUrl}/integrations/oauth/${provider}/start`;
  };

  const handleManualSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await integrationApi.saveCredentials({
        provider: selectedProvider,
        accessToken: modalConfig.accessToken || undefined,
        config: {
          webhookUrl: modalConfig.webhookUrl || undefined,
          channel: modalConfig.channel || undefined,
        },
        isConnected: true,
      });

      setMessage(`${selectedProvider} credentials saved securely (Encrypted AES-256-GCM).`);
      setSelectedProvider(null);
      fetchIntegrations();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!window.confirm(`Disconnect ${provider} integration?`)) return;
    try {
      await integrationApi.disconnect(provider);
      fetchIntegrations();
    } catch (err) {
      alert(`Disconnect failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell
        title="Third-Party Integrations Hub"
        subtitle="Manage OAuth connections, bot credentials, and application-level token encryption"
        actions={
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>AES-256-GCM Encrypted at Rest</span>
          </div>
        }
      >
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {message && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((item) => {
              const meta = INTEGRATION_METAS[item.provider] || {
                name: item.name,
                category: 'Integration',
                icon: Boxes,
                iconColor: 'text-brand-400',
                iconBg: 'bg-brand-500/10 border-brand-500/20',
                description: 'Third-party integration provider.',
                authType: 'OAuth / Token',
              };

              const Icon = meta.icon;
              const isConnected = item.isConnected;

              return (
                <div
                  key={item.provider}
                  className="p-5 rounded-2xl border border-surfaceBorder bg-surface/80 hover:border-slate-600 transition-all flex flex-col justify-between shadow-md group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl border ${meta.iconBg} ${meta.iconColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100">{meta.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{meta.category}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                          isConnected
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isConnected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">{meta.description}</p>

                    <div className="mt-4 pt-3 border-t border-surfaceBorder/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Auth: {meta.authType}</span>
                      {item.lastTested && (
                        <span>Verified: {new Date(item.lastTested).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-surfaceBorder/60 flex items-center justify-between gap-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedProvider(item.provider);
                            setModalConfig({
                              accessToken: '',
                              webhookUrl: item.config?.webhookUrl || '',
                              channel: item.config?.channel || '',
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-surfaceBorder transition-colors flex items-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Configure</span>
                        </button>
                        <button
                          onClick={() => handleDisconnect(item.provider)}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 text-xs font-semibold transition-colors"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOAuthConnect(item.provider)}
                          className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Connect OAuth</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProvider(item.provider);
                            setModalConfig({ accessToken: '', webhookUrl: '', channel: '' });
                          }}
                          className="py-2 px-3 rounded-lg bg-surfaceLight hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-surfaceBorder transition-colors"
                          title="Manual Token Entry"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Config Modal */}
        {selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-surface border border-surfaceBorder rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-cyan" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Configure {selectedProvider}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleManualSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Access Token / API Key / Bot Token
                  </label>
                  <input
                    type="password"
                    value={modalConfig.accessToken}
                    onChange={(e) => setModalConfig({ ...modalConfig, accessToken: e.target.value })}
                    placeholder="Paste credentials (encrypted with AES-256-GCM)..."
                    className="w-full px-3 py-2 bg-slate-900 border border-surfaceBorder rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                {(selectedProvider === 'slack' || selectedProvider === 'discord') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Incoming Webhook URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={modalConfig.webhookUrl}
                      onChange={(e) => setModalConfig({ ...modalConfig, webhookUrl: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3 py-2 bg-slate-900 border border-surfaceBorder rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-900/80 border border-surfaceBorder text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tokens are encrypted with AES-256-GCM at rest before saving.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider(null)}
                    className="px-4 py-2 rounded-xl bg-surfaceLight text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand"
                  >
                    {saving ? 'Encrypting & Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
