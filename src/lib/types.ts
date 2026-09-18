export type RouterPath = 'DETERMINISTIC_FAST_PATH' | 'AGENTIC_LLM_PATH';

export type FastPathAction = 
  | 'DIRECT_SQL_EXECUTION'
  | 'DETERMINISTIC_QUERY_TEMPLATE'
  | 'DATABASE_EXPLAIN'
  | 'DATABASE_FORMAT_SQL'
  | 'DB_MANAGEMENT_SLOW_QUERIES'
  | 'DB_MANAGEMENT_OPTIMIZE_QUERY'
  | 'LSP_RENAME' 
  | 'LSP_REFERENCES' 
  | 'FORMAT_CODE' 
  | 'RUN_TESTS' 
  | 'TREE_SITTER_REFACTOR' 
  | 'RIPGREP_SEARCH';

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'nvidia';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  language?: string;
  content?: string;
  isFolder?: boolean;
  isOpen?: boolean;
  children?: FileNode[];
  isModified?: boolean;
}

export interface ScoreBreakdown {
  patternScore: number;
  lspAvailabilityScore: number;
  ambiguityPenalty: number;
  finalScore: number;
}

export interface RouterConfig {
  confidenceThreshold: number; // default 80
  enableLspRename: boolean;
  enableLspReferences: boolean;
  enableFormatter: boolean;
  enableTestRunner: boolean;
  enableTreeSitterRefactor: boolean;
  enableDeterministicSql?: boolean;
}

export interface CodeIntent {
  rawPrompt: string;
  actionType: FastPathAction | 'COMPLEX_REASONING' | 'MULTI_FILE_FEATURE' | 'DEEP_BUG_FIX' | 'AGENTIC_QUERY_PLAN' | 'AGENTIC_DIAGNOSTIC' | 'GUARDRAIL_MUTATION_APPROVAL' | string;
  compiledSql?: string;
  targetTable?: string;
  targetSymbol?: string;
  newSymbolName?: string;
  targetFilePath?: string;
  confidenceScore: number; // 0 - 100
  scoreBreakdown?: ScoreBreakdown;
  explanation: string;
  estimatedRows?: number;
  riskLevel?: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedSteps?: string[];
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
  modelProvider: LLMProvider;
  executedSql?: string;
  queryResult?: any;
}

export interface SystemMetrics {
  totalQueries: number;
  fastPathCount: number;
  llmCount: number;
  avgFastPathLatencyMs: number;
  avgLlmLatencyMs: number;
  totalCostSavedUSD: number;
  shadowVerificationsPassed: number;
}

export interface ChatMessage {
  id: string;
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
  routePath?: RouterPath;
  provider?: LLMProvider;
  confidenceScore?: number;
  executionTimeMs?: number;
  tokenCostUSD?: number;
  explanation?: string;
  logMessage?: string;
  diffCheck?: ShadowDiffCheck;
  proposedContent?: string;
  status?: 'success' | 'processing' | 'error';
}

