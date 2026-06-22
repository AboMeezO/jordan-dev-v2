import { createFileRoute } from '@tanstack/react-router'

import { PermissionGate } from '#/components/auth/permission-gate'
import { InlineError, LoadingState } from '#/components/app'
import { usePermissionsQuery } from '#/features/admin'

export const Route = createFileRoute('/admin/permissions')({
  component: AdminPermissionsPage,
})

function AdminPermissionsPage() {
  const permissionsQuery = usePermissionsQuery()

  return (
    <PermissionGate permission="permissions:read" fallback={<p className="nd-label">You do not have permission to view permissions.</p>}>
      <div className="space-y-6">
        <h1 className="font-mono text-xl tracking-tighter text-(--nd-text-display)">Permissions</h1>

        {permissionsQuery.isPending ? (
          <LoadingState description="Fetching permissions..." title="Loading" />
        ) : permissionsQuery.isError ? (
          <InlineError error={permissionsQuery.error} title="Failed to load permissions" />
        ) : permissionsQuery.data ? (
          <div className="nd-panel overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-(--nd-border) font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-text-muted)">
                  <th className="px-4 py-3 font-normal">ID</th>
                  <th className="px-4 py-3 font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {permissionsQuery.data.map((perm) => (
                  <tr key={perm.id} className="border-b border-(--nd-border) last:border-0">
                    <td className="max-w-0 px-4 py-3">
                      <span className="block break-all font-mono text-xs uppercase tracking-[0.14em] text-(--nd-text-primary)">
                        {perm.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-(--nd-text-muted)">
                      {perm.description ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </PermissionGate>
  )
}
