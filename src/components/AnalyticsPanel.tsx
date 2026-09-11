'use client';

import React from 'react';
import { AgentExecutionPlan, SystemMetrics } from '../lib/types';
import {
  Zap,
  Cpu,
  DollarSign,
  Clock,
  ShieldCheck,
  Activity,
  TrendingUp,
  Sliders,
  FileCode,
  Info
} from 'lucide-react';

interface AnalyticsPanelProps {
  metrics?: SystemMetrics;
  recentPlans?: AgentExecutionPlan[];
  onInspectPlan?: (plan: AgentExecutionPlan) => void;
  onOpenRouterConfig?: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  metrics = {
    totalQueries: 0,
    fastPathCount: 0,
    llmCount: 0,
    avgFastPathLatencyMs: 0,
    avgLlmLatencyMs: 0,
    totalCostSavedUSD: 0.0,
    shadowVerificationsPassed: 0
  },
  recentPlans = [],
  onInspectPlan,
  onOpenRouterConfig,
}) => {
  const hasQueries = metrics.totalQueries > 0;
  const fastPathRatio = hasQueries
    ? ((metrics.fastPathCount / metrics.totalQueries) * 100).toFixed(1)
    : '0';

  const latencyReduction =
    hasQueries && metrics.avgLlmLatencyMs > 0
      ? (
          ((metrics.avgLlmLatencyMs - metrics.avgFastPathLatencyMs) / metrics.avgLlmLatencyMs) *
          100
        ).toFixed(1)
      : '0';

  return (
    <div className="flex-1 bg-[#1e1e1e] p-5 overflow-y-auto font-mono text-xs space-y-5 select-none">
      {/* Header */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-[#007acc]/10 border border-[#007acc]/30 flex items-center justify-center text-[#007acc]">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              Confidence-Aware Router Analytics
            </h2>
            <p className="text-[11px] text-slate-400">
              Live deterministic hit rates, sub-5ms execution latencies, and token dollar savings
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenRouterConfig && (
            <button
              onClick={onOpenRouterConfig}
              className="bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#3c3c3c] text-slate-200 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors text-[11px]"
            >
              <Sliders className="h-3.5 w-3.5 text-[#007acc]" />
              <span>Configure Rules</span>
            </button>
          )}
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-bold">
            Dual-Path Active ✓
          </span>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Fast-Path Ratio */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl p-3.5 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Fast-Path Ratio</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{fastPathRatio}%</div>
          <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>
              {hasQueries
                ? `${metrics.fastPathCount.toLocaleString()} / ${metrics.totalQueries.toLocaleString()} resolved without LLM`
                : 'Awaiting first query execution'}
            </span>
          </div>
        </div>

        {/* Card 2: Latency Savings */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl p-3.5 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Fast-Path Latency</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {hasQueries ? `${metrics.avgFastPathLatencyMs}ms` : '-- ms'}
          </div>
          <div className="text-[10px] text-cyan-400">
            {hasQueries ? `${latencyReduction}% latency reduction` : 'Zero latency recorded'}
          </div>
        </div>

        {/* Card 3: Cost Saved */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl p-3.5 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Token Cost Savings</span>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${metrics.totalCostSavedUSD.toFixed(2)}
          </div>
          <div className="text-[10px] text-purple-400">
            {hasQueries ? 'Direct model API fees avoided' : 'No tokens consumed'}
          </div>
        </div>

        {/* Card 4: Shadow Checks */}
        <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl p-3.5 space-y-1 shadow">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Shadow Verifications</span>
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.shadowVerificationsPassed}</div>
          <div className="text-[10px] text-amber-400">
            {hasQueries ? 'Syntax & diagnostic checks verified' : 'Zero AST patches tested'}
          </div>
        </div>
      </div>

      {/* Execution Trace History Table / Zero State */}
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl p-4 space-y-3 shadow">
        <div className="flex items-center justify-between border-b border-[#3c3c3c] pb-2.5">
          <div className="flex items-center space-x-2 text-white font-sans font-bold text-xs uppercase tracking-wider">
            <FileCode className="h-4 w-4 text-[#007acc]" />
            <span>Recent Router Dispatches</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {recentPlans.length} trace records captured
          </span>
        </div>

        {recentPlans.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-[#1e1e1e] border border-[#3c3c3c] flex items-center justify-center text-[#007acc]">
              <Info className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-slate-300">No router dispatches executed in this session yet.</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Run SQL queries in DBMS Studio or ask the AI Copilot to see real-time dual-path decisions, confidence scores, and token cost savings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#3c3c3c] text-[10px] uppercase text-slate-400">
                  <th className="py-2 px-2">ID</th>
                  <th className="py-2 px-2">Prompt</th>
                  <th className="py-2 px-2">Route Path</th>
                  <th className="py-2 px-2">Confidence</th>
                  <th className="py-2 px-2">Latency</th>
                  <th className="py-2 px-2">Cost</th>
                  <th className="py-2 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d] text-[11px]">
                {recentPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-[#1e1e1e] transition-colors">
                    <td className="py-2 px-2 text-slate-400 font-mono">{plan.id}</td>
                    <td className="py-2 px-2 text-slate-200 max-w-xs truncate font-sans">
                      {plan.prompt}
                    </td>
                    <td className="py-2 px-2">
                      {plan.routerPath === 'DETERMINISTIC_FAST_PATH' ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                          <Zap className="h-3 w-3" />
                          <span>Fast-Path</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/20">
                          <Cpu className="h-3 w-3" />
                          <span>LLM</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-bold text-slate-200">
                      {plan.confidenceScore}%
                    </td>
                    <td className="py-2 px-2 text-cyan-300 font-mono">
                      {plan.executionTimeMs}ms
                    </td>
                    <td className="py-2 px-2 text-purple-300 font-mono">
                      ${plan.tokenCostUSD.toFixed(4)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {onInspectPlan && (
                        <button
                          onClick={() => onInspectPlan(plan)}
                          className="text-[10px] bg-[#1e1e1e] hover:bg-[#007acc] hover:text-white border border-[#3c3c3c] text-slate-300 px-2 py-1 rounded transition-colors"
                        >
                          Trace
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
