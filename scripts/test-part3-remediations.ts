/**
 * DBC Part 3 (Deterministic Router & Protocol Layer Domain) Verification Suite
 * Validates fixes for RT-01, RT-02, RT-03, and RT-04:
 * 1. RT-01: Async executeRoutedPrompt supporting Promise-based LLM reasoning and BYOK escalation
 * 2. RT-02: Differentiated Jaccard and proximity token scoring in AST Sidecar semantic search
 * 3. RT-03: Rolling latency metrics tracking and adaptive route previews
 * 4. RT-04: Quoted, backticked, and bracketed identifier extraction in intentClassifier
 */

import {
  executeRoutedPrompt,
  previewDeveloperIntent,
  recordRouteLatency,
  getRollingAverageLatency,
  resetRollingLatencies
} from '../src/lib/router/routerEngine';
import { classifyDeveloperIntent } from '../src/lib/router/intentClassifier';
import { runDeterministicAction } from '../src/lib/router/deterministicEngine';
import { runLLMReasoning } from '../src/lib/router/llmEngine';
import { astIndexer } from '../src/lib/sidecar/astIndexer';
import { mcpServer } from '../src/lib/mcp/mcpServer';
import { byokClient } from '../src/lib/agent/byokClient';

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

async function runPart3Tests() {
  console.log('================================================================');
  console.log('  DBC PART 3 (ROUTER & PROTOCOL) REMEDIATION TEST SUITE');
  console.log('================================================================\n');

  // ─── 1. RT-01: Async executeRoutedPrompt & BYOK Escalation ────────────────
  console.log('⚡ [1/4] Testing Asynchronous executeRoutedPrompt & LLM Reasoning (RT-01)...');
  try {
    // 1.1 Fast-path deterministic route
    const fastPromise = executeRoutedPrompt({
      prompt: 'rename variable old_id to user_id',
      targetFilePath: 'src/index.ts',
      currentContent: 'const old_id = 42;\nconsole.log(old_id);',
      provider: 'openai'
    });

    assert(fastPromise instanceof Promise, 'executeRoutedPrompt returns a Promise');
    const fastResult = await fastPromise;
    assert(fastResult.plan.routerPath === 'DETERMINISTIC_FAST_PATH', 'Recognized DETERMINISTIC_FAST_PATH');
    assert(fastResult.plan.confidenceScore >= 80, `High confidence score: ${fastResult.plan.confidenceScore}%`);
    assert(fastResult.proposedContent.includes('user_id'), 'Deterministic rename applied to content');
    assert(fastResult.plan.tokenCostUSD === 0, 'Fast-path has 0 token cost');
    assert(fastResult.diffCheck.patchDiff.length > 0, 'Generated shadow diff check');

    // 1.2 Agentic LLM reasoning route
    const llmPromise = executeRoutedPrompt({
      prompt: 'optimize slow sequential scan on users table and add index',
      targetFilePath: 'queries/users_report.sql',
      currentContent: 'SELECT * FROM users WHERE email = "test@example.com";',
      provider: 'openai'
    });

    assert(llmPromise instanceof Promise, 'LLM escalation returns a Promise');
    const llmResult = await llmPromise;
    assert(llmResult.plan.routerPath === 'AGENTIC_LLM_PATH', 'Recognized AGENTIC_LLM_PATH');
    assert(llmResult.plan.tokenCostUSD > 0, `LLM cost tracked: $${llmResult.plan.tokenCostUSD}`);
    assert(llmResult.proposedContent.includes('CREATE INDEX') || llmResult.proposedContent.includes('Optimized'), 'LLM proposed index optimization patch');
    assert(llmResult.replyText.includes('OpenAI GPT-4o'), 'Reply cites model provider name');

    // 1.3 Alternative providers (ollama has $0.00 cost)
    const ollamaResult = await executeRoutedPrompt({
      prompt: 'explain and refactor this complex query structure',
      targetFilePath: 'queries/users_report.sql',
      currentContent: 'SELECT id, name FROM users;',
      provider: 'ollama'
    });
    assert(ollamaResult.plan.tokenCostUSD === 0, 'Ollama provider incurs $0.00 token cost');
    assert(ollamaResult.plan.modelProvider === 'ollama', 'Plan tracks provider as ollama');

    // 1.4 Direct runLLMReasoning async verification
    const reasoningRes = await runLLMReasoning(
      {
        rawPrompt: 'add index for performance',
        actionType: 'COMPLEX_REASONING',
        confidenceScore: 30,
        scoreBreakdown: { patternScore: 30, lspAvailabilityScore: 0, ambiguityPenalty: 0, finalScore: 30 },
        explanation: 'LLM reasoning needed'
      },
      'SELECT * FROM users;',
      'anthropic'
    );
    assert(typeof reasoningRes.replyText === 'string', 'runLLMReasoning returns structured replyText');
    assert(reasoningRes.executionTimeMs > 0, `runLLMReasoning records execution latency: ${reasoningRes.executionTimeMs}ms`);
  } catch (err: any) {
    assert(false, `RT-01 execution failed: ${err.message}`);
  }

  // ─── 2. RT-02: Differentiated Semantic AST Search ─────────────────────────
  console.log('\n🔍 [2/4] Testing AST Sidecar Semantic Search Similarity Scores (RT-02)...');
  try {
    // 2.1 Exact / high similarity symbol query
    const exactMatches = astIndexer.searchSemanticEmbeddings('users');
    assert(exactMatches.length > 0, 'astIndexer returned matches for "users"');
    const topMatch = exactMatches[0];
    assert((topMatch.similarityScore || 0) >= 0.90, `Top exact/substring match has high score: ${topMatch.similarityScore}`);

    // 2.2 Semantic query with partial token overlap
    const schemaMatches = astIndexer.searchSemanticEmbeddings('database initial migration schema');
    assert(schemaMatches.length > 0, 'Found results for migration schema query');
    const migrationMatch = schemaMatches.find(s => s.file.includes('initial_schema.sql'));
    assert(!!migrationMatch, 'Found initial_schema.sql in results');
    assert((migrationMatch?.similarityScore || 0) >= 0.35, `Migration schema score differentiated: ${migrationMatch?.similarityScore}`);

    // 2.3 Verify score differentiation across multiple symbols (not uniform 0.72)
    const diverseResults = astIndexer.searchSemanticEmbeddings('user');
    const scores = diverseResults.map(r => r.similarityScore || 0);
    const uniqueScores = new Set(scores);
    assert(uniqueScores.size > 1, `Semantic scores are differentiated across symbols (${uniqueScores.size} distinct scores)`);
    assert(!scores.every(s => s === 0.72), 'Scores are NOT uniformly frozen at 0.72');

    // 2.4 Verify descending sort order
    let isSorted = true;
    for (let i = 1; i < diverseResults.length; i++) {
      if ((diverseResults[i - 1].similarityScore || 0) < (diverseResults[i].similarityScore || 0)) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Semantic results are sorted in descending order of similarity score');

    // 2.5 Empty query handling
    const emptyResults = astIndexer.searchSemanticEmbeddings('');
    assert(emptyResults.length > 0, 'Empty query safely returns indexed symbols with default score');
    assert(emptyResults[0].similarityScore === 0.5, 'Empty query gives 0.5 baseline score');
  } catch (err: any) {
    assert(false, `RT-02 execution failed: ${err.message}`);
  }

  // ─── 3. RT-03: Rolling Latency Tracking & Adaptive Preview ────────────────
  console.log('\n📊 [3/4] Testing Rolling Latency Tracking & Dynamic Preview (RT-03)...');
  try {
    resetRollingLatencies();

    // Baseline preview
    const initialFastPreview = previewDeveloperIntent('rename symbol a to b');
    assert(initialFastPreview.isFastPath === true, 'Fast path preview flagged correctly');
    const baselineFastLatency = initialFastPreview.estimatedLatencyMs;
    assert(baselineFastLatency > 0 && baselineFastLatency <= 10, `Initial fast path latency baseline is small: ${baselineFastLatency}ms`);

    const initialLlmPreview = previewDeveloperIntent('architect a new distributed caching layer');
    assert(initialLlmPreview.isFastPath === false, 'LLM path preview flagged correctly');
    const baselineLlmLatency = initialLlmPreview.estimatedLatencyMs;
    assert(baselineLlmLatency >= 700, `Initial LLM latency baseline reflects reasoning: ${baselineLlmLatency}ms`);

    // Record artificial latencies to test rolling average adaptability
    recordRouteLatency('DETERMINISTIC_FAST_PATH', 25);
    recordRouteLatency('DETERMINISTIC_FAST_PATH', 35);
    const updatedFastAvg = getRollingAverageLatency('DETERMINISTIC_FAST_PATH');
    assert(updatedFastAvg > baselineFastLatency, `Fast path rolling average adapted upwards: ${updatedFastAvg}ms`);

    const dynamicPreview = previewDeveloperIntent('rename function oldFunc to newFunc');
    assert(dynamicPreview.estimatedLatencyMs === updatedFastAvg, `previewDeveloperIntent reflects rolling average: ${dynamicPreview.estimatedLatencyMs}ms`);

    // Provider-specific cost estimation
    const ollamaPreview = previewDeveloperIntent('explain this code', undefined, undefined, 'ollama');
    assert(ollamaPreview.estimatedCostUSD === 0.0, 'Ollama preview estimatedCostUSD is 0.00');

    const openaiPreview = previewDeveloperIntent('explain this code', undefined, undefined, 'openai');
    assert(openaiPreview.estimatedCostUSD === 0.0035, 'OpenAI preview estimatedCostUSD is 0.0035');

    // Execution updates rolling latencies automatically
    resetRollingLatencies();
    await executeRoutedPrompt({
      prompt: 'format sql query',
      currentContent: 'select * from users;',
      provider: 'openai'
    });
    const avgAfterRun = getRollingAverageLatency('DETERMINISTIC_FAST_PATH');
    assert(avgAfterRun >= 1, `Recorded execution into rolling window (avg: ${avgAfterRun}ms)`);
  } catch (err: any) {
    assert(false, `RT-03 execution failed: ${err.message}`);
  }

  // ─── 4. RT-04: Quoted, Backticked, and Bracketed Identifiers ─────────────
  console.log('\n🏷️  [4/4] Testing Quoted and Bracketed Identifiers in Intent Classifier (RT-04)...');
  try {
    // 4.1 Backticked table / symbol rename: `customers` -> `clients`
    const backtickRename = classifyDeveloperIntent('rename table `customers` to `clients`');
    assert(backtickRename.actionType === 'LSP_RENAME', 'Recognized rename action for backticked identifiers');
    assert(backtickRename.targetSymbol === 'customers', `Extracted source symbol: "${backtickRename.targetSymbol}"`);
    assert(backtickRename.newSymbolName === 'clients', `Extracted target symbol: "${backtickRename.newSymbolName}"`);

    // 4.2 Bracketed column rename: [user_email] -> [contact_email]
    const bracketRename = classifyDeveloperIntent('rename [user_email] to [contact_email]');
    assert(bracketRename.actionType === 'LSP_RENAME', 'Recognized rename action for bracketed identifiers');
    assert(bracketRename.targetSymbol === 'user_email', `Extracted bracketed source: "${bracketRename.targetSymbol}"`);
    assert(bracketRename.newSymbolName === 'contact_email', `Extracted bracketed target: "${bracketRename.newSymbolName}"`);

    // 4.3 Double and single quoted identifiers: "legacy_table" -> 'modern_table'
    const mixedQuoteRename = classifyDeveloperIntent('rename "legacy_table" as \'modern_table\'');
    assert(mixedQuoteRename.actionType === 'LSP_RENAME', 'Recognized rename with mixed quotes and "as" keyword');
    assert(mixedQuoteRename.targetSymbol === 'legacy_table', `Extracted double-quoted source: "${mixedQuoteRename.targetSymbol}"`);
    assert(mixedQuoteRename.newSymbolName === 'modern_table', `Extracted single-quoted target: "${mixedQuoteRename.newSymbolName}"`);

    // 4.4 Backtick & bracket references extraction
    const backtickRefs = classifyDeveloperIntent('find callers of `calculateTaxRate`');
    assert(backtickRefs.actionType === 'LSP_REFERENCES', 'Recognized LSP_REFERENCES for backticked symbol');
    assert(backtickRefs.targetSymbol === 'calculateTaxRate', `Extracted targetSymbol: "${backtickRefs.targetSymbol}"`);

    const bracketRefs = classifyDeveloperIntent('where is [account_balance]');
    assert(bracketRefs.actionType === 'LSP_REFERENCES', 'Recognized LSP_REFERENCES for bracketed symbol');
    assert(bracketRefs.targetSymbol === 'account_balance', `Extracted targetSymbol: "${bracketRefs.targetSymbol}"`);

    // 4.5 Applying deterministic rename with extracted symbol
    const detResult = runDeterministicAction(backtickRename, 'SELECT * FROM customers WHERE customers.id = 1;');
    assert(detResult.proposedContent.includes('clients'), 'Deterministic engine applied extracted rename');
  } catch (err: any) {
    assert(false, `RT-04 execution failed: ${err.message}`);
  }

  // ─── 5. MCP Server Protocol Regression Check ─────────────────────────────
  console.log('\n🌐 [Integration] Checking MCP Protocol Integration...');
  try {
    const pingRes = await mcpServer.handleRequest({
      jsonrpc: '2.0',
      id: 'test-ping-part3',
      method: 'ping'
    });
    assert(pingRes.result !== undefined, 'MCP Server responds to ping protocol');

    const schemaRes = await mcpServer.handleRequest({
      jsonrpc: '2.0',
      id: 'test-schema-part3',
      method: 'tools/call',
      params: {
        name: 'dbc_introspect_schema',
        arguments: {}
      }
    });
    assert(schemaRes.result?.content !== undefined, 'MCP Server executes dbc_introspect_schema tool');
  } catch (err: any) {
    assert(false, `MCP verification failed: ${err.message}`);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`  PART 3 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPart3Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
