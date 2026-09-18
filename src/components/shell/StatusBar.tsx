'use client';

import React from 'react';
import { GitBranch, Zap, CheckCircle2, AlertCircle, ShieldCheck, Database, Bell, Cpu, Bot } from 'lucide-react';

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
      {/* Left Status Section: Exact Vision Pattern */}
      <div className="flex items-center space-x-2 sm:space-x-3 truncate">
        {/* Agent Connection & Health Status */}
        <div className="flex items-center space-x-1.5 font-medium shrink-0">
          <Bot className="h-3.5 w-3.5 text-yellow-300" />
          <span>Agent: Connected to <strong>PostgreSQL</strong></span>
        </div>

        <span className="text-blue-200">•</span>

        {/* Query Cost */}
        <div className="flex items-center space-x-1 text-blue-100 shrink-0">
          <span>Query cost:</span>
          <strong className="text-emerald-200">Low</strong>
        </div>

        <span className="text-blue-200">•</span>

        {/* Safety Indicator */}
        <div className="flex items-center space-x-1 text-emerald-200 font-bold shrink-0">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
          <span>Safe ✓</span>
        </div>

        <span className="text-blue-200 hidden md:inline">•</span>

        {/* Router Mode Indicator / Interactive Trigger */}
        <button
          onClick={onOpenRouterTrace || onOpenRouterConfig}
          title="Click to inspect Router rules & confidence score"
          className="hidden md:flex items-center space-x-1 font-mono text-[10px] bg-[#005a9e] hover:bg-[#004a80] px-1.5 sm:px-2 py-0.5 rounded transition-colors shrink-0"
        >
          {lastLatencyMs !== undefined ? (
            isFast ? (
              <>
                <Zap className="h-3 w-3 text-yellow-300 fill-current" />
                <span>Deterministic ({lastLatencyMs}ms)</span>
              </>
            ) : (
              <>
                <Cpu className="h-3 w-3 text-amber-300" />
                <span>AI Agent ({lastLatencyMs}ms)</span>
              </>
            )
          ) : (
            <>
              <Zap className="h-3 w-3 text-yellow-300/80" />
              <span>Router: Deterministic (99%)</span>
            </>
          )}
        </button>
      </div>

      {/* Right Status Section */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] shrink-0">
        <span className="hidden md:inline">UTF-8</span>
        <span className="hidden md:inline">SQL (PostgreSQL)</span>
        <button
          onClick={onOpenSidecar}
          className="hover:bg-[#005a9e] px-1.5 py-0.5 rounded flex items-center space-x-1 text-blue-100"
          title="Guardrail Engine Active"
        >
          <ShieldCheck className="h-3 w-3 text-emerald-200" />
          <span className="hidden sm:inline">Guardrail Engine</span>
        </button>
        <Bell className="h-3 w-3 cursor-pointer hover:opacity-80" />
      </div>
    </div>
  );
};
