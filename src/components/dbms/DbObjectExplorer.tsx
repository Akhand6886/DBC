'use client';

import React, { useState } from 'react';
import {
  Table,
  Eye,
  Zap,
  Code,
  ChevronRight,
  ChevronDown,
  Play,
  Edit3,
  Database,
  Plus,
  Trash2,
  Check,
  Search,
  X,
  Layers,
  Server,
  Key,
  ShieldCheck,
  Columns
} from 'lucide-react';
import { realSqlDriver, IntrospectedTable } from '../../lib/db/sqlDriver';
import { DbConnection } from './DbConnectionPanel';

interface DbObjectExplorerProps {
  connections?: DbConnection[];
  activeConnectionId?: string;
  onSelectConnection?: (id: string) => void;
  onAddConnection?: (conn: Omit<DbConnection, 'id' | 'status'>) => void;
  onDeleteConnection?: (id: string) => void;
  onOpenDataEditor: (tableName: string) => void;
  onInspectDDL: (tableName: string) => void;
  onRunSelectTop: (tableName: string) => void;
}

const DEFAULT_DATABASES = [
  { id: 'conn-pg', name: 'PostgreSQL', type: 'postgres', subtitle: 'Production DB (dbc_prod)', status: 'connected' },
  { id: 'conn-mysql', name: 'MySQL', type: 'mysql', subtitle: 'Orders & Fulfillment', status: 'connected' },
  { id: 'conn-mongo', name: 'MongoDB', type: 'mongodb', subtitle: 'Document Store (v7.0)', status: 'connected' },
  { id: 'conn-redis', name: 'Redis', type: 'redis', subtitle: 'Cluster Cache (6379)', status: 'connected' }
];

