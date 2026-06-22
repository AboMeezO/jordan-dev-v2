import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PermissionButton, PermissionGate } from '#/components/auth/permission-gate'
import { FormField, InlineError, LoadingState } from '#/components/app'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { Label } from '#/components/ui/label'
import { ScrollArea } from '#/components/ui/scroll-area'
import {
  useAssignRolePermissionsMutation,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  usePermissionsQuery,
  useRolesQuery,
  useUpdateRoleMutation,
} from '#/features/admin'

export const Route = createFileRoute('/admin/roles')({
  component: AdminRolesPage,
})

function AdminRolesPage() {
  const rolesQuery = useRolesQuery()
  const createRoleMutation = useCreateRoleMutation()
  const updateRoleMutation = useUpdateRoleMutation()
  const deleteRoleMutation = useDeleteRoleMutation()
  const permissionsQuery = usePermissionsQuery()
  const assignPermissionsMutation = useAssignRolePermissionsMutation()

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

  const [managePermsRoleId, setManagePermsRoleId] = useState<string | null>(null)
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set())
  const [permsError, setPermsError] = useState<string | null>(null)

  const openManagePerms = (roleId: string) => {
    setManagePermsRoleId(roleId)
    setSelectedPermIds(new Set())
    setPermsError(null)
  }

  const handleAssignPerms = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!managePermsRoleId) return
    setPermsError(null)
    try {
      await assignPermissionsMutation.mutateAsync({ id: managePermsRoleId, permissionIds: [...selectedPermIds] })
      setManagePermsRoleId(null)
    } catch (err) {
      setPermsError(err instanceof Error ? err.message : 'Failed to assign permissions')
    }
  }

  const togglePerm = (permId: string) => {
    const next = new Set(selectedPermIds)
    if (next.has(permId)) { next.delete(permId) } else { next.add(permId) }
    setSelectedPermIds(next)
  }

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
          <h1 className="font-mono text-xl tracking-tighter text-(--nd-text-display)">Roles</h1>
          <PermissionButton permission="roles:update" onClick={() => setCreateOpen(true)} size="sm">
            Create Role
          </PermissionButton>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setCreateError(null) }}>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField label="Name">
                  <Input onChange={(e) => setCreateName(e.target.value)} placeholder="Role name" value={createName} />
                </FormField>
                <FormField label="Description">
                  <Input onChange={(e) => setCreateDescription(e.target.value)} placeholder="Optional description" value={createDescription} />
                </FormField>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button disabled={!createName.trim() || createRoleMutation.isPending} type="submit">
                  {createRoleMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={editRole !== null} onOpenChange={(open) => { if (!open) { setEditRole(null); setEditError(null) } }}>
          <DialogContent>
            <form onSubmit={handleEdit}>
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <FormField label="Name">
                  <Input onChange={(e) => setEditName(e.target.value)} placeholder="Role name" value={editName} />
                </FormField>
                <FormField label="Description">
                  <Input onChange={(e) => setEditDescription(e.target.value)} placeholder="Optional description" value={editDescription} />
                </FormField>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button disabled={!editName.trim() || updateRoleMutation.isPending} type="submit">
                  {updateRoleMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteRoleId !== null} onOpenChange={(open) => { if (!open) setDeleteRoleId(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTarget?.name ?? 'this role'}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={deleteRoleMutation.isPending} onClick={handleDelete} variant="destructive">
                {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={managePermsRoleId !== null} onOpenChange={(open) => { if (!open) { setManagePermsRoleId(null); setPermsError(null) } }}>
          <DialogContent>
            <form onSubmit={handleAssignPerms}>
              <DialogHeader>
                <DialogTitle>Manage Permissions</DialogTitle>
                <DialogDescription>
                  Select the permissions for this role.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {permissionsQuery.isPending ? (
                  <p className="text-sm text-(--nd-text-muted)">Loading permissions...</p>
                ) : permissionsQuery.isError ? (
                  <p className="text-sm text-destructive">Failed to load permissions.</p>
                ) : permissionsQuery.data ? (
                  <ScrollArea className="max-h-72">
                    <div className="space-y-3">
                      {permissionsQuery.data.map((perm) => {
                        const checked = selectedPermIds.has(perm.id)
                        return (
                          <div key={perm.id} className="flex items-start gap-3">
                            <Checkbox
                              checked={checked}
                              id={`perm-${perm.id}`}
                              onCheckedChange={() => togglePerm(perm.id)}
                            />
                            <div className="grid gap-0.5">
                              <Label
                                className="font-mono text-xs uppercase leading-none tracking-widest"
                                htmlFor={`perm-${perm.id}`}
                              >
                                {perm.id}
                              </Label>
                              {perm.description ? (
                                <p className="text-xs text-(--nd-text-muted)">
                                  {perm.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : null}
                {permsError && <p className="text-sm text-destructive">{permsError}</p>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button disabled={assignPermissionsMutation.isPending} type="submit">
                  {assignPermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
                          disabledFallbackReason=""
                          onClick={() => openManagePerms(role.id)}
                          size="sm"
                          variant="outline"
                        >
                          Permissions
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
