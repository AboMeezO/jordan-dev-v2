import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiClientError } from '#/lib/api'
import { queryKeys } from '#/lib/query'

import {
  approveApplication,
  fetchApplicationDetail,
  fetchSubmittedApplications,
  rejectApplication,
} from './api'

export function useSubmittedApplicationsQuery(guildId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.admin.applications.list(guildId),
    enabled: isLoaded && Boolean(isSignedIn) && Boolean(guildId),
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
      return fetchSubmittedApplications(token, guildId)
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

export function useApplicationDetailQuery(id: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.admin.applications.detail(id),
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
      return fetchApplicationDetail(token, id)
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

export function useApproveApplicationMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
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
      return approveApplication(token, id)
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.applications.detail(id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.applications.root(),
      })
    },
  })
}

export function useRejectApplicationMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
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
      return rejectApplication(token, id, reason)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.applications.detail(variables.id),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.applications.root(),
      })
    },
  })
}
