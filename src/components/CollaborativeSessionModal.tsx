'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  collaborativeSessionManager,
  CollaborativeSession,
  SessionParticipant,
  ProposalCard,
  DelegationTask,
  ResourceLock,
  SessionEvent,
  ChatMessage
} from '../lib/collaboration/collaborativeSession';

interface CollaborativeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteSql?: (sql: string) => void;
}

export const CollaborativeSessionModal: React.FC<CollaborativeSessionModalProps> = ({
  isOpen,
  onClose,
  onExecuteSql
}) => {
  const [session, setSession] = useState<CollaborativeSession>(() => collaborativeSessionManager.getActiveSession());
  const [allSessions, setAllSessions] = useState<CollaborativeSession[]>(() => collaborativeSessionManager.getAllSessions());
  const [activeTab, setActiveTab] = useState<'feed' | 'blackboard' | 'replay'>('feed');
  const [rightPanelTab, setRightPanelTab] = useState<'blackboard' | 'replay'>('blackboard');

  // Input states
  const [messageInput, setMessageInput] = useState('');
  const [scratchpadText, setScratchpadText] = useState(session.scratchpad.content);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [showDelegationForm, setShowDelegationForm] = useState(false);
  const [showLockForm, setShowLockForm] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // Proposal form state
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalTable, setProposalTable] = useState('users');
  const [proposalSql, setProposalSql] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');

  // Delegation form state
  const [delegationTarget, setDelegationTarget] = useState('agent-security');
  const [delegationObjective, setDelegationObjective] = useState('');
  const [delegationSql, setDelegationSql] = useState('');

  // Lock form state
  const [lockTable, setLockTable] = useState('users');
  const [lockMode, setLockMode] = useState<'EXCLUSIVE_WRITE' | 'SHARED_READ'>('EXCLUSIVE_WRITE');

  // Event Replay scrubber state
  const [replayStep, setReplayStep] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = collaborativeSessionManager.subscribe(() => {
      const active = collaborativeSessionManager.getActiveSession();
      setSession({ ...active });
      setAllSessions(collaborativeSessionManager.getAllSessions());
      setScratchpadText(active.scratchpad.content);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    collaborativeSessionManager.postMessage(session.id, 'operator-human', messageInput.trim());
    setMessageInput('');
  };

  const handleMentionClick = (mentionTag: string) => {
    setMessageInput(prev => `${prev} ${mentionTag} `.trimStart());
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle.trim() || !proposalSql.trim()) return;

    collaborativeSessionManager.createProposal(
      session.id,
      'operator-human',
      proposalTitle.trim(),
      proposalDesc.trim() || 'Operator submitted proposal for council consensus',
      proposalSql.trim(),
      proposalTable,
      2
    );

    setProposalTitle('');
    setProposalSql('');
    setProposalDesc('');
    setShowProposalForm(false);
  };

  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegationObjective.trim()) return;

    collaborativeSessionManager.delegateTask(
      session.id,
      'operator-human',
      delegationTarget,
      delegationObjective.trim(),
      {
        targetTable: proposalTable,
        sqlStatement: delegationSql.trim() || undefined
      }
    );

    setDelegationObjective('');
    setDelegationSql('');
    setShowDelegationForm(false);
  };

  const handleAcquireLock = (e: React.FormEvent) => {
    e.preventDefault();
    const res = collaborativeSessionManager.acquireLock(
      session.id,
      'operator-human',
      'TABLE',
      lockTable,
      lockMode,
      300000,
      'Manual operator maintenance'
    );

    if (!res.success) {
      alert(`Lock Conflict: ${res.reason}`);
    }
    setShowLockForm(false);
  };

  const handleReleaseLock = (targetName: string) => {
    collaborativeSessionManager.releaseLock(session.id, 'operator-human', targetName);
  };

  const handleVote = (proposalId: string, vote: 'APPROVE' | 'REJECT') => {
    collaborativeSessionManager.voteOnProposal(
      session.id,
      proposalId,
      'operator-human',
      vote,
      vote === 'APPROVE' ? 'Lead engineer sign-off verified' : 'Requires revision'
    );
  };

  const handleExecuteProposal = (proposal: ProposalCard) => {
    const res = collaborativeSessionManager.executeProposal(session.id, proposal.id, 'operator-human');
    if (res.success && onExecuteSql) {
      onExecuteSql(proposal.proposedSql);
    }
  };

  const handleSaveScratchpad = () => {
    collaborativeSessionManager.updateScratchpad(session.id, 'operator-human', scratchpadText);
  };

  const handleCreateNewSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;

    const newSess = collaborativeSessionManager.createSession(
      newSessionName.trim(),
      'Collaborative multi-agent database investigation and optimization session.'
    );
    setSession(newSess);
    setNewSessionName('');
    setShowNewSessionModal(false);
  };

  const handleExportReplay = () => {
    const jsonStr = collaborativeSessionManager.exportSessionReplay(session.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-replay.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const participantsList = Object.values(session.participants);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden text-[#cccccc]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#3c3c3c] bg-[#252526]">
          <div className="flex items-center gap-3">
            <span className="text-xl">🤝</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white tracking-wide">
                  DBC Multi-Agent Collaboration Studio
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  🟢 4 Agents Connected
                </span>
              </div>
              <p className="text-xs text-[#858585]">
                Shared sessions, agent-to-agent delegation, distributed resource locks & consensus engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Session Switcher */}
            <select
              value={session.id}
              onChange={e => {
                const s = collaborativeSessionManager.switchSession(e.target.value);
                setSession(s);
              }}
              aria-label="Active Collaborative Session"
              className="bg-[#2d2d30] border border-[#3c3c3c] text-xs text-white rounded px-2.5 py-1.5 focus:outline-none focus:border-[#007acc]"
            >
              {allSessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowNewSessionModal(true)}
              className="px-2.5 py-1.5 bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c] text-xs rounded text-white transition-colors"
            >
              + New Session
            </button>

            <button
              onClick={handleExportReplay}
              className="px-2.5 py-1.5 bg-[#2d2d30] hover:bg-[#3c3c3c] border border-[#3c3c3c] text-xs rounded text-white transition-colors flex items-center gap-1"
              title="Export event-sourced session replay JSON"
            >
              <span>💾</span> Export Replay
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#3c3c3c] rounded text-[#cccccc] hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Studio Body: 3-Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT RAIL: Participants, Locks & Delegation */}
          <div className="w-80 border-r border-[#3c3c3c] bg-[#181818] flex flex-col overflow-y-auto">
            {/* Participants Card */}
            <div className="p-3 border-b border-[#2d2d30]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white tracking-wider uppercase">
                  Council Participants ({participantsList.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Consensus: 2/2</span>
              </div>
              <div className="space-y-2">
                {participantsList.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded bg-[#252526] border border-[#333333] hover:border-[#444444] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="text-base">{p.avatar}</span>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#252526] ${
                            p.state === 'ONLINE'
                              ? 'bg-emerald-500'
                              : p.state === 'THINKING'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-red-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white flex items-center gap-1.5">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-[#858585] flex items-center gap-1">
                          <span
                            className="px-1 py-0.2 rounded text-[9px] font-mono"
                            style={{ backgroundColor: `${p.color}20`, color: p.color }}
                          >
                            {p.badge}
                          </span>
                          {p.currentFocus && <span>focus: {p.currentFocus}</span>}
                        </div>
                      </div>
                    </div>
                    {p.state === 'THINKING' && (
                      <span className="text-[10px] text-amber-400 animate-pulse font-mono">
                        Thinking...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cooperative Resource Locks Card */}
            <div className="p-3 border-b border-[#2d2d30]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white tracking-wider uppercase flex items-center gap-1">
                  <span>🔒</span> Resource Locks ({session.locks.length})
                </span>
                <button
                  onClick={() => setShowLockForm(!showLockForm)}
                  className="text-[10px] text-[#007acc] hover:underline"
                >
                  + Acquire
                </button>
              </div>

              {showLockForm && (
                <form onSubmit={handleAcquireLock} className="mb-2 p-2 bg-[#252526] border border-[#3c3c3c] rounded space-y-1.5">
                  <div className="text-[11px] text-white font-medium">Acquire Cooperative Lock</div>
                  <input
                    type="text"
                    value={lockTable}
                    onChange={e => setLockTable(e.target.value)}
                    placeholder="Table name (e.g. users)"
                    className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-2 py-1 rounded text-white"
                  />
                  <div className="flex gap-2">
                    <select
                      value={lockMode}
                      onChange={e => setLockMode(e.target.value as any)}
                      aria-label="Lock Mode"
                      className="bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-1.5 py-1 rounded text-white flex-1"
                    >
                      <option value="EXCLUSIVE_WRITE">EXCLUSIVE_WRITE</option>
                      <option value="SHARED_READ">SHARED_READ</option>
                    </select>
                    <button
                      type="submit"
                      className="px-2 py-1 bg-[#007acc] text-white text-xs rounded hover:bg-[#0062a3]"
                    >
                      Lock
                    </button>
                  </div>
                </form>
              )}

              {session.locks.length === 0 ? (
                <div className="text-[11px] text-[#707070] italic">No active locks held.</div>
              ) : (
                <div className="space-y-1.5">
                  {session.locks.map(l => (
                    <div
                      key={l.id}
                      className="p-1.5 rounded bg-[#252526] border border-[#333333] text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-mono text-white flex items-center gap-1">
                          <span className={l.mode === 'EXCLUSIVE_WRITE' ? 'text-amber-400' : 'text-blue-400'}>
                            {l.mode === 'EXCLUSIVE_WRITE' ? '⚡' : '👁️'}
                          </span>
                          <span>{l.targetName}</span>
                          <span className="text-[9px] text-[#858585]">({l.mode})</span>
                        </div>
                        <div className="text-[10px] text-[#858585]">
                          Holder: {session.participants[l.heldByParticipantId]?.name || l.heldByParticipantId}
                        </div>
                      </div>
                      {l.heldByParticipantId === 'operator-human' && (
                        <button
                          onClick={() => handleReleaseLock(l.targetName)}
                          className="text-[10px] text-red-400 hover:text-red-300 font-mono underline"
                        >
                          Release
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delegation Board Card */}
            <div className="p-3 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white tracking-wider uppercase flex items-center gap-1">
                  <span>📨</span> Delegations ({session.delegations.length})
                </span>
                <button
                  onClick={() => setShowDelegationForm(!showDelegationForm)}
                  className="text-[10px] text-[#007acc] hover:underline"
                >
                  + Delegate
                </button>
              </div>

              {showDelegationForm && (
                <form onSubmit={handleCreateDelegation} className="mb-2 p-2 bg-[#252526] border border-[#3c3c3c] rounded space-y-1.5">
                  <div className="text-[11px] text-white font-medium">Delegate Task to Peer Agent</div>
                  <select
                    value={delegationTarget}
                    onChange={e => setDelegationTarget(e.target.value)}
                    aria-label="Target Agent Persona"
                    className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-2 py-1 rounded text-white"
                  >
                    <option value="agent-security">🛡️ Security Auditor</option>
                    <option value="agent-dba">⚡ DBA Optimizer</option>
                    <option value="agent-architect">🏗️ Schema Architect</option>
                    <option value="agent-analyst">📊 Data Analyst</option>
                  </select>
                  <input
                    type="text"
                    value={delegationObjective}
                    onChange={e => setDelegationObjective(e.target.value)}
                    placeholder="Objective (e.g. Verify PII in users)"
                    className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-2 py-1 rounded text-white"
                  />
                  <input
                    type="text"
                    value={delegationSql}
                    onChange={e => setDelegationSql(e.target.value)}
                    placeholder="Optional SQL or target object"
                    className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-2 py-1 rounded text-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-1 bg-[#007acc] text-white text-xs rounded hover:bg-[#0062a3]"
                  >
                    Dispatch Delegation
                  </button>
                </form>
              )}

              {session.delegations.length === 0 ? (
                <div className="text-[11px] text-[#707070] italic">No active delegation handoffs.</div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {session.delegations.map(d => (
                    <div
                      key={d.id}
                      className="p-2 rounded bg-[#252526] border border-[#333333] text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white truncate max-w-[170px]">
                          {d.objective}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            d.status === 'RESOLVED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400 animate-pulse'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#858585] mt-1">
                        To: {session.participants[d.toParticipantId]?.name || d.toParticipantId}
                      </div>
                      {d.verdict && (
                        <div className="mt-1 p-1 bg-[#1e1e1e] rounded text-[10px] text-[#cccccc] border border-[#3c3c3c]">
                          <span className="font-mono text-emerald-400 font-semibold">
                            {d.verdict.approved ? '✅ APPROVED' : '❌ MODIFICATIONS'}
                          </span>
                          <p className="mt-0.5 text-[#aaaaaa] line-clamp-2">
                            {d.verdict.findings.join(' ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CENTER STAGE: Multi-Agent Chat Timeline & Turn-Taking Feed */}
          <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
            {/* Session Topic Header */}
            <div className="px-4 py-2 border-b border-[#2d2d30] bg-[#252526] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>🎯 Topic:</span>
                  <span>{session.topic}</span>
                </div>
                <div className="text-[10px] text-[#858585] flex items-center gap-3 mt-0.5">
                  <span>Room: {session.name}</span>
                  <span>•</span>
                  <span>Created: {session.createdAt}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProposalForm(!showProposalForm)}
                  className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-xs rounded transition-colors flex items-center gap-1 font-medium"
                >
                  <span>📝</span> Propose SQL Migration
                </button>
              </div>
            </div>

            {/* Proposal Form (Modal/Drawer in Center) */}
            {showProposalForm && (
              <form onSubmit={handleCreateProposal} className="m-3 p-3 bg-[#252526] border border-amber-500/40 rounded-lg shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                    <span>⚡</span> Draft SQL Proposal for Multi-Agent Consensus
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProposalForm(false)}
                    className="text-xs text-[#858585] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={e => setProposalTitle(e.target.value)}
                    placeholder="Proposal title (e.g. Add Composite Index)"
                    className="bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-2.5 py-1.5 rounded text-white"
                  />
                  <input
                    type="text"
                    value={proposalTable}
                    onChange={e => setProposalTable(e.target.value)}
                    placeholder="Target Table (e.g. users)"
                    className="bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-2.5 py-1.5 rounded text-white"
                  />
                </div>
                <textarea
                  value={proposalSql}
                  onChange={e => setProposalSql(e.target.value)}
                  placeholder="Executable SQL (e.g. CREATE INDEX idx_users_role_composite ON users(role_id, id);)"
                  rows={2}
                  className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-2.5 py-1.5 rounded text-white font-mono"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProposalForm(false)}
                    className="px-3 py-1 text-xs text-[#cccccc] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded font-medium transition-colors"
                  >
                    Submit for Peer Review
                  </button>
                </div>
              </form>
            )}

            {/* Timeline Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {session.messages.map(msg => {
                const sender = session.participants[msg.senderId];
                const proposal = msg.proposalId
                  ? session.proposals.find(p => p.id === msg.proposalId)
                  : null;

                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border transition-all ${
                      msg.senderId === 'operator-human'
                        ? 'bg-[#252526] border-[#3c3c3c] ml-8'
                        : 'bg-[#1e1e1e] border-[#333333] mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{sender?.avatar || '🤖'}</span>
                        <span className="text-xs font-semibold text-white">
                          {sender?.name || msg.senderName}
                        </span>
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-mono"
                          style={{
                            backgroundColor: `${sender?.color || '#007acc'}20`,
                            color: sender?.color || '#007acc'
                          }}
                        >
                          {sender?.badge || msg.senderRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#707070] font-mono">{msg.timestamp}</span>
                    </div>

                    <div className="text-xs text-[#cccccc] whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Proposal Card Embed */}
                    {proposal && (
                      <div className="mt-2.5 p-3 rounded bg-[#252526] border border-amber-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-amber-300">
                            📜 {proposal.title}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              proposal.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : proposal.status === 'EXECUTED'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            Status: {proposal.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#aaaaaa] mb-2">{proposal.description}</p>

                        <div className="p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c] font-mono text-xs text-amber-200 mb-2 overflow-x-auto">
                          {proposal.proposedSql}
                        </div>

                        {/* Votes breakdown */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#333333]">
                          <div className="flex items-center gap-1.5 text-[10px] text-[#aaaaaa]">
                            <span>Consensus:</span>
                            {Object.values(proposal.votes).map(v => (
                              <span
                                key={v.participantId}
                                className={`px-1.5 py-0.5 rounded font-mono ${
                                  v.vote === 'APPROVE'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {session.participants[v.participantId]?.name || v.participantId} {v.vote === 'APPROVE' ? '✅' : '❌'}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            {proposal.status === 'PENDING_REVIEW' && (
                              <>
                                <button
                                  onClick={() => handleVote(proposal.id, 'APPROVE')}
                                  className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs rounded transition-colors"
                                >
                                  Sign-off (Approve)
                                </button>
                                <button
                                  onClick={() => handleVote(proposal.id, 'REJECT')}
                                  className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 text-xs rounded transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {proposal.status === 'APPROVED' && (
                              <button
                                onClick={() => handleExecuteProposal(proposal)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded font-medium shadow transition-colors flex items-center gap-1"
                              >
                                <span>🚀</span> Execute Proposal
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Mention Pills & Chat Input */}
            <div className="p-3 border-t border-[#2d2d30] bg-[#252526]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-[#858585]">Summon:</span>
                <button
                  type="button"
                  onClick={() => handleMentionClick('@dba')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4ec9b0]/20 text-[#4ec9b0] hover:bg-[#4ec9b0]/30 transition-colors"
                >
                  @dba
                </button>
                <button
                  type="button"
                  onClick={() => handleMentionClick('@architect')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#dcdcaa]/20 text-[#dcdcaa] hover:bg-[#dcdcaa]/30 transition-colors"
                >
                  @architect
                </button>
                <button
                  type="button"
                  onClick={() => handleMentionClick('@analyst')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#9cdcfe]/20 text-[#9cdcfe] hover:bg-[#9cdcfe]/30 transition-colors"
                >
                  @analyst
                </button>
                <button
                  type="button"
                  onClick={() => handleMentionClick('@security')}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f14c4c]/20 text-[#f14c4c] hover:bg-[#f14c4c]/30 transition-colors"
                >
                  @security
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  placeholder="Collaborate with council agents... use @dba, @security, @architect to delegate..."
                  className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-3 py-2 rounded text-white focus:outline-none focus:border-[#007acc]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#007acc] hover:bg-[#0062a3] text-white text-xs rounded font-medium transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT RAIL: Collaborative Blackboard & Event Sourcing Replay */}
          <div className="w-88 border-l border-[#3c3c3c] bg-[#1a1a1a] flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-[#3c3c3c] bg-[#252526]">
              <button
                onClick={() => setRightPanelTab('blackboard')}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1 ${
                  rightPanelTab === 'blackboard'
                    ? 'border-[#007acc] text-white bg-[#1e1e1e]'
                    : 'border-transparent text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                <span>📋</span> Blackboard
              </button>
              <button
                onClick={() => setRightPanelTab('replay')}
                className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1 ${
                  rightPanelTab === 'replay'
                    ? 'border-[#007acc] text-white bg-[#1e1e1e]'
                    : 'border-transparent text-[#858585] hover:text-[#cccccc]'
                }`}
              >
                <span>⏪</span> Event Replay ({session.events.length})
              </button>
            </div>

            {/* Panel Body */}
            {rightPanelTab === 'blackboard' ? (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[#858585]">
                    Shared Council Scratchpad
                  </span>
                  <span className="text-[10px] text-[#707070] font-mono">
                    Edited by {session.scratchpad.lastEditedBy}
                  </span>
                </div>
                <textarea
                  value={scratchpadText}
                  onChange={e => setScratchpadText(e.target.value)}
                  className="flex-1 w-full bg-[#1e1e1e] border border-[#3c3c3c] text-xs p-2.5 rounded text-white font-mono resize-none focus:outline-none focus:border-[#007acc]"
                  placeholder="Collaborative scratchpad for joint hypotheses and migration checklists..."
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveScratchpad}
                    className="px-3 py-1.5 bg-[#007acc] hover:bg-[#0062a3] text-white text-xs rounded font-medium transition-colors"
                  >
                    Sync Blackboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[#858585]">
                    Event Sourcing Timeline
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Immutable Log
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {session.events.map((evt, idx) => (
                    <div
                      key={evt.id}
                      className="p-2 rounded bg-[#252526] border border-[#333333] text-[11px]"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#858585] mb-1 font-mono">
                        <span>#{evt.sequenceNumber} • {evt.type}</span>
                        <span>{evt.timestamp}</span>
                      </div>
                      <div className="text-white text-xs font-medium">
                        {evt.summary}
                      </div>
                      <div className="text-[10px] text-[#707070] mt-0.5">
                        Actor: {session.participants[evt.actorId]?.name || evt.actorId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Session Modal Dialog */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <form onSubmit={handleCreateNewSession} className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 w-96 shadow-2xl space-y-3">
            <div className="text-sm font-semibold text-white">Create New Collaborative Session</div>
            <input
              type="text"
              value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              placeholder="Session Name (e.g. Analytics War Room)"
              className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-xs px-3 py-2 rounded text-white focus:outline-none focus:border-[#007acc]"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="px-3 py-1.5 text-xs text-[#cccccc] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#007acc] text-white text-xs rounded hover:bg-[#0062a3]"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
