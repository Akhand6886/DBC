'use client';

import React from 'react';
import { Files, Search, Bot, BarChart2, Settings, ShieldCheck, Globe, GitBranch, Database } from 'lucide-react';

export type ActivityView = 'explorer' | 'search' | 'composer' | 'analytics' | 'settings' | 'verification' | 'browser' | 'git' | 'database';

interface ActivityBarProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
  fastPathCount: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onViewChange,
  fastPathCount,
}) => {
  const items = [
    { id: 'explorer', label: 'Explorer', icon: Files },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'git', label: 'Git Source Control', icon: GitBranch },
    { id: 'database', label: 'Database Console', icon: Database },
    { id: 'composer', label: 'Agent Composer (Mission Control)', icon: Bot, badge: 'AI' },
    { id: 'browser', label: 'Browser-in-the-Loop & Visual Verification', icon: Globe },
    { id: 'verification', label: 'Shadow Verification & Rollback Hub', icon: ShieldCheck },
    { id: 'analytics', label: 'Router Analytics', icon: BarChart2 },
  ];

  return (
    <aside className="w-12 bg-ide-activity border-r border-ide-border flex flex-col justify-between items-center py-3 select-none z-20">
      {/* Top Activity Icons */}
      <div className="flex flex-col space-y-4 items-center w-full">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md mb-2">
          <Bot className="h-4 w-4" />
        </div>

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ActivityView)}
              title={item.label}
              className={`relative p-2.5 rounded-lg transition-all ${
                isActive
                  ? 'text-white bg-ide-card border border-ide-border shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-ide-card/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-[9px] text-white font-bold px-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Activity Controls */}
      <div className="flex flex-col space-y-3 items-center">
        <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30" title="Fast-Path Executions">
          ⚡{fastPathCount}
        </div>
        <button
          onClick={() => onViewChange('settings')}
          title="Settings"
          className={`p-2 rounded-lg text-slate-400 hover:text-slate-200 ${activeView === 'settings' ? 'text-white bg-ide-card' : ''}`}
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
};
