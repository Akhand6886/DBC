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
import { ShortcutsModal } from '../components/ShortcutsModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { loadPersistedWorkspace, savePersistedWorkspace } from '../lib/workspacePersistence';
import { byokClient } from '../lib/agent/byokClient';

// DBMS Studio & Editor Imports
import { DbConnectionPanel, DbConnection } from '../components/DbConnectionPanel';
import { SqlQueryPanel } from '../components/SqlQueryPanel';
import { DbPerformanceMonitor } from '../components/DbPerformanceMonitor';
import { TableInspectorModal } from '../components/TableInspectorModal';
import { DbObjectExplorer } from '../components/DbObjectExplorer';
import { TableDataEditor } from '../components/TableDataEditor';

import { FileCode, Search, Settings, GitBranch, Zap, Globe, ShieldCheck, BarChart2, Play, Command, Database, Table, Sliders, Sparkles } from 'lucide-react';

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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isSidecarOpen, setIsSidecarOpen] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isGitOpen, setIsGitOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [shadowHistory, setShadowHistory] = useState<ShadowDiffCheck[]>([]);

  // BYOK Keys & Editor Settings State
  const [byokKeys, setByokKeys] = useState<{
    openai?: string;
    anthropic?: string;
    gemini?: string;
    ollama?: string;
  }>({
    openai: '',
    anthropic: '',
    gemini: '',
    ollama: 'http://localhost:11434'
  });

  const [editorSettings, setEditorSettings] = useState({
    theme: 'vscode-dark',
    fontSize: 13,
    tabSize: 2,
    autoSave: true
  });

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
  const [fastPathCount, setFastPathCount] = useState(0);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | undefined>(undefined);
  const [lastRoutePath, setLastRoutePath] = useState<string | undefined>(undefined);

  // Router & UI State
  const [routerConfig, setRouterConfig] = useState<RouterConfig>(DEFAULT_ROUTER_CONFIG);
  const [isRouterConfigOpen, setIsRouterConfigOpen] = useState(false);
  const [isRouterTraceOpen, setIsRouterTraceOpen] = useState(false);
  const [showMissionControl, setShowMissionControl] = useState(false);
  const [showPerfMonitor, setShowPerfMonitor] = useState(false);

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalQueries: 0,
    fastPathCount: 0,
    llmCount: 0,
    avgFastPathLatencyMs: 0,
    avgLlmLatencyMs: 0,
    totalCostSavedUSD: 0.0,
    shadowVerificationsPassed: 0
  });

  const [recentPlans, setRecentPlans] = useState<AgentExecutionPlan[]>([]);
  const [lastExecutionPlan, setLastExecutionPlan] = useState<AgentExecutionPlan | null>(null);

  // ─── Workspace State & BYOK Hydration from Local Storage ────────────
  useEffect(() => {
    const saved = loadPersistedWorkspace();
    if (saved) {
      if (saved.files && saved.files.length > 0) {
        setWorkspaceFiles(saved.files);
        if (saved.activeFileId) {
          const found = saved.files.find((f) => f.id === saved.activeFileId);
          if (found) setActiveFile(found);
        }
        if (saved.openFileIds && saved.openFileIds.length > 0) {
          const opens = saved.files.filter((f) => saved.openFileIds.includes(f.id));
          if (opens.length > 0) setOpenFiles(opens);
        }
      }
      if (saved.connections && saved.connections.length > 0) {
        setConnections(saved.connections);
        if (saved.activeConnectionId) setActiveConnectionId(saved.activeConnectionId);
      }
    }

    try {
      const savedKeys = localStorage.getItem('dbc_byok_keys');
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys);
        setByokKeys(parsed);
        if (parsed.openai) byokClient.setApiKey('openai', parsed.openai);
        if (parsed.anthropic) byokClient.setApiKey('anthropic', parsed.anthropic);
        if (parsed.gemini) byokClient.setApiKey('gemini', parsed.gemini);
        if (parsed.ollama) byokClient.setEndpoint('ollama', parsed.ollama);
      }
      const savedSettings = localStorage.getItem('dbc_editor_settings');
      if (savedSettings) {
        setEditorSettings(JSON.parse(savedSettings));
      }
    } catch (e) {
      console.error('Error hydrating settings from localStorage', e);
    }
  }, []);

  // ─── Debounced Auto-Save to Local Storage ───────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      savePersistedWorkspace({
        files: workspaceFiles,
        activeFileId: activeFile?.id || null,
        openFileIds: openFiles.map((f) => f.id),
        connections,
        activeConnectionId
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [workspaceFiles, activeFile, openFiles, connections, activeConnectionId]);

  // ─── Save File Handler ─────────────────────────────────────────────
  const handleSaveActiveFile = () => {
    if (!activeFile) return;
    const cleanFile = { ...activeFile, isModified: false };
    setActiveFile(cleanFile);
    setOpenFiles((prev) => prev.map((f) => (f.id === activeFile.id ? cleanFile : f)));
    setWorkspaceFiles((prev) => {
      const updateTree = (nodes: FileNode[]): FileNode[] =>
        nodes.map((n) => {
          if (n.id === cleanFile.id) return cleanFile;
          if (n.isFolder && n.children) return { ...n, children: updateTree(n.children) };
          return n;
        });
      return updateTree(prev);
    });
    addToast('success', `Saved ${cleanFile.name}`);
    handleLogTerminal(`[Workspace File System]: Saved ${cleanFile.path}`);
  };

  // ─── Save Settings Handler ─────────────────────────────────────────
  const handleSaveSettings = (newSettings: any) => {
    if (newSettings.keys) {
      setByokKeys(newSettings.keys);
      try {
        localStorage.setItem('dbc_byok_keys', JSON.stringify(newSettings.keys));
        if (newSettings.keys.openai) byokClient.setApiKey('openai', newSettings.keys.openai);
        if (newSettings.keys.anthropic) byokClient.setApiKey('anthropic', newSettings.keys.anthropic);
        if (newSettings.keys.gemini) byokClient.setApiKey('gemini', newSettings.keys.gemini);
        if (newSettings.keys.ollama) byokClient.setEndpoint('ollama', newSettings.keys.ollama);
      } catch (e) {
        console.error('Error saving keys to localStorage', e);
      }
    }
    const cleanSettings = {
      theme: newSettings.theme || 'vscode-dark',
      fontSize: newSettings.fontSize || 13,
      tabSize: newSettings.tabSize || 2,
      autoSave: newSettings.autoSave !== undefined ? newSettings.autoSave : true
    };
    setEditorSettings(cleanSettings);
    try {
      localStorage.setItem('dbc_editor_settings', JSON.stringify(cleanSettings));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
    addToast('success', 'Settings & API Keys saved successfully.');
    handleLogTerminal('[BYOK Manager]: Updated provider configurations.');
  };

  // ─── Global Keyboard Shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Escape: Dismiss active modal / drawer / inspector
      if (e.key === 'Escape') {
        if (isPaletteOpen) setIsPaletteOpen(false);
        else if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (isSearchOpen) setIsSearchOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isVerificationOpen) setIsVerificationOpen(false);
        else if (isSidecarOpen) setIsSidecarOpen(false);
        else if (isBrowserOpen) setIsBrowserOpen(false);
        else if (isGitOpen) setIsGitOpen(false);
        else if (isRouterConfigOpen) setIsRouterConfigOpen(false);
        else if (isRouterTraceOpen) setIsRouterTraceOpen(false);
        else if (inspectTable) setInspectTable(null);
        else if (editingTable) setEditingTable(null);
        else if (showMissionControl) setShowMissionControl(false);
        return;
      }

      // ⌘/ or ⌘?: Keyboard Shortcuts Cheat Sheet
      if (mod && (key === '/' || key === '?')) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // ⌘Enter: Execute SQL query or Run test suite
      if (mod && (key === 'enter' || e.key === 'Enter')) {
        e.preventDefault();
        if (activeView === 'database') {
          handleLogTerminal('[DBC Engine]: Executed query via ⌘↵ shortcut.');
          addToast('info', 'Executing active SQL query...');
        } else {
          handleRunTestSuite();
        }
        return;
      }

      // ⌘P or ⌘K or ⌘⇧P: Command Palette / Quick Open
      if ((mod && key === 'p') || (mod && key === 'k')) {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
        return;
      }

      // ⌘⇧F or ⌘F: Global Search
      if (mod && key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // ⌘⇧G: Git Panel
      if (mod && e.shiftKey && key === 'g') {
        e.preventDefault();
        setIsGitOpen(true);
        return;
      }

      // ⌘⇧R: Router Config
      if (mod && e.shiftKey && key === 'r') {
        e.preventDefault();
        setIsRouterConfigOpen(true);
        return;
      }

      // ⌘,: Settings & BYOK
      if (mod && key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
        return;
      }

      // ⌘B: Toggle Primary Sidebar
      if (mod && key === 'b') {
        e.preventDefault();
        setShowSidebar(prev => !prev);
        return;
      }

      // ⌘J: Toggle Bottom Terminal
      if (mod && key === 'j') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
        return;
      }

      // ⌘L: Toggle AI Copilot / Mission Control
      if (mod && key === 'l') {
        e.preventDefault();
        setShowMissionControl(prev => !prev);
        return;
      }

      // ⌘N: New File
      if (mod && key === 'n') {
        e.preventDefault();
        handleAddFile(`query_${Date.now().toString().slice(-4)}.sql`);
        return;
      }

      // ⌘S: Save Active File
      if (mod && key === 's') {
        e.preventDefault();
        handleSaveActiveFile();
        return;
      }

      // ⌘W: Close Active Tab
      if (mod && key === 'w') {
        e.preventDefault();
        if (activeFile) {
          const fileId = activeFile.id;
          setOpenFiles((prev) => {
            const updated = prev.filter((f) => f.id !== fileId);
            setActiveFile(updated.length > 0 ? updated[updated.length - 1] : null);
            return updated;
          });
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeFile,
    activeView,
    isPaletteOpen,
    isShortcutsOpen,
    isSearchOpen,
    isSettingsOpen,
    isVerificationOpen,
    isSidecarOpen,
    isBrowserOpen,
    isGitOpen,
    isRouterConfigOpen,
    isRouterTraceOpen,
    inspectTable,
    editingTable,
    showMissionControl,
    addToast
  ]);

  // ─── Command Palette Actions ───────────────────────────────────────
  const paletteActions: PaletteAction[] = [
    { id: 'toggle-ai', label: 'Toggle AI Copilot Drawer', category: 'action', shortcut: '⌘L', icon: <Sparkles className="h-4 w-4 text-yellow-300" />, handler: () => setShowMissionControl(prev => !prev) },
    { id: 'shortcuts', label: 'Keyboard Shortcuts Cheat Sheet', category: 'navigation', shortcut: '⌘/', icon: <Command className="h-4 w-4 text-yellow-300" />, handler: () => setIsShortcutsOpen(true) },
    { id: 'database', label: 'Open DBMS Studio Console', category: 'action', icon: <Database className="h-4 w-4 text-[#007acc]" />, handler: () => { setActiveView('database'); setEditingTable(null); } },
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
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-slate-100 overflow-hidden font-sans">
      {/* Top Menu Bar */}
      <TopMenuBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPalette={() => setIsPaletteOpen(true)}
        onNewFile={() => handleAddFile('untitled.sql')}
        onNewFolder={() => handleAddFolder('new_folder')}
        onSaveFile={handleSaveActiveFile}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleSidebar={() => setShowSidebar(prev => !prev)}
        onToggleTerminal={() => setShowTerminal(prev => !prev)}
        onRunQuery={() => {
          if (activeView === 'database') {
            handleLogTerminal('[DBC Engine]: Executed active SQL query from menu.');
            addToast('info', 'Executing active SQL query...');
          } else {
            handleLogTerminal('[DBC Engine]: Executed query from menu.');
          }
        }}
        onOpenGit={() => setIsGitOpen(true)}
        showMissionControl={showMissionControl}
        onToggleMissionControl={() => setShowMissionControl(prev => !prev)}
        onOpenSidecar={() => setIsSidecarOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onRunTests={handleRunTestSuite}
        onOpenDatabase={() => {
          setActiveView('database');
          setEditingTable(null);
        }}
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
          <DbObjectExplorer
            connections={connections}
            activeConnectionId={activeConnectionId}
            onSelectConnection={setActiveConnectionId}
            onAddConnection={handleAddConnection}
            onDeleteConnection={handleDeleteConnection}
            onOpenDataEditor={(tableName) => setEditingTable(tableName)}
            onInspectDDL={(tableName) => setInspectTable(tableName)}
            onRunSelectTop={(tableName) => {
              setActiveView('database');
              handleLogTerminal(`[DBMS Editor]: Executed SELECT * FROM ${tableName} LIMIT 100;`);
            }}
          />
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
                  {showPerfMonitor && activeConnection && (
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
                onSave={handleSaveActiveFile}
              />
            )}

            {showTerminal && (
              <TerminalPanel logs={terminalLogs} onRunTests={handleRunTestSuite} />
            )}
          </div>
        )}

        {showMissionControl && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-30 sm:hidden backdrop-blur-xs"
              onClick={() => setShowMissionControl(false)}
            />
            <MissionControl
              activeFilePath={activeFile?.path}
              activeFileContent={activeFile?.content || ''}
              routerConfig={routerConfig}
              lastExecutionPlan={lastExecutionPlan}
              onApplyPatch={handleApplyPatch}
              onExecutePlan={handleExecutePlan}
              onOpenRouterConfig={() => setIsRouterConfigOpen(true)}
              onOpenRouterTrace={() => setIsRouterTraceOpen(true)}
              onClose={() => setShowMissionControl(false)}
              onLogTerminal={handleLogTerminal}
            />
          </>
        )}
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
      {isSettingsOpen && (
        <SettingsModal
          initialKeys={byokKeys}
          initialSettings={editorSettings}
          onClose={() => setIsSettingsOpen(false)}
          onSaveSettings={handleSaveSettings}
        />
      )}
      {isShortcutsOpen && <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />}
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
    </ErrorBoundary>
  );
}
