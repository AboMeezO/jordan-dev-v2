import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PermissionButton, PermissionGate } from '#/components/auth/permission-gate'
import { ConfirmDialog, FormDialog, FormField, InlineError, LoadingState } from '#/components/app'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { useCreateRoleMutation, useDeleteRoleMutation, useRolesQuery, useUpdateRoleMutation } from '#/features/admin'

export const Route = createFileRoute('/admin/roles')({
  component: AdminRolesPage,
})

function AdminRolesPage() {
  const rolesQuery = useRolesQuery()
  const createRoleMutation = useCreateRoleMutation()
  const updateRoleMutation = useUpdateRoleMutation()
  const deleteRoleMutation = useDeleteRoleMutation()

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const [editRole, setEditRole] = useState<{ id: string; name: string; description: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  const deleteTarget = deleteRoleId ? rolesQuery.data?.find((r) => r.id === deleteRoleId) : null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return
    setCreateError(null)
    try {
      await createRoleMutation.mutateAsync({ name: createName.trim(), description: createDescription.trim() || undefined })
      setCreateName('')
      setCreateDescription('')
      setCreateOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create role')
    }
  }

  const openEdit = (role: { id: string; name: string; description: string | null }) => {
    setEditRole({ id: role.id, name: role.name, description: role.description ?? '' })
    setEditName(role.name)
    setEditDescription(role.description ?? '')
    setEditError(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editRole || !editName.trim()) return
    setEditError(null)
    try {
      await updateRoleMutation.mutateAsync({ id: editRole.id, data: { name: editName.trim() || undefined, description: editDescription.trim() || null } })
      setEditRole(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const handleDelete = async () => {
    if (!deleteRoleId) return
    await deleteRoleMutation.mutateAsync(deleteRoleId)
    setDeleteRoleId(null)
  }

  return (
    <PermissionGate permission="roles:read" fallback={<p className="nd-label">You do not have permission to view roles.</p>}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-xl tracking-[-0.05em] text-(--nd-text-display)">Roles</h1>
          <PermissionButton permission="roles:update" onClick={() => setCreateOpen(true)} size="sm">
            Create Role
          </PermissionButton>
        </div>

        <FormDialog
          error={createError}
          isPending={createRoleMutation.isPending}
          onOpenChange={(open) => {
            setCreateOpen(open)
            if (!open) setCreateError(null)
          }}
          open={createOpen}
          onSubmit={handleCreate}
          submitDisabled={!createName.trim()}
          submitLabel="Create"
          title="Create Role"
        >
          <FormField label="Name">
            <Input onChange={(e) => setCreateName(e.target.value)} placeholder="Role name" value={createName} />
          </FormField>
          <FormField label="Description">
            <Input onChange={(e) => setCreateDescription(e.target.value)} placeholder="Optional description" value={createDescription} />
          </FormField>
        </FormDialog>

        <FormDialog
          error={editError}
          isPending={updateRoleMutation.isPending}
          onOpenChange={(open) => {
            if (!open) { setEditRole(null); setEditError(null) }
          }}
          open={editRole !== null}
          onSubmit={handleEdit}
          submitDisabled={!editName.trim()}
          submitLabel="Save"
          title="Edit Role"
        >
          <FormField label="Name">
            <Input onChange={(e) => setEditName(e.target.value)} placeholder="Role name" value={editName} />
          </FormField>
          <FormField label="Description">
            <Input onChange={(e) => setEditDescription(e.target.value)} placeholder="Optional description" value={editDescription} />
          </FormField>
        </FormDialog>

        {deleteRoleId ? (
          <ConfirmDialog
            confirmLabel="Delete"
            description={`Are you sure you want to delete "${deleteTarget?.name ?? 'this role'}"? This action cannot be undone.`}
            onConfirm={handleDelete}
            title="Delete Role"
            variant="danger"
          >
            <Button className="hidden" />
          </ConfirmDialog>
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
                          Permissions
                        </Link>
                        <PermissionButton
                          permission="roles:update"
                          disabledFallbackReason=""
                          onClick={() => openEdit(role)}
                          size="sm"
                          variant="outline"
                        >
                          Edit
                        </PermissionButton>
                        <PermissionButton
                          permission="roles:update"
                          disabled={deleteRoleMutation.isPending}
                          disabledFallbackReason=""
                          onClick={() => setDeleteRoleId(role.id)}
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
