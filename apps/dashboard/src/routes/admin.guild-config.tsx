/* eslint-disable react-doctor/prefer-useReducer --
   Independent form state fields that don't share state. */
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PermissionGate } from '#/components/auth/permission-gate'
import { FormField, InlineError, LoadingState } from '#/components/app'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  useGuildConfigQuery,
  useUpsertGuildConfigMutation,
} from '#/features/admin'

export const Route = createFileRoute('/admin/guild-config')({
  component: AdminGuildConfigPage,
})

function AdminGuildConfigPage() {
  const [guildId, setGuildId] = useState('')
  const [editMode, setEditMode] = useState(false)

  const guildConfigQuery = useGuildConfigQuery(guildId)
  const upsertMutation = useUpsertGuildConfigMutation()

  const [unverifiedRoleId, setUnverifiedRoleId] = useState('')
  const [verifiedRoleId, setVerifiedRoleId] = useState('')
  const [reviewerRoleId, setReviewerRoleId] = useState('')
  const [verificationChannelId, setVerificationChannelId] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleLoad = (e: React.FormEvent) => {
    e.preventDefault()
    setEditMode(false)
  }

  const handleEdit = () => {
    if (!guildConfigQuery.data) return
    setUnverifiedRoleId(guildConfigQuery.data.unverifiedRoleId)
    setVerifiedRoleId(guildConfigQuery.data.verifiedRoleId)
    setReviewerRoleId(guildConfigQuery.data.reviewerRoleId)
    setVerificationChannelId(guildConfigQuery.data.verificationChannelId)
    setSaveError(null)
    setEditMode(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    try {
      await upsertMutation.mutateAsync({
        guildId,
        unverifiedRoleId,
        verifiedRoleId,
        reviewerRoleId,
        verificationChannelId,
      })
      setEditMode(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save config')
    }
  }

  return (
    <PermissionGate
      permission="guild:read"
      fallback={
        <p className="nd-label">
          You do not have permission to manage guild configuration.
        </p>
      }
    >
      <div className="space-y-6">
        <h1 className="font-mono text-xl tracking-tighter text-(--nd-text-display)">
          Guild Configuration
        </h1>

        <form className="flex items-end gap-4" onSubmit={handleLoad}>
          <FormField label="Guild ID">
            <Input
              className="max-w-sm font-mono text-xs"
              onChange={(e) => setGuildId(e.target.value)}
              placeholder="Enter Discord guild ID..."
              value={guildId}
            />
          </FormField>
          <Button disabled={!guildId} size="sm" type="submit" variant="outline">
            Load
          </Button>
        </form>

        {guildConfigQuery.isPending ? (
          <LoadingState
            description="Fetching guild config..."
            title="Loading"
          />
        ) : guildConfigQuery.isError ? (
          <InlineError
            error={guildConfigQuery.error}
            title="Failed to load guild config"
          />
        ) : guildConfigQuery.data && !editMode ? (
          <div className="nd-panel max-w-lg space-y-4 p-4">
            <div className="grid grid-cols-[180px_1fr] gap-2 font-mono text-xs">
              <span className="text-(--nd-text-muted)">Guild ID</span>
              <span className="text-(--nd-text-primary)">
                {guildConfigQuery.data.guildId}
              </span>
              <span className="text-(--nd-text-muted)">Unverified Role</span>
              <span className="text-(--nd-text-primary)">
                {guildConfigQuery.data.unverifiedRoleId}
              </span>
              <span className="text-(--nd-text-muted)">Verified Role</span>
              <span className="text-(--nd-text-primary)">
                {guildConfigQuery.data.verifiedRoleId}
              </span>
              <span className="text-(--nd-text-muted)">Reviewer Role</span>
              <span className="text-(--nd-text-primary)">
                {guildConfigQuery.data.reviewerRoleId}
              </span>
              <span className="text-(--nd-text-muted)">
                Verification Channel
              </span>
              <span className="text-(--nd-text-primary)">
                {guildConfigQuery.data.verificationChannelId}
              </span>
            </div>
            <PermissionGate permission="guild:update">
              <Button onClick={handleEdit} size="sm" variant="outline">
                Edit
              </Button>
            </PermissionGate>
          </div>
        ) : editMode ? (
          <form
            className="nd-panel max-w-lg space-y-4 p-4"
            onSubmit={handleSave}
          >
            <div className="space-y-4">
              <FormField label="Unverified Role ID">
                <Input
                  className="font-mono text-xs"
                  onChange={(e) => setUnverifiedRoleId(e.target.value)}
                  value={unverifiedRoleId}
                />
              </FormField>
              <FormField label="Verified Role ID">
                <Input
                  className="font-mono text-xs"
                  onChange={(e) => setVerifiedRoleId(e.target.value)}
                  value={verifiedRoleId}
                />
              </FormField>
              <FormField label="Reviewer Role ID">
                <Input
                  className="font-mono text-xs"
                  onChange={(e) => setReviewerRoleId(e.target.value)}
                  value={reviewerRoleId}
                />
              </FormField>
              <FormField label="Verification Channel ID">
                <Input
                  className="font-mono text-xs"
                  onChange={(e) => setVerificationChannelId(e.target.value)}
                  value={verificationChannelId}
                />
              </FormField>
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                disabled={upsertMutation.isPending}
                size="sm"
                type="submit"
              >
                {upsertMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={() => setEditMode(false)}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGate>
  )
}
