import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  getFirstFieldError,
  normalizeSubmitError,
  validateSchema,
} from './index'
import { ApiClientError } from '#/lib/api'

describe('form validation helpers', () => {
  it('validates Zod schemas and returns field errors', () => {
    const schema = z.object({
      name: z.string().min(2),
    })

    expect(validateSchema(schema, { name: 'Jordan Devs' })).toMatchObject({
      data: { name: 'Jordan Devs' },
      success: true,
    })

    const invalid = validateSchema(schema, { name: '' })

    expect(invalid.success).toBe(false)
    expect(getFirstFieldError(invalid.fieldErrors, 'name')).toBeTruthy()
  })

  it('normalizes submit errors from API mutation errors', () => {
    expect(
      normalizeSubmitError(
        new ApiClientError(
          {
            code: 'validation',
            fieldErrors: { name: ['Required'] },
            message: 'Invalid',
          },
          422,
        ),
      ),
    ).toEqual({
      fieldErrors: { name: ['Required'] },
      formError: undefined,
    })
  })
})
