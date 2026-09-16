// Shell Domain
export { ActivityBar } from './shell/ActivityBar';
export type { ActivityView } from './shell/ActivityBar';
export { ErrorBoundary } from './shell/ErrorBoundary';
export { StatusBar } from './shell/StatusBar';
export { TerminalPanel } from './shell/TerminalPanel';
export { TopMenuBar } from './shell/TopMenuBar';

// Editor Domain
export { CodeEditor } from './editor/CodeEditor';
export { FileExplorer } from './editor/FileExplorer';
export { WelcomeTab } from './editor/WelcomeTab';

// DBMS Domain
export { DataExportWizard } from './dbms/DataExportWizard';
export { DbConnectionPanel } from './dbms/DbConnectionPanel';
export type { DbConnection } from './dbms/DbConnectionPanel';
export { DbObjectExplorer } from './dbms/DbObjectExplorer';
export { DbPerformanceMonitor } from './dbms/DbPerformanceMonitor';
export { SchemaVisualizer } from './dbms/SchemaVisualizer';
export { SqlQueryPanel } from './dbms/SqlQueryPanel';
export { TableDataEditor } from './dbms/TableDataEditor';

// Agents Domain
export { AgentTraceDrawer } from './agents/AgentTraceDrawer';
export { AnalyticsPanel } from './agents/AnalyticsPanel';
export { CollaborativeSessionModal } from './agents/CollaborativeSessionModal';
export { MissionControl } from './agents/MissionControl';
export { ShadowVerificationDrawer } from './agents/ShadowVerificationDrawer';
export { SidecarInspectorModal } from './agents/SidecarInspectorModal';

// Modals Domain
export { ModalHost } from './modals/ModalHost';
export type { ModalType, ActiveModalState } from './modals/ModalHost';
export { BranchManagerModal } from './modals/BranchManagerModal';
export { BrowserPreviewModal } from './modals/BrowserPreviewModal';
export { CommandPalette } from './modals/CommandPalette';
export type { PaletteAction } from './modals/CommandPalette';
export { DataLineageModal } from './modals/DataLineageModal';
export { DbMemoryModal } from './modals/DbMemoryModal';
export { ExplainPlanModal } from './modals/ExplainPlanModal';
export { GitPanel } from './modals/GitPanel';
export { HumanApprovalModal } from './modals/HumanApprovalModal';
export { McpServerModal } from './modals/McpServerModal';
export { PerformanceOptimizerModal } from './modals/PerformanceOptimizerModal';
export { RouterConfigModal } from './modals/RouterConfigModal';
export { RouterTraceModal } from './modals/RouterTraceModal';
export { SchemaDiffModal } from './modals/SchemaDiffModal';
export { SearchModal } from './modals/SearchModal';
export { SettingsModal } from './modals/SettingsModal';
export { ShortcutsModal } from './modals/ShortcutsModal';
export { TableCreatorModal } from './modals/TableCreatorModal';
export { TableInspectorModal } from './modals/TableInspectorModal';

// UI Domain
export { ToastProvider, useToast } from './ui/ToastProvider';
