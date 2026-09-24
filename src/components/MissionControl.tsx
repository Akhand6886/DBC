'use client';

import React, { useState, useMemo } from 'react';
import {
  LLMProvider,
  ShadowDiffCheck,
  RouterConfig,
  AgentExecutionPlan
} from '../lib/types';
import { previewDeveloperIntent, executeRoutedPrompt } from '../lib/router/routerEngine';
import { DEFAULT_ROUTER_CONFIG } from '../lib/router/intentClassifier';
import {
  Bot,
  Send,
  Sparkles,
  Sliders,
  Zap,
  Cpu,
  Clock,
  DollarSign,
  FileCode,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface MissionControlProps {
  activeFilePath?: string;
  activeFileContent?: string;
  routerConfig?: RouterConfig;
  lastExecutionPlan?: AgentExecutionPlan | null;
  onApplyPatch: (newContent: string, diffCheck: ShadowDiffCheck) => void;
  onExecutePlan?: (plan: AgentExecutionPlan) => void;
  onOpenRouterConfig?: () => void;
  onOpenRouterTrace?: () => void;
  onLogTerminal?: (msg: string) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  activeFilePath,
  activeFileContent = '',
  routerConfig = DEFAULT_ROUTER_CONFIG,
  lastExecutionPlan = null,
  onApplyPatch,
  onExecutePlan,
  onOpenRouterConfig,
  onOpenRouterTrace,
  onLogTerminal,
}) => {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [isProcessing, setIsProcessing] = useState(false);

  // Real-time confidence preview as developer types
  const routePreview = useMemo(() => {
    if (!prompt.trim()) return null;
    return previewDeveloperIntent(prompt, activeFilePath, routerConfig);
  }, [prompt, activeFilePath, routerConfig]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);

    const isFast = routePreview?.isFastPath ?? true;
    const simDelay = isFast ? 80 : 650; // realistic async feel

    setTimeout(() => {
      setIsProcessing(false);

      const result = executeRoutedPrompt({
        prompt,
        targetFilePath: activeFilePath,
        currentContent: activeFileContent,
        provider,
        config: routerConfig
      });

      if (onLogTerminal) {
        onLogTerminal(result.logMessage);
      }

      if (onExecutePlan) {
        onExecutePlan(result.plan);
      }

      onApplyPatch(result.proposedContent, result.diffCheck);
      setPrompt('');
    }, simDelay);
  };

  return (
    <div className="w-80 bg-[#252526] border-l border-[#3c3c3c] flex flex-col h-full font-mono text-xs select-none">
      {/* Panel Header */}
      <div className="px-3 py-2 border-b border-[#3c3c3c] flex items-center justify-between bg-[#2d2d2d]">
        <div className="flex items-center space-x-2 text-white font-sans font-bold text-xs">
          <Bot className="h-4 w-4 text-[#007acc]" />
          <span>Mission Control AI</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {lastExecutionPlan && (
            <button
              onClick={onOpenRouterTrace}
              title="Inspect Last Router Execution Trace"
              className="p-1 hover:bg-[#3c3c3c] rounded text-[#007acc] hover:text-white transition-colors"
            >
              <FileCode className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={onOpenRouterConfig}
            title="Configure Confidence Thresholds & Rules"
            className="p-1 hover:bg-[#3c3c3c] rounded text-slate-400 hover:text-white transition-colors"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>

          {/* Model Provider Selector */}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as LLMProvider)}
            className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-[10px] text-[#cccccc] focus:outline-none focus:border-[#007acc]"
          >
            <option value="anthropic">Claude 3.5</option>
            <option value="openai">GPT-4o</option>
            <option value="gemini">Gemini 1.5</option>
            <option value="ollama">Ollama (Offline)</option>
          </select>
        </div>
      </div>

      {/* Quick Prompt Recommendations */}
      <div className="p-2.5 border-b border-[#3c3c3c] space-y-1.5 bg-[#1e1e1e]/40">
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Quick Intent Triggers:</span>
          <span className="text-[9px] text-[#007acc]">Dual-Path</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            { label: 'Rename users table', q: 'rename table users to app_users' },
            { label: 'Format SQL', q: 'format sql query' },
            { label: 'Run Test Suite', q: 'run test suite' },
            { label: 'Extract View', q: 'extract function getUserAuditView' },
            { label: 'Optimize Slow Scan', q: 'implement index to fix slow query scan on users' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(item.q)}
              className="text-[10px] bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#3c3c3c] text-slate-300 px-1.5 py-0.5 rounded transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Confidence Meter Preview */}
      <div className="px-3 py-2 border-b border-[#3c3c3c] bg-[#1e1e1e]/80">
        {routePreview ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-bold">Confidence Gauge:</span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  routePreview.isFastPath
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                }`}
              >
                {routePreview.intent.confidenceScore}% (Thresh: {routerConfig.confidenceThreshold}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#2d2d2d] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  routePreview.isFastPath ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${routePreview.intent.confidenceScore}%` }}
              />
            </div>

            {/* Route decision tag */}
            <div className="flex items-center justify-between text-[10px] text-slate-300 pt-0.5">
              <div className="flex items-center space-x-1">
                {routePreview.isFastPath ? (
                  <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                    <Zap className="h-3 w-3" />
                    <span>⚡ Deterministic Fast-Path</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center space-x-1 font-bold">
                    <Cpu className="h-3 w-3" />
                    <span>🧠 LLM Escalation</span>
                  </span>
                )}
              </div>
              <span className="text-slate-400">
                ~{routePreview.estimatedLatencyMs}ms | ${routePreview.estimatedCostUSD.toFixed(4)}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 truncate">
              {routePreview.intent.explanation}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] text-slate-400 py-1">
            <div className="flex items-center space-x-1">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span>Fast-Path: ~3ms ($0.00)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Cpu className="h-3 w-3 text-amber-400" />
              <span>LLM: ~840ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Prompt Input Area */}
      <div className="flex-1 p-3 flex flex-col justify-between space-y-2">
        <div className="flex-1 flex flex-col space-y-1.5">
          <label className="text-[10px] text-slate-400 uppercase font-bold">
            Prompt / Action Description:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type a code or SQL action (e.g. 'rename variable', 'format query', 'implement audit trigger')..."
            className="w-full flex-1 min-h-[140px] bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#007acc] resize-none font-mono"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isProcessing || !prompt.trim()}
          className="w-full bg-[#007acc] hover:bg-[#0062a3] disabled:opacity-40 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow active:scale-[0.99]"
        >
          {isProcessing ? (
            <Sparkles className="h-4 w-4 animate-spin text-yellow-300" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>
            {isProcessing
              ? 'Routing Execution...'
              : routePreview?.isFastPath
              ? 'Execute via Fast-Path (⚡ ~3ms)'
              : 'Dispatch to Agentic LLM (🧠)'}
          </span>
        </button>
      </div>
    </div>
  );
};
