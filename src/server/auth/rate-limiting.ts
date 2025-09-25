import { l } from '@/lib/clients/logger/logger'
import { Duration } from '@/lib/utils/duration'
import { applyRateLimit, checkRateLimit } from '@/lib/utils/ratelimit'
import { serializeError } from 'serialize-error'

// helper to parse and validate positive numbers
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

// actual sign-ups configuration (limit account creation)
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

// convert to duration format
const SIGN_UP_WINDOW: Duration = `${SIGN_UP_WINDOW_HOURS}h`

export async function applySignUpRateLimit(
  identifier: string
): Promise<boolean> {
  try {
    const result = await applyRateLimit(
      `signup:${identifier}`,
      SIGN_UP_LIMIT_PER_WINDOW,
      SIGN_UP_WINDOW
    )

    if (!result) {
      return false
    }

    return !result.success
  } catch (error) {
    l.error({
      key: 'sign_up_rate_limit:check_error',
      error: serializeError(error),
    })
    // on error, allow the request to proceed
    return false
  }
}

export async function checkSignUpRateLimit(
  identifier: string
): Promise<boolean> {
  try {
    const result = await checkRateLimit(
      `signup:${identifier}`,
      SIGN_UP_LIMIT_PER_WINDOW,
      SIGN_UP_WINDOW
    )

    if (!result) {
      return false
    }

    return !result.success
  } catch (error) {
    l.error({
      key: 'sign_up_rate_limit:check_error',
      error: serializeError(error),
    })
    // on error, allow the request to proceed
    return false
  }
}
