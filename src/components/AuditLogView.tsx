'use client';

import React, { useState } from 'react';
import { auditLogger } from '../lib/governance/auditLogger';
import { AuditLogEntry } from '../lib/types';
import { FileText, Search, Filter, ShieldCheck, ShieldAlert, Cpu, Zap, Eye, X } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const logs = auditLogger.filterLogs(searchTerm, routeFilter, riskFilter);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tamper-Evident Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Complete, immutable log of all natural language requests, routing decisions, risk scores, and executions
              </p>
            </div>
          </div>

          <span className="bg-slate-950 border border-slate-800 text-cyan-400 text-xs px-3 py-1 rounded-full font-mono">
            {logs.length} Log Records
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by query, user, or SQL..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Route Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 space-x-2 text-xs text-slate-300">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              aria-label="Filter by Route Path"
              className="bg-transparent text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Routing Paths</option>
              <option value="DETERMINISTIC_FAST_PATH font-mono">Deterministic Fast-Path</option>
              <option value="LLM_REASONING_PATH">LLM Escalation Path</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 space-x-2 text-xs text-slate-300">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              aria-label="Filter by Risk Level"
              className="bg-transparent text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="CRITICAL">CRITICAL Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <th className="px-4 py-3">Timestamp / User</th>
                <th className="px-4 py-3">Natural Language Query</th>
                <th className="px-4 py-3">Route Path</th>
                <th className="px-4 py-3">Risk & Confidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Timestamp & User */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-bold text-slate-200">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div className="text-[10px] text-slate-400 font-sans">{log.user} ({log.userRole})</div>
                  </td>

                  {/* Query */}
                  <td className="px-4 py-3">
                    <div className="font-sans text-slate-100 line-clamp-1">{log.queryText}</div>
                    <div className="text-[10px] text-cyan-400/80 truncate max-w-md">{log.generatedQuery}</div>
                  </td>

                  {/* Route Path */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.routePath === 'DETERMINISTIC_FAST_PATH' ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded flex items-center space-x-1 w-fit">
                        <Zap className="h-3 w-3" />
                        <span>Fast-Path ({log.executionTimeMs}ms)</span>
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded flex items-center space-x-1 w-fit">
                        <Cpu className="h-3 w-3" />
                        <span>LLM ({log.executionTimeMs}ms)</span>
                      </span>
                    )}
                  </td>

                  {/* Risk & Confidence */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                        log.riskLevel === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        Risk {log.riskScore}
                      </span>
                      <span className="text-slate-400 text-[10px]">Conf: {log.confidenceScore}%</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {log.status}
                    </span>
                  </td>

                  {/* Trace Action */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 text-xs font-sans font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Trace</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trace Modal Inspector */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <span>Execution Trace Log #{selectedLog.id}</span>
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-cyan-300 overflow-x-auto max-h-96">
              <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
