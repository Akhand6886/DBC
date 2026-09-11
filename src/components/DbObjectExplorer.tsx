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
  X
} from 'lucide-react';
import { realSqlDriver } from '../lib/db/sqlDriver';
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

export const DbObjectExplorer: React.FC<DbObjectExplorerProps> = ({
  connections = [],
  activeConnectionId = '',
  onSelectConnection,
  onAddConnection,
  onDeleteConnection,
  onOpenDataEditor,
  onInspectDDL,
  onRunSelectTop,
}) => {
  const [tablesExpanded, setTablesExpanded] = useState(true);
  const [viewsExpanded, setViewsExpanded] = useState(false);
  const [triggersExpanded, setTriggersExpanded] = useState(false);
  const [functionsExpanded, setFunctionsExpanded] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isConnDropdownOpen, setIsConnDropdownOpen] = useState(false);
  const [showAddConnModal, setShowAddConnModal] = useState(false);

  // New connection form states
  const [newConnName, setNewConnName] = useState('');
  const [newConnType, setNewConnType] = useState<'sqlite' | 'postgres' | 'mysql' | 'mongodb'>('sqlite');
  const [newConnUri, setNewConnUri] = useState('sqlite://app.db');

  const tables = realSqlDriver.introspectSchema();
  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeConn = connections.find((c) => c.id === activeConnectionId) || connections[0];

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

  return (
    <div className="w-64 bg-[#252526] border-r border-[#3c3c3c] flex flex-col h-full font-mono text-xs select-none">
      {/* Top Connection Switcher Header */}
      <div className="p-2.5 border-b border-[#3c3c3c] bg-[#2d2d2d] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Database
          </span>
          <button
            onClick={() => setShowAddConnModal(true)}
            title="Add New Connection"
            className="p-1 text-slate-400 hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-[#007acc]" />
          </button>
        </div>

        {/* Active Connection Selector */}
        <div className="relative">
          <button
            onClick={() => setIsConnDropdownOpen(!isConnDropdownOpen)}
            className="w-full bg-[#1e1e1e] hover:bg-[#282828] border border-[#3c3c3c] rounded px-2.5 py-1.5 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center space-x-2 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-slate-200 font-bold truncate text-[11px]">
                {activeConn?.name || 'No Connection'}
              </span>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-1" />
          </button>

          {isConnDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl py-1 z-30 space-y-0.5 max-h-48 overflow-y-auto">
              {connections.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    if (onSelectConnection) onSelectConnection(c.id);
                    setIsConnDropdownOpen(false);
                  }}
                  className={`px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-[#007acc] hover:text-white ${
                    c.id === activeConnectionId ? 'bg-[#007acc]/20 text-white font-bold' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        c.status === 'connected' ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                    <span className="truncate text-[11px]">{c.name}</span>
                  </div>
                  {c.id === activeConnectionId && <Check className="h-3 w-3 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Filter Input */}
        <div className="relative">
          <Search className="h-3 w-3 absolute left-2 top-2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter tables..."
            className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#007acc]"
          />
        </div>
      </div>

      {/* Database Schema Tree Content */}
      <div className="flex-grow overflow-y-auto p-2 space-y-1">
        {/* Tables Group */}
        <div>
          <button
            onClick={() => setTablesExpanded(!tablesExpanded)}
            className="w-full flex items-center space-x-1.5 p-1 rounded text-slate-300 hover:text-white hover:bg-[#2d2d2d] font-bold text-[11px]"
          >
            {tablesExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Table className="h-3.5 w-3.5 text-[#007acc]" />
            <span>Tables ({filteredTables.length})</span>
          </button>

          {tablesExpanded && (
            <div className="pl-3.5 space-y-0.5 pt-0.5">
              {filteredTables.map((t, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer transition-colors"
                >
                  <div
                    onClick={() => onOpenDataEditor(t.name)}
                    className="flex items-center space-x-1.5 truncate flex-1"
                  >
                    <Table className="h-3 w-3 text-slate-500 group-hover:text-cyan-300 shrink-0" />
                    <span className="text-slate-300 group-hover:text-white font-semibold truncate text-[11px]">
                      {t.name}
                    </span>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="hidden group-hover:flex items-center space-x-0.5 shrink-0">
                    <button
                      onClick={() => onRunSelectTop(t.name)}
                      className="p-1 text-slate-400 hover:text-[#007acc] hover:bg-[#1e1e1e] rounded"
                      title="Run SELECT * Top 100"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onOpenDataEditor(t.name)}
                      className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-[#1e1e1e] rounded"
                      title="Edit Table Data Grid"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onInspectDDL(t.name)}
                      className="p-1 text-slate-400 hover:text-purple-300 hover:bg-[#1e1e1e] rounded"
                      title="Inspect DDL Schema"
                    >
                      <Code className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Views Group */}
        <div>
          <button
            onClick={() => setViewsExpanded(!viewsExpanded)}
            className="w-full flex items-center space-x-1.5 p-1 rounded text-slate-400 hover:text-white hover:bg-[#2d2d2d] font-bold text-[11px]"
          >
            {viewsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <span>Views (2)</span>
          </button>

          {viewsExpanded && (
            <div className="pl-5 space-y-0.5 pt-0.5 text-slate-400 text-[11px]">
              <div className="p-1 rounded hover:bg-[#2d2d2d] truncate cursor-pointer hover:text-white">
                v_active_users
              </div>
              <div className="p-1 rounded hover:bg-[#2d2d2d] truncate cursor-pointer hover:text-white">
                v_monthly_revenue
              </div>
            </div>
          )}
        </div>

        {/* Triggers Group */}
        <div>
          <button
            onClick={() => setTriggersExpanded(!triggersExpanded)}
            className="w-full flex items-center space-x-1.5 p-1 rounded text-slate-400 hover:text-white hover:bg-[#2d2d2d] font-bold text-[11px]"
          >
            {triggersExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Triggers (1)</span>
          </button>

          {triggersExpanded && (
            <div className="pl-5 space-y-0.5 pt-0.5 text-slate-400 text-[11px]">
              <div className="p-1 rounded hover:bg-[#2d2d2d] truncate cursor-pointer hover:text-white">
                trg_users_updated_at
              </div>
            </div>
          )}
        </div>

        {/* Functions Group */}
        <div>
          <button
            onClick={() => setFunctionsExpanded(!functionsExpanded)}
            className="w-full flex items-center space-x-1.5 p-1 rounded text-slate-400 hover:text-white hover:bg-[#2d2d2d] font-bold text-[11px]"
          >
            {functionsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Code className="h-3.5 w-3.5 text-emerald-400" />
            <span>Functions (1)</span>
          </button>

          {functionsExpanded && (
            <div className="pl-5 space-y-0.5 pt-0.5 text-slate-400 text-[11px]">
              <div className="p-1 rounded hover:bg-[#2d2d2d] truncate cursor-pointer hover:text-white">
                fn_calculate_tax
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Connection Modal */}
      {showAddConnModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#3c3c3c]">
              <div className="flex items-center space-x-2 text-white font-bold font-sans">
                <Database className="h-4 w-4 text-[#007acc]" />
                <span>New Database Connection</span>
              </div>
              <button onClick={() => setShowAddConnModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConnection} className="space-y-2.5">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">Connection Name</label>
                <input
                  type="text"
                  value={newConnName}
                  onChange={(e) => setNewConnName(e.target.value)}
                  placeholder="e.g. Local Development DB"
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#007acc]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">Database Type</label>
                <select
                  value={newConnType}
                  onChange={(e) => setNewConnType(e.target.value as any)}
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#007acc]"
                >
                  <option value="sqlite">SQLite (.db file)</option>
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="mongodb">MongoDB</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-bold">Connection URI / Path</label>
                <input
                  type="text"
                  value={newConnUri}
                  onChange={(e) => setNewConnUri(e.target.value)}
                  placeholder="sqlite://app.db or postgresql://..."
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#007acc]"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#3c3c3c]">
                <button
                  type="button"
                  onClick={() => setShowAddConnModal(false)}
                  className="px-3 py-1 bg-[#2d2d2d] text-slate-300 rounded hover:bg-[#3c3c3c] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#007acc] text-white font-bold rounded hover:bg-[#005a9e] text-xs"
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
