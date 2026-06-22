import type { ReactNode } from 'react'

import { AppShell } from './app-shell'

import type { DashboardSection, DashboardWindowKey } from '../types'

export function DashboardLayout({
  activeSection,
  children,
  compactMode,
  onQueryChange,
  onSectionChange,
  onSidebarCompactChange,
  onSidebarOpenChange,
  onTimeWindowChange,
  query,
  sidebarOpen,
  timeWindow,
}: {
  activeSection: DashboardSection
  children: ReactNode
  compactMode: boolean
  onQueryChange: (query: string) => void
  onSectionChange: (section: DashboardSection) => void
  onSidebarCompactChange: (compact: boolean) => void
  onSidebarOpenChange: (open: boolean) => void
  onTimeWindowChange: (window: DashboardWindowKey) => void
  query: string
  sidebarOpen: boolean
  timeWindow: DashboardWindowKey
}) {
  return (
    <AppShell
      activeSection={activeSection}
      compactMode={compactMode}
      onQueryChange={onQueryChange}
      onSidebarCompactChange={onSidebarCompactChange}
      onSidebarOpenChange={onSidebarOpenChange}
      onSectionChange={onSectionChange}
      onTimeWindowChange={onTimeWindowChange}
      query={query}
      sidebarOpen={sidebarOpen}
      timeWindow={timeWindow}
    >
      <div className="grid min-w-0 gap-6 py-6">{children}</div>
    </AppShell>
  )
}
