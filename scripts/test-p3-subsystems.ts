/**
 * DBC Phase 3 Subsystems Automated Verification Test Suite
 * Validates:
 * 1. Collaborative Session Workspaces & Multi-Agent Presence
 * 2. Agent-to-Agent Delegation Bus & Autonomous Verdicts
 * 3. Cooperative Distributed Resource Locking & Concurrency Control
 * 4. Multi-Agent Proposal Consensus & Peer Review Voting Engine
 * 5. Shared Blackboard Scratchpad & Event Sourcing Replay Engine
 */

import { collaborativeSessionManager } from '../src/lib/collaboration/collaborativeSession';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runP3Tests() {
  console.log('================================================================');
  console.log('  DBC PHASE 3 SUB-SYSTEMS VERIFICATION TEST SUITE');
  console.log('  (Collaborative Multi-Agent Sessions & Council Protocol)');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. SESSION INITIALIZATION & PARTICIPANT PRESENCE
  // -------------------------------------------------------------------------
  console.log('🤝 [1/5] Testing Session Initialization & Participant Presence...');

  const activeSession = collaborativeSessionManager.getActiveSession();
  assert(!!activeSession, 'Default active collaborative session initialized');
  assert(
    activeSession.participants['operator-human']?.role === 'OPERATOR',
    'Human operator participant registered in session room'
  );

  const agentIds = ['agent-dba', 'agent-architect', 'agent-analyst', 'agent-security'];
  const allAgentsPresent = agentIds.every(id => !!activeSession.participants[id] && activeSession.participants[id].isAgent);
  assert(allAgentsPresent, 'All 4 specialized AI agents (DBA, Architect, Analyst, Security) connected as participants');

  // Create new session
  const newSession = collaborativeSessionManager.createSession(
    'Audit Trail Partitioning Council',
    'Evaluate schema migration from monolithic audit_logs to monthly partitioned tables'
  );
  assert(newSession.id.startsWith('session-'), 'New collaborative session room created successfully');
  assert(newSession.topic.includes('partitioned tables'), 'Session topic and objectives persisted');
  assert(Object.keys(newSession.participants).length === 5, 'New session automatically provisioned with 5 participants');

  // -------------------------------------------------------------------------
  // 2. MESSAGING & MENTION PROTOCOL
  // -------------------------------------------------------------------------
  console.log('\n💬 [2/5] Testing Messaging & Turn-Taking Mention Protocol...');

  const msg1 = collaborativeSessionManager.postMessage(
    newSession.id,
    'operator-human',
    'Council, please evaluate partitioning. @dba how will this impact query cost? @security any risk of data exposure?'
  );
  assert(msg1.mentions.includes('agent-dba'), 'Mention @dba successfully detected and parsed');
  assert(msg1.mentions.includes('agent-security'), 'Mention @security successfully detected and parsed');

  const sessAfterMsg = collaborativeSessionManager.getSession(newSession.id)!;
  assert(
    sessAfterMsg.messages.some(m => m.id === msg1.id),
    'Operator message appended to chronological session feed'
  );

  // Allow agent reaction timers to process
  await new Promise(r => setTimeout(r, 200));

  const updatedSession = collaborativeSessionManager.getSession(newSession.id)!;
  const agentReplies = updatedSession.messages.filter(m => m.senderId === 'agent-dba' || m.senderId === 'agent-security');
  assert(agentReplies.length >= 1, 'Autonomous AI agents reacted to mentions with expert domain replies');

  // -------------------------------------------------------------------------
  // 3. AGENT-TO-AGENT DELEGATION BUS
  // -------------------------------------------------------------------------
  console.log('\n📨 [3/5] Testing Agent-to-Agent Delegation Bus...');

  const delegationTask = collaborativeSessionManager.delegateTask(
    newSession.id,
    'agent-architect',
    'agent-security',
    'Audit log partitioning PII safety check',
    {
      targetTable: 'audit_logs',
      sqlStatement: 'CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs FOR VALUES FROM ...'
    }
  );
  assert(delegationTask.status === 'PENDING', 'Delegation task created in PENDING status');
  assert(delegationTask.fromParticipantId === 'agent-architect', 'Delegation sender correctly attributed to Schema Architect');
  assert(delegationTask.toParticipantId === 'agent-security', 'Delegation receiver correctly attributed to Security Auditor');

  // Allow autonomous agent evaluation to resolve
  await new Promise(r => setTimeout(r, 150));

  const resolvedSession = collaborativeSessionManager.getSession(newSession.id)!;
  const resolvedTask = resolvedSession.delegations.find(d => d.id === delegationTask.id)!;
  assert(resolvedTask.status === 'RESOLVED', 'Security Auditor autonomously completed and resolved delegation task');
  assert(!!resolvedTask.verdict && resolvedTask.verdict.approved, 'Autonomous delegation verdict approved with safety findings');
  assert(resolvedTask.verdict!.findings.length > 0, 'Delegation verdict includes concrete findings');

  // -------------------------------------------------------------------------
  // 4. COOPERATIVE DISTRIBUTED RESOURCE LOCKING
  // -------------------------------------------------------------------------
  console.log('\n🔒 [4/5] Testing Cooperative Distributed Lock Manager...');

  // 1. Acquire EXCLUSIVE_WRITE
  const lockResult1 = collaborativeSessionManager.acquireLock(
    newSession.id,
    'agent-dba',
    'TABLE',
    'users',
    'EXCLUSIVE_WRITE',
    60000,
    'Running index creation benchmark'
  );
  assert(lockResult1.success && !!lockResult1.lock, 'DBA Optimizer acquired EXCLUSIVE_WRITE lock on table users');

  // 2. Conflicting lock request: another agent requests EXCLUSIVE_WRITE on same table
  const lockResultConflict = collaborativeSessionManager.acquireLock(
    newSession.id,
    'agent-architect',
    'TABLE',
    'users',
    'EXCLUSIVE_WRITE',
    60000,
    'Attempting schema alteration'
  );
  assert(
    !lockResultConflict.success && !!lockResultConflict.reason,
    'Conflicting concurrent EXCLUSIVE_WRITE lock request is rejected'
  );

  // 3. Conflicting lock request: another agent requests SHARED_READ while EXCLUSIVE_WRITE is held
  const lockResultReadConflict = collaborativeSessionManager.acquireLock(
    newSession.id,
    'agent-analyst',
    'TABLE',
    'users',
    'SHARED_READ',
    60000,
    'Attempting query read'
  );
  assert(
    !lockResultReadConflict.success,
    'Concurrent SHARED_READ request is rejected while EXCLUSIVE_WRITE is active'
  );

  // 4. Release EXCLUSIVE_WRITE lock
  const released = collaborativeSessionManager.releaseLock(newSession.id, 'agent-dba', 'users');
  assert(released, 'DBA Optimizer released EXCLUSIVE_WRITE lock on table users');

  // 5. Acquire two concurrent SHARED_READ locks (should succeed!)
  const readLock1 = collaborativeSessionManager.acquireLock(
    newSession.id,
    'agent-analyst',
    'TABLE',
    'users',
    'SHARED_READ',
    60000,
    'Reading user distribution'
  );
  const readLock2 = collaborativeSessionManager.acquireLock(
    newSession.id,
    'agent-security',
    'TABLE',
    'users',
    'SHARED_READ',
    60000,
    'Scanning PII tags'
  );
  assert(
    readLock1.success && readLock2.success,
    'Multiple participants can concurrently hold SHARED_READ locks on the same table'
  );

  // Clean up read locks
  collaborativeSessionManager.releaseLock(newSession.id, 'agent-analyst', 'users');
  collaborativeSessionManager.releaseLock(newSession.id, 'agent-security', 'users');
  assert(
    collaborativeSessionManager.getActiveLocks(newSession.id).length === 0,
    'All resource locks successfully released'
  );

  // -------------------------------------------------------------------------
  // 5. PROPOSAL CONSENSUS, BLACKBOARD & EVENT REPLAY
  // -------------------------------------------------------------------------
  console.log('\n📜 [5/5] Testing Proposal Consensus, Blackboard & Event Replay...');

  // Create Proposal
  const proposal = collaborativeSessionManager.createProposal(
    newSession.id,
    'agent-dba',
    'Composite Index on users(role_id, id)',
    'Accelerates auth check queries by 86%',
    'CREATE INDEX idx_users_role_composite ON users(role_id, id);',
    'users',
    2 // Requires 2 sign-offs
  );
  assert(proposal.status === 'PENDING_REVIEW', 'New proposal enters PENDING_REVIEW consensus state');

  // Cast first vote: Security Auditor signs off
  collaborativeSessionManager.voteOnProposal(
    newSession.id,
    proposal.id,
    'agent-security',
    'APPROVE',
    'Query firewall confirms zero leakage'
  );

  const afterVote1 = collaborativeSessionManager.getSession(newSession.id)!.proposals.find(p => p.id === proposal.id)!;
  assert(afterVote1.status === 'APPROVED', 'Proposal reaches consensus and advances to APPROVED with 2 approvals');

  // Execute Proposal
  const execResult = collaborativeSessionManager.executeProposal(newSession.id, proposal.id, 'operator-human');
  assert(execResult.success, 'Operator successfully executed approved proposal');
  const afterExec = collaborativeSessionManager.getSession(newSession.id)!.proposals.find(p => p.id === proposal.id)!;
  assert(afterExec.status === 'EXECUTED' && !!afterExec.executedAt, 'Proposal marked as EXECUTED with execution timestamp');

  // Blackboard Scratchpad
  const scratchpadContent = '# Migration Checklist\n- [x] Review composite index\n- [x] Execute index DDL\n';
  collaborativeSessionManager.updateScratchpad(newSession.id, 'operator-human', scratchpadContent);
  const sessScratchpad = collaborativeSessionManager.getSession(newSession.id)!.scratchpad;
  assert(sessScratchpad.content === scratchpadContent, 'Shared collaborative scratchpad content updated and synchronized');
  assert(sessScratchpad.lastEditedBy === 'operator-human', 'Scratchpad author correctly attributed');

  // Event Sourcing Log & Replay Export
  const events = collaborativeSessionManager.getEvents(newSession.id);
  assert(events.length >= 5, `Event sourcing engine recorded ${events.length} chronological immutable events`);
  assert(
    events.some(e => e.type === 'PROPOSAL_EXECUTED'),
    'Event store contains PROPOSAL_EXECUTED immutable event record'
  );

  const replayJson = collaborativeSessionManager.exportSessionReplay(newSession.id);
  assert(replayJson.includes('Audit Trail Partitioning Council'), 'Session replay exported to valid JSON archive');

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runP3Tests().catch(err => {
  console.error('P3 test suite encountered unhandled error:', err);
  process.exit(1);
});
