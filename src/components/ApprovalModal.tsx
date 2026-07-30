'use client';

import React from 'react';
import { ExecutionPlan } from '../lib/types';
import { ShieldAlert, Database, Lock, AlertOctagon, CheckCircle2, XCircle } from 'lucide-react';

interface ApprovalModalProps {
  plan: ExecutionPlan | null;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ plan, onApprove, onReject }) => {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Alert */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Governance Approval Required</span>
                <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  Risk Score: {plan.riskScore}/100 ({plan.riskLevel})
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                High-impact or destructive operation detected. Human approval required prior to execution.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Analysis & Pre-Execution Backup Info */}
        <div className="space-y-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <AlertOctagon className="h-4 w-4 text-amber-400" />
              <span>Risk Assessment Factors:</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-400 pl-5 list-disc">
              {plan.riskReasons.map((reason, idx) => (
                <li key={idx} className="text-amber-200/90">{reason}</li>
              ))}
            </ul>
          </div>

          {/* Pre-Execution Backup Snapshot Card */}
          {plan.snapshotId && (
            <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-cyan-300">Automated Pre-Execution Snapshot Generated</div>
                  <div className="text-[11px] font-mono text-cyan-400/80">Snapshot ID: {plan.snapshotId}</div>
                </div>
              </div>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2.5 py-1 rounded-full border border-cyan-500/30">
                1-Click Rollback Ready
              </span>
            </div>
          )}

          {/* Proposed Query Syntax */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400">Proposed Query Syntax:</label>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
              <pre>{plan.generatedQuery}</pre>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            onClick={onReject}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-xl font-semibold border border-slate-700 transition-all"
          >
            <XCircle className="h-4 w-4 text-rose-400" />
            <span>Reject Request</span>
          </button>
          <button
            onClick={onApprove}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Approve & Execute (Snapshot Active)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
