import { describe, expect, it, vi } from 'vitest'

import { queryKeys } from '#/lib/query'

import { fetchSessionBootstrap } from './api'

describe('fetchSessionBootstrap', () => {
  it('validates the wrapped response and returns data', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user_123',
              clerkUserId: 'clerk_123',
              email: 'user@example.com',
              displayName: 'User',
              avatarUrl: 'https://example.com/avatar.png',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
            permissions: ['dashboard:read'],
          },
        }),
        {
          headers: { 'content-type': 'application/json' },
          status: 200,
        },
      ),
    )

    const result = await fetchSessionBootstrap('test-token')

    expect(result).toEqual({
      user: {
        id: 'user_123',
        clerkUserId: 'clerk_123',
        email: 'user@example.com',
        displayName: 'User',
        avatarUrl: 'https://example.com/avatar.png',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      permissions: ['dashboard:read'],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/me',
      expect.objectContaining({
        method: 'GET',
      }),
    )

    const [, options] = fetchMock.mock.calls[0]
    const headers = (options as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token')

    fetchMock.mockRestore()
  })

  it('throws ApiClientError when the response is invalid', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'user_123',
              clerkUserId: 'clerk_123',
            },
            permissions: 'invalid',
          },
        }),
        {
          headers: { 'content-type': 'application/json' },
          status: 200,
        },
      ),
    )

    await expect(fetchSessionBootstrap('test-token')).rejects.toThrow(
      'The API returned an unexpected response.',
    )

    fetchMock.mockRestore()
  })
})

describe('query keys', () => {
  it('keeps session current query key stable', () => {
    expect(queryKeys.session.current()).toEqual(['session', 'current'])
  })
})
