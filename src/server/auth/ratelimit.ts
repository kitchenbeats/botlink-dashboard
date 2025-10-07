import 'server-cli-only'

import { KV_KEYS } from '@/configs/keys'
import { kv } from '@vercel/kv'

const SIGN_UP_LIMIT_PER_WINDOW = parseInt(
  process.env.SIGN_UP_LIMIT_PER_WINDOW || '1'
)
const SIGN_UP_WINDOW_HOURS = parseInt(process.env.SIGN_UP_WINDOW_HOURS || '24')
const SIGN_UP_WINDOW_SECONDS = SIGN_UP_WINDOW_HOURS * 60 * 60

/**
 * Increments the sign-up attempt counter and checks if the rate limit has been reached.
 * Uses Redis INCR with a fixed time window (TTL-based).
 *
 * @param identifier - The unique identifier (e.g., IP address) to track rate limit for
 * @returns Promise<boolean> - Returns true if the rate limit has been exceeded (no more attempts allowed),
 *                            false if more attempts are available
 */
export async function incrementAndCheckSignUpRateLimit(
  identifier: string
): Promise<boolean> {
  const key = KV_KEYS.RATE_LIMIT_SIGN_UP(identifier)

  const count = await kv.incr(key)

  // set TTL only on the first increment to establish the time window for the rate limit
  if (count === 1) {
    await kv.expire(key, SIGN_UP_WINDOW_SECONDS)
  }

  // return true if limit exceeded (rate limited)
  return count > SIGN_UP_LIMIT_PER_WINDOW
}

/**
 * Decrements the sign-up attempt counter when a sign-up fails.
 * This allows the user to retry since no account was actually created.
 *
 * @param identifier - The unique identifier whose rate limit should be decremented
 */
export async function decrementSignUpRateLimit(identifier: string) {
  const key = KV_KEYS.RATE_LIMIT_SIGN_UP(identifier)
  const currentCount = await kv.get<number>(key)

  // only decrement if key exists and count > 0
  if (currentCount && currentCount > 0) {
    await kv.decr(key)
  }
}
