'use client';

import React from 'react';
import { GitBranch, Zap, CheckCircle2, AlertCircle, ShieldCheck, Database, Bell, Cpu } from 'lucide-react';

interface StatusBarProps {
  lastLatencyMs?: number;
  lastRoutePath?: string;
  onOpenSidecar: () => void;
  onOpenGit?: () => void;
  onOpenRouterTrace?: () => void;
  onOpenRouterConfig?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  lastLatencyMs,
  lastRoutePath,
  onOpenSidecar,
  onOpenGit,
  onOpenRouterTrace,
  onOpenRouterConfig,
}) => {
  const isFast = lastRoutePath === 'DETERMINISTIC_FAST_PATH';

  return (
    <div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-[11px] font-sans select-none border-t border-[#005a9e]">
      {/* Left Status Section */}
      <div className="flex items-center space-x-2 sm:space-x-3 truncate">
        {/* Remote Host Badge */}
        <div className="bg-[#005a9e] px-1.5 sm:px-2 py-0.5 font-bold flex items-center space-x-1 shrink-0">
          <Database className="h-3 w-3" />
          <span className="hidden sm:inline">DBC: Local Engine</span>
          <span className="sm:hidden">DBC</span>
        </div>

        {/* Git Branch Click Trigger */}
        <button
          onClick={onOpenGit}
          className="flex items-center space-x-1 hover:bg-[#005a9e] px-1.5 py-0.5 rounded cursor-pointer transition-colors shrink-0"
          title="Open Source Control Panel"
        >
          <GitBranch className="h-3 w-3" />
          <span>main*</span>
        </button>

        {/* Diagnostics Errors / Warnings */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <span className="flex items-center space-x-0.5">
            <AlertCircle className="h-3 w-3 text-amber-200" />
            <span>0</span>
          </span>
          <span className="flex items-center space-x-0.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-200" />
            <span>0</span>
          </span>
        </div>

        {/* Router Mode Indicator / Interactive Trigger */}
        <button
          onClick={onOpenRouterTrace || onOpenRouterConfig}
          title="Click to inspect Router rules & confidence score"
          className="flex items-center space-x-1 font-mono text-[10px] bg-[#005a9e] hover:bg-[#004a80] px-1.5 sm:px-2 py-0.5 rounded transition-colors shrink-0"
        >
          {lastLatencyMs !== undefined ? (
            isFast ? (
              <>
                <Zap className="h-3 w-3 text-yellow-300 fill-current" />
                <span>Fast-Path ({lastLatencyMs}ms)</span>
              </>
            ) : (
              <>
                <Cpu className="h-3 w-3 text-amber-300" />
                <span>LLM ({lastLatencyMs}ms)</span>
              </>
            )
          ) : (
            <>
              <Zap className="h-3 w-3 text-yellow-300/80" />
              <span>Router: Ready</span>
            </>
          )}
        </button>
      </div>

      {/* Right Status Section */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] shrink-0">
        <span className="hidden md:inline">UTF-8</span>
        <span className="hidden md:inline">LF</span>
        <span className="hidden lg:inline">TypeScript</span>
        <button
          onClick={onOpenSidecar}
          className="hover:bg-[#005a9e] px-1.5 py-0.5 rounded flex items-center space-x-1"
        >
          <ShieldCheck className="h-3 w-3 text-emerald-200" />
          <span className="hidden sm:inline">LanceDB Active</span>
        </button>
        <Bell className="h-3 w-3 cursor-pointer hover:opacity-80" />
      </div>
    </div>
  );
};
