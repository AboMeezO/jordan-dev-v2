import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

import type { SessionBootstrap } from '@jordan-devs/shared'

import { InlineError } from '#/components/app/inline-error'
import { LoadingState } from '#/components/app/loading-state'

import { useSessionBootstrapQuery } from './queries'

const BackendSessionContext = createContext<SessionBootstrap | null>(null)

export function useBackendSession(): SessionBootstrap | null {
  return useContext(BackendSessionContext)
}

export function BackendSessionGate({ children }: { children: ReactNode }) {
  const sessionQuery = useSessionBootstrapQuery()

  if (sessionQuery.isPending) {
    return (
      <LoadingState
        title="Loading session"
        description="The dashboard is loading your backend session."
      />
    )
  }

  if (sessionQuery.isError) {
    return <InlineError title="Session failed" error={sessionQuery.error} />
  }

  return (
    <BackendSessionContext.Provider value={sessionQuery.data}>
      {children}
    </BackendSessionContext.Provider>
  )
}
