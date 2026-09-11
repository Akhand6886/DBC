'use client';

import React, { useState } from 'react';
import { Terminal, Settings, Command, ChevronDown, FilePlus, FolderPlus, Save, Play, Search, GitBranch, Globe, Sliders, Sparkles } from 'lucide-react';

interface TopMenuBarProps {
  onOpenSettings: () => void;
  onOpenPalette: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onRunQuery: () => void;
  onOpenGit: () => void;
  showMissionControl?: boolean;
  onToggleMissionControl?: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onOpenSettings,
  onOpenPalette,
  onNewFile,
  onNewFolder,
  onToggleSidebar,
  onToggleTerminal,
  onRunQuery,
  onOpenGit,
  showMissionControl = false,
  onToggleMissionControl,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleAction = (action: () => void) => {
    setOpenMenu(null);
    action();
  };

  return (
    <div className="h-8 bg-[#323233] border-b border-[#3c3c3c] flex items-center justify-between px-3 text-xs text-[#cccccc] select-none font-sans relative z-40">
      {/* Menu Items */}
      <div className="flex items-center space-x-1">
        {/* Brand Icon */}
        <div className="flex items-center space-x-1.5 pr-2 border-r border-[#3c3c3c]">
          <span className="font-bold text-white tracking-tight flex items-center space-x-1">
            <span className="text-[#007acc] font-black text-sm">✦</span>
            <span>Code-OSS</span>
          </span>
        </div>

        {/* File Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('file')}
            className={`px-2 py-0.5 rounded hover:bg-[#3c3c3c] hover:text-white transition-colors text-[11px] ${
              openMenu === 'file' ? 'bg-[#3c3c3c] text-white' : ''
            }`}
          >
            File
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 mt-1 w-48 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-2xl py-1 z-50 text-[11px]">
              <button onClick={() => handleAction(onNewFile)} className="w-full px-3 py-1.5 text-left hover:bg-[#007acc] hover:text-white flex items-center justify-between">
                <span>New File</span>
                <span className="text-[10px] text-slate-400">⌘N</span>
              </button>
              <button onClick={() => handleAction(onNewFolder)} className="w-full px-3 py-1.5 text-left hover:bg-[#007acc] hover:text-white flex items-center justify-between">
                <span>New Folder</span>
              </button>
              <div className="my-1 border-t border-[#3c3c3c]"></div>
              <button onClick={() => handleAction(onOpenSettings)} className="w-full px-3 py-1.5 text-left hover:bg-[#007acc] hover:text-white flex items-center justify-between">
                <span>Preferences: Settings</span>
                <span className="text-[10px] text-slate-400">⌘,</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('edit')}
            className={`px-2 py-0.5 rounded hover:bg-[#3c3c3c] hover:text-white transition-colors text-[11px] ${
              openMenu === 'edit' ? 'bg-[#3c3c3c] text-white' : ''
            }`}
          >
            Edit
          </button>
          {openMenu === 'edit' && (
            <div className="absolute left-0 mt-1 w-48 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-2xl py-1 z-50 text-[11px]">
              <button onClick={() => handleAction(onOpenPalette)} className="w-full px-3 py-1.5 text-left hover:bg-[#007acc] hover:text-white flex items-center justify-between">
                <span>Command Palette...</span>
                <span className="text-[10px] text-slate-400">⌘⇧P</span>
              </button>
            </div>
          )}
        </div>

        {/* View Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('view')}
            className={`px-2 py-0.5 rounded hover:bg-[#3c3c3c] hover:text-white transition-colors text-[11px] ${
              openMenu === 'view' ? 'bg-[#3c3c3c] text-white' : ''
            }`}
          >
            View
          </button>
          {openMenu === 'view' && (
            <div className="absolute left-0 mt-1 w-48 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-2xl py-1 z-50 text-[11px]">
              <button onClick={() => handleAction(onToggleSidebar)} className="w-full px-3 py-1.5 text-left hover:bg-[#007acc] hover:text-white flex items-center justify-between">
                <span>Toggle Primary Sidebar</span>
                <span className="text-[10px] text-slate-400">⌘B</span>
              </button>
              <button onClick={() => handleAction(onToggleTerminal)} className="w-full px-3 py-1.5 text-left hover:bg-[#007acc] hover:text-white flex items-center justify-between">
                <span>Toggle Terminal Panel</span>
                <span className="text-[10px] text-slate-400">⌘J</span>
              </button>
              <button onClick={() => handleAction(onOpenGit)} className="w-full px-3 py-1.5 text-left hover:bg-[#007acc] hover:text-white flex items-center justify-between">
                <span>Source Control</span>
                <span className="text-[10px] text-slate-400">⌘⇧G</span>
              </button>
            </div>
          )}
        </div>

        {/* Run Dropdown */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('run')}
            className={`px-2 py-0.5 rounded hover:bg-[#3c3c3c] hover:text-white transition-colors text-[11px] ${
              openMenu === 'run' ? 'bg-[#3c3c3c] text-white' : ''
            }`}
          >
            Run
          </button>
          {openMenu === 'run' && (
            <div className="absolute left-0 mt-1 w-48 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-2xl py-1 z-50 text-[11px]">
              <button onClick={() => handleAction(onRunQuery)} className="w-full px-3 py-2 text-left hover:bg-[#007acc] hover:text-white flex items-center justify-between font-bold text-cyan-300">
                <span>Execute SQL Query</span>
                <span className="text-[10px] text-slate-400">▶</span>
              </button>
            </div>
          )}
        </div>

        {['Selection', 'Go', 'Terminal', 'Help'].map((item) => (
          <button
            key={item}
            onClick={() => handleAction(onOpenPalette)}
            className="hidden lg:inline-block px-2 py-0.5 rounded hover:bg-[#3c3c3c] hover:text-white transition-colors text-[11px]"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Window Title & Search Palette Bar */}
      <button
        onClick={onOpenPalette}
        className="hidden md:flex bg-[#1e1e1e] border border-[#3c3c3c] hover:border-[#007acc] px-3 py-0.5 rounded text-[11px] text-[#cccccc] items-center space-x-2 max-w-xs w-full flex-1 mx-2 justify-center shadow-inner truncate"
      >
        <Command className="h-3 w-3 text-[#007acc] shrink-0" />
        <span className="truncate">Agentic AI IDE — DBMS Studio</span>
      </button>

      {/* Right Utility Shortcuts */}
      <div className="flex items-center space-x-2 text-[11px] shrink-0">
        {onToggleMissionControl && (
          <button
            onClick={onToggleMissionControl}
            className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1.5 transition-all ${
              showMissionControl
                ? 'bg-[#007acc] text-white shadow'
                : 'bg-[#1e1e1e] hover:bg-[#3c3c3c] text-slate-300 border border-[#3c3c3c]'
            }`}
            title="Toggle AI Copilot (⌘L)"
          >
            <Sparkles className="h-3 w-3 text-yellow-300 shrink-0" />
            <span className="hidden sm:inline">AI Copilot</span>
            <span className="sm:hidden">AI</span>
          </button>
        )}
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
