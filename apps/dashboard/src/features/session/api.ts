import type { SessionBootstrap } from '@jordan-devs/shared'
import { sessionBootstrapResponseSchema } from '@jordan-devs/shared'

import { apiRequest } from '#/lib/api'

export async function fetchSessionBootstrap(
  token: string,
): Promise<SessionBootstrap> {
  const response = await apiRequest(
    '/me',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    sessionBootstrapResponseSchema,
  )

  return response.data
}
