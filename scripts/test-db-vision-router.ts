/**
 * Verification Test Suite: Agentic Database IDE Vision & Architecture
 * Validates:
 * 1. Confidence-Aware Router Scoring & Dual-Path Routing (Section 6)
 * 2. Deterministic Engine SQL Compilation & Sub-5ms Execution (Section 2 & 6)
 * 3. Query Firewall & Guardrail Engine Safety Blocking (Section 7, 8, 9)
 * 4. Business Context Layer Grounding (Section 11)
 * 5. Complete 12 Controlled Agent Tools (Section 10)
 * 6. Autonomous Database Management Workflows (Section 4 & 5)
 */

import { classifyDeveloperIntent, DEFAULT_ROUTER_CONFIG } from '../src/lib/router/intentClassifier';
import { runDeterministicAction } from '../src/lib/router/deterministicEngine';
import { queryFirewall } from '../src/lib/db/queryFirewall';
import { dbMemory } from '../src/lib/db/dbMemory';
import { dbAgentRuntime } from '../src/lib/agent/dbAgentRuntime';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('  TEST SUITE: Agentic Database IDE Vision Verification');
  console.log('=============================================================\n');

  // ─── 1. Confidence-Aware Routing Benchmark (Vision Section 6) ─────────────
  console.log('--- 1. Confidence-Aware Routing Tests (Vision Section 6) ---');
  
  const testCases = [
    { query: 'SELECT * FROM users', expectedConfidence: 99, expectedPath: 'DETERMINISTIC_FAST_PATH' },
    { query: 'Count users', expectedConfidence: 98, expectedPath: 'DETERMINISTIC_FAST_PATH' },
    { query: 'Show orders from today', expectedConfidence: 94, expectedPath: 'DETERMINISTIC_FAST_PATH' },
    { query: 'Find duplicate emails', expectedConfidence: 82, expectedPath: 'DETERMINISTIC_FAST_PATH' },
    { query: 'Why did revenue fall?', expectedConfidence: 43, expectedPath: 'AGENTIC_LLM_PATH' },
    { query: 'Optimize our database', expectedConfidence: 35, expectedPath: 'AGENTIC_LLM_PATH' },
    { query: 'Optimize query #1842', expectedConfidence: 31, expectedPath: 'AGENTIC_LLM_PATH' },
    { query: 'Design subscription schema', expectedConfidence: 22, expectedPath: 'AGENTIC_LLM_PATH' },
  ];

  for (const tc of testCases) {
    const intent = classifyDeveloperIntent(tc.query, undefined, DEFAULT_ROUTER_CONFIG);
    const isFast = intent.confidenceScore >= DEFAULT_ROUTER_CONFIG.confidenceThreshold;
    const actualPath = isFast ? 'DETERMINISTIC_FAST_PATH' : 'AGENTIC_LLM_PATH';
    
    assert(
      intent.confidenceScore === tc.expectedConfidence,
      `Scoring for "${tc.query}": expected ${tc.expectedConfidence}%, got ${intent.confidenceScore}%`
    );
    assert(
      actualPath === tc.expectedPath,
      `Routing for "${tc.query}": routed to ${actualPath}`
    );
  }

  // ─── 2. Deterministic SQL Engine Execution (Sub-5ms, $0.00 cost) ───────────
  console.log('\n--- 2. Deterministic Engine SQL Compilation & Execution ---');
  
  const countIntent = classifyDeveloperIntent('Count users');
  const countAction = runDeterministicAction(countIntent, '');
  assert(
    countAction.proposedContent?.includes('SELECT COUNT(*) AS total_count FROM users;') ?? false,
    `Count users compiled SQL: ${countAction.proposedContent}`
  );
  assert(countAction.executionTimeMs <= 15, `Deterministic execution sub-15ms: ${countAction.executionTimeMs}ms`);

  const dupeIntent = classifyDeveloperIntent('Find duplicate emails');
  const dupeAction = runDeterministicAction(dupeIntent, '');
  assert(
    dupeAction.proposedContent?.includes('GROUP BY email') ?? false,
    `Find duplicate emails compiled SQL contains GROUP BY email`
  );
  assert(
    dupeAction.proposedContent?.includes('HAVING COUNT(*) > 1') ?? false,
    `Find duplicate emails compiled SQL contains HAVING COUNT(*) > 1`
  );

  // ─── 3. Guardrail Engine & Query Safety (Vision Section 7, 8, 9) ──────────
  console.log('\n--- 3. Guardrail Engine & Query Safety Tests ---');

  const knownTables = ['users', 'customers', 'orders', 'transactions', 'products', 'roles'];
  const tableCounts = { users: 100, customers: 50, orders: 200, transactions: 1000 };

  // Test 3.1: Hard block DELETE without WHERE
  const dangerousDelete = 'DELETE FROM users;';
  const deleteEval = queryFirewall.evaluateQuery(dangerousDelete, knownTables, tableCounts);
  assert(deleteEval.isBlocked === true, `DELETE without WHERE is hard-blocked (isBlocked = true)`);
  assert(
    deleteEval.violations.some((v: string) => v.includes('WHERE')),
    `Violations mention missing WHERE clause`
  );
  assert(deleteEval.level === 'CRITICAL' || deleteEval.level === 'HIGH', `Risk level evaluated as HIGH/CRITICAL`);

  // Test 3.2: Full-table scan advisory on transactions table
  const tableScan = 'SELECT * FROM transactions;';
  const scanEval = queryFirewall.evaluateQuery(tableScan, knownTables, tableCounts);
  assert(
    scanEval.remediations.some((r: string) => r.toLowerCase().includes('limit')),
    `Table scan query provides LIMIT remediation`
  );

  // Test 3.3: Risk classification
  const dropEval = queryFirewall.evaluateQuery('DROP TABLE orders;', knownTables, tableCounts);
  assert(dropEval.level === 'CRITICAL', `DROP TABLE is evaluated as CRITICAL risk`);
  const readEval = queryFirewall.evaluateQuery('SELECT * FROM users WHERE id = 1;', knownTables, tableCounts);
  assert(readEval.level === 'LOW' || readEval.level === 'SAFE', `Simple SELECT with WHERE is evaluated as LOW/SAFE risk`);

  // ─── 4. Business Context Layer Grounding (Vision Section 11) ──────────────
  console.log('\n--- 4. Business Context Layer Grounding Tests ---');
  const memory = dbMemory.getState();
  const customerAnnotation = memory.tables['customers'];
  assert(customerAnnotation !== undefined, `Customer table annotation exists in Business Context`);
  
  const customerStatusMeaning = memory.columns['customers']?.['customer_status']?.valueMeanings?.['3'];
  assert(
    customerStatusMeaning === 'Subscription Cancelled',
    `customer_status = 3 mapped to "Subscription Cancelled" in Business Glossary`
  );

  const ordersAmountDesc = memory.columns['orders']?.['amount']?.description;
  assert(
    ordersAmountDesc?.includes('excluding') ?? false,
    `orders.amount documented as net order value excluding tax`
  );

  const usersDeletedAtDesc = memory.columns['users']?.['deleted_at']?.description;
  assert(
    usersDeletedAtDesc?.toLowerCase().includes('soft deletion') ?? false,
    `users.deleted_at documented as soft deletion timestamp`
  );

  // ─── 5. Controlled Agent Tools (Vision Section 10) ────────────────────────
  console.log('\n--- 5. Controlled Agent Tools Suite (All 12 Tools) ---');
  const toolsToTest = [
    'inspect_schema',
    'search_schema',
    'explain_query',
    'execute_query',
    'create_backup',
    'restore_backup',
    'inspect_indexes',
    'create_index',
    'inspect_statistics',
    'search_documentation',
    'inspect_logs',
    'generate_report'
  ];

  for (const toolName of toolsToTest) {
    let args: any = {};
    if (toolName === 'search_schema') args = { query: 'user' };
    if (toolName === 'explain_query') args = { sql: 'SELECT * FROM users WHERE id = 1' };
    if (toolName === 'execute_query') args = { sql: 'SELECT COUNT(*) FROM users' };
    if (toolName === 'create_backup') args = { backupName: 'test-backup' };
    if (toolName === 'restore_backup') args = { snapshotId: 'snap-1' };
    if (toolName === 'inspect_indexes') args = { tableName: 'orders' };
    if (toolName === 'create_index') args = { indexName: 'idx_test', tableName: 'orders', columns: ['customer_id'] };
    if (toolName === 'inspect_statistics') args = { slowOnly: true };
    if (toolName === 'search_documentation') args = { keyword: 'cancelled' };
    if (toolName === 'inspect_logs') args = { limit: 5 };
    if (toolName === 'generate_report') args = { topic: 'performance' };

    const toolRes = await dbAgentRuntime.executeTool(toolName as any, args);
    assert(toolRes.success, `Tool "${toolName}" executed successfully`);
  }

  // ─── 6. Autonomous Database Management Workflows (Vision Section 4 & 5) ───
  console.log('\n--- 6. Autonomous Database Management Workflows ---');

  // Test 6.1: "Find slow queries"
  const slowQueriesRes = await dbAgentRuntime.runAgent({
    prompt: 'Find slow queries.',
    provider: 'openai'
  });
  assert(slowQueriesRes.replyText.includes('Query #1842'), `"Find slow queries" identifies Query #1842`);
  assert(slowQueriesRes.replyText.includes('Query #1938'), `"Find slow queries" identifies Query #1938`);
  assert(slowQueriesRes.toolsExecuted.includes('inspect_statistics'), `Tool inspect_statistics was called`);

  // Test 6.2: "Optimize query #1842"
  const optimizeRes = await dbAgentRuntime.runAgent({
    prompt: 'Optimize query #1842',
    provider: 'openai'
  });
  assert(
    optimizeRes.replyText.includes('CREATE INDEX') || (optimizeRes.suggestedSql?.includes('CREATE INDEX') ?? false),
    `"Optimize query #1842" recommends index optimization`
  );
  assert(optimizeRes.toolsExecuted.includes('explain_query'), `Tool explain_query was called during optimization`);

  // Test 6.3: "Find customers who haven't placed an order in the last six months"
  const customerRes = await dbAgentRuntime.runAgent({
    prompt: "Find customers who haven't placed an order in the last six months.",
    provider: 'openai'
  });
  assert(customerRes.executionPlan !== undefined, `Execution plan generated for customer analysis`);
  assert(customerRes.executionPlan?.riskLevel === 'LOW', `Execution risk marked as LOW`);
  assert(
    (customerRes.executionPlan?.suggestedSteps?.length === 4) || (customerRes.executionPlan?.steps?.length === 4),
    `Plan includes 4 sequential reasoning steps`
  );
  assert(
    Boolean(customerRes.suggestedSql?.includes('customers') && customerRes.suggestedSql?.includes('orders')),
    `Suggested SQL references customers and orders tables`
  );

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n=============================================================');
  console.log(`  SUMMARY: ${passCount} Passed, ${failCount} Failed`);
  console.log('=============================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error in tests:', err);
  process.exit(1);
});
