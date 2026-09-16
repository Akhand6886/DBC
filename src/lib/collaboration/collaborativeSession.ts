/**
 * DBC Collaborative Agent Sessions Engine
 * Manages multi-agent shared session workspaces, agent-to-agent delegation handoffs,
 * cooperative distributed resource locking, peer review consensus, and event-sourced replay.
 */

export type ParticipantRole = 
  | 'OPERATOR' 
  | 'DBA_OPTIMIZER' 
  | 'SCHEMA_ARCHITECT' 
  | 'DATA_ANALYST' 
  | 'SECURITY_AUDITOR';

export type PresenceState = 'ONLINE' | 'THINKING' | 'BUSY' | 'OFFLINE';

export interface SessionParticipant {
  id: string;
  name: string;
  role: ParticipantRole;
  avatar: string;
  color: string;
  badge: string;
  state: PresenceState;
  currentFocus?: string;
  isAgent: boolean;
}

export type DelegationStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface DelegationVerdict {
  approved: boolean;
  confidence: number;
  findings: string[];
  suggestedModifications?: string;
  evaluatedAt: string;
}

export interface DelegationTask {
  id: string;
  fromParticipantId: string;
  toParticipantId: string;
  objective: string;
  contextPayload: {
    targetTable?: string;
    sqlStatement?: string;
    planSummary?: string;
    riskScore?: number;
    metadata?: Record<string, any>;
  };
  status: DelegationStatus;
  verdict?: DelegationVerdict;
  createdAt: string;
  resolvedAt?: string;
}

export type ProposalConsensus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface ProposalVote {
  participantId: string;
  vote: 'APPROVE' | 'REJECT' | 'NEUTRAL';
  comment: string;
  timestamp: string;
}

export interface ProposalCard {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  proposedSql: string;
  targetTable: string;
  status: ProposalConsensus;
  votes: Record<string, ProposalVote>;
  consensusThreshold: number;
  createdAt: string;
  executedAt?: string;
}

export type LockResourceType = 'TABLE' | 'SCHEMA' | 'GLOBAL';
export type LockMode = 'SHARED_READ' | 'EXCLUSIVE_WRITE';

export interface ResourceLock {
  id: string;
  resourceType: LockResourceType;
  targetName: string;
  heldByParticipantId: string;
  mode: LockMode;
  acquiredAt: string;
  expiresAt: string;
  purpose: string;
}

export type SessionEventType = 
  | 'PARTICIPANT_JOINED'
  | 'PARTICIPANT_STATE_CHANGED'
  | 'CHAT_MESSAGE'
  | 'DELEGATION_CREATED'
  | 'DELEGATION_RESOLVED'
  | 'LOCK_ACQUIRED'
  | 'LOCK_RELEASED'
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_VOTED'
  | 'PROPOSAL_EXECUTED'
  | 'SCRATCHPAD_UPDATED';

export interface SessionEvent {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  type: SessionEventType;
  actorId: string;
  summary: string;
  payload: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: ParticipantRole;
  senderName: string;
  content: string;
  mentions: string[];
  proposalId?: string;
  delegationTaskId?: string;
  timestamp: string;
}

export interface CollaborativeSession {
  id: string;
  name: string;
  topic: string;
  createdAt: string;
  participants: Record<string, SessionParticipant>;
  messages: ChatMessage[];
  delegations: DelegationTask[];
  proposals: ProposalCard[];
  locks: ResourceLock[];
  scratchpad: {
    content: string;
    lastEditedBy: string;
    lastEditedAt: string;
  };
  events: SessionEvent[];
}

const STORAGE_KEY = 'dbc_collaborative_sessions_state';

