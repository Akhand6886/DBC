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

export default function Home() {
  const [activeView, setActiveView] = useState<ActivityView>('explorer');
  const [workspaceFiles, setWorkspaceFiles] = useState<FileNode[]>(INITIAL_WORKSPACE);
  
  // Find initial file: src/index.ts
  const initialFile = INITIAL_WORKSPACE[0].children?.[0] || null;
  const [activeFile, setActiveFile] = useState<FileNode | null>(initialFile);
  const [openFiles, setOpenFiles] = useState<FileNode[]>(initialFile ? [initialFile] : []);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Agentic AI IDE Orchestrator initialized.',
    'Language Server Protocol (LSP) TS/Rust active.',
    'Rust Sidecar AST Indexer ready (14 files indexed).'
  ]);
  const [activeDiff, setActiveDiff] = useState<ShadowDiffCheck | null>(null);
  const [fastPathCount, setFastPathCount] = useState(14);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(3);
  const [lastRoutePath, setLastRoutePath] = useState<string | undefined>('DETERMINISTIC_FAST_PATH');

  const handleSelectFile = (file: FileNode) => {
    setActiveFile(file);
    if (!openFiles.some((f) => f.id === file.id)) {
      setOpenFiles((prev) => [...prev, file]);
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

  const handleLogTerminal = (msg: string) => {
    setTerminalLogs((prev) => [...prev, msg]);
  };

  const handleApplyPatch = (newContent: string, diffCheck: ShadowDiffCheck) => {
    handleContentChange(newContent);
    setActiveDiff(diffCheck);
    setFastPathCount((prev) => prev + 1);
    setLastLatencyMs(3);
    setLastRoutePath('DETERMINISTIC_FAST_PATH');
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
          onViewChange={setActiveView}
          fastPathCount={fastPathCount}
        />

        {/* Primary Sidebar Content */}
        {activeView === 'explorer' && (
          <FileExplorer
            files={workspaceFiles}
            activeFileId={activeFile?.id || ''}
            onSelectFile={handleSelectFile}
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
      />
    </div>
  );
}
