'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { FileNode, ShadowDiffCheck } from '../lib/types';
import { X, Check, FileCode, ShieldAlert, Sparkles } from 'lucide-react';

const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-slate-400 font-mono text-xs">Loading Monaco Editor Engine...</div>,
});

interface CodeEditorProps {
  activeFile: FileNode | null;
  openFiles: FileNode[];
  onSelectTab: (file: FileNode) => void;
  onCloseTab: (fileId: string) => void;
  onContentChange: (newContent: string) => void;
  activeDiff?: ShadowDiffCheck | null;
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
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onContentChange(value);
    }
  };

  const getMonacoLanguage = (lang: string, fileName: string) => {
    if (fileName.endsWith('.sql')) return 'sql';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.rs')) return 'rust';
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.md')) return 'markdown';
    return lang || 'plaintext';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] h-full overflow-hidden select-none">
      {/* VS Code Tab Bar */}
      <div className="h-9 bg-[#252526] border-b border-[#3c3c3c] flex items-center overflow-x-auto text-xs scrollbar-none font-sans">
        {openFiles.map((file) => {
          const isActive = activeFile?.id === file.id;
          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file)}
              className={`group h-full px-3 flex items-center space-x-2 border-r border-[#3c3c3c] cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#1e1e1e] text-white font-medium border-t-2 border-t-[#007acc]'
                  : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#323233] hover:text-[#cccccc]'
              }`}
            >
              <FileCode className={`h-3.5 w-3.5 ${isActive ? 'text-[#007acc]' : 'text-slate-500'}`} />
              <span className="text-[12px]">{file.name}</span>
              {file.isModified && <span className="h-2 w-2 rounded-full bg-[#007acc]"></span>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(file.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Shadow Buffer Diff Overlay Banner */}
      {activeDiff && (
        <div className="bg-[#143a22] border-b border-[#3c3c3c] px-4 py-2 flex items-center justify-between font-mono text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="font-bold">Shadow Workspace Patch Pending Verification</span>
            <span className="text-[10px] text-emerald-300">({activeDiff.id})</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRejectDiff}
              aria-label="Reject Diff Patch"
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40 px-3 py-1 rounded font-semibold text-[11px]"
            >
              Reject Patch
            </button>
            <button
              onClick={onAcceptDiff}
              aria-label="Accept Diff Patch"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded font-bold text-[11px] flex items-center space-x-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Accept Patch</span>
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile ? (
          <Editor
            height="100%"
            language={getMonacoLanguage(activeFile.language || '', activeFile.name)}
            value={activeFile.content || ''}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
              fontLigatures: true,
              minimap: { enabled: true, scale: 0.75 },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 font-sans">
            <FileCode className="h-10 w-10 text-slate-600" />
            <span className="text-sm text-slate-400">Select a file from the explorer sidebar to begin editing</span>
          </div>
        )}
      </div>
    </div>
  );
};
