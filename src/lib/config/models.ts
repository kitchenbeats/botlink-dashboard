/**
 * AI Model configuration and metadata
 */

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai';
  maxTokens: number;
  contextWindow: number;
}

export const MODELS: Record<string, ModelInfo> = {
  // Anthropic models
  'claude-sonnet-4-5': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    maxTokens: 8192,
    contextWindow: 200000,
  },
  'claude-sonnet-4-5-20250929': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    maxTokens: 8192,
    contextWindow: 200000,
  },
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    maxTokens: 8192,
    contextWindow: 200000,
  },
  'claude-3-opus-20240229': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    maxTokens: 4096,
    contextWindow: 200000,
  },

  // OpenAI models
  'gpt-4-turbo-preview': {
    id: 'gpt-4-turbo-preview',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    maxTokens: 4096,
    contextWindow: 128000,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    maxTokens: 4096,
    contextWindow: 128000,
  },
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    maxTokens: 4096,
    contextWindow: 8192,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    maxTokens: 4096,
    contextWindow: 16384,
  },
};

export function getModelById(modelId: string): ModelInfo | undefined {
  return MODELS[modelId];
}

export function getAnthropicModels(): ModelInfo[] {
  return Object.values(MODELS).filter((m) => m.provider === 'anthropic');
}

export function getOpenAIModels(): ModelInfo[] {
  return Object.values(MODELS).filter((m) => m.provider === 'openai');
}
