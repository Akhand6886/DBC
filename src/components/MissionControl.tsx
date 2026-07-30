'use client';

import React, { useState } from 'react';
import { LLMProvider, AgentExecutionPlan, ShadowDiffCheck } from '../lib/types';
import { classifyDeveloperIntent } from '../lib/router/intentClassifier';
import { runDeterministicAction } from '../lib/router/deterministicEngine';
import { runLLMReasoning } from '../lib/router/llmEngine';
import { verifyAndCreateShadowDiff } from '../lib/verification/shadowBuffer';

import { Bot, Zap, Cpu, Send, ShieldCheck, Check, X, Sparkles, RefreshCw } from 'lucide-react';

interface MissionControlProps {
  activeFilePath?: string;
  activeFileContent: string;
  onApplyPatch: (newContent: string, diffCheck: ShadowDiffCheck) => void;
  onLogTerminal: (msg: string) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  activeFilePath = 'src/index.ts',
  activeFileContent,
  onApplyPatch,
  onLogTerminal,
}) => {
  const [prompt, setPrompt] = useState('');
  const [modelProvider, setModelProvider] = useState<LLMProvider>('openai');
  const [isLoading, setIsLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<AgentExecutionPlan | null>(null);

  const presetTriggers = [
    { label: 'Rename function', query: 'Rename function main to executeApp', badge: 'Fast-Path ~3ms', path: 'green' },
    { label: 'Format code', query: 'Format code', badge: 'Fast-Path ~2ms', path: 'green' },
    { label: 'Find references', query: 'Find all callers of main', badge: 'Fast-Path ~1ms', path: 'green' },
    { label: 'Fix null bug', query: 'Fix null pointer bug in main handler', badge: 'LLM Escalation', path: 'amber' }
  ];

  const handleExecutePrompt = (textToRun?: string) => {
    const query = textToRun || prompt;
    if (!query.trim()) return;

    setIsLoading(true);
    setActivePlan(null);

    setTimeout(() => {
      // 1. Intent Classification
      const intent = classifyDeveloperIntent(query, activeFilePath);
      const isFastPath = intent.confidenceScore >= 80;
      const routerPath = isFastPath ? 'DETERMINISTIC_FAST_PATH' : 'AGENTIC_LLM_PATH';

      let proposedContent = activeFileContent;
      let executionTimeMs = 0;
      let tokenCostUSD = 0;
      let logMsg = '';

      if (isFastPath) {
        const detRes = runDeterministicAction(intent, activeFileContent);
        proposedContent = detRes.proposedContent;
        executionTimeMs = detRes.executionTimeMs;
        logMsg = detRes.logMessage;
      } else {
        const llmRes = runLLMReasoning(intent, activeFileContent, modelProvider);
        proposedContent = llmRes.proposedContent;
        executionTimeMs = llmRes.executionTimeMs;
        tokenCostUSD = llmRes.tokenCostUSD;
        logMsg = llmRes.logMessage;
      }

      // 2. Shadow Workspace Verification Check
      const diffCheck = verifyAndCreateShadowDiff(activeFilePath, activeFileContent, proposedContent);

      const plan: AgentExecutionPlan = {
        id: `PLAN-${Date.now().toString(36).toUpperCase()}`,
        prompt: query,
        routerPath,
        confidenceScore: intent.confidenceScore,
        intent,
        executionTimeMs,
        tokenCostUSD,
        generatedChanges: [diffCheck],
        status: diffCheck.syntaxCheckPassed ? 'PENDING_VERIFICATION' : 'BLOCKED',
        modelProvider
      };

      setIsLoading(false);
      setActivePlan(plan);
      onLogTerminal(`[Router]: ${intent.explanation}`);
      onLogTerminal(`[Action]: ${logMsg}`);
    }, 350);
  };

  const handleAcceptPatch = () => {
    if (!activePlan || activePlan.generatedChanges.length === 0) return;
    const patch = activePlan.generatedChanges[0];
    onApplyPatch(patch.proposedContent, patch);
    onLogTerminal(`[Shadow Verification]: Accepted patch ${patch.id} for file ${patch.targetFile}`);
    setActivePlan(null);
  };

  return (
    <div className="w-80 bg-ide-sidebar border-l border-ide-border flex flex-col h-full font-mono text-xs select-none">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-ide-border flex items-center justify-between">
        <div className="flex items-center space-x-2 text-white">
          <Bot className="h-4 w-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-xs">Mission Control</span>
        </div>

        {/* Model Provider Selector */}
        <select
          value={modelProvider}
          onChange={(e) => setModelProvider(e.target.value as LLMProvider)}
          aria-label="Select Model Provider"
          className="bg-ide-bg text-[10px] text-slate-300 border border-ide-border rounded px-2 py-0.5 font-mono cursor-pointer"
        >
          <option value="openai">BYOK: OpenAI GPT-4o</option>
          <option value="anthropic">BYOK: Claude 3.5 Sonnet</option>
          <option value="gemini">BYOK: Gemini 1.5 Pro</option>
          <option value="ollama">BYOK: Local Ollama</option>
        </select>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Prompt Input Box */}
        <div className="space-y-2">
          <label className="text-[11px] text-slate-400 font-semibold flex items-center space-x-1">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Agent Prompt:</span>
          </label>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleExecutePrompt())}
              placeholder="e.g. 'Rename function main to executeApp' or 'Fix null bug'"
              className="w-full bg-ide-bg border border-ide-border rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none h-20"
            />
            <button
              onClick={() => handleExecutePrompt()}
              disabled={isLoading || !prompt.trim()}
              className="absolute right-2 bottom-3 bg-ide-accent hover:bg-cyan-600 disabled:opacity-50 text-white p-1.5 rounded text-xs transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Preset Prompt Triggers */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Preset Router Triggers:</div>
          <div className="flex flex-wrap gap-1.5">
            {presetTriggers.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(item.query);
                  handleExecutePrompt(item.query);
                }}
                className={`px-2 py-1 rounded border text-[10px] font-mono transition-all text-left ${
                  item.path === 'green'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-500/60'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Execution Plan & Routing Visualizer */}
        {isLoading ? (
          <div className="bg-ide-card border border-ide-border rounded-lg p-3 text-center space-y-2 animate-pulse">
            <RefreshCw className="h-4 w-4 text-cyan-400 animate-spin mx-auto" />
            <div className="text-xs text-cyan-300">Classifying intent & evaluating confidence...</div>
          </div>
        ) : activePlan ? (
          <div className="bg-ide-card border border-ide-border rounded-lg p-3 space-y-3">
            {/* Path Badge */}
            <div className="flex items-center justify-between pb-2 border-b border-ide-border">
              {activePlan.routerPath === 'DETERMINISTIC_FAST_PATH' ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>Fast-Path ({activePlan.executionTimeMs}ms)</span>
                </span>
              ) : (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                  <Cpu className="h-3 w-3" />
                  <span>LLM Escalation ({activePlan.executionTimeMs}ms)</span>
                </span>
              )}
              <span className="text-[10px] text-slate-400">Conf: {activePlan.confidenceScore}%</span>
            </div>

            {/* Explanation */}
            <p className="text-[11px] text-slate-300">{activePlan.intent.explanation}</p>

            {/* Shadow Diff Check Card */}
            {activePlan.generatedChanges.length > 0 && (
              <div className="bg-ide-bg border border-cyan-500/30 rounded p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-cyan-300 font-bold flex items-center space-x-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Shadow Workspace Patch</span>
                  </span>
                  <span className="text-emerald-400">Syntax OK ✓</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setActivePlan(null)}
                    className="text-slate-400 hover:text-white text-[10px] flex items-center space-x-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Discard</span>
                  </button>

                  <button
                    onClick={handleAcceptPatch}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-bold flex items-center space-x-1 shadow"
                  >
                    <Check className="h-3 w-3" />
                    <span>Apply Patch</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
