import { ApiClientError } from '#/lib/api'

export type MutationErrorKind =
  | 'access-denied'
  | 'auth'
  | 'validation'
  | 'unknown'

export type MutationErrorResult = {
  fieldErrors?: Record<string, string[]>
  kind: MutationErrorKind
  message: string
}

export function normalizeMutationError(error: unknown): MutationErrorResult {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return {
        kind: 'auth',
        message: error.message,
      }
    }

    if (error.status === 403) {
      return {
        kind: 'access-denied',
        message: error.message,
      }
    }

    if (error.apiError.fieldErrors) {
      return {
        fieldErrors: error.apiError.fieldErrors,
        kind: 'validation',
        message: error.message,
      }
    }

    return {
      kind: 'unknown',
      message: error.message,
    }
  }

  return {
    kind: 'unknown',
    message:
      error instanceof Error
        ? error.message
        : 'The dashboard action could not be completed.',
  }
}
