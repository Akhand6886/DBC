'use client';

import React from 'react';
import { MessageSquareCode, GitFork, ShieldAlert, FileText, BarChart3 } from 'lucide-react';

export type TabType = 'console' | 'erd' | 'governance' | 'audit' | 'analytics';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingApprovalsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount,
}) => {
  const tabs = [
    {
      id: 'console',
      label: 'Conversational AI Console',
      icon: MessageSquareCode,
      description: 'Dual-path natural language query router'
    },
    {
      id: 'erd',
      label: 'ERD & Schema Visualizer',
      icon: GitFork,
      description: 'Live metadata & foreign key relationships'
    },
    {
      id: 'governance',
      label: 'Governance & Rollback Hub',
      icon: ShieldAlert,
      description: 'Pre-execution snapshots & 1-click restore',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined
    },
    {
      id: 'audit',
      label: 'Audit Log & Trace',
      icon: FileText,
      description: 'Immutable execution audit trail'
    },
    {
      id: 'analytics',
      label: 'System Analytics & Cost',
      icon: BarChart3,
      description: 'Fast-Path metrics & LLM cost reduction'
    }
  ];

  return (
    <nav className="bg-slate-900/60 border-b border-slate-800 px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as TabType)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
