import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    env: {
      NODE_ENV: process.env.NODE_ENV || 'test',
      // Server environment variables from serverSchema
      SUPABASE_SERVICE_ROLE_KEY:
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
      BILLING_API_URL: process.env.BILLING_API_URL || 'https://billing.e2b.dev',
      COOKIE_ENCRYPTION_KEY:
        process.env.COOKIE_ENCRYPTION_KEY ||
        'test-cookie-encryption-key-32-chars-long',

      // Optional server variables
      VERCEL_URL: process.env.VERCEL_URL,
      DEVELOPMENT_INFRA_API_DOMAIN: process.env.DEVELOPMENT_INFRA_API_DOMAIN,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,

      // Client environment variables from clientSchema
      NEXT_PUBLIC_POSTHOG_KEY:
        process.env.NEXT_PUBLIC_POSTHOG_KEY || 'test-posthog-key',
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        'https://test-supabase-url.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-supabase-anon-key',
      NEXT_PUBLIC_DEFAULT_API_DOMAIN:
        process.env.NEXT_PUBLIC_DEFAULT_API_DOMAIN || 'e2b.dev',
      NEXT_PUBLIC_STRIPE_BILLING_URL:
        process.env.NEXT_PUBLIC_STRIPE_BILLING_URL ||
        'https://test-stripe-billing.example.com',
      NEXT_PUBLIC_EXPOSE_STORYBOOK:
        process.env.NEXT_PUBLIC_EXPOSE_STORYBOOK || '0',
      NEXT_PUBLIC_SCAN: process.env.NEXT_PUBLIC_SCAN || '0',
      NEXT_PUBLIC_MOCK_DATA: process.env.NEXT_PUBLIC_MOCK_DATA || '1',

      // KV variables (not in schemas but used in the app)
      KV_URL: process.env.KV_URL || 'redis://localhost:6379',
      KV_REST_API_READ_ONLY_TOKEN:
        process.env.KV_REST_API_READ_ONLY_TOKEN || 'test-read-only-token',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN || 'test-api-token',
      KV_REST_API_URL:
        process.env.KV_REST_API_URL || 'https://test-kv-api.example.com',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
