import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'

import { ApiClientError } from '#/lib/api'
import { queryKeys } from '#/lib/query'

import { fetchSessionBootstrap } from './api'

export function useSessionBootstrapQuery() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  return useQuery({
    queryKey: queryKeys.session.current(),
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

      return fetchSessionBootstrap(token)
    },
  })
}
