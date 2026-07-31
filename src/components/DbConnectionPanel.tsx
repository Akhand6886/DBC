'use client';

import React, { useState } from 'react';
import { Database, Link2, Link2Off, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';

export interface DbConnection {
  id: string;
  name: string;
  type: 'sqlite' | 'postgres' | 'mysql' | 'mongodb';
  connectionString: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface DbConnectionPanelProps {
  connections: DbConnection[];
  activeConnectionId: string;
  onSelectConnection: (id: string) => void;
  onAddConnection: (conn: Omit<DbConnection, 'id' | 'status'>) => void;
  onDeleteConnection: (id: string) => void;
}

export const DbConnectionPanel: React.FC<DbConnectionPanelProps> = ({
  connections,
  activeConnectionId,
  onSelectConnection,
  onAddConnection,
  onDeleteConnection,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'sqlite' | 'postgres' | 'mysql' | 'mongodb'>('sqlite');
  const [connectionString, setConnectionString] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && connectionString.trim()) {
      onAddConnection({ name, type, connectionString });
      setName('');
      setConnectionString('');
      setShowAddForm(false);
    }
  };

  const getDbTypeBadge = (dbType: string) => {
    const colors: Record<string, string> = {
      sqlite: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      postgres: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      mysql: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      mongodb: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };
    return (
      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${colors[dbType]}`}>
        {dbType}
      </span>
    );
  };

  return (
    <div className="w-60 bg-ide-sidebar border-r border-ide-border flex flex-col h-full font-mono text-xs select-none">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-ide-border flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Database Connections
        </span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-ide-card"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Add Connection Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-3 border-b border-ide-border space-y-2 bg-ide-bg">
          <input
            type="text"
            placeholder="Connection Name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-ide-card border border-ide-border rounded p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            aria-label="Database Type"
            className="w-full bg-ide-card border border-ide-border rounded p-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="sqlite">SQLite (Local)</option>
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="mongodb">MongoDB</option>
          </select>
          <input
            type="text"
            placeholder="Connection URI / File Path..."
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            className="w-full bg-ide-card border border-ide-border rounded p-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <div className="flex space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-1 bg-ide-card hover:bg-ide-border text-slate-300 rounded text-[10px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold"
            >
              Save Conn
            </button>
          </div>
        </form>
      )}

      {/* Connection List */}
      <div className="flex-grow overflow-y-auto p-2 space-y-1.5">
        {connections.length === 0 ? (
          <div className="text-slate-500 text-center py-6 text-[11px]">
            No connections added. Click "+" to connect a database.
          </div>
        ) : (
          connections.map((conn) => {
            const isActive = conn.id === activeConnectionId;
            return (
              <div
                key={conn.id}
                onClick={() => onSelectConnection(conn.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col space-y-1.5 ${
                  isActive
                    ? 'border-cyan-500 bg-cyan-500/10 text-white shadow'
                    : 'border-ide-border bg-ide-card text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="font-bold text-xs">{conn.name}</span>
                  </div>
                  {getDbTypeBadge(conn.type)}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[130px]" title={conn.connectionString}>
                    {conn.connectionString}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {conn.status === 'connected' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : conn.status === 'disconnected' ? (
                      <Link2Off className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConnection(conn.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
