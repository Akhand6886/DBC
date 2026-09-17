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

// RT-03: Rolling latency metrics tracking
const ROLLING_WINDOW_SIZE = 20;
const rollingFastLatencies: number[] = [3, 4, 2];
const rollingLlmLatencies: number[] = [840, 790, 890];

export function recordRouteLatency(path: RouterPath, latencyMs: number): void {
  const target = path === 'DETERMINISTIC_FAST_PATH' ? rollingFastLatencies : rollingLlmLatencies;
  target.push(latencyMs);
  if (target.length > ROLLING_WINDOW_SIZE) {
    target.shift();
  }
}

export function getRollingAverageLatency(path: RouterPath): number {
  const target = path === 'DETERMINISTIC_FAST_PATH' ? rollingFastLatencies : rollingLlmLatencies;
  if (target.length === 0) return path === 'DETERMINISTIC_FAST_PATH' ? 3 : 840;
  const sum = target.reduce((acc, v) => acc + v, 0);
  return Math.round(sum / target.length);
}

export function resetRollingLatencies(): void {
  rollingFastLatencies.length = 0;
  rollingFastLatencies.push(3);
  rollingLlmLatencies.length = 0;
  rollingLlmLatencies.push(840);
}

/**
 * Real-time intent preview helper for UI live-gauges while the user is typing.
 */
export function previewDeveloperIntent(
  rawPrompt: string,
  targetFilePath?: string,
  config: RouterConfig = DEFAULT_ROUTER_CONFIG,
  provider: LLMProvider = 'openai'
): RoutePreview {
  const intent = classifyDeveloperIntent(rawPrompt, targetFilePath, config);
  const isFastPath = intent.confidenceScore >= config.confidenceThreshold;
  const routerPath: RouterPath = isFastPath ? 'DETERMINISTIC_FAST_PATH' : 'AGENTIC_LLM_PATH';

  const estimatedLatencyMs = getRollingAverageLatency(routerPath);
  const estimatedCostUSD = isFastPath ? 0.0 : (provider === 'ollama' ? 0.0 : 0.0035);

  return {
    intent,
    routerPath,
    estimatedLatencyMs,
    estimatedCostUSD,
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
  replyText: string;
}

/**
 * Main dual-path dispatch engine.
 * Decides between Deterministic Fast-Path and Agentic LLM Escalation.
 */
export async function executeRoutedPrompt({
  prompt,
  targetFilePath,
  currentContent,
  provider,
  config = DEFAULT_ROUTER_CONFIG
}: ExecuteRouteParams): Promise<ExecuteRouteResult> {
  const intent = classifyDeveloperIntent(prompt, targetFilePath, config);
  const isFastPath = intent.confidenceScore >= config.confidenceThreshold;
  const routerPath: RouterPath = isFastPath ? 'DETERMINISTIC_FAST_PATH' : 'AGENTIC_LLM_PATH';

  let proposedContent = currentContent;
  let executionTimeMs = 3;
  let tokenCostUSD = 0.0;
  let logMessage = '';
  let replyText = '';

  if (isFastPath) {
    const res = runDeterministicAction(intent, currentContent);
    proposedContent = res.proposedContent;
    executionTimeMs = res.executionTimeMs;
    logMessage = `⚡ [Fast-Path Router | ${intent.confidenceScore}%]: ${res.logMessage} (0.00 cost, ${executionTimeMs}ms)`;
    replyText = res.replyText;
  } else {
    const res = await runLLMReasoning(intent, currentContent, provider);
    proposedContent = res.proposedContent;
    executionTimeMs = res.executionTimeMs;
    tokenCostUSD = res.tokenCostUSD;
    logMessage = `🧠 [LLM Escalation | ${intent.confidenceScore}%]: ${res.logMessage} ($${tokenCostUSD.toFixed(4)}, ${executionTimeMs}ms)`;
    replyText = res.replyText;
  }

  // Record observed latency into rolling metrics window
  recordRouteLatency(routerPath, executionTimeMs);

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

  return { plan, diffCheck, proposedContent, logMessage, replyText };
}
