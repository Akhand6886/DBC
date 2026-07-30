'use client';

import React, { useState } from 'react';
import { Terminal, Cpu, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface TerminalPanelProps {
  logs: string[];
  onRunTests?: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ logs, onRunTests }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'diagnostics' | 'sidecar'>('terminal');

  return (
    <div className="h-44 bg-ide-terminal border-t border-ide-border flex flex-col font-mono text-xs select-none">
      {/* Terminal Header Tabs */}
      <div className="bg-ide-sidebar border-b border-ide-border px-3 py-1 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-[11px]">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-1 py-1 font-semibold ${
              activeTab === 'terminal' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Terminal</span>
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center space-x-1 py-1 font-semibold ${
              activeTab === 'diagnostics' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>LSP Diagnostics (0 Errors)</span>
          </button>
          <button
            onClick={() => setActiveTab('sidecar')}
            className={`flex items-center space-x-1 py-1 font-semibold ${
              activeTab === 'sidecar' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-orange-400" />
            <span>Rust Sidecar Indexer</span>
          </button>
        </div>

        {onRunTests && (
          <button
            onClick={onRunTests}
            className="flex items-center space-x-1 bg-ide-card hover:bg-ide-border text-slate-200 text-[11px] px-2 py-0.5 rounded border border-ide-border font-semibold transition-all"
          >
            <Play className="h-3 w-3 text-emerald-400" />
            <span>Run Test Suite</span>
          </button>
        )}
      </div>

      {/* Terminal Content Area */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
        {activeTab === 'terminal' && (
          <div>
            <div className="text-slate-500 text-[11px] mb-2">
              Agentic AI IDE Terminal v1.0.0 [bash process ready]
            </div>
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-cyan-300">
                <span className="text-emerald-400 font-bold">$</span>
                <span className="whitespace-pre-wrap">{log}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="text-slate-400 text-xs space-y-1">
            <div className="text-emerald-400 font-bold flex items-center space-x-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Language Server Protocol (LSP) Status: HEALTHY</span>
            </div>
            <p>0 syntax errors, 0 lint warnings across 14 workspace files.</p>
          </div>
        )}

        {activeTab === 'sidecar' && (
          <div className="text-slate-300 text-xs space-y-1">
            <div className="text-orange-400 font-bold flex items-center space-x-1">
              <Cpu className="h-4 w-4" />
              <span>Rust Sidecar AST Indexer (LanceDB Vector Store)</span>
            </div>
            <p className="text-slate-400">Indexed 14 workspace files (142 symbol nodes) in 1ms.</p>
          </div>
        )}
      </div>
    </div>
  );
};
