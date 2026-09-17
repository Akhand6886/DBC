'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Play, Database, ChevronRight, AlertCircle, Save, ChevronDown, Wrench, Download, FileSpreadsheet, FileText, FileJson, Code, PlusSquare, Activity, GitCompare, FileCode, ShieldAlert, ShieldCheck, RotateCcw } from 'lucide-react';
import { TableCreatorModal } from '../modals/TableCreatorModal';
import { DataExportWizard } from './DataExportWizard';
import { SchemaDiffModal } from '../modals/SchemaDiffModal';
import { ExplainPlanModal } from '../modals/ExplainPlanModal';
import { HumanApprovalModal } from '../modals/HumanApprovalModal';
import { realSqlDriver, RealQueryResult } from '../../lib/db/sqlDriver';
import { queryFirewall, RiskAssessment } from '../../lib/db/queryFirewall';
import { transactionManager, RollbackSnapshot, DryRunResult } from '../../lib/db/transactionManager';
import { downloadExportFile, ExportOptions } from '../../lib/db/dataExporter';
import { EditorSettings, defineMonacoThemes, getMonacoThemeName } from '../../lib/monacoThemes';

const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center bg-[#1e1e1e] text-slate-500 font-mono text-xs">Loading SQL Editor Engine...</div>,
});

interface SqlQueryPanelProps {
  activeConnectionName: string;
  onLogTerminal?: (msg: string) => void;
  onRefreshSchema?: () => void;
  onSaveScriptToWorkspace?: (scriptName: string, content: string) => void;
  onRegisterExecute?: (executeFn: () => void) => void;
  editorSettings?: EditorSettings;
}

