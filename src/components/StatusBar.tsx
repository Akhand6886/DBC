'use client';

import React from 'react';
import { GitBranch, CheckCircle2, Cpu, Zap, Activity } from 'lucide-react';

interface StatusBarProps {
  lastLatencyMs?: number;
  lastRoutePath?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ lastLatencyMs, lastRoutePath }) => {
  return (
    <footer className="h-6 bg-ide-status text-white text-[11px] font-mono px-3 flex items-center justify-between border-t border-ide-border select-none z-30">
      {/* Left Indicators */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          <GitBranch className="h-3 w-3" />
          <span>main</span>
        </div>

        <div className="flex items-center space-x-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          <CheckCircle2 className="h-3 w-3 text-emerald-300" />
          <span>LSP: TS/Rust Active</span>
        </div>

        <div className="flex items-center space-x-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
          <Cpu className="h-3 w-3 text-orange-300" />
          <span>Rust Sidecar Index: Ready</span>
        </div>
      </div>

      {/* Right Indicators */}
      <div className="flex items-center space-x-4">
        {lastLatencyMs !== undefined && (
          <div className="flex items-center space-x-1 bg-black/20 px-2 py-0.5 rounded">
            <Zap className="h-3 w-3 text-yellow-300" />
            <span>{lastRoutePath === 'DETERMINISTIC_FAST_PATH' ? 'Fast-Path' : 'LLM'}: {lastLatencyMs}ms</span>
          </div>
        )}
        <span>UTF-8</span>
        <span>TypeScript 5.6</span>
      </div>
    </footer>
  );
};
