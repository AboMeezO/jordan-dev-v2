import type { CSSProperties, ReactNode } from 'react'

export function DashboardShell({
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
