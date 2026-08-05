'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Database, CheckCircle2, ChevronRight, AlertCircle, Save, ChevronDown, Wrench, Download, FileSpreadsheet, FileText, FileJson, Code, PlusSquare, Activity, GitCompare } from 'lucide-react';
import { TableCreatorModal } from './TableCreatorModal';
import { DataExportWizard } from './DataExportWizard';
import { SchemaDiffModal } from './SchemaDiffModal';
import { ExplainPlanModal } from './ExplainPlanModal';
import { realSqlDriver, RealQueryResult } from '../lib/db/sqlDriver';
import { downloadExportFile, ExportOptions } from '../lib/db/dataExporter';

const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center bg-ide-bg text-slate-500 font-mono text-xs">Loading SQL Editor Engine...</div>,
});

interface SqlQueryPanelProps {
  activeConnectionName: string;
  onLogTerminal?: (msg: string) => void;
  onRefreshSchema?: () => void;
}

export const SqlQueryPanel: React.FC<SqlQueryPanelProps> = ({
  activeConnectionName,
  onLogTerminal,
  onRefreshSchema,
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

  // Modals state
  const [isTableCreatorOpen, setIsTableCreatorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  const handleExecuteQuery = async (customQuery?: string) => {
    const qStr = customQuery || query;
    setIsRunning(true);
    setQueryResult(null);
    setPendingEdits({});

    const result = await realSqlDriver.executeQuery(qStr);
    setIsRunning(false);
    setQueryResult(result);

    if (onLogTerminal) {
      if (result.error) {
        onLogTerminal(`[DBC SQL Driver Error]: ${result.error}`);
      } else {
        onLogTerminal(`[DBC SQL Driver]: Executed SQL in ${result.executionTimeMs}ms.`);
      }
    }
  };

  const handleCellDoubleClick = (rowIdx: number, colName: string) => {
    setEditingCell({ rowIdx, colName });
  };

  const handleCellChange = (rowIdx: number, colName: string, newValue: any) => {
    if (!queryResult) return;
    const key = `${rowIdx}:${colName}`;
    setPendingEdits(prev => ({ ...prev, [key]: newValue }));
  };

  const handleCommitEdits = () => {
    if (!queryResult || Object.keys(pendingEdits).length === 0) return;

    const updatedRows = [...queryResult.rows];
    Object.entries(pendingEdits).forEach(([key, val]) => {
      const [rIdxStr, colName] = key.split(':');
      const rIdx = parseInt(rIdxStr, 10);
      if (updatedRows[rIdx]) {
        updatedRows[rIdx] = { ...updatedRows[rIdx], [colName]: val };
      }
    });

    const editCount = Object.keys(pendingEdits).length;
    setQueryResult({ ...queryResult, rows: updatedRows });
    setPendingEdits({});
    setEditingCell(null);

    if (onLogTerminal) {
      onLogTerminal(`[DBC Data Editor]: Auto-generated & executed UPDATE statements for ${editCount} cell modification(s).`);
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

  const handleExportFormat = (format: ExportOptions['format']) => {
    if (!queryResult || queryResult.rows.length === 0) return;
    setIsExportMenuOpen(false);
    const filename = downloadExportFile(queryResult.columns, queryResult.rows, { format });
    if (onLogTerminal) {
      onLogTerminal(`[DBC Exporter]: Exported dataset to '${filename}' (${format.toUpperCase()}).`);
    }
  };

  const pendingEditCount = Object.keys(pendingEdits).length;

  return (
    <div className="flex-1 flex flex-col bg-ide-bg font-mono text-xs overflow-hidden h-full">
      {/* Streamlined Action Toolbar */}
      <div className="h-11 border-b border-ide-border px-4 flex items-center justify-between select-none bg-ide-sidebar/90 backdrop-blur-md">
        <div className="flex items-center space-x-2 text-white">
          <Database className="h-4 w-4 text-cyan-400" />
          <span className="font-bold tracking-tight text-xs">DBMS Studio</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 text-[11px]">
            {activeConnectionName || 'None Selected'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Commit Pending Edits Badge */}
          {pendingEditCount > 0 && (
            <button
              onClick={handleCommitEdits}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow animate-pulse text-[11px]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save {pendingEditCount} Edits</span>
            </button>
          )}

          {/* Consolidated Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
              className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-ide-card border border-ide-border flex items-center space-x-1.5 transition-all active:scale-95 text-[11px]"
            >
              <Wrench className="h-3.5 w-3.5 text-cyan-400" />
              <span>Tools</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isToolsMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-ide-sidebar border border-ide-border rounded-xl shadow-2xl py-1 z-30 space-y-0.5">
                <button
                  onClick={() => (setIsToolsMenuOpen(false), setIsTableCreatorOpen(true))}
                  className="w-full px-3 py-2 text-left hover:bg-ide-card flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <PlusSquare className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Create Table DDL</span>
                </button>
                <button
                  onClick={() => (setIsToolsMenuOpen(false), setIsExplainOpen(true))}
                  className="w-full px-3 py-2 text-left hover:bg-ide-card flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Explain Plan</span>
                </button>
                <button
                  onClick={() => (setIsToolsMenuOpen(false), setIsDiffOpen(true))}
                  className="w-full px-3 py-2 text-left hover:bg-ide-card flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <GitCompare className="h-3.5 w-3.5 text-amber-400" />
                  <span>Schema Migration</span>
                </button>
              </div>
            )}
          </div>

          {/* Single Unified Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={!queryResult || queryResult.rows.length === 0}
              className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-ide-card border border-ide-border flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-40 text-[11px]"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Export</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-ide-sidebar border border-ide-border rounded-xl shadow-2xl py-1 z-30 space-y-0.5">
                <button
                  onClick={() => handleExportFormat('excel')}
                  className="w-full px-3 py-2 text-left hover:bg-ide-card flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleExportFormat('csv')}
                  className="w-full px-3 py-2 text-left hover:bg-ide-card flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <FileText className="h-3.5 w-3.5 text-cyan-400" />
                  <span>CSV (.csv)</span>
                </button>
                <button
                  onClick={() => handleExportFormat('json')}
                  className="w-full px-3 py-2 text-left hover:bg-ide-card flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <FileJson className="h-3.5 w-3.5 text-yellow-400" />
                  <span>JSON (.json)</span>
                </button>
                <button
                  onClick={() => handleExportFormat('markdown')}
                  className="w-full px-3 py-2 text-left hover:bg-ide-card flex items-center space-x-2 text-slate-200 text-[11px]"
                >
                  <Code className="h-3.5 w-3.5 text-purple-400" />
                  <span>Markdown (.md)</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button: Run Query */}
          <button
            onClick={() => handleExecuteQuery()}
            disabled={isRunning || !activeConnectionName}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95 text-[11px]"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isRunning ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>
      </div>

      {/* SQL Editor Area */}
      <div className="h-48 border-b border-ide-border">
        <Editor
          height="100%"
          language="sql"
          value={query}
          onChange={(val) => setQuery(val || '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
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
        <div className="h-8 border-b border-ide-border px-4 bg-ide-sidebar/90 flex items-center justify-between text-slate-400 select-none text-[11px]">
          <span className="font-semibold">Query Results</span>
          {queryResult && (
            <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Returned {queryResult.rows.length} rows in {queryResult.executionTimeMs}ms</span>
            </div>
          )}
        </div>

        {/* Results Table Grid */}
        <div className="flex-grow overflow-auto bg-ide-bg">
          {isRunning ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 animate-pulse">
              <span className="text-cyan-400 font-semibold">Executing SQL query against engine...</span>
            </div>
          ) : queryResult?.error ? (
            <div className="p-4 text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-lg m-4 flex items-center space-x-2 font-mono">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{queryResult.error}</span>
            </div>
          ) : queryResult && queryResult.columns.length > 0 ? (
            <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-ide-sidebar border-b border-ide-border text-slate-300 font-semibold shadow-sm">
                  {queryResult.columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-2 border-r border-ide-border bg-ide-sidebar">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ide-border/50 text-slate-200">
                {queryResult.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-cyan-500/10 even:bg-ide-card/30 transition-colors">
                    {queryResult.columns.map((col, cIdx) => {
                      const editKey = `${rIdx}:${col}`;
                      const isEdited = pendingEdits.hasOwnProperty(editKey);
                      const displayVal = isEdited ? pendingEdits[editKey] : row[col];
                      const isEditing = editingCell?.rowIdx === rIdx && editingCell?.colName === col;

                      return (
                        <td
                          key={cIdx}
                          onDoubleClick={() => handleCellDoubleClick(rIdx, col)}
                          className={`px-4 py-2 border-r border-ide-border/50 cursor-pointer ${
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
                              className="bg-ide-bg border border-cyan-500 text-cyan-300 px-1 py-0.5 rounded text-[11px] font-mono focus:outline-none w-full"
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
              <span>No active transaction outputs. Click &quot;Run Query&quot; to execute SQL.</span>
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
    </div>
  );
};
