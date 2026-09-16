'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  dbBranchManager,
  DatabaseBranch,
  BranchDiff
} from '../lib/sandbox/dbBranchManager';
import {
  GitBranch,
  GitMerge,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
  Database,
  Play,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface BranchManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogTerminal?: (msg: string) => void;
}

export const BranchManagerModal: React.FC<BranchManagerModalProps> = ({
  isOpen,
  onClose,
  onLogTerminal
}) => {
  const [branches, setBranches] = useState<DatabaseBranch[]>([]);
  const [activeBranch, setActiveBranch] = useState<DatabaseBranch | null>(null);
  const [selectedCompareBranchId, setSelectedCompareBranchId] = useState<string>('sandbox-migration-preview');
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDesc, setNewBranchDesc] = useState('');
  const [isSandboxCheck, setIsSandboxCheck] = useState(true);
  const [mergeStatus, setMergeStatus] = useState<string | null>(null);

  // Sync state with branch manager
  useEffect(() => {
    const update = () => {
      setBranches(dbBranchManager.getBranches());
      setActiveBranch(dbBranchManager.getActiveBranch());
    };
    update();
    return dbBranchManager.subscribe(update);
  }, [isOpen]);

  const diff: BranchDiff = useMemo(() => {
    if (!activeBranch || !selectedCompareBranchId) {
      return {
        baseBranchId: 'main',
        compareBranchId: '',
        schemaChanges: [],
        dataChanges: [],
        hasModifications: false
      };
    }
    return dbBranchManager.diffBranches('main', selectedCompareBranchId);
  }, [activeBranch, selectedCompareBranchId, branches]);

  if (!isOpen) return null;

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    try {
      const created = dbBranchManager.createBranch(
        newBranchName.trim(),
        activeBranch?.id || 'main',
        newBranchDesc.trim(),
        isSandboxCheck
      );
      if (onLogTerminal) {
        onLogTerminal(`[Branch Manager]: Created branch '${created.name}' from '${activeBranch?.name || 'main'}'`);
      }
      setSelectedCompareBranchId(created.id);
      setIsCreating(false);
      setNewBranchName('');
      setNewBranchDesc('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSwitchBranch = (branchId: string) => {
    try {
      const switched = dbBranchManager.switchBranch(branchId);
      if (onLogTerminal) {
        onLogTerminal(`[Branch Manager]: Switched active database workspace to '${switched.name}'`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMerge = () => {
    if (!selectedCompareBranchId || selectedCompareBranchId === 'main') return;
    const res = dbBranchManager.mergeBranch(selectedCompareBranchId, 'main');
    setMergeStatus(res.message);
    if (onLogTerminal) {
      onLogTerminal(`[Branch Manager Merge]: ${res.message}`);
    }
    setTimeout(() => setMergeStatus(null), 4000);
  };

  const handleDelete = (branchId: string) => {
    if (confirm(`Are you sure you want to delete branch '${branchId}'?`)) {
      dbBranchManager.deleteBranch(branchId);
      if (selectedCompareBranchId === branchId) {
        setSelectedCompareBranchId('main');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-sans text-xs">
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl w-[95vw] max-w-4xl h-[82vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#2d2d2d] border-b border-[#3c3c3c] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#007acc]/20 text-[#007acc] rounded">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">Database Sandbox & Branch Execution</span>
                <span className="px-2 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[10px]">
                  P2 Subsystem
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Copy-on-write isolated database branching, zero-risk agent experiment sandboxing, and branch promotion.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreating(true)}
              className="px-2.5 py-1 bg-[#007acc] hover:bg-[#0062a3] text-white rounded font-medium flex items-center space-x-1 transition shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Branch</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-[#3c3c3c] rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Create Branch Form Drawer / Sub-panel */}
        {isCreating && (
          <form
            onSubmit={handleCreateBranch}
            className="p-4 bg-[#202020] border-b border-[#3c3c3c] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#007acc]" />
                <span>Create Isolated Database Branch</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  placeholder="e.g. sandbox/agent-tune-users"
                  required
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-[#007acc] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase">
                  Description
                </label>
                <input
                  type="text"
                  value={newBranchDesc}
                  onChange={e => setNewBranchDesc(e.target.value)}
                  placeholder="e.g. Testing composite index on users"
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-[#007acc] text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSandboxCheck}
                  onChange={e => setIsSandboxCheck(e.target.checked)}
                  className="rounded border-[#3c3c3c] text-[#007acc]"
                />
                <span>Tag as Agent Speculative Sandbox (Ephemeral Copy-on-Write)</span>
              </label>

              <button
                type="submit"
                className="px-3 py-1 bg-[#007acc] hover:bg-[#0062a3] text-white rounded font-bold text-[11px] transition shadow"
              >
                Create Branch
              </button>
            </div>
          </form>
        )}

        {/* Merge Notification Feedback */}
        {mergeStatus && (
          <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 flex items-center space-x-2 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{mergeStatus}</span>
          </div>
        )}

        {/* Main Workspace Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Branch List */}
          <div className="w-72 bg-[#202020] border-r border-[#3c3c3c] flex flex-col justify-between overflow-y-auto shrink-0">
            <div>
              <div className="px-3 py-2 border-b border-[#333333] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Database Branches ({branches.length})
              </div>

              <div className="p-2 space-y-1.5">
                {branches.map(b => {
                  const isActive = activeBranch?.id === b.id;
                  const isCompareSelected = selectedCompareBranchId === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedCompareBranchId(b.id)}
                      className={`p-2.5 rounded border cursor-pointer transition ${
                        isCompareSelected
                          ? 'bg-[#2d2d2d] border-[#007acc] shadow-xs'
                          : 'bg-[#252526] border-[#333333] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                          <GitBranch className={`w-3.5 h-3.5 ${b.isMain ? 'text-blue-400' : 'text-purple-400'}`} />
                          <span className="font-mono text-[11px] truncate max-w-[140px]">{b.name}</span>
                        </div>

                        {isActive ? (
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitchBranch(b.id);
                            }}
                            className="px-1.5 py-0.2 bg-[#333333] hover:bg-[#007acc] hover:text-white rounded text-[9px] text-slate-300 transition"
                            title="Switch active database workspace to this branch"
                          >
                            Switch
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 line-clamp-1 mb-1.5">
                        {b.description}
                      </p>

                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                        <span>{b.isSandbox ? 'Sandbox' : 'Persistent'}</span>
                        {!b.isMain && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(b.id);
                            }}
                            className="text-slate-500 hover:text-red-400"
                            title="Delete branch"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom active branch indicator */}
            <div className="p-3 bg-[#252526] border-t border-[#333333] text-[11px]">
              <div className="text-slate-400 text-[10px] uppercase font-semibold mb-0.5">Active Workspace:</div>
              <div className="font-mono text-cyan-300 font-bold flex items-center space-x-1 truncate">
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{activeBranch?.name}</span>
              </div>
            </div>
          </div>

          {/* Right: Branch Comparison & Diff Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
            {/* Diff Header */}
            <div className="px-4 py-2.5 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Comparing:</span>
                <span className="px-2 py-0.5 bg-[#333333] rounded font-mono font-bold text-white text-[11px]">
                  main
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded font-mono font-bold text-[11px]">
                  {selectedCompareBranchId}
                </span>
              </div>

              {selectedCompareBranchId !== 'main' && diff.hasModifications && (
                <button
                  onClick={handleMerge}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] flex items-center space-x-1.5 transition shadow"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Merge into Main</span>
                </button>
              )}
            </div>

            {/* Diff Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {diff.hasModifications ? (
                <>
                  {/* Schema Changes */}
                  <div className="p-3.5 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-2">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#007acc]" />
                      <span>Schema Modifications ({diff.schemaChanges.length})</span>
                    </span>

                    {diff.schemaChanges.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {diff.schemaChanges.map((sc, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-[#1e1e1e] border border-[#333333] rounded flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                {sc.type}
                              </span>
                              <span className="text-slate-300">{sc.details}</span>
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">{sc.tableName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px]">No schema alterations detected between branches.</p>
                    )}
                  </div>

                  {/* Data Row Count Changes */}
                  <div className="p-3.5 bg-[#252526] border border-[#3c3c3c] rounded-lg space-y-2">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Row Count Delta</span>
                    </span>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {diff.dataChanges.map(dc => (
                        <div
                          key={dc.tableName}
                          className="p-2.5 bg-[#1e1e1e] border border-[#333333] rounded flex items-center justify-between text-[11px]"
                        >
                          <span className="font-mono font-bold text-slate-300">{dc.tableName}</span>
                          <div className="flex items-center space-x-2 font-mono text-[10px]">
                            <span className="text-slate-500">base: {dc.baseRowCount}</span>
                            <span>→</span>
                            <span className="text-slate-300">branch: {dc.compareRowCount}</span>
                            <span className={`font-bold px-1.5 py-0.2 rounded ${
                              dc.delta > 0 ? 'bg-emerald-500/10 text-emerald-400' : dc.delta < 0 ? 'bg-red-500/10 text-red-400' : 'text-slate-500'
                            }`}>
                              {dc.delta > 0 ? `+${dc.delta}` : dc.delta}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mb-2" />
                  <span className="font-bold text-slate-300 text-sm">Branches are in Sync</span>
                  <p className="text-[11px] max-w-sm mt-1">
                    No schema differences or row count deltas detected between <code className="text-cyan-400">main</code> and <code className="text-purple-400">{selectedCompareBranchId}</code>.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#2d2d2d] border-t border-[#3c3c3c] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All speculative mutations in sandboxes run with Zero Production Blast Radius.</span>
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
