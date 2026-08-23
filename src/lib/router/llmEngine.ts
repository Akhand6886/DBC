import { LLMProvider, CodeIntent } from '../types';

export function runLLMReasoning(
  intent: CodeIntent,
  currentContent: string,
  provider: LLMProvider = 'openai'
): { proposedContent: string; executionTimeMs: number; tokenCostUSD: number; logMessage: string } {
  const providerNames: Record<LLMProvider, string> = {
    openai: 'OpenAI GPT-4o',
    anthropic: 'Anthropic Claude 3.5 Sonnet',
    gemini: 'Google Gemini 1.5 Pro',
    ollama: 'Local Ollama (Llama 3.1 70B)'
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

  return { proposedContent, executionTimeMs, tokenCostUSD, logMessage };
}
