import { l } from '@/lib/clients/logger/logger'
import { Duration } from '@/lib/utils/duration'
import ratelimit from '@/lib/utils/ratelimit'
import { serializeError } from 'serialize-error'

// Helper function to parse and validate positive numbers
function parsePositiveNumber(
  value: string | undefined,
  defaultValue: number,
  name: string
): number {
  if (!value) return defaultValue

  const parsed = Number(value)
  if (isNaN(parsed) || parsed <= 0) {
    l.warn({
      key: 'rate_limit_config:invalid_value',
      context: {
        variable: name,
        value,
        defaultUsed: defaultValue,
      },
    })
    return defaultValue
  }

  return parsed
}

// Configuration for sign-up attempts (prevent spam)
const SIGN_UP_ATTEMPTS_LIMIT_PER_WINDOW = parsePositiveNumber(
  process.env.SIGN_UP_ATTEMPTS_LIMIT_PER_WINDOW as string | undefined,
  10,
  'SIGN_UP_ATTEMPTS_LIMIT_PER_WINDOW'
)
const SIGN_UP_ATTEMPTS_WINDOW_HOURS = parsePositiveNumber(
  process.env.SIGN_UP_ATTEMPTS_WINDOW_HOURS as string | undefined,
  1,
  'SIGN_UP_ATTEMPTS_WINDOW_HOURS'
)

// Configuration for actual sign-ups (limit account creation)
const SIGN_UP_LIMIT_PER_WINDOW = parsePositiveNumber(
  process.env.SIGN_UP_LIMIT_PER_WINDOW as string | undefined,
  1,
  'SIGN_UP_LIMIT_PER_WINDOW'
)
const SIGN_UP_WINDOW_HOURS = parsePositiveNumber(
  process.env.SIGN_UP_WINDOW_HOURS as string | undefined,
  24,
  'SIGN_UP_WINDOW_HOURS'
)

// Convert to Duration format
const SIGN_UP_ATTEMPTS_WINDOW: Duration = `${SIGN_UP_ATTEMPTS_WINDOW_HOURS}h`
const SIGN_UP_WINDOW: Duration = `${SIGN_UP_WINDOW_HOURS}h`

/**
 * Check if an identifier (IP address) has exceeded the sign-up attempts limit
 * This prevents spam/abuse of the sign-up endpoint
 * @param identifier - IP address to check rate limiting for
 * @returns Promise<boolean> - true if rate limited, false if allowed
 */
export async function isSignUpAttemptRateLimited(
  identifier: string
): Promise<boolean> {
  try {
    const result = await ratelimit(
      `signup-attempt:${identifier}`,
      SIGN_UP_ATTEMPTS_LIMIT_PER_WINDOW,
      SIGN_UP_ATTEMPTS_WINDOW
    )

    // If rate limiting is not configured, allow the request
    if (!result) {
      return false
    }

    const isRateLimited = !result.success

    if (isRateLimited) {
      l.debug({
        key: 'sign_up_attempt_rate_limit:blocked',
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
      key: 'sign_up_attempt_rate_limit:check_error',
      error: serializeError(error),
      context: {
        identifier,
      },
    })
    // on error, allow the request to proceed
    return false
  }
}

/**
 * Check if an identifier (IP address) has exceeded the actual sign-up limit
 * This limits the number of confirmed accounts created per time window
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

/**
 * Log rate limit configuration on startup (for debugging)
 */
export function logRateLimitConfiguration() {
  l.info({
    key: 'rate_limit_configuration',
    context: {
      sign_up_attempts: {
        limit: SIGN_UP_ATTEMPTS_LIMIT_PER_WINDOW,
        window: SIGN_UP_ATTEMPTS_WINDOW,
      },
      sign_ups: {
        limit: SIGN_UP_LIMIT_PER_WINDOW,
        window: SIGN_UP_WINDOW,
      },
    },
  })
}