export class CollaborativeSessionManager {
  private sessions: Map<string, CollaborativeSession> = new Map();
  private activeSessionId: string = 'session-default';
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.seedDefaultSession();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  /**
   * Initializes the default collaborative workspace room with human operator and 4 AI personas.
   */
  private seedDefaultSession(): void {
    const defaultSession: CollaborativeSession = {
      id: 'session-default',
      name: 'Alpha Migration & Performance Council',
      topic: 'Optimizing high-throughput user authentication and zero-downtime RBAC schema upgrade',
      createdAt: new Date().toLocaleDateString(),
      participants: {
        'operator-human': {
          id: 'operator-human',
          name: 'Lead Engineer (Alpha)',
          role: 'OPERATOR',
          avatar: '👤',
          color: '#007acc',
          badge: 'Human Operator',
          state: 'ONLINE',
          currentFocus: 'users',
          isAgent: false
        },
        'agent-dba': {
          id: 'agent-dba',
          name: 'DBA Optimizer',
          role: 'DBA_OPTIMIZER',
          avatar: '⚡',
          color: '#4ec9b0',
          badge: 'Index & Perf',
          state: 'ONLINE',
          currentFocus: 'users',
          isAgent: true
        },
        'agent-architect': {
          id: 'agent-architect',
          name: 'Schema Architect',
          role: 'SCHEMA_ARCHITECT',
          avatar: '🏗️',
          color: '#dcdcaa',
          badge: 'DDL & 3NF',
          state: 'ONLINE',
          currentFocus: 'roles',
          isAgent: true
        },
        'agent-analyst': {
          id: 'agent-analyst',
          name: 'Data Analyst',
          role: 'DATA_ANALYST',
          avatar: '📊',
          color: '#9cdcfe',
          badge: 'Aggregation',
          state: 'ONLINE',
          currentFocus: 'audit_logs',
          isAgent: true
        },
        'agent-security': {
          id: 'agent-security',
          name: 'Security Auditor',
          role: 'SECURITY_AUDITOR',
          avatar: '🛡️',
          color: '#f14c4c',
          badge: 'PII & Risk',
          state: 'ONLINE',
          currentFocus: 'audit_logs',
          isAgent: true
        }
      },
      messages: [
        {
          id: 'msg-seed-1',
          senderId: 'operator-human',
          senderRole: 'OPERATOR',
          senderName: 'Lead Engineer (Alpha)',
          content: 'Team, we are seeing sequential scan latency on auth verification. @dba can you recommend indexes and @security please verify PII implications?',
          mentions: ['agent-dba', 'agent-security'],
          timestamp: '16:00:10'
        },
        {
          id: 'msg-seed-2',
          senderId: 'agent-dba',
          senderRole: 'DBA_OPTIMIZER',
          senderName: 'DBA Optimizer',
          content: 'I analyzed query patterns for `users`. Adding a composite B-Tree on (role_id, id) drops buffer reads by 86%. I have submitted a proposal.',
          mentions: [],
          proposalId: 'prop-users-index',
          timestamp: '16:00:25'
        }
      ],
      delegations: [],
      proposals: [
        {
          id: 'prop-users-index',
          creatorId: 'agent-dba',
          title: 'Composite B-Tree Index on users(role_id, id)',
          description: 'Eliminates full table sequential scan during role validation.',
          proposedSql: 'CREATE INDEX idx_users_role_composite ON users(role_id, id);',
          targetTable: 'users',
          status: 'PENDING_REVIEW',
          votes: {
            'agent-dba': {
              participantId: 'agent-dba',
              vote: 'APPROVE',
              comment: 'Verified 86% cost reduction and zero write penalty on reads.',
              timestamp: '16:00:25'
            }
          },
          consensusThreshold: 2,
          createdAt: '16:00:25'
        }
      ],
      locks: [
        {
          id: 'lock-seed-1',
          resourceType: 'TABLE',
          targetName: 'users',
          heldByParticipantId: 'agent-dba',
          mode: 'SHARED_READ',
          acquiredAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1800000).toISOString(),
          purpose: 'Profiling sequential scan cost and buffer pool utilization'
        }
      ],
      scratchpad: {
        content: `### Collaborative Migration Blackboard

- [x] Baseline sequential scan latency captured (48ms)
- [x] Index candidate proposed: \`idx_users_role_composite\`
- [ ] Security peer review on foreign key references
- [ ] Consensus sign-off from Schema Architect
- [ ] 1-Click execution with Virtual Tx Rollback enabled
`,
        lastEditedBy: 'agent-dba',
        lastEditedAt: '16:00:30'
      },
      events: [
        {
          id: 'evt-1',
          sequenceNumber: 1,
          timestamp: '16:00:00',
          type: 'LOCK_ACQUIRED',
          actorId: 'agent-dba',
          summary: 'DBA Optimizer acquired SHARED_READ lock on table users',
          payload: { table: 'users', mode: 'SHARED_READ' }
        },
        {
          id: 'evt-2',
          sequenceNumber: 2,
          timestamp: '16:00:10',
          type: 'CHAT_MESSAGE',
          actorId: 'operator-human',
          summary: 'Lead Engineer posted guidance with mentions',
          payload: { mentions: ['agent-dba', 'agent-security'] }
        },
        {
          id: 'evt-3',
          sequenceNumber: 3,
          timestamp: '16:00:25',
          type: 'PROPOSAL_CREATED',
          actorId: 'agent-dba',
          summary: 'DBA Optimizer proposed Composite B-Tree Index',
          payload: { proposalId: 'prop-users-index', targetTable: 'users' }
        }
      ]
    };

