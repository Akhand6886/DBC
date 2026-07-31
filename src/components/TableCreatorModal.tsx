'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Code, Database, X, Check } from 'lucide-react';

interface ColumnDefinition {
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
}

interface TableCreatorModalProps {
  onClose: () => void;
  onExecuteDDL: (ddl: string) => void;
}

export const TableCreatorModal: React.FC<TableCreatorModalProps> = ({
  onClose,
  onExecuteDDL,
}) => {
  const [tableName, setTableName] = useState('new_table');
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { name: 'id', type: 'INTEGER', isPrimary: true, isNullable: false }
  ]);

  const handleAddColumn = () => {
    setColumns([...columns, { name: `col_${columns.length + 1}`, type: 'VARCHAR(255)', isPrimary: false, isNullable: true }]);
  };

  const handleRemoveColumn = (idx: number) => {
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const handleUpdateColumn = (idx: number, field: keyof ColumnDefinition, value: any) => {
    setColumns(columns.map((col, i) => (i === idx ? { ...col, [field]: value } : col)));
  };

  // Generate DDL SQL on the fly
  const generateDDL = () => {
    const colStrings = columns.map(col => {
      let str = `  ${col.name} ${col.type}`;
      if (col.isPrimary) str += ' PRIMARY KEY';
      if (!col.isNullable && !col.isPrimary) str += ' NOT NULL';
      return str;
    });
    return `CREATE TABLE ${tableName} (\n${colStrings.join(',\n')}\n);`;
  };

  const ddl = generateDDL();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Database className="h-4 w-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider text-xs">Visual Table Creator</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Table Name */}
        <div className="space-y-1">
          <label className="text-slate-300 font-bold">Table Name:</label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className="w-full bg-ide-bg border border-ide-border rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Columns Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Columns Definition</span>
            <button
              onClick={handleAddColumn}
              className="text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add Column</span>
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-2 border border-ide-border rounded-lg p-2 bg-ide-bg">
            {columns.map((col, idx) => (
              <div key={idx} className="flex items-center space-x-2 bg-ide-sidebar p-2 rounded border border-ide-border">
                <input
                  type="text"
                  value={col.name}
                  onChange={(e) => handleUpdateColumn(idx, 'name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="flex-1 bg-ide-card border border-ide-border rounded p-1 text-xs text-slate-100"
                  placeholder="Column name..."
                />
                <select
                  value={col.type}
                  onChange={(e) => handleUpdateColumn(idx, 'type', e.target.value)}
                  aria-label="Column Type"
                  className="bg-ide-card border border-ide-border rounded p-1 text-xs text-slate-300"
                >
                  <option value="INTEGER">INTEGER</option>
                  <option value="VARCHAR(255)">VARCHAR(255)</option>
                  <option value="TEXT">TEXT</option>
                  <option value="TIMESTAMP">TIMESTAMP</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                </select>
                <label className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <input
                    type="checkbox"
                    checked={col.isPrimary}
                    onChange={(e) => handleUpdateColumn(idx, 'isPrimary', e.target.checked)}
                    className="h-3 w-3 accent-cyan-500"
                  />
                  <span>PK</span>
                </label>
                <label className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <input
                    type="checkbox"
                    checked={col.isNullable}
                    onChange={(e) => handleUpdateColumn(idx, 'isNullable', e.target.checked)}
                    className="h-3 w-3 accent-cyan-500"
                  />
                  <span>Null</span>
                </label>
                <button
                  onClick={() => handleRemoveColumn(idx)}
                  disabled={columns.length === 1}
                  className="text-slate-500 hover:text-rose-400 p-1 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SQL DDL Preview */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center space-x-1">
            <Code className="h-3.5 w-3.5 text-cyan-400" />
            <span>Generated SQL DDL Preview:</span>
          </label>
          <div className="bg-ide-bg border border-ide-border rounded-xl p-3 text-cyan-300 text-[11px] overflow-x-auto">
            <pre>{ddl}</pre>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-ide-border">
          <button onClick={onClose} className="px-4 py-2 bg-ide-card hover:bg-ide-border text-slate-300 rounded-lg font-semibold">
            Cancel
          </button>
          <button
            onClick={() => onExecuteDDL(ddl)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow"
          >
            <Check className="h-4 w-4" />
            <span>Execute DDL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
