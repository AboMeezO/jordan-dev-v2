import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { PermissionButton, PermissionGate } from '#/components/auth/permission-gate'
import { FormField, InlineError, LoadingState } from '#/components/app'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { useAssignUserRolesMutation, useRolesQuery, useUpdateUserMutation, useUsersQuery } from '#/features/admin'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const usersQuery = useUsersQuery({ page, limit: 20, search: search || undefined })
  const rolesQuery = useRolesQuery()
  const updateUserMutation = useUpdateUserMutation()
  const assignRolesMutation = useAssignUserRolesMutation()

  const [editUser, setEditUser] = useState<{ id: string; displayName: string; email: string } | null>(null)
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [assignRolesUser, setAssignRolesUser] = useState<{ id: string } | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set())
  const [rolesError, setRolesError] = useState<string | null>(null)

  const openEdit = (user: { id: string; displayName: string | null; email: string | null }) => {
    setEditUser({ id: user.id, displayName: user.displayName ?? '', email: user.email ?? '' })
    setEditDisplayName(user.displayName ?? '')
    setEditEmail(user.email ?? '')
    setEditError(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setEditError(null)
    try {
      await updateUserMutation.mutateAsync({ id: editUser.id, data: { displayName: editDisplayName || undefined, email: editEmail || undefined } })
      setEditUser(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update user')
    }
  }

  const openAssignRoles = (user: { id: string }) => {
    const fullUser = usersQuery.data?.users.find((u) => u.id === user.id)
    setAssignRolesUser({ id: user.id })
    setSelectedRoleIds(new Set(fullUser?.roles.map((r) => r.id) ?? []))
    setRolesError(null)
  }

  const handleAssignRoles = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignRolesUser) return
    setRolesError(null)
    try {
      await assignRolesMutation.mutateAsync({ id: assignRolesUser.id, roleIds: [...selectedRoleIds] })
      setAssignRolesUser(null)
    } catch (err) {
      setRolesError(err instanceof Error ? err.message : 'Failed to assign roles')
    }
  }

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

        <Dialog open={editUser !== null} onOpenChange={(open) => { if (!open) { setEditUser(null); setEditError(null) } }}>
          <DialogContent>
            <form className="flex flex-col gap-4 flex-1 overflow-hidden" onSubmit={handleEdit}>
              <DialogHeader className="shrink-0">
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-4">
                  <FormField label="Display Name">
                    <Input onChange={(e) => setEditDisplayName(e.target.value)} value={editDisplayName} />
                  </FormField>
                  <FormField label="Email">
                    <Input onChange={(e) => setEditEmail(e.target.value)} value={editEmail} />
                  </FormField>
                  {editError && <p className="text-sm text-destructive">{editError}</p>}
                </div>
              </DialogBody>
              <DialogFooter className="shrink-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button disabled={updateUserMutation.isPending} type="submit">
                  {updateUserMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={assignRolesUser !== null} onOpenChange={(open) => { if (!open) { setAssignRolesUser(null); setRolesError(null) } }}>
          <DialogContent>
            <form className="flex flex-col gap-4 flex-1 overflow-hidden" onSubmit={handleAssignRoles}>
              <DialogHeader className="shrink-0">
                <DialogTitle>Assign Roles</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-4">
                  {rolesQuery.isPending ? (
                    <p className="text-sm text-(--nd-text-muted)">Loading roles...</p>
                  ) : rolesQuery.data ? (
                    <div className="flex flex-wrap gap-2">
                      {rolesQuery.data.map((role) => {
                        const checked = selectedRoleIds.has(role.id)
                        return (
                          <label
                            key={role.id}
                            className={`cursor-pointer rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-150 ${
                              checked
                                ? 'border-(--nd-accent) bg-(--nd-accent)/10 text-(--nd-accent)'
                                : 'border-(--nd-border) text-(--nd-text-muted) hover:border-(--nd-text-muted)'
                            }`}
                          >
                            <input
                              checked={checked}
                              className="sr-only"
                              onChange={() => {
                                const next = new Set(selectedRoleIds)
                                if (checked) { next.delete(role.id) } else { next.add(role.id) }
                                setSelectedRoleIds(next)
                              }}
                              type="checkbox"
                            />
                            {role.name}
                          </label>
                        )
                      })}
                    </div>
                  ) : null}
                  {rolesError && <p className="text-sm text-destructive">{rolesError}</p>}
                </div>
              </DialogBody>
              <DialogFooter className="shrink-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button disabled={assignRolesMutation.isPending} type="submit">
                  {assignRolesMutation.isPending ? 'Saving...' : 'Save Roles'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
                    <th className="px-4 py-3 font-normal">User</th>
                    <th className="px-4 py-3 font-normal">Email</th>
                    <th className="px-4 py-3 font-normal">Roles</th>
                    <th className="px-4 py-3 font-normal">Joined</th>
                    <th className="px-4 py-3 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data.users.map((user) => (
                    <tr key={user.id} className="border-b border-(--nd-border) last:border-0">
                      <td className="max-w-0 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8 shrink-0">
                            {user.avatarUrl ? (
                              <AvatarImage alt={user.displayName ?? ''} src={user.avatarUrl} />
                            ) : null}
                            <AvatarFallback className="font-mono text-[11px] uppercase">
                              {(user.displayName ?? user.email ?? user.clerkUserId).slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 truncate text-(--nd-text-primary)">
                            {user.displayName ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-0 px-4 py-3 text-(--nd-text-muted)">
                        <span className="truncate block">{user.email ?? '—'}</span>
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
                        <div className="flex items-center gap-2">
                          <PermissionButton
                            permission="user:update"
                            disabledFallbackReason=""
                            onClick={() => openAssignRoles(user)}
                            size="sm"
                            variant="outline"
                          >
                            Roles
                          </PermissionButton>
                          <Link
                            to="/admin/users/$id"
                            params={{ id: user.id }}
                            className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-accent) hover:underline"
                          >
                            Edit
                          </Link>
                        </div>
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
