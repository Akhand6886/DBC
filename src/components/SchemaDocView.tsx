'use client';

import React from 'react';
import { DatabaseMetadata } from '../lib/types';
import { FileText, Key, Hash, BookOpen } from 'lucide-react';

interface SchemaDocViewProps {
  metadata: DatabaseMetadata;
}

export const SchemaDocView: React.FC<SchemaDocViewProps> = ({ metadata }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-cyan-400" />
          <div>
            <h2 className="text-base font-bold text-white">Auto-Generated Database Documentation</h2>
            <p className="text-xs text-slate-400">
              Live schema documentation for <span className="text-cyan-300 font-bold">{metadata.name}</span> ({metadata.version})
            </p>
          </div>
        </div>
        <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-3 py-1 rounded-full font-mono">
          {metadata.tables.length} Tables Registered
        </span>
      </div>

      <div className="space-y-6">
        {metadata.tables.map((table) => (
          <div key={table.tableName} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div>
                <h3 className="text-sm font-bold text-cyan-300 font-mono flex items-center space-x-2">
                  <span>{table.tableName}</span>
                  <span className="text-xs font-normal text-slate-400 font-sans">({table.rowCount} records)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{table.description}</p>
              </div>
            </div>

            {/* Column Data Dictionary */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <th className="px-3 py-2">Column Name</th>
                    <th className="px-3 py-2">Data Type</th>
                    <th className="px-3 py-2">Key Constraint</th>
                    <th className="px-3 py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {table.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-900/40">
                      <td className="px-3 py-2 font-bold text-slate-200">{col.name}</td>
                      <td className="px-3 py-2 text-cyan-400/90">{col.type}</td>
                      <td className="px-3 py-2">
                        {col.isPrimaryKey ? (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                            PRIMARY KEY
                          </span>
                        ) : col.isForeignKey ? (
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded font-bold">
                            FK → {col.references?.table}.{col.references?.column}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px] font-sans">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
