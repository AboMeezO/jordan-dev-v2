import { describe, expect, it } from 'vitest'

import { ApiClientError } from '#/lib/api'
import { normalizeMutationError, queryKeys } from './index'

describe('query keys', () => {
  it('keeps dashboard query keys stable', () => {
    expect(queryKeys.dashboard.root).toEqual(['dashboard'])
    expect(queryKeys.dashboard.overview()).toEqual(['dashboard', 'overview'])
    expect(queryKeys.session.current()).toEqual(['session', 'current'])
  })
})

describe('mutation errors', () => {
  it('classifies auth, access, validation, and unknown errors', () => {
    expect(
      normalizeMutationError(
        new ApiClientError({ code: 'unauthorized', message: 'Sign in' }, 401),
      ).kind,
    ).toBe('auth')

    expect(
      normalizeMutationError(
        new ApiClientError({ code: 'forbidden', message: 'Forbidden' }, 403),
      ).kind,
    ).toBe('access-denied')

    expect(
      normalizeMutationError(
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
      kind: 'validation',
      message: 'Invalid',
    })
  })
})
