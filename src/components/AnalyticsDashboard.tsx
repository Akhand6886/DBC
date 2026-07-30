'use client';

import React from 'react';
import { Zap, Cpu, DollarSign, Clock, ShieldCheck, Activity, TrendingUp, CheckCircle2 } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const metrics = {
    totalQueries: 14850,
    fastPathQueries: 11580,
    llmQueries: 3270,
    cacheHits: 4120,
    fastPathRatio: 78.0,
    avgFastPathLatencyMs: 4,
    avgLlmLatencyMs: 840,
    latencyReductionPct: 99.5,
    estimatedCostSavedUSD: 486.20,
    blockedHighRiskCount: 14
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">System Analytics & LLM Cost Reduction</h2>
            <p className="text-xs text-slate-400">
              Operational latency metrics, fast-path deterministic hit rates, and token cost savings
            </p>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fast-Path Hit Ratio */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase">Fast-Path Ratio</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.fastPathRatio}%
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
            <TrendingUp className="h-3 w-3" />
            <span>{metrics.fastPathQueries.toLocaleString()} / {metrics.totalQueries.toLocaleString()} resolved without LLM</span>
          </div>
        </div>

        {/* Card 2: Latency Savings */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase">Avg Fast-Path Latency</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.avgFastPathLatencyMs}ms <span className="text-xs text-slate-400 font-normal">vs {metrics.avgLlmLatencyMs}ms LLM</span>
          </div>
          <div className="text-[11px] text-cyan-400 font-semibold">
            {metrics.latencyReductionPct}% faster response time
          </div>
        </div>

        {/* Card 3: Token Cost Saved */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase">Estimated Cost Savings</span>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ${metrics.estimatedCostSavedUSD.toFixed(2)}
          </div>
          <div className="text-[11px] text-purple-400 font-semibold">
            Direct model API cost reduction
          </div>
        </div>

        {/* Card 4: High Risk Shielded */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase">High Risk Blocked</span>
            <ShieldCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.blockedHighRiskCount}
          </div>
          <div className="text-[11px] text-amber-400 font-semibold">
            Unsafe or unauthorized queries intercepted
          </div>
        </div>
      </div>

      {/* Latency Comparison & Routing Distribution Visual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Routing Path Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Query Routing Path Distribution
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Deterministic Fast-Path (Green)</span>
                </span>
                <span className="font-bold">78.0%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center space-x-1 text-cyan-400">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Query Execution Cache Hits</span>
                </span>
                <span className="font-bold">27.7%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: '27.7%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="flex items-center space-x-1 text-amber-400">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>LLM Reasoning Escalation (Amber)</span>
                </span>
                <span className="font-bold">22.0%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '22%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Latency Comparison Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Execution Latency Comparison
          </h3>

          <div className="space-y-4 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-slate-400 font-sans text-xs">Query Cache Hit</div>
                <div className="text-lg font-bold text-cyan-400">~1 ms</div>
              </div>
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-[10px]">
                Instantaneous
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-slate-400 font-sans text-xs">Deterministic Fast-Path Engine</div>
                <div className="text-lg font-bold text-emerald-400">~4 ms</div>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px]">
                Sub-10ms Latency
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-slate-400 font-sans text-xs">LLM Reasoning Engine Call</div>
                <div className="text-lg font-bold text-amber-400">~840 ms</div>
              </div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-[10px]">
                Model Inference
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
