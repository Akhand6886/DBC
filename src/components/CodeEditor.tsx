'use client';

import React, { useState } from 'react';
import { FileNode, ShadowDiffCheck } from '../lib/types';
import { X, Code2, Eye, ShieldCheck, Check, RotateCcw } from 'lucide-react';

interface CodeEditorProps {
  activeFile: FileNode | null;
  openFiles: FileNode[];
  onSelectTab: (file: FileNode) => void;
  onCloseTab: (fileId: string) => void;
  onContentChange: (newContent: string) => void;
  activeDiff: ShadowDiffCheck | null;
  onAcceptDiff?: () => void;
  onRejectDiff?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFile,
  openFiles,
  onSelectTab,
  onCloseTab,
  onContentChange,
  activeDiff,
  onAcceptDiff,
  onRejectDiff,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'diff'>('editor');

  if (!activeFile) {
    return (
      <div className="flex-1 bg-ide-bg flex flex-col items-center justify-center text-slate-500 font-mono text-xs space-y-2">
        <Code2 className="h-10 w-10 text-slate-600" />
        <p>No open file selected. Select a file from the explorer or prompt Mission Control.</p>
      </div>
    );
  }

  const lines = activeFile.content.split('\n');

  return (
    <div className="flex-1 flex flex-col bg-ide-bg border-r border-ide-border overflow-hidden">
      {/* Editor Tabs Bar */}
      <div className="bg-ide-sidebar border-b border-ide-border flex items-center justify-between px-2 overflow-x-auto">
        <div className="flex items-center space-x-1">
          {openFiles.map((file) => {
            const isActive = file.id === activeFile.id;
            return (
              <div
                key={file.id}
                onClick={() => onSelectTab(file)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-mono border-r border-ide-border cursor-pointer select-none ${
                  isActive
                    ? 'bg-ide-bg text-white border-t-2 border-t-ide-accent font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-ide-card/50'
                }`}
              >
                <span>{file.name}</span>
                {file.isModified && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  className="hover:text-rose-400 p-0.5 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* View Diff Mode Switcher */}
        {activeDiff && (
          <div className="flex items-center space-x-2 my-1">
            <div className="bg-ide-card border border-ide-border rounded p-0.5 flex space-x-1">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                  viewMode === 'editor' ? 'bg-ide-accent text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode('diff')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                  viewMode === 'diff' ? 'bg-ide-accent text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Diff Preview
              </button>
            </div>

            {onAcceptDiff && (
              <button
                onClick={onAcceptDiff}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] px-2.5 py-1 rounded font-mono font-semibold flex items-center space-x-1"
              >
                <Check className="h-3 w-3" />
                <span>Accept Patch</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs">
        {viewMode === 'diff' && activeDiff ? (
          /* Inline Diff Preview View */
          <div className="flex-1 bg-ide-terminal p-4 overflow-y-auto font-mono text-xs">
            <div className="bg-ide-card border border-ide-border rounded-lg p-3 mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-300">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-bold">Shadow Workspace Pre-Write Diff Check ({activeDiff.id})</span>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Syntax Valid ✓
              </span>
            </div>
            <pre className="text-slate-200 leading-relaxed overflow-x-auto">
              {activeDiff.patchDiff.split('\n').map((line, idx) => {
                const isAdd = line.startsWith('+');
                const isDel = line.startsWith('-');
                return (
                  <div
                    key={idx}
                    className={`${
                      isAdd ? 'bg-diff-addBg text-diff-addText font-semibold' : isDel ? 'bg-diff-delBg text-diff-delText font-semibold' : 'text-slate-400'
                    } px-2 py-0.5 rounded-xs`}
                  >
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>
        ) : (
          /* Standard Editor Area with Line Numbers */
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers Gutter */}
            <div className="w-12 bg-ide-sidebar py-3 text-right pr-3 text-slate-600 select-none border-r border-ide-border">
              {lines.map((_, idx) => (
                <div key={idx} className="leading-6">
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Editable Text Area */}
            <textarea
              value={activeFile.content}
              onChange={(e) => onContentChange(e.target.value)}
              className="flex-1 bg-ide-bg text-slate-100 p-3 font-mono text-xs leading-6 resize-none focus:outline-none scrollbar-none"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
