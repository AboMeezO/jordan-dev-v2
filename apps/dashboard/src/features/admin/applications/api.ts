import type { ApplicationDetail, ApplicationList } from '@jordan-devs/shared'
import {
  applicationDetailResponseSchema,
  applicationListResponseSchema,
} from '@jordan-devs/shared'

import { apiRequest } from '#/lib/api'

export async function fetchSubmittedApplications(
  token: string,
  guildId: string,
): Promise<ApplicationList> {
  const response = await apiRequest(
    `/membership-applications/dashboard/guild/${guildId}/submitted`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    applicationListResponseSchema,
  )

  return response.data
}

export async function fetchApplicationDetail(
  token: string,
  id: string,
): Promise<ApplicationDetail> {
  const response = await apiRequest(
    `/membership-applications/dashboard/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    applicationDetailResponseSchema,
  )

  return response.data
}

export async function approveApplication(
  token: string,
  id: string,
): Promise<ApplicationDetail> {
  const response = await apiRequest(
    `/membership-applications/dashboard/${id}/approve`,
    {
      headers: { Authorization: `Bearer ${token}` },
      method: 'POST',
    },
    applicationDetailResponseSchema,
  )

  return response.data
}

export async function rejectApplication(
  token: string,
  id: string,
  reason: string,
): Promise<ApplicationDetail> {
  const response = await apiRequest(
    `/membership-applications/dashboard/${id}/reject`,
    {
      body: { applicationId: id, reason },
      headers: { Authorization: `Bearer ${token}` },
      method: 'POST',
    },
    applicationDetailResponseSchema,
  )

  return response.data
}
