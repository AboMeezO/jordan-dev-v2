import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiClientError } from '#/lib/api'
import { queryKeys } from '#/lib/query'

import {
  assignRolePermissions,
  createRole,
  deleteRole,
  fetchRole,
  fetchRoles,
  updateRole,
} from './api'

export function useRolesQuery() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.admin.roles.list(),
    enabled: isLoaded && Boolean(isSignedIn),
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError({
          code: 'missing_clerk_token',
          message: 'The current Clerk session did not provide a token.',
        }, 401)
      }
      return fetchRoles(token)
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useRoleQuery(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.admin.roles.detail(id),
    enabled: isLoaded && Boolean(isSignedIn) && Boolean(id),
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError({
          code: 'missing_clerk_token',
          message: 'The current Clerk session did not provide a token.',
        }, 401)
      }
      return fetchRole(token, id)
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiClientError && (error.status === 401 || error.status === 403 || error.status === 404)) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useCreateRoleMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; permissions?: readonly string[] }) => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError({
          code: 'missing_clerk_token',
          message: 'The current Clerk session did not provide a token.',
        }, 401)
      }
      return createRole(token, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.list() })
    },
    onError: () => {},
  })
}

export function useUpdateRoleMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; description?: string | null } }) => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError({
          code: 'missing_clerk_token',
          message: 'The current Clerk session did not provide a token.',
        }, 401)
      }
      return updateRole(token, id, data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.detail(variables.id) })
    },
    onError: () => {},
  })
}

export function useDeleteRoleMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError({
          code: 'missing_clerk_token',
          message: 'The current Clerk session did not provide a token.',
        }, 401)
      }
      return deleteRole(token, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.list() })
    },
    onError: () => {},
  })
}

export function useAssignRolePermissionsMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, permissionIds }: { id: string; permissionIds: readonly string[] }) => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError({
          code: 'missing_clerk_token',
          message: 'The current Clerk session did not provide a token.',
        }, 401)
      }
      return assignRolePermissions(token, id, permissionIds)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.roles.list() })
    },
    onError: () => {},
  })
}
