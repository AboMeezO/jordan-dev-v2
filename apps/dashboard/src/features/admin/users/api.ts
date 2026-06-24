import type { UserDetail, UserListResponse } from '@jordan-devs/shared'
import {
  updateUserResponseSchema,
  userDetailResponseSchema,
  userListResponseSchema,
  userRoleAssignmentResponseSchema,
} from '@jordan-devs/shared'

import { apiRequest } from '#/lib/api'

export async function fetchUsers(
  token: string,
  params?: { page?: number; limit?: number; search?: string; roleId?: string },
): Promise<UserListResponse['data']> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.search) searchParams.set('search', params.search)
  if (params?.roleId) searchParams.set('roleId', params.roleId)

  const qs = searchParams.toString()
  const path = `/admin/users${qs ? `?${qs}` : ''}`

  const response = await apiRequest(
    path,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    userListResponseSchema,
  )

  return response.data
}

export async function fetchUser(
  token: string,
  id: string,
): Promise<UserDetail> {
  const response = await apiRequest(
    `/admin/users/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    userDetailResponseSchema,
  )

  return response.data
}

export async function updateUser(
  token: string,
  id: string,
  data: { displayName?: string; email?: string },
): Promise<UserDetail> {
  const response = await apiRequest(
    `/admin/users/${id}`,
    {
      body: data,
      headers: { Authorization: `Bearer ${token}` },
      method: 'PATCH',
    },
    updateUserResponseSchema,
  )

  return response.data
}

export async function assignUserRoles(
  token: string,
  id: string,
  roleIds: readonly string[],
): Promise<UserDetail> {
  const response = await apiRequest(
    `/admin/users/${id}/roles`,
    {
      body: { roleIds },
      headers: { Authorization: `Bearer ${token}` },
      method: 'PUT',
    },
    userRoleAssignmentResponseSchema,
  )

  return response.data
}
