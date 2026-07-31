'use client';

import React, { useState } from 'react';
import { GitBranch, GitCommit, GitPullRequest, Plus, Minus, FileCode, Check, RotateCcw, Upload, Download, ChevronDown, X } from 'lucide-react';

interface GitChange {
  id: string;
  file: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
  staged: boolean;
  diffPreview: string;
}

interface GitCommitEntry {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

interface GitPanelProps {
  onClose: () => void;
  onLogTerminal?: (msg: string) => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({ onClose, onLogTerminal }) => {
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'branches'>('changes');
  const [commitMessage, setCommitMessage] = useState('');
  const [currentBranch, setCurrentBranch] = useState('main');
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(false);

  const [changes, setChanges] = useState<GitChange[]>([
    {
      id: 'gc-1', file: 'src/components/CodeEditor.tsx', status: 'modified', staged: false,
      diffPreview: '- const editor = useRef(null);\n+ const editor = useMonacoEditor();'
    },
    {
      id: 'gc-2', file: 'src/lib/agent/byokClient.ts', status: 'modified', staged: false,
      diffPreview: '+ async callOpenAI(config, prompt, context) {\n+   const response = await fetch(...);\n+ }'
    },
    {
      id: 'gc-3', file: 'src/components/GitPanel.tsx', status: 'added', staged: false,
      diffPreview: '+ export const GitPanel: React.FC = () => {'
    },
  ]);

  const commitHistory: GitCommitEntry[] = [
    { hash: '21f9940', message: 'docs: add comprehensive Agentic AI IDE feature matrix', author: 'alpha', date: '2 hours ago', branch: 'main' },
    { hash: '51f77f4', message: 'chore: add .gitignore for node_modules and build artifacts', author: 'alpha', date: '3 hours ago', branch: 'main' },
    { hash: 'f213e30', message: 'chore: clean repository baseline, keep docs only', author: 'alpha', date: '4 hours ago', branch: 'main' },
  ];

  const branches = ['main', 'feature/monaco-editor', 'feature/byok-live', 'feature/git-panel'];

  const toggleStage = (id: string) => {
    setChanges(prev => prev.map(c => c.id === id ? { ...c, staged: !c.staged } : c));
  };

  const stageAll = () => {
    setChanges(prev => prev.map(c => ({ ...c, staged: true })));
  };

  const unstageAll = () => {
    setChanges(prev => prev.map(c => ({ ...c, staged: false })));
  };

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    const stagedFiles = changes.filter(c => c.staged);
    if (stagedFiles.length === 0) return;

    setIsCommitting(true);
    setTimeout(() => {
      setIsCommitting(false);
      setCommitSuccess(true);
      setChanges(prev => prev.filter(c => !c.staged));
      if (onLogTerminal) {
        onLogTerminal(`[Git]: Committed ${stagedFiles.length} file(s): "${commitMessage}" on branch ${currentBranch}`);
      }
      setCommitMessage('');
      setTimeout(() => setCommitSuccess(false), 1500);
    }, 400);
  };