export const DbObjectExplorer: React.FC<DbObjectExplorerProps> = ({
  connections = [],
  activeConnectionId = 'conn-pg',
  onSelectConnection,
  onAddConnection,
  onDeleteConnection,
  onOpenDataEditor,
  onInspectDDL,
  onRunSelectTop,
}) => {
  const [selectedDb, setSelectedDb] = useState<string>(activeConnectionId || 'conn-pg');
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddConnModal, setShowAddConnModal] = useState(false);

  // New connection form
  const [newConnName, setNewConnName] = useState('');
  const [newConnType, setNewConnType] = useState<'sqlite' | 'postgres' | 'mysql' | 'mongodb'>('postgres');
  const [newConnUri, setNewConnUri] = useState('postgresql://postgres@localhost:5432/dbc');

  const tables = realSqlDriver.introspectSchema();
  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDb = (id: string) => {
    setSelectedDb(id);
    if (onSelectConnection) onSelectConnection(id);
  };

  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName.trim() || !newConnUri.trim()) return;
    if (onAddConnection) {
      onAddConnection({
        name: newConnName.trim(),
        type: newConnType,
        connectionString: newConnUri.trim()
      });
    }
    setNewConnName('');
    setShowAddConnModal(false);
  };

  const allDbs = connections.length > 0 ? connections : DEFAULT_DATABASES;

  return (
    <div className="w-64 bg-[#252526] border-r border-[#3c3c3c] flex flex-col h-full font-mono text-xs select-none">
      {/* ─── SECTION 1: DATABASES ─────────────────────────────────── */}
      <div className="border-b border-[#3c3c3c] flex flex-col shrink-0">
        <div className="px-3 py-2 bg-[#2d2d2d] flex items-center justify-between border-b border-[#383838]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Server className="w-3 h-3 text-[#007acc]" />
            DATABASES
          </span>
          <button
            onClick={() => setShowAddConnModal(true)}
            title="Add New Database Connection"
            className="p-1 text-slate-400 hover:text-white hover:bg-[#3c3c3c] rounded transition"
          >
            <Plus className="h-3.5 w-3.5 text-[#007acc]" />
          </button>
        </div>

        <div className="p-1.5 space-y-0.5 bg-[#202021] max-h-40 overflow-y-auto">
          {allDbs.map((db) => {
            const isSelected = selectedDb === db.id;
            return (
              <div
                key={db.id}
                onClick={() => handleSelectDb(db.id)}
                className={`px-2 py-1.5 rounded cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[#007acc]/20 border border-[#007acc]/50 text-white font-bold'
                    : 'hover:bg-[#2a2a2b] text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      db.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-[11px] leading-tight truncate">{db.name}</div>
                  </div>
                </div>
                {isSelected && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION 2: SCHEMAS & TABLES ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 bg-[#2d2d2d] border-b border-[#383838] space-y-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-emerald-400" />
              SCHEMAS
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {tables.length} tables
            </span>
          </div>

          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-1.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter schema tables..."
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-[#007acc]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filteredTables.map((tbl) => {
            const isExpanded = expandedTable === tbl.name;
            const rowCount = realSqlDriver.getTableData(tbl.name).length;

            return (
              <div key={tbl.name} className="rounded border border-transparent hover:border-[#3c3c3c] transition-colors">
                <div
                  className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#2d2d2d] cursor-pointer"
                  onClick={() => setExpandedTable(isExpanded ? null : tbl.name)}
                >
                  <div className="flex items-center space-x-1.5 truncate flex-1">
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                    )}
                    <Table className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-200 group-hover:text-white font-semibold truncate text-[11px]">
                      {tbl.name}
                    </span>
                    <span className="text-[9px] bg-[#333333] text-slate-400 px-1 py-0.2 rounded shrink-0">
                      {rowCount}
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="hidden group-hover:flex items-center space-x-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRunSelectTop(tbl.name);
                      }}
                      className="p-1 text-slate-400 hover:text-[#007acc] hover:bg-[#1e1e1e] rounded"
                      title={`Run SELECT * FROM ${tbl.name} LIMIT 10`}
                    >
                      <Play className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDataEditor(tbl.name);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-[#1e1e1e] rounded"
                      title="Edit Table Data Grid"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectDDL(tbl.name);
                      }}
                      className="p-1 text-slate-400 hover:text-purple-400 hover:bg-[#1e1e1e] rounded"
                      title="View CREATE TABLE DDL"
                    >
                      <Code className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Column Drilldown */}
                {isExpanded && (
                  <div className="pl-6 pr-2 py-1 space-y-1 bg-[#1a1a1b] rounded-b border-t border-[#333333] text-[10px]">
                    {tbl.columns.map((col) => (
                      <div key={col.name} className="flex items-center justify-between text-slate-400 hover:text-slate-200">
                        <div className="flex items-center space-x-1.5 truncate">
                          {col.isPrimary ? (
                            <Key className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          ) : col.isForeign ? (
                            <Key className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                          ) : (
                            <Columns className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          )}
                          <span className={col.isPrimary ? 'text-amber-300 font-bold' : ''}>
                            {col.name}
                          </span>
                        </div>
                        <span className="font-mono text-slate-500 text-[9px]">{col.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Add Database Connection Modal ────────────────────────── */}
      {showAddConnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#3c3c3c] bg-[#2d2d2d]">
              <div className="flex items-center space-x-2 font-bold text-xs text-white">
                <Database className="h-4 w-4 text-[#007acc]" />
                <span>Connect New Database</span>
              </div>
              <button
                onClick={() => setShowAddConnModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#3c3c3c]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConnection} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Connection Name
                </label>
                <input
                  type="text"
                  value={newConnName}
                  onChange={(e) => setNewConnName(e.target.value)}
                  placeholder="e.g. Postgres Warehouse"
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-[#007acc]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Engine Type
                </label>
                <select
                  value={newConnType}
                  onChange={(e: any) => setNewConnType(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2.5 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#007acc]"
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="mongodb">MongoDB</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                  Connection URI
                </label>
                <input
                  type="text"
                  value={newConnUri}
                  onChange={(e) => setNewConnUri(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-1.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-[#007acc]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddConnModal(false)}
                  className="px-3 py-1.5 rounded bg-[#333333] hover:bg-[#3c3c3c] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#007acc] hover:bg-[#005a9e] text-xs font-semibold text-white shadow"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
