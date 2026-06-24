import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiClientError } from '#/lib/api'
import { queryKeys } from '#/lib/query'

import { assignUserRoles, fetchUser, fetchUsers, updateUser } from './api'

export function useUsersQuery(params?: {
  page?: number
  limit?: number
  search?: string
  roleId?: string
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.admin.users.list(
      params as Record<string, unknown> | undefined,
    ),
    enabled: isLoaded && Boolean(isSignedIn),
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError(
          {
            code: 'missing_clerk_token',
            message: 'The current Clerk session did not provide a token.',
          },
          401,
        )
      }
      return fetchUsers(token, params)
    },
    retry: (failureCount, error) => {
      if (
        error instanceof ApiClientError &&
        (error.status === 401 || error.status === 403)
      ) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useUserQuery(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.admin.users.detail(id),
    enabled: isLoaded && Boolean(isSignedIn) && Boolean(id),
    queryFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError(
          {
            code: 'missing_clerk_token',
            message: 'The current Clerk session did not provide a token.',
          },
          401,
        )
      }
      return fetchUser(token, id)
    },
    retry: (failureCount, error) => {
      if (
        error instanceof ApiClientError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        return false
      }
      return failureCount < 3
    },
  })
}

export function useUpdateUserMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: { displayName?: string; email?: string }
    }) => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError(
          {
            code: 'missing_clerk_token',
            message: 'The current Clerk session did not provide a token.',
          },
          401,
        )
      }
      return updateUser(token, id, data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.list() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.users.detail(variables.id),
      })
    },
    onError: () => {},
  })
}

export function useAssignUserRolesMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      roleIds,
    }: {
      id: string
      roleIds: readonly string[]
    }) => {
      const token = await getToken()
      if (!token) {
        throw new ApiClientError(
          {
            code: 'missing_clerk_token',
            message: 'The current Clerk session did not provide a token.',
          },
          401,
        )
      }
      return assignUserRoles(token, id, roleIds)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.users.detail(variables.id),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.list() })
    },
    onError: () => {},
  })
}
