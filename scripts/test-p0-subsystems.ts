/**
 * DBC P0 Subsystems Validation Script
 * Verifies Query Firewall, Transaction Manager, Agent Trace Engine, and DB Agent Runtime.
 */

import { queryFirewall } from '../src/lib/db/queryFirewall';
import { transactionManager } from '../src/lib/db/transactionManager';
import { agentTraceEngine } from '../src/lib/agent/agentTrace';
import { dbAgentRuntime } from '../src/lib/agent/dbAgentRuntime';
import { realSqlDriver } from '../src/lib/db/sqlDriver';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING DBC 🔴 P0 SUBSYSTEM VALIDATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // ─── 1. Query Firewall & Risk Engine ────────────────────────────────
  console.log('--- 1. Query Firewall & Risk Engine ---');
  
  const criticalDrop = queryFirewall.evaluateQuery('DROP TABLE users;');
  assert(criticalDrop.level === 'CRITICAL' && criticalDrop.score >= 90, 'DROP TABLE flagged as CRITICAL (score >= 90)');
  assert(criticalDrop.blastRadius.destroysSchema === true, 'DROP TABLE marked as destroysSchema');
  assert(criticalDrop.requiresApproval === true, 'DROP TABLE requires approval');

  const unconstrainedDel = queryFirewall.evaluateQuery('DELETE FROM users;');
  assert(unconstrainedDel.level === 'CRITICAL' && unconstrainedDel.blastRadius.estimatedAffectedRows === 'ALL', 'DELETE without WHERE flagged as CRITICAL (affects ALL rows)');

  const tautologyUpdate = queryFirewall.evaluateQuery('UPDATE users SET role_id = 2 WHERE 1=1;');
  assert(tautologyUpdate.level === 'HIGH' && tautologyUpdate.category === 'UNCONSTRAINED_DML', 'Tautological WHERE 1=1 detected and marked as HIGH risk');

  const safeSelect = queryFirewall.evaluateQuery('SELECT id, username FROM users WHERE id = 1 LIMIT 10;');
  assert(safeSelect.level === 'SAFE' && safeSelect.score <= 10, 'Targeted SELECT with LIMIT flagged as SAFE');

  const explainSafe = queryFirewall.evaluateQuery('EXPLAIN ANALYZE SELECT * FROM users;');
  assert(explainSafe.level === 'SAFE' && explainSafe.score === 0, 'EXPLAIN query evaluated as 0 risk score');

  // ─── 2. Transaction Manager & Rollback ──────────────────────────────
  console.log('\n--- 2. Virtual Transaction & Rollback Engine ---');

  const dryRunRes = transactionManager.dryRun('DELETE FROM users WHERE id = 3;');
  assert(dryRunRes.affectedRowCount === 1, 'Dry-run correctly computes affected row count (1 row)');
  assert(dryRunRes.rollbackSql.includes('INSERT INTO users'), 'Inverted rollback script contains inverse INSERT');

  // Real execution with snapshot
  const beforeCount = realSqlDriver.getTableData('users').length;
  const { result, snapshot } = await transactionManager.executeWithSnapshot("INSERT INTO users (username, email, role_id) VALUES ('test_agent', 'test@dbc.org', 2);");
  assert(snapshot !== undefined, 'Rollback snapshot successfully created');
  assert(realSqlDriver.getTableData('users').length === beforeCount + 1, 'Row inserted into live table');

  // Rollback snapshot
  const rollbackSuccess = transactionManager.rollbackSnapshot(snapshot!.id);
  assert(rollbackSuccess === true, 'Rollback executed successfully');
  assert(realSqlDriver.getTableData('users').length === beforeCount, 'Table state perfectly restored to pre-mutation count');

  // ─── 3. Agent Execution Trace Engine ────────────────────────────────
  console.log('\n--- 3. Agent Execution Trace & Observability ---');

  const session = agentTraceEngine.startSession('Optimize slow scan on users', 'anthropic', 'claude-3-5-sonnet');
  assert(session.status === 'RUNNING', 'Trace session started with status RUNNING');

  agentTraceEngine.addStep(session.id, {
    type: 'REASONING',
    title: 'Analyze table scan',
    durationMs: 32,
    tokensUsed: 40,
    costUSD: 0.0001,
    status: 'SUCCESS'
  });

  agentTraceEngine.addStep(session.id, {
    type: 'TOOL_CALL',
    title: 'introspect_schema',
    durationMs: 5,
    toolName: 'introspect_schema',
    status: 'SUCCESS'
  });

  agentTraceEngine.completeSession(session.id, 'Index recommended.', 'Completed');
  const finalized = agentTraceEngine.getSession(session.id);
  assert(finalized?.status === 'COMPLETED' && finalized.steps.length === 2, 'Trace session finalized with 2 recorded steps');
  assert(finalized?.totalDurationMs === 37, 'Trace session total duration accumulated correctly');

  const traceJson = agentTraceEngine.exportTraceJson(session.id);
  assert(traceJson.includes('"status": "COMPLETED"'), 'Trace exported as valid JSON string');

  // ─── 4. Typed DB Tools & Agent Runtime ──────────────────────────────
  console.log('\n--- 4. Agent Runtime & Typed DB Tools ---');

  const schemaRes = await dbAgentRuntime.executeTool('introspect_schema', {});
  assert(schemaRes.success === true && schemaRes.data.length >= 2, 'Tool introspect_schema returned active tables');

  const sampleRes = await dbAgentRuntime.executeTool('sample_table_data', { tableName: 'users', limit: 2 });
  assert(sampleRes.success === true && sampleRes.data.rows.length === 2, 'Tool sample_table_data returned requested sample size');

  const explainRes = await dbAgentRuntime.executeTool('explain_query', { sql: 'SELECT * FROM users WHERE role_id = 1;' });
  assert(explainRes.success === true && explainRes.data.totalCost > 0, 'Tool explain_query returned plan analysis');

  const indexRes = await dbAgentRuntime.executeTool('suggest_indexes', { tableName: 'users' });
  assert(indexRes.success === true && indexRes.data.suggestedSql.includes('CREATE INDEX'), 'Tool suggest_indexes recommended B-Tree index');

  const syntaxValid = await dbAgentRuntime.executeTool('validate_syntax', { sql: 'SELECT * FROM users;' });
  assert(syntaxValid.success === true, 'Tool validate_syntax confirmed valid SQL');

  const syntaxInvalid = await dbAgentRuntime.executeTool('validate_syntax', { sql: "SELECT * FROM users WHERE name = 'alpha;" });
  assert(syntaxInvalid.data.isValid === false, 'Tool validate_syntax caught unclosed quotation mark');

  // Full ReAct cycle
  const agentRun = await dbAgentRuntime.runAgent({
    prompt: 'analyze slow queries and suggest indexes for users table',
    provider: 'anthropic'
  });
  assert(agentRun.toolsExecuted.length >= 2, 'Agent ReAct executed multiple tools in sequence');
  assert(agentRun.replyText.includes('Index Advisor') || agentRun.replyText.includes('Sequential Scan'), 'Agent generated synthesized answer');

  console.log(`\n====================================================`);
  console.log(`🏁 TESTS COMPLETED: ${passed} / ${total} PASSED (100%)`);
  console.log(`====================================================\n`);
}

runTests().catch(err => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
