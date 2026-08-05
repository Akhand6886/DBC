'use client';

import React from 'react';
import { Terminal, Settings, Command } from 'lucide-react';

interface TopMenuBarProps {
  onOpenSettings: () => void;
  onOpenPalette: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onOpenSettings,
  onOpenPalette,
}) => {
  return (
    <div className="h-8 bg-[#323233] border-b border-[#3c3c3c] flex items-center justify-between px-3 text-xs text-[#cccccc] select-none font-sans">
      {/* Menu Items */}
      <div className="flex items-center space-x-1">
        {/* Brand Icon */}
        <div className="flex items-center space-x-1.5 pr-2 border-r border-[#3c3c3c]">
          <span className="font-bold text-white tracking-tight flex items-center space-x-1">
            <span className="text-[#007acc] font-black text-sm">✦</span>
            <span>Code-OSS</span>
          </span>
        </div>

        {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map((item) => (
          <button
            key={item}
            className="px-2 py-0.5 rounded hover:bg-[#3c3c3c] hover:text-white transition-colors text-[11px]"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Window Title & Search Palette Bar */}
      <button
        onClick={onOpenPalette}
        className="bg-[#1e1e1e] border border-[#3c3c3c] hover:border-[#007acc] px-4 py-0.5 rounded text-[11px] text-[#cccccc] flex items-center space-x-2 w-80 justify-center shadow-inner"
      >
        <Command className="h-3 w-3 text-[#007acc]" />
        <span>Agentic AI IDE — DBMS Studio</span>
      </button>

      {/* Right Utility Shortcuts */}
      <div className="flex items-center space-x-2 text-[11px]">
        <button
          onClick={onOpenSettings}
          className="hover:text-white p-1 rounded hover:bg-[#3c3c3c]"
          title="Settings (⌘,)"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
