import type { RoleDetail, RoleListResponse } from '@jordan-devs/shared'
import {
  createRoleResponseSchema,
  deleteRoleResponseSchema,
  roleDetailResponseSchema,
  roleListResponseSchema,
  rolePermissionAssignmentResponseSchema,
  updateRoleResponseSchema,
} from '@jordan-devs/shared'

import { apiRequest } from '#/lib/api'

export async function fetchRoles(
  token: string,
): Promise<RoleListResponse['data']> {
  const response = await apiRequest(
    '/admin/roles',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    roleListResponseSchema,
  )

  return response.data
}

export async function fetchRole(
  token: string,
  id: string,
): Promise<RoleDetail> {
  const response = await apiRequest(
    `/admin/roles/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
    roleDetailResponseSchema,
  )

  return response.data
}

export async function createRole(
  token: string,
  data: { name: string; description?: string; permissions?: readonly string[] },
): Promise<RoleDetail> {
  const response = await apiRequest(
    '/admin/roles',
    {
      body: data,
      headers: { Authorization: `Bearer ${token}` },
      method: 'POST',
    },
    createRoleResponseSchema,
  )

  return response.data
}

export async function updateRole(
  token: string,
  id: string,
  data: { name?: string; description?: string | null },
): Promise<RoleDetail> {
  const response = await apiRequest(
    `/admin/roles/${id}`,
    {
      body: data,
      headers: { Authorization: `Bearer ${token}` },
      method: 'PATCH',
    },
    updateRoleResponseSchema,
  )

  return response.data
}

export async function deleteRole(
  token: string,
  id: string,
): Promise<{ deleted: true }> {
  const response = await apiRequest(
    `/admin/roles/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      method: 'DELETE',
    },
    deleteRoleResponseSchema,
  )

  return response.data
}

export async function assignRolePermissions(
  token: string,
  id: string,
  permissionIds: readonly string[],
): Promise<RoleDetail> {
  const response = await apiRequest(
    `/admin/roles/${id}/permissions`,
    {
      body: { permissionIds },
      headers: { Authorization: `Bearer ${token}` },
      method: 'PUT',
    },
    rolePermissionAssignmentResponseSchema,
  )

  return response.data
}
