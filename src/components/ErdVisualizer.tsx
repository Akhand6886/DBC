'use client';

import React, { useState } from 'react';
import { DatabaseType } from '../lib/types';
import { INITIAL_DATABASES, SEMANTIC_RELATIONSHIPS } from '../lib/db/initialData';
import { SchemaDocView } from './SchemaDocView';
import { GitFork, BookOpen, Key, Link2, Database, Layers } from 'lucide-react';

interface ErdVisualizerProps {
  currentDb: DatabaseType;
}

export const ErdVisualizer: React.FC<ErdVisualizerProps> = ({ currentDb }) => {
  const [subView, setSubView] = useState<'erd' | 'docs'>('erd');
  const metadata = INITIAL_DATABASES[currentDb] || INITIAL_DATABASES.postgresql;

  return (
    <div className="space-y-6">
      {/* Sub-navigation Controls */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <GitFork className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Entity-Relationship Graph & Semantic Layer
            </h2>
            <p className="text-xs text-slate-400">
              Visual ERD graph with automatic FK resolution for deterministic query building
            </p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setSubView('erd')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              subView === 'erd'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Interactive ERD</span>
          </button>
          <button
            onClick={() => setSubView('docs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              subView === 'docs'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Schema Documentation</span>
          </button>
        </div>
      </div>

      {subView === 'docs' ? (
        <SchemaDocView metadata={metadata} />
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Semantic Graph Relationship Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Link2 className="h-4 w-4 text-cyan-400" />
              <span>Semantic Metadata Graph Relationships (Registered for Deterministic Fast-Path):</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {SEMANTIC_RELATIONSHIPS.map((rel, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-cyan-500/20 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 flex items-center space-x-2"
                >
                  <span className="text-slate-300">{rel.sourceTable}.{rel.sourceColumn}</span>
                  <span className="text-cyan-400 font-bold">({rel.cardinality}) →</span>
                  <span className="text-indigo-300">{rel.targetTable}.{rel.targetColumn}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive ERD Entity Node Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metadata.tables.map((table) => (
              <div
                key={table.tableName}
                className="bg-slate-950 border border-slate-800 hover:border-cyan-500/40 rounded-xl overflow-hidden shadow-lg transition-all group"
              >
                {/* Node Header */}
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white font-mono">{table.tableName}</span>
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded">
                    {table.rowCount} rows
                  </span>
                </div>

                {/* Column Node Rows */}
                <div className="p-3 space-y-1.5 font-mono text-xs">
                  {table.columns.map((col) => (
                    <div
                      key={col.name}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-900/40 hover:bg-slate-900/80 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {col.isPrimaryKey ? (
                          <Key className="h-3.5 w-3.5 text-amber-400" />
                        ) : col.isForeignKey ? (
                          <Link2 className="h-3.5 w-3.5 text-indigo-400" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-600"></div>
                        )}
                        <span className={`font-medium ${col.isPrimaryKey ? 'text-amber-300 font-bold' : col.isForeignKey ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {col.name}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400">{col.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
