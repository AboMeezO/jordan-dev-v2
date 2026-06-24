import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'

import { ApiClientError } from '#/lib/api'
import { queryKeys } from '#/lib/query'

import { fetchPermissions } from './api'

export function usePermissionsQuery() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.admin.permissions.list(),
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
      return fetchPermissions(token)
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
