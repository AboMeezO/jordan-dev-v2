import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { ProtectedRoute } from '#/components/auth/protected-route'
import { AppShell } from '#/features/dashboard/components/app-shell'
import { BackendSessionGate } from '#/features/session'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const navigate = useNavigate()

  return (
    <ProtectedRoute>
      <BackendSessionGate>
        <AppShell
          activeSection={undefined}
          compactMode={compactMode}
          onSectionChange={() => {
            navigate({ to: '/' })
            setSidebarOpen(false)
          }}
          onSidebarCompactChange={setCompactMode}
          onSidebarOpenChange={setSidebarOpen}
          sidebarOpen={sidebarOpen}
        >
          <Outlet />
        </AppShell>
      </BackendSessionGate>
    </ProtectedRoute>
  )
}
