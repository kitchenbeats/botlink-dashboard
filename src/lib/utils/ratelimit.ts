import { kv } from '@/lib/clients/kv'
import { Ratelimit } from '@upstash/ratelimit'
import { Duration } from './duration'

export interface RateLimitResult {
  success: boolean
  limit: number
  reset: number
  remaining: number
}

/**
 * Apply rate limiting to a key using @upstash/ratelimit
 * @param key - Unique identifier for the rate limit (e.g., user ID, IP address)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param window - Time window for the rate limit (e.g., '1h', '24h', '1d')
 * @returns RateLimitResult with success status and rate limit metadata
 */
export default async function ratelimit(
  key: string,
  maxRequests: number,
  window: Duration
): Promise<RateLimitResult | null> {
  // Only apply rate limiting if KV is configured
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(maxRequests, window),
    })

    // the package applie "@upstash/ratelimit" prefixed to the key
    const result = await ratelimit.limit(key)

    return {
      success: result.success,
      limit: result.limit,
      reset: result.reset,
      remaining: result.remaining,
    }
  }

  // If rate limiting is not configured, allow all requests
  return null
}
