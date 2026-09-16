'use client';

import React, { useState } from 'react';
import { RiskAssessment } from '../../lib/db/queryFirewall';
import { DryRunResult } from '../../lib/db/transactionManager';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  Database,
  ArrowRight,
  RotateCcw,
  Check,
  AlertOctagon
} from 'lucide-react';

interface HumanApprovalModalProps {
  assessment: RiskAssessment;
  dryRunResult?: DryRunResult | null;
  onApprove: () => void;
  onReject: () => void;
}

export const HumanApprovalModal: React.FC<HumanApprovalModalProps> = ({
  assessment,
  dryRunResult,
  onApprove,
  onReject,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const isCritical = assessment.level === 'CRITICAL';
  const requiresTypedConfirmation = isCritical;
  const isConfirmEnabled = !requiresTypedConfirmation || confirmationInput.trim().toUpperCase() === 'CONFIRM';

  const getRiskBadge = () => {
    switch (assessment.level) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded bg-red-900/60 text-red-300 border border-red-500/50 text-xs font-bold flex items-center gap-1.5"><AlertOctagon className="w-3.5 h-3.5" /> CRITICAL RISK ({assessment.score}/100)</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded bg-amber-900/60 text-amber-300 border border-amber-500/50 text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> HIGH RISK ({assessment.score}/100)</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 rounded bg-yellow-900/60 text-yellow-300 border border-yellow-500/50 text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> MEDIUM RISK ({assessment.score}/100)</span>;
      default:
        return <span className="px-2.5 py-1 rounded bg-blue-900/60 text-blue-300 border border-blue-500/50 text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> LOW RISK ({assessment.score}/100)</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-red-500/40 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#333333] bg-[#252526]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-red-500/10 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Human Approval Gate — Query Firewall</h2>
              <p className="text-xs text-slate-400">Autonomous operation paused. Explicit operator confirmation required.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getRiskBadge()}
            <button
              onClick={onReject}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#333333] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {/* Target Query Display */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Proposed SQL Statement:</label>
            <div className="bg-[#141414] border border-[#333333] rounded p-3 font-mono text-amber-300 text-xs overflow-x-auto whitespace-pre-wrap">
              {assessment.query}
            </div>
          </div>

          {/* Blast Radius & Risk Factors */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#252526] border border-[#333333] rounded p-2.5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Tables</span>
              <span className="font-mono text-white text-xs font-medium">
                {assessment.blastRadius.targetTables.join(', ') || 'N/A'}
              </span>
            </div>
            <div className="bg-[#252526] border border-[#333333] rounded p-2.5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Affected Rows</span>
              <span className={`font-mono text-xs font-bold ${assessment.blastRadius.estimatedAffectedRows === 'ALL' ? 'text-red-400' : 'text-amber-300'}`}>
                {assessment.blastRadius.estimatedAffectedRows}
              </span>
            </div>
            <div className="bg-[#252526] border border-[#333333] rounded p-2.5">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reversible</span>
              <span className={`font-mono text-xs font-medium ${assessment.blastRadius.reversible ? 'text-emerald-400' : 'text-red-400'}`}>
                {assessment.blastRadius.reversible ? 'Yes (Snapshot)' : 'No (Destructive)'}
              </span>
            </div>
          </div>

          {/* Safety Violations */}
          {assessment.violations.length > 0 && (
            <div className="bg-red-950/30 border border-red-500/30 rounded p-3 text-red-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-xs text-red-200">
                <AlertOctagon className="w-3.5 h-3.5" /> Safety Violations:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-xs">
                {assessment.violations.map((v, idx) => (
                  <li key={idx}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Remediations */}
          {assessment.remediations.length > 0 && (
            <div className="bg-[#252526] border border-[#333333] rounded p-3 text-slate-300 space-y-1">
              <div className="font-semibold text-slate-200 text-xs">Recommended Remediation:</div>
              <ul className="list-disc pl-5 space-y-0.5 text-xs text-slate-400">
                {assessment.remediations.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dry-Run Inverted Rollback Script Preview */}
          {dryRunResult && dryRunResult.rollbackSql && (
            <div>
              <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                Auto-Generated Inverted Rollback Script (Shadow Transaction):
              </label>
              <div className="bg-[#141414] border border-emerald-900/40 rounded p-2.5 font-mono text-emerald-300 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-24">
                {dryRunResult.rollbackSql}
              </div>
            </div>
          )}

          {/* Required Confirmation for CRITICAL queries */}
          {requiresTypedConfirmation && (
            <div className="bg-red-950/40 border border-red-500/40 rounded p-3 space-y-2">
              <label className="block text-red-200 font-semibold text-xs">
                Type <span className="font-mono text-white bg-red-900/80 px-1 py-0.5 rounded">CONFIRM</span> to proceed with this destructive operation:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type CONFIRM here"
                className="w-full bg-[#1e1e1e] border border-red-500/50 rounded px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-red-400"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#333333] bg-[#252526]">
          <span className="text-[11px] text-slate-400">
            A 1-click state rollback snapshot will be captured prior to execution.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              className="px-3 py-1.5 rounded bg-[#333333] hover:bg-[#3c3c3c] text-slate-200 text-xs font-medium transition"
            >
              Reject & Cancel
            </button>
            <button
              onClick={onApprove}
              disabled={!isConfirmEnabled}
              className={`px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                isConfirmEnabled
                  ? isCritical
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
                    : 'bg-[#007acc] hover:bg-[#0062a3] text-white shadow-lg shadow-blue-900/30'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Approve & Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
