'use client';

import React, { useState } from 'react';
import { FileNode } from '../lib/types';
import { Folder, FolderOpen, FileCode, FileText, Plus, Trash2, ChevronRight, ChevronDown, Edit2, Copy, FilePlus, FolderPlus } from 'lucide-react';

interface FileExplorerProps {
  files: FileNode[];
  activeFileId: string;
  onSelectFile: (file: FileNode) => void;
  onAddFile: (fileName: string) => void;
  onAddFolder?: (folderName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onRenameFile?: (fileId: string, newName: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onRenameFile,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'folder'>('file');
  const [newItemName, setNewItemName] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    queries: true,
    migrations: true,
    src: true
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (inputMode === 'file') {
      onAddFile(newItemName);
    } else if (onAddFolder) {
      onAddFolder(newItemName);
    }
    setNewItemName('');
    setShowInput(false);
  };

  const handleRenameSubmit = (fileId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingName.trim() && onRenameFile) {
      onRenameFile(fileId, editingName);
    }
    setEditingId(null);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.sql')) return <FileCode className="h-3.5 w-3.5 text-cyan-400" />;
    if (fileName.endsWith('.json')) return <FileCode className="h-3.5 w-3.5 text-yellow-400" />;
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return <FileCode className="h-3.5 w-3.5 text-blue-400" />;
    return <FileText className="h-3.5 w-3.5 text-slate-400" />;
  };

  const renderNode = (node: FileNode, level = 0) => {
    const isFolder = node.isFolder;
    const isExpanded = openFolders[node.id] ?? true;
    const isActive = node.id === activeFileId;
    const isEditing = editingId === node.id;

    if (isFolder) {
      return (
        <div key={node.id} className="space-y-0.5">
          <div
            onClick={() => toggleFolder(node.id)}
            className="flex items-center justify-between px-2 py-1 rounded hover:bg-ide-card/60 cursor-pointer text-slate-300 hover:text-white font-semibold transition-colors"
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            <div className="flex items-center space-x-1.5">
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
              {isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-cyan-400" /> : <Folder className="h-3.5 w-3.5 text-cyan-400" />}
              <span>{node.name}</span>
            </div>
          </div>

          {isExpanded && node.children && (
            <div className="space-y-0.5">
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.id}
        onClick={() => onSelectFile(node)}
        className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-all ${
          isActive
            ? 'bg-cyan-500/15 text-cyan-200 border-l-2 border-cyan-400 font-bold'
            : 'text-slate-400 hover:text-slate-200 hover:bg-ide-card/50'
        }`}
        style={{ paddingLeft: `${level * 12 + 16}px` }}
      >
        <div className="flex items-center space-x-1.5 truncate">
          {getFileIcon(node.name)}
          {isEditing ? (
            <form onSubmit={(e) => handleRenameSubmit(node.id, e)} className="flex-1">
              <input
                type="text"
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => setEditingId(null)}
                className="bg-ide-bg border border-cyan-500 text-cyan-200 px-1 text-xs focus:outline-none rounded w-full"
              />
            </form>
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </div>

        {/* Hover Quick Actions */}
        <div className="hidden group-hover:flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(node.id);
              setEditingName(node.name);
            }}
            className="text-slate-500 hover:text-cyan-300 p-0.5"
            title="Rename File"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(node.id);
            }}
            className="text-slate-500 hover:text-rose-400 p-0.5"
            title="Delete File"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-56 bg-ide-sidebar border-r border-ide-border flex flex-col h-full font-mono text-xs select-none">
      {/* Explorer Header */}
      <div className="px-3 py-2.5 border-b border-ide-border flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Workspace Files
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setInputMode('file');
              setShowInput(true);
            }}
            className="text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-ide-card"
            title="Create New File"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setInputMode('folder');
              setShowInput(true);
            }}
            className="text-slate-400 hover:text-cyan-300 p-1 rounded hover:bg-ide-card"
            title="Create New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Creation Form */}
      {showInput && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-ide-border bg-ide-bg">
          <input
            type="text"
            autoFocus
            placeholder={inputMode === 'file' ? 'New filename (e.g. report.sql)...' : 'New folder name...'}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            className="w-full bg-ide-card border border-cyan-500 rounded p-1.5 text-xs text-slate-100 focus:outline-none"
          />
        </form>
      )}

      {/* Workspace File Tree */}
      <div className="flex-grow overflow-y-auto p-2 space-y-0.5">
        {files.map(node => renderNode(node))}
      </div>
    </div>
  );
};
