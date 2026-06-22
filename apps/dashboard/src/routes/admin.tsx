import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

import { ProtectedRoute } from '#/components/auth/protected-route'
import { BackendSessionGate } from '#/features/session'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <ProtectedRoute>
      <BackendSessionGate>
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b border-(--nd-border) px-6 py-3">
            <nav className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.14em]">
              <Link
                to="/"
                className="text-(--nd-text-disabled) hover:text-(--nd-text-primary)"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/users"
                className="text-(--nd-text-disabled) hover:text-(--nd-text-primary)"
                activeProps={{ className: 'text-(--nd-text-display)' }}
              >
                Users
              </Link>
              <Link
                to="/admin/roles"
                className="text-(--nd-text-disabled) hover:text-(--nd-text-primary)"
                activeProps={{ className: 'text-(--nd-text-display)' }}
              >
                Roles
              </Link>
              <Link
                to="/admin/permissions"
                className="text-(--nd-text-disabled) hover:text-(--nd-text-primary)"
                activeProps={{ className: 'text-(--nd-text-display)' }}
              >
                Permissions
              </Link>
            </nav>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">
            <Outlet />
          </main>
        </div>
      </BackendSessionGate>
    </ProtectedRoute>
  )
}
