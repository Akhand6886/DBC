import { CodeIntent } from '../types';

export function classifyDeveloperIntent(
  rawPrompt: string,
  targetFilePath?: string
): CodeIntent {
  const prompt = rawPrompt.trim().toLowerCase();

  // 1. Symbol Rename -> High Confidence Fast Path via LSP (Score: 98%)
  if (prompt.startsWith('rename') || prompt.includes('rename variable') || prompt.includes('rename function') || prompt.includes('rename class')) {
    const symbolMatch = rawPrompt.match(/rename\s+(?:variable|function|class|symbol)?\s*['"]?([a-zA-Z0-9_]+)['"]?\s+to\s+['"]?([a-zA-Z0-9_]+)['"]?/i);
    return {
      rawPrompt,
      actionType: 'LSP_RENAME',
      targetSymbol: symbolMatch ? symbolMatch[1] : 'main',
      targetFilePath,
      confidenceScore: 98,
      explanation: 'Symbol rename pattern matched. Dispatched to deterministic LSP textDocument/rename.'
    };
  }

  // 2. Find References / Callers -> High Confidence Fast Path via LSP (Score: 99%)
  if (prompt.startsWith('find callers') || prompt.includes('where is') || prompt.includes('find references') || prompt.includes('who calls')) {
    return {
      rawPrompt,
      actionType: 'LSP_REFERENCES',
      targetFilePath,
      confidenceScore: 99,
      explanation: 'Symbol references pattern matched. Dispatched to deterministic LSP textDocument/references.'
    };
  }

  // 3. Format / Lint -> High Confidence Fast Path (Score: 96%)
  if (prompt.startsWith('format') || prompt.includes('fix lint') || prompt.includes('prettier') || prompt.includes('eslint')) {
    return {
      rawPrompt,
      actionType: 'FORMAT_CODE',
      targetFilePath,
      confidenceScore: 96,
      explanation: 'Code formatting pattern matched. Dispatched to deterministic Prettier/Biome formatter.'
    };
  }

  // 4. Test Runner -> High Confidence Fast Path (Score: 95%)
  if (prompt.startsWith('run test') || prompt.includes('exec tests') || prompt.includes('test file')) {
    return {
      rawPrompt,
      actionType: 'RUN_TESTS',
      targetFilePath,
      confidenceScore: 95,
      explanation: 'Test execution pattern matched. Dispatched to deterministic CLI test runner.'
    };
  }

  // 5. Tree-Sitter AST Refactor -> Fast Path (Score: 85%)
  if (prompt.startsWith('extract function') || prompt.includes('extract method')) {
    return {
      rawPrompt,
      actionType: 'TREE_SITTER_REFACTOR',
      targetFilePath,
      confidenceScore: 85,
      explanation: 'AST refactor pattern matched. Dispatched to Rust Tree-sitter AST engine.'
    };
  }

  // 6. Complex Reasoning / Multi-File Feature / Bug Diagnosis -> Agentic LLM Path (Score: 35%)
  if (prompt.includes('fix bug') || prompt.includes('implement') || prompt.includes('why') || prompt.includes('refactor across') || prompt.includes('add feature')) {
    return {
      rawPrompt,
      actionType: 'MULTI_FILE_FEATURE',
      targetFilePath,
      confidenceScore: 35,
      explanation: 'Ambiguous natural language intent requiring reasoning. Escalated to Agentic LLM Path.'
    };
  }

  // Default fallback for unclassified prompt
  return {
    rawPrompt,
    actionType: 'COMPLEX_REASONING',
    targetFilePath,
    confidenceScore: 60,
    explanation: 'Uncertain intent pattern. Escalated to LLM Reasoning Engine.'
  };
}
