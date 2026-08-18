'use client';

import React, { useState } from 'react';
import { Settings, Key, Sliders, Palette, X, Check, Save } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onSaveSettings: (settings: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSaveSettings }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'themes' | 'byok'>('byok');
  
  // Settings Form State
  const [theme, setTheme] = useState('vscode-dark');
  const [fontSize, setFontSize] = useState(13);
  const [tabSize, setTabSize] = useState(2);
  const [autoSave, setAutoSave] = useState(true);

  // BYOK Keys State
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');

  const [savedNotification, setSavedNotification] = useState(false);

  const handleSave = () => {
    onSaveSettings({
      theme,
      fontSize,
      tabSize,
      autoSave,
      keys: {
        openai: openaiKey,
        anthropic: anthropicKey,
        gemini: geminiKey,
        ollama: ollamaUrl
      }
    });
    setSavedNotification(true);
    setTimeout(() => {
      setSavedNotification(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Settings className="h-4 w-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-xs">IDE Settings & BYOK Manager</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Sub-tabs */}
        <div className="bg-ide-bg border border-ide-border rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setActiveTab('byok')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'byok' ? 'bg-ide-accent text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>BYOK API Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'editor' ? 'bg-ide-accent text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Editor Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'themes' ? 'bg-ide-accent text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Themes</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'byok' && (
          <div className="space-y-4">
            <p className="text-[11px] text-slate-400">
              Bring Your Own Key (BYOK) configurations for model providers. API keys remain stored locally in memory.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-bold">OpenAI API Key (GPT-4o):</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-ide-bg border border-ide-border rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-bold">Anthropic API Key (Claude 3.5 Sonnet):</label>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full bg-ide-bg border border-ide-border rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-bold">Google Gemini API Key (Gemini 1.5 Pro):</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-ide-bg border border-ide-border rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-bold">Local Ollama Endpoint URL:</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full bg-ide-bg border border-ide-border rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold">Font Size (px):</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  min={11}
                  max={20}
                  className="w-20 bg-ide-bg border border-ide-border rounded p-1.5 text-center text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold">Tab Indent Size:</label>
                <select
                  value={tabSize}
                  onChange={(e) => setTabSize(Number(e.target.value))}
                  aria-label="Tab Indent Size"
                  className="bg-ide-bg border border-ide-border rounded p-1.5 text-xs text-slate-100"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-slate-300 font-bold">Auto-Save Shadow Buffers:</label>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="h-4 w-4 cursor-pointer text-cyan-500 accent-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'themes' && (
          <div className="space-y-3">
            <label className="text-slate-300 font-bold">Select Active IDE Theme:</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'vscode-dark', name: 'VS Code Dark Default', color: 'bg-[#1e1e1e]' },
                { id: 'monokai', name: 'Monokai Pro', color: 'bg-[#272822]' },
                { id: 'onedark', name: 'One Dark Pro', color: 'bg-[#282c34]' },
                { id: 'cyberpunk', name: 'Cyberpunk Cyan', color: 'bg-[#0d1117]' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTheme(item.id)}
                  className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                    theme === item.id ? 'border-cyan-500 bg-cyan-500/10 text-white' : 'border-ide-border bg-ide-bg text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`h-4 w-4 rounded-full border border-slate-600 ${item.color}`}></div>
                    <span className="font-semibold text-xs">{item.name}</span>
                  </div>
                  {theme === item.id && <Check className="h-4 w-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-ide-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-ide-card hover:bg-ide-border text-slate-300 rounded-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-ide-accent hover:bg-cyan-600 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow"
          >
            {savedNotification ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
