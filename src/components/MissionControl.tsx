'use client';

import React, { useState } from 'react';
import { LLMProvider, ShadowDiffCheck } from '../lib/types';
import { Bot, Send, Sparkles, Sliders, ChevronDown, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

interface MissionControlProps {
  activeFilePath?: string;
  activeFileContent?: string;
  onApplyPatch: (newContent: string, diffCheck: ShadowDiffCheck) => void;
  onLogTerminal?: (msg: string) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  activeFilePath,
  activeFileContent = '',
  onApplyPatch,
  onLogTerminal,
}) => {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<LLMProvider>('anthropic');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);

    if (onLogTerminal) {
      onLogTerminal(`[Mission Control AI]: Dispatching prompt to model provider '${provider.toUpperCase()}'.`);
    }

    setTimeout(() => {
      setIsProcessing(false);
      const patchId = `patch-${Date.now().toString(36)}`;
      const proposed = activeFileContent
        ? `${activeFileContent}\n\n// AI Optimized SQL / TypeScript Function (${provider})\n// ${prompt}`
        : `-- AI Generated SQL Query (${provider})\nSELECT * FROM users;\n`;

      const diffCheck: ShadowDiffCheck = {
        id: patchId,
        timestamp: new Date().toLocaleTimeString(),
        targetFile: activeFilePath || 'queries/users_report.sql',
        originalContent: activeFileContent,
        proposedContent: proposed,
        patchDiff: `+ // ${prompt}`,
        syntaxCheckPassed: true,
        lspDiagnosticsCount: 0,
        requiresUserApproval: true,
        status: 'PENDING'
      };

      onApplyPatch(proposed, diffCheck);
      setPrompt('');
    }, 400);
  };

  return (
    <div className="w-80 bg-[#252526] border-l border-[#3c3c3c] flex flex-col h-full font-mono text-xs select-none">
      {/* Panel Header */}
      <div className="px-3 py-2.5 border-b border-[#3c3c3c] flex items-center justify-between bg-[#2d2d2d]">
        <div className="flex items-center space-x-2 text-white font-sans font-bold text-xs">
          <Bot className="h-4 w-4 text-[#007acc]" />
          <span>Mission Control AI</span>
        </div>

        {/* Model Provider Selector */}
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LLMProvider)}
          className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 text-[10px] text-[#cccccc] focus:outline-none focus:border-[#007acc]"
        >
          <option value="anthropic">Claude 3.5 Sonnet</option>
          <option value="openai">GPT-4o</option>
          <option value="gemini">Gemini 1.5 Pro</option>
          <option value="ollama">Ollama (Offline Llama3)</option>
        </select>
      </div>

      {/* Quick Prompt Recommendations */}
      <div className="p-3 border-b border-[#3c3c3c] space-y-1.5 bg-[#1e1e1e]/40">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DBMS AI Triggers:</span>
        <div className="flex flex-wrap gap-1">
          {[
            'Optimize Query JOINs',
            'Generate Audit Trigger',
            'Create Migration Script',
            'Fix Slow Scan'
          ].map((q, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(q)}
              className="text-[10px] bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#3c3c3c] text-slate-300 px-2 py-1 rounded transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Main Prompt Input Area */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 uppercase font-bold">Natural Language Prompt:</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI to write SQL queries, optimize indexes, or generate database migrations..."
            className="w-full h-40 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#007acc] resize-none font-mono"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isProcessing || !prompt.trim()}
          className="w-full bg-[#007acc] hover:bg-[#005a9e] disabled:opacity-40 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow"
        >
          {isProcessing ? (
            <Sparkles className="h-4 w-4 animate-spin text-yellow-300" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{isProcessing ? 'Agent Reasoning...' : 'Dispatch AI Agent'}</span>
        </button>
      </div>
    </div>
  );
};
