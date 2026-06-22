import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PermissionButton, PermissionGate } from '#/components/auth/permission-gate'
import { InlineError, LoadingState } from '#/components/app'
import { Input } from '#/components/ui/input'
import { useCreateRoleMutation, useDeleteRoleMutation, useRolesQuery } from '#/features/admin'

export const Route = createFileRoute('/admin/roles')({
  component: AdminRolesPage,
})

function AdminRolesPage() {
  const rolesQuery = useRolesQuery()
  const createRoleMutation = useCreateRoleMutation()
  const deleteRoleMutation = useDeleteRoleMutation()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createRoleMutation.mutateAsync({ name: newName.trim(), description: newDescription.trim() || undefined })
    setNewName('')
    setNewDescription('')
    setShowCreate(false)
  }

  return (
    <PermissionGate permission="roles:read" fallback={<p className="nd-label">You do not have permission to view roles.</p>}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-xl tracking-[-0.05em] text-(--nd-text-display)">Roles</h1>
          <PermissionButton permission="roles:update" onClick={() => setShowCreate(!showCreate)} size="sm">
            {showCreate ? 'Cancel' : 'Create Role'}
          </PermissionButton>
        </div>

        {showCreate ? (
          <div className="nd-panel flex items-end gap-3 p-4">
            <div className="grid flex-1 gap-1">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-text-muted)">
                Name
              </label>
              <Input onChange={(e) => setNewName(e.target.value)} placeholder="Role name" value={newName} />
            </div>
            <div className="grid flex-1 gap-1">
              <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-text-muted)">
                Description
              </label>
              <Input onChange={(e) => setNewDescription(e.target.value)} placeholder="Optional description" value={newDescription} />
            </div>
            <PermissionButton
              permission="roles:update"
              disabled={!newName.trim() || createRoleMutation.isPending}
              onClick={handleCreate}
              size="sm"
            >
              {createRoleMutation.isPending ? 'Creating...' : 'Create'}
            </PermissionButton>
          </div>
        ) : null}

        {rolesQuery.isPending ? (
          <LoadingState description="Fetching roles..." title="Loading" />
        ) : rolesQuery.isError ? (
          <InlineError error={rolesQuery.error} title="Failed to load roles" />
        ) : rolesQuery.data ? (
          <div className="nd-panel overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-(--nd-border) font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-text-muted)">
                  <th className="px-4 py-3 font-normal">Name</th>
                  <th className="px-4 py-3 font-normal">Description</th>
                  <th className="px-4 py-3 font-normal">Users</th>
                  <th className="px-4 py-3 font-normal">Created</th>
                  <th className="px-4 py-3 font-normal" />
                </tr>
              </thead>
              <tbody>
                {rolesQuery.data.map((role) => (
                  <tr key={role.id} className="border-b border-(--nd-border) last:border-0">
                    <td className="px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-(--nd-text-primary)">
                      {role.name}
                    </td>
                    <td className="px-4 py-3 text-(--nd-text-muted)">
                      {role.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-(--nd-text-muted)">
                      {role.userCount}
                    </td>
                    <td className="px-4 py-3 text-xs text-(--nd-text-muted)">
                      {new Date(role.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/admin/roles/$id"
                          params={{ id: role.id }}
                          className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-accent) hover:underline"
                        >
                          Edit
                        </Link>
                        <PermissionButton
                          permission="roles:update"
                          disabled={deleteRoleMutation.isPending}
                          disabledFallbackReason=""
                          onClick={() => {
                            if (window.confirm(`Delete role "${role.name}"?`)) {
                              deleteRoleMutation.mutate(role.id)
                            }
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          Delete
                        </PermissionButton>
                      </div>
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
