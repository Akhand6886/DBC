'use client';

import React, { useState } from 'react';
import { RouterConfig } from '../lib/types';
import { Sliders, Zap, Check, X, ShieldCheck, Cpu } from 'lucide-react';

interface RouterConfigModalProps {
  config: RouterConfig;
  onSaveConfig: (newConfig: RouterConfig) => void;
  onClose: () => void;
}

export const RouterConfigModal: React.FC<RouterConfigModalProps> = ({
  config,
  onSaveConfig,
  onClose,
}) => {
  const [threshold, setThreshold] = useState(config.confidenceThreshold);
  const [enableLspRename, setEnableLspRename] = useState(config.enableLspRename);
  const [enableLspReferences, setEnableLspReferences] = useState(config.enableLspReferences);
  const [enableFormatter, setEnableFormatter] = useState(config.enableFormatter);
  const [enableTestRunner, setEnableTestRunner] = useState(config.enableTestRunner);
  const [enableTreeSitterRefactor, setEnableTreeSitterRefactor] = useState(config.enableTreeSitterRefactor);

  const handleSave = () => {
    onSaveConfig({
      confidenceThreshold: threshold,
      enableLspRename,
      enableLspReferences,
      enableFormatter,
      enableTestRunner,
      enableTreeSitterRefactor
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono text-xs select-none">
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3c3c3c] pb-3">
          <div className="flex items-center space-x-2 text-white font-sans font-bold">
            <Zap className="h-4 w-4 text-[#007acc]" />
            <span className="text-xs uppercase tracking-wider">Router Threshold & Fast-Path Rules</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-slate-200 font-bold flex items-center space-x-1.5 text-xs">
              <Sliders className="h-3.5 w-3.5 text-[#007acc]" />
              <span>Fast-Path Confidence Threshold:</span>
            </label>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {threshold}%
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full h-1.5 bg-[#2d2d2d] rounded appearance-none cursor-pointer accent-[#007acc]"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>50% (Aggressive Fast-Path)</span>
            <span>Default: 80%</span>
            <span>95% (Conservative)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Prompts with calculated confidence score <span className="text-white font-bold">&ge; {threshold}%</span> bypass LLMs, resolving in <span className="text-emerald-400">~3ms</span> at <span className="text-emerald-400">$0.00</span> cost.
          </p>
        </div>

        {/* Fast-Path Action Rules Toggles */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Deterministic Rule Toggles:</div>

          <div className="space-y-1.5">
            {[
              { label: 'LSP Symbol / Table Rename (textDocument/rename)', state: enableLspRename, setter: setEnableLspRename },
              { label: 'LSP Symbol References (textDocument/references)', state: enableLspReferences, setter: setEnableLspReferences },
              { label: 'Prettier / Biome / SQL Code Formatter', state: enableFormatter, setter: setEnableFormatter },
              { label: 'CLI Test Runner Integration', state: enableTestRunner, setter: setEnableTestRunner },
              { label: 'Tree-sitter AST Refactor Engine', state: enableTreeSitterRefactor, setter: setEnableTreeSitterRefactor }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-md px-3 py-2 flex items-center justify-between hover:border-slate-500 transition-colors">
                <span className="text-slate-300 text-[11px]">{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={(e) => item.setter(e.target.checked)}
                  className="h-4 w-4 text-[#007acc] accent-[#007acc] cursor-pointer rounded"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#3c3c3c]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3c3c3c] text-slate-300 rounded text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-[#007acc] hover:bg-[#0062a3] text-white rounded text-xs font-bold flex items-center space-x-1.5 transition-colors shadow"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
