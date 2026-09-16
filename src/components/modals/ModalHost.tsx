'use client';

import React from 'react';
import { SearchModal } from './SearchModal';
import { SettingsModal } from './SettingsModal';
import { ShortcutsModal } from './ShortcutsModal';
import { CommandPalette, PaletteAction } from './CommandPalette';
import { TableInspectorModal } from './TableInspectorModal';
import { RouterConfigModal } from './RouterConfigModal';
import { RouterTraceModal } from './RouterTraceModal';
import { DbMemoryModal } from './DbMemoryModal';
import { McpServerModal } from './McpServerModal';
import { DataLineageModal } from './DataLineageModal';
import { BranchManagerModal } from './BranchManagerModal';
import { PerformanceOptimizerModal } from './PerformanceOptimizerModal';
import { BrowserPreviewModal } from './BrowserPreviewModal';
import { GitPanel } from './GitPanel';
import { SidecarInspectorModal } from '../agents/SidecarInspectorModal';
import { AgentTraceDrawer } from '../agents/AgentTraceDrawer';
import { ShadowVerificationDrawer } from '../agents/ShadowVerificationDrawer';
import { CollaborativeSessionModal } from '../agents/CollaborativeSessionModal';
import { FileNode, ShadowDiffCheck, AgentExecutionPlan, RouterConfig } from '../../lib/types';
import { EditorSettings } from '../../lib/monacoThemes';

export type ModalType =
  | 'search'
  | 'settings'
  | 'shortcuts'
  | 'palette'
  | 'verification'
  | 'sidecar'
  | 'browser'
  | 'git'
  | 'tableInspector'
  | 'routerConfig'
  | 'routerTrace'
  | 'agentTrace'
  | 'dbMemory'
  | 'mcpServer'
  | 'dataLineage'
  | 'branchManager'
  | 'optimizer'
  | 'collab';

export interface ActiveModalState {
  type: ModalType;
  payload?: any;
}

export interface ModalHostProps {
  activeModal: ActiveModalState | null;
  onClose: () => void;

  // Search & Files
  workspaceFiles: FileNode[];
  onSelectFile: (file: FileNode) => void;
  onReplaceAll: (find: string, replace: string) => void;

  // Settings
  byokKeys: {
    openai?: string;
    anthropic?: string;
    gemini?: string;
    ollama?: string;
    nvidia?: string;
  };
  editorSettings: EditorSettings;
  onSaveSettings: (settings: any) => void;

  // Command Palette
  paletteActions: PaletteAction[];

  // Verification & Sidecar
  shadowHistory: ShadowDiffCheck[];
  onRollbackSnapshot: (diffCheck: ShadowDiffCheck) => void;
  onJumpToSymbol?: (filePath: string, line: number) => void;

  // Router & Trace
  routerConfig: RouterConfig;
  onSaveRouterConfig: (cfg: RouterConfig) => void;
  lastExecutionPlan?: AgentExecutionPlan | null;

  // Logging & Terminal
  onLogTerminal: (message: string) => void;

  // SQL & Optimizer
  onApplyOptimizerSql: (sql: string) => void;
  onExecuteCollabSql: (sql: string) => void;
}

export function ModalHost({
  activeModal,
  onClose,
  workspaceFiles,
  onSelectFile,
  onReplaceAll,
  byokKeys,
  editorSettings,
  onSaveSettings,
  paletteActions,
  shadowHistory,
  onRollbackSnapshot,
  onJumpToSymbol,
  routerConfig,
  onSaveRouterConfig,
  lastExecutionPlan,
  onLogTerminal,
  onApplyOptimizerSql,
  onExecuteCollabSql,
}: ModalHostProps) {
  if (!activeModal) return null;

  switch (activeModal.type) {
    case 'search':
      return (
        <SearchModal
          files={workspaceFiles}
          onSelectFile={onSelectFile}
          onClose={onClose}
          onReplaceAll={onReplaceAll}
        />
      );

    case 'settings':
      return (
        <SettingsModal
          initialKeys={byokKeys}
          initialSettings={editorSettings}
          onClose={onClose}
          onSaveSettings={onSaveSettings}
        />
      );

    case 'shortcuts':
      return <ShortcutsModal onClose={onClose} />;

    case 'palette':
      return <CommandPalette actions={paletteActions} onClose={onClose} />;

    case 'verification':
      return (
        <ShadowVerificationDrawer
          history={shadowHistory}
          onRollback={onRollbackSnapshot}
          onClose={onClose}
        />
      );

    case 'sidecar':
      return (
        <SidecarInspectorModal
          onJumpToSymbol={onJumpToSymbol || (() => {})}
          onClose={onClose}
        />
      );

    case 'browser':
      return <BrowserPreviewModal onClose={onClose} onLogTerminal={onLogTerminal} />;

    case 'git':
      return <GitPanel onClose={onClose} onLogTerminal={onLogTerminal} />;

    case 'tableInspector':
      return (
        <TableInspectorModal
          tableName={activeModal.payload || ''}
          onClose={onClose}
        />
      );

    case 'routerConfig':
      return (
        <RouterConfigModal
          config={routerConfig}
          onSaveConfig={onSaveRouterConfig}
          onClose={onClose}
        />
      );

    case 'routerTrace':
      return (
        <RouterTraceModal
          plan={lastExecutionPlan || null}
          onClose={onClose}
        />
      );

    case 'agentTrace':
      return (
        <AgentTraceDrawer
          isOpen={true}
          onClose={onClose}
          selectedSessionId={activeModal.payload}
        />
      );

    case 'dbMemory':
      return <DbMemoryModal isOpen={true} onClose={onClose} />;

    case 'mcpServer':
      return <McpServerModal isOpen={true} onClose={onClose} />;

    case 'dataLineage':
      return <DataLineageModal isOpen={true} onClose={onClose} />;

    case 'branchManager':
      return (
        <BranchManagerModal
          isOpen={true}
          onClose={onClose}
          onLogTerminal={onLogTerminal}
        />
      );

    case 'optimizer':
      return (
        <PerformanceOptimizerModal
          isOpen={true}
          onClose={onClose}
          onApplySql={onApplyOptimizerSql}
          onLogTerminal={onLogTerminal}
        />
      );

    case 'collab':
      return (
        <CollaborativeSessionModal
          isOpen={true}
          onClose={onClose}
          onExecuteSql={onExecuteCollabSql}
        />
      );

    default:
      return null;
  }
}
