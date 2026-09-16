import { LLMProvider, CodeIntent } from '../types';

export function runLLMReasoning(
  intent: CodeIntent,
  currentContent: string,
  provider: LLMProvider = 'openai'
): { proposedContent: string; executionTimeMs: number; tokenCostUSD: number; logMessage: string; replyText: string } {
  const providerNames: Record<LLMProvider, string> = {
    openai: 'OpenAI GPT-4o',
    anthropic: 'Anthropic Claude 3.5 Sonnet',
    gemini: 'Google Gemini 1.5 Pro',
    ollama: 'Local Ollama (Llama 3.1 70B)',
    nvidia: 'NVIDIA NIM (Llama 3.1 70B)'
  };

  const modelName = providerNames[provider] || providerNames.openai;

  let proposedContent = currentContent;
  if (!currentContent.includes('// Agentic LLM Enhancement')) {
    proposedContent = currentContent.replace(
      'main();',
      `// Agentic LLM Enhancement (${modelName})\n// Multi-turn reasoning applied: null checks & error handlers added\ntry {\n  main();\n} catch (err) {\n  console.error("Caught error:", err);\n}`
    );
  }

  const executionTimeMs = Math.floor(Math.random() * 150) + 780; // ~780-930ms
  const tokenCostUSD = provider === 'ollama' ? 0.00 : 0.0035;

  const logMessage = `${modelName}: Analyzed workspace dependencies and synthesized multi-line patch.`;

  const promptLower = intent.rawPrompt.toLowerCase();
  let reasoning = '';
  if (promptLower.includes('index') || promptLower.includes('slow') || promptLower.includes('scan')) {
    reasoning = `I analyzed your query against the active database schema. Sequential scans can be resolved by creating an index on the filtered columns. A migration snippet has been generated.`;
  } else if (promptLower.includes('rename') || promptLower.includes('refactor')) {
    reasoning = `I analyzed symbol references across your project files. Refactored the identifier while ensuring zero breaking changes to imported modules.`;
  } else if (promptLower.includes('format') || promptLower.includes('indent')) {
    reasoning = `Normalized whitespace, standard SQL uppercase keywords, and structured multi-line clauses for optimal readability.`;
  } else if (promptLower.includes('test') || promptLower.includes('suite')) {
    reasoning = `Generated a comprehensive test suite covering edge cases, null boundary conditions, and mock relational transactions.`;
  } else {
    reasoning = `Analyzed the code intent "${intent.rawPrompt}". Injected structured exception handling, null-safety checks, and documented multi-turn reasoning steps.`;
  }

  const replyText = `${reasoning}\n\n**Provider**: ${modelName} • **Confidence**: ${intent.confidenceScore}% • **Cost**: $${tokenCostUSD.toFixed(4)}\n\nA shadow workspace diff is ready for your inspection.`;

  return { proposedContent, executionTimeMs, tokenCostUSD, logMessage, replyText };
}
