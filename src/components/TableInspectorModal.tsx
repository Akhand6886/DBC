'use client';

import React, { useState } from 'react';
import { Table, Key, Shield, Code, X, Copy, Check, Eye, Database } from 'lucide-react';
import { realSqlDriver } from '../lib/db/sqlDriver';

interface TableInspectorModalProps {
  tableName: string;
  onClose: () => void;
}

export const TableInspectorModal: React.FC<TableInspectorModalProps> = ({
  tableName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'ddl' | 'indexes'>('columns');
  const [copied, setCopied] = useState(false);

  const tableSchema = realSqlDriver.getTable(tableName);
  const realDDL = realSqlDriver.generateTableDDL(tableName);

  const handleCopyDDL = () => {
    navigator.clipboard.writeText(realDDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <Table className="h-5 w-5 text-cyan-400 flex-shrink-0" />
            <div>
              <h2 className="font-bold uppercase tracking-wider text-xs">Table DDL & Schema Inspector</h2>
              <p className="text-[11px] text-slate-400">Inspecting Table: <span className="text-cyan-300 font-bold">{tableName}</span> ({tableSchema?.columns.length ?? 0} columns)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-ide-bg border border-ide-border rounded-lg p-1 flex flex-wrap sm:flex-nowrap gap-1">
          {[
            { id: 'columns', label: 'Columns & Types' },
            { id: 'ddl', label: 'Raw DDL SQL' },
            { id: 'indexes', label: 'Indexes & Constraints' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 min-w-[90px] py-1.5 rounded text-[11px] sm:text-xs font-semibold transition-all ${
                activeTab === t.id ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'columns' && (
          <div className="border border-ide-border rounded-xl bg-ide-bg overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-ide-sidebar text-slate-400 border-b border-ide-border font-bold">
                  <th className="px-3 py-2">Column Name</th>
                  <th className="px-3 py-2">Data Type</th>
                  <th className="px-3 py-2">Key Constraint</th>
                  <th className="px-3 py-2">Nullable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ide-border text-slate-200">
                {tableSchema?.columns && tableSchema.columns.length > 0 ? (
                  tableSchema.columns.map((col, idx) => (
                    <tr key={idx} className="hover:bg-ide-card/50">
                      <td className="px-3 py-2 font-bold text-cyan-300">{col.name}</td>
                      <td className="px-3 py-2 font-mono text-slate-300">{col.type}</td>
                      <td className="px-3 py-2">
                        {col.isPrimary ? (
                          <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            PRIMARY KEY
                          </span>
                        ) : col.isForeign ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            FOREIGN KEY
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {col.isPrimary ? (
                          <span className="text-rose-400">NOT NULL</span>
                        ) : (
                          <span className="text-emerald-400">NULLABLE</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                      No column metadata available for table &lsquo;{tableName}&rsquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ddl' && (
          <div className="relative bg-ide-bg border border-ide-border rounded-xl p-3 text-cyan-300 text-[11px] overflow-x-auto max-h-56">
            <button
              onClick={handleCopyDDL}
              className="absolute right-3 top-3 bg-ide-card hover:bg-ide-border text-slate-300 p-1.5 rounded flex items-center space-x-1"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <pre>{realDDL}</pre>
          </div>
        )}

        {activeTab === 'indexes' && (
          <div className="space-y-2 border border-ide-border rounded-xl p-3 bg-ide-bg max-h-56 overflow-y-auto">
            {tableSchema?.columns.filter(c => c.isPrimary || c.isForeign).map((col, idx) => (
              <div key={idx} className="bg-ide-sidebar p-2.5 rounded-lg border border-ide-border flex items-center justify-between">
                <div>
                  <div className="font-bold text-cyan-300">
                    idx_{tableName}_{col.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ON {tableName} ({col.name}) · {col.isPrimary ? 'PRIMARY BTREE' : 'FOREIGN BTREE'}
                  </div>
                </div>
                <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">ACTIVE</span>
              </div>
            ))}
            {(!tableSchema?.columns || tableSchema.columns.filter(c => c.isPrimary || c.isForeign).length === 0) && (
              <div className="p-4 text-center text-slate-500">
                No secondary indexes defined for table &lsquo;{tableName}&rsquo;.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
