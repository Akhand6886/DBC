'use client';

import React, { useState } from 'react';
import { backupManager } from '../lib/governance/backupManager';
import { PreExecutionSnapshot } from '../lib/types';
import { ShieldAlert, RotateCcw, Database, CheckCircle2, History, AlertTriangle, Lock } from 'lucide-react';

export const GovernanceView: React.FC = () => {
  const [snapshots, setSnapshots] = useState<PreExecutionSnapshot[]>(backupManager.getAllSnapshots());
  const [notification, setNotification] = useState<string | null>(null);

  const handleRollback = (snapshotId: string) => {
    const res = backupManager.rollback(snapshotId);
    if (res.success) {
      setNotification(res.message);
      setSnapshots(backupManager.getAllSnapshots());
      setTimeout(() => setNotification(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-4 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Governance Policy & Rollback Management</h2>
            <p className="text-xs text-slate-400">
              Automated pre-execution snapshots & 1-click restore center for high-risk operations
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono flex items-center space-x-2">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Policy Guardrails: <strong className="text-emerald-400">Active</strong></span>
          </div>
        </div>
      </div>

      {/* Snapshot Rollback History Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Pre-Execution Snapshot History ({snapshots.length})
            </h3>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            No pre-execution snapshots recorded yet. Run a high-risk operation (e.g. DELETE or UPDATE) to trigger automated snapshot generation.
          </div>
        ) : (
          <div className="space-y-3">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="font-bold text-cyan-400">{snap.id}</span>
                    <span className="text-slate-400">• {new Date(snap.timestamp).toLocaleString()}</span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                      {snap.dbType} / {snap.table}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono truncate max-w-xl">
                    Query: {snap.queryText}
                  </p>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Frozen Record Count: {snap.affectedRowCount} rows
                  </div>
                </div>

                {/* Rollback Trigger Button */}
                <div className="flex items-center space-x-3">
                  {snap.status === 'ROLLED_BACK' ? (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-3 py-1.5 rounded-lg font-mono font-semibold">
                      ✓ Rolled Back
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRollback(snap.id)}
                      className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs px-4 py-2 rounded-lg font-semibold shadow-md transition-all cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>1-Click Restore</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
