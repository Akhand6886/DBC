'use client';

import React, { useState } from 'react';
import { Table, FileCode, Download, Check, AlertTriangle } from 'lucide-react';

interface DataPreviewTableProps {
  data?: any[];
  affectedRows?: number;
  error?: string;
  queryText?: string;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  data = [],
  affectedRows = 0,
  error,
  queryText,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [copied, setCopied] = useState(false);

  if (error) {
    return (
      <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-5 text-rose-300 space-y-2">
        <div className="flex items-center space-x-2 font-semibold text-rose-400">
          <AlertTriangle className="h-5 w-5" />
          <span>Execution Blocked by Policy Guardrail</span>
        </div>
        <p className="text-xs text-rose-200/80">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
        No records returned or operation completed with 0 affected rows.
      </div>
    );
  }

  const columns = Object.keys(data[0] || {});

  const handleExportCSV = () => {
    if (!data.length) return;
    const header = columns.join(',');
    const rows = data.map((row) => columns.map((col) => JSON.stringify(row[col] ?? '')).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Table Toolbar */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-200">
            Query Results ({data.length} records)
          </span>
          {affectedRows > 0 && (
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20">
              {affectedRows} rows affected
            </span>
          )}
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex space-x-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'json'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium border border-slate-700 transition-all"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Content View */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  {columns.map((col) => {
                    const val = row[col];
                    const isStatus = col.toLowerCase() === 'status' || col.toLowerCase() === 'tier';
                    return (
                      <td key={col} className="px-4 py-3 whitespace-nowrap">
                        {isStatus ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              String(val).toLowerCase() === 'active' || String(val).toLowerCase() === 'completed' || String(val).toLowerCase() === 'platinum'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : String(val).toLowerCase() === 'inactive' || String(val).toLowerCase() === 'suspended'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {String(val)}
                          </span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 bg-slate-950 font-mono text-xs text-cyan-300 overflow-x-auto max-h-96">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
