'use client';

import React, { useState, useEffect } from 'react';
import { Table, Plus, Trash2, Save, ArrowUpDown, Search, X, Inbox } from 'lucide-react';
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
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);

  // Load real table columns & live rows from driver
  useEffect(() => {
    const tableSchema = realSqlDriver.getTable(tableName);
    if (tableSchema && tableSchema.columns.length > 0) {
      setColumns(tableSchema.columns.map(c => c.name));
    } else {
      const existingData = realSqlDriver.getTableData(tableName);
      if (existingData.length > 0) {
        setColumns(Object.keys(existingData[0]));
      } else {
        setColumns(['id']);
      }
    }
    setRows(realSqlDriver.getTableData(tableName));
    setSelectedRows([]);
    setPendingChanges(false);
  }, [tableName]);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [pendingChanges, setPendingChanges] = useState(false);

  // Filter rows by search term
  const filteredRows = rows.filter(r =>
    Object.values(r).some(v => String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
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
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      if (col === 'id') {
        const maxId = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
        newRow[col] = maxId + 1;
      } else {
        newRow[col] = '';
      }
    });
    setRows([...rows, newRow]);
    setPendingChanges(true);
  };

  const handleDeleteSelected = () => {
    const remaining = rows.filter((_, idx) => !selectedRows.includes(idx));
    setRows(remaining);
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
    realSqlDriver.setTableData(tableName, rows);
    setPendingChanges(false);
    if (onLogTerminal) {
      onLogTerminal(`[DBMS Table Editor]: Committed ${rows.length} row(s) to table '${tableName}' successfully.`);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] font-mono text-xs overflow-hidden h-full">
      {/* Editor Toolbar */}
      <div className="min-h-[44px] border-b border-[#3c3c3c] px-2.5 sm:px-4 py-1.5 flex items-center justify-between bg-[#252526] select-none gap-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-white min-w-0">
          <Table className="h-4 w-4 text-[#007acc] flex-shrink-0" />
          <span className="font-bold text-xs hidden md:inline">Table:</span>
          <span className="text-[#007acc] font-bold bg-[#007acc]/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-[#007acc]/30 truncate max-w-[120px] sm:max-w-[200px]">
            {tableName}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">({rows.length} rows)</span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {/* Search Filter */}
          <div className="relative flex items-center">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter..."
              className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg pl-8 pr-2 py-1 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#007acc] w-28 sm:w-44 transition-all"
            />
          </div>

          {/* Add Row Button */}
          <button
            onClick={handleAddRow}
            className="text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-[#2d2d2d] border border-[#3c3c3c] flex items-center space-x-1 sm:space-x-1.5 transition-all active:scale-95 text-[11px]"
          >
            <Plus className="h-3.5 w-3.5 text-[#007acc]" />
            <span className="hidden sm:inline">Add Row</span>
          </button>

          {/* Delete Row Button */}
          {selectedRows.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-rose-950/40 text-rose-300 border border-rose-500/40 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 sm:space-x-1.5 transition-all active:scale-95 text-[11px]"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline">Delete </span>
              <span>({selectedRows.length})</span>
            </button>
          )}

          {/* Save Changes Button */}
          {pendingChanges && (
            <button
              onClick={handleCommitChanges}
              className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 sm:px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1 sm:space-x-1.5 shadow animate-pulse text-[11px]"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save Changes</span>
              <span className="sm:hidden">Save</span>
            </button>
          )}

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 ml-1" title="Close Editor">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Data Grid Table */}
      <div className="flex-grow overflow-auto bg-[#1e1e1e]">
        <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
          <thead className="sticky top-0 z-10 select-none">
            <tr className="bg-[#252526] border-b border-[#3c3c3c] text-slate-300 font-semibold shadow-sm">
              <th className="px-3 py-2 border-r border-[#3c3c3c] w-10 text-center">#</th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  className="px-4 py-2 border-r border-[#3c3c3c] bg-[#252526] cursor-pointer hover:bg-[#2d2d2d] transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col}</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3c3c3c]/50 text-slate-200">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-14 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Inbox className="h-7 w-7 text-slate-500" />
                    <span className="text-xs font-semibold">No records found in table &lsquo;{tableName}&rsquo;</span>
                    <p className="text-[11px] text-slate-500">Click &ldquo;Add Row&rdquo; above to insert your first record.</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rIdx) => {
              const isSelected = selectedRows.includes(rIdx);
              return (
                <tr
                  key={rIdx}
                  className={`hover:bg-[#007acc]/10 transition-colors ${
                    isSelected ? 'bg-[#007acc]/20' : 'even:bg-[#2d2d2d]/30'
                  }`}
                >
                  <td className="px-3 py-2 border-r border-[#3c3c3c]/50 text-center text-slate-500">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRows([...selectedRows, rIdx]);
                        else setSelectedRows(selectedRows.filter(i => i !== rIdx));
                      }}
                      className="h-3.5 w-3.5 accent-[#007acc]"
                    />
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-2 border-r border-[#3c3c3c]/50">
                      <input
                        type="text"
                        value={row[col] ?? ''}
                        onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                        className="bg-transparent border-b border-transparent focus:border-[#007acc] text-slate-200 focus:text-cyan-300 font-mono focus:outline-none w-full"
                      />
                    </td>
                  ))}
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
