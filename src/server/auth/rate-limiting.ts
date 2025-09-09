import { l } from '@/lib/clients/logger/logger'
import { Duration } from '@/lib/utils/duration'
import ratelimit from '@/lib/utils/ratelimit'
import { serializeError } from 'serialize-error'

// Configuration from environment variables
const SIGN_UP_LIMIT_PER_WINDOW =
  Number(process.env.SIGN_UP_LIMIT_PER_WINDOW) || 1
const SIGN_UP_WINDOW_HOURS = Number(process.env.SIGN_UP_WINDOW_HOURS) || 24

// Convert hours to Duration format
const SIGN_UP_WINDOW: Duration = `${SIGN_UP_WINDOW_HOURS}h`

/**
 * Check if an identifier (IP address) has exceeded the successful sign-up limit
 * @param identifier - IP address to check rate limiting for
 * @returns Promise<boolean> - true if rate limited, false if allowed
 */
export async function isSignUpRateLimited(
  identifier: string
): Promise<boolean> {
  try {
    const result = await ratelimit(
      `signup:${identifier}`,
      SIGN_UP_LIMIT_PER_WINDOW,
      SIGN_UP_WINDOW
    )

    // If rate limiting is not configured, allow the request
    if (!result) {
      return false
    }

    const isRateLimited = !result.success

    if (isRateLimited) {
      l.debug({
        key: 'sign_up_rate_limit:blocked',
        context: {
          identifier,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        },
      })
    }

    return isRateLimited
  } catch (error) {
    l.error({
      key: 'sign_up_rate_limit:check_error',
      error: serializeError(error),
      context: {
        identifier,
      },
    })
    // on error, allow the request to proceed
    return false
  }
}
