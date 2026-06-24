import { useState } from 'react'

import { InlineError, LoadingState } from '#/components/app'
import { ProtectedRoute } from '#/components/auth/protected-route'
import { BackendSessionGate } from '#/features/session'

import { DashboardLayout } from './components/dashboard-layout'
import { DashboardOverview } from './components/dashboard-overview'
import { useDashboardOverviewQuery } from './queries'

import type { DashboardSection, DashboardWindowKey } from './types'

/* eslint-disable react-doctor/prefer-useReducer --
   These are independent state slices passed as individual props to
   DashboardLayout. Consolidating into a reducer would harm readability. */
export function DashboardHome() {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>('overview')
  const [compactMode, setCompactMode] = useState(false)
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [timeWindow, setTimeWindow] = useState<DashboardWindowKey>('7d')

  const overviewQuery = useDashboardOverviewQuery()

  return (
    <ProtectedRoute>
      <BackendSessionGate>
        <DashboardLayout
          activeSection={activeSection}
          compactMode={compactMode}
          onQueryChange={setQuery}
          onSectionChange={setActiveSection}
          onSidebarCompactChange={setCompactMode}
          onSidebarOpenChange={setSidebarOpen}
          onTimeWindowChange={setTimeWindow}
          query={query}
          sidebarOpen={sidebarOpen}
          timeWindow={timeWindow}
        >
          {overviewQuery.isPending ? (
            <LoadingState
              description="Fetching dashboard data..."
              title="Loading Overview"
            />
          ) : overviewQuery.isError ? (
            <InlineError
              error={overviewQuery.error}
              title="Failed to load overview"
            />
          ) : overviewQuery.data ? (
            <DashboardOverview overview={overviewQuery.data} />
          ) : null}
        </DashboardLayout>
      </BackendSessionGate>
    </ProtectedRoute>
  )
}
