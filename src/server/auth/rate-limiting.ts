import { KV_KEYS } from '@/configs/keys'
import { kv } from '@/lib/clients/kv'
import { l } from '@/lib/clients/logger/logger'
import { serializeError } from 'serialize-error'

const SIGN_UP_LIMIT_PER_WINDOW =
  Number(process.env.SIGN_UP_LIMIT_PER_WINDOW) || 1
const SIGN_UP_WINDOW_HOURS = Number(process.env.SIGN_UP_WINDOW_HOURS) || 24

/**
 * Check if an identifier (IP address) has exceeded the successful sign-up limit
 * @param identifier - IP address to check rate limiting for
 * @returns Promise<boolean> - true if rate limited, false if allowed
 */
export async function isSignUpRateLimited(
  identifier: string
): Promise<boolean> {
  try {
    const key = KV_KEYS.SIGN_UP_RATE_LIMIT(identifier)
    const attempts = await kv.get(key)

    if (!attempts) {
      return false
    }

    const attemptCount = parseInt(attempts as string, 10)
    return attemptCount >= SIGN_UP_LIMIT_PER_WINDOW
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
 * Increment the successful sign-up counter for an identifier (IP)
 * @param identifier - IP address to increment counter for
 */
export async function incrementSignUpAttempts(
  identifier: string
): Promise<void> {
  try {
    const key = KV_KEYS.SIGN_UP_RATE_LIMIT(identifier)
    const current = await kv.get(key)
    const currentCount = current ? parseInt(current as string, 10) : 0
    const newCount = currentCount + 1

    await kv.set(key, newCount.toString(), {
      ex: SIGN_UP_WINDOW_HOURS * 3600,
    })

    l.debug({
      key: 'sign_up_rate_limit:increment',
      context: {
        identifier,
        attempts: newCount,
      },
    })
  } catch (error) {
    l.error({
      key: 'sign_up_rate_limit:increment_error',
      error: serializeError(error),
      context: {
        identifier,
      },
    })
  }
}
