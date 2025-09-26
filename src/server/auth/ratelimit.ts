import 'server-cli-only'

import { Duration, Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const SIGN_UP_LIMIT_PER_WINDOW = parseInt(
  process.env.SIGN_UP_LIMIT_PER_WINDOW || '1'
)
const SIGN_UP_WINDOW_HOURS = parseInt(process.env.SIGN_UP_WINDOW_HOURS || '24')

const SIGN_UP_WINDOW: Duration = `${SIGN_UP_WINDOW_HOURS}h`

const _ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(SIGN_UP_LIMIT_PER_WINDOW, SIGN_UP_WINDOW),
})

/**
 * Checks if the sign-up rate limit has been reached for the given identifier.
 *
 * @param identifier - The unique identifier (e.g., IP address, user ID) to check rate limit for
 * @returns Promise<boolean> - Returns true if the rate limit has been reached (no more attempts allowed),
 *                            false if more attempts are available or if there was an error checking the limit
 */
export async function signUpRateLimit(identifier: string): Promise<boolean> {
  const result = await _ratelimit.limit(identifier)

  // we return:
  // - true (is rate limited)
  // - false (is not rate limited)
  return !result.success
}

/**
 * Resets the rate limit counter for the given identifier, allowing them to make new attempts.
 *
 * @param identifier - The unique identifier whose rate limit should be reset
 */
export async function resetSignUpRateLimit(identifier: string) {
  await _ratelimit.resetUsedTokens(identifier)
}
