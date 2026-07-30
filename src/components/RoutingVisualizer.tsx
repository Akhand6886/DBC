'use client';

import React from 'react';
import { ExecutionPlan } from '../lib/types';
import { Zap, Cpu, ShieldCheck, ShieldAlert, Clock, Database, CheckCircle2, ArrowRight } from 'lucide-react';

interface RoutingVisualizerProps {
  plan: ExecutionPlan | null;
  isLoading: boolean;
}

export const RoutingVisualizer: React.FC<RoutingVisualizerProps> = ({ plan, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 bg-slate-700 rounded-full animate-spin"></div>
          <span className="text-sm font-mono text-cyan-400">Classifying intent & evaluating confidence score...</span>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const isFastPath = plan.routePath === 'DETERMINISTIC_FAST_PATH';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
      {/* Route Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          {isFastPath ? (
            <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Zap className="h-4 w-4" />
              <span>Green Path: Deterministic Fast-Path</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <Cpu className="h-4 w-4" />
              <span>Amber Path: LLM Reasoning Engine Escalation</span>
            </div>
          )}

          {plan.cacheHit && (
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium">
              ⚡ Cache Hit (0ms)
            </span>
          )}
        </div>

        {/* Latency & Risk */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1 text-slate-400">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>{plan.executionTimeMs}ms</span>
          </div>

          <div className={`flex items-center space-x-1 font-semibold ${
            plan.riskLevel === 'CRITICAL' ? 'text-rose-400' :
            plan.riskLevel === 'HIGH' ? 'text-amber-400' :
            plan.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'
          }`}>
            {plan.riskScore >= 60 ? (
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>Risk Score: {plan.riskScore}/100 ({plan.riskLevel})</span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Flow Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
        {/* Step 1: Intent Classifier */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">1. Intent Classifier</div>
          <div className="text-xs font-bold text-slate-200">
            Confidence: <span className={plan.confidenceScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}>{plan.confidenceScore}%</span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">{plan.parsedIntent?.explanation}</p>
        </div>

        {/* Step 2: Parser & Semantic Layer / LLM */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">
            2. {isFastPath ? 'Deterministic Parser & Graph' : 'LLM Reasoning Engine'}
          </div>
          <div className="text-xs font-bold text-slate-200 truncate">
            {isFastPath ? 'Rule-based Template' : 'Model Synthesis'}
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            {plan.semanticJoinsApplied.length > 0
              ? plan.semanticJoinsApplied[0]
              : isFastPath ? 'Direct CRUD execution without model call' : 'Multi-step analytical reasoning'}
          </p>
        </div>

        {/* Step 3: Guardrail & Policy Check */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">3. Guardrail & Policy Engine</div>
          <div className="text-xs font-bold text-slate-200">
            {plan.requiresApproval ? (
              <span className="text-amber-400 flex items-center space-x-1">
                <span>Requires Approval</span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 inline" />
                <span>Passed Auto-Approval</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            {plan.riskReasons.length > 0 ? plan.riskReasons[0] : 'Policy compliant'}
          </p>
        </div>

        {/* Step 4: Pre-Execution Backup & Execution */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-1">
          <div className="text-[10px] uppercase font-mono text-slate-400">4. Execution & Backup</div>
          <div className="text-xs font-bold text-slate-200">
            {plan.snapshotId ? (
              <span className="text-cyan-400">Snapshot {plan.snapshotId.slice(-6)}</span>
            ) : (
              <span className="text-slate-300">Direct Execution</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {plan.status === 'SUCCESS' ? `Executed (${plan.affectedRows} rows)` : plan.status}
          </p>
        </div>
      </div>

      {/* Generated Code & Query Syntax */}
      <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
          <div className="flex items-center space-x-2">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>Generated Syntax ({plan.dbType.toUpperCase()})</span>
          </div>
          <span className="text-slate-400">{plan.routePath}</span>
        </div>
        <pre className="text-cyan-300 overflow-x-auto whitespace-pre-wrap">{plan.generatedQuery}</pre>
      </div>
    </div>
  );
};
