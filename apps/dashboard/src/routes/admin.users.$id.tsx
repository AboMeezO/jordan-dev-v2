import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { PermissionGate, PermissionButton } from '#/components/auth/permission-gate'
import { InlineError, LoadingState } from '#/components/app'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { FormField } from '#/components/app/form-field'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { useAssignUserRolesMutation, useRolesQuery, useUpdateUserMutation, useUserQuery } from '#/features/admin'

export const Route = createFileRoute('/admin/users/$id')({
  component: AdminUserDetailPage,
})

function AdminUserDetailPage() {
  const { id } = Route.useParams()
  const userQuery = useUserQuery(id)
  const rolesQuery = useRolesQuery()
  const updateUserMutation = useUpdateUserMutation()
  const assignRolesMutation = useAssignUserRolesMutation()

  const user = userQuery.data
  const roles = rolesQuery.data

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? '')
      setEmail(user.email ?? '')
      setSelectedRoleIds(new Set(user.roles.map((r) => r.id)))
    }
  }, [user])

  const roleIdsChanged =
    !user ||
    selectedRoleIds.size !== user.roles.length ||
    user.roles.some((r) => !selectedRoleIds.has(r.id))

  const handleSaveRoles = async () => {
    await assignRolesMutation.mutateAsync({ id, roleIds: [...selectedRoleIds] })
  }

  const handleSaveProfile = async () => {
    await updateUserMutation.mutateAsync({ id, data: { displayName: displayName || undefined, email: email || undefined } })
  }

  return (
    <PermissionGate permission="user:read" fallback={<p className="nd-label">You do not have permission to view users.</p>}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/users"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-accent) hover:underline"
          >
            &larr; Back to Users
          </Link>
        </div>

        {userQuery.isPending ? (
          <LoadingState description="Fetching user details..." title="Loading" />
        ) : userQuery.isError ? (
          <InlineError error={userQuery.error} title="Failed to load user" />
        ) : user ? (
          <>
            <div className="nd-panel space-y-4 p-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-12">
                  {user.avatarUrl ? (
                    <AvatarImage alt={user.displayName ?? ''} src={user.avatarUrl} />
                  ) : null}
                  <AvatarFallback className="font-mono text-sm uppercase">
                    {(user.displayName ?? user.email ?? user.clerkUserId).slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-mono text-lg tracking-[-0.05em] text-(--nd-text-display)">
                    {user.displayName ?? 'Unnamed user'}
                  </h2>
                  <p className="font-mono text-xs text-(--nd-text-muted)">
                    {user.email ?? '—'} &middot; ID: {user.clerkUserId}
                  </p>
                </div>
              </div>

              <PermissionGate permission="user:update">
                <div className="grid max-w-md gap-4">
                  <FormField label="Display Name">
                    <Input onChange={(e) => setDisplayName(e.target.value)} value={displayName} />
                  </FormField>
                  <FormField label="Email">
                    <Input onChange={(e) => setEmail(e.target.value)} value={email} />
                  </FormField>
                  <div>
                    <Button
                      disabled={updateUserMutation.isPending}
                      onClick={handleSaveProfile}
                      size="sm"
                    >
                      {updateUserMutation.isPending ? 'Saving...' : 'Save Profile'}
                    </Button>
                    {updateUserMutation.isError ? (
                      <p className="mt-2 text-xs text-(--nd-accent)">
                        {updateUserMutation.error.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </PermissionGate>
            </div>

            <PermissionGate permission="user:update">
              <div className="nd-panel space-y-4 p-6">
                <h3 className="font-mono text-sm tracking-[-0.05em] text-(--nd-text-display)">
                  Role Assignment
                </h3>

                {rolesQuery.isPending ? (
                  <LoadingState description="Loading roles..." title="Loading" />
                ) : roles ? (
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => {
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
                              if (checked) {
                                next.delete(role.id)
                              } else {
                                next.add(role.id)
                              }
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

                <PermissionButton
                  allOf={['user:update']}
                  disabled={!roleIdsChanged}
                  disabledFallbackReason="You do not have permission to assign roles."
                  onClick={handleSaveRoles}
                  size="sm"
                >
                  {assignRolesMutation.isPending ? 'Saving...' : 'Save Roles'}
                </PermissionButton>

                {assignRolesMutation.isError ? (
                  <p className="text-xs text-(--nd-accent)">
                    {assignRolesMutation.error.message}
                  </p>
                ) : null}
              </div>
            </PermissionGate>
          </>
        ) : null}
      </div>
    </PermissionGate>
  )
}
