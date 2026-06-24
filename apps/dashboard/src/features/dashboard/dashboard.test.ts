import { describe, expect, it, vi } from 'vitest'

import { queryKeys } from '#/lib/query'

import { fetchDashboardOverview } from './api'

describe('fetchDashboardOverview', () => {
  it('fetches overview data with the correct auth header', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            stats: {
              totalUsers: 10,
              totalRoles: 3,
              totalPermissions: 12,
              verifiedUsers: 4,
              unverifiedUsers: 6,
              pendingRoleGrants: 2,
            },
            verificationStatusCounts: [
              { label: 'VERIFIED', value: 4 },
              { label: 'ROLE_GRANT_PENDING', value: 2 },
            ],
            usersByRole: [
              { role: 'admin', users: 1 },
              { role: 'member', users: 9 },
            ],
            recentUsers: [
              {
                id: 'user_1',
                clerkUserId: 'clerk_1',
                email: 'user@example.com',
                displayName: 'User',
                avatarUrl: 'https://example.com/avatar.png',
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            recentVerificationEvents: [
              {
                id: 'event_1',
                type: 'COMPLETED',
                status: 'VERIFIED',
                message: 'User verified.',
                createdAt: '2026-01-02T00:00:00.000Z',
                user: {
                  id: 'user_1',
                  clerkUserId: 'clerk_1',
                  email: 'user@example.com',
                  displayName: 'User',
                  avatarUrl: 'https://example.com/avatar.png',
                  createdAt: '2026-01-01T00:00:00.000Z',
                },
              },
            ],
            system: {
              databaseReady: true,
              generatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
        }),
        {
          headers: { 'content-type': 'application/json' },
          status: 200,
        },
      ),
    )

    const result = await fetchDashboardOverview('test-token')

    expect(result.stats.totalUsers).toBe(10)
    expect(result.stats.verifiedUsers).toBe(4)
    expect(result.stats.pendingRoleGrants).toBe(2)
    expect(result.verificationStatusCounts).toHaveLength(2)
    expect(result.usersByRole).toHaveLength(2)
    expect(result.recentUsers).toHaveLength(1)
    expect(result.recentVerificationEvents).toHaveLength(1)
    expect(result.system.databaseReady).toBe(true)

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/admin/dashboard/overview',
      expect.objectContaining({
        method: 'GET',
      }),
    )

    const [, options] = fetchMock.mock.calls[0]
    const headers = (options as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token')

    fetchMock.mockRestore()
  })

  it('throws on invalid response shape', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            stats: { totalUsers: 'not-a-number' },
          },
        }),
        {
          headers: { 'content-type': 'application/json' },
          status: 200,
        },
      ),
    )

    await expect(fetchDashboardOverview('test-token')).rejects.toThrow(
      'The API returned an unexpected response.',
    )

    fetchMock.mockRestore()
  })
})

describe('query keys', () => {
  it('keeps dashboard overview query key stable', () => {
    expect(queryKeys.dashboard.overview()).toEqual(['dashboard', 'overview'])
  })
})
