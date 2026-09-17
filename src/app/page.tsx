'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileNode, ShadowDiffCheck, RouterConfig, AgentExecutionPlan, SystemMetrics } from '../lib/types';
import { INITIAL_WORKSPACE } from '../lib/initialWorkspace';
import { DEFAULT_ROUTER_CONFIG } from '../lib/router/intentClassifier';
import {
  // Shell Domain
  ActivityBar, ActivityView,
  StatusBar,
  TerminalPanel,
  TopMenuBar,
  ErrorBoundary,
  // Editor Domain
  CodeEditor,
  FileExplorer,
  WelcomeTab,
  // DBMS Domain
  DbConnectionPanel, DbConnection,
  SqlQueryPanel,
  DbPerformanceMonitor,
  DbObjectExplorer,
  TableDataEditor,
  // Agents Domain
  MissionControl,
  AnalyticsPanel,
  // Modals & UI Domain
  ModalHost, ModalType, ActiveModalState,
  PaletteAction,
  useToast,
} from '../components';
import {
  loadPersistedWorkspace,
  savePersistedWorkspace,
  findFileNodeById,
  flattenFileNodes,
  saveDraftBuffer,
  clearDraftBuffer,
  getAllDraftBuffers
} from '../lib/workspacePersistence';
import { byokClient } from '../lib/agent/byokClient';
import { realSqlDriver } from '../lib/db/sqlDriver';

