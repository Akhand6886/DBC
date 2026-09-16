/**
 * DBC Phase 1 Subsystems Automated Verification Test Suite
 * Validates:
 * 1. Database Memory & Business Invariants (dbMemory.ts)
 * 2. Specialized Database Agent Personas (specializedAgents.ts)
 * 3. Model Context Protocol (MCP) Server (mcpServer.ts)
 * 4. Extensible Database Driver/Plugin API (driverPluginApi.ts)
 */

import { dbMemory } from '../src/lib/db/dbMemory';
import { specializedAgents, AgentPersonaId, SPECIALIZED_PERSONAS } from '../src/lib/agent/specializedAgents';
import { mcpServer } from '../src/lib/mcp/mcpServer';
import { driverRegistry, DbDriverPlugin } from '../src/lib/db/driverPluginApi';

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

async function runTests() {
  console.log('================================================================');
  console.log('  DBC PHASE 1 SUB-SYSTEMS VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // 1. DATABASE MEMORY & BUSINESS CONTEXT (dbMemory)
  // -------------------------------------------------------------------------
  console.log('📦 [1/4] Testing Database Memory & Business Invariants...');

  const initialRules = dbMemory.getRules();
  assert(initialRules.length >= 3, 'Initial default business invariant rules loaded');

  // Add custom domain invariant rule
  const customRule = dbMemory.addRule({
    title: 'Mandatory LIMIT on Public Queries',
    rule: 'All public SELECT queries must contain a LIMIT <= 500',
    severity: 'MANDATORY',
    affectedTables: ['users', 'audit_logs']
  });

  const activeRules = dbMemory.getRules();
  assert(
    activeRules.some(r => r.id === customRule.id),
    'Custom business rule registered and retrieved in active rules'
  );

  // Table annotations and column semantics
  dbMemory.setTableAnnotation({
    tableName: 'audit_logs',
    description: 'Stores immutable system audit trails',
    primaryPurpose: 'Security and compliance auditing',
    ownerTeam: 'Platform Security',
    tags: ['audit', 'security']
  });

  dbMemory.setColumnAnnotation('audit_logs', {
    columnName: 'actor_ip',
    description: 'IPv4/IPv6 client origin',
    isPii: true
  });

  const auditAnnotation = dbMemory.getTableAnnotation('audit_logs');
  const colAnnotation = dbMemory.getColumnAnnotation('audit_logs', 'actor_ip');
  assert(
    auditAnnotation?.ownerTeam === 'Platform Security' && colAnnotation?.isPii === true,
    'Table annotations and column PII semantics persisted and retrieved'
  );

  // Schema context enrichment
  const enrichedContext = dbMemory.getEnrichedSchemaContext('users');
  assert(
    enrichedContext.includes('Organizational Database Memory') && enrichedContext.includes('Administrator Identity Protection'),
    'Enriched schema context contains formatted domain invariant policies'
  );

  // Learned Query Patterns
  const newPat = dbMemory.addPattern({
    title: 'Users Filter by Role',
    description: 'Frequent filter on active role',
    sampleSql: 'SELECT * FROM users WHERE role_id = 1;',
    recommendedIndex: 'CREATE INDEX idx_users_role_id ON users(role_id);'
  });

  const patterns = dbMemory.getPatterns();
  assert(
    patterns.some(p => p.id === newPat.id),
    'Learned query pattern recorded and indexed'
  );

  console.log('');

  // -------------------------------------------------------------------------
  // 2. SPECIALIZED DB AGENT PERSONAS (specializedAgents)
  // -------------------------------------------------------------------------
  console.log('🤖 [2/4] Testing Specialized Database Agent Personas...');

  const personas = specializedAgents.getAllPersonas();
  assert(personas.length === 4, 'All 4 specialized personas registered (DBA, Schema, Analyst, Security)');

  const personaIds: AgentPersonaId[] = ['dba_optimizer', 'schema_architect', 'data_analyst', 'security_auditor'];
  for (const id of personaIds) {
    const p = specializedAgents.getPersona(id);
    assert(
      !!p.systemDirective && p.recommendedTriggers.length >= 3,
      `Persona '${p.badge}' has system directive and >=3 recommended triggers`
    );
  }

  // Execute ReAct query through DBA Optimizer persona
  const dbaResult = await specializedAgents.runPersonaAgent(
    'dba_optimizer',
    'analyze slow query on users and suggest optimal indexes',
    'anthropic',
    'users'
  );

  assert(
    dbaResult.persona.id === 'dba_optimizer',
    'DBA Optimizer run returns persona metadata'
  );
  assert(
    dbaResult.toolsExecuted.length > 0 && dbaResult.replyText.length > 0,
    `DBA Optimizer executed tools [${dbaResult.toolsExecuted.join(', ')}] in ${dbaResult.totalDurationMs}ms`
  );

  // Execute ReAct query through Security Auditor persona
  const secResult = await specializedAgents.runPersonaAgent(
    'security_auditor',
    'verify domain rules protecting root administrator accounts',
    'openai',
    'users'
  );

  assert(
    secResult.persona.id === 'security_auditor' && secResult.replyText.length > 0,
    `Security Auditor executed ReAct evaluation with reply length ${secResult.replyText.length}`
  );

  console.log('');

  // -------------------------------------------------------------------------
  // 3. MODEL CONTEXT PROTOCOL (MCP) SERVER (mcpServer)
  // -------------------------------------------------------------------------
  console.log('🔌 [3/4] Testing Model Context Protocol (MCP) Server...');

  // MCP initialize
  const initRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2024-11-05' }
  });
  assert(
    initRes.result?.serverInfo?.name === 'dbc-agentic-mcp-server',
    'MCP initialize returns server identity and protocol version'
  );

  // MCP ping
  const pingRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'ping'
  });
  assert(pingRes.result !== undefined, 'MCP ping returns successful empty object response');

  // MCP tools/list
  const toolsRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/list'
  });
  const toolsList = toolsRes.result?.tools || [];
  assert(
    toolsList.length === 6,
    `MCP tools/list returns all 6 typed DB tools (${toolsList.map((t: any) => t.name).join(', ')})`
  );

  // MCP tools/call (dbc_introspect_schema)
  const callRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'dbc_introspect_schema',
      arguments: {}
    }
  });
  assert(
    callRes.result?.content?.[0]?.text?.includes('users') && callRes.result?.content?.[0]?.text?.includes('roles'),
    'MCP tools/call for dbc_introspect_schema returned formatted table schema'
  );

  // MCP resources/list & resources/read
  const resourcesRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'resources/list'
  });
  assert(
    resourcesRes.result?.resources?.some((r: any) => r.uri === 'db://schema'),
    'MCP resources/list exposes db://schema resource URI'
  );

  const readRes = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 6,
    method: 'resources/read',
    params: { uri: 'db://schema' }
  });
  assert(
    readRes.result?.contents?.[0]?.text?.includes('users') && readRes.result?.contents?.[0]?.text?.includes('roles'),
    'MCP resources/read successfully returned database schema resource contents'
  );

  console.log('');

  // -------------------------------------------------------------------------
  // 4. EXTENSIBLE DRIVER/PLUGIN API (driverPluginApi)
  // -------------------------------------------------------------------------
  console.log('🧩 [4/4] Testing Extensible Database Driver/Plugin API...');

  const plugins = driverRegistry.getAllPlugins();
  assert(plugins.length >= 4, `Built-in database drivers registered (${plugins.map(p => p.id).join(', ')})`);

  // Active plugin negotiation
  driverRegistry.setActivePlugin('duckdb');
  const activePlugin = driverRegistry.getActivePlugin();
  assert(activePlugin.id === 'duckdb', 'Active driver plugin switched to DuckDB OLAP');

  const duckdbCaps = activePlugin.capabilities;
  assert(
    duckdbCaps.isColumnarOLAP === true && duckdbCaps.supportsTransactions === true,
    'DuckDB driver reports isColumnarOLAP=true and supportsTransactions=true capabilities'
  );

  // Connect & Query DuckDB driver
  const connResult = await activePlugin.connect('duckdb://memory.duckdb');
  assert(connResult.success, 'DuckDB driver plugin connected successfully');

  const duckQuery = await activePlugin.executeQuery('SELECT 42 as answer;');
  assert(duckQuery.rows?.[0]?.answer === 42, 'DuckDB driver plugin executed query successfully');

  // Custom 3rd-party driver plugin registration
  const customMockPlugin: DbDriverPlugin = {
    id: 'snowflake_mock',
    name: 'Snowflake Enterprise Warehouse (Mock)',
    dialect: 'postgres',
    version: '2.4.0',
    description: 'Cloud data warehouse plugin',
    capabilities: {
      supportsTransactions: true,
      supportsSavepoints: true,
      supportsExplainAnalyze: true,
      supportsIndexAdvisor: false,
      supportsColumnDrop: true,
      supportsFullOuterJoin: true,
      isColumnarOLAP: true
    },
    connect: async () => ({ success: true, message: 'Connected' }),
    disconnect: async () => {},
    introspectSchema: async () => [],
    executeQuery: async (sql: string) => ({
      success: true,
      columns: ['warehouse', 'status'],
      rows: [{ warehouse: 'COMPUTE_WH', status: 'READY' }],
      rowCount: 1,
      executionTimeMs: 12
    })
  };

  driverRegistry.registerPlugin(customMockPlugin);
  const foundCustom = driverRegistry.getPlugin('snowflake_mock');
  assert(
    foundCustom?.name === 'Snowflake Enterprise Warehouse (Mock)',
    'Third-party database driver plugin registered dynamically'
  );

  const customQuery = await foundCustom?.executeQuery('SELECT 1;');
  assert(
    customQuery?.rows?.[0]?.warehouse === 'COMPUTE_WH',
    'Third-party database driver executed custom warehouse query'
  );

  // Reset active driver to sqlite
  driverRegistry.setActivePlugin('sqlite');
  assert(driverRegistry.getActivePlugin().id === 'sqlite', 'Reset active driver to SQLite successfully');

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
