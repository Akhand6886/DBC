'use client';

import React, { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FileNode, ShadowDiffCheck } from '../lib/types';
import { X, Check, RotateCcw, FileCode } from 'lucide-react';

// Dynamic import to avoid SSR issues with Monaco
const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-ide-bg text-slate-500 text-xs font-mono">
      Loading Monaco Editor Engine...
    </div>
  ),
});

interface CodeEditorProps {
  activeFile: FileNode | null;
  openFiles: FileNode[];
  onSelectTab: (file: FileNode) => void;
  onCloseTab: (fileId: string) => void;
  onContentChange: (content: string) => void;
  activeDiff: ShadowDiffCheck | null;
  onAcceptDiff: () => void;
  onRejectDiff: () => void;
}

const getMonacoLanguage = (lang: string, fileName?: string): string => {
  if (fileName?.endsWith('.tsx') || fileName?.endsWith('.jsx')) return 'typescript';
  if (fileName?.endsWith('.json')) return 'json';
  if (fileName?.endsWith('.md')) return 'markdown';
  if (fileName?.endsWith('.css')) return 'css';
  if (fileName?.endsWith('.html')) return 'html';
  if (fileName?.endsWith('.rs')) return 'rust';
  if (fileName?.endsWith('.py')) return 'python';
  if (fileName?.endsWith('.go')) return 'go';

  switch (lang) {
    case 'typescript': return 'typescript';
    case 'rust': return 'rust';
    case 'json': return 'json';
    case 'python': return 'python';
    default: return 'typescript';
  }
};

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
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      onContentChange(value);
    }
  }, [onContentChange]);

  return (
    <div className="flex-1 flex flex-col bg-ide-bg overflow-hidden">
      {/* Tab Bar */}
      <div className="h-9 bg-ide-sidebar border-b border-ide-border flex items-center overflow-x-auto select-none">
        {openFiles.map((file) => {
          const isActive = activeFile?.id === file.id;
          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file)}
              className={`flex items-center space-x-2 px-3 h-full text-xs font-mono cursor-pointer border-r border-ide-border transition-colors ${
                isActive
                  ? 'bg-ide-bg text-white border-t-2 border-t-ide-accent'
                  : 'bg-ide-sidebar text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3 w-3 text-cyan-400" />
              <span>{file.name}</span>
              {file.isModified && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(file.id);
                }}
                className="ml-1 text-slate-500 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Diff Banner */}
      {activeDiff && (
        <div className="bg-cyan-950/60 border-b border-cyan-500/30 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-cyan-300 font-semibold">
            <FileCode className="h-3.5 w-3.5" />
            <span>Shadow Workspace Patch Applied — {activeDiff.id}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRejectDiff}
              className="text-slate-400 hover:text-white text-[10px] flex items-center space-x-1 px-2 py-1 rounded border border-ide-border"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Undo</span>
            </button>
            <button
              onClick={onAcceptDiff}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] flex items-center space-x-1 px-2 py-1 rounded shadow"
            >
              <Check className="h-3 w-3" />
              <span>Accept</span>
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <Editor
            height="100%"
            language={getMonacoLanguage(activeFile.language, activeFile.name)}
            value={activeFile.content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
              fontLigatures: true,
              minimap: { enabled: true, scale: 1 },
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'off',
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              suggest: {
                showKeywords: true,
                showSnippets: true,
              },
            }}
          />
        ) : (
          <div className="flex-1 h-full flex flex-col items-center justify-center text-slate-500 text-xs font-mono space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-ide-card border border-ide-border flex items-center justify-center">
              <FileCode className="h-8 w-8 text-slate-600" />
            </div>
            <span>Select a file from the Explorer to begin editing.</span>
          </div>
        )}
      </div>
    </div>
  );
};
