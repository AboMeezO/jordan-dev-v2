import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PermissionGate } from '#/components/auth/permission-gate'
import { FormField, InlineError, LoadingState } from '#/components/app'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { useSubmittedApplicationsQuery } from '#/features/admin'

export const Route = createFileRoute('/admin/applications')({
  component: AdminApplicationsPage,
})

const statusLabel: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DRAFTING: 'Drafting',
}

function AdminApplicationsPage() {
  const [guildId, setGuildId] = useState('')

  const applicationsQuery = useSubmittedApplicationsQuery(guildId)

  return (
    <PermissionGate
      permission="verification:review"
      fallback={
        <p className="nd-label">
          You do not have permission to review membership applications.
        </p>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-xl tracking-tighter text-(--nd-text-display)">
            Membership Applications
          </h1>
        </div>

        <FormField label="Guild ID">
          <Input
            className="max-w-sm font-mono text-xs"
            onChange={(e) => setGuildId(e.target.value)}
            placeholder="Enter Discord guild ID..."
            value={guildId}
          />
        </FormField>

        {!guildId ? (
          <p className="font-mono text-xs text-(--nd-text-muted)">
            Enter a guild ID to view applications.
          </p>
        ) : applicationsQuery.isPending ? (
          <LoadingState
            description="Fetching applications..."
            title="Loading"
          />
        ) : applicationsQuery.isError ? (
          <InlineError
            error={applicationsQuery.error}
            title="Failed to load applications"
          />
        ) : applicationsQuery.data ? (
          <>
            {applicationsQuery.data.applications.length === 0 ? (
              <p className="font-mono text-xs text-(--nd-text-muted)">
                No submitted applications for this guild.
              </p>
            ) : (
              <div className="nd-panel overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-(--nd-border) font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-text-muted)">
                      <th className="px-4 py-3 font-normal">Applicant</th>
                      <th className="px-4 py-3 font-normal">GitHub</th>
                      <th className="px-4 py-3 font-normal">Level</th>
                      <th className="px-4 py-3 font-normal">Status</th>
                      <th className="px-4 py-3 font-normal">Submitted</th>
                      <th
                        className="px-4 py-3 font-normal"
                        aria-label="Actions"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {applicationsQuery.data.applications.map((app) => (
                      <tr
                        key={app.id}
                        className="border-b border-(--nd-border) last:border-0"
                      >
                        <td className="max-w-0 px-4 py-3">
                          <span className="min-w-0 truncate block text-(--nd-text-primary)">
                            {app.displayName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-(--nd-text-muted)">
                          {app.githubHandle}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full border border-(--nd-border) px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]">
                            {app.experienceLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                              app.status === 'APPROVED'
                                ? 'text-(--nd-success)'
                                : app.status === 'REJECTED'
                                  ? 'text-(--nd-accent)'
                                  : app.status === 'UNDER_REVIEW'
                                    ? 'text-(--nd-warning)'
                                    : 'text-(--nd-text-muted)'
                            }`}
                          >
                            {statusLabel[app.status] ?? app.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-(--nd-text-muted)">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to="/admin/applications/$id"
                            params={{ id: app.id }}
                            className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-accent) hover:underline"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="font-mono text-xs text-(--nd-text-muted)">
              {applicationsQuery.data.total} total
            </div>
          </>
        ) : null}
      </div>
    </PermissionGate>
  )
}
