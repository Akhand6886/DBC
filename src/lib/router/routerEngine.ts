import {
  CodeIntent,
  RouterConfig,
  AgentExecutionPlan,
  ShadowDiffCheck,
  LLMProvider,
  RouterPath
} from '../types';
import { classifyDeveloperIntent, DEFAULT_ROUTER_CONFIG } from './intentClassifier';
import { runDeterministicAction } from './deterministicEngine';
import { runLLMReasoning } from './llmEngine';

export interface RoutePreview {
  intent: CodeIntent;
  routerPath: RouterPath;
  estimatedLatencyMs: number;
  estimatedCostUSD: number;
  isFastPath: boolean;
}

/**
 * Real-time intent preview helper for UI live-gauges while the user is typing.
 */
export function previewDeveloperIntent(
  rawPrompt: string,
  targetFilePath?: string,
  config: RouterConfig = DEFAULT_ROUTER_CONFIG
): RoutePreview {
  const intent = classifyDeveloperIntent(rawPrompt, targetFilePath, config);
  const isFastPath = intent.confidenceScore >= config.confidenceThreshold;
  const routerPath: RouterPath = isFastPath ? 'DETERMINISTIC_FAST_PATH' : 'AGENTIC_LLM_PATH';

  return {
    intent,
    routerPath,
    estimatedLatencyMs: isFastPath ? 3 : 840,
    estimatedCostUSD: isFastPath ? 0.0 : 0.0035,
    isFastPath
  };
}

export interface ExecuteRouteParams {
  prompt: string;
  targetFilePath?: string;
  currentContent: string;
  provider: LLMProvider;
  config?: RouterConfig;
}

export interface ExecuteRouteResult {
  plan: AgentExecutionPlan;
  diffCheck: ShadowDiffCheck;
  proposedContent: string;
  logMessage: string;
}

/**
 * Main dual-path dispatch engine.
 * Decides between Deterministic Fast-Path and Agentic LLM Escalation.
 */
export function executeRoutedPrompt({
  prompt,
  targetFilePath,
  currentContent,
  provider,
  config = DEFAULT_ROUTER_CONFIG
}: ExecuteRouteParams): ExecuteRouteResult {
  const intent = classifyDeveloperIntent(prompt, targetFilePath, config);
  const isFastPath = intent.confidenceScore >= config.confidenceThreshold;
  const routerPath: RouterPath = isFastPath ? 'DETERMINISTIC_FAST_PATH' : 'AGENTIC_LLM_PATH';

  let proposedContent = currentContent;
  let executionTimeMs = 3;
  let tokenCostUSD = 0.0;
  let logMessage = '';

  if (isFastPath) {
    const res = runDeterministicAction(intent, currentContent);
    proposedContent = res.proposedContent;
    executionTimeMs = res.executionTimeMs;
    logMessage = `⚡ [Fast-Path Router | ${intent.confidenceScore}%]: ${res.logMessage} (0.00 cost, ${executionTimeMs}ms)`;
  } else {
    const res = runLLMReasoning(intent, currentContent, provider);
    proposedContent = res.proposedContent;
    executionTimeMs = res.executionTimeMs;
    tokenCostUSD = res.tokenCostUSD;
    logMessage = `🧠 [LLM Escalation | ${intent.confidenceScore}%]: ${res.logMessage} ($${tokenCostUSD.toFixed(4)}, ${executionTimeMs}ms)`;
  }

  const patchId = `patch-${Date.now().toString(36)}`;
  const patchLine = `+ // Routed via ${routerPath}: ${prompt.slice(0, 40)}`;

  const diffCheck: ShadowDiffCheck = {
    id: patchId,
    timestamp: new Date().toLocaleTimeString(),
    targetFile: targetFilePath || 'queries/users_report.sql',
    originalContent: currentContent,
    proposedContent,
    patchDiff: patchLine,
    syntaxCheckPassed: true,
    lspDiagnosticsCount: 0,
    requiresUserApproval: true,
    status: 'PENDING'
  };

  const planId = `plan-${Math.random().toString(36).substring(2, 7)}`;
  const plan: AgentExecutionPlan = {
    id: planId,
    prompt,
    routerPath,
    confidenceScore: intent.confidenceScore,
    intent,
    executionTimeMs,
    tokenCostUSD,
    generatedChanges: [diffCheck],
    status: 'SUCCESS',
    modelProvider: provider
  };

  return { plan, diffCheck, proposedContent, logMessage };
}
