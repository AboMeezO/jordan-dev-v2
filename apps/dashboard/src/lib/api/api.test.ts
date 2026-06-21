import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
  ApiClientError,
  apiRequest,
  isApiError,
  normalizeApiError,
  parseJsonResponse,
} from './index'

describe('api errors', () => {
  it('recognizes and normalizes API errors', () => {
    const apiError = {
      code: 'validation_error',
      fieldErrors: { name: ['Required'] },
      message: 'Invalid input',
    }

    expect(isApiError(apiError)).toBe(true)
    expect(normalizeApiError(apiError)).toBe(apiError)
    expect(normalizeApiError(new Error('Failed'))).toEqual({
      code: 'unknown_error',
      message: 'Failed',
    })
  })
})

describe('parseJsonResponse', () => {
  it('handles empty and non-json responses safely', async () => {
    await expect(
      parseJsonResponse(new Response(null, { status: 204 })),
    ).resolves.toBeUndefined()

    await expect(
      parseJsonResponse(
        new Response('plain text', {
          headers: { 'content-type': 'text/plain' },
          status: 200,
        }),
      ),
    ).resolves.toBe('plain text')
  })
})

describe('apiRequest', () => {
  it('parses successful JSON responses with Zod', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 1, name: 'Jordan Devs' }), {
          headers: { 'content-type': 'application/json' },
          status: 200,
        }),
      )

    await expect(
      apiRequest(
        '/guilds/1',
        undefined,
        z.object({ id: z.number(), name: z.string() }),
      ),
    ).resolves.toEqual({ id: 1, name: 'Jordan Devs' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/guilds/1',
      expect.objectContaining({
        credentials: 'include',
        method: 'GET',
      }),
    )
    fetchMock.mockRestore()
  })

  it('throws ApiClientError for failed HTTP statuses', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'forbidden',
          message: 'Forbidden',
        }),
        {
          headers: { 'content-type': 'application/json' },
          status: 403,
        },
      ),
    )

    await expect(apiRequest('/forbidden')).rejects.toBeInstanceOf(
      ApiClientError,
    )

    fetchMock.mockRestore()
  })
})
