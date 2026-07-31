'use client';

import React, { useState } from 'react';
import { FileNode } from '../lib/types';
import { Folder, FolderOpen, FileCode, FileText, ChevronRight, ChevronDown, Plus, Trash2, FilePlus, FolderPlus } from 'lucide-react';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string;
  onSelectFile: (file: FileNode) => void;
  onAddFile?: (fileName: string, isFolder: boolean) => void;
  onDeleteFile?: (fileId: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onDeleteFile,
}) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ 'f-1': true });
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getFileIcon = (lang: string) => {
    if (lang === 'rust') return <FileCode className="h-3.5 w-3.5 text-orange-400" />;
    if (lang === 'typescript') return <FileCode className="h-3.5 w-3.5 text-cyan-400" />;
    if (lang === 'json') return <FileText className="h-3.5 w-3.5 text-yellow-400" />;
    return <FileText className="h-3.5 w-3.5 text-slate-400" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim() && onAddFile) {
      onAddFile(newFileName.trim(), false);
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      if (node.isFolder) {
        const isOpen = openFolders[node.id];
        return (
          <div key={node.id} className="select-none">
            <div
              onClick={() => toggleFolder(node.id)}
              className="flex items-center space-x-1.5 px-3 py-1 hover:bg-ide-card/60 text-slate-300 text-xs font-mono cursor-pointer group"
              style={{ paddingLeft: `${depth * 12 + 12}px` }}
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              )}
              {isOpen ? (
                <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
              ) : (
                <Folder className="h-3.5 w-3.5 text-cyan-400/80" />
              )}
              <span>{node.name}</span>
            </div>
            {isOpen && node.children && renderTree(node.children, depth + 1)}
          </div>
        );
      }

      const isActive = activeFileId === node.id;
      return (
        <div
          key={node.id}
          onClick={() => onSelectFile(node)}
          className={`flex items-center space-x-2 px-3 py-1 text-xs font-mono cursor-pointer transition-colors group ${
            isActive
              ? 'bg-ide-accent/20 text-cyan-300 border-l-2 border-ide-accent'
              : 'text-slate-400 hover:text-slate-200 hover:bg-ide-card/40'
          }`}
          style={{ paddingLeft: `${depth * 12 + 20}px` }}
        >
          {getFileIcon(node.language)}
          <span className="truncate flex-1">{node.name}</span>
          {node.isModified && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>}
          {onDeleteFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(node.id);
              }}
              title="Delete File"
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-56 bg-ide-sidebar border-r border-ide-border flex flex-col h-full select-none">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-ide-border flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Explorer
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsCreatingFile(true)}
            title="New File"
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-ide-card"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingFile && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-ide-border">
          <input
            type="text"
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="Filename (e.g. utils.ts)..."
            className="w-full bg-ide-bg border border-ide-accent text-slate-100 px-2 py-1 text-xs font-mono rounded focus:outline-none"
          />
        </form>
      )}

      {/* Workspace Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 text-[10px] uppercase font-bold text-slate-500 font-mono mb-1">
          AGENTIC-IDE-WORKSPACE
        </div>
        {renderTree(files)}
      </div>
    </div>
  );
};
