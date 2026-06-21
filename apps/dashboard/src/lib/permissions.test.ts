import { describe, expect, it } from 'vitest'

import {
  can,
  canAll,
  canAny,
  normalizePermissions,
  parsePermissionClaims,
  permissions,
} from '../../../../packages/shared/src/permissions'

describe('permission helpers', () => {
  it('normalizes known permissions and drops malformed values', () => {
    expect(
      normalizePermissions([
        permissions.dashboardRead,
        permissions.dashboardRead,
        'unknown:permission',
        null,
        42,
      ]),
    ).toEqual([permissions.dashboardRead])
  })

  it('parses Clerk-style permission claims without throwing', () => {
    expect(
      parsePermissionClaims({
        metadata: { permissions: [permissions.guildRead] },
        permissions: [permissions.dashboardRead],
        publicMetadata: {
          permissions: [permissions.settingsUpdate, 'invalid:value'],
        },
      }),
    ).toEqual([
      permissions.dashboardRead,
      permissions.guildRead,
      permissions.settingsUpdate,
    ])

    expect(parsePermissionClaims(null)).toEqual([])
    expect(parsePermissionClaims({ metadata: { permissions: 'bad' } })).toEqual(
      [],
    )
  })

  it('checks single, all, and any permission requirements', () => {
    const granted = [permissions.dashboardRead, permissions.guildUpdate]

    expect(can(granted, permissions.dashboardRead)).toBe(true)
    expect(can(granted, permissions.settingsRead)).toBe(false)
    expect(canAll(granted, [permissions.dashboardRead])).toBe(true)
    expect(canAll(granted, [permissions.dashboardRead, permissions.userRead]))
      .toBe(false)
    expect(canAny(granted, [permissions.settingsRead, permissions.guildUpdate]))
      .toBe(true)
  })
})
