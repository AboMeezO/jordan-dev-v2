import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo, useState } from 'react'

import { ProtectedRoute } from '#/components/auth/protected-route'

import { moduleColumns, modules, trafficByWindow } from './data'
import { DashboardLayout } from './components/dashboard-layout'
import { DashboardOverview } from './components/dashboard-overview'

import type { DashboardSection, DashboardWindowKey } from './types'

export function DashboardHome() {
  const [activeSection, setActiveSection] =
    useState<DashboardSection>('overview')
  const [alertsOnly, setAlertsOnly] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [threshold, setThreshold] = useState([72])
  const [timeWindow, setTimeWindow] = useState<DashboardWindowKey>('7d')

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return modules.filter((module) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        module.module.toLowerCase().includes(normalizedQuery) ||
        module.owner.toLowerCase().includes(normalizedQuery)

      return matchesQuery && (!alertsOnly || module.status !== 'online')
    })
  }, [alertsOnly, query])

  const table = useReactTable({
    columns: moduleColumns,
    data: filteredModules,
    getCoreRowModel: getCoreRowModel(),
  })

  const traffic = trafficByWindow[timeWindow]
  const latestTraffic = traffic.at(-1)?.requests ?? 0
  const totalRequests = filteredModules.reduce(
    (sum, module) => sum + module.requests,
    0,
  )

  return (
    <ProtectedRoute>
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
        <DashboardOverview
          alertsOnly={alertsOnly}
          compactMode={compactMode}
          filteredModules={filteredModules}
          latestTraffic={latestTraffic}
          onAlertsOnlyChange={setAlertsOnly}
          onCompactModeChange={setCompactMode}
          onThresholdChange={setThreshold}
          table={table}
          threshold={threshold}
          timeWindow={timeWindow}
          totalRequests={totalRequests}
          traffic={traffic}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
