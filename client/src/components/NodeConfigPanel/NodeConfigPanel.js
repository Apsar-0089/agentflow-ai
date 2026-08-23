import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Settings,
  ShieldCheck,
  RotateCw,
  HelpCircle,
  Code2,
  Sparkles,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function NodeConfigPanel() {
  const selectedNode = useWorkflowStore((state) => state.selectedNode);
  const setSelectedNode = useWorkflowStore((state) => state.setSelectedNode);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const removeNode = useWorkflowStore((state) => state.removeNode);

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [action, setAction] = useState('');
  const [retryCount, setRetryCount] = useState(2);
  const [params, setParams] = useState({});
  const [requiredFields, setRequiredFields] = useState([]);

  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data || {};
      setLabel(data.label || '');
      setDescription(data.description || '');
      setAction(data.action || '');
      setRetryCount(data.retryCount ?? 2);
      setParams(data.params ? { ...data.params } : {});
      setRequiredFields(data.requiredFields || []);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-surfaceBorder bg-surface/90 p-6 flex flex-col items-center justify-center text-center text-slate-500 select-none">
        <Settings className="w-10 h-10 stroke-[1.2] text-slate-600 mb-3 animate-spin-slow" />
        <h4 className="text-sm font-semibold text-slate-400">Node Inspector</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
          Select any node on the visual canvas to configure its parameters, credentials, and constraints.
        </p>
      </div>
    );
  }

  const handleSave = (newParams = params, newLabel = label, newDesc = description, newRetries = retryCount) => {
    updateNodeData(selectedNode.id, {
      label: newLabel,
      description: newDesc,
      action,
      retryCount: parseInt(newRetries, 10),
      params: newParams,
      requiredFields,
    });
  };

  const handleParamChange = (key, value) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    handleSave(updated);
  };

  const handleDelete = () => {
    removeNode(selectedNode.id);
  };

  return (
    <div className="w-84 border-l border-surfaceBorder bg-surface/95 flex flex-col h-full overflow-hidden shadow-2xl z-20">
      {/* Header */}
      <div className="p-4 border-b border-surfaceBorder flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Node Config</h3>
            <span className="text-[10px] text-slate-400 font-mono">ID: {selectedNode.id}</span>
          </div>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Label */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Step Name / Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              handleSave(params, e.target.value);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Node Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              handleSave(params, label, e.target.value);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Dynamic Type-specific Parameters */}
        <div className="pt-2 border-t border-surfaceBorder/60 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Code2 className="w-3.5 h-3.5 text-brand-400" />
            <span>Action Parameters</span>
          </div>

          {/* AI AGENT PARAMS */}
          {selectedNode.type === 'ai_agent' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  AI Prompt Instruction Template
                </label>
                <textarea
                  rows={4}
                  value={params.promptTemplate || ''}
                  onChange={(e) => handleParamChange('promptTemplate', e.target.value)}
                  placeholder="e.g. Extract invoice amount, tax, and vendor from {{payload}}..."
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 font-mono focus:outline-none focus:border-brand-500 resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Use {'{{summary}}'} or {'{{timestamp}}'} to interpolate upstream context.
                </p>
              </div>
            </div>
          )}

          {/* GMAIL PARAMS */}
          {selectedNode.type === 'gmail' && (
            <div className="space-y-3">
              {action === 'read_emails' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Search Query</label>
                  <input
                    type="text"
                    value={params.query || ''}
                    onChange={(e) => handleParamChange('query', e.target.value)}
                    placeholder="is:unread subject:invoice"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 font-mono"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Recipient Email</label>
                    <input
                      type="email"
                      value={params.recipient || params.to || ''}
                      onChange={(e) => handleParamChange('recipient', e.target.value)}
                      placeholder="operator@company.com"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Subject</label>
                    <input
                      type="text"
                      value={params.subject || ''}
                      onChange={(e) => handleParamChange('subject', e.target.value)}
                      placeholder="Invoice Alert"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Body Template</label>
                    <textarea
                      rows={3}
                      value={params.body || params.message || ''}
                      onChange={(e) => handleParamChange('body', e.target.value)}
                      placeholder="Hello, here is the automated report..."
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 resize-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* SLACK PARAMS */}
          {selectedNode.type === 'slack' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Slack Channel</label>
                <input
                  type="text"
                  value={params.channel || ''}
                  onChange={(e) => handleParamChange('channel', e.target.value)}
                  placeholder="#operations-alerts"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={3}
                  value={params.message || params.text || ''}
                  onChange={(e) => handleParamChange('message', e.target.value)}
                  placeholder="⚡ [Agentflow] Pipeline task completed."
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 resize-none"
                />
              </div>
            </div>
          )}

          {/* DISCORD PARAMS */}
          {selectedNode.type === 'discord' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Discord Channel ID / Name</label>
                <input
                  type="text"
                  value={params.channelId || ''}
                  onChange={(e) => handleParamChange('channelId', e.target.value)}
                  placeholder="ops-alerts-101"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={3}
                  value={params.content || params.message || ''}
                  onChange={(e) => handleParamChange('content', e.target.value)}
                  placeholder="🚀 **Agentflow Alert**: Data sync completed."
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 resize-none"
                />
              </div>
            </div>
          )}

          {/* GOOGLE SHEETS PARAMS */}
          {selectedNode.type === 'google-sheets' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Spreadsheet ID</label>
                <input
                  type="text"
                  value={params.spreadsheetId || ''}
                  onChange={(e) => handleParamChange('spreadsheetId', e.target.value)}
                  placeholder="finance_ledger_2026"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Range</label>
                <input
                  type="text"
                  value={params.range || ''}
                  onChange={(e) => handleParamChange('range', e.target.value)}
                  placeholder="Sheet1!A:E"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          )}

          {/* CONDITION PARAMS */}
          {selectedNode.type === 'condition' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Left Variable</label>
                <input
                  type="text"
                  value={params.leftValue || ''}
                  onChange={(e) => handleParamChange('leftValue', e.target.value)}
                  placeholder="{{summary}}"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Comparison Operator</label>
                <select
                  value={params.operator || 'equals'}
                  onChange={(e) => handleParamChange('operator', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100"
                >
                  <option value="equals">Equals (==)</option>
                  <option value="not_equals">Not Equals (!=)</option>
                  <option value="contains">Contains Substring</option>
                  <option value="greater_than">Greater Than (&gt;)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Right Value</label>
                <input
                  type="text"
                  value={params.rightValue || ''}
                  onChange={(e) => handleParamChange('rightValue', e.target.value)}
                  placeholder="APPROVED"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Retry & Recovery Policies */}
        <div className="pt-3 border-t border-surfaceBorder/60 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <RotateCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Resilience & Retries</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Max Automatic Retries (Recovery Agent)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              value={retryCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setRetryCount(val);
                handleSave(params, label, description, val);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-surfaceBorder rounded-lg text-slate-100"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              If transient or rate-limit failure occurs, Recovery Agent uses exponential backoff up to {retryCount} times before escalating.
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Delete */}
      <div className="p-4 border-t border-surfaceBorder bg-slate-900/60">
        <button
          type="button"
          onClick={handleDelete}
          className="w-full py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node from Canvas</span>
        </button>
      </div>
    </div>
  );
}
