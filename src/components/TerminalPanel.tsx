'use client';

import React, { useState } from 'react';
import { Terminal as TerminalIcon, Play, Trash2, X, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TerminalPanelProps {
  logs: string[];
  onRunTests: () => void;
  onClearLogs?: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  logs,
  onRunTests,
  onClearLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'output' | 'problems' | 'debug'>('terminal');
  const [localLogs, setLocalLogs] = useState<string[]>([]);

  const displayLogs = localLogs.length > 0 ? localLogs : logs;

  const handleClear = () => {
    setLocalLogs(['Terminal output cleared.']);
    if (onClearLogs) onClearLogs();
  };

  return (
    <div className="h-44 bg-[#1e1e1e] border-t border-[#3c3c3c] flex flex-col font-mono text-xs select-none">
      {/* VS Code Panel Tabs Header */}
      <div className="h-8 bg-[#252526] border-b border-[#3c3c3c] px-4 flex items-center justify-between font-sans text-xs text-[#cccccc]">
        <div className="flex items-center space-x-4">
          {[
            { id: 'problems', label: 'PROBLEMS', badge: 0 },
            { id: 'output', label: 'OUTPUT' },
            { id: 'debug', label: 'DEBUG CONSOLE' },
            { id: 'terminal', label: 'TERMINAL' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`h-full flex items-center space-x-1 border-b-2 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'border-[#007acc] text-white'
                    : 'border-transparent text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="bg-[#3c3c3c] text-white px-1.5 py-0.2 rounded-full text-[9px]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <button
            onClick={onRunTests}
            className="text-slate-300 hover:text-white px-2 py-0.5 rounded hover:bg-[#3c3c3c] flex items-center space-x-1"
            title="Run Test Suite"
          >
            <Play className="h-3 w-3 text-emerald-400 fill-current" />
            <span>Run Tests</span>
          </button>
          <button
            onClick={handleClear}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3c3c3c]"
            title="Clear Terminal Output"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Content Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-[#1e1e1e] text-[#cccccc]">
        {activeTab === 'problems' ? (
          <div className="flex items-center space-x-2 text-emerald-400 pt-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>No problems or diagnostics detected in workspace files.</span>
          </div>
        ) : (
          displayLogs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2 leading-relaxed">
              <span className="text-[#007acc] font-bold select-none">&gt;</span>
              <span className="break-all">{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
