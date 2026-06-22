import type { PermissionsListResponse } from '@jordan-devs/shared'
import { permissionsListResponseSchema } from '@jordan-devs/shared'

import { apiRequest } from '#/lib/api'

export async function fetchPermissions(token: string): Promise<PermissionsListResponse['data']> {
  const response = await apiRequest(
    '/admin/permissions',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    permissionsListResponseSchema,
  )

  return response.data
}
