import type { CSSProperties, ReactNode } from 'react'

import { DashboardSidebar } from './dashboard-sidebar'
import { DashboardTopbar } from './dashboard-topbar'

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
    <main className="min-h-screen bg-background text-foreground">
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={() => onSidebarOpenChange(false)}
          type="button"
        />
      ) : null}

      <DashboardShell
        compactMode={compactMode}
        onSidebarCompactChange={onSidebarCompactChange}
      >
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

          <div className="grid min-w-0 gap-6 py-6">{children}</div>
        </section>
      </DashboardShell>
    </main>
  )
}

function DashboardShell({
  children,
  compactMode,
}: {
  children: ReactNode
  compactMode: boolean
}) {
  return (
    <div
      className="dashboard-shell grid min-h-screen w-full"
      style={
        {
          '--sidebar-width': compactMode ? '72px' : '280px',
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
