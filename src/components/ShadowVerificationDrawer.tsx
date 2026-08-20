'use client';

import React, { useState } from 'react';
import { ShadowDiffCheck } from '../lib/types';
import { ShieldCheck, RotateCcw, X, FileCode, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface ShadowVerificationDrawerProps {
  history: ShadowDiffCheck[];
  onRollback: (diffCheck: ShadowDiffCheck) => void;
  onClose: () => void;
}

export const ShadowVerificationDrawer: React.FC<ShadowVerificationDrawerProps> = ({
  history,
  onRollback,
  onClose,
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<ShadowDiffCheck | null>(
    history.length > 0 ? history[history.length - 1] : null
  );
  const [viewMode, setViewMode] = useState<'unified' | 'sideBySide'>('unified');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-end p-4 font-mono text-xs animate-in fade-in duration-150">
      <div className="bg-ide-sidebar border-l border-ide-border max-w-3xl w-full h-full rounded-2xl p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-bold uppercase tracking-wider text-xs">Shadow Workspace Verification & Rollback Hub</h2>
              <p className="text-[11px] text-slate-400">
                Pre-execution snapshot stack with 1-click restore capability
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex space-x-4 overflow-hidden">
          {/* Snapshot History Stack List */}
          <div className="w-64 bg-ide-bg border border-ide-border rounded-xl p-3 space-y-2 overflow-y-auto">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Snapshot Stack ({history.length})</span>
            </div>

            {history.length === 0 ? (
              <div className="text-slate-500 text-center py-6 text-[11px]">
                No shadow workspace snapshots recorded yet.
              </div>
            ) : (
              history.map((snap) => {
                const isSelected = selectedSnapshot?.id === snap.id;
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshot(snap)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                        : 'border-ide-border bg-ide-card text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-cyan-400 text-[11px]">
                      <span>{snap.id}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded ${
                        snap.status === 'ROLLED_BACK' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {snap.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-300 truncate mt-1">{snap.targetFile}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{new Date(snap.timestamp).toLocaleTimeString()}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Snapshot Inspector Details */}
          <div className="flex-1 bg-ide-bg border border-ide-border rounded-xl p-4 flex flex-col space-y-3 overflow-hidden">
            {selectedSnapshot ? (
              <>
                {/* Snapshot Header */}
                <div className="flex items-center justify-between border-b border-ide-border pb-2">
                  <div>
                    <div className="flex items-center space-x-2 font-bold text-slate-100">
                      <FileCode className="h-4 w-4 text-cyan-400" />
                      <span>{selectedSnapshot.targetFile}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Snapshot ID: <span className="text-cyan-300 font-mono">{selectedSnapshot.id}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {selectedSnapshot.status === 'ROLLED_BACK' ? (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] px-3 py-1 rounded font-bold">
                        ✓ Snapshot Restored
                      </span>
                    ) : (
                      <button
                        onClick={() => onRollback(selectedSnapshot)}
                        className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>1-Click Restore</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Diff Viewer Body */}
                <div className="flex-1 bg-ide-terminal rounded-lg p-3 overflow-y-auto font-mono text-[11px]">
                  <pre className="text-slate-200 leading-relaxed overflow-x-auto">
                    {selectedSnapshot.patchDiff.split('\n').map((line, idx) => {
                      const isAdd = line.startsWith('+');
                      const isDel = line.startsWith('-');
                      return (
                        <div
                          key={idx}
                          className={`${
                            isAdd ? 'bg-diff-addBg text-diff-addText font-semibold' : isDel ? 'bg-diff-delBg text-diff-delText font-semibold' : 'text-slate-400'
                          } px-2 py-0.5 rounded-xs`}
                        >
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a snapshot from the list on the left to inspect diff and rollback.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
