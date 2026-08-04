'use client';

import React, { useState, useEffect } from 'react';
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
import { CommandPalette, PaletteAction } from '../components/CommandPalette';
import { WelcomeTab } from '../components/WelcomeTab';
import { useToast } from '../components/ToastProvider';

// Database Panel Imports
import { DbConnectionPanel, DbConnection } from '../components/DbConnectionPanel';
import { SqlQueryPanel } from '../components/SqlQueryPanel';
import { SchemaVisualizer } from '../components/SchemaVisualizer';
import { DbPerformanceMonitor } from '../components/DbPerformanceMonitor';
import { TableInspectorModal } from '../components/TableInspectorModal';

import { FileCode, Search, Settings, GitBranch, Zap, Globe, ShieldCheck, BarChart2, Play, Palette, Key, Terminal, Command, Database } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState<ActivityView>('database');
  const [workspaceFiles, setWorkspaceFiles] = useState<FileNode[]>(INITIAL_WORKSPACE);
  const { addToast } = useToast();

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
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [shadowHistory, setShadowHistory] = useState<ShadowDiffCheck[]>([]);

  // Table Inspector state
  const [inspectTable, setInspectTable] = useState<string | null>(null);

  // Database State
  const [connections, setConnections] = useState<DbConnection[]>([
    { id: 'conn-1', name: 'Local SQLite Metadata', type: 'sqlite', connectionString: 'sqlite://metadata.db', status: 'connected' },
    { id: 'conn-2', name: 'Postgres Prod Registry', type: 'postgres', connectionString: 'postgresql://postgres@prod-db:5432/dbc', status: 'disconnected' }
  ]);
  const [activeConnectionId, setActiveConnectionId] = useState<string>('conn-1');

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Agentic AI IDE DBMS Controller initialized.',
    'SQLite connection to metadata.db established successfully.',
    'Ready for SQL transactions & schema operations.'
  ]);
  const [activeDiff, setActiveDiff] = useState<ShadowDiffCheck | null>(null);
  const [fastPathCount, setFastPathCount] = useState(14);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(3);
  const [lastRoutePath, setLastRoutePath] = useState<string | undefined>('DETERMINISTIC_FAST_PATH');

  // ─── Global Keyboard Shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      if (mod && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (mod && e.shiftKey && e.key === 'g') {
        e.preventDefault();
        setIsGitOpen(true);
      }
      if (mod && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
      if (mod && e.key === 'b') {
        e.preventDefault();
        setShowSidebar(prev => !prev);
      }
      if (mod && e.key === 'j') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }
      if (mod && e.key === 's') {
        e.preventDefault();
        if (activeFile) {
          addToast('success', `Saved ${activeFile.name}`);
        }
      }
      if (mod && e.key === 'w') {
        e.preventDefault();
        if (activeFile) {
          handleCloseTab(activeFile.id);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeFile]);

  // ─── Command Palette Actions ───────────────────────────────────────
  const paletteActions: PaletteAction[] = [
    { id: 'database', label: 'Open DBMS Studio Console', category: 'action', icon: <Database className="h-4 w-4" />, handler: () => setActiveView('database') },
    { id: 'inspect-table', label: 'Inspect Table DDL & Constraints', category: 'action', icon: <Database className="h-4 w-4" />, handler: () => setInspectTable('users') },
    { id: 'search', label: 'Global Search & Replace', category: 'action', shortcut: '⌘⇧F', icon: <Search className="h-4 w-4" />, handler: () => setIsSearchOpen(true) },
    { id: 'settings', label: 'Open Settings & BYOK Keys', category: 'settings', shortcut: '⌘,', icon: <Settings className="h-4 w-4" />, handler: () => setIsSettingsOpen(true) },
    { id: 'git', label: 'Git Source Control', category: 'git', shortcut: '⌘⇧G', icon: <GitBranch className="h-4 w-4" />, handler: () => setIsGitOpen(true) },
    { id: 'browser', label: 'Browser-in-the-Loop Preview', category: 'action', icon: <Globe className="h-4 w-4" />, handler: () => setIsBrowserOpen(true) },
    { id: 'verification', label: 'Shadow Verification & Rollback Hub', category: 'action', icon: <ShieldCheck className="h-4 w-4" />, handler: () => setIsVerificationOpen(true) },
    { id: 'sidecar', label: 'Rust Sidecar & LanceDB Inspector', category: 'action', icon: <Zap className="h-4 w-4" />, handler: () => setIsSidecarOpen(true) },
    { id: 'analytics', label: 'Router Analytics Dashboard', category: 'router', icon: <BarChart2 className="h-4 w-4" />, handler: () => setActiveView('analytics') },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', category: 'navigation', shortcut: '⌘B', icon: <FileCode className="h-4 w-4" />, handler: () => setShowSidebar(prev => !prev) },
    { id: 'toggle-terminal', label: 'Toggle Terminal Panel', category: 'navigation', shortcut: '⌘J', icon: <Terminal className="h-4 w-4" />, handler: () => setShowTerminal(prev => !prev) },
    { id: 'run-tests', label: 'Run Test Suite', category: 'action', icon: <Play className="h-4 w-4" />, handler: handleRunTestSuite },
    { id: 'welcome', label: 'Show Welcome Tab', category: 'navigation', icon: <Command className="h-4 w-4" />, handler: () => setShowWelcome(true) },
  ];

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleViewChange = (view: ActivityView) => {
    if (view === 'search') setIsSearchOpen(true);
    else if (view === 'settings') setIsSettingsOpen(true);
    else if (view === 'verification') setIsVerificationOpen(true);
    else if (view === 'browser') setIsBrowserOpen(true);
    else if (view === 'git') setIsGitOpen(true);
    else setActiveView(view);
  };

  const handleSelectFile = (file: FileNode) => {
    setShowWelcome(false);
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



  const handleAddFile = (fileName: string) => {
    const newFile: FileNode = {
      id: `file-${Date.now()}`,
      name: fileName,
      path: `src/${fileName}`,
      language: fileName.endsWith('.rs') ? 'rust' : fileName.endsWith('.json') ? 'json' : 'typescript',
      content: `// ${fileName}\n`
    };
    setWorkspaceFiles((prev) => [...prev, newFile]);
    handleSelectFile(newFile);
    addToast('success', `Created ${fileName}`);
  };

  const handleDeleteFile = (fileId: string) => {
    const filterTree = (nodes: FileNode[]): FileNode[] =>
      nodes.filter((n) => n.id !== fileId).map((n) => (n.children ? { ...n, children: filterTree(n.children) } : n));
    setWorkspaceFiles((prev) => filterTree(prev));
    handleCloseTab(fileId);
    addToast('info', 'File deleted from workspace.');
  };

  const handleReplaceAll = (searchTerm: string, replaceTerm: string) => {
    const replaceInTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.isFolder && node.children) return { ...node, children: replaceInTree(node.children) };
        if (!node.isFolder && node.content) {
          return { ...node, content: node.content.replace(new RegExp(searchTerm, 'g'), replaceTerm), isModified: true };
        }
        return node;
      });
    setWorkspaceFiles((prev) => replaceInTree(prev));
    addToast('success', `Replaced all occurrences of "${searchTerm}".`);
  };

  // Database Handlers
  const handleAddConnection = (conn: Omit<DbConnection, 'id' | 'status'>) => {
    const newConn: DbConnection = {
      ...conn,
      id: `conn-${Date.now()}`,
      status: 'connected'
    };
    setConnections((prev) => [...prev, newConn]);
    setActiveConnectionId(newConn.id);
    addToast('success', `Connected to database: ${conn.name}`);
    handleLogTerminal(`[DBC Connection Manager]: Established connection to [${conn.name}].`);
  };

  const handleDeleteConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    if (activeConnectionId === id) {
      setActiveConnectionId('');
    }
    addToast('info', 'Connection removed.');
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
    addToast('success', `Patch ${diffCheck.id} applied via Shadow Workspace.`);
  };

  const handleRollbackSnapshot = (diffCheck: ShadowDiffCheck) => {
    handleContentChange(diffCheck.originalContent);
    setShadowHistory((prev) => prev.map((s) => (s.id === diffCheck.id ? { ...s, status: 'ROLLED_BACK' } : s)));
    addToast('warning', `Rolled back to snapshot ${diffCheck.id}.`);
  };

  function handleRunTestSuite() {
    handleLogTerminal('Running Test Suite via CLI runner...');
    addToast('info', 'Running test suite...');
    setTimeout(() => {
      handleLogTerminal('✓ src/index.test.ts (100% PASSING in 12ms)');
      addToast('success', 'All tests passed! (12ms)');
    }, 200);
  }

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  return (
    <div className="h-screen w-screen flex flex-col bg-ide-bg text-slate-100 overflow-hidden font-sans">
      <div className="flex-1 flex overflow-hidden">
        <ActivityBar activeView={activeView} onViewChange={handleViewChange} fastPathCount={fastPathCount} />

        {/* Sidebar views */}
        {showSidebar && activeView === 'explorer' && (
          <FileExplorer
            files={workspaceFiles}
            activeFileId={activeFile?.id || ''}
            onSelectFile={handleSelectFile}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {showSidebar && activeView === 'database' && (
          <div className="flex border-r border-ide-border h-full">
            <DbConnectionPanel
              connections={connections}
              activeConnectionId={activeConnectionId}
              onSelectConnection={setActiveConnectionId}
              onAddConnection={handleAddConnection}
              onDeleteConnection={handleDeleteConnection}
            />
            {activeConnection && (
              <SchemaVisualizer connectionType={activeConnection.type} />
            )}
          </div>
        )}

        {/* Main panels */}
        {activeView === 'analytics' ? (
          <AnalyticsPanel />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeView === 'database' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <SqlQueryPanel
                  activeConnectionName={activeConnection?.name || ''}
                  onLogTerminal={handleLogTerminal}
                  onRefreshSchema={() => addToast('info', 'Refreshed database schema.')}
                />
                {activeConnection && (
                  <div className="p-3 border-t border-ide-border bg-ide-sidebar">
                    <DbPerformanceMonitor />
                  </div>
                )}
              </div>
            ) : showWelcome && openFiles.length === 0 ? (
              <WelcomeTab
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenGit={() => setIsGitOpen(true)}
                onOpenBrowser={() => setIsBrowserOpen(true)}
                onDismiss={() => setShowWelcome(false)}
              />
            ) : (
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
            )}

            {showTerminal && (
              <TerminalPanel logs={terminalLogs} onRunTests={handleRunTestSuite} />
            )}
          </div>
        )}

        <MissionControl
          activeFilePath={activeFile?.path}
          activeFileContent={activeFile?.content || ''}
          onApplyPatch={handleApplyPatch}
          onLogTerminal={handleLogTerminal}
        />
      </div>

      <StatusBar lastLatencyMs={lastLatencyMs} lastRoutePath={lastRoutePath} onOpenSidecar={() => setIsSidecarOpen(true)} />

      {isSearchOpen && <SearchModal files={workspaceFiles} onSelectFile={handleSelectFile} onClose={() => setIsSearchOpen(false)} onReplaceAll={handleReplaceAll} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onSaveSettings={() => addToast('success', 'Settings & BYOK keys saved.')} />}
      {isVerificationOpen && <ShadowVerificationDrawer history={shadowHistory} onRollback={handleRollbackSnapshot} onClose={() => setIsVerificationOpen(false)} />}
      {isSidecarOpen && <SidecarInspectorModal onJumpToSymbol={handleJumpToSymbol} onClose={() => setIsSidecarOpen(false)} />}
      {isBrowserOpen && <BrowserPreviewModal onClose={() => setIsBrowserOpen(false)} onLogTerminal={handleLogTerminal} />}
      {isGitOpen && <GitPanel onClose={() => setIsGitOpen(false)} onLogTerminal={handleLogTerminal} />}
      {isPaletteOpen && <CommandPalette actions={paletteActions} onClose={() => setIsPaletteOpen(false)} />}
      {inspectTable && <TableInspectorModal tableName={inspectTable} onClose={() => setInspectTable(null)} />}
    </div>
  );
}
