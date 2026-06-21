import type { DashboardOverview } from '@jordan-devs/shared'
import { dashboardOverviewResponseSchema } from '@jordan-devs/shared'

import { apiRequest } from '#/lib/api'

export async function fetchDashboardOverview(
  token: string,
): Promise<DashboardOverview> {
  const response = await apiRequest(
    '/admin/dashboard/overview',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    dashboardOverviewResponseSchema,
  )

  return response.data
}
