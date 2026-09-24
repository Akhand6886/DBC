'use client';

import React, { useState, useEffect } from 'react';
import { FileNode, ShadowDiffCheck, RouterConfig, AgentExecutionPlan, SystemMetrics } from '../lib/types';
import { INITIAL_WORKSPACE } from '../lib/initialWorkspace';
import { DEFAULT_ROUTER_CONFIG } from '../lib/router/intentClassifier';
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
import { TopMenuBar } from '../components/TopMenuBar';
import { useToast } from '../components/ToastProvider';
import { RouterConfigModal } from '../components/RouterConfigModal';
import { RouterTraceModal } from '../components/RouterTraceModal';

// DBMS Studio & Editor Imports
import { DbConnectionPanel, DbConnection } from '../components/DbConnectionPanel';
import { SqlQueryPanel } from '../components/SqlQueryPanel';
import { DbPerformanceMonitor } from '../components/DbPerformanceMonitor';
import { TableInspectorModal } from '../components/TableInspectorModal';
import { DbObjectExplorer } from '../components/DbObjectExplorer';
import { TableDataEditor } from '../components/TableDataEditor';

import { FileCode, Search, Settings, GitBranch, Zap, Globe, ShieldCheck, BarChart2, Play, Command, Database, Table, Sliders } from 'lucide-react';

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

  // Table Inspector & Data Editor state
  const [inspectTable, setInspectTable] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);

  // Database State
  const [connections, setConnections] = useState<DbConnection[]>([
    { id: 'conn-1', name: 'Local SQLite Metadata', type: 'sqlite', connectionString: 'sqlite://metadata.db', status: 'connected' },
    { id: 'conn-2', name: 'Postgres Prod Registry', type: 'postgres', connectionString: 'postgresql://postgres@prod-db:5432/dbc', status: 'disconnected' }
  ]);
  const [activeConnectionId, setActiveConnectionId] = useState<string>('conn-1');

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Agentic AI IDE DBMS Editor Engine active.',
    'SQLite connection to metadata.db established successfully.',
    'Ready for SQL transactions & interactive data grid editing.'
  ]);
  const [activeDiff, setActiveDiff] = useState<ShadowDiffCheck | null>(null);
  const [fastPathCount, setFastPathCount] = useState(14);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(3);
  const [lastRoutePath, setLastRoutePath] = useState<string | undefined>('DETERMINISTIC_FAST_PATH');

  // Router State
  const [routerConfig, setRouterConfig] = useState<RouterConfig>(DEFAULT_ROUTER_CONFIG);
  const [isRouterConfigOpen, setIsRouterConfigOpen] = useState(false);
  const [isRouterTraceOpen, setIsRouterTraceOpen] = useState(false);

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalQueries: 12480,
    fastPathCount: 10508,
    llmCount: 1972,
    avgFastPathLatencyMs: 3,
    avgLlmLatencyMs: 840,
    totalCostSavedUSD: 432.80,
    shadowVerificationsPassed: 1420
  });

  const [recentPlans, setRecentPlans] = useState<AgentExecutionPlan[]>([
    {
      id: 'plan-01',
      prompt: 'rename table users to app_users',
      routerPath: 'DETERMINISTIC_FAST_PATH',
      confidenceScore: 97,
      intent: {
        rawPrompt: 'rename table users to app_users',
        actionType: 'LSP_RENAME',
        targetSymbol: 'users',
        confidenceScore: 97,
        scoreBreakdown: { patternScore: 98, lspAvailabilityScore: 95, ambiguityPenalty: 0, finalScore: 97 },
        explanation: 'Matched rule: LSP textDocument/rename. High structural pattern match.'
      },
      executionTimeMs: 3,
      tokenCostUSD: 0.0,
      generatedChanges: [],
      status: 'SUCCESS',
      modelProvider: 'anthropic'
    },
    {
      id: 'plan-02',
      prompt: 'implement multi-table audit trigger for transactions',
      routerPath: 'AGENTIC_LLM_PATH',
      confidenceScore: 36,
      intent: {
        rawPrompt: 'implement multi-table audit trigger for transactions',
        actionType: 'MULTI_FILE_FEATURE',
        confidenceScore: 36,
        scoreBreakdown: { patternScore: 30, lspAvailabilityScore: 95, ambiguityPenalty: 55, finalScore: 36 },
        explanation: 'High ambiguity detected (multi-file logic, open-ended reasoning). Escalated to Agentic LLM.'
      },
      executionTimeMs: 812,
      tokenCostUSD: 0.0035,
      generatedChanges: [],
      status: 'SUCCESS',
      modelProvider: 'anthropic'
    }
  ]);
  const [lastExecutionPlan, setLastExecutionPlan] = useState<AgentExecutionPlan | null>(recentPlans[0]);

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
    { id: 'database', label: 'Open DBMS Studio Console', category: 'action', icon: <Database className="h-4 w-4 text-[#007acc]" />, handler: () => setActiveView('database') },
    { id: 'inspect-table', label: 'Inspect Table DDL & Constraints', category: 'action', icon: <Table className="h-4 w-4" />, handler: () => setInspectTable('users') },
    { id: 'edit-data-grid', label: 'Open Table Data Grid Editor', category: 'action', icon: <Table className="h-4 w-4 text-emerald-400" />, handler: () => setEditingTable('users') },
    { id: 'search', label: 'Global Search & Replace', category: 'action', shortcut: '⌘⇧F', icon: <Search className="h-4 w-4" />, handler: () => setIsSearchOpen(true) },
    { id: 'settings', label: 'Open Settings & BYOK Keys', category: 'settings', shortcut: '⌘,', icon: <Settings className="h-4 w-4" />, handler: () => setIsSettingsOpen(true) },
    { id: 'git', label: 'Git Source Control', category: 'git', shortcut: '⌘⇧G', icon: <GitBranch className="h-4 w-4" />, handler: () => setIsGitOpen(true) },
    { id: 'browser', label: 'Browser-in-the-Loop Preview', category: 'action', icon: <Globe className="h-4 w-4" />, handler: () => setIsBrowserOpen(true) },
    { id: 'verification', label: 'Shadow Verification & Rollback Hub', category: 'action', icon: <ShieldCheck className="h-4 w-4" />, handler: () => setIsVerificationOpen(true) },
    { id: 'sidecar', label: 'Rust Sidecar & LanceDB Inspector', category: 'action', icon: <Zap className="h-4 w-4" />, handler: () => setIsSidecarOpen(true) },
    { id: 'analytics', label: 'Router Analytics Dashboard', category: 'router', icon: <BarChart2 className="h-4 w-4" />, handler: () => setActiveView('analytics') },
    { id: 'router-config', label: 'Router Thresholds & Fast-Path Rules', category: 'router', shortcut: '⌘⇧R', icon: <Sliders className="h-4 w-4 text-[#007acc]" />, handler: () => setIsRouterConfigOpen(true) },
    { id: 'router-trace', label: 'Inspect Last Router Execution Trace', category: 'router', icon: <FileCode className="h-4 w-4 text-emerald-400" />, handler: () => setIsRouterTraceOpen(true) },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', category: 'navigation', shortcut: '⌘B', icon: <FileCode className="h-4 w-4" />, handler: () => setShowSidebar(prev => !prev) },
    { id: 'toggle-terminal', label: 'Toggle Terminal Panel', category: 'navigation', shortcut: '⌘J', icon: <FileCode className="h-4 w-4" />, handler: () => setShowTerminal(prev => !prev) },
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
      path: `queries/${fileName}`,
      language: fileName.endsWith('.sql') ? 'sql' : fileName.endsWith('.rs') ? 'rust' : fileName.endsWith('.json') ? 'json' : 'typescript',
      content: fileName.endsWith('.sql') ? `-- ${fileName}\nSELECT * FROM users;\n` : `// ${fileName}\n`
    };
    setWorkspaceFiles((prev) => [...prev, newFile]);
    handleSelectFile(newFile);
    addToast('success', `Created ${fileName}`);
  };

  const handleAddFolder = (folderName: string) => {
    const newFolder: FileNode = {
      id: `folder-${Date.now()}`,
      name: folderName,
      path: folderName,
      isFolder: true,
      isOpen: true,
      children: []
    };
    setWorkspaceFiles((prev) => [...prev, newFolder]);
    addToast('success', `Created folder ${folderName}`);
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => {
        if (n.id === fileId) return { ...n, name: newName };
        if (n.isFolder && n.children) return { ...n, children: updateTree(n.children) };
        return n;
      });
    setWorkspaceFiles(prev => updateTree(prev));
    addToast('info', `Renamed file to ${newName}`);
  };

  const handleSaveScriptToWorkspace = (scriptName: string, content: string) => {
    const newFile: FileNode = {
      id: `file-${Date.now()}`,
      name: scriptName,
      path: `queries/${scriptName}`,
      language: 'sql',
      content
    };
    setWorkspaceFiles(prev => [...prev, newFile]);
    addToast('success', `Saved SQL script ${scriptName} to workspace queries/ folder.`);
    handleLogTerminal(`[Workspace File System]: Saved SQL script to queries/${scriptName}`);
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
    addToast('success', `Patch ${diffCheck.id} applied via Shadow Workspace.`);
  };

  const handleExecutePlan = (plan: AgentExecutionPlan) => {
    setLastExecutionPlan(plan);
    setRecentPlans((prev) => [plan, ...prev]);
    setLastLatencyMs(plan.executionTimeMs);
    setLastRoutePath(plan.routerPath);

    setSystemMetrics((prev) => {
      const isFast = plan.routerPath === 'DETERMINISTIC_FAST_PATH';
      return {
        ...prev,
        totalQueries: prev.totalQueries + 1,
        fastPathCount: isFast ? prev.fastPathCount + 1 : prev.fastPathCount,
        llmCount: isFast ? prev.llmCount : prev.llmCount + 1,
        totalCostSavedUSD: isFast ? prev.totalCostSavedUSD + 0.0035 : prev.totalCostSavedUSD,
        shadowVerificationsPassed: prev.shadowVerificationsPassed + 1
      };
    });

    if (plan.routerPath === 'DETERMINISTIC_FAST_PATH') {
      setFastPathCount((prev) => prev + 1);
    }
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
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-slate-100 overflow-hidden font-sans">
      {/* Top Menu Bar */}
      <TopMenuBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onNewFile={() => handleAddFile('untitled.sql')}
        onNewFolder={() => handleAddFolder('new_folder')}
        onToggleSidebar={() => setShowSidebar(prev => !prev)}
        onToggleTerminal={() => setShowTerminal(prev => !prev)}
        onRunQuery={() => handleLogTerminal('[DBC Engine]: Executed SQL query from menu.')}
        onOpenGit={() => setIsGitOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <ActivityBar activeView={activeView} onViewChange={handleViewChange} fastPathCount={fastPathCount} />

        {/* Sidebar views */}
        {showSidebar && activeView === 'explorer' && (
          <FileExplorer
            files={workspaceFiles}
            activeFileId={activeFile?.id || ''}
            onSelectFile={handleSelectFile}
            onAddFile={handleAddFile}
            onAddFolder={handleAddFolder}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
        )}

        {showSidebar && activeView === 'database' && (
          <div className="flex border-r border-[#3c3c3c] h-full bg-[#252526]">
            <DbConnectionPanel
              connections={connections}
              activeConnectionId={activeConnectionId}
              onSelectConnection={setActiveConnectionId}
              onAddConnection={handleAddConnection}
              onDeleteConnection={handleDeleteConnection}
            />
            {activeConnection && (
              <DbObjectExplorer
                onOpenDataEditor={(tableName) => setEditingTable(tableName)}
                onInspectDDL={(tableName) => setInspectTable(tableName)}
                onRunSelectTop={(tableName) => {
                  setActiveView('database');
                  handleLogTerminal(`[DBMS Editor]: Executed SELECT * FROM ${tableName} LIMIT 100;`);
                }}
              />
            )}
          </div>
        )}

        {/* Main panels */}
        {activeView === 'analytics' ? (
          <AnalyticsPanel
            metrics={systemMetrics}
            recentPlans={recentPlans}
            onInspectPlan={(plan) => {
              setLastExecutionPlan(plan);
              setIsRouterTraceOpen(true);
            }}
            onOpenRouterConfig={() => setIsRouterConfigOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
            {activeView === 'database' ? (
              editingTable ? (
                <TableDataEditor
                  tableName={editingTable}
                  onClose={() => setEditingTable(null)}
                  onLogTerminal={handleLogTerminal}
                />
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <SqlQueryPanel
                    activeConnectionName={activeConnection?.name || ''}
                    onLogTerminal={handleLogTerminal}
                    onRefreshSchema={() => addToast('info', 'Refreshed database schema.')}
                    onSaveScriptToWorkspace={handleSaveScriptToWorkspace}
                  />
                  {activeConnection && (
                    <div className="p-3 border-t border-[#3c3c3c] bg-[#252526]">
                      <DbPerformanceMonitor />
                    </div>
                  )}
                </div>
              )
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
          routerConfig={routerConfig}
          lastExecutionPlan={lastExecutionPlan}
          onApplyPatch={handleApplyPatch}
          onExecutePlan={handleExecutePlan}
          onOpenRouterConfig={() => setIsRouterConfigOpen(true)}
          onOpenRouterTrace={() => setIsRouterTraceOpen(true)}
          onLogTerminal={handleLogTerminal}
        />
      </div>

      <StatusBar
        lastLatencyMs={lastLatencyMs}
        lastRoutePath={lastRoutePath}
        onOpenSidecar={() => setIsSidecarOpen(true)}
        onOpenGit={() => setIsGitOpen(true)}
        onOpenRouterTrace={() => setIsRouterTraceOpen(true)}
        onOpenRouterConfig={() => setIsRouterConfigOpen(true)}
      />

      {isSearchOpen && <SearchModal files={workspaceFiles} onSelectFile={handleSelectFile} onClose={() => setIsSearchOpen(false)} onReplaceAll={handleReplaceAll} />}
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onSaveSettings={() => addToast('success', 'Settings & BYOK keys saved.')} />}
      {isVerificationOpen && <ShadowVerificationDrawer history={shadowHistory} onRollback={handleRollbackSnapshot} onClose={() => setIsVerificationOpen(false)} />}
      {isSidecarOpen && <SidecarInspectorModal onJumpToSymbol={handleJumpToSymbol} onClose={() => setIsSidecarOpen(false)} />}
      {isBrowserOpen && <BrowserPreviewModal onClose={() => setIsBrowserOpen(false)} onLogTerminal={handleLogTerminal} />}
      {isGitOpen && <GitPanel onClose={() => setIsGitOpen(false)} onLogTerminal={handleLogTerminal} />}
      {isPaletteOpen && <CommandPalette actions={paletteActions} onClose={() => setIsPaletteOpen(false)} />}
      {inspectTable && <TableInspectorModal tableName={inspectTable} onClose={() => setInspectTable(null)} />}
      {isRouterConfigOpen && (
        <RouterConfigModal
          config={routerConfig}
          onSaveConfig={(newCfg) => {
            setRouterConfig(newCfg);
            addToast('success', `Router threshold updated to ${newCfg.confidenceThreshold}%`);
            handleLogTerminal(`[Router Config]: Fast-Path confidence threshold set to ${newCfg.confidenceThreshold}%`);
          }}
          onClose={() => setIsRouterConfigOpen(false)}
        />
      )}
      {isRouterTraceOpen && (
        <RouterTraceModal
          plan={lastExecutionPlan}
          onClose={() => setIsRouterTraceOpen(false)}
        />
      )}
    </div>
  );
}
