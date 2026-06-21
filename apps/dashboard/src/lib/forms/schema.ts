import type { z } from 'zod'

export type SchemaValidationResult<T> =
  | {
      data: T
      fieldErrors: Record<string, string[]>
      success: true
    }
  | {
      data: undefined
      fieldErrors: Record<string, string[]>
      success: false
    }

export function validateSchema<T>(
  schema: z.ZodType<T>,
  value: unknown,
): SchemaValidationResult<T> {
  const result = schema.safeParse(value)

  if (result.success) {
    return {
      data: result.data,
      fieldErrors: {},
      success: true,
    }
  }

  return {
    data: undefined,
    fieldErrors: result.error.flatten().fieldErrors,
    success: false,
  }
}

export function createFormValidator<T>(schema: z.ZodType<T>) {
  return ({ value }: { value: unknown }) => {
    const result = validateSchema(schema, value)

    return result.success ? undefined : result.fieldErrors
  }
}
