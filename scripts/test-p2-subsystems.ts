/**
 * DBC Phase 2 Subsystems Automated Verification Test Suite
 * Validates:
 * 1. Data Lineage Engine & AST Graph Parser (dataLineageEngine.ts)
 * 2. Database Sandbox & Branch Execution Engine (dbBranchManager.ts)
 * 3. Agent Performance Optimizer & Index Advisor (agentPerformanceOptimizer.ts)
 */

import { dataLineageEngine } from '../src/lib/lineage/dataLineageEngine';
import { dbBranchManager } from '../src/lib/sandbox/dbBranchManager';
import { agentPerformanceOptimizer } from '../src/lib/optimizer/agentPerformanceOptimizer';

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

async function runP2Tests() {
  console.log('================================================================');
  console.log('  DBC PHASE 2 SUB-SYSTEMS VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. DATA LINEAGE ENGINE (dataLineageEngine)
  // -------------------------------------------------------------------------
  console.log('🕸️ [1/3] Testing Data Lineage Engine & Dependency Graphs...');

  const allNodes = dataLineageEngine.getAllNodes();
  assert(allNodes.length >= 6, 'Initial lineage graph contains default seed nodes (tables, views, reports)');

  const usersNode = dataLineageEngine.getNode('users');
  assert(!!usersNode && usersNode.type === 'SOURCE_TABLE', 'Node "users" found and typed as SOURCE_TABLE');

  const allEdges = dataLineageEngine.getAllEdges();
  assert(allEdges.length >= 6, 'Lineage edges registered across tables and views');

  // Downstream nodes check
  const downstreamOfUsers = dataLineageEngine.getDownstreamNodes('users');
  assert(
    downstreamOfUsers.some(n => n.id === 'audit_logs' || n.id === 'v_user_permissions'),
    'Downstream dependencies of "users" correctly identify audit_logs or v_user_permissions'
  );

  // Upstream nodes check
  const upstreamOfView = dataLineageEngine.getUpstreamNodes('v_user_permissions');
  assert(
    upstreamOfView.some(n => n.id === 'users') && upstreamOfView.some(n => n.id === 'roles'),
    'Upstream dependencies of "v_user_permissions" correctly trace back to both users and roles'
  );

  // Blast impact evaluation
  const blastAssessment = dataLineageEngine.analyzeBlastImpact('users', 'role_id');
  assert(
    blastAssessment.riskLevel === 'HIGH' || blastAssessment.riskLevel === 'CRITICAL',
    `Blast radius assessment on critical foreign key users.role_id flags elevated risk: ${blastAssessment.riskLevel}`
  );
  assert(
    blastAssessment.affectedDownstreamNodes.length > 0,
    `Blast radius discovers ${blastAssessment.affectedDownstreamNodes.length} affected downstream nodes`
  );
  assert(
    blastAssessment.breakingChanges.length > 0,
    'Blast radius computes explicit breaking change warnings'
  );

  // SQL AST Lineage Parser
  const parsedLineage = dataLineageEngine.parseSqlLineage(
    'SELECT u.id, u.username, r.role_name FROM users u INNER JOIN roles r ON u.role_id = r.id;'
  );
  assert(
    parsedLineage.sources.includes('users') && parsedLineage.sources.includes('roles'),
    'SQL AST parser successfully extracts multiple joined source tables'
  );
  assert(
    parsedLineage.transformationType === 'JOIN',
    'SQL AST parser accurately identifies transformation type as JOIN'
  );

  // -------------------------------------------------------------------------
  // 2. DATABASE SANDBOX & BRANCH EXECUTION (dbBranchManager)
  // -------------------------------------------------------------------------
  console.log('\n🌿 [2/3] Testing Database Sandbox & Branch Execution...');

  const activeBranch = dbBranchManager.getActiveBranch();
  assert(activeBranch.id === 'main' && activeBranch.isMain, 'Active branch is initial main production branch');

  // Create isolated sandbox branch
  const sandboxBranch = dbBranchManager.createBranch(
    'sandbox/test-migration',
    'Ephemeral branch for agent migration trial',
    'main'
  );
  assert(sandboxBranch.id.includes('sandbox') && sandboxBranch.isSandbox, 'Sandbox branch created with isolated state');

  const branches = dbBranchManager.getAllBranches();
  assert(branches.length >= 2, 'Branch manager registers multiple branches in directory');

  // Execute mutation inside sandbox branch
  const mutationSql = "INSERT INTO users (id, username, email, role_id) VALUES (99, 'sandbox_bot', 'bot@sandbox.dev', 2);";
  const branchExecResult = dbBranchManager.executeInBranch(sandboxBranch.id, mutationSql);
  assert(branchExecResult.success, 'Query execution succeeds inside isolated sandbox branch');

  // Verify main is NOT mutated (isolation check)
  const mainUsersCount = dbBranchManager.getBranch('main')?.data['users']?.length;
  const sandboxUsersCount = dbBranchManager.getBranch(sandboxBranch.id)?.data['users']?.length;
  assert(
    mainUsersCount !== undefined && sandboxUsersCount !== undefined && sandboxUsersCount === mainUsersCount + 1,
    `Main branch remains isolated (${mainUsersCount} rows) while sandbox row count grew (${sandboxUsersCount} rows)`
  );

  // Diff branches
  const diff = dbBranchManager.diffBranches('main', sandboxBranch.id);
  assert(diff.hasModifications, 'Branch diff accurately identifies modifications between main and sandbox');
  assert(
    diff.dataChanges.some(dc => dc.tableName === 'users' && dc.delta === 1),
    'Branch diff captures 1 row delta in users table'
  );

  // Merge branch into main
  const mergeResult = dbBranchManager.mergeBranch(sandboxBranch.id, 'main');
  assert(mergeResult.success, '1-click merge of sandbox branch into main succeeds');
  const postMergeMainUsers = dbBranchManager.getBranch('main')?.data['users']?.length;
  assert(
    postMergeMainUsers === sandboxUsersCount,
    `Main branch updated post-merge to target row count (${postMergeMainUsers} rows)`
  );

  // Cleanup: Delete sandbox branch
  const deleteResult = dbBranchManager.deleteBranch(sandboxBranch.id);
  assert(deleteResult, 'Ephemeral sandbox branch safely deleted post-merge');

  // -------------------------------------------------------------------------
  // 3. AGENT PERFORMANCE OPTIMIZER (agentPerformanceOptimizer)
  // -------------------------------------------------------------------------
  console.log('\n⚡ [3/3] Testing Agent Performance Optimizer & Index Advisor...');

  const initialRecs = agentPerformanceOptimizer.getRecommendations();
  assert(initialRecs.length >= 2, 'Initial performance recommendations catalog loaded');

  // Analyze query with sequential scan
  const unindexedSql = "SELECT * FROM users WHERE email = 'test@example.com';";
  const analysis = agentPerformanceOptimizer.analyzeQuery(unindexedSql);
  assert(analysis.hasSequentialScan, 'Optimizer detects sequential scan on unindexed WHERE filter predicate');
  assert(
    analysis.recommendations.some(r => r.type === 'INDEX_CREATION' && r.targetTable === 'users'),
    'Optimizer synthesizes CREATE INDEX recommendation for unindexed predicate'
  );
  assert(
    analysis.recommendations.some(r => r.executableSql.includes('CREATE INDEX')),
    'Optimizer recommendation contains verified executable DDL statement'
  );

  // Benchmark query comparison
  const originalSql = 'SELECT * FROM users WHERE role_id = 2;';
  const optimizedSql = 'SELECT id, username FROM users WHERE role_id = 2;';
  const benchmark = agentPerformanceOptimizer.benchmarkQuery(originalSql, optimizedSql);
  assert(
    benchmark.speedupPercentage > 0 && benchmark.optimizedLatencyMs <= benchmark.baselineLatencyMs,
    `Virtual benchmark simulates latency drop: ${benchmark.baselineLatencyMs}ms -> ${benchmark.optimizedLatencyMs}ms (${benchmark.speedupPercentage}% speedup)`
  );

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

runP2Tests().catch(err => {
  console.error('Test suite runner encountered an unhandled error:', err);
  process.exit(1);
});
