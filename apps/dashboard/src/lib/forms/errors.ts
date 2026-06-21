import { normalizeMutationError } from '#/lib/query'

export type SubmitError = {
  fieldErrors: Record<string, string[]>
  formError?: string
}

export function getFirstFieldError(
  fieldErrors: Record<string, string[]> | undefined,
  fieldName: string,
) {
  return fieldErrors?.[fieldName]?.[0]
}

export function normalizeSubmitError(error: unknown): SubmitError {
  const mutationError = normalizeMutationError(error)

  return {
    fieldErrors: mutationError.fieldErrors ?? {},
    formError:
      mutationError.kind === 'validation' ? undefined : mutationError.message,
  }
}
