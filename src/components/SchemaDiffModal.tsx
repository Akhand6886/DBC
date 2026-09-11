'use client';

import React, { useState, useMemo } from 'react';
import { GitCompare, AlertTriangle, ShieldCheck, Copy, Check, X, ArrowRight, Play } from 'lucide-react';
import { computeSchemaDiff } from '../lib/db/schemaDiffer';
import { realSqlDriver } from '../lib/db/sqlDriver';

interface SchemaDiffModalProps {
  onClose: () => void;
  onApplyMigration: (sql: string) => void;
}

export const SchemaDiffModal: React.FC<SchemaDiffModalProps> = ({
  onClose,
  onApplyMigration,
}) => {
  const [sourceDb, setSourceDb] = useState('Local SQLite Metadata');
  const [targetDb, setTargetDb] = useState('Postgres Prod Registry');
  const [activeTab, setActiveTab] = useState<'diff' | 'up' | 'down'>('diff');
  const [copied, setCopied] = useState(false);

  // Compute live diff
  const diffResult = useMemo(() => {
    const liveTables = realSqlDriver.introspectSchema();
    const prodTables = [
      ...liveTables,
      {
        name: 'audit_logs',
        columns: [
          { name: 'id', type: 'INTEGER', isPrimary: true, isForeign: false },
          { name: 'action', type: 'VARCHAR(255)', isPrimary: false, isForeign: false }
        ]
      }
    ];
    return computeSchemaDiff(liveTables, prodTables);
  }, []);

  const handleCopyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-mono text-xs">
      <div className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ide-border pb-3">
          <div className="flex items-center space-x-2 text-white">
            <GitCompare className="h-5 w-5 text-cyan-400 flex-shrink-0" />
            <div>
              <h2 className="font-bold uppercase tracking-wider text-xs">AI Database Migration & Schema Diffing</h2>
              <p className="text-[11px] text-slate-400">Comparing environments & generating migration version scripts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Environment Selectors */}
        <div className="bg-ide-bg border border-ide-border rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Source Database (Current):</span>
            <select
              value={sourceDb}
              onChange={(e) => setSourceDb(e.target.value)}
              className="w-full bg-ide-card border border-ide-border rounded p-1.5 text-xs text-slate-200"
            >
              <option value="Local SQLite Metadata">Local SQLite Metadata</option>
              <option value="Postgres Prod Registry">Postgres Prod Registry</option>
            </select>
          </div>

          <ArrowRight className="h-4 w-4 text-cyan-400 mx-auto sm:mx-4 flex-shrink-0 rotate-90 sm:rotate-0 my-1 sm:my-0" />

          <div className="flex-1 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Target Environment:</span>
            <select
              value={targetDb}
              onChange={(e) => setTargetDb(e.target.value)}
              className="w-full bg-ide-card border border-ide-border rounded p-1.5 text-xs text-slate-200"
            >
              <option value="Postgres Prod Registry">Postgres Prod Registry</option>
              <option value="Local SQLite Metadata">Local SQLite Metadata</option>
            </select>
          </div>
        </div>

        {/* AI Safety Warnings */}
        {diffResult.safetyWarnings.length > 0 && (
          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 space-y-1.5 text-[11px]">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <AlertTriangle className="h-4 w-4" />
              <span>AI Data Loss Safety Warning</span>
            </div>
            {diffResult.safetyWarnings.map((warn, idx) => (
              <p key={idx} className="text-amber-200/90 pl-5 leading-relaxed">
                {warn.message}
              </p>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-ide-bg border border-ide-border rounded-lg p-1 flex flex-wrap sm:flex-nowrap gap-1">
          {[
            { id: 'diff', label: 'Schema Delta' },
            { id: 'up', label: 'UP Migration' },
            { id: 'down', label: 'DOWN Rollback' },
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

        {/* Tab Body */}
        {activeTab === 'diff' && (
          <div className="border border-ide-border rounded-xl bg-ide-bg p-3 space-y-2 max-h-48 overflow-y-auto">
            {diffResult.addedTables.map((tbl, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-emerald-400">
                <span className="font-bold text-xs">+ ADD TABLE:</span>
                <span className="font-mono text-slate-200">{tbl}</span>
              </div>
            ))}
            {diffResult.droppedTables.map((tbl, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-rose-400">
                <span className="font-bold text-xs">- DROP TABLE:</span>
                <span className="font-mono text-slate-200">{tbl}</span>
              </div>
            ))}
            {diffResult.addedTables.length === 0 && diffResult.droppedTables.length === 0 && (
              <div className="text-slate-500 text-center py-6">
                No schema differences detected between environments.
              </div>
            )}
          </div>
        )}

        {activeTab === 'up' && (
          <div className="relative bg-ide-bg border border-ide-border rounded-xl p-3 text-cyan-300 text-[11px] overflow-x-auto max-h-48">
            <button
              onClick={() => handleCopyScript(diffResult.upSql)}
              className="absolute right-3 top-3 bg-ide-card hover:bg-ide-border text-slate-300 p-1.5 rounded flex items-center space-x-1"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>Copy</span>
            </button>
            <pre>{diffResult.upSql}</pre>
          </div>
        )}

        {activeTab === 'down' && (
          <div className="relative bg-ide-bg border border-ide-border rounded-xl p-3 text-cyan-300 text-[11px] overflow-x-auto max-h-48">
            <button
              onClick={() => handleCopyScript(diffResult.downSql)}
              className="absolute right-3 top-3 bg-ide-card hover:bg-ide-border text-slate-300 p-1.5 rounded flex items-center space-x-1"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>Copy</span>
            </button>
            <pre>{diffResult.downSql}</pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-ide-border">
          <button onClick={onClose} className="px-4 py-2 bg-ide-card hover:bg-ide-border text-slate-300 rounded-lg font-semibold">
            Cancel
          </button>
          <button
            onClick={() => onApplyMigration(diffResult.upSql)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow"
          >
            <Play className="h-4 w-4" />
            <span>Apply UP Migration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
