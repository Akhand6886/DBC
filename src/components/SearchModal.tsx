'use client';

import React, { useState } from 'react';
import { FileNode } from '../lib/types';
import { Search, Replace, FileCode, X, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  files: FileNode[];
  onSelectFile: (file: FileNode) => void;
  onClose: () => void;
  onReplaceAll?: (searchTerm: string, replaceTerm: string) => void;
}

export interface SearchMatch {
  file: FileNode;
  line: number;
  content: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  files,
  onSelectFile,
  onClose,
  onReplaceAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [isMatchCase, setIsMatchCase] = useState(false);

  // Recursively search files
  const searchFiles = (nodes: FileNode[]): SearchMatch[] => {
    if (!searchTerm.trim()) return [];
    let results: SearchMatch[] = [];

    for (const node of nodes) {
      if (node.isFolder && node.children) {
        results = [...results, ...searchFiles(node.children)];
      } else if (!node.isFolder && node.content) {
        const lines = node.content.split('\n');
        lines.forEach((line, idx) => {
          let matches = false;
          if (isRegex) {
            try {
              const reg = new RegExp(searchTerm, isMatchCase ? 'g' : 'gi');
              matches = reg.test(line);
            } catch (e) {
              matches = false;
            }
          } else {
            const target = isMatchCase ? line : line.toLowerCase();
            const query = isMatchCase ? searchTerm : searchTerm.toLowerCase();
            matches = target.includes(query);
          }

          if (matches) {
            results.push({
              file: node,
              line: idx + 1,
              content: line.trim()
            });
          }
        });
      }
    }
    return results;
  };

  const matches = searchFiles(files);

  const handleReplaceClick = () => {
    if (onReplaceAll && searchTerm.trim()) {
      onReplaceAll(searchTerm, replaceTerm);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 p-4">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Search className="h-4 w-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-xs">Global Workspace Search & Replace</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Replace Input Bars */}
        <div className="space-y-2">
          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search across workspace... (e.g. 'confidenceRouter' or 'main')"
              className="w-full bg-ide-bg border border-ide-border rounded-lg py-2.5 pl-9 pr-24 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <div className="absolute right-2 flex items-center space-x-1 text-[10px]">
              <button
                onClick={() => setIsMatchCase(!isMatchCase)}
                className={`px-1.5 py-0.5 rounded font-bold ${isMatchCase ? 'bg-cyan-500 text-white' : 'text-slate-400 bg-ide-card'}`}
              >
                Aa
              </button>
              <button
                onClick={() => setIsRegex(!isRegex)}
                className={`px-1.5 py-0.5 rounded font-bold ${isRegex ? 'bg-cyan-500 text-white' : 'text-slate-400 bg-ide-card'}`}
              >
                .*
              </button>
            </div>
          </div>

          {/* Replace Input Bar */}
          <div className="relative flex items-center">
            <Replace className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replace with..."
              className="w-full bg-ide-bg border border-ide-border rounded-lg py-2 pl-9 pr-28 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={handleReplaceClick}
              disabled={!searchTerm.trim() || matches.length === 0}
              className="absolute right-2 bg-ide-accent hover:bg-cyan-600 disabled:opacity-40 text-white px-2.5 py-1 rounded text-[10px] font-bold transition-all"
            >
              Replace All
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Search Results ({matches.length} matches)</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 border border-ide-border rounded-lg p-2 bg-ide-bg">
            {matches.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                {searchTerm ? 'No matching occurrences found in workspace.' : 'Enter a search term above.'}
              </div>
            ) : (
              matches.map((match, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectFile(match.file);
                    onClose();
                  }}
                  className="p-2 bg-ide-sidebar hover:bg-ide-card rounded border border-ide-border flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
                      <FileCode className="h-3.5 w-3.5" />
                      <span>{match.file.path}</span>
                      <span className="text-slate-500 text-[10px]">Line {match.line}</span>
                    </div>
                    <p className="text-slate-300 truncate max-w-md text-[11px]">{match.content}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
