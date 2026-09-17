'use client';

import React, { useState, useMemo } from 'react';
import { ShadowDiffCheck } from '../../lib/types';
import { ShieldCheck, RotateCcw, X, FileCode, CheckCircle2, AlertTriangle, Layers, Search, Filter } from 'lucide-react';

interface ShadowVerificationDrawerProps {
  history: ShadowDiffCheck[];
  onRollback: (diffCheck: ShadowDiffCheck) => void;
  onClose: () => void;
}

type StatusFilterOption = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ROLLED_BACK';

export const ShadowVerificationDrawer: React.FC<ShadowVerificationDrawerProps> = ({
  history,
  onRollback,
  onClose,
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<ShadowDiffCheck | null>(
    history.length > 0 ? history[history.length - 1] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('ALL');

  // VF-03: Filtered snapshot stack by file name, ID, and lifecycle status
  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return history.filter((snap) => {
      const matchesSearch =
        !query ||
        snap.id.toLowerCase().includes(query) ||
        snap.targetFile.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'ALL' || snap.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

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
          <div className="w-72 bg-ide-bg border border-ide-border rounded-xl p-3 flex flex-col space-y-2 overflow-hidden">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
              <span>Snapshot Stack</span>
              <span className="text-cyan-400">
                {filteredHistory.length} / {history.length}
              </span>
            </div>

            {/* VF-03: Search Filter Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by file or ID..."
                className="w-full bg-ide-card border border-ide-border rounded-lg pl-8 pr-7 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex space-x-1 overflow-x-auto pb-1 text-[9px]">
              {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'ROLLED_BACK'] as StatusFilterOption[]).map((status) => {
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-1.5 py-0.5 rounded whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-200 bg-ide-card/50'
                    }`}
                  >
                    {status === 'ROLLED_BACK' ? 'ROLLED' : status}
                  </button>
                );
              })}
            </div>

            {/* Snapshot Items Scroll Container */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
              {filteredHistory.length === 0 ? (
                <div className="text-slate-500 text-center py-8 text-[11px]">
                  {history.length === 0
                    ? 'No shadow workspace snapshots recorded yet.'
                    : 'No snapshots match your search filter.'}
                </div>
              ) : (
                filteredHistory.map((snap) => {
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
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            snap.status === 'ROLLED_BACK'
                              ? 'bg-amber-500/20 text-amber-400'
                              : snap.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : snap.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-cyan-500/20 text-cyan-400'
                          }`}
                        >
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
