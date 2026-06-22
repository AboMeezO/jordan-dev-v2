import type { ReactNode } from 'react'

import { DashboardShell } from './dashboard-shell'
import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardTopbar } from './dashboard-topbar'

import type { DashboardSection, DashboardWindowKey } from '../types'

export function AppShell({
  activeSection,
  children,
  compactMode,
  onQueryChange,
  onSidebarCompactChange,
  onSidebarOpenChange,
  onSectionChange,
  onTimeWindowChange,
  query,
  sidebarOpen,
  timeWindow,
}: {
  activeSection: DashboardSection | undefined
  children: ReactNode
  compactMode: boolean
  onQueryChange?: (query: string) => void
  onSidebarCompactChange: (compact: boolean) => void
  onSidebarOpenChange: (open: boolean) => void
  onSectionChange: (section: DashboardSection) => void
  onTimeWindowChange?: (window: DashboardWindowKey) => void
  query?: string
  sidebarOpen: boolean
  timeWindow?: DashboardWindowKey
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={() => onSidebarOpenChange(false)}
          type="button"
        />
      ) : null}

      <DashboardShell compactMode={compactMode}>
        <DashboardSidebar
          activeSection={activeSection}
          compactMode={compactMode}
          onClose={() => onSidebarOpenChange(false)}
          onSelect={(section) => {
            onSectionChange(section)
            onSidebarOpenChange(false)
          }}
          onToggleCompact={() => onSidebarCompactChange(!compactMode)}
          open={sidebarOpen}
        />

        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-8">
          <DashboardTopbar
            onOpenSidebar={() => onSidebarOpenChange(true)}
            onQueryChange={onQueryChange}
            onTimeWindowChange={onTimeWindowChange}
            query={query}
            timeWindow={timeWindow}
          />

          {children}
        </section>
      </DashboardShell>
    </main>
  )
}
