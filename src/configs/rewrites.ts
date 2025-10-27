import { DomainConfig } from '@/types/rewrites.types'

// ReactWrite does not use external content rewrites
// The app serves its own dashboard directly at /dashboard
export const LANDING_PAGE_DOMAIN = ''
export const DOCS_NEXT_DOMAIN = ''

// Currently we have two locations for rewrites to happen.

// 1. Route handler catch-all rewrite config (cached on build time with revalidation)
// 2. Middleware native rewrite config (dynamic)
export type RewriteConfigType = 'route' | 'middleware'

// Route handler catch-all rewrite config
// IMPORTANT: The order of the rules is important, as the first matching rule will be used
// NOTE: ReactWrite does not serve external marketing content - disabled
export const ROUTE_REWRITE_CONFIG: DomainConfig[] = []

// Middleware native rewrite config
// NOTE: ReactWrite does not serve external docs - disabled
export const MIDDLEWARE_REWRITE_CONFIG: DomainConfig[] = []
