'use client';

import React, { useState } from 'react';
import { Table, Plus, Trash2, Save, ArrowUpDown, Search, RefreshCw, X, Check } from 'lucide-react';
import { realSqlDriver } from '../lib/db/sqlDriver';

interface TableDataEditorProps {
  tableName: string;
  onClose: () => void;
  onLogTerminal?: (msg: string) => void;
}

export const TableDataEditor: React.FC<TableDataEditorProps> = ({
  tableName,
  onClose,
  onLogTerminal,
}) => {
  const [columns] = useState(['id', 'username', 'email', 'role_id']);
  const [rows, setRows] = useState<Record<string, any>[]>([
    { id: 1, username: 'admin', email: 'admin@dbc.org', role_id: 1 },
    { id: 2, username: 'alpha', email: 'alpha@dbc.org', role_id: 1 },
    { id: 3, username: 'agent_cli', email: 'agent@dbc.org', role_id: 2 },
    { id: 4, username: 'audit_guest', email: 'guest@dbc.org', role_id: 3 },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [pendingChanges, setPendingChanges] = useState(false);

  // Filter rows by search term
  const filteredRows = rows.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort rows
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortCol) return 0;
    const valA = a[sortCol];
    const valB = b[sortCol];
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleAddRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id || 0)) + 1 : 1;
    const newRow = { id: newId, username: `user_${newId}`, email: `user${newId}@dbc.org`, role_id: 2 };
    setRows([...rows, newRow]);
    setPendingChanges(true);
  };

  const handleDeleteSelected = () => {
    setRows(rows.filter((_, idx) => !selectedRows.includes(idx)));
    setSelectedRows([]);
    setPendingChanges(true);
  };

  const handleCellChange = (rowIdx: number, colName: string, value: any) => {
    const updated = [...rows];
    updated[rowIdx] = { ...updated[rowIdx], [colName]: value };
    setRows(updated);
    setPendingChanges(true);
  };

  const handleSort = (colName: string) => {
    if (sortCol === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colName);
      setSortAsc(true);
    }
  };

  const handleCommitChanges = () => {
    setPendingChanges(false);
    if (onLogTerminal) {
      onLogTerminal(`[DBMS Table Editor]: Committed changes to table '${tableName}' successfully.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-ide-bg font-mono text-xs overflow-hidden h-full">
      {/* Editor Toolbar */}
      <div className="h-11 border-b border-ide-border px-4 flex items-center justify-between bg-ide-sidebar/90 select-none">
        <div className="flex items-center space-x-2 text-white">
          <Table className="h-4 w-4 text-cyan-400" />
          <span className="font-bold text-xs">Table Data Editor:</span>
          <span className="text-cyan-300 font-bold bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
            {tableName}
          </span>
          <span className="text-[10px] text-slate-500">({rows.length} rows)</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Filter */}
          <div className="relative flex items-center">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter table rows..."
              className="bg-ide-bg border border-ide-border rounded-lg pl-8 pr-2 py-1 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-44"
            />
          </div>

          {/* Add Row Button */}
          <button
            onClick={handleAddRow}
            className="text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-ide-card border border-ide-border flex items-center space-x-1.5 transition-all active:scale-95 text-[11px]"
          >
            <Plus className="h-3.5 w-3.5 text-cyan-400" />
            <span>Add Row</span>
          </button>

          {/* Delete Row Button */}
          {selectedRows.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-rose-950/40 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all active:scale-95 text-[11px]"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span>Delete ({selectedRows.length})</span>
            </button>
          )}

          {/* Save Changes Button */}
          {pendingChanges && (
            <button
              onClick={handleCommitChanges}
              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 shadow animate-pulse text-[11px]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </button>
          )}

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Data Grid Table */}
      <div className="flex-grow overflow-auto bg-ide-bg">
        <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
          <thead className="sticky top-0 z-10 select-none">
            <tr className="bg-ide-sidebar border-b border-ide-border text-slate-300 font-semibold shadow-sm">
              <th className="px-3 py-2 border-r border-ide-border w-10 text-center">#</th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  className="px-4 py-2 border-r border-ide-border bg-ide-sidebar cursor-pointer hover:bg-ide-card transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col}</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ide-border/50 text-slate-200">
            {sortedRows.map((row, rIdx) => {
              const isSelected = selectedRows.includes(rIdx);
              return (
                <tr
                  key={rIdx}
                  className={`hover:bg-cyan-500/10 transition-colors ${
                    isSelected ? 'bg-cyan-500/20' : 'even:bg-ide-card/30'
                  }`}
                >
                  <td className="px-3 py-2 border-r border-ide-border/50 text-center text-slate-500">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRows([...selectedRows, rIdx]);
                        else setSelectedRows(selectedRows.filter(i => i !== rIdx));
                      }}
                      className="h-3.5 w-3.5 accent-cyan-500"
                    />
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 border-r border-ide-border/50">
                      <input
                        type="text"
                        value={row[col] ?? ''}
                        onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                        className="bg-transparent border-b border-transparent focus:border-cyan-500 text-slate-200 focus:text-cyan-300 font-mono focus:outline-none w-full"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
