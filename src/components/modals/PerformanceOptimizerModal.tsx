'use client';

import React, { useState, useMemo } from 'react';
import {
  agentOptimizer,
  PerformanceRecommendation,
  QueryOptimizationAnalysis
} from '../../lib/optimizer/agentPerformanceOptimizer';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Copy,
  Check,
  Play,
  FileCode,
  Gauge
} from 'lucide-react';

interface PerformanceOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSql?: string;
  onApplySql?: (optimizedSql: string) => void;
  onLogTerminal?: (msg: string) => void;
}

export const PerformanceOptimizerModal: React.FC<PerformanceOptimizerModalProps> = ({
  isOpen,
  onClose,
  activeSql = 'SELECT * FROM users WHERE role_id = 1;',
  onApplySql,
  onLogTerminal
}) => {
  const [currentSql, setCurrentSql] = useState(activeSql);
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [benchmarkingId, setBenchmarkingId] = useState<string | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<any | null>(null);

  const analysis: QueryOptimizationAnalysis = useMemo(() => {
    return agentOptimizer.analyzeQuery(currentSql);
  }, [currentSql]);

  const history = useMemo(() => agentOptimizer.getHistory(), []);

  // Display either the generated recommendations or fallback to history
  const recommendations: PerformanceRecommendation[] = useMemo(() => {
    return analysis.recommendations.length > 0 ? analysis.recommendations : history;
  }, [analysis.recommendations, history]);

  const activeRec = useMemo(() => {
    if (selectedRecId) {
      return recommendations.find(r => r.id === selectedRecId) || recommendations[0];
    }
    return recommendations[0];
  }, [selectedRecId, recommendations]);

  if (!isOpen) return null;

  const handleCopy = (sql: string, id: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBenchmark = async (rec: PerformanceRecommendation) => {
    setBenchmarkingId(rec.id);
    setBenchmarkResult(null);

    const res = await agentOptimizer.benchmarkOptimization(currentSql, rec);
    setTimeout(() => {
      setBenchmarkingId(null);
      setBenchmarkResult(res);
      if (onLogTerminal) {
        onLogTerminal(`[Agent Optimizer]: Virtual benchmark verified ${res.costDropPct}% cost reduction (latency ${res.beforeLatencyMs}ms → ${res.afterLatencyMs}ms)`);
      }
    }, 600);
  };

  const handleApply = (rec: PerformanceRecommendation) => {
    if (onApplySql) {
      onApplySql(rec.executableSql);
    }
    if (onLogTerminal) {
      onLogTerminal(`[Agent Optimizer]: Applied optimization patch: ${rec.title}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-sans text-xs">
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl w-[95vw] max-w-4xl h-[82vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#2d2d2d] border-b border-[#3c3c3c] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">Agent Performance Optimizer</span>
                <span className="px-2 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[10px]">
                  P2 Subsystem
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated sequential scan detection, B-Tree index synthesis, and query rewrite planner.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#3c3c3c] rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Query Input & Fast Diagnosis Bar */}
        <div className="p-4 bg-[#202020] border-b border-[#3c3c3c] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase">
            <span>Query Under Evaluation:</span>
            <div className="flex items-center space-x-2">
              {analysis.hasSequentialScan && (
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                  Sequential Scan Detected
                </span>
              )}
              {analysis.missingLimit && (
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Missing LIMIT Clause
                </span>
              )}
              {analysis.overallEstimatedSpeedup > 0 && (
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  +{analysis.overallEstimatedSpeedup}% Potential Speedup
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={currentSql}
              onChange={e => setCurrentSql(e.target.value)}
              placeholder="Enter SQL statement to optimize..."
              className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-1.5 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-[#007acc]"
            />
            <button
              onClick={() => setCurrentSql(currentSql)}
              className="px-3 py-1.5 bg-[#007acc] hover:bg-[#0062a3] text-white rounded font-bold text-[11px] transition shadow flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Re-Analyze</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Recommendations List */}
          <div className="w-72 bg-[#202020] border-r border-[#3c3c3c] overflow-y-auto shrink-0 p-2 space-y-1.5">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Recommendations ({recommendations.length})
            </div>

            {recommendations.map(rec => {
              const isSelected = activeRec?.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecId(rec.id)}
                  className={`p-3 rounded border cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#2d2d2d] border-[#007acc] shadow-xs'
                      : 'bg-[#252526] border-[#333333] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {rec.type.replace('_', ' ')}
                    </span>
                    <span className="text-emerald-400 font-mono font-bold text-[10px]">
                      +{rec.estimatedSpeedupPct}%
                    </span>
                  </div>

                  <div className="font-bold text-slate-200 text-[11px] mb-1 leading-snug">
                    {rec.title}
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {rec.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Active Recommendation Detail & Benchmark */}
          {activeRec && (
            <div className="flex-1 flex flex-col overflow-y-auto p-5 bg-[#1e1e1e] space-y-4">
              {/* Title & Speedup Banner */}
              <div className="p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-bold text-white text-sm">{activeRec.title}</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      +{activeRec.estimatedSpeedupPct}% Est. Speedup
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Target Table: <code className="text-cyan-300 font-bold">{activeRec.targetTable}</code>
                  </p>
                </div>

                <button
                  onClick={() => handleApply(activeRec)}
                  className="px-3.5 py-1.5 bg-[#007acc] hover:bg-[#0062a3] text-white rounded font-bold text-[11px] flex items-center space-x-1.5 transition shadow"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Apply Patch</span>
                </button>
              </div>

              {/* Latency & Cost Comparison Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Estimated Execution Latency</span>
                  </span>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-slate-400 line-through text-xs">~{activeRec.beforeEstimatedLatencyMs}ms</span>
                    <span className="text-emerald-400 font-bold text-base">~{activeRec.afterEstimatedLatencyMs}ms</span>
                    <span className="text-[10px] text-emerald-400">(-{activeRec.estimatedSpeedupPct}%)</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    <span>Query Planner Computational Cost</span>
                  </span>
                  <div className="flex items-baseline space-x-2 font-mono">
                    <span className="text-slate-400 line-through text-xs">{activeRec.beforeCost}</span>
                    <span className="text-cyan-400 font-bold text-base">{activeRec.afterCost}</span>
                    <span className="text-[10px] text-cyan-400">cost units</span>
                  </div>
                </div>
              </div>

              {/* Bottlenecks & Optimizer Rationale */}
              <div className="p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-2">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bottlenecks Eliminated</span>
                </span>
                <ul className="space-y-1 text-slate-300">
                  {activeRec.bottlenecksDetected.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px]">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-[#333333] text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Technical Rationale: </span>
                  {activeRec.rationale}
                </div>
              </div>

              {/* Synthesized SQL Output */}
              <div className="p-4 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Executable SQL Optimization</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBenchmark(activeRec)}
                      disabled={benchmarkingId === activeRec.id}
                      className="px-2.5 py-1 bg-[#333333] hover:bg-[#3e3e3e] text-slate-300 hover:text-white rounded text-[10px] font-mono flex items-center space-x-1 transition"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>{benchmarkingId === activeRec.id ? 'Simulating...' : 'Run Virtual Benchmark'}</span>
                    </button>

                    <button
                      onClick={() => handleCopy(activeRec.executableSql, activeRec.id)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-[#333333] rounded"
                      title="Copy SQL to Clipboard"
                    >
                      {copiedId === activeRec.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <pre className="p-3 bg-[#181818] border border-[#333333] rounded font-mono text-emerald-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {activeRec.executableSql}
                </pre>

                {benchmarkResult && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-300 flex items-center space-x-2 font-mono text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Virtual benchmark confirmed {benchmarkResult.costDropPct}% cost reduction (Execution time dropped from {benchmarkResult.beforeLatencyMs}ms to {benchmarkResult.afterLatencyMs}ms).</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#2d2d2d] border-t border-[#3c3c3c] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>AI Performance Advisor evaluates sequential table scans and buffer pool pressure.</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#3c3c3c] hover:bg-[#4a4a4a] text-white rounded text-[11px] transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
