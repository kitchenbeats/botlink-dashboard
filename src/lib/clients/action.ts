import { createSafeActionClient } from 'next-safe-action'
import { checkAuthenticated } from '../utils/server'
import { z } from 'zod'
import { UnknownError } from '@/types/errors'
import { logDebug, logError, logSuccess } from './logger'

const actionClient = createSafeActionClient({
  handleServerError(e) {
    logError('Unexpected server error:', e.message)

    return UnknownError().message
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    })
  },
  defaultValidationErrorsShape: 'flattened',
}).use(async ({ next, clientInput, metadata }) => {
  let startTime
  if (process.env.NODE_ENV === 'development') {
    startTime = performance.now()
  }

  const result = await next()

  // strip ctx from result logging
  const { ctx, ...rest } = result

  const actionName = metadata?.actionName || 'Unknown action'

  if (result.serverError || result.success === false) {
    logError(`Action '${actionName}' failed:`, {
      result: rest,
      input: clientInput,
    })
  } else if (process.env.NODE_ENV === 'development') {
    logSuccess(`Action '${actionName}' succeeded:`, {
      result: rest,
      input: clientInput,
    })
  }

  if (process.env.NODE_ENV === 'development' && startTime) {
    const endTime = performance.now()
    logDebug(`Action '${actionName}' execution took ${endTime - startTime} ms`)
  }

  return result
})

export const authActionClient = actionClient.use(async ({ next }) => {
  const { user, supabase } = await checkAuthenticated()

  return next({ ctx: { user, supabase } })
})
