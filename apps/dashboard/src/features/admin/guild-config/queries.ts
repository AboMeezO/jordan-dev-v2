import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiClientError } from '#/lib/api'
import { queryKeys } from '#/lib/query'

import { fetchGuildConfig, upsertGuildConfig } from './api'

export function useGuildConfigQuery(guildId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.admin.guildConfig.detail(guildId),
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
      return fetchGuildConfig(token, guildId)
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

export function useUpsertGuildConfigMutation() {
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      guildId: string
      unverifiedRoleId: string
      verifiedRoleId: string
      reviewerRoleId: string
      verificationChannelId: string
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
      return upsertGuildConfig(token, data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.guildConfig.detail(variables.guildId),
      })
    },
  })
}
