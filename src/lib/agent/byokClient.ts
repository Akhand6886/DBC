import { LLMProvider } from '../types';

export interface BYOKConfig {
  provider: LLMProvider;
  apiKey?: string;
  endpoint?: string;
  modelName: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
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

  public hasApiKey(provider: LLMProvider): boolean {
    return !!this.configs[provider].apiKey;
  }

  /**
   * Generate a completion using real HTTP fetch() calls to the selected LLM provider.
   * Falls back to simulation if no API key is configured.
   */
  public async generateCompletion(
    provider: LLMProvider,
    prompt: string,
    context: string
  ): Promise<{ responseText: string; tokensUsed: number; latencyMs: number }> {
    const config = this.configs[provider];
    const startTime = Date.now();

    // If no API key is set, fall back to simulation mode
    if (!config.apiKey && provider !== 'ollama') {
      return this.simulateResponse(config, startTime);
    }

    try {
      switch (provider) {
        case 'openai':
          return await this.callOpenAI(config, prompt, context, startTime);
        case 'anthropic':
          return await this.callAnthropic(config, prompt, context, startTime);
        case 'gemini':
          return await this.callGemini(config, prompt, context, startTime);
        case 'ollama':
          return await this.callOllama(config, prompt, context, startTime);
        default:
          return this.simulateResponse(config, startTime);
      }
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      return {
        responseText: `// [BYOK Error]: ${error.message || 'Network request failed'}\n// Provider: ${provider}\n// Falling back to simulation mode.`,
        tokensUsed: 0,
        latencyMs
      };
    }
  }

  // ─── OpenAI Chat Completions API ───────────────────────────────────
  private async callOpenAI(
    config: BYOKConfig, prompt: string, context: string, startTime: number
  ): Promise<{ responseText: string; tokensUsed: number; latencyMs: number }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          { role: 'system', content: 'You are an expert coding assistant inside an Agentic AI IDE. Return only code changes as a unified diff or complete replacement. Be concise.' },
          { role: 'user', content: `Context file:\n\`\`\`\n${context}\n\`\`\`\n\nRequest: ${prompt}` }
        ],
        temperature: 0.2,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`OpenAI API ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    return {
      responseText: data.choices?.[0]?.message?.content || '// No response generated.',
      tokensUsed: data.usage?.total_tokens || 0,
      latencyMs
    };
  }

  // ─── Anthropic Messages API ────────────────────────────────────────
  private async callAnthropic(
    config: BYOKConfig, prompt: string, context: string, startTime: number
  ): Promise<{ responseText: string; tokensUsed: number; latencyMs: number }> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.modelName,
        max_tokens: 2048,
        system: 'You are an expert coding assistant inside an Agentic AI IDE. Return only code changes as a unified diff or complete replacement. Be concise.',
        messages: [
          { role: 'user', content: `Context file:\n\`\`\`\n${context}\n\`\`\`\n\nRequest: ${prompt}` }
        ]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Anthropic API ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    const textContent = data.content?.find((c: any) => c.type === 'text');
    return {
      responseText: textContent?.text || '// No response generated.',
      tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      latencyMs
    };
  }

  // ─── Google Gemini GenerateContent API ─────────────────────────────
  private async callGemini(
    config: BYOKConfig, prompt: string, context: string, startTime: number
  ): Promise<{ responseText: string; tokensUsed: number; latencyMs: number }> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent?key=${config.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert coding assistant inside an Agentic AI IDE. Return only code changes.\n\nContext file:\n\`\`\`\n${context}\n\`\`\`\n\nRequest: ${prompt}`
          }]
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return {
      responseText: textContent || '// No response generated.',
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      latencyMs
    };
  }

  // ─── Ollama Local REST API ─────────────────────────────────────────
  private async callOllama(
    config: BYOKConfig, prompt: string, context: string, startTime: number
  ): Promise<{ responseText: string; tokensUsed: number; latencyMs: number }> {
    const endpoint = config.endpoint || 'http://localhost:11434';
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.modelName,
        prompt: `You are an expert coding assistant. Return only code changes.\n\nContext:\n\`\`\`\n${context}\n\`\`\`\n\nRequest: ${prompt}`,
        stream: false
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Ollama API ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    return {
      responseText: data.response || '// No response generated.',
      tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      latencyMs
    };
  }

  // ─── Simulation Fallback (No API Key) ──────────────────────────────
  private simulateResponse(
    config: BYOKConfig, startTime: number
  ): { responseText: string; tokensUsed: number; latencyMs: number } {
    const responseText = `// [Simulation Mode] No API key configured for ${config.provider}.\n// To enable real LLM responses, click the 🔑 Key button in Mission Control\n// and enter your ${config.provider.toUpperCase()} API key.\n\nexport function patchApplied() {\n  return true;\n}`;

    return {
      responseText,
      tokensUsed: 420,
      latencyMs: Math.floor(Math.random() * 150) + 750
    };
  }
}

export const byokClient = new BYOKClientAdapter();
