'use client';

import React, { useState } from 'react';
import { RouterConfig } from '../lib/types';
import { Sliders, Zap, Check, X, ShieldCheck } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="font-bold uppercase tracking-wider text-xs">Router Rules & Threshold Configuration</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="bg-ide-bg border border-ide-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-slate-200 font-bold flex items-center space-x-1.5">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <span>Fast-Path Confidence Threshold:</span>
            </label>
            <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              {threshold}%
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={95}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full h-2 bg-ide-card rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <p className="text-[11px] text-slate-400">
            Requests with calculated confidence score $\ge {threshold}\%$ route directly to the Fast Path without calling the LLM.
          </p>
        </div>

        {/* Fast-Path Action Rules Toggles */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-slate-300 uppercase">Fast-Path Action Toggles:</div>

          <div className="space-y-2">
            {[
              { label: 'LSP Symbol Rename (textDocument/rename)', state: enableLspRename, setter: setEnableLspRename },
              { label: 'LSP Symbol References (textDocument/references)', state: enableLspReferences, setter: setEnableLspReferences },
              { label: 'Prettier / Biome Code Formatter', state: enableFormatter, setter: setEnableFormatter },
              { label: 'CLI Test Runner Integration', state: enableTestRunner, setter: setEnableTestRunner },
              { label: 'Tree-sitter AST Refactor Engine', state: enableTreeSitterRefactor, setter: setEnableTreeSitterRefactor }
            ].map((item, idx) => (
              <div key={idx} className="bg-ide-bg border border-ide-border rounded-lg p-2.5 flex items-center justify-between">
                <span className="text-slate-300 text-xs">{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={(e) => item.setter(e.target.checked)}
                  className="h-4 w-4 text-emerald-400 accent-emerald-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-ide-border">
          <button onClick={onClose} className="px-4 py-2 bg-ide-card hover:bg-ide-border text-slate-300 rounded-lg font-semibold">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow">
            <Check className="h-4 w-4" />
            <span>Save Router Config</span>
          </button>
        </div>
      </div>
    </div>
  );
};
