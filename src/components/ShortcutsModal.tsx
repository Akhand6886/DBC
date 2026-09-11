'use client';

import React from 'react';
import { Keyboard, X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  items: ShortcutItem[];
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const shortcuts: ShortcutCategory[] = [
    {
      category: 'Navigation & View',
      items: [
        { keys: ['⌘', 'P'], description: 'Open Command Palette / Quick File Open' },
        { keys: ['⌘', '⇧', 'P'], description: 'Open Command Palette with Actions' },
        { keys: ['⌘', 'B'], description: 'Toggle Primary Sidebar' },
        { keys: ['⌘', 'J'], description: 'Toggle Bottom Terminal Panel' },
        { keys: ['⌘', 'L'], description: 'Toggle AI Copilot Drawer' },
      ]
    },
    {
      category: 'Editor & Files',
      items: [
        { keys: ['⌘', 'S'], description: 'Save Active File to Workspace' },
        { keys: ['⌘', 'W'], description: 'Close Active Editor Tab' },
        { keys: ['⌘', 'N'], description: 'Create New SQL Script File' },
        { keys: ['⌘', '⇧', 'F'], description: 'Global Workspace Search & Replace' },
        { keys: ['⌘', 'F'], description: 'Search Current File / Workspace' },
      ]
    },
    {
      category: 'Execution & Database',
      items: [
        { keys: ['⌘', '↵'], description: 'Execute Active SQL Query / Run Tests' },
        { keys: ['⌘', '⇧', 'G'], description: 'Open Git Source Control Panel' },
        { keys: ['⌘', '⇧', 'R'], description: 'Configure Router Confidence Thresholds' },
      ]
    },
    {
      category: 'General & Preferences',
      items: [
        { keys: ['⌘', ','], description: 'Open Preferences & BYOK API Keys Manager' },
        { keys: ['⌘', '/'], description: 'Open this Keyboard Shortcuts Cheat Sheet' },
        { keys: ['Esc'], description: 'Dismiss Any Active Dialog or Drawer' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-mono text-xs select-none">
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3c3c3c] pb-3">
          <div className="flex items-center space-x-2 text-white font-sans font-bold">
            <Keyboard className="h-5 w-5 text-[#007acc]" />
            <div>
              <h2 className="text-xs uppercase tracking-wider font-bold">Keyboard Shortcuts & Commands</h2>
              <p className="text-[11px] text-slate-400 font-normal">Fast developer navigation keys for DBC Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shortcuts.map((cat, idx) => (
            <div key={idx} className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#007acc] border-b border-[#2d2d2d] pb-1.5 flex items-center space-x-1.5">
                <Command className="h-3 w-3" />
                <span>{cat.category}</span>
              </div>
              <div className="space-y-1.5">
                {cat.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center justify-between py-1 text-[11px]">
                    <span className="text-slate-300 font-sans text-xs truncate max-w-[200px]">{item.description}</span>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <kbd key={kIdx} className="bg-[#2d2d2d] text-slate-200 border border-[#3c3c3c] rounded px-1.5 py-0.5 font-bold text-[10px] min-w-[20px] text-center shadow-xs">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
