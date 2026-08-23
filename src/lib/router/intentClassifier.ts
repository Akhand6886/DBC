import { CodeIntent, RouterConfig } from '../types';

export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  confidenceThreshold: 80,
  enableLspRename: true,
  enableLspReferences: true,
  enableFormatter: true,
  enableTestRunner: true,
  enableTreeSitterRefactor: true
};

export function classifyDeveloperIntent(
  rawPrompt: string,
  targetFilePath?: string,
  config: RouterConfig = DEFAULT_ROUTER_CONFIG
): CodeIntent {
  const prompt = rawPrompt.trim().toLowerCase();

  // Sub-score defaults
  let patternScore = 30;
  let lspAvailabilityScore = 95;
  let ambiguityPenalty = 0;

  // Detect ambiguity terms
  if (prompt.includes('why') || prompt.includes('fix bug') || prompt.includes('implement') || prompt.includes('refactor across') || prompt.includes('redesign')) {
    ambiguityPenalty = 55;
  }

  // 1. Symbol Rename -> LSP Rename Rule
  if (config.enableLspRename && (prompt.startsWith('rename') || prompt.includes('rename variable') || prompt.includes('rename function'))) {
    patternScore = 98;
    const symbolMatch = rawPrompt.match(/rename\s+(?:variable|function|class|symbol)?\s*['"]?([a-zA-Z0-9_]+)['"]?\s+to\s+['"]?([a-zA-Z0-9_]+)['"]?/i);
    const finalScore = Math.max(0, Math.min(100, Math.round(0.6 * patternScore + 0.4 * lspAvailabilityScore - ambiguityPenalty)));

    return {
      rawPrompt,
      actionType: 'LSP_RENAME',
      targetSymbol: symbolMatch ? symbolMatch[1] : 'main',
      targetFilePath,
      confidenceScore: finalScore,
      scoreBreakdown: { patternScore, lspAvailabilityScore, ambiguityPenalty, finalScore },
      explanation: 'Matched rule: LSP textDocument/rename. High structural pattern match.'
    };
  }

  // 2. Find Callers / References -> LSP References Rule
  if (config.enableLspReferences && (prompt.startsWith('find callers') || prompt.includes('where is') || prompt.includes('find references'))) {
    patternScore = 99;
    const finalScore = Math.max(0, Math.min(100, Math.round(0.6 * patternScore + 0.4 * lspAvailabilityScore - ambiguityPenalty)));

    return {
      rawPrompt,
      actionType: 'LSP_REFERENCES',
      targetFilePath,
      confidenceScore: finalScore,
      scoreBreakdown: { patternScore, lspAvailabilityScore, ambiguityPenalty, finalScore },
      explanation: 'Matched rule: LSP textDocument/references. High precision index match.'
    };
  }

  // 3. Format Code -> Formatter Rule
  if (config.enableFormatter && (prompt.startsWith('format') || prompt.includes('fix lint') || prompt.includes('prettier'))) {
    patternScore = 96;
    const finalScore = Math.max(0, Math.min(100, Math.round(0.6 * patternScore + 0.4 * lspAvailabilityScore - ambiguityPenalty)));

    return {
      rawPrompt,
      actionType: 'FORMAT_CODE',
      targetFilePath,
      confidenceScore: finalScore,
      scoreBreakdown: { patternScore, lspAvailabilityScore, ambiguityPenalty, finalScore },
      explanation: 'Matched rule: Prettier/Biome Code Formatter.'
    };
  }

  // 4. Test Runner Rule
  if (config.enableTestRunner && (prompt.startsWith('run test') || prompt.includes('exec tests') || prompt.includes('test file'))) {
    patternScore = 95;
    const finalScore = Math.max(0, Math.min(100, Math.round(0.6 * patternScore + 0.4 * lspAvailabilityScore - ambiguityPenalty)));

    return {
      rawPrompt,
      actionType: 'RUN_TESTS',
      targetFilePath,
      confidenceScore: finalScore,
      scoreBreakdown: { patternScore, lspAvailabilityScore, ambiguityPenalty, finalScore },
      explanation: 'Matched rule: CLI Test Runner Integration.'
    };
  }

  // 5. Tree-Sitter AST Refactor Rule
  if (config.enableTreeSitterRefactor && (prompt.startsWith('extract function') || prompt.includes('extract method'))) {
    patternScore = 88;
    const finalScore = Math.max(0, Math.min(100, Math.round(0.6 * patternScore + 0.4 * lspAvailabilityScore - ambiguityPenalty)));

    return {
      rawPrompt,
      actionType: 'TREE_SITTER_REFACTOR',
      targetFilePath,
      confidenceScore: finalScore,
      scoreBreakdown: { patternScore, lspAvailabilityScore, ambiguityPenalty, finalScore },
      explanation: 'Matched rule: Tree-sitter AST structural refactor.'
    };
  }

  // Complex Reasoning / Bug Fix -> LLM Escalation
  patternScore = 30;
  const finalScore = Math.max(0, Math.min(100, Math.round(0.6 * patternScore + 0.4 * lspAvailabilityScore - ambiguityPenalty)));

  return {
    rawPrompt,
    actionType: 'MULTI_FILE_FEATURE',
    targetFilePath,
    confidenceScore: finalScore,
    scoreBreakdown: { patternScore, lspAvailabilityScore, ambiguityPenalty, finalScore },
    explanation: 'Ambiguous or multi-step reasoning requested. Escalated to LLM Reasoning Engine.'
  };
}
