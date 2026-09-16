'use client';

import React from 'react';
import { Files, Search, Settings, GitBranch, Globe, ShieldCheck, BarChart2, Database, Code, Sliders } from 'lucide-react';

export type ActivityView = 'explorer' | 'search' | 'git' | 'database' | 'browser' | 'verification' | 'analytics' | 'settings';

interface ActivityBarProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
  fastPathCount?: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onViewChange,
  fastPathCount = 14,
}) => {
  const topNavItems: { id: ActivityView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'database', label: 'DBMS Studio (Console & Data Grid)', icon: <Database className="h-5 w-5" /> },
    { id: 'explorer', label: 'Explorer (⌘Shift+E)', icon: <Files className="h-5 w-5" /> },
    { id: 'search', label: 'Search (⌘Shift+F)', icon: <Search className="h-5 w-5" /> },
    { id: 'git', label: 'Source Control (⌘Shift+G)', icon: <GitBranch className="h-5 w-5" /> },
    { id: 'browser', label: 'Browser-in-the-Loop', icon: <Globe className="h-5 w-5" /> },
    { id: 'verification', label: 'Shadow Verification Hub', icon: <ShieldCheck className="h-5 w-5" /> },
    { id: 'analytics', label: 'Router Analytics', icon: <BarChart2 className="h-5 w-5" />, badge: fastPathCount },
  ];

  return (
    <div className="w-12 bg-[#333333] border-r border-[#3c3c3c] flex flex-col items-center justify-between py-2 select-none z-20 font-sans">
      {/* Top Main Navigation */}
      <div className="flex flex-col items-center space-y-1 w-full">
        {topNavItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={item.label}
              className={`relative w-full h-11 flex items-center justify-center transition-colors ${
                isActive
                  ? 'text-white border-l-2 border-white bg-[#252526]'
                  : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2d2d2d]'
              }`}
            >
              {item.icon}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-[#007acc] text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Utility Navigation */}
      <div className="flex flex-col items-center space-y-1 w-full">
        <button
          onClick={() => onViewChange('settings')}
          title="Manage Settings & BYOK Keys"
          className={`w-full h-11 flex items-center justify-center transition-colors ${
            activeView === 'settings'
              ? 'text-white border-l-2 border-white bg-[#252526]'
              : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#2d2d2d]'
          }`}
        >
          <Sliders className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
