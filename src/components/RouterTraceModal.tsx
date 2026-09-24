'use client';

import React from 'react';
import { AgentExecutionPlan } from '../lib/types';
import { FileCode, X, Zap, Cpu, Clock, ShieldCheck, DollarSign, Check, Copy } from 'lucide-react';

interface RouterTraceModalProps {
  plan: AgentExecutionPlan | null;
  onClose: () => void;
}

export const RouterTraceModal: React.FC<RouterTraceModalProps> = ({ plan, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!plan) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono text-xs select-none">
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3c3c3c] pb-3">
          <div className="flex items-center space-x-2 text-white font-sans font-bold">
            <FileCode className="h-4 w-4 text-[#007acc]" />
            <span className="text-xs uppercase tracking-wider">Router Execution Trace #{plan.id}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="text-[11px] bg-[#1e1e1e] hover:bg-[#2d2d2d] border border-[#3c3c3c] text-slate-300 px-2.5 py-1 rounded flex items-center space-x-1 transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Prompt Header */}
        <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Executed Prompt:</span>
          <div className="text-slate-200 text-xs mt-0.5 font-sans font-medium">{plan.prompt}</div>
        </div>

        {/* Trace Overview Badges */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-3 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Routing Decision</div>
            <div className="font-bold text-xs">
              {plan.routerPath === 'DETERMINISTIC_FAST_PATH' ? (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Deterministic Fast-Path</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center space-x-1">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Agentic LLM ({plan.modelProvider})</span>
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-3 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Execution Latency</div>
            <div className="font-bold text-xs text-cyan-300 flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{plan.executionTimeMs} ms</span>
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-3 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Token Model Cost</div>
            <div className="font-bold text-xs text-purple-400 flex items-center space-x-1">
              <DollarSign className="h-3.5 w-3.5" />
              <span>${plan.tokenCostUSD.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        {plan.intent.scoreBreakdown && (
          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
              <span>Confidence Score Components:</span>
              <span className="text-slate-500 font-normal lowercase">formula: (0.6 &times; pattern + 0.4 &times; lsp - penalty)</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="bg-[#252526] p-2 rounded border border-[#3c3c3c]">
                <div className="text-slate-400 text-[10px]">Pattern (S_pat)</div>
                <div className="font-bold text-cyan-300">{plan.intent.scoreBreakdown.patternScore}%</div>
              </div>
              <div className="bg-[#252526] p-2 rounded border border-[#3c3c3c]">
                <div className="text-slate-400 text-[10px]">LSP (S_LSP)</div>
                <div className="font-bold text-emerald-300">{plan.intent.scoreBreakdown.lspAvailabilityScore}%</div>
              </div>
              <div className="bg-[#252526] p-2 rounded border border-[#3c3c3c]">
                <div className="text-slate-400 text-[10px]">Ambiguity Penalty</div>
                <div className="font-bold text-rose-400">-{plan.intent.scoreBreakdown.ambiguityPenalty}%</div>
              </div>
              <div className="bg-[#252526] p-2 rounded border border-[#3c3c3c] font-bold">
                <div className="text-slate-400 text-[10px]">Final Confidence</div>
                <div className="font-bold text-yellow-300">{plan.confidenceScore}%</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 pt-1 border-t border-[#2d2d2d]">
              <span className="text-slate-500">Explanation:</span> {plan.intent.explanation}
            </div>
          </div>
        )}

        {/* Raw JSON Trace Container */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Full Execution Plan JSON Trace:</label>
          <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-3 text-[11px] text-cyan-300 overflow-x-auto max-h-48 font-mono">
            <pre>{JSON.stringify(plan, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
