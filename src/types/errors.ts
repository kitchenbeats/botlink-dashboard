// Types

export type E2BErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'INVALID_PARAMETERS'
  | 'INTERNAL_SERVER_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN'
  | string

export class E2BError extends Error {
  public code: E2BErrorCode

  constructor(code: E2BErrorCode, message: string) {
    super(message)
    this.name = 'E2BError'
    this.code = code
  }
}

// Errors

export const UnauthenticatedError = () =>
  new E2BError('UNAUTHENTICATED', 'User not authenticated')

export const UnauthorizedError = (message: string) =>
  new E2BError('UNAUTHORIZED', message)

export const InvalidApiKeyError = (message: string) =>
  new E2BError('INVALID_API_KEY', message)

export const InvalidParametersError = (message: string) =>
  new E2BError('INVALID_PARAMETERS', message)

export const ApiError = (message: string) => new E2BError('API_ERROR', message)

export const UnknownError = (message?: string) =>
  new E2BError(
    'UNKNOWN',
    message ??
      'An Unexpected Error Occurred, please try again. If the problem persists, please contact support.'
  )
