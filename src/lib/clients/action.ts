import { createSafeActionClient } from 'next-safe-action'
import { checkAuthenticated } from '../utils/server'
import { z } from 'zod'
import { UnknownError } from '@/types/errors'
import { logDebug, logError, logSuccess } from './logger'

/**
 * Custom error class for action-specific errors.
 *
 * @remarks
 * This error class is used in server actions but will be serialized and sent to the client.
 * Be careful not to include sensitive information in error messages as they will be exposed to the client.
 * When thrown in a server action, the message will be visible in client-side error handling.
 */
class ActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ActionError'
  }
}

/**
 * Returns a server error to the client by throwing an ActionError.
 *
 * @param message - The error message to be sent to the client
 * @returns Never returns as it always throws an error
 *
 * @example
 * ```ts
 * if (error) {
 *   if (error.code === 'invalid_credentials') {
 *     return returnServerError('Invalid credentials')
 *   }
 *   throw error
 * }
 * ```
 *
 * @remarks
 * This function is used to return user-friendly error messages from server actions.
 * The error message will be serialized and sent to the client, so avoid including
 * sensitive information.
 */
export const returnServerError = (message: string) => {
  throw new ActionError(message)
}

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) {
      return e.message
    }

    logError('Unexpected server error:', e.message)

    return UnknownError().message
  },
  defineMetadataSchema() {
    return z
      .object({
        actionName: z.string().optional(),
        serverFunctionName: z.string().optional(),
      })
      .refine((data) => {
        if (!data.actionName && !data.serverFunctionName) {
          return 'actionName or serverFunctionName is required in definition metadata'
        }
        return true
      })
  },
  defaultValidationErrorsShape: 'flattened',
}).use(async ({ next, clientInput, metadata }) => {
  let startTime
  if (process.env.NODE_ENV === 'development') {
    startTime = performance.now()
  }

  const result = await next()

  // strip ctx from result logging to avoid leaking sensitive data (supabase client)
  const { ctx, ...rest } = result

  const actionOrFunctionName =
    metadata?.serverFunctionName || metadata?.actionName || 'Unknown action'

  const actionOrFunction = metadata.serverFunctionName
    ? 'Server Function'
    : 'Action'

  if (
    result.serverError ||
    result.validationErrors ||
    result.success === false
  ) {
    logError(`${actionOrFunction} '${actionOrFunctionName}' failed:`, {
      result: rest,
      input: clientInput,
    })
  } else if (process.env.NODE_ENV === 'development') {
    logSuccess(`${actionOrFunction} '${actionOrFunctionName}' succeeded:`, {
      result: rest,
      input: clientInput,
    })
  }

  if (process.env.NODE_ENV === 'development' && startTime) {
    const endTime = performance.now()
    logDebug(
      `${actionOrFunction} '${actionOrFunctionName}' execution took ${endTime - startTime} ms`
    )
  }

  return result
})

export const authActionClient = actionClient.use(async ({ next }) => {
  const { user, supabase } = await checkAuthenticated()

  return next({ ctx: { user, supabase } })
})
