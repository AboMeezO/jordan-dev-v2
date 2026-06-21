export type ApiError = {
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
}

export class ApiClientError extends Error {
  readonly apiError: ApiError
  readonly status: number

  constructor(apiError: ApiError, status = 500) {
    super(apiError.message)
    this.name = 'ApiClientError'
    this.apiError = apiError
    this.status = status
  }
}

export function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ApiError>

  return (
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    (candidate.fieldErrors === undefined ||
      isFieldErrors(candidate.fieldErrors))
  )
}

export function normalizeApiError(value: unknown): ApiError {
  if (isApiError(value)) {
    return value
  }

  if (value instanceof Error) {
    return {
      code: 'unknown_error',
      message: value.message,
    }
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return {
      code: 'unknown_error',
      message: value,
    }
  }

  return {
    code: 'unknown_error',
    message: 'An unknown API error occurred.',
  }
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every(
    (messages) =>
      Array.isArray(messages) &&
      messages.every((message) => typeof message === 'string'),
  )
}
