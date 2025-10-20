import { registerOTel } from '@vercel/otel'

export async function register() {
  // Patch global fetch to disable caching for E2B sandbox URLs
  // This prevents "Failed to generate cache key" warnings
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const originalFetch = global.fetch

    const patchedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

      // Disable cache for E2B sandbox URLs (dynamic per-session)
      if (url.includes('.ledgai.com') || url.includes('.e2b.dev')) {
        return originalFetch(input, {
          ...init,
          cache: 'no-store',
          next: {
            revalidate: 0,
          },
        })
      }

      return originalFetch(input, init)
    }

    // Copy over static properties from originalFetch to maintain type compatibility
    Object.assign(patchedFetch, originalFetch)
    global.fetch = patchedFetch as typeof fetch
  }

  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const {
      VERCEL_ENV,
      VERCEL_URL,
      VERCEL_PROJECT_PRODUCTION_URL,
      VERCEL_BRANCH_URL,
      VERCEL_REGION,
      VERCEL_DEPLOYMENT_ID,
      VERCEL_GIT_COMMIT_SHA,
    } = process.env

    registerOTel({
      serviceName: process.env.OTEL_SERVICE_NAME || 'e2b-dashboard',
      attributes: {
        // Vercel context
        ...(VERCEL_ENV && { 'vercel.env': VERCEL_ENV }),
        ...(VERCEL_URL && { 'vercel.url': VERCEL_URL }),
        ...(VERCEL_PROJECT_PRODUCTION_URL && {
          'vercel.project_production_url': VERCEL_PROJECT_PRODUCTION_URL,
        }),
        ...(VERCEL_BRANCH_URL && { 'vercel.branch_url': VERCEL_BRANCH_URL }),
        ...(VERCEL_REGION && { 'vercel.region': VERCEL_REGION }),
        ...(VERCEL_DEPLOYMENT_ID && {
          'vercel.deployment_id': VERCEL_DEPLOYMENT_ID,
        }),
        ...(VERCEL_GIT_COMMIT_SHA && {
          'vercel.git.commit_sha': VERCEL_GIT_COMMIT_SHA,
        }),
      },
    })
  }
}
