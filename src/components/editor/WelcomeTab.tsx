'use client';

import React from 'react';
import { Bot, Zap, ShieldCheck, Cpu, Globe, Key, FileCode, Terminal, GitBranch, Sparkles, Command, Keyboard } from 'lucide-react';

interface WelcomeTabProps {
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenGit: () => void;
  onOpenBrowser: () => void;
  onDismiss: () => void;
}

export const WelcomeTab: React.FC<WelcomeTabProps> = ({
  onOpenSettings,
  onOpenSearch,
  onOpenGit,
  onOpenBrowser,
  onDismiss,
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-ide-bg p-8 font-mono">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-3 pb-4 border-b border-ide-border">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 mx-auto">
            <Bot className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Agentic AI IDE</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Ultra-fast, developer-first coding environment with a Confidence-Scored Dual-Path Router, Shadow Workspace Verification, and BYOK Model Support.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Core Capabilities</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Zap className="h-5 w-5 text-emerald-400" />, title: 'Dual-Path Router', desc: 'Sub-3ms Fast-Path for structural edits, LLM escalation for complex reasoning.' },
              { icon: <ShieldCheck className="h-5 w-5 text-cyan-400" />, title: 'Shadow Verification', desc: 'Pre-execution diff checks with 1-click rollback snapshots.' },
              { icon: <Cpu className="h-5 w-5 text-orange-400" />, title: 'Rust Sidecar Indexer', desc: 'Tree-sitter AST parsing with LanceDB vector semantic search.' },
              { icon: <Globe className="h-5 w-5 text-purple-400" />, title: 'Browser-in-the-Loop', desc: 'Playwright CDP visual verification with viewport testing.' },
            ].map((feat, idx) => (
              <div key={idx} className="bg-ide-sidebar border border-ide-border rounded-xl p-4 space-y-2 hover:border-ide-accent/40 transition-colors">
                {feat.icon}
                <h3 className="text-xs font-bold text-white">{feat.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start Actions */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Start</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenSettings}
              className="bg-ide-card border border-ide-border rounded-lg p-3 flex items-center space-x-3 text-left hover:border-cyan-500/40 transition-colors group"
            >
              <Key className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-white">Configure API Keys</div>
                <div className="text-[10px] text-slate-500">OpenAI, Anthropic, Gemini, Ollama</div>
              </div>
            </button>

            <button
              onClick={onOpenSearch}
              className="bg-ide-card border border-ide-border rounded-lg p-3 flex items-center space-x-3 text-left hover:border-cyan-500/40 transition-colors group"
            >
              <FileCode className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-white">Search Workspace</div>
                <div className="text-[10px] text-slate-500">Ctrl+Shift+F</div>
              </div>
            </button>

            <button
              onClick={onOpenGit}
              className="bg-ide-card border border-ide-border rounded-lg p-3 flex items-center space-x-3 text-left hover:border-cyan-500/40 transition-colors group"
            >
              <GitBranch className="h-5 w-5 text-orange-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-white">Git Source Control</div>
                <div className="text-[10px] text-slate-500">Ctrl+Shift+G</div>
              </div>
            </button>

            <button
              onClick={onOpenBrowser}
              className="bg-ide-card border border-ide-border rounded-lg p-3 flex items-center space-x-3 text-left hover:border-cyan-500/40 transition-colors group"
            >
              <Globe className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-white">Browser Preview</div>
                <div className="text-[10px] text-slate-500">Visual verification loop</div>
              </div>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Cheatsheet */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Keyboard className="h-3.5 w-3.5" />
            <span>Keyboard Shortcuts</span>
          </h2>
          <div className="bg-ide-sidebar border border-ide-border rounded-xl p-4">
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-[11px]">
              {[
                { keys: '⌘+Shift+P', action: 'Command Palette' },
                { keys: '⌘+Shift+F', action: 'Global Search' },
                { keys: '⌘+Shift+G', action: 'Git Source Control' },
                { keys: '⌘+,', action: 'Open Settings' },
                { keys: '⌘+B', action: 'Toggle Sidebar' },
                { keys: '⌘+J', action: 'Toggle Terminal' },
                { keys: '⌘+S', action: 'Save File' },
                { keys: '⌘+W', action: 'Close Active Tab' },
              ].map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-300">{shortcut.action}</span>
                  <kbd className="text-[10px] text-slate-500 bg-ide-bg border border-ide-border px-2 py-0.5 rounded font-mono">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dismiss */}
        <div className="text-center pt-2">
          <button
            onClick={onDismiss}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Close this tab and start coding →
          </button>
        </div>
      </div>
    </div>
  );
};
