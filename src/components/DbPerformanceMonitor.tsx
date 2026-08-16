'use client';

import React from 'react';
import { Activity, Clock, Server, AlertCircle } from 'lucide-react';

export const DbPerformanceMonitor: React.FC = () => {
  return (
    <div className="bg-ide-bg border border-ide-border rounded-xl p-4 font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ide-border pb-2">
        <div className="flex items-center space-x-2 text-white">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-xs">Live Database Performance Monitor</span>
        </div>
      </div>

      {/* Simulator Metrics Dashboard */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-ide-sidebar border border-ide-border rounded-lg p-2.5">
          <div className="text-[9px] text-slate-500 uppercase">CPU Usage</div>
          <div className="font-bold text-cyan-300 text-xs mt-1">4.2%</div>
        </div>
        <div className="bg-ide-sidebar border border-ide-border rounded-lg p-2.5">
          <div className="text-[9px] text-slate-500 uppercase">Memory Allocation</div>
          <div className="font-bold text-cyan-300 text-xs mt-1">18.4 MB</div>
        </div>
        <div className="bg-ide-sidebar border border-ide-border rounded-lg p-2.5">
          <div className="text-[9px] text-slate-500 uppercase">Cache Hit Ratio</div>
          <div className="font-bold text-emerald-400 text-xs mt-1">99.8%</div>
        </div>
        <div className="bg-ide-sidebar border border-ide-border rounded-lg p-2.5">
          <div className="text-[9px] text-slate-500 uppercase">Active Queries</div>
          <div className="font-bold text-cyan-300 text-xs mt-1">1 / sec</div>
        </div>
      </div>

      {/* Process list */}
      <div className="space-y-1.5">
        <div className="text-[9px] font-bold text-slate-400 uppercase">Active Process List:</div>
        <div className="bg-ide-card border border-ide-border rounded-lg p-2 space-y-2 max-h-32 overflow-y-auto">
          {[
            { id: '1024', user: 'alpha', state: 'idle', query: 'SELECT * FROM users LIMIT 10;', time: '1ms' },
            { id: '1025', user: 'agent_cli', state: 'executing', query: 'INSERT INTO logs (level, message) VALUES (?, ?);', time: '2ms' }
          ].map((proc, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10px] border-b border-ide-border/50 pb-1.5 last:border-b-0 last:pb-0">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                  <span>PID: {proc.id}</span>
                  <span>·</span>
                  <span className="text-cyan-400">{proc.user}</span>
                  <span>·</span>
                  <span className={`text-[9px] px-1 rounded ${proc.state === 'executing' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {proc.state}
                  </span>
                </div>
                <div className="text-slate-400 truncate max-w-sm font-mono">{proc.query}</div>
              </div>
              <span className="text-slate-500 font-bold">{proc.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
