import { LLMProvider } from '../types';

export interface BYOKConfig {
  provider: LLMProvider;
  apiKey?: string;
  endpoint?: string;
  modelName: string;
}

export class BYOKClientAdapter {
  private configs: Record<LLMProvider, BYOKConfig> = {
    openai: { provider: 'openai', modelName: 'gpt-4o' },
    anthropic: { provider: 'anthropic', modelName: 'claude-3-5-sonnet-20241022' },
    gemini: { provider: 'gemini', modelName: 'gemini-1.5-pro' },
    ollama: { provider: 'ollama', endpoint: 'http://localhost:11434', modelName: 'llama3.1:70b' }
  };

  public setApiKey(provider: LLMProvider, key: string) {
    this.configs[provider].apiKey = key;
  }

  public getConfig(provider: LLMProvider): BYOKConfig {
    return this.configs[provider];
  }

  public async generateCompletion(
    provider: LLMProvider,
    prompt: string,
    context: string
  ): Promise<{ responseText: string; tokensUsed: number; latencyMs: number }> {
    const startTime = Date.now();
    const config = this.configs[provider];

    // Response generation simulation
    const responseText = `// Response generated via BYOK Adapter [${config.modelName}]\n// Parsed intent and generated code fix:\n\nexport function patchApplied() {\n  return true;\n}`;

    const latencyMs = Math.floor(Math.random() * 150) + 750;
    return {
      responseText,
      tokensUsed: 420,
      latencyMs
    };
  }
}

export const byokClient = new BYOKClientAdapter();
