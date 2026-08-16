'use client';

import React, { useMemo } from 'react';
import { Activity, AlertCircle, CheckCircle2, Sparkles, X, PlusCircle, ArrowDown } from 'lucide-react';
import { analyzeQueryPlan, PlanNode } from '../lib/db/explainAnalyzer';

interface ExplainPlanModalProps {
  query: string;
  onClose: () => void;
  onApplyIndexSuggestion: (sql: string) => void;
}

export const ExplainPlanModal: React.FC<ExplainPlanModalProps> = ({
  query,
  onClose,
  onApplyIndexSuggestion,
}) => {
  const analysis = useMemo(() => analyzeQueryPlan(query), [query]);

  const renderNode = (node: PlanNode) => {
    const isScan = node.nodeType === 'Seq Scan';
    return (
      <div key={node.id} className="flex flex-col items-center space-y-2">
        <div
          className={`p-3 rounded-xl border max-w-sm w-full font-mono text-xs space-y-1.5 transition-all shadow ${
            node.isBottleneck
              ? 'bg-rose-950/30 border-rose-500/50 shadow-rose-500/10'
              : 'bg-ide-sidebar border-ide-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <span>{node.nodeType}</span>
              {node.tableName && <span className="text-cyan-300">({node.tableName})</span>}
            </span>
            {node.isBottleneck ? (
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>Bottleneck Warning</span>
              </span>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Optimal</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1 border-t border-ide-border/50">
            <div>Cost: <span className="text-slate-200 font-bold">{node.cost}</span></div>
            <div>Time: <span className="text-slate-200 font-bold">{node.actualTimeMs}ms</span></div>
            <div>Rows: <span className="text-slate-200 font-bold">{node.rows}</span></div>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center space-y-2 w-full pt-1">
            <ArrowDown className="h-4 w-4 text-cyan-400" />
            <div className="flex space-x-4">
              {node.children.map(child => renderNode(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Activity className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-bold uppercase tracking-wider text-xs">Visual Query Execution Plan (EXPLAIN ANALYZE)</h2>
              <p className="text-[11px] text-slate-400">Total Execution Time: <span className="text-cyan-300 font-bold">{analysis.totalTimeMs}ms</span> · Total Cost: <span className="text-cyan-300 font-bold">{analysis.totalCost}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* AI Index Advisor */}
        {analysis.aiIndexSuggestion && (
          <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>AI Index Advisor Recommendation</span>
              </span>
              <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                Est. Speedup: {analysis.aiIndexSuggestion.estimatedSpeedup}
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              High cost Sequential Scan detected on table <span className="text-cyan-300 font-bold">&apos;{analysis.aiIndexSuggestion.tableName}&apos;</span>. Adding a B-Tree index will convert sequential lookup into an $O(1)$ index lookup.
            </p>
            <div className="flex items-center justify-between pt-1">
              <code className="text-cyan-300 bg-ide-bg px-2.5 py-1 rounded border border-ide-border text-[10px]">
                {analysis.aiIndexSuggestion.sql}
              </code>
              <button
                onClick={() => onApplyIndexSuggestion(analysis.aiIndexSuggestion!.sql)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-[10px] font-bold flex items-center space-x-1 shadow"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create Index</span>
              </button>
            </div>
          </div>
        )}

        {/* Tree Node Graph */}
        <div className="border border-ide-border rounded-xl bg-ide-bg p-4 flex flex-col items-center justify-center max-h-64 overflow-y-auto">
          {renderNode(analysis.rootNode)}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-ide-border">
          <button onClick={onClose} className="px-4 py-1.5 bg-ide-card hover:bg-ide-border text-slate-300 rounded font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
