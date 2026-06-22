import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PermissionGate } from '#/components/auth/permission-gate'
import { InlineError, LoadingState } from '#/components/app'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { useUsersQuery } from '#/features/admin'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const usersQuery = useUsersQuery({ page, limit: 20, search: search || undefined })

  return (
    <PermissionGate permission="user:read" fallback={<p className="nd-label">You do not have permission to view users.</p>}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-xl tracking-[-0.05em] text-(--nd-text-display)">Users</h1>
        </div>

        <Input
          className="max-w-sm font-mono text-xs"
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search by name or email..."
          value={search}
        />

        {usersQuery.isPending ? (
          <LoadingState description="Fetching users..." title="Loading" />
        ) : usersQuery.isError ? (
          <InlineError error={usersQuery.error} title="Failed to load users" />
        ) : usersQuery.data ? (
          <>
            <div className="nd-panel overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-(--nd-border) font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-text-muted)">
                    <th className="px-4 py-3 font-normal">Name</th>
                    <th className="px-4 py-3 font-normal">Email</th>
                    <th className="px-4 py-3 font-normal">Roles</th>
                    <th className="px-4 py-3 font-normal">Joined</th>
                    <th className="px-4 py-3 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data.users.map((user) => (
                    <tr key={user.id} className="border-b border-(--nd-border) last:border-0">
                      <td className="px-4 py-3 text-(--nd-text-primary)">
                        {user.displayName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-(--nd-text-muted)">
                        {user.email ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length === 0 ? (
                            <span className="text-xs text-(--nd-text-disabled)">None</span>
                          ) : (
                            user.roles.map((role) => (
                              <span key={role.id} className="rounded-full border border-(--nd-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]">
                                {role.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-(--nd-text-muted)">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to="/admin/users/$id"
                          params={{ id: user.id }}
                          className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-accent) hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between font-mono text-xs text-(--nd-text-muted)">
              <span>
                Page {usersQuery.data.page} of {Math.max(1, Math.ceil(usersQuery.data.total / usersQuery.data.limit))}
                {' '}({usersQuery.data.total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={page * usersQuery.data.limit >= usersQuery.data.total}
                  onClick={() => setPage((p) => p + 1)}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </PermissionGate>
  )
}
