'use client';

import React from 'react';
import { Zap, Cpu, DollarSign, Clock, ShieldCheck, Activity, TrendingUp } from 'lucide-react';

export const AnalyticsPanel: React.FC = () => {
  const metrics = {
    totalQueries: 12480,
    fastPathQueries: 10508,
    llmQueries: 1972,
    fastPathRatio: 84.2,
    avgFastPathLatencyMs: 3,
    avgLlmLatencyMs: 840,
    latencySavingsPct: 99.6,
    totalCostSavedUSD: 432.80,
    shadowVerificationsPassed: 1420
  };

  return (
    <div className="flex-1 bg-ide-bg p-6 overflow-y-auto font-mono text-xs space-y-6">
      {/* Header */}
      <div className="bg-ide-sidebar border border-ide-border rounded-xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Router & Sidecar System Analytics
            </h2>
            <p className="text-[11px] text-slate-400">
              Operational hit rates, deterministic latency metrics, and LLM token cost reduction
            </p>
          </div>
        </div>

        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-bold">
          Engine Healthy ✓
        </span>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fast-Path Ratio */}
        <div className="bg-ide-sidebar border border-ide-border rounded-xl p-4 space-y-1.5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Fast-Path Ratio</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.fastPathRatio}%</div>
          <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>{metrics.fastPathQueries.toLocaleString()} / {metrics.totalQueries.toLocaleString()} resolved without LLM</span>
          </div>
        </div>

        {/* Card 2: Latency Savings */}
        <div className="bg-ide-sidebar border border-ide-border rounded-xl p-4 space-y-1.5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Fast-Path Latency</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.avgFastPathLatencyMs}ms <span className="text-xs text-slate-400 font-normal">vs {metrics.avgLlmLatencyMs}ms LLM</span>
          </div>
          <div className="text-[10px] text-cyan-400">{metrics.latencySavingsPct}% latency reduction</div>
        </div>

        {/* Card 3: Cost Saved */}
        <div className="bg-ide-sidebar border border-ide-border rounded-xl p-4 space-y-1.5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Token Cost Savings</span>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">${metrics.totalCostSavedUSD.toFixed(2)}</div>
          <div className="text-[10px] text-purple-400">Direct model API cost saved</div>
        </div>

        {/* Card 4: Shadow Checks */}
        <div className="bg-ide-sidebar border border-ide-border rounded-xl p-4 space-y-1.5 shadow">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Shadow Verifications</span>
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.shadowVerificationsPassed}</div>
          <div className="text-[10px] text-amber-400">Syntax & diagnostic checks passed</div>
        </div>
      </div>
    </div>
  );
};
