'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Database, CheckCircle2, ChevronRight, AlertCircle, PlusSquare, Download } from 'lucide-react';
import { TableCreatorModal } from './TableCreatorModal';
import { DataExportWizard } from './DataExportWizard';

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
  const [results, setResults] = useState<{ columns: string[]; rows: Record<string, any>[] } | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Modals state
  const [isTableCreatorOpen, setIsTableCreatorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleExecuteQuery = (customQuery?: string) => {
    const qStr = customQuery || query;
    setIsRunning(true);
    setResults(null);
    const startTime = Date.now();

    setTimeout(() => {
      setIsRunning(false);
      setLatency(Date.now() - startTime);

      const mockColumns = ['id', 'username', 'email', 'role', 'created_at'];
      const mockRows = [
        { id: 1, username: 'admin', email: 'admin@dbc.org', role: 'Administrator', created_at: '2026-01-12' },
        { id: 2, username: 'alpha', email: 'alpha@dbc.org', role: 'Security Admin', created_at: '2026-03-04' },
        { id: 3, username: 'agent_cli', email: 'agent@dbc.org', role: 'API Agent', created_at: '2026-07-28' },
        { id: 4, username: 'audit_guest', email: 'guest@dbc.org', role: 'Auditor', created_at: '2026-07-30' }
      ];

      setResults({ columns: mockColumns, rows: mockRows });

      if (onLogTerminal) {
        onLogTerminal(`[DBC SQL Runner]: Executed SQL statement successfully.`);
      }
    }, 450);
  };

  const handleExecuteDDL = (ddl: string) => {
    setIsTableCreatorOpen(false);
    setQuery(ddl);
    handleExecuteQuery(ddl);
    if (onLogTerminal) onLogTerminal(`[DBC SQL Runner]: Executed DDL table creation transaction.`);
    if (onRefreshSchema) onRefreshSchema();
  };

  const handleExportData = (format: string, delimiter: string) => {
    setIsExportOpen(false);
    if (onLogTerminal) {
      onLogTerminal(`[DBC Export Wizard]: Generated transaction results dataset export in ${format.toUpperCase()} format.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-ide-bg font-mono text-xs overflow-hidden h-full">
      {/* Action Toolbar */}
      <div className="h-11 border-b border-ide-border px-4 flex items-center justify-between select-none bg-ide-sidebar/80 backdrop-blur-md">
        <div className="flex items-center space-x-2 text-white">
          <Database className="h-4 w-4 text-cyan-400" />
          <span className="font-bold tracking-tight text-xs">SQL Console</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-400 text-[11px]">Connection:</span>
          <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 shadow-sm">
            {activeConnectionName || 'None Selected'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Create Table Button */}
          <button
            onClick={() => setIsTableCreatorOpen(true)}
            disabled={!activeConnectionName}
            className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-ide-card border border-ide-border flex items-center space-x-1.5 transition-all active:scale-95 text-[11px]"
          >
            <PlusSquare className="h-3.5 w-3.5 text-cyan-400" />
            <span>Create Table</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!results}
            className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-ide-card border border-ide-border flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-40 text-[11px]"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export Data</span>
          </button>

          {/* Run Button */}
          <button
            onClick={() => handleExecuteQuery()}
            disabled={isRunning || !activeConnectionName}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95 text-[11px]"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Query'}</span>
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
          <span className="font-semibold">Query Output Results</span>
          {latency !== null && (
            <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Returned {results?.rows.length} rows in {latency}ms</span>
            </div>
          )}
        </div>

        {/* Results Table Grid */}
        <div className="flex-grow overflow-auto bg-ide-bg">
          {isRunning ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 animate-pulse">
              <span className="text-cyan-400 font-semibold">Executing SQL transaction...</span>
            </div>
          ) : results ? (
            <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
              <thead className="sticky top-0 z-10">
                <tr className="bg-ide-sidebar border-b border-ide-border text-slate-300 font-semibold shadow-sm">
                  {results.columns.map((col, idx) => (
                    <th key={idx} className="px-4 py-2 border-r border-ide-border bg-ide-sidebar">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ide-border/50 text-slate-200">
                {results.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-cyan-500/10 even:bg-ide-card/30 transition-colors">
                    {results.columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 border-r border-ide-border/50">
                        {String(row[col])}
                      </td>
                    ))}
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

      {/* Export Wizard Modal */}
      {isExportOpen && (
        <DataExportWizard
          onClose={() => setIsExportOpen(false)}
          onExport={handleExportData}
        />
      )}
    </div>
  );
};
