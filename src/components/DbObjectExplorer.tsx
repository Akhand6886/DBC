'use client';

import React, { useState } from 'react';
import { Table, Eye, Zap, Code, ChevronRight, ChevronDown, Database, Play, Trash2, Edit3 } from 'lucide-react';
import { realSqlDriver } from '../lib/db/sqlDriver';

interface DbObjectExplorerProps {
  onOpenDataEditor: (tableName: string) => void;
  onInspectDDL: (tableName: string) => void;
  onRunSelectTop: (tableName: string) => void;
}

export const DbObjectExplorer: React.FC<DbObjectExplorerProps> = ({
  onOpenDataEditor,
  onInspectDDL,
  onRunSelectTop,
}) => {
  const [tablesExpanded, setTablesExpanded] = useState(true);
  const [viewsExpanded, setViewsExpanded] = useState(false);
  const [triggersExpanded, setTriggersExpanded] = useState(false);

  const tables = realSqlDriver.introspectSchema();

  return (
    <div className="w-56 bg-ide-sidebar border-r border-ide-border flex flex-col h-full font-mono text-xs select-none">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-ide-border flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          DBMS Object Explorer
        </span>
      </div>

      {/* Tree Content */}
      <div className="flex-grow overflow-y-auto p-2 space-y-1">
        {/* Tables Group */}
        <div>
          <button
            onClick={() => setTablesExpanded(!tablesExpanded)}
            className="w-full flex items-center space-x-1.5 p-1.5 rounded text-slate-300 hover:text-white hover:bg-ide-card font-bold"
          >
            {tablesExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Table className="h-3.5 w-3.5 text-cyan-400" />
            <span>Tables ({tables.length})</span>
          </button>

          {tablesExpanded && (
            <div className="pl-4 space-y-1 pt-1">
              {tables.map((t, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-1.5 rounded hover:bg-ide-card cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-1.5">
                    <Table className="h-3 w-3 text-slate-500 group-hover:text-cyan-300" />
                    <span className="text-slate-300 group-hover:text-white font-semibold">{t.name}</span>
                  </div>

                  {/* Hover Quick Actions */}
                  <div className="hidden group-hover:flex items-center space-x-1">
                    <button
                      onClick={() => onRunSelectTop(t.name)}
                      className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-ide-bg rounded"
                      title="Select Top 100 Rows"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onOpenDataEditor(t.name)}
                      className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-ide-bg rounded"
                      title="Open Table Data Grid"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onInspectDDL(t.name)}
                      className="p-1 text-slate-400 hover:text-amber-300 hover:bg-ide-bg rounded"
                      title="Inspect Table DDL"
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
            className="w-full flex items-center space-x-1.5 p-1.5 rounded text-slate-300 hover:text-white hover:bg-ide-card font-bold"
          >
            {viewsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Eye className="h-3.5 w-3.5 text-purple-400" />
            <span>Views (1)</span>
          </button>

          {viewsExpanded && (
            <div className="pl-4 space-y-1 pt-1">
              <div className="p-1.5 rounded hover:bg-ide-card text-slate-400 text-[11px] flex items-center space-x-1.5">
                <Eye className="h-3 w-3 text-purple-400" />
                <span>vw_active_users</span>
              </div>
            </div>
          )}
        </div>

        {/* Triggers Group */}
        <div>
          <button
            onClick={() => setTriggersExpanded(!triggersExpanded)}
            className="w-full flex items-center space-x-1.5 p-1.5 rounded text-slate-300 hover:text-white hover:bg-ide-card font-bold"
          >
            {triggersExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            <span>Triggers (1)</span>
          </button>

          {triggersExpanded && (
            <div className="pl-4 space-y-1 pt-1">
              <div className="p-1.5 rounded hover:bg-ide-card text-slate-400 text-[11px] flex items-center space-x-1.5">
                <Zap className="h-3 w-3 text-yellow-400" />
                <span>trg_audit_users</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
