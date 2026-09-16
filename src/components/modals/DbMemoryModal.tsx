'use client';

import React, { useState, useEffect } from 'react';
import {
  dbMemory,
  DomainBusinessRule,
  TableBusinessAnnotation,
  LearnedQueryPattern
} from '../../lib/db/dbMemory';
import {
  Brain,
  X,
  Plus,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  BookOpen,
  Tag,
  KeyRound,
  FileCode,
  Search,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface DbMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DbMemoryModal: React.FC<DbMemoryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'tables' | 'patterns'>('rules');
  const [rules, setRules] = useState<DomainBusinessRule[]>([]);
  const [tables, setTables] = useState<Record<string, TableBusinessAnnotation>>({});
  const [patterns, setPatterns] = useState<LearnedQueryPattern[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add rule form state
  const [showAddRule, setShowAddRule] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newRuleText, setNewRuleText] = useState('');
  const [newSeverity, setNewSeverity] = useState<'MANDATORY' | 'RECOMMENDED'>('MANDATORY');
  const [newTables, setNewTables] = useState('users');

  useEffect(() => {
    const update = () => {
      const state = dbMemory.getState();
      setRules(state.rules);
      setTables(state.tables);
      setPatterns(state.patterns);
    };

    update();
    const unsubscribe = dbMemory.subscribe(update);
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRuleText.trim()) return;

    dbMemory.addRule({
      title: newTitle.trim(),
      rule: newRuleText.trim(),
      severity: newSeverity,
      affectedTables: newTables.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    });

    setNewTitle('');
    setNewRuleText('');
    setShowAddRule(false);
  };

  const handleDeleteRule = (id: string) => {
    dbMemory.removeRule(id);
  };

  const filteredRules = rules.filter(
    r =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.affectedTables.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#333333] bg-[#252526]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-purple-500/10 text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                Database Domain Memory & Business Context
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/50 text-purple-300 font-mono">
                  P1 Knowledge Store
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Grounds specialized agents with organizational business invariants and table semantics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#333333] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs & Search */}
        <div className="flex items-center justify-between px-5 py-2 border-b border-[#333333] bg-[#1a1a1a] text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeTab === 'rules'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-[#252526]'
              }`}
            >
              Domain Invariant Rules ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeTab === 'tables'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-[#252526]'
              }`}
            >
              Table Semantics ({Object.keys(tables).length})
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-3 py-1 rounded font-medium transition ${
                activeTab === 'patterns'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-[#252526]'
              }`}
            >
              Learned Query Patterns ({patterns.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter memory..."
              className="bg-[#252526] border border-[#333333] rounded pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-44"
            />
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* ─── TAB 1: DOMAIN INVARIANT RULES ─────────────────────────────── */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">
                  Rules actively enforced by agents when formulating plans or analyzing queries:
                </span>
                <button
                  onClick={() => setShowAddRule(!showAddRule)}
                  className="px-2.5 py-1 rounded bg-[#252526] hover:bg-[#333333] text-purple-300 border border-purple-500/30 flex items-center gap-1 font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddRule ? 'Cancel' : 'Add Business Rule'}</span>
                </button>
              </div>

              {/* Add Rule Drawer Form */}
              {showAddRule && (
                <form onSubmit={handleCreateRule} className="bg-[#252526] border border-purple-500/40 rounded-lg p-3.5 space-y-3">
                  <div className="text-xs font-semibold text-white">Define New Domain Invariant Rule</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Rule Title</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="e.g. Tenant Isolation Check"
                        className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Severity & Target Tables</label>
                      <div className="flex gap-2">
                        <select
                          value={newSeverity}
                          onChange={e => setNewSeverity(e.target.value as any)}
                          className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="MANDATORY">Mandatory</option>
                          <option value="RECOMMENDED">Recommended</option>
                        </select>
                        <input
                          type="text"
                          value={newTables}
                          onChange={e => setNewTables(e.target.value)}
                          placeholder="users, accounts"
                          className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Rule Description / Semantic Directive</label>
                    <textarea
                      required
                      rows={2}
                      value={newRuleText}
                      onChange={e => setNewRuleText(e.target.value)}
                      placeholder="Always inject WHERE tenant_id = ? when querying multi-tenant entity tables."
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded p-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
                    >
                      Save Rule to Memory
                    </button>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="space-y-2.5">
                {filteredRules.map(r => (
                  <div key={r.id} className="bg-[#252526] border border-[#333333] rounded-lg p-3 space-y-1.5 hover:border-[#444444] transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.severity === 'MANDATORY'
                              ? 'bg-red-900/60 text-red-300 border border-red-500/40'
                              : 'bg-amber-900/60 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {r.severity}
                        </span>
                        <span className="font-semibold text-white text-xs">{r.title}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(r.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">{r.rule}</p>

                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                      <span>Affected Tables:</span>
                      {r.affectedTables.map((tbl, i) => (
                        <span key={i} className="font-mono bg-[#1e1e1e] px-1.5 py-0.5 rounded text-purple-300 border border-[#333333]">
                          {tbl}
                        </span>
                      ))}
                      <span>• Added: {r.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB 2: TABLE SEMANTICS ────────────────────────────────────── */}
          {activeTab === 'tables' && (
            <div className="space-y-3">
              {Object.values(tables).map(t => (
                <div key={t.tableName} className="bg-[#252526] border border-[#333333] rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-300 text-sm">{t.tableName}</span>
                    {t.ownerTeam && (
                      <span className="text-[10px] text-slate-400 bg-[#1e1e1e] px-2 py-0.5 rounded border border-[#333333]">
                        Team: {t.ownerTeam}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs">{t.description}</p>
                  <div className="text-[11px] text-slate-400 bg-[#1e1e1e] p-2 rounded border border-[#2a2a2a]">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">Primary Purpose:</span>
                    {t.primaryPurpose}
                  </div>
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex gap-1.5 pt-1">
                      {t.tags.map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 text-[10px] font-mono border border-purple-500/20">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── TAB 3: LEARNED QUERY PATTERNS ─────────────────────────────── */}
          {activeTab === 'patterns' && (
            <div className="space-y-3">
              {patterns.map(p => (
                <div key={p.id} className="bg-[#252526] border border-[#333333] rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs">{p.title}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      Optimized Pattern
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">{p.description}</p>
                  <pre className="bg-[#141414] border border-[#333333] p-2 rounded font-mono text-cyan-300 text-[11px] overflow-x-auto">
                    {p.sampleSql}
                  </pre>
                  {p.recommendedIndex && (
                    <div className="text-[11px] text-emerald-300 bg-[#1e1e1e] p-2 rounded border border-emerald-900/40 font-mono">
                      <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Recommended Index:</span>
                      {p.recommendedIndex}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#333333] bg-[#252526] text-xs">
          <span className="text-[11px] text-slate-400">
            Enriched context is automatically injected into all DB Agent ReAct loops.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#333333] hover:bg-[#3c3c3c] text-white font-medium transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
