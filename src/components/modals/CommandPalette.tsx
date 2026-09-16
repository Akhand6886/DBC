'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Command, Search, FileCode, Settings, GitBranch, Zap, Globe, ShieldCheck, BarChart2, Play, Palette, Key, Terminal } from 'lucide-react';

export interface PaletteAction {
  id: string;
  label: string;
  category: 'file' | 'action' | 'settings' | 'git' | 'router' | 'navigation';
  shortcut?: string;
  icon: React.ReactNode;
  handler: () => void;
}

interface CommandPaletteProps {
  actions: PaletteAction[];
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ actions, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const term = query.toLowerCase();
    return actions.filter(
      a => a.label.toLowerCase().includes(term) || a.category.toLowerCase().includes(term)
    );
  }, [query, actions]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].handler();
        onClose();
      }
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      file: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      action: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      settings: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      git: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      router: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      navigation: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    };
    return (
      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${colors[category] || colors.action}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4" onClick={onClose}>
      <div
        className="bg-ide-sidebar border border-ide-border rounded-2xl max-w-lg w-full shadow-2xl font-mono text-xs animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="px-4 py-3 border-b border-ide-border flex items-center space-x-3">
          <Command className="h-4 w-4 text-cyan-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="text-[10px] text-slate-500 bg-ide-card border border-ide-border px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-xs">
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((action, idx) => (
              <div
                key={action.id}
                onClick={() => {
                  action.handler();
                  onClose();
                }}
                className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-ide-accent/20 text-white'
                    : 'text-slate-300 hover:bg-ide-card/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">{action.icon}</span>
                  <span className="text-xs">{action.label}</span>
                  {getCategoryBadge(action.category)}
                </div>
                {action.shortcut && (
                  <kbd className="text-[10px] text-slate-500 bg-ide-card border border-ide-border px-1.5 py-0.5 rounded">
                    {action.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-ide-border flex items-center justify-between text-[10px] text-slate-500">
          <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center space-x-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
