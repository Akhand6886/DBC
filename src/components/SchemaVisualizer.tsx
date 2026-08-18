'use client';

import React, { useState } from 'react';
import { Network, Table, Key } from 'lucide-react';
import { realSqlDriver, IntrospectedTable } from '../lib/db/sqlDriver';

interface SchemaVisualizerProps {
  connectionType: string;
}

export const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ connectionType }) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'erd'>('columns');

  // Introspect live real tables from engine
  const tables: IntrospectedTable[] = realSqlDriver.introspectSchema();

  return (
    <div className="w-64 bg-ide-sidebar border-r border-ide-border flex flex-col h-full font-mono text-xs select-none">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-ide-border flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Real Schema Explorer
        </span>
        <div className="flex bg-ide-card border border-ide-border rounded p-0.5">
          <button
            onClick={() => setActiveTab('columns')}
            className={`p-1 rounded ${activeTab === 'columns' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
          >
            <Table className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setActiveTab('erd')}
            className={`p-1 rounded ${activeTab === 'erd' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
          >
            <Network className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Schema Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'columns' ? (
          <div className="space-y-3">
            {tables.map((table, idx) => (
              <div key={idx} className="bg-ide-bg border border-ide-border rounded-xl p-2.5 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold border-b border-ide-border/50 pb-1">
                  <Table className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{table.name}</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  {table.columns.map((col, cIdx) => (
                    <div key={cIdx} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        {col.isPrimary && <Key className="h-3 w-3 text-yellow-400" />}
                        {col.isForeign && <Key className="h-3 w-3 text-emerald-400" />}
                        <span className={col.isPrimary || col.isForeign ? 'text-slate-200' : 'text-slate-400'}>
                          {col.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-500 py-10">
            <Network className="h-10 w-10 text-cyan-400/50 animate-pulse" />
            <span className="text-xs font-bold text-slate-400">ERD Visual Relationships</span>
            <p className="text-[10px] text-slate-500 max-w-[150px] leading-relaxed">
              Visual relations generated from active connections automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
