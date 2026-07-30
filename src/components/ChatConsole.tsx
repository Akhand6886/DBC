'use client';

import React, { useState } from 'react';
import { DatabaseType, UserRole, ExecutionPlan } from '../lib/types';
import { executeQueryPlan } from '../lib/db/dbEngine';
import { RoutingVisualizer } from './RoutingVisualizer';
import { DataPreviewTable } from './DataPreviewTable';
import { ApprovalModal } from './ApprovalModal';
import { Send, Sparkles, Zap, ShieldAlert, History, RotateCcw } from 'lucide-react';

interface ChatConsoleProps {
  currentDb: DatabaseType;
  currentRole: UserRole;
  onPlanExecuted?: (plan: ExecutionPlan) => void;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  currentDb,
  currentRole,
  onPlanExecuted,
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<ExecutionPlan | null>(null);
  const [pendingApprovalPlan, setPendingApprovalPlan] = useState<ExecutionPlan | null>(null);

  const presetQueries = [
    {
      label: 'Show active customers',
      query: 'Show active customers with total spend > 50000',
      badge: 'Fast-Path ~3ms',
      type: 'green'
    },
    {
      label: 'Count orders',
      query: 'Count total completed orders',
      badge: 'Fast-Path ~2ms',
      type: 'green'
    },
    {
      label: 'Analyze Q3 revenue',
      query: 'Why did revenue decline in Q3 despite higher traffic?',
      badge: 'LLM Reasoning',
      type: 'amber'
    },
    {
      label: 'Delete inactive users',
      query: 'Delete inactive customers created before 2023',
      badge: 'High-Risk Backup',
      type: 'rose'
    }
  ];

  const handleRunQuery = (textToRun?: string) => {
    const targetQuery = textToRun || queryInput;
    if (!targetQuery.trim()) return;

    setIsLoading(true);
    setActivePlan(null);

    setTimeout(() => {
      const plan = executeQueryPlan(targetQuery, currentDb, 'sarah.conner@enterprise.com', currentRole);
      setIsLoading(false);

      if (plan.status === 'PENDING_APPROVAL') {
        setPendingApprovalPlan(plan);
      } else {
        setActivePlan(plan);
        if (onPlanExecuted) onPlanExecuted(plan);
      }
    }, 400);
  };

  const handleApprovePlan = () => {
    if (!pendingApprovalPlan) return;
    const planToApprove = pendingApprovalPlan;
    setPendingApprovalPlan(null);

    setIsLoading(true);
    setTimeout(() => {
      const executedPlan = executeQueryPlan(
        planToApprove.queryText,
        planToApprove.dbType,
        planToApprove.user,
        planToApprove.userRole,
        true // force approval submit
      );
      setIsLoading(false);
      setActivePlan(executedPlan);
      if (onPlanExecuted) onPlanExecuted(executedPlan);
    }, 300);
  };

  const handleRejectPlan = () => {
    setPendingApprovalPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* Query Bar & Presets Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Conversational Query Assistant
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Connected to: <span className="text-cyan-400 font-bold">{currentDb.toUpperCase()}</span>
          </span>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
            placeholder="Ask anything in natural language... e.g. 'Show active customers' or 'Delete inactive users'"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 pl-4 pr-28 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
          />
          <button
            onClick={() => handleRunQuery()}
            disabled={isLoading || !queryInput.trim()}
            className="absolute right-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            <span>Execute</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Preset Triggers */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-mono flex items-center space-x-1 mr-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Preset Triggers:</span>
          </span>
          {presetQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQueryInput(item.query);
                handleRunQuery(item.query);
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                item.type === 'green'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300'
                  : item.type === 'amber'
                  ? 'bg-amber-500/5 border-amber-500/20 text-slate-300 hover:border-amber-500/40 hover:text-amber-300'
                  : 'bg-rose-500/5 border-rose-500/20 text-slate-300 hover:border-rose-500/40 hover:text-rose-300'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] font-mono opacity-80">({item.badge})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Request Routing Visualizer */}
      <RoutingVisualizer plan={activePlan} isLoading={isLoading} />

      {/* Query Data Results Table */}
      {activePlan && (
        <DataPreviewTable
          data={activePlan.resultData}
          affectedRows={activePlan.affectedRows}
          error={activePlan.error}
          queryText={activePlan.queryText}
        />
      )}

      {/* Human-in-the-Loop Approval Modal */}
      <ApprovalModal
        plan={pendingApprovalPlan}
        onApprove={handleApprovePlan}
        onReject={handleRejectPlan}
      />
    </div>
  );
};
