'use client';

import React from 'react';
import { GitBranch, Zap, CheckCircle2, AlertCircle, ShieldCheck, Database, Bell } from 'lucide-react';

interface StatusBarProps {
  lastLatencyMs?: number;
  lastRoutePath?: string;
  onOpenSidecar: () => void;
  onOpenGit?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  lastLatencyMs = 3,
  lastRoutePath = 'DETERMINISTIC_FAST_PATH',
  onOpenSidecar,
  onOpenGit,
}) => {
  return (
    <div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-[11px] font-sans select-none border-t border-[#005a9e]">
      {/* Left Status Section */}
      <div className="flex items-center space-x-3">
        {/* Remote Host Badge */}
        <div className="bg-[#005a9e] px-2 py-0.5 font-bold flex items-center space-x-1">
          <Database className="h-3 w-3" />
          <span>DBC: Local Engine</span>
        </div>

        {/* Git Branch Click Trigger */}
        <button
          onClick={onOpenGit}
          className="flex items-center space-x-1 hover:bg-[#005a9e] px-1.5 py-0.5 rounded cursor-pointer transition-colors"
          title="Open Source Control Panel"
        >
          <GitBranch className="h-3 w-3" />
          <span>main*</span>
        </button>

        {/* Diagnostics Errors / Warnings */}
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-0.5">
            <AlertCircle className="h-3 w-3 text-amber-200" />
            <span>0</span>
          </span>
          <span className="flex items-center space-x-0.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-200" />
            <span>0</span>
          </span>
        </div>

        {/* Router Mode */}
        <div className="flex items-center space-x-1 font-mono text-[10px] bg-[#005a9e] px-2 py-0.5 rounded">
          <Zap className="h-3 w-3 text-yellow-300 fill-current" />
          <span>Fast-Path ({lastLatencyMs}ms)</span>
        </div>
      </div>

      {/* Right Status Section */}
      <div className="flex items-center space-x-3 text-[10px]">
        <span>UTF-8</span>
        <span>LF</span>
        <span>TypeScript</span>
        <button
          onClick={onOpenSidecar}
          className="hover:bg-[#005a9e] px-1.5 py-0.5 rounded flex items-center space-x-1"
        >
          <ShieldCheck className="h-3 w-3 text-emerald-200" />
          <span>LanceDB Active</span>
        </button>
        <Bell className="h-3 w-3 cursor-pointer hover:opacity-80" />
      </div>
    </div>
  );
};
