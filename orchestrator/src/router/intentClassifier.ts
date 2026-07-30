import { CodeIntent, RouterPath } from '../types';

export function classifyDeveloperIntent(
  rawPrompt: string,
  targetFile?: string,
  hasActiveLSP: boolean = true
): CodeIntent {
  const prompt = rawPrompt.trim().toLowerCase();

  // 1. Symbol Rename -> High Confidence Fast Path via LSP
  if (prompt.startsWith('rename') || prompt.includes('rename variable') || prompt.includes('rename function') || prompt.includes('rename class')) {
    const symbolMatch = rawPrompt.match(/rename\s+(?:variable|function|class|symbol)?\s*['"]?([a-zA-Z0-9_]+)['"]?\s+to\s+['"]?([a-zA-Z0-9_]+)['"]?/i);
    return {
      rawPrompt,
      actionType: 'LSP_RENAME',
      targetSymbol: symbolMatch ? symbolMatch[1] : undefined,
      targetFilePath: targetFile,
      confidenceScore: hasActiveLSP ? 98 : 65,
      explanation: 'Symbol rename intent detected. Routed to deterministic LSP textDocument/rename.'
    };
  }

  // 2. Find Callers / References -> High Confidence Fast Path via LSP / Ripgrep
  if (prompt.startsWith('find callers') || prompt.includes('where is') || prompt.includes('find references') || prompt.includes('who calls')) {
    return {
      rawPrompt,
      actionType: 'LSP_REFERENCES',
      targetFilePath: targetFile,
      confidenceScore: 99,
      explanation: 'Find references intent detected. Routed to deterministic LSP textDocument/references.'
    };
  }

  // 3. Format / Lint -> High Confidence Fast Path
  if (prompt.startsWith('format') || prompt.includes('fix lint') || prompt.includes('prettier') || prompt.includes('eslint')) {
    return {
      rawPrompt,
      actionType: 'FORMAT_CODE',
      targetFilePath: targetFile,
      confidenceScore: 96,
      explanation: 'Code formatting intent detected. Routed to deterministic language formatter.'
    };
  }

  // 4. Test Runner -> High Confidence Fast Path
  if (prompt.startsWith('run test') || prompt.includes('exec tests') || prompt.includes('test file')) {
    return {
      rawPrompt,
      actionType: 'RUN_TESTS',
      targetFilePath: targetFile,
      confidenceScore: 95,
      explanation: 'Test suite execution intent detected. Routed to deterministic CLI test runner.'
    };
  }

  // 5. Complex Reasoning / Bug Fix / Multi-File Feature -> Escalates to Agentic LLM Path
  if (prompt.includes('fix bug') || prompt.includes('implement') || prompt.includes('why') || prompt.includes('refactor across') || prompt.includes('add feature')) {
    return {
      rawPrompt,
      actionType: 'MULTI_FILE_FEATURE',
      targetFilePath: targetFile,
      confidenceScore: 35, // Escalate to LLM
      explanation: 'Ambiguous or multi-step reasoning requested. Escalated to Agentic LLM Reasoning Engine.'
    };
  }

  // Fallback default
  return {
    rawPrompt,
    actionType: 'COMPLEX_REASONING',
    targetFilePath: targetFile,
    confidenceScore: 55,
    explanation: 'Uncertain intent pattern. Escalated to LLM for intent resolution.'
  };
}

export function determineRouterPath(confidenceScore: number): RouterPath {
  return confidenceScore >= 80 ? 'DETERMINISTIC_FAST_PATH' : 'AGENTIC_LLM_PATH';
}