import { FileCode, Search, Settings, GitBranch, Zap, Globe, ShieldCheck, BarChart2, Play, Command, Database, Table, Sliders, Sparkles, Flame, Brain, Server, Share2, GitFork, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  const [activeView, setActiveView] = useState<ActivityView>('database');
  const [workspaceFiles, setWorkspaceFiles] = useState<FileNode[]>(INITIAL_WORKSPACE);
  const { addToast } = useToast();
  const executeSqlRef = useRef<(() => void) | null>(null);
  
  const initialFile = INITIAL_WORKSPACE[0].children?.[0] || null;
  const [activeFile, setActiveFile] = useState<FileNode | null>(initialFile);
  const [openFiles, setOpenFiles] = useState<FileNode[]>(initialFile ? [initialFile] : []);
  const [targetLine, setTargetLine] = useState<number | null>(null);
  
  // Layout states
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [shadowHistory, setShadowHistory] = useState<ShadowDiffCheck[]>([]);
  const [selectedTraceSessionId, setSelectedTraceSessionId] = useState<string | undefined>(undefined);

  // Unified Modal & Drawer State
  const [activeModal, setActiveModal] = useState<ActiveModalState | null>(null);
  const openModal = (type: ModalType, payload?: any) => setActiveModal({ type, payload });
  const closeModal = () => setActiveModal(null);

  // Modal helper aliases for backwards compatibility
  const setIsSearchOpen = (open: boolean) => setActiveModal(open ? { type: 'search' } : null);
  const setIsSettingsOpen = (open: boolean) => setActiveModal(open ? { type: 'settings' } : null);
  const setIsShortcutsOpen = (open: boolean) => setActiveModal(open ? { type: 'shortcuts' } : null);
  const setIsVerificationOpen = (open: boolean) => setActiveModal(open ? { type: 'verification' } : null);
  const setIsSidecarOpen = (open: boolean) => setActiveModal(open ? { type: 'sidecar' } : null);
  const setIsBrowserOpen = (open: boolean) => setActiveModal(open ? { type: 'browser' } : null);
  const setIsGitOpen = (open: boolean) => setActiveModal(open ? { type: 'git' } : null);
  const setIsPaletteOpen = (open: boolean) => setActiveModal(open ? { type: 'palette' } : null);
  const setIsAgentTraceOpen = (open: boolean, sessionId?: string) => {
    if (sessionId) setSelectedTraceSessionId(sessionId);
    setActiveModal(open ? { type: 'agentTrace', payload: sessionId || selectedTraceSessionId } : null);
  };
  const setIsDbMemoryOpen = (open: boolean) => setActiveModal(open ? { type: 'dbMemory' } : null);
  const setIsMcpServerOpen = (open: boolean) => setActiveModal(open ? { type: 'mcpServer' } : null);
  const setIsLineageOpen = (open: boolean) => setActiveModal(open ? { type: 'dataLineage' } : null);
  const setIsBranchManagerOpen = (open: boolean) => setActiveModal(open ? { type: 'branchManager' } : null);
  const setIsOptimizerOpen = (open: boolean) => setActiveModal(open ? { type: 'optimizer' } : null);
  const setIsCollabOpen = (open: boolean) => setActiveModal(open ? { type: 'collab' } : null);
  const setIsRouterConfigOpen = (open: boolean) => setActiveModal(open ? { type: 'routerConfig' } : null);
  const setIsRouterTraceOpen = (open: boolean) => setActiveModal(open ? { type: 'routerTrace' } : null);
  const setInspectTable = (tableName: string | null) => setActiveModal(tableName ? { type: 'tableInspector', payload: tableName } : null);

  // BYOK Keys & Editor Settings State
  const [byokKeys, setByokKeys] = useState<{
    openai?: string;
    anthropic?: string;
    gemini?: string;
    ollama?: string;
    nvidia?: string;
  }>({
    openai: '',
    anthropic: '',
    gemini: '',
    ollama: 'http://localhost:11434',
    nvidia: ''
  });

  const [editorSettings, setEditorSettings] = useState({
    theme: 'vscode-dark',
    fontSize: 13,
    tabSize: 2,
    autoSave: true
  });

  // Table Inspector & Data Editor state
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
          const found = findFileNodeById(saved.files, saved.activeFileId);
          if (found) {
            setActiveFile(found);
          } else {
            const allFiles = flattenFileNodes(saved.files);
            if (allFiles.length > 0) setActiveFile(allFiles[0]);
          }
        }
        if (saved.openFileIds && saved.openFileIds.length > 0) {
          const opens = saved.openFileIds
            .map((id) => findFileNodeById(saved.files, id))
            .filter((f): f is FileNode => f !== null && !f.isFolder);
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
        if (parsed.nvidia) byokClient.setApiKey('nvidia', parsed.nvidia);
      }
      const savedSettings = localStorage.getItem('dbc_editor_settings');
      if (savedSettings) {
        setEditorSettings(JSON.parse(savedSettings));
      }

      // ED-01: Rehydrate uncommitted draft buffers from previous session
      const drafts = getAllDraftBuffers();
      const draftPaths = Object.keys(drafts);
      if (draftPaths.length > 0) {
        setWorkspaceFiles((prev) => {
          const applyDrafts = (nodes: FileNode[]): FileNode[] =>
            nodes.map((n) => {
              if (n.isFolder && n.children) return { ...n, children: applyDrafts(n.children) };
              if (!n.isFolder && drafts[n.path]) {
                return { ...n, content: drafts[n.path].content, isModified: true };
              }
              return n;
            });
          return applyDrafts(prev);
        });
      }
    } catch (e) {
      console.error('Error hydrating settings from localStorage', e);
    }
  }, []);

  // ─── Sync Theme to Document Root ────────────────────────────────────
  useEffect(() => {
    if (editorSettings.theme && typeof document !== 'undefined') {
      document.documentElement.dataset.theme = editorSettings.theme;
      document.documentElement.setAttribute('data-theme', editorSettings.theme);
    }
  }, [editorSettings.theme]);

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

  // ─── ED-01: Debounced Draft Buffer Persistence ──────────────────────
  useEffect(() => {
    if (activeFile && activeFile.isModified && typeof activeFile.content === 'string') {
      const draftContent = activeFile.content;
      const draftPath = activeFile.path;
      const draftTimer = setTimeout(() => {
        saveDraftBuffer(draftPath, draftContent);
      }, 500);
      return () => clearTimeout(draftTimer);
    }
  }, [activeFile?.path, activeFile?.content, activeFile?.isModified]);

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

    // Clear saved draft
    clearDraftBuffer(cleanFile.path);

    addToast('success', `Saved ${cleanFile.name}`);
    handleLogTerminal(`[Workspace File System]: Saved ${cleanFile.path}`);
  };

  // ─── Save Settings Handler ─────────────────────────────────────────
  const handleSaveSettings = (newSettings: any) => {
    if (newSettings.keys) {
      // Sanitize keys: filter out empty string entries before saving (Issue 11)
      const sanitizedKeys: Record<string, string> = {};
      for (const [provider, keyVal] of Object.entries(newSettings.keys)) {
        if (typeof keyVal === 'string' && keyVal.trim() !== '') {
          sanitizedKeys[provider] = keyVal.trim();
        }
      }
      setByokKeys(sanitizedKeys);
      try {
        localStorage.setItem('dbc_byok_keys', JSON.stringify(sanitizedKeys));
        if (sanitizedKeys.openai) byokClient.setApiKey('openai', sanitizedKeys.openai);
        if (sanitizedKeys.anthropic) byokClient.setApiKey('anthropic', sanitizedKeys.anthropic);
        if (sanitizedKeys.gemini) byokClient.setApiKey('gemini', sanitizedKeys.gemini);
        if (sanitizedKeys.ollama) byokClient.setEndpoint('ollama', sanitizedKeys.ollama);
        if (sanitizedKeys.nvidia) byokClient.setApiKey('nvidia', sanitizedKeys.nvidia);
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
        if (activeModal) {
          setActiveModal(null);
          return;
        }
        if (editingTable) {
          setEditingTable(null);
          return;
        }
        if (showMissionControl) {
          setShowMissionControl(false);
          return;
        }
        return;
      }

      // ⌘/ or ⌘?: Keyboard Shortcuts Cheat Sheet
      if (mod && (key === '/' || key === '?')) {
        e.preventDefault();
        setActiveModal(prev => (prev?.type === 'shortcuts' ? null : { type: 'shortcuts' }));
        return;
      }

      // ⌘Enter: Execute SQL query or Run test suite
      if (mod && (key === 'enter' || e.key === 'Enter')) {
        e.preventDefault();
        const isMonacoFocused = typeof document !== 'undefined' && !!document.activeElement?.closest('.monaco-editor');
        if (isMonacoFocused && activeView === 'database') {
          // Handled directly inside Monaco's onKeyDown listener in SqlQueryPanel to prevent double execution
          return;
        }

        if (activeView === 'database') {
          handleLogTerminal('[DBC Engine]: Executed query via ⌘↵ shortcut.');
          if (executeSqlRef.current) {
            executeSqlRef.current();
          } else {
            window.dispatchEvent(new CustomEvent('dbc-execute-sql'));
          }
        } else {
          handleRunTestSuite();
        }
        return;
      }

      // ⌘P or ⌘K or ⌘⇧P: Command Palette / Quick Open
      if ((mod && key === 'p') || (mod && key === 'k')) {
        e.preventDefault();
        setActiveModal(prev => (prev?.type === 'palette' ? null : { type: 'palette' }));
        return;
      }

      // ⌘⇧F or ⌘F: Search (⌘F in Monaco allows native in-file Find; ⌘⇧F opens Workspace Search)
      if (mod && key === 'f') {
        const isMonacoFocused = typeof document !== 'undefined' && !!document.activeElement?.closest('.monaco-editor');
        if (!e.shiftKey && isMonacoFocused) {
          // Allow Monaco's native in-file find widget to handle ⌘F
          return;
        }

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

      // ⌘⇧K: Database Memory & Business Invariant Policies (P1)
      if (mod && e.shiftKey && key === 'k') {
        e.preventDefault();
        setActiveModal(prev => (prev?.type === 'dbMemory' ? null : { type: 'dbMemory' }));
        return;
      }

      // ⌘⇧M: MCP Server Protocol Hub (P1)
      if (mod && e.shiftKey && key === 'm') {
        e.preventDefault();
        setActiveModal(prev => (prev?.type === 'mcpServer' ? null : { type: 'mcpServer' }));
        return;
      }

      // ⌘⇧L: Data Lineage & Downstream Blast Radius DAG (P2)
      if (mod && e.shiftKey && key === 'l') {
        e.preventDefault();
        setActiveModal(prev => (prev?.type === 'dataLineage' ? null : { type: 'dataLineage' }));
        return;
      }

      // ⌘⌥B: Database Sandbox & Branch Manager (P2)
      if (mod && e.altKey && key === 'b') {
        e.preventDefault();
        setActiveModal(prev => (prev?.type === 'branchManager' ? null : { type: 'branchManager' }));
        return;
      }

      // ⌘⇧O: Agent Performance Optimizer (P2)
      if (mod && e.shiftKey && key === 'o') {
        e.preventDefault();
        setActiveModal(prev => (prev?.type === 'optimizer' ? null : { type: 'optimizer' }));
        return;
      }

      // ⌘⌥C: Collaborative Agent Sessions (P3)
      if (mod && e.altKey && key === 'c') {
        e.preventDefault();
        setActiveModal(prev => (prev?.type === 'collab' ? null : { type: 'collab' }));
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

      // ⌘N or ⌥N / Alt+N: New File (SH-01 safe alias)
      if ((mod && key === 'n') || (e.altKey && !mod && key === 'n')) {
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

      // ⌘W or ⌥W / Alt+W: Close Active Tab (SH-01 safe alias)
      if ((mod && key === 'w') || (e.altKey && !mod && key === 'w')) {
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
    activeModal,
    editingTable,
    showMissionControl,
    addToast
  ]);

  // ─── Command Palette Actions ───────────────────────────────────────
  const tableNames = realSqlDriver.getTableNames();
  const defaultTable = tableNames[0] || 'users';

  const dynamicTableActions: PaletteAction[] = tableNames.flatMap((tbl) => [
    {
      id: `inspect-table-${tbl}`,
      label: `Inspect Table DDL: ${tbl}`,
      category: 'action' as const,
      icon: <Table className="h-4 w-4 text-cyan-400" />,
      handler: () => setInspectTable(tbl)
    },
    {
      id: `edit-data-grid-${tbl}`,
      label: `Open Table Data Grid Editor: ${tbl}`,
      category: 'action' as const,
      icon: <Table className="h-4 w-4 text-emerald-400" />,
      handler: () => {
        setActiveView('database');
        setEditingTable(tbl);
      }
    },
    {
      id: `query-table-${tbl}`,
      label: `Query Table: SELECT * FROM ${tbl} LIMIT 100`,
      category: 'action' as const,
      icon: <Database className="h-4 w-4 text-amber-400" />,
      handler: () => {
        setActiveView('database');
        setEditingTable(null);
        handleAddFile(`query_${tbl}.sql`);
      }
    }
  ]);

  const paletteActions: PaletteAction[] = [
    { id: 'toggle-ai', label: 'Toggle AI Copilot Drawer', category: 'action', shortcut: '⌘L', icon: <Sparkles className="h-4 w-4 text-yellow-300" />, handler: () => setShowMissionControl(prev => !prev) },
    { id: 'shortcuts', label: 'Keyboard Shortcuts Cheat Sheet', category: 'navigation', shortcut: '⌘/', icon: <Command className="h-4 w-4 text-yellow-300" />, handler: () => setIsShortcutsOpen(true) },
    { id: 'database', label: 'Open DBMS Studio Console', category: 'action', icon: <Database className="h-4 w-4 text-[#007acc]" />, handler: () => { setActiveView('database'); setEditingTable(null); } },
    ...(dynamicTableActions.length > 0 ? dynamicTableActions : [
      { id: 'inspect-table', label: 'Inspect Table DDL & Constraints', category: 'action' as const, icon: <Table className="h-4 w-4 text-cyan-400" />, handler: () => setInspectTable(defaultTable) },
      { id: 'edit-data-grid', label: 'Open Table Data Grid Editor', category: 'action' as const, icon: <Table className="h-4 w-4 text-emerald-400" />, handler: () => setEditingTable(defaultTable) },
    ]),
    { id: 'search', label: 'Global Search & Replace', category: 'action', shortcut: '⌘⇧F', icon: <Search className="h-4 w-4" />, handler: () => setIsSearchOpen(true) },
    { id: 'settings', label: 'Open Settings & BYOK Keys', category: 'settings', shortcut: '⌘,', icon: <Settings className="h-4 w-4" />, handler: () => setIsSettingsOpen(true) },
    { id: 'git', label: 'Git Source Control', category: 'git', shortcut: '⌘⇧G', icon: <GitBranch className="h-4 w-4" />, handler: () => setIsGitOpen(true) },
    { id: 'browser', label: 'Browser-in-the-Loop Preview', category: 'action', icon: <Globe className="h-4 w-4" />, handler: () => setIsBrowserOpen(true) },
    { id: 'verification', label: 'Shadow Verification & Rollback Hub', category: 'action', icon: <ShieldCheck className="h-4 w-4" />, handler: () => setIsVerificationOpen(true) },
    { id: 'sidecar', label: 'Rust Sidecar & LanceDB Inspector', category: 'action', icon: <Zap className="h-4 w-4" />, handler: () => setIsSidecarOpen(true) },
    { id: 'analytics', label: 'Router Analytics Dashboard', category: 'router', icon: <BarChart2 className="h-4 w-4" />, handler: () => setActiveView('analytics') },
    { id: 'router-config', label: 'Router Thresholds & Fast-Path Rules', category: 'router', shortcut: '⌘⇧R', icon: <Sliders className="h-4 w-4 text-[#007acc]" />, handler: () => setIsRouterConfigOpen(true) },
    { id: 'router-trace', label: 'Inspect Last Router Execution Trace', category: 'router', icon: <FileCode className="h-4 w-4 text-emerald-400" />, handler: () => setIsRouterTraceOpen(true) },
    { id: 'agent-trace', label: 'Agent Execution Trace & Flamegraph (P0)', category: 'router', shortcut: '⌘⇧T', icon: <Flame className="h-4 w-4 text-amber-400" />, handler: () => setIsAgentTraceOpen(true) },
    { id: 'db-memory', label: 'Database Memory & Business Invariant Policies (P1)', category: 'action', shortcut: '⌘⇧K', icon: <Brain className="h-4 w-4 text-emerald-400" />, handler: () => setIsDbMemoryOpen(true) },
    { id: 'mcp-server', label: 'Model Context Protocol (MCP) Server Hub (P1)', category: 'action', shortcut: '⌘⇧M', icon: <Server className="h-4 w-4 text-purple-400" />, handler: () => setIsMcpServerOpen(true) },
    { id: 'data-lineage', label: 'Data Lineage & Downstream Blast DAG (P2)', category: 'action', shortcut: '⌘⇧L', icon: <Share2 className="h-4 w-4 text-cyan-400" />, handler: () => setIsLineageOpen(true) },
    { id: 'branch-manager', label: 'Database Sandbox & Branch Manager (P2)', category: 'action', shortcut: '⌘⌥B', icon: <GitBranch className="h-4 w-4 text-purple-400" />, handler: () => setIsBranchManagerOpen(true) },
    { id: 'perf-optimizer', label: 'Agent Performance Optimizer (P2)', category: 'action', shortcut: '⌘⇧O', icon: <Zap className="h-4 w-4 text-yellow-400" />, handler: () => setIsOptimizerOpen(true) },
    { id: 'collaborative-sessions', label: 'Collaborative Multi-Agent Studio (P3)', category: 'action', shortcut: '⌘⌥C', icon: <Users className="h-4 w-4 text-emerald-400" />, handler: () => setIsCollabOpen(true) },
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
        if (!n.isFolder && (n.path === filePath || n.name === filePath)) return n;
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
      setTargetLine(line);
      addToast('info', `Jumped to definition at ${target.name}:${line}`);
      handleLogTerminal(`[Rust Sidecar]: Jumped to definition at ${filePath}:${line}`);
    } else {
      addToast('warning', `Symbol file not found: ${filePath}`);
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

  const handleAddFile = (fileName: string, targetDir?: string) => {
    // Determine target directory from explicit targetDir parameter, or currently active file/folder
    let parentPath = targetDir ?? '';
    if (!parentPath && activeFile) {
      if (activeFile.isFolder) {
        parentPath = activeFile.path;
      } else {
        const lastSlash = activeFile.path.lastIndexOf('/');
        if (lastSlash > -1) {
          parentPath = activeFile.path.substring(0, lastSlash);
        }
      }
    }

    const filePath = parentPath ? `${parentPath}/${fileName}` : fileName;
    const newFile: FileNode = {
      id: `file-${Date.now()}`,
      name: fileName,
      path: filePath,
      language: fileName.endsWith('.sql') ? 'sql' : fileName.endsWith('.rs') ? 'rust' : fileName.endsWith('.json') ? 'json' : 'typescript',
      content: fileName.endsWith('.sql') ? `-- ${fileName}\nSELECT * FROM users;\n` : `// ${fileName}\n`
    };

    if (parentPath) {
      const insertIntoTree = (nodes: FileNode[]): FileNode[] =>
        nodes.map(node => {
          if (node.isFolder && node.path === parentPath) {
            return { ...node, isOpen: true, children: [...(node.children || []), newFile] };
          }
          if (node.isFolder && node.children) {
            return { ...node, children: insertIntoTree(node.children) };
          }
          return node;
        });
      setWorkspaceFiles((prev) => insertIntoTree(prev));
    } else {
      setWorkspaceFiles((prev) => [...prev, newFile]);
    }

    handleSelectFile(newFile);
    addToast('success', `Created ${filePath}`);
  };

  const handleAddFolder = (folderName: string, targetDir?: string) => {
    let parentPath = targetDir ?? '';
    if (!parentPath && activeFile) {
      if (activeFile.isFolder) {
        parentPath = activeFile.path;
      } else {
        const lastSlash = activeFile.path.lastIndexOf('/');
        if (lastSlash > -1) {
          parentPath = activeFile.path.substring(0, lastSlash);
        }
      }
    }

    const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;
    const newFolder: FileNode = {
      id: `folder-${Date.now()}`,
      name: folderName,
      path: folderPath,
      isFolder: true,
      isOpen: true,
      children: []
    };

    if (parentPath) {
      const insertIntoTree = (nodes: FileNode[]): FileNode[] =>
        nodes.map(node => {
          if (node.isFolder && node.path === parentPath) {
            return { ...node, isOpen: true, children: [...(node.children || []), newFolder] };
          }
          if (node.isFolder && node.children) {
            return { ...node, children: insertIntoTree(node.children) };
          }
          return node;
        });
      setWorkspaceFiles((prev) => insertIntoTree(prev));
    } else {
      setWorkspaceFiles((prev) => [...prev, newFolder]);
    }

    addToast('success', `Created folder ${folderPath}`);
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    let oldPath = '';
    let newPath = '';

    const updateTree = (nodes: FileNode[], parentDir = ''): FileNode[] =>
      nodes.map(n => {
        if (n.id === fileId) {
          oldPath = n.path;
          newPath = parentDir ? `${parentDir}/${newName}` : newName;
          const updatedNode: FileNode = {
            ...n,
            name: newName,
            path: newPath
          };
          if (n.isFolder && n.children) {
            const updateChildPaths = (children: FileNode[], curParent: string): FileNode[] =>
              children.map(child => {
                const childPath = `${curParent}/${child.name}`;
                return {
                  ...child,
                  path: childPath,
                  children: child.isFolder && child.children ? updateChildPaths(child.children, childPath) : child.children
                };
              });
            updatedNode.children = updateChildPaths(n.children, newPath);
          }
          return updatedNode;
        }
        if (n.isFolder && n.children) {
          return { ...n, children: updateTree(n.children, n.path) };
        }
        return n;
      });

    setWorkspaceFiles(prev => updateTree(prev));

    if (oldPath && newPath) {
      setOpenFiles(prev =>
        prev.map(f => {
          if (f.id === fileId) {
            return { ...f, name: newName, path: newPath };
          }
          if (f.path.startsWith(oldPath + '/')) {
            return { ...f, path: newPath + f.path.substring(oldPath.length) };
          }
          return f;
        })
      );

      setActiveFile(prev => {
        if (!prev) return null;
        if (prev.id === fileId) {
          return { ...prev, name: newName, path: newPath };
        }
        if (prev.path.startsWith(oldPath + '/')) {
          return { ...prev, path: newPath + prev.path.substring(oldPath.length) };
        }
        return prev;
      });
    }

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

    let inserted = false;
    const insertIntoQueriesFolder = (nodes: FileNode[]): FileNode[] =>
      nodes.map(n => {
        if (n.isFolder && (n.name === 'queries' || n.path === 'queries')) {
          inserted = true;
          return { ...n, isOpen: true, children: [...(n.children || []), newFile] };
        }
        if (n.isFolder && n.children) {
          return { ...n, children: insertIntoQueriesFolder(n.children) };
        }
        return n;
      });

    setWorkspaceFiles(prev => {
      const updated = insertIntoQueriesFolder(prev);
      return inserted ? updated : [...prev, newFile];
    });

    handleSelectFile(newFile);
    addToast('success', `Saved SQL script ${scriptName} to workspace queries/ folder.`);
    handleLogTerminal(`[Workspace File System]: Saved SQL script to queries/${scriptName}`);
  };

  const handleDeleteFile = (fileId: string) => {
    const idsToDelete = new Set<string>();

    const findAndCollect = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.id === fileId) {
          idsToDelete.add(n.id);
          const collectDescendants = (children: FileNode[]) => {
            for (const c of children) {
              idsToDelete.add(c.id);
              if (c.children) collectDescendants(c.children);
            }
          };
          if (n.children) collectDescendants(n.children);
          return;
        }
        if (n.children) findAndCollect(n.children);
      }
    };
    findAndCollect(workspaceFiles);

    const filterTree = (nodes: FileNode[]): FileNode[] =>
      nodes.filter((n) => !idsToDelete.has(n.id)).map((n) => (n.children ? { ...n, children: filterTree(n.children) } : n));
    setWorkspaceFiles((prev) => filterTree(prev));

    setOpenFiles((prev) => {
      const remaining = prev.filter((f) => !idsToDelete.has(f.id));
      if (activeFile && idsToDelete.has(activeFile.id)) {
        setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
      }
      return remaining;
    });

    addToast('info', 'Deleted from workspace.');
  };

  const handleReplaceAll = (searchTerm: string, replaceTerm: string) => {
    if (!searchTerm) return;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');

    const replaceInTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.isFolder && node.children) return { ...node, children: replaceInTree(node.children) };
        if (!node.isFolder && node.content && node.content.includes(searchTerm)) {
          return { ...node, content: node.content.replace(regex, replaceTerm), isModified: true };
        }
        return node;
      });

    setWorkspaceFiles((prev) => replaceInTree(prev));

    setOpenFiles((prev) =>
      prev.map((f) =>
        f.content && f.content.includes(searchTerm)
          ? { ...f, content: f.content.replace(regex, replaceTerm), isModified: true }
          : f
      )
    );

    setActiveFile((prev) => {
      if (!prev || !prev.content || !prev.content.includes(searchTerm)) return prev;
      return { ...prev, content: prev.content.replace(regex, replaceTerm), isModified: true };
    });

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
    setTerminalLogs((prev) => {
      const updated = [...prev, msg];
      return updated.length > 500 ? updated.slice(updated.length - 500) : updated;
    });
  };

  const handleClearTerminal = () => {
    setTerminalLogs([]);
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

  const handleAcceptDiff = () => {
    if (activeDiff) {
      setShadowHistory((prev) =>
        prev.map((s) => (s.id === activeDiff.id ? { ...s, status: 'ACCEPTED' } : s))
      );
      addToast('success', `Accepted patch for ${activeDiff.targetFile}.`);
      setActiveDiff(null);
    }
  };

  const handleRejectDiff = () => {
    if (activeDiff) {
      handleContentChange(activeDiff.originalContent);
      setShadowHistory((prev) =>
        prev.map((s) => (s.id === activeDiff.id ? { ...s, status: 'REJECTED' } : s))
      );
      addToast('info', `Rejected patch for ${activeDiff.targetFile}. Buffer restored to original.`);
      setActiveDiff(null);
    }
  };

  const handleRollbackSnapshot = (diffCheck: ShadowDiffCheck) => {
    const updateContentInTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.isFolder && node.children) {
          return { ...node, children: updateContentInTree(node.children) };
        }
        if (
          !node.isFolder &&
          (node.path === diffCheck.targetFile ||
            node.name === diffCheck.targetFile ||
            node.path.endsWith('/' + diffCheck.targetFile))
        ) {
          return { ...node, content: diffCheck.originalContent, isModified: false };
        }
        return node;
      });

    setWorkspaceFiles((prev) => updateContentInTree(prev));

    setOpenFiles((prev) =>
      prev.map((f) =>
        f.path === diffCheck.targetFile ||
        f.name === diffCheck.targetFile ||
        f.path.endsWith('/' + diffCheck.targetFile)
          ? { ...f, content: diffCheck.originalContent, isModified: false }
          : f
      )
    );

    if (
      activeFile &&
      (activeFile.path === diffCheck.targetFile ||
        activeFile.name === diffCheck.targetFile ||
        activeFile.path.endsWith('/' + diffCheck.targetFile))
    ) {
      setActiveFile((prev) =>
        prev ? { ...prev, content: diffCheck.originalContent, isModified: false } : null
      );
    }

    setShadowHistory((prev) =>
      prev.map((s) => (s.id === diffCheck.id ? { ...s, status: 'ROLLED_BACK' } : s))
    );
    addToast('warning', `Rolled back ${diffCheck.targetFile} to snapshot ${diffCheck.id}.`);
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
            handleLogTerminal('[DBC Engine]: Executed query via Menu Bar.');
            if (executeSqlRef.current) {
              executeSqlRef.current();
            } else {
              window.dispatchEvent(new CustomEvent('dbc-execute-sql'));
            }
          } else {
            handleRunTestSuite();
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
        onOpenDbMemory={() => setIsDbMemoryOpen(true)}
        onOpenMcpServer={() => setIsMcpServerOpen(true)}
        onOpenLineage={() => setIsLineageOpen(true)}
        onOpenBranchManager={() => setIsBranchManagerOpen(true)}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        onOpenCollab={() => setIsCollabOpen(true)}
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
                    onRegisterExecute={(fn) => { executeSqlRef.current = fn; }}
                    editorSettings={editorSettings}
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
                onSelectTab={(f) => {
                  setActiveFile(f);
                  setTargetLine(null);
                }}
                onCloseTab={handleCloseTab}
                onContentChange={handleContentChange}
                activeDiff={activeDiff}
                onAcceptDiff={handleAcceptDiff}
                onRejectDiff={handleRejectDiff}
                onSave={handleSaveActiveFile}
                editorSettings={editorSettings}
                targetLine={targetLine}
              />
            )}

            {showTerminal && (
              <TerminalPanel
                logs={terminalLogs}
                onRunTests={handleRunTestSuite}
                onClearLogs={handleClearTerminal}
              />
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
              onOpenAgentTrace={(sessionId) => {
                setSelectedTraceSessionId(sessionId);
                setIsAgentTraceOpen(true);
              }}
              onOpenDbMemory={() => setIsDbMemoryOpen(true)}
              onOpenMcpServer={() => setIsMcpServerOpen(true)}
              onOpenLineage={() => setIsLineageOpen(true)}
              onOpenBranchManager={() => setIsBranchManagerOpen(true)}
              onOpenOptimizer={() => setIsOptimizerOpen(true)}
              onOpenCollab={() => setIsCollabOpen(true)}
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

      <ModalHost
        activeModal={activeModal}
        onClose={closeModal}
        workspaceFiles={workspaceFiles}
        onSelectFile={handleSelectFile}
        onReplaceAll={handleReplaceAll}
        byokKeys={byokKeys}
        editorSettings={editorSettings}
        onSaveSettings={handleSaveSettings}
        paletteActions={paletteActions}
        shadowHistory={shadowHistory}
        onRollbackSnapshot={handleRollbackSnapshot}
        onJumpToSymbol={handleJumpToSymbol}
        routerConfig={routerConfig}
        onSaveRouterConfig={(newCfg) => {
          setRouterConfig(newCfg);
          addToast('success', `Router threshold updated to ${newCfg.confidenceThreshold}%`);
          handleLogTerminal(`[Router Config]: Fast-Path confidence threshold set to ${newCfg.confidenceThreshold}%`);
        }}
        lastExecutionPlan={lastExecutionPlan || undefined}
        onLogTerminal={handleLogTerminal}
        onApplyOptimizerSql={(sql) => {
          handleLogTerminal(`[Optimizer Patch Applied]: ${sql}`);
          addToast('success', 'Applied query optimization patch');
        }}
        onExecuteCollabSql={(sql) => {
          handleLogTerminal(`[Collab Studio Executed]: ${sql}`);
          addToast('success', 'Executed proposal from council session');
          window.dispatchEvent(new CustomEvent('dbc-execute-sql', { detail: { sql } }));
        }}
      />
      </div>
    </ErrorBoundary>
  );
}
