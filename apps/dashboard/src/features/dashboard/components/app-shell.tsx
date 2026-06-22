import type { ReactNode } from 'react'

import { DashboardShell } from './dashboard-shell'
import { DashboardSidebar } from './dashboard-sidebar'

import type { DashboardSection } from '../types'

export function AppShell({
  activeSection,
  children,
  compactMode,
  onSidebarCompactChange,
  onSidebarOpenChange,
  onSectionChange,
  sidebarOpen,
}: {
  activeSection: DashboardSection | undefined
  children: ReactNode
  compactMode: boolean
  onSidebarCompactChange: (compact: boolean) => void
  onSidebarOpenChange: (open: boolean) => void
  onSectionChange: (section: DashboardSection) => void
  sidebarOpen: boolean
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
          {children}
        </section>
      </DashboardShell>
    </main>
  )
}
