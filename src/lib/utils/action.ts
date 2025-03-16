import { InferSafeActionFnResult } from 'next-safe-action'

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function actionHasError<T extends Function>(
  res: InferSafeActionFnResult<T> | undefined
) {
  if (!res || res.serverError || res.validationErrors) {
    return true
  }

  return false
}
