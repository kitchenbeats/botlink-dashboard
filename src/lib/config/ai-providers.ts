/**
 * AI Provider Configuration
 * Supported providers and their available models
 */

export interface AIProvider {
  value: string;
  label: string;
  models: string[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    value: 'anthropic',
    label: 'Anthropic (Claude)',
    models: [
      'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
    ],
  },
  {
    value: 'openai',
    label: 'OpenAI (GPT)',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'o1-preview',
      'o1-mini',
    ],
  },
];

/**
 * Get provider by value
 */
export function getProvider(value: string): AIProvider | undefined {
  return AI_PROVIDERS.find(p => p.value === value);
}

/**
 * Get all models for a provider
 */
export function getModelsForProvider(providerValue: string): string[] {
  return getProvider(providerValue)?.models || [];
}
