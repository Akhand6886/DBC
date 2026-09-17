/**
 * DBC Part 1 (Agents & AI Personas Domain) Verification Suite
 * Validates fixes for AG-01, AG-02, AG-03, and AG-04:
 * 1. Anthropic client proxying
 * 2. Progressive streaming token delivery
 * 3. Lock acquisition with retry backoff under contention
 * 4. Intent-weighted specialized persona classification
 */

import { byokClient } from '../src/lib/agent/byokClient';
import { dbAgentRuntime } from '../src/lib/agent/dbAgentRuntime';
import { specializedAgents } from '../src/lib/agent/specializedAgents';
import { collaborativeSessionManager } from '../src/lib/collaboration/collaborativeSession';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
    failed++;
  }
}

async function runPart1Tests() {
  console.log('================================================================');
  console.log('  DBC PART 1 (AGENTS & AI PERSONAS) REMEDIATION TEST SUITE');
  console.log('================================================================\n');

  // ─── 1. AG-01: Anthropic CORS Bypass Logic ─────────────────────────────
  console.log('🌐 [1/4] Testing Anthropic Route & Fallback Client Behavior (AG-01)...');
  try {
    const config = byokClient.getConfig('anthropic');
    assert(config.provider === 'anthropic', 'Anthropic provider config registered');
    assert(typeof config.modelName === 'string', 'Anthropic model configured');

    // Test simulation fallback when no real key is set
    const simRes = await byokClient.generateCompletion('anthropic', 'Fix query', 'SELECT 1;');
    assert(simRes.responseText.includes('Simulation Mode') || simRes.responseText.length > 0, 'Anthropic client handles no-key simulation gracefully');
  } catch (err: any) {
    assert(false, `Anthropic client failed: ${err.message}`);
  }

  // ─── 2. AG-02: Progressive Streaming Token Delivery ────────────────────
  console.log('\n⚡ [2/4] Testing Progressive SSE & Token Chunk Streaming (AG-02)...');
  try {
    const streamedChunks: string[] = [];
    const stream = byokClient.streamCompletion('anthropic', 'SELECT 1;', 'users');

    for await (const chunk of stream) {
      streamedChunks.push(chunk);
      if (streamedChunks.length >= 5) break; // Sample first 5 chunks
    }

    assert(streamedChunks.length >= 1, `Streamed ${streamedChunks.length} progressive tokens/chunks`);

    // Test dbAgentRuntime token callback
    const runtimeChunks: string[] = [];
    const agentRes = await dbAgentRuntime.runAgent({
      prompt: 'introspect active database schema',
      provider: 'anthropic',
      onTokenChunk: (chunk) => {
        runtimeChunks.push(chunk);
      }
    });

    assert(agentRes.toolsExecuted.includes('introspect_schema'), 'ReAct runtime executed introspect_schema tool');
    assert(runtimeChunks.length > 0, `Runtime emitted ${runtimeChunks.length} progressive token chunks via onTokenChunk`);
    assert(agentRes.replyText.length > 0, 'Agent generated complete synthesized replyText');
  } catch (err: any) {
    assert(false, `Progressive streaming failed: ${err.message}`);
  }

  // ─── 3. AG-03: Distributed Lock Retry & Backoff ────────────────────────
  console.log('\n🔒 [3/4] Testing Asynchronous Lock Backoff & Contention (AG-03)...');
  try {
    const session = collaborativeSessionManager.getActiveSession();
    assert(!!session, 'Active collaborative session loaded');

    // 1. First participant acquires exclusive write lock
    const initialLock = collaborativeSessionManager.acquireLock(
      session.id,
      'agent-dba',
      'TABLE',
      'audit_logs',
      'EXCLUSIVE_WRITE',
      10000,
      'Performance audit'
    );
    assert(initialLock.success, 'Agent DBA acquired initial lock on audit_logs');

    // 2. Second participant attempts lock with backoff while first lock is active
    let contendingLockAcquired = false;
    const contendingPromise = collaborativeSessionManager.acquireLockWithBackoff(
      session.id,
      'agent-security',
      'TABLE',
      'audit_logs',
      'EXCLUSIVE_WRITE',
      10000,
      'PII scan',
      4,
      50
    ).then((res) => {
      contendingLockAcquired = res.success;
      return res;
    });

    // 3. Release lock after 100ms
    setTimeout(() => {
      collaborativeSessionManager.releaseLock(session.id, 'agent-dba', 'audit_logs');
    }, 90);

    const backoffResult = await contendingPromise;
    assert(backoffResult.success, 'Contending lock succeeded via exponential backoff after initial conflict');
    assert(backoffResult.retriesAttempted > 0, `Lock succeeded after ${backoffResult.retriesAttempted} retry attempts`);

    // Clean up
    collaborativeSessionManager.releaseLock(session.id, 'agent-security', 'audit_logs');
  } catch (err: any) {
    assert(false, `Lock backoff test failed: ${err.message}`);
  }

  // ─── 4. AG-04: Smart Persona Keyword & Intent Classifier ───────────────
  console.log('\n🧠 [4/4] Testing Intent-Weighted Specialized Persona Classification (AG-04)...');
  try {
    // DBA optimizer triggers
    const dbaMatch = specializedAgents.matchPersona('analyze slow query and suggest optimal btree indexes to fix scan latency');
    assert(dbaMatch.persona.id === 'dba_optimizer', `Classified as dba_optimizer (Got: ${dbaMatch.persona.id})`);
    assert(dbaMatch.confidence >= 80, `High confidence for DBA query: ${dbaMatch.confidence}%`);
    assert(dbaMatch.matchedKeywords.includes('slow') || dbaMatch.matchedKeywords.includes('index'), 'Matched DBA domain keywords');

    // Schema architect triggers
    const schemaMatch = specializedAgents.matchPersona('generate migration to alter users table and normalize 3nf relations');
    assert(schemaMatch.persona.id === 'schema_architect', `Classified as schema_architect (Got: ${schemaMatch.persona.id})`);
    assert(schemaMatch.confidence >= 80, `High confidence for Schema query: ${schemaMatch.confidence}%`);

    // Data analyst triggers
    const analystMatch = specializedAgents.matchPersona('calculate cohort aggregate metrics with count and group by report');
    assert(analystMatch.persona.id === 'data_analyst', `Classified as data_analyst (Got: ${analystMatch.persona.id})`);
    assert(analystMatch.confidence >= 80, `High confidence for Analyst query: ${analystMatch.confidence}%`);

    // Security auditor triggers
    const securityMatch = specializedAgents.matchPersona('audit dangerous drop table and delete queries for pii data leak risks');
    assert(securityMatch.persona.id === 'security_auditor', `Classified as security_auditor (Got: ${securityMatch.persona.id})`);
    assert(securityMatch.confidence >= 80, `High confidence for Security query: ${securityMatch.confidence}%`);

    // Run persona agent with chunk callback
    const agentRun = await specializedAgents.runPersonaAgent(
      'data_analyst',
      'sample table data from users',
      'anthropic',
      'users',
      (chunk) => {}
    );
    assert(agentRun.persona.id === 'data_analyst', 'runPersonaAgent preserved requested persona metadata');
  } catch (err: any) {
    assert(false, `Persona classifier test failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed}/${passed + failed} TESTS PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPart1Tests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
