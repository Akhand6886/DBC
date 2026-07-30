export type RouterPath = 'DETERMINISTIC_FAST_PATH' | 'AGENTIC_LLM_PATH';

export type FastPathAction = 'LSP_RENAME' | 'LSP_REFERENCES' | 'FORMAT_CODE' | 'RUN_TESTS' | 'TREE_SITTER_REFACTOR' | 'RIPGREP_SEARCH';

export type LLMModelProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface CodeIntent {
  rawPrompt: string;
  actionType: FastPathAction | 'COMPLEX_REASONING' | 'MULTI_FILE_FEATURE' | 'DEEP_BUG_FIX';
  targetSymbol?: string;
  targetFilePath?: string;
  confidenceScore: number; // 0 - 100
  explanation: string;
}

export interface ShadowDiffCheck {
  id: string;
  timestamp: string;
  targetFile: string;
  originalContent: string;
  proposedContent: string;
  patchDiff: string;
  syntaxCheckPassed: boolean;
  lspDiagnosticsCount: number;
  requiresUserApproval: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ROLLED_BACK';
}

export interface AgentExecutionPlan {
  id: string;
  prompt: string;
  routerPath: RouterPath;
  confidenceScore: number;
  intent: CodeIntent;
  executionTimeMs: number;
  tokenCostUSD: number;
  generatedChanges: ShadowDiffCheck[];
  status: 'SUCCESS' | 'BLOCKED' | 'PENDING_VERIFICATION';
}