  const stagedCount = changes.filter(c => c.staged).length;
  const unstagedCount = changes.filter(c => !c.staged).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'modified': return <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">M</span>;
      case 'added': return <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">A</span>;
      case 'deleted': return <span className="text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded">D</span>;
      case 'untracked': return <span className="text-[9px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 px-1.5 py-0.5 rounded">U</span>;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-3xl w-full h-[80vh] p-5 shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <GitBranch className="h-5 w-5 text-orange-400" />
            <div>
              <h2 className="font-bold uppercase tracking-wider text-xs">Git Source Control</h2>
              <p className="text-[11px] text-slate-400">
                Branch: <span className="text-orange-300 font-bold">{currentBranch}</span> · {changes.length} change(s)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-ide-card rounded" title="Pull">
              <Download className="h-4 w-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-ide-card rounded" title="Push">
              <Upload className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="bg-ide-bg border border-ide-border rounded-lg p-1 flex space-x-1">
          {(['changes', 'history', 'branches'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all capitalize ${
                activeTab === tab ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab === 'changes' ? `Changes (${changes.length})` : tab === 'history' ? 'Commit History' : 'Branches'}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* ── Changes Tab ── */}
          {activeTab === 'changes' && (
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
              {/* Commit Message Input */}
              <div className="space-y-2">
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message (e.g. 'feat: integrate Monaco Editor')"
                  className="w-full bg-ide-bg border border-ide-border rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 resize-none h-16"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span>{stagedCount} staged</span>
                    <span>·</span>
                    <span>{unstagedCount} unstaged</span>
                  </div>
                  <button
                    onClick={handleCommit}
                    disabled={isCommitting || !commitMessage.trim() || stagedCount === 0}
                    className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white text-xs px-4 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow"
                  >
                    {commitSuccess ? (
                      <><Check className="h-3.5 w-3.5 text-emerald-300" /><span>Committed!</span></>
                    ) : (
                      <><GitCommit className="h-3.5 w-3.5" /><span>{isCommitting ? 'Committing...' : 'Commit Staged'}</span></>
                    )}
                  </button>
                </div>
              </div>

              {/* Staged Changes */}
              {stagedCount > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
                    <span>Staged Changes ({stagedCount})</span>
                    <button onClick={unstageAll} className="text-cyan-400 hover:underline normal-case">Unstage All</button>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {changes.filter(c => c.staged).map(change => (
                      <div key={change.id} className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(change.status)}
                          <span className="text-slate-200 text-[11px]">{change.file}</span>
                        </div>
                        <button onClick={() => toggleStage(change.id)} className="text-slate-400 hover:text-white" title="Unstage">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unstaged Changes */}
              {unstagedCount > 0 && (
                <div className="space-y-1 flex-1 overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
                    <span>Unstaged Changes ({unstagedCount})</span>
                    <button onClick={stageAll} className="text-cyan-400 hover:underline normal-case">Stage All</button>
                  </div>
                  <div className="space-y-1.5 overflow-y-auto max-h-48">
                    {changes.filter(c => !c.staged).map(change => (
                      <div key={change.id} className="bg-ide-bg border border-ide-border rounded-lg p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(change.status)}
                            <span className="text-slate-200 text-[11px] font-semibold">{change.file}</span>
                          </div>
                          <button onClick={() => toggleStage(change.id)} className="text-emerald-400 hover:text-emerald-300" title="Stage">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="bg-ide-terminal rounded p-1.5 text-[10px] font-mono">
                          {change.diffPreview.split('\n').map((line, i) => (
                            <div key={i} className={line.startsWith('+') ? 'text-emerald-400' : line.startsWith('-') ? 'text-rose-400' : 'text-slate-400'}>
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Commit History Tab ── */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto space-y-2">
              {commitHistory.map((commit, idx) => (
                <div key={idx} className="bg-ide-bg border border-ide-border rounded-lg p-3 flex items-start space-x-3">
                  <div className="mt-0.5">
                    <div className="h-7 w-7 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                      <GitCommit className="h-3.5 w-3.5 text-orange-400" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-slate-100 font-semibold text-xs">{commit.message}</div>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                      <span className="text-orange-300 font-mono">{commit.hash}</span>
                      <span>{commit.author}</span>
                      <span>{commit.date}</span>
                      <span className="bg-orange-500/10 text-orange-300 border border-orange-500/20 px-1.5 py-0.2 rounded text-[9px]">{commit.branch}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Branches Tab ── */}
          {activeTab === 'branches' && (
            <div className="flex-1 overflow-y-auto space-y-2">
              {branches.map((branch, idx) => {
                const isCurrent = branch === currentBranch;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentBranch(branch);
                      if (onLogTerminal) onLogTerminal(`[Git]: Switched to branch '${branch}'.`);
                    }}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-orange-500/10 border-orange-500/30 text-white'
                        : 'bg-ide-bg border-ide-border text-slate-400 hover:text-slate-200 hover:bg-ide-card'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <GitBranch className={`h-4 w-4 ${isCurrent ? 'text-orange-400' : 'text-slate-500'}`} />
                      <span className="font-semibold text-xs">{branch}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-[9px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">
                        CURRENT
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