    this.sessions.set(defaultSession.id, defaultSession);
  }

  // ---------------------------------------------------------------------------
  // Session Lifecycle
  // ---------------------------------------------------------------------------

  public createSession(name: string, topic: string): CollaborativeSession {
    const id = `session-${Date.now()}`;
    const defaultParticipants: Record<string, SessionParticipant> = {
      'operator-human': {
        id: 'operator-human',
        name: 'Lead Engineer (Alpha)',
        role: 'OPERATOR',
        avatar: '👤',
        color: '#007acc',
        badge: 'Human Operator',
        state: 'ONLINE',
        isAgent: false
      },
      'agent-dba': {
        id: 'agent-dba',
        name: 'DBA Optimizer',
        role: 'DBA_OPTIMIZER',
        avatar: '⚡',
        color: '#4ec9b0',
        badge: 'Index & Perf',
        state: 'ONLINE',
        isAgent: true
      },
      'agent-architect': {
        id: 'agent-architect',
        name: 'Schema Architect',
        role: 'SCHEMA_ARCHITECT',
        avatar: '🏗️',
        color: '#dcdcaa',
        badge: 'DDL & 3NF',
        state: 'ONLINE',
        isAgent: true
      },
      'agent-analyst': {
        id: 'agent-analyst',
        name: 'Data Analyst',
        role: 'DATA_ANALYST',
        avatar: '📊',
        color: '#9cdcfe',
        badge: 'Aggregation',
        state: 'ONLINE',
        isAgent: true
      },
      'agent-security': {
        id: 'agent-security',
        name: 'Security Auditor',
        role: 'SECURITY_AUDITOR',
        avatar: '🛡️',
        color: '#f14c4c',
        badge: 'PII & Risk',
        state: 'ONLINE',
        isAgent: true
      }
    };

    const newSession: CollaborativeSession = {
      id,
      name,
      topic,
      createdAt: new Date().toLocaleDateString(),
      participants: defaultParticipants,
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'operator-human',
          senderRole: 'OPERATOR',
          senderName: 'Lead Engineer (Alpha)',
          content: `Session initiated for topic: ${topic}. All specialized agents online and ready.`,
          mentions: [],
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      delegations: [],
      proposals: [],
      locks: [],
      scratchpad: {
        content: `### Session Blackboard: ${name}\n\n- [ ] Define objectives\n- [ ] Analyze schema & query workload\n- [ ] Consensus verification\n`,
        lastEditedBy: 'operator-human',
        lastEditedAt: new Date().toLocaleTimeString()
      },
      events: [
        {
          id: `evt-${Date.now()}`,
          sequenceNumber: 1,
          timestamp: new Date().toLocaleTimeString(),
          type: 'PARTICIPANT_JOINED',
          actorId: 'operator-human',
          summary: `Session created: ${name}`,
          payload: { topic }
        }
      ]
    };

    this.sessions.set(id, newSession);
    this.activeSessionId = id;
    this.notify();
    return newSession;
  }

  public getActiveSession(): CollaborativeSession {
    return this.sessions.get(this.activeSessionId) || this.sessions.get('session-default')!;
  }

  public getSession(sessionId: string): CollaborativeSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): CollaborativeSession[] {
    return Array.from(this.sessions.values());
  }

  public switchSession(sessionId: string): CollaborativeSession {
    if (this.sessions.has(sessionId)) {
      this.activeSessionId = sessionId;
      this.notify();
      return this.sessions.get(sessionId)!;
    }
    throw new Error(`Session '${sessionId}' not found.`);
  }

  // ---------------------------------------------------------------------------
  // Messaging & Turn-Taking Timeline
  // ---------------------------------------------------------------------------

  public postMessage(
    sessionId: string,
    senderId: string,
    content: string,
    options?: {
      proposalId?: string;
      delegationTaskId?: string;
      explicitMentions?: string[];
    }
  ): ChatMessage {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session '${sessionId}' not found.`);

    const sender = session.participants[senderId];
    const senderRole = sender ? sender.role : 'OPERATOR';
    const senderName = sender ? sender.name : 'Unknown';

    // Parse mentions (e.g. @dba, @security, @architect, @analyst)
    const detectedMentions: string[] = [...(options?.explicitMentions || [])];
    if (/@dba\b/i.test(content)) detectedMentions.push('agent-dba');
    if (/@architect\b/i.test(content)) detectedMentions.push('agent-architect');
    if (/@analyst\b/i.test(content)) detectedMentions.push('agent-analyst');
    if (/@security\b/i.test(content)) detectedMentions.push('agent-security');
    if (/@human\b/i.test(content) || /@lead\b/i.test(content)) detectedMentions.push('operator-human');

    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId,
      senderRole,
      senderName,
      content,
      mentions: Array.from(new Set(detectedMentions)),
      proposalId: options?.proposalId,
      delegationTaskId: options?.delegationTaskId,
      timestamp: new Date().toLocaleTimeString()
    };

    session.messages.push(msg);
    this.recordEvent(session, 'CHAT_MESSAGE', senderId, `${senderName} posted a message`, {
      messageId: msg.id,
      mentions: msg.mentions
    });

    // Handle automated AI persona reactions if addressed
    this.triggerAgentReactions(session, msg);

    this.notify();
    return msg;
  }

  // ---------------------------------------------------------------------------
  // Agent-to-Agent Delegation Bus
  // ---------------------------------------------------------------------------

  public delegateTask(
    sessionId: string,
    fromParticipantId: string,
    toParticipantId: string,
    objective: string,
    contextPayload: DelegationTask['contextPayload']
  ): DelegationTask {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session '${sessionId}' not found.`);

    const fromUser = session.participants[fromParticipantId];
    const toUser = session.participants[toParticipantId];

    const task: DelegationTask = {
      id: `delegation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromParticipantId,
      toParticipantId,
      objective,
      contextPayload,
      status: 'PENDING',
      createdAt: new Date().toLocaleTimeString()
    };

    session.delegations.push(task);

    this.recordEvent(
      session,
      'DELEGATION_CREATED',
      fromParticipantId,
      `${fromUser?.name || fromParticipantId} delegated '${objective}' to ${toUser?.name || toParticipantId}`,
      { taskId: task.id, target: toParticipantId }
    );

    // If target is an agent, simulate immediate handoff processing
    if (toUser?.isAgent) {
      toUser.state = 'THINKING';
      setTimeout(() => {
        this.processDelegatedAgentTask(session.id, task.id);
      }, 50);
    }

    this.notify();
    return task;
  }

  public resolveDelegation(
    sessionId: string,
    taskId: string,
    verdict: DelegationVerdict,
    status: DelegationStatus = 'RESOLVED'
  ): DelegationTask {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session '${sessionId}' not found.`);

    const task = session.delegations.find(d => d.id === taskId);
    if (!task) throw new Error(`Delegation task '${taskId}' not found.`);

    task.status = status;
    task.verdict = verdict;
    task.resolvedAt = new Date().toLocaleTimeString();

    const targetUser = session.participants[task.toParticipantId];
    if (targetUser) targetUser.state = 'ONLINE';

    this.recordEvent(
      session,
      'DELEGATION_RESOLVED',
      task.toParticipantId,
      `${targetUser?.name || task.toParticipantId} resolved delegation with verdict: ${verdict.approved ? 'APPROVED' : 'REJECTED'}`,
      { taskId, verdict }
    );

    this.notify();
    return task;
  }

  private processDelegatedAgentTask(sessionId: string, taskId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const task = session.delegations.find(d => d.id === taskId);
    if (!task) return;

    // Synthesize autonomous expert assessment based on role
    const agent = session.participants[task.toParticipantId];
    let approved = true;
    const findings: string[] = [];

    if (agent?.role === 'SECURITY_AUDITOR') {
      const isSensitive = /email|ip|password|token/i.test(task.contextPayload.sqlStatement || '') ||
                          task.contextPayload.targetTable === 'audit_logs';
      if (isSensitive) {
        findings.push('PII attributes detected; enforce column masking policies in production views.');
      }
      findings.push('Query Firewall verified 0 injection vectors and bounded blast radius.');
    } else if (agent?.role === 'DBA_OPTIMIZER') {
      findings.push('Buffer cache hit ratio expected > 94% with proposed indexing structure.');
      findings.push('Zero Cartesian product regressions detected in join predicates.');
    } else if (agent?.role === 'SCHEMA_ARCHITECT') {
      findings.push('3NF schema normalization preserved; foreign key constraint integrity maintained.');
      findings.push('Downstream migration UP/DOWN scripts are fully reversible.');
    } else {
      findings.push('Analytical query vectorization confirmed; no unindexed full table scans.');
    }

    this.resolveDelegation(sessionId, taskId, {
      approved,
      confidence: 0.95,
      findings,
      evaluatedAt: new Date().toLocaleTimeString()
    });

    // Also post automated reply to chat
    this.postMessage(
      sessionId,
      agent?.id || 'agent-dba',
      `[Automated Hand-off Complete] I have resolved delegation: "${task.objective}". Verdict: ${approved ? '✅ APPROVED' : '❌ MODIFICATIONS NEEDED'}. Findings: ${findings.join(' ')}`
    );
  }

  // ---------------------------------------------------------------------------
  // Cooperative Distributed Lock Manager
  // ---------------------------------------------------------------------------

  public acquireLock(
    sessionId: string,
    participantId: string,
    resourceType: LockResourceType,
    targetName: string,
    mode: LockMode = 'EXCLUSIVE_WRITE',
    ttlMs: number = 300000,
    purpose: string = 'Autonomous query mutation or profiling'
  ): { success: boolean; lock?: ResourceLock; reason?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session '${sessionId}' not found.`);

    const cleanTarget = targetName.toLowerCase();

    // Clean expired locks
    const now = Date.now();
    session.locks = session.locks.filter(l => {
      const exp = new Date(l.expiresAt).getTime();
      return !isNaN(exp) ? exp > now : true;
    });

    // Check conflicts:
    // EXCLUSIVE_WRITE conflicts with any existing lock on target
    // SHARED_READ conflicts only with existing EXCLUSIVE_WRITE
    const existingConflicts = session.locks.filter(l => {
      if (l.targetName.toLowerCase() !== cleanTarget) return false;
      if (mode === 'EXCLUSIVE_WRITE') return true;
      return l.mode === 'EXCLUSIVE_WRITE';
    });

    if (existingConflicts.length > 0) {
      const conflict = existingConflicts[0];
      const holder = session.participants[conflict.heldByParticipantId]?.name || conflict.heldByParticipantId;
      return {
        success: false,
        reason: `Resource '${targetName}' is already locked in ${conflict.mode} mode by ${holder} (Expires at ${conflict.expiresAt}).`
      };
    }

    const lock: ResourceLock = {
      id: `lock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      resourceType,
      targetName: cleanTarget,
      heldByParticipantId: participantId,
      mode,
      acquiredAt: new Date().toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString(),
      purpose
    };

    session.locks.push(lock);

    const actor = session.participants[participantId]?.name || participantId;
    this.recordEvent(
      session,
      'LOCK_ACQUIRED',
      participantId,
      `${actor} acquired ${mode} lock on ${resourceType} '${targetName}'`,
      { lock }
    );

    this.notify();
    return { success: true, lock };
  }

  public releaseLock(sessionId: string, participantId: string, targetName: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const cleanTarget = targetName.toLowerCase();
    const initialLen = session.locks.length;
    session.locks = session.locks.filter(l => !(l.targetName.toLowerCase() === cleanTarget && l.heldByParticipantId === participantId));

    if (session.locks.length < initialLen) {
      const actor = session.participants[participantId]?.name || participantId;
      this.recordEvent(
        session,
        'LOCK_RELEASED',
        participantId,
        `${actor} released lock on '${targetName}'`,
        { targetName }
      );
      this.notify();
      return true;
    }
    return false;
  }

  public getActiveLocks(sessionId: string): ResourceLock[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    const now = Date.now();
    return session.locks.filter(l => {
      const exp = new Date(l.expiresAt).getTime();
      return !isNaN(exp) ? exp > now : true;
    });
  }

  // ---------------------------------------------------------------------------
  // Peer Review Proposals & Consensus Engine
  // ---------------------------------------------------------------------------

  public createProposal(
    sessionId: string,
    creatorId: string,
    title: string,
    description: string,
    proposedSql: string,
    targetTable: string,
    consensusThreshold: number = 2
  ): ProposalCard {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session '${sessionId}' not found.`);

    const proposal: ProposalCard = {
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      creatorId,
      title,
      description,
      proposedSql,
      targetTable,
      status: 'PENDING_REVIEW',
      votes: {
        [creatorId]: {
          participantId: creatorId,
          vote: 'APPROVE',
          comment: 'Creator submitted proposal with automated validation',
          timestamp: new Date().toLocaleTimeString()
        }
      },
      consensusThreshold,
      createdAt: new Date().toLocaleTimeString()
    };

    session.proposals.push(proposal);

    const creator = session.participants[creatorId]?.name || creatorId;
    this.recordEvent(
      session,
      'PROPOSAL_CREATED',
      creatorId,
      `${creator} submitted proposal: ${title}`,
      { proposal }
    );

    // Also share to chat
    this.postMessage(
      sessionId,
      creatorId,
      `I have proposed: **${title}** for table \`${targetTable}\`.\n\`\`\`sql\n${proposedSql}\n\`\`\`\nRequires ${consensusThreshold} peer approvals.`,
      { proposalId: proposal.id }
    );

    this.notify();
    return proposal;
  }

  public voteOnProposal(
    sessionId: string,
    proposalId: string,
    participantId: string,
    vote: 'APPROVE' | 'REJECT' | 'NEUTRAL',
    comment: string
  ): ProposalCard {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session '${sessionId}' not found.`);

    const proposal = session.proposals.find(p => p.id === proposalId);
    if (!proposal) throw new Error(`Proposal '${proposalId}' not found.`);

    proposal.votes[participantId] = {
      participantId,
      vote,
      comment,
      timestamp: new Date().toLocaleTimeString()
    };

    // Calculate approvals
    const approvalCount = Object.values(proposal.votes).filter(v => v.vote === 'APPROVE').length;
    const rejectCount = Object.values(proposal.votes).filter(v => v.vote === 'REJECT').length;

    if (rejectCount > 0 && rejectCount >= proposal.consensusThreshold) {
      proposal.status = 'REJECTED';
    } else if (approvalCount >= proposal.consensusThreshold) {
      proposal.status = 'APPROVED';
    }

    const voter = session.participants[participantId]?.name || participantId;
    this.recordEvent(
      session,
      'PROPOSAL_VOTED',
      participantId,
      `${voter} voted ${vote} on proposal '${proposal.title}'`,
      { proposalId, vote, approvalCount, status: proposal.status }
    );

    this.notify();
    return proposal;
  }

  public executeProposal(sessionId: string, proposalId: string, executorId: string): { success: boolean; message: string } {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, message: 'Session not found' };

    const proposal = session.proposals.find(p => p.id === proposalId);
    if (!proposal) return { success: false, message: 'Proposal not found' };

    if (proposal.status !== 'APPROVED') {
      return {
        success: false,
        message: `Proposal cannot be executed. Current consensus status is '${proposal.status}'. Threshold of ${proposal.consensusThreshold} approvals required.`
      };
    }

    proposal.status = 'EXECUTED';
    proposal.executedAt = new Date().toLocaleTimeString();

    const executor = session.participants[executorId]?.name || executorId;
    this.recordEvent(
      session,
      'PROPOSAL_EXECUTED',
      executorId,
      `${executor} executed approved proposal: ${proposal.title}`,
      { proposalId }
    );

    this.postMessage(
      sessionId,
      executorId,
      `🚀 **Proposal Executed**: "${proposal.title}" has been successfully applied to target table \`${proposal.targetTable}\`.`
    );

    this.notify();
    return { success: true, message: `Successfully executed proposal '${proposal.title}'.` };
  }

  // ---------------------------------------------------------------------------
  // Shared Blackboard / Scratchpad
  // ---------------------------------------------------------------------------

  public updateScratchpad(sessionId: string, authorId: string, content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.scratchpad = {
      content,
      lastEditedBy: authorId,
      lastEditedAt: new Date().toLocaleTimeString()
    };

    const author = session.participants[authorId]?.name || authorId;
    this.recordEvent(
      session,
      'SCRATCHPAD_UPDATED',
      authorId,
      `${author} updated collaborative scratchpad blackboard`,
      { length: content.length }
    );

    this.notify();
  }

  // ---------------------------------------------------------------------------
  // Event Sourcing & Session Replay Scrubber
  // ---------------------------------------------------------------------------

  private recordEvent(
    session: CollaborativeSession,
    type: SessionEventType,
    actorId: string,
    summary: string,
    payload: Record<string, any> = {}
  ): void {
    const event: SessionEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sequenceNumber: session.events.length + 1,
      timestamp: new Date().toLocaleTimeString(),
      type,
      actorId,
      summary,
      payload
    };

    session.events.push(event);
  }

  public getEvents(sessionId: string): SessionEvent[] {
    return this.sessions.get(sessionId)?.events || [];
  }

  public exportSessionReplay(sessionId: string): string {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session '${sessionId}' not found.`);
    return JSON.stringify(session, null, 2);
  }

  public importSessionReplay(jsonStr: string): CollaborativeSession {
    const session: CollaborativeSession = JSON.parse(jsonStr);
    if (!session.id || !session.participants) {
      throw new Error('Invalid collaborative session JSON structure.');
    }
    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    this.notify();
    return session;
  }

  // ---------------------------------------------------------------------------
  // Helper: Automated Agent Reactions
  // ---------------------------------------------------------------------------

  private triggerAgentReactions(session: CollaborativeSession, msg: ChatMessage): void {
    if (msg.mentions.length === 0) return;

    for (const mentionId of msg.mentions) {
      const participant = session.participants[mentionId];
      if (!participant || !participant.isAgent) continue;

      participant.state = 'THINKING';

      // Agent generates contextual response
      setTimeout(() => {
        participant.state = 'ONLINE';
        let reply = '';
        if (participant.role === 'DBA_OPTIMIZER') {
          reply = `I have completed the query plan breakdown for your request. Sequential scan elimination provides a projected 75%+ latency drop. Ready to execute index candidate upon consensus.`;
        } else if (participant.role === 'SECURITY_AUDITOR') {
          reply = `Security inspection complete. Blast radius is contained to public schema. Enforcing zero-leakage PII masking on audit trail attributes.`;
        } else if (participant.role === 'SCHEMA_ARCHITECT') {
          reply = `Schema validation verified 3NF compliance. Up/Down reversible migration script drafted for safe rollout.`;
        } else {
          reply = `Aggregated distribution samples collected. 99th percentile query latency is bounded within SLA thresholds.`;
        }

        const agentMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          senderId: participant.id,
          senderRole: participant.role,
          senderName: participant.name,
          content: reply,
          mentions: [msg.senderId],
          timestamp: new Date().toLocaleTimeString()
        };

        session.messages.push(agentMsg);
        this.recordEvent(
          session,
          'CHAT_MESSAGE',
          participant.id,
          `${participant.name} responded to mention`,
          { inReplyTo: msg.id }
        );
        this.notify();
      }, 100);
    }
  }
}

export const collaborativeSessionManager = new CollaborativeSessionManager();
