'use client';

import React from 'react';
import { AgentExecutionPlan } from '../lib/types';
import { FileCode, X, Zap, Cpu, Clock, ShieldCheck } from 'lucide-react';

interface RouterTraceModalProps {
  plan: AgentExecutionPlan | null;
  onClose: () => void;
}

export const RouterTraceModal: React.FC<RouterTraceModalProps> = ({ plan, onClose }) => {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <FileCode className="h-4 w-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-xs">Router Execution Trace #{plan.id}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Trace Overview Badges */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-ide-bg border border-ide-border rounded-xl p-3 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Routing Path</div>
            <div className="font-bold text-xs">
              {plan.routerPath === 'DETERMINISTIC_FAST_PATH' ? (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Fast-Path</span>
                </span>
              ) : (
                <span className="text-amber-400 flex items-center space-x-1">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>LLM Escalation</span>
                </span>
              )}
            </div>
          </div>

          <div className="bg-ide-bg border border-ide-border rounded-xl p-3 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Execution Latency</div>
            <div className="font-bold text-xs text-cyan-300 flex items-center space-x-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{plan.executionTimeMs} ms</span>
            </div>
          </div>

          <div className="bg-ide-bg border border-ide-border rounded-xl p-3 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase">Token Model Cost</div>
            <div className="font-bold text-xs text-purple-400">
              ${plan.tokenCostUSD.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Score Breakdown if available */}
        {plan.intent.scoreBreakdown && (
          <div className="bg-ide-bg border border-ide-border rounded-xl p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-400">Calculated Score Components:</div>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className="bg-ide-card p-2 rounded border border-ide-border">
                <div className="text-slate-400 text-[10px]">Pattern (S_pattern)</div>
                <div className="font-bold text-cyan-300">{plan.intent.scoreBreakdown.patternScore}%</div>
              </div>
              <div className="bg-ide-card p-2 rounded border border-ide-border">
                <div className="text-slate-400 text-[10px]">LSP (S_LSP)</div>
                <div className="font-bold text-emerald-300">{plan.intent.scoreBreakdown.lspAvailabilityScore}%</div>
              </div>
              <div className="bg-ide-card p-2 rounded border border-ide-border">
                <div className="text-slate-400 text-[10px]">Ambiguity Penalty</div>
                <div className="font-bold text-rose-400">-{plan.intent.scoreBreakdown.ambiguityPenalty}%</div>
              </div>
              <div className="bg-ide-card p-2 rounded border border-ide-border font-bold">
                <div className="text-slate-400 text-[10px]">Final Confidence</div>
                <div className="font-bold text-yellow-300">{plan.confidenceScore}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Raw JSON Trace Container */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase">Full Execution Plan JSON Trace:</label>
          <div className="bg-ide-bg border border-ide-border rounded-xl p-3 text-[11px] text-cyan-300 overflow-x-auto max-h-60">
            <pre>{JSON.stringify(plan, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
