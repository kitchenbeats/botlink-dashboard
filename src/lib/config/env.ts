/**
 * Environment variable helpers
 * Centralized access to environment variables with validation
 */

export function getE2BApiKey(): string {
  const key = process.env.E2B_API_KEY;
  if (!key) {
    throw new Error('E2B_API_KEY environment variable is not set');
  }
  return key;
}

export function getE2BDomain(): string | undefined {
  return process.env.NEXT_PUBLIC_E2B_DOMAIN || process.env.E2B_DOMAIN;
}

export function getAnthropicApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return key;
}

export function getOpenAIApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return key;
}

export function getInfraApiUrl(): string {
  const url = process.env.INFRA_API_URL;
  if (!url) {
    throw new Error('INFRA_API_URL environment variable is not set');
  }
  return url;
}

export function getDefaultAnthropicModel(): string {
  // Use env var if set, otherwise use the latest Sonnet model from our config
  return process.env.DEFAULT_ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
}