export const SqlQueryPanel: React.FC<SqlQueryPanelProps> = ({
  activeConnectionName,
  onLogTerminal,
  onRefreshSchema,
  onSaveScriptToWorkspace,
  onRegisterExecute,
  editorSettings,
}) => {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<RealQueryResult | null>(null);

  // Inline Cell Editing state
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colName: string } | null>(null);
  const [pendingEdits, setPendingEdits] = useState<Record<string, any>>({});

  // Dropdown states
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);

  // Modals state
  const [isTableCreatorOpen, setIsTableCreatorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const isRunningRef = useRef(false);

  // P0: Firewall & Transaction States
  const [pendingApproval, setPendingApproval] = useState<{
    assessment: RiskAssessment;
    dryRunResult: DryRunResult | null;
    sqlToExecute: string;
  } | null>(null);
  const [rollbackHistory, setRollbackHistory] = useState<RollbackSnapshot[]>(() => transactionManager.getHistory());

  // Real-time Query Firewall live risk assessment as user types
  const liveRisk = useMemo(() => {
    if (!query.trim()) return null;
    const known = realSqlDriver.introspectSchema().map(t => t.name);
    return queryFirewall.evaluateQuery(query, known);
  }, [query]);

  const handleExecuteQuery = async (customQuery?: string, skipApproval = false): Promise<RealQueryResult> => {
    const qStr = (customQuery || query).trim();
    if (!qStr) return { columns: [], rows: [], executionTimeMs: 0 };

    const known = realSqlDriver.introspectSchema().map(t => t.name);
    const assessment = queryFirewall.evaluateQuery(qStr, known);

    if (assessment.isBlocked) {
      const err = `[Query Firewall BLOCKED]: ${assessment.violations.join('; ')}`;
      if (onLogTerminal) onLogTerminal(err);
      return { columns: [], rows: [], executionTimeMs: 0, error: err };
    }

    if (!skipApproval && assessment.requiresApproval) {
      const dryRes = transactionManager.dryRun(qStr);
      setPendingApproval({ assessment, dryRunResult: dryRes, sqlToExecute: qStr });
      return { columns: [], rows: [], executionTimeMs: 0 };
    }

    if (isRunningRef.current) {
      return { columns: [], rows: [], executionTimeMs: 0 };
    }
    isRunningRef.current = true;
    setIsRunning(true);

    try {
      setQueryResult(null);
      setPendingEdits({});

      const { result, snapshot } = await transactionManager.executeWithSnapshot(qStr);
      setQueryResult(result);
      setRollbackHistory(transactionManager.getHistory());

      if (onLogTerminal) {
        if (result.error) {
          onLogTerminal(`[DBC SQL Driver Error]: ${result.error}`);
        } else {
          onLogTerminal(`[DBC SQL Driver]: Executed SQL in ${result.executionTimeMs}ms${snapshot ? ` (Snapshot: ${snapshot.id})` : ''}.`);
        }
      }
      return result;
    } finally {
      isRunningRef.current = false;
      setIsRunning(false);
    }
  };

  const handleRollbackSnapshot = (snapshotId: string) => {
    const ok = transactionManager.rollbackSnapshot(snapshotId);
    if (ok) {
      setRollbackHistory(transactionManager.getHistory());
      if (onLogTerminal) onLogTerminal(`[DBC Transaction Manager]: Restored snapshot ${snapshotId} via inverted transaction rollback.`);
      if (onRefreshSchema) onRefreshSchema();
      handleExecuteQuery(undefined, true);
    }
  };

  useEffect(() => {
    if (onRegisterExecute) {
      onRegisterExecute(() => {
        handleExecuteQuery();
      });
    }
    const handleGlobalExec = () => {
      handleExecuteQuery();
    };
    window.addEventListener('dbc-execute-sql', handleGlobalExec);
    return () => {
      if (onRegisterExecute) {
        onRegisterExecute(() => {});
      }
      window.removeEventListener('dbc-execute-sql', handleGlobalExec);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, onRegisterExecute]);

  // DB-04: Keyboard accessibility & Escape key listener for tools & export menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isToolsMenuOpen || isExportMenuOpen)) {
        setIsToolsMenuOpen(false);
        setIsExportMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isToolsMenuOpen, isExportMenuOpen]);

  const handleCellDoubleClick = (rowIdx: number, colName: string) => {
    setEditingCell({ rowIdx, colName });
  };

  const handleCellChange = (rowIdx: number, colName: string, newValue: any) => {
    if (!queryResult) return;
    const key = `${rowIdx}:${colName}`;
    setPendingEdits(prev => ({ ...prev, [key]: newValue }));
  };

  const handleCommitEdits = async () => {
    if (!queryResult || Object.keys(pendingEdits).length === 0) return;

    // Detect target table from the SQL query (e.g., SELECT ... FROM users ...)
    const fromMatch = query.match(/\bFROM\s+([a-zA-Z0-9_]+)/i);
    const targetTable = fromMatch ? fromMatch[1] : null;

    const updatedRows = [...queryResult.rows];
    let executedSqlCount = 0;

    for (const [key, val] of Object.entries(pendingEdits)) {
      const [rIdxStr, colName] = key.split(':');
      const rIdx = parseInt(rIdxStr, 10);
      const originalRow = queryResult.rows[rIdx];
      if (originalRow) {
        updatedRows[rIdx] = { ...updatedRows[rIdx], [colName]: val };

        if (targetTable) {
          const escapedVal = typeof val === 'number' ? val : `'${String(val).replace(/'/g, "''")}'`;
          let whereClause = '';
          if (originalRow.id !== undefined) {
            whereClause = `id = ${typeof originalRow.id === 'number' ? originalRow.id : `'${originalRow.id}'`}`;
          } else {
            whereClause = Object.entries(originalRow)
              .filter(([k]) => k !== colName)
              .map(([k, v]) => `${k} = ${typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`}`)
              .join(' AND ');
          }
          if (whereClause) {
            const updateSql = `UPDATE ${targetTable} SET ${colName} = ${escapedVal} WHERE ${whereClause};`;
            await realSqlDriver.executeQuery(updateSql);
            executedSqlCount++;
          }
        }
      }
    }

    const editCount = Object.keys(pendingEdits).length;
    setQueryResult({ ...queryResult, rows: updatedRows });
    setPendingEdits({});
    setEditingCell(null);

    if (onRefreshSchema) {
      onRefreshSchema();
    }

    if (onLogTerminal) {
      onLogTerminal(`[DBC Data Editor]: Auto-generated & executed ${executedSqlCount} UPDATE statement(s) against table '${targetTable || 'unknown'}' for ${editCount} cell modification(s).`);
    }
  };

  const handleExecuteDDL = async (ddl: string) => {
    setIsTableCreatorOpen(false);
    setQuery(ddl);
    await handleExecuteQuery(ddl);
    if (onRefreshSchema) onRefreshSchema();
  };

  const handleApplyMigration = async (migrationSql: string) => {
    setIsDiffOpen(false);
    setQuery(migrationSql);
    await handleExecuteQuery(migrationSql);
    if (onLogTerminal) onLogTerminal('[DBC Schema Migration]: Applied UP migration script to active database connection.');
    if (onRefreshSchema) onRefreshSchema();
  };

  const handleApplyIndexSuggestion = async (indexSql: string) => {
    setIsExplainOpen(false);
    setQuery(indexSql);
    await handleExecuteQuery(indexSql);
    if (onLogTerminal) onLogTerminal('[AI Index Advisor]: Created B-Tree index to optimize query execution plan.');
    if (onRefreshSchema) onRefreshSchema();
  };

  const handleSaveToWorkspace = () => {
    setIsToolsMenuOpen(false);
    const fileName = `query_${Date.now().toString(36)}.sql`;
    if (onSaveScriptToWorkspace) {
      onSaveScriptToWorkspace(fileName, query);
    }
  };

  const handleExportFormat = async (format: ExportOptions['format']) => {
    setIsExportMenuOpen(false);
    let targetResult = queryResult;

    if (!targetResult || targetResult.rows.length === 0) {
      targetResult = await handleExecuteQuery();
    }

    if (targetResult && targetResult.rows.length > 0) {
      const filename = downloadExportFile(targetResult.columns, targetResult.rows, { format });
      if (onLogTerminal) {
        onLogTerminal(`[DBC Exporter]: Exported dataset to '${filename}' (${format.toUpperCase()}).`);
      }
    }
  };

  const pendingEditCount = Object.keys(pendingEdits).length;

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] font-mono text-xs overflow-hidden h-full">
      {/* Streamlined Action Toolbar */}
      <div className="min-h-[44px] border-b border-[#3c3c3c] px-2.5 sm:px-4 py-1.5 flex items-center justify-between select-none bg-[#252526] gap-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-white min-w-0">
          <Database className="h-4 w-4 text-[#007acc] flex-shrink-0" />
          <span className="font-bold tracking-tight text-xs hidden md:inline">DBMS Studio</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500 hidden md:inline flex-shrink-0" />
          <span className="text-[#007acc] font-bold bg-[#007acc]/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-[#007acc]/30 text-[11px] truncate max-w-[120px] sm:max-w-[220px]">
            {activeConnectionName || 'None Selected'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {/* Commit Pending Edits Badge */}
          {pendingEditCount > 0 && (
            <button
              onClick={handleCommitEdits}
              className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 sm:px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow animate-pulse text-[11px]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save {pendingEditCount} Edits</span>
            </button>
          )}

          {/* Consolidated Tools Dropdown */}
          <div className="relative">
            {isToolsMenuOpen && (
              <div
                className="fixed inset-0 z-20 bg-transparent cursor-default"
                onClick={() => setIsToolsMenuOpen(false)}
              />
            )}
            <button
              onClick={() => {
                setIsToolsMenuOpen(!isToolsMenuOpen);
                setIsExportMenuOpen(false);
              }}
              className="text-slate-300 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-[#2d2d2d] border border-[#3c3c3c] flex items-center space-x-1 sm:space-x-1.5 transition-all active:scale-95 text-[11px] relative z-20"
            >
              <Wrench className="h-3.5 w-3.5 text-[#007acc]" />
              <span className="hidden sm:inline">Tools</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isToolsMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-[#252526] border border-[#3c3c3c] rounded-xl shadow-2xl py-1 z-30 space-y-0.5">
                <button
                  onClick={handleSaveToWorkspace}
                  className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Save Script to Workspace</span>
                </button>
                <button
                  onClick={() => (setIsToolsMenuOpen(false), setIsTableCreatorOpen(true))}
                  className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <PlusSquare className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Create Table DDL</span>
                </button>
                <button
                  onClick={() => (setIsToolsMenuOpen(false), setIsExplainOpen(true))}
                  className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Explain Plan</span>
                </button>
                <button
                  onClick={() => (setIsToolsMenuOpen(false), setIsDiffOpen(true))}
                  className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <GitCompare className="h-3.5 w-3.5 text-amber-400" />
                  <span>Schema Migration</span>
                </button>
              </div>
            )}
          </div>

          {/* Single Unified Export Dropdown */}
          <div className="relative">
            {isExportMenuOpen && (
              <div
                className="fixed inset-0 z-20 bg-transparent cursor-default"
                onClick={() => setIsExportMenuOpen(false)}
              />
            )}
            <button
              onClick={() => {
                setIsExportMenuOpen(!isExportMenuOpen);
                setIsToolsMenuOpen(false);
              }}
              className="text-slate-300 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-[#2d2d2d] border border-[#3c3c3c] flex items-center space-x-1 sm:space-x-1.5 transition-all active:scale-95 text-[11px] relative z-20"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-[#252526] border border-[#3c3c3c] rounded-xl shadow-2xl py-1 z-30 space-y-0.5">
                <button
                  onClick={() => handleExportFormat('excel')}
                  className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExportFormat('csv')}
                  className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <FileText className="h-3.5 w-3.5 text-cyan-400" />
                  <span>CSV (.csv)</span>
                </button>
                <button
                  onClick={() => handleExportFormat('json')}
                  className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <FileJson className="h-3.5 w-3.5 text-yellow-400" />
                  <span>JSON (.json)</span>
                </button>
                <button
                  onClick={() => handleExportFormat('markdown')}
                  className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <Code className="h-3.5 w-3.5 text-purple-400" />
                  <span>Markdown (.md)</span>
                </button>
              </div>
            )}
          </div>

          {/* Transactions & 1-Click Rollback Dropdown */}
          <div className="relative">
            {isTransactionsOpen && (
              <div
                className="fixed inset-0 z-20 bg-transparent cursor-default"
                onClick={() => setIsTransactionsOpen(false)}
              />
            )}
            <button
              onClick={() => {
                setIsTransactionsOpen(!isTransactionsOpen);
                setIsToolsMenuOpen(false);
                setIsExportMenuOpen(false);
              }}
              className="text-slate-300 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-[#2d2d2d] border border-[#3c3c3c] flex items-center space-x-1 sm:space-x-1.5 transition-all active:scale-95 text-[11px] relative z-20"
            >
              <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">Rollbacks</span>
              {rollbackHistory.length > 0 && (
                <span className="bg-blue-500/30 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {rollbackHistory.length}
                </span>
              )}
            </button>

            {isTransactionsOpen && (
              <div className="absolute right-0 mt-1.5 w-80 bg-[#252526] border border-[#3c3c3c] rounded-xl shadow-2xl p-2 z-30 space-y-1.5 max-h-72 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#333333] flex justify-between items-center">
                  <span>Transaction Undo Snapshots</span>
                  <span className="text-blue-400">{rollbackHistory.length} recorded</span>
                </div>
                {rollbackHistory.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-[11px]">
                    No mutating transactions yet. Snapshots are auto-recorded on UPDATE/DELETE/DDL.
                  </div>
                ) : (
                  rollbackHistory.map((snap) => (
                    <div key={snap.id} className="p-2 rounded bg-[#1e1e1e] border border-[#333333] space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-slate-400">{snap.timestamp}</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                          snap.status === 'ROLLED_BACK' ? 'bg-amber-900/50 text-amber-300' : 'bg-emerald-900/50 text-emerald-300'
                        }`}>
                          {snap.status}
                        </span>
                      </div>
                      <div className="font-mono text-slate-200 truncate text-[11px]">
                        {snap.description}
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-[#2a2a2a] text-[10px]">
                        <span className="text-slate-400">{snap.affectedRowCount} row(s) affected</span>
                        {snap.status !== 'ROLLED_BACK' && (
                          <button
                            onClick={() => handleRollbackSnapshot(snap.id)}
                            className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1 text-[10px] transition"
                          >
                            <RotateCcw className="w-2.5 h-2.5" /> Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Live Query Firewall Risk Score Badge */}
          {liveRisk && (
            <div
              title={liveRisk.violations.join(' ') || liveRisk.warnings.join(' ') || 'Safe query'}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 border transition-all ${
                liveRisk.level === 'CRITICAL' ? 'bg-red-900/40 text-red-300 border-red-500/40' :
                liveRisk.level === 'HIGH' ? 'bg-amber-900/40 text-amber-300 border-amber-500/40' :
                liveRisk.level === 'MEDIUM' ? 'bg-yellow-900/40 text-yellow-300 border-yellow-500/40' :
                'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {liveRisk.level === 'SAFE' || liveRisk.level === 'LOW' ? (
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-amber-400" />
              )}
              <span className="hidden sm:inline">Firewall:</span> {liveRisk.level} ({liveRisk.score})
            </div>
          )}

          {/* Primary Action Button: Run Query */}
          <button
            onClick={() => handleExecuteQuery()}
            disabled={isRunning || !activeConnectionName}
            className="bg-[#007acc] hover:bg-[#005a9e] disabled:opacity-40 text-white px-3 sm:px-4 py-1.5 rounded-lg font-bold flex items-center space-x-1 sm:space-x-1.5 shadow transition-all active:scale-95 text-[11px]"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isRunning ? 'Running' : 'Run'}</span>
            <span className="hidden sm:inline">{isRunning ? '...' : ' Query'}</span>
          </button>
        </div>
      </div>

      {/* SQL Editor Area */}
      <div className="h-48 border-b border-[#3c3c3c]">
        <Editor
          height="100%"
          language="sql"
          value={query}
          onChange={(val) => setQuery(val || '')}
          beforeMount={(monaco) => defineMonacoThemes(monaco)}
          onMount={(editor, monaco) => {
            defineMonacoThemes(monaco);
            monaco.editor.setTheme(getMonacoThemeName(editorSettings?.theme));
            editor.onKeyDown((e) => {
              if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.Enter) {
                e.preventDefault();
                e.stopPropagation();
                handleExecuteQuery(editor.getValue());
              }
            });
          }}
          theme={getMonacoThemeName(editorSettings?.theme)}
          options={{
            fontSize: editorSettings?.fontSize || 13,
            tabSize: editorSettings?.tabSize || 2,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 10, bottom: 10 },
            automaticLayout: true,
          }}
        />
      </div>

      {/* Query Output Results Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Results Header */}
        <div className="h-8 border-b border-[#3c3c3c] px-2.5 sm:px-4 bg-[#252526] flex items-center justify-between text-slate-400 select-none text-[11px]">
          <span className="font-semibold">Query Results</span>
          {queryResult && (
            <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Returned {queryResult.rows.length} rows in {queryResult.executionTimeMs}ms</span>
              <span className="sm:hidden">{queryResult.rows.length} rows ({queryResult.executionTimeMs}ms)</span>
            </div>
          )}
        </div>

        {/* Results Table Grid */}
        <div className="flex-grow overflow-auto bg-[#1e1e1e]">
          {isRunning ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 animate-pulse">
              <span className="text-[#007acc] font-semibold">Executing SQL query against engine...</span>
            </div>
          ) : queryResult?.error ? (
            <div className="p-4 text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-lg m-4 flex items-center space-x-2 font-mono">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{queryResult.error}</span>
            </div>
          ) : queryResult && queryResult.columns.length > 0 ? (
            <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#252526] border-b border-[#3c3c3c] text-slate-300 font-semibold shadow-sm">
                  {queryResult.columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-2 border-r border-[#3c3c3c] bg-[#252526]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c3c3c]/50 text-slate-200">
                {queryResult.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#007acc]/10 even:bg-[#2d2d2d]/30 transition-colors">
                    {queryResult.columns.map((col, cIdx) => {
                      const editKey = `${rIdx}:${col}`;
                      const isEdited = pendingEdits.hasOwnProperty(editKey);
                      const displayVal = isEdited ? pendingEdits[editKey] : row[col];
                      const isEditing = editingCell?.rowIdx === rIdx && editingCell?.colName === col;

                      return (
                        <td
                          key={cIdx}
                          onDoubleClick={() => handleCellDoubleClick(rIdx, col)}
                          className={`px-4 py-2 border-r border-[#3c3c3c]/50 cursor-pointer ${
                            isEdited ? 'bg-amber-500/20 text-amber-300 font-bold' : ''
                          }`}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              autoFocus
                              value={displayVal}
                              onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                              className="bg-[#1e1e1e] border border-[#007acc] text-cyan-300 px-1 py-0.5 rounded text-[11px] font-mono focus:outline-none w-full"
                            />
                          ) : (
                            <span>{String(displayVal ?? 'NULL')}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <AlertCircle className="h-8 w-8 text-slate-600" />
              <span>No active transaction outputs. Click &quot;Run Query&quot; or &quot;Export&quot; to execute SQL.</span>
            </div>
          )}
        </div>
      </div>

      {/* Table Creator Modal */}
      {isTableCreatorOpen && (
        <TableCreatorModal
          onClose={() => setIsTableCreatorOpen(false)}
          onExecuteDDL={handleExecuteDDL}
        />
      )}

      {/* Migration Diff Modal */}
      {isDiffOpen && (
        <SchemaDiffModal
          onClose={() => setIsDiffOpen(false)}
          onApplyMigration={handleApplyMigration}
        />
      )}

      {/* EXPLAIN ANALYZE Plan Modal */}
      {isExplainOpen && (
        <ExplainPlanModal
          query={query}
          onClose={() => setIsExplainOpen(false)}
          onApplyIndexSuggestion={handleApplyIndexSuggestion}
        />
      )}

      {/* Export Wizard Modal */}
      {isExportOpen && (
        <DataExportWizard
          onClose={() => setIsExportOpen(false)}
          onExport={(options) => handleExportFormat(options.format)}
        />
      )}

      {/* Human Approval Gate Modal */}
      {pendingApproval && (
        <HumanApprovalModal
          assessment={pendingApproval.assessment}
          dryRunResult={pendingApproval.dryRunResult}
          onApprove={() => {
            const sql = pendingApproval.sqlToExecute;
            setPendingApproval(null);
            handleExecuteQuery(sql, true);
          }}
          onReject={() => setPendingApproval(null)}
        />
      )}
    </div>
  );
};
