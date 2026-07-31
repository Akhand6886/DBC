'use client';

import React, { useState } from 'react';
import { FileNode, ShadowDiffCheck } from '../lib/types';
import { INITIAL_WORKSPACE } from '../lib/initialWorkspace';
import { ActivityBar, ActivityView } from '../components/ActivityBar';
import { FileExplorer } from '../components/FileExplorer';
import { CodeEditor } from '../components/CodeEditor';
import { TerminalPanel } from '../components/TerminalPanel';
import { MissionControl } from '../components/MissionControl';
import { AnalyticsPanel } from '../components/AnalyticsPanel';
import { StatusBar } from '../components/StatusBar';
import { SearchModal } from '../components/SearchModal';
import { SettingsModal } from '../components/SettingsModal';
import { ShadowVerificationDrawer } from '../components/ShadowVerificationDrawer';
import { SidecarInspectorModal } from '../components/SidecarInspectorModal';
import { BrowserPreviewModal } from '../components/BrowserPreviewModal';
import { GitPanel } from '../components/GitPanel';

export default function Home() {
  const [activeView, setActiveView] = useState<ActivityView>('explorer');
  const [workspaceFiles, setWorkspaceFiles] = useState<FileNode[]>(INITIAL_WORKSPACE);
  
  // Find initial file: src/index.ts
  const initialFile = INITIAL_WORKSPACE[0].children?.[0] || null;
  const [activeFile, setActiveFile] = useState<FileNode | null>(initialFile);
  const [openFiles, setOpenFiles] = useState<FileNode[]>(initialFile ? [initialFile] : []);
  
  // Modal & Drawer states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isSidecarOpen, setIsSidecarOpen] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isGitOpen, setIsGitOpen] = useState(false);
  const [shadowHistory, setShadowHistory] = useState<ShadowDiffCheck[]>([]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Agentic AI IDE Orchestrator initialized.',
    'Language Server Protocol (LSP) TS/Rust active.',
    'Rust Sidecar AST Indexer ready (14 files indexed).'
  ]);
  const [activeDiff, setActiveDiff] = useState<ShadowDiffCheck | null>(null);
  const [fastPathCount, setFastPathCount] = useState(14);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(3);
  const [lastRoutePath, setLastRoutePath] = useState<string | undefined>('DETERMINISTIC_FAST_PATH');

  const handleViewChange = (view: ActivityView) => {
    if (view === 'search') {
      setIsSearchOpen(true);
    } else if (view === 'settings') {
      setIsSettingsOpen(true);
    } else if (view === 'verification') {
      setIsVerificationOpen(true);
    } else if (view === 'browser') {
      setIsBrowserOpen(true);
    } else if (view === 'git') {
      setIsGitOpen(true);
    } else {
      setActiveView(view);
    }
  };

  const handleSelectFile = (file: FileNode) => {
    setActiveFile(file);
    if (!openFiles.some((f) => f.id === file.id)) {
      setOpenFiles((prev) => [...prev, file]);
    }
  };

  const handleJumpToSymbol = (filePath: string, line: number) => {
    const findFileByPath = (nodes: FileNode[]): FileNode | null => {
      for (const n of nodes) {
        if (!n.isFolder && n.path === filePath) return n;
        if (n.isFolder && n.children) {
          const res = findFileByPath(n.children);
          if (res) return res;
        }
      }
      return null;
    };

    const target = findFileByPath(workspaceFiles);
    if (target) {
      handleSelectFile(target);
      handleLogTerminal(`[Rust Sidecar]: Jumped to definition at ${filePath}:${line}`);
    }
  };

  const handleCloseTab = (fileId: string) => {
    const updated = openFiles.filter((f) => f.id !== fileId);
    setOpenFiles(updated);
    if (activeFile?.id === fileId) {
      setActiveFile(updated.length > 0 ? updated[updated.length - 1] : null);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (!activeFile) return;
    const updatedFile = { ...activeFile, content: newContent, isModified: true };
    setActiveFile(updatedFile);
    setOpenFiles((prev) => prev.map((f) => (f.id === activeFile.id ? updatedFile : f)));
  };

  const handleAddFile = (fileName: string, isFolder: boolean) => {
    const newFile: FileNode = {
      id: `file-${Date.now()}`,
      name: fileName,
      path: `src/${fileName}`,
      language: fileName.endsWith('.rs') ? 'rust' : fileName.endsWith('.json') ? 'json' : 'typescript',
      content: `// ${fileName}\n`
    };

    setWorkspaceFiles((prev) => [...prev, newFile]);
    handleSelectFile(newFile);
    handleLogTerminal(`Added new file ${fileName} to workspace.`);
  };

  const handleDeleteFile = (fileId: string) => {
    const filterTree = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter((n) => n.id !== fileId)
        .map((n) => (n.children ? { ...n, children: filterTree(n.children) } : n));
    };

    setWorkspaceFiles((prev) => filterTree(prev));
    handleCloseTab(fileId);
    handleLogTerminal(`Deleted file ${fileId} from workspace.`);
  };

  const handleReplaceAll = (searchTerm: string, replaceTerm: string) => {
    const replaceInTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.isFolder && node.children) {
          return { ...node, children: replaceInTree(node.children) };
        }
        if (!node.isFolder && node.content) {
          const reg = new RegExp(searchTerm, 'g');
          return { ...node, content: node.content.replace(reg, replaceTerm), isModified: true };
        }
        return node;
      });
    };

    const updated = replaceInTree(workspaceFiles);
    setWorkspaceFiles(updated);
    handleLogTerminal(`Replaced '${searchTerm}' with '${replaceTerm}' across workspace.`);
  };

  const handleLogTerminal = (msg: string) => {
    setTerminalLogs((prev) => [...prev, msg]);
  };

  const handleApplyPatch = (newContent: string, diffCheck: ShadowDiffCheck) => {
    handleContentChange(newContent);
    setActiveDiff(diffCheck);
    setShadowHistory((prev) => [...prev, diffCheck]);
    setFastPathCount((prev) => prev + 1);
    setLastLatencyMs(3);
    setLastRoutePath('DETERMINISTIC_FAST_PATH');
  };

  const handleRollbackSnapshot = (diffCheck: ShadowDiffCheck) => {
    handleContentChange(diffCheck.originalContent);
    setShadowHistory((prev) =>
      prev.map((s) => (s.id === diffCheck.id ? { ...s, status: 'ROLLED_BACK' } : s))
    );
    handleLogTerminal(`[Rollback]: Restored file ${diffCheck.targetFile} to snapshot ${diffCheck.id}.`);
  };

  const handleRunTestSuite = () => {
    handleLogTerminal('Running Test Suite via CLI runner...');
    setTimeout(() => {
      handleLogTerminal('✓ src/index.test.ts (100% PASSING in 12ms)');
    }, 200);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-ide-bg text-slate-100 overflow-hidden">
      {/* Upper Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost Activity Bar */}
        <ActivityBar
          activeView={activeView}
          onViewChange={handleViewChange}
          fastPathCount={fastPathCount}
        />

        {/* Primary Sidebar Content */}
        {activeView === 'explorer' && (
          <FileExplorer
            files={workspaceFiles}
            activeFileId={activeFile?.id || ''}
            onSelectFile={handleSelectFile}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {/* Center Code Editor & Bottom Terminal Column */}
        {activeView === 'analytics' ? (
          <AnalyticsPanel />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <CodeEditor
              activeFile={activeFile}
              openFiles={openFiles}
              onSelectTab={setActiveFile}
              onCloseTab={handleCloseTab}
              onContentChange={handleContentChange}
              activeDiff={activeDiff}
              onAcceptDiff={() => setActiveDiff(null)}
              onRejectDiff={() => setActiveDiff(null)}
            />

            <TerminalPanel
              logs={terminalLogs}
              onRunTests={handleRunTestSuite}
            />
          </div>
        )}

        {/* Rightmost AI Agent Composer Sidebar (Mission Control) */}
        <MissionControl
          activeFilePath={activeFile?.path}
          activeFileContent={activeFile?.content || ''}
          onApplyPatch={handleApplyPatch}
          onLogTerminal={handleLogTerminal}
        />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        lastLatencyMs={lastLatencyMs}
        lastRoutePath={lastRoutePath}
        onOpenSidecar={() => setIsSidecarOpen(true)}
      />

      {/* Global Search Modal */}
      {isSearchOpen && (
        <SearchModal
          files={workspaceFiles}
          onSelectFile={handleSelectFile}
          onClose={() => setIsSearchOpen(false)}
          onReplaceAll={handleReplaceAll}
        />
      )}

      {/* Settings & BYOK Modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onSaveSettings={(cfg) => handleLogTerminal(`Saved IDE Settings & BYOK keys.`)}
        />
      )}

      {/* Shadow Workspace Verification & Rollback Drawer */}
      {isVerificationOpen && (
        <ShadowVerificationDrawer
          history={shadowHistory}
          onRollback={handleRollbackSnapshot}
          onClose={() => setIsVerificationOpen(false)}
        />
      )}

      {/* Rust Sidecar Indexer & LanceDB Vector Store Modal */}
      {isSidecarOpen && (
        <SidecarInspectorModal
          onJumpToSymbol={handleJumpToSymbol}
          onClose={() => setIsSidecarOpen(false)}
        />
      )}

      {/* Browser-in-the-Loop & Visual Verification Modal */}
      {isBrowserOpen && (
        <BrowserPreviewModal
          onClose={() => setIsBrowserOpen(false)}
          onLogTerminal={handleLogTerminal}
        />
      )}

      {/* Git Source Control Panel */}
      {isGitOpen && (
        <GitPanel
          onClose={() => setIsGitOpen(false)}
          onLogTerminal={handleLogTerminal}
        />
      )}
    </div>
  );
}
