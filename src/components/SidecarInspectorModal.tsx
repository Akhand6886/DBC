'use client';

import React, { useState } from 'react';
import { rustSidecar, SymbolLocation } from '../lib/sidecar/astIndexer';
import { Cpu, Search, FileCode, ArrowRight, X, Layers, Database, Sparkles } from 'lucide-react';

interface SidecarInspectorModalProps {
  onJumpToSymbol: (filePath: string, line: number) => void;
  onClose: () => void;
}

export const SidecarInspectorModal: React.FC<SidecarInspectorModalProps> = ({
  onJumpToSymbol,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'symbols' | 'vector'>('symbols');
  const [symbolQuery, setSymbolQuery] = useState('');
  const [vectorQuery, setVectorQuery] = useState('');

  const stats = rustSidecar.getIndexStats();
  const allSymbols = symbolQuery.trim() ? rustSidecar.searchSymbols(symbolQuery) : rustSidecar.getAllSymbols();
  const vectorMatches = vectorQuery.trim() ? rustSidecar.searchSemanticEmbeddings(vectorQuery) : rustSidecar.getAllSymbols();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Cpu className="h-5 w-5 text-orange-400 flex-shrink-0" />
            <div>
              <h2 className="font-bold uppercase tracking-wider text-xs">Rust Sidecar AST Indexer & LanceDB Vector Store</h2>
              <p className="text-[11px] text-slate-400">
                Native Rust Tree-sitter AST symbol extractor & ONNX vector similarity engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center text-xs">
          <div className="bg-ide-bg border border-ide-border rounded-xl p-2.5 sm:p-3">
            <div className="text-[10px] text-slate-400 uppercase">Indexed Files</div>
            <div className="font-bold text-cyan-300 text-sm">{stats.indexedFiles}</div>
          </div>
          <div className="bg-ide-bg border border-ide-border rounded-xl p-2.5 sm:p-3">
            <div className="text-[10px] text-slate-400 uppercase">AST Symbols</div>
            <div className="font-bold text-orange-400 text-sm">{stats.totalSymbols}</div>
          </div>
          <div className="bg-ide-bg border border-ide-border rounded-xl p-2.5 sm:p-3">
            <div className="text-[10px] text-slate-400 uppercase">Vector Dims</div>
            <div className="font-bold text-purple-400 text-sm">{stats.vectorEmbeddingDimensions}d</div>
          </div>
          <div className="bg-ide-bg border border-ide-border rounded-xl p-2.5 sm:p-3">
            <div className="text-[10px] text-slate-400 uppercase">Index Latency</div>
            <div className="font-bold text-emerald-400 text-sm">{stats.latencyMs} ms</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-ide-bg border border-ide-border rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setActiveTab('symbols')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'symbols' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>AST Symbol Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('vector')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              activeTab === 'vector' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>LanceDB Vector Search</span>
          </button>
        </div>

        {/* Tab 1: AST Symbol Table */}
        {activeTab === 'symbols' && (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={symbolQuery}
                onChange={(e) => setSymbolQuery(e.target.value)}
                placeholder="Filter symbols by name... (e.g. 'main' or 'Router')"
                className="w-full bg-ide-bg border border-ide-border rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Symbol Table */}
            <div className="max-h-60 overflow-y-auto border border-ide-border rounded-xl bg-ide-bg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-ide-sidebar text-slate-400 uppercase text-[10px] border-b border-ide-border">
                    <th className="px-3 py-2">Symbol Name</th>
                    <th className="px-3 py-2">Kind</th>
                    <th className="px-3 py-2">File Location</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ide-border text-slate-300 font-mono">
                  {allSymbols.map((sym) => (
                    <tr key={sym.id} className="hover:bg-ide-card/60 transition-colors">
                      <td className="px-3 py-2 font-bold text-orange-300">{sym.symbolName}</td>
                      <td className="px-3 py-2">
                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                          {sym.kind}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px]">
                        {sym.file}:{sym.line}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => {
                            onJumpToSymbol(sym.file, sym.line);
                            onClose();
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 text-[11px]"
                        >
                          <span>Jump</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: LanceDB Vector Search */}
        {activeTab === 'vector' && (
          <div className="space-y-3">
            <div className="relative">
              <Sparkles className="absolute left-3 top-2.5 h-3.5 w-3.5 text-purple-400" />
              <input
                type="text"
                value={vectorQuery}
                onChange={(e) => setVectorQuery(e.target.value)}
                placeholder="Query semantic code embeddings... (e.g. 'router intent classification')"
                className="w-full bg-ide-bg border border-ide-border rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 border border-ide-border rounded-xl p-2 bg-ide-bg">
              {vectorMatches.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onJumpToSymbol(item.file, item.line);
                    onClose();
                  }}
                  className="p-3 bg-ide-sidebar hover:bg-ide-card rounded-lg border border-ide-border flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-purple-300">{item.symbolName}</span>
                      <span className="bg-purple-500/20 text-purple-300 text-[9px] px-1.5 py-0.2 rounded border border-purple-500/30">
                        Similarity: {((item.similarityScore || 0.75) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-cyan-400/80 font-mono truncate">{item.snippet}</p>
                    <div className="text-[10px] text-slate-500">{item.file}:{item.line}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
