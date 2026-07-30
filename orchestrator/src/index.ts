import { AgentExecutionPlan } from './types';
import { classifyDeveloperIntent, determineRouterPath } from './router/intentClassifier';
import { createShadowDiffCheck } from './verification/shadowBuffer';

export function executeAgenticRequest(
  rawPrompt: string,
  targetFile: string = 'src/index.ts',
  currentContent: string = 'function main() {\n  console.log("Hello Agentic IDE");\n}'
): AgentExecutionPlan {
  const startTime = Date.now();

  // 1. Intent Classification & Confidence Scoring
  const intent = classifyDeveloperIntent(rawPrompt, targetFile);
  const routerPath = determineRouterPath(intent.confidenceScore);

  let executionTimeMs = 0;
  let tokenCostUSD = 0;
  let proposedContent = currentContent;

  if (routerPath === 'DETERMINISTIC_FAST_PATH') {
    // Deterministic Fast Path (0ms LLM latency, $0.00 cost)
    executionTimeMs = Math.floor(Math.random() * 4) + 2; // ~2-6ms
    tokenCostUSD = 0.00;

    if (intent.actionType === 'LSP_RENAME') {
      proposedContent = currentContent.replace(/main/g, 'executeApp');
    } else if (intent.actionType === 'FORMAT_CODE') {
      proposedContent = currentContent + '\n';
    }
  } else {
    // Agentic LLM Path (~800ms latency, standard model cost)
    executionTimeMs = Math.floor(Math.random() * 150) + 780; // ~780-930ms
    tokenCostUSD = 0.0024;

    proposedContent = currentContent.replace(
      'console.log("Hello Agentic IDE");',
      'console.log("Hello Agentic IDE");\n  // Refactored by Agentic LLM Reasoning Engine\n  runHealthCheck();'
    );
  }

  // 2. Shadow Buffer & Diff Verification Check
  const diffCheck = createShadowDiffCheck(targetFile, currentContent, proposedContent);

  return {
    id: `EXEC-${Date.now().toString(36).toUpperCase()}`,
    prompt: rawPrompt,
    routerPath,
    confidenceScore: intent.confidenceScore,
    intent,
    executionTimeMs,
    tokenCostUSD,
    generatedChanges: [diffCheck],
    status: diffCheck.syntaxCheckPassed ? 'SUCCESS' : 'BLOCKED'
  };
}
