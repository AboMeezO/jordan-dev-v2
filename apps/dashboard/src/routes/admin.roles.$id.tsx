import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { PermissionGate, PermissionButton } from '#/components/auth/permission-gate'
import { InlineError, LoadingState } from '#/components/app'
import { FormField } from '#/components/app/form-field'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { useAssignRolePermissionsMutation, usePermissionsQuery, useRoleQuery, useUpdateRoleMutation } from '#/features/admin'
import type { Permission } from '@jordan-devs/shared'

export const Route = createFileRoute('/admin/roles/$id')({
  component: AdminRoleDetailPage,
})

function AdminRoleDetailPage() {
  const { id } = Route.useParams()
  const roleQuery = useRoleQuery(id)
  const permissionsQuery = usePermissionsQuery()
  const updateRoleMutation = useUpdateRoleMutation()
  const assignPermissionsMutation = useAssignRolePermissionsMutation()

  const role = roleQuery.data
  const permissions = permissionsQuery.data

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (role) {
      setName(role.name)
      setDescription(role.description ?? '')
      setSelectedPermissionIds(new Set(role.permissions))
    }
  }, [role])

  const permissionsChanged =
    !role ||
    selectedPermissionIds.size !== role.permissions.length ||
    role.permissions.some((p) => !selectedPermissionIds.has(p))

  const handleSavePermissions = async () => {
    await assignPermissionsMutation.mutateAsync({ id, permissionIds: [...selectedPermissionIds] as readonly Permission[] })
  }

  const handleSaveDetails = async () => {
    await updateRoleMutation.mutateAsync({ id, data: { name: name || undefined, description: description || undefined } })
  }

  const togglePermission = (permId: string) => {
    const next = new Set(selectedPermissionIds)
    if (next.has(permId)) {
      next.delete(permId)
    } else {
      next.add(permId)
    }
    setSelectedPermissionIds(next)
  }

  return (
    <PermissionGate permission="roles:read" fallback={<p className="nd-label">You do not have permission to view roles.</p>}>
      <div className="space-y-6">
        <Link
          to="/admin/roles"
          className="inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-accent) hover:underline"
        >
          &larr; Back to Roles
        </Link>

        {roleQuery.isPending ? (
          <LoadingState description="Fetching role details..." title="Loading" />
        ) : roleQuery.isError ? (
          <InlineError error={roleQuery.error} title="Failed to load role" />
        ) : role ? (
          <>
            <div className="nd-panel space-y-4 p-6">
              <PermissionGate permission="roles:update">
                <div className="grid max-w-md gap-4">
                  <FormField label="Name">
                    <Input onChange={(e) => setName(e.target.value)} value={name} />
                  </FormField>
                  <FormField label="Description">
                    <Input onChange={(e) => setDescription(e.target.value)} value={description} />
                  </FormField>
                  <div>
                    <Button
                      disabled={updateRoleMutation.isPending}
                      onClick={handleSaveDetails}
                      size="sm"
                    >
                      {updateRoleMutation.isPending ? 'Saving...' : 'Save Details'}
                    </Button>
                    {updateRoleMutation.isError ? (
                      <p className="mt-2 text-xs text-(--nd-accent)">
                        {updateRoleMutation.error.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </PermissionGate>

              {!permissionsQuery.isPending && !permissionsQuery.isError ? (
                <p className="font-mono text-xs text-(--nd-text-muted)">
                  To view permissions, you need the &apos;permissions:read&apos; permission.
                </p>
              ) : null}
            </div>

            <PermissionGate permission="roles:update">
              <div className="nd-panel space-y-4 p-6">
                <h3 className="font-mono text-sm tracking-[-0.05em] text-(--nd-text-display)">
                  Permission Assignment
                </h3>

                {permissionsQuery.isPending ? (
                  <LoadingState description="Loading permissions..." title="Loading" />
                ) : permissionsQuery.isError ? (
                  <InlineError error={permissionsQuery.error} title="Failed to load permissions" />
                ) : permissions ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {permissions.map((perm) => {
                      const checked = selectedPermissionIds.has(perm.id)
                      return (
                        <label
                          key={perm.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors duration-150 ${
                            checked
                              ? 'border-(--nd-accent) bg-(--nd-accent)/5'
                              : 'border-(--nd-border) hover:border-(--nd-text-muted)'
                          }`}
                        >
                          <input
                            checked={checked}
                            className="mt-1"
                            onChange={() => togglePermission(perm.id)}
                            type="checkbox"
                          />
                          <div>
                            <p className="font-mono text-xs uppercase tracking-[0.1em] text-(--nd-text-primary)">
                              {perm.id}
                            </p>
                            <p className="mt-0.5 text-xs text-(--nd-text-muted)">
                              {perm.description ?? '—'}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                ) : null}

                <PermissionButton
                  permission="roles:update"
                  disabled={!permissionsChanged}
                  disabledFallbackReason="You do not have permission to assign permissions."
                  onClick={handleSavePermissions}
                  size="sm"
                >
                  {assignPermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
                </PermissionButton>

                {assignPermissionsMutation.isError ? (
                  <p className="text-xs text-(--nd-accent)">
                    {assignPermissionsMutation.error.message}
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
