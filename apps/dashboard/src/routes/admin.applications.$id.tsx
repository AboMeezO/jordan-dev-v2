import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import { PermissionGate } from '#/components/auth/permission-gate'
import { InlineError, LoadingState } from '#/components/app'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import {
  useApplicationDetailQuery,
  useApproveApplicationMutation,
  useRejectApplicationMutation,
} from '#/features/admin'

export const Route = createFileRoute('/admin/applications/$id')({
  component: AdminApplicationDetailPage,
})

const statusLabel: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DRAFTING: 'Drafting',
}

function AdminApplicationDetailPage() {
  const { id } = useParams({ from: Route.id })
  const navigate = useNavigate()
  const applicationQuery = useApplicationDetailQuery(id)
  const approveMutation = useApproveApplicationMutation()
  const rejectMutation = useRejectApplicationMutation()

  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleApprove = async () => {
    setActionError(null)
    try {
      await approveMutation.mutateAsync(id)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to approve application',
      )
    }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    try {
      await rejectMutation.mutateAsync({ id, reason: rejectReason })
      setShowRejectForm(false)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to reject application',
      )
    }
  }

  const app = applicationQuery.data

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
        <div className="flex items-center gap-4">
          <button
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-(--nd-accent) hover:underline"
            onClick={() => navigate({ to: '/admin/applications' })}
            type="button"
          >
            &larr; Back
          </button>
          <h1 className="font-mono text-xl tracking-tighter text-(--nd-text-display)">
            Application Review
          </h1>
        </div>

        {applicationQuery.isPending ? (
          <LoadingState description="Fetching application..." title="Loading" />
        ) : applicationQuery.isError ? (
          <InlineError
            error={applicationQuery.error}
            title="Failed to load application"
          />
        ) : app ? (
          <>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
                  app.status === 'APPROVED'
                    ? 'border-(--nd-success) text-(--nd-success)'
                    : app.status === 'REJECTED'
                      ? 'border-(--nd-accent) text-(--nd-accent)'
                      : app.status === 'UNDER_REVIEW'
                        ? 'border-(--nd-warning) text-(--nd-warning)'
                        : 'border-(--nd-border) text-(--nd-text-muted)'
                }`}
              >
                {statusLabel[app.status] ?? app.status}
              </span>
              {app.reviewedBy && (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-(--nd-text-muted)">
                  Reviewed by: {app.reviewedBy}
                </span>
              )}
            </div>

            <div className="nd-panel space-y-6 p-4">
              <section>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-(--nd-text-muted)">
                  Applicant
                </h2>
                <div className="grid grid-cols-[160px_1fr] gap-2 font-mono text-xs">
                  <span className="text-(--nd-text-muted)">Display Name</span>
                  <span className="text-(--nd-text-primary)">
                    {app.displayName}
                  </span>
                  <span className="text-(--nd-text-muted)">GitHub</span>
                  <span className="text-(--nd-text-primary)">
                    {app.githubHandle}
                  </span>
                  <span className="text-(--nd-text-muted)">Experience</span>
                  <span className="text-(--nd-text-primary)">
                    {app.experienceLevel}
                  </span>
                  <span className="text-(--nd-text-muted)">Referral</span>
                  <span className="text-(--nd-text-primary)">
                    {app.referralSource}
                    {app.referralOtherText ? ` — ${app.referralOtherText}` : ''}
                  </span>
                  {app.linkedInUrl && (
                    <>
                      <span className="text-(--nd-text-muted)">LinkedIn</span>
                      <a
                        className="text-(--nd-accent) hover:underline"
                        href={app.linkedInUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {app.linkedInUrl}
                      </a>
                    </>
                  )}
                  {app.portfolioUrl && (
                    <>
                      <span className="text-(--nd-text-muted)">Portfolio</span>
                      <a
                        className="text-(--nd-accent) hover:underline"
                        href={app.portfolioUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {app.portfolioUrl}
                      </a>
                    </>
                  )}
                </div>
              </section>

              <section>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-(--nd-text-muted)">
                  Strongest Project
                </h2>
                <p className="mb-2 font-mono text-xs font-semibold text-(--nd-text-primary)">
                  {app.strongestProject}
                </p>
                <p className="whitespace-pre-wrap font-mono text-xs text-(--nd-text-muted)">
                  {app.projectExplanation}
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-(--nd-text-muted)">
                  Tech Stack
                </h2>
                <p className="whitespace-pre-wrap font-mono text-xs text-(--nd-text-muted)">
                  {app.techStack}
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-(--nd-text-muted)">
                  Purpose of Joining
                </h2>
                <p className="whitespace-pre-wrap font-mono text-xs text-(--nd-text-muted)">
                  {app.purposeOfJoining}
                </p>
              </section>

              <section>
                <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-(--nd-text-muted)">
                  Self Introduction
                </h2>
                <p className="whitespace-pre-wrap font-mono text-xs text-(--nd-text-muted)">
                  {app.selfIntroduction}
                </p>
              </section>

              {app.status === 'REJECTED' && app.rejectionReason && (
                <section>
                  <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-(--nd-accent)">
                    Rejection Reason
                  </h2>
                  <p className="whitespace-pre-wrap font-mono text-xs text-(--nd-accent)">
                    {app.rejectionReason}
                  </p>
                </section>
              )}
            </div>

            {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && (
              <div className="space-y-4">
                {actionError && (
                  <p className="text-sm text-destructive">{actionError}</p>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    disabled={
                      approveMutation.isPending || app.status !== 'UNDER_REVIEW'
                    }
                    onClick={handleApprove}
                    size="sm"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                  <Button
                    disabled={
                      rejectMutation.isPending || app.status !== 'UNDER_REVIEW'
                    }
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    size="sm"
                    variant="outline"
                  >
                    Reject
                  </Button>
                </div>

                {showRejectForm && (
                  <form className="max-w-md space-y-4" onSubmit={handleReject}>
                    <div className="space-y-2">
                      <Label htmlFor="reject-reason">Rejection Reason</Label>
                      <Textarea
                        className="min-h-[100px] font-mono text-xs"
                        id="reject-reason"
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Explain why this application is being rejected..."
                        required
                        value={rejectReason}
                      />
                    </div>
                    <Button
                      disabled={
                        rejectMutation.isPending || !rejectReason.trim()
                      }
                      size="sm"
                      type="submit"
                      variant="destructive"
                    >
                      {rejectMutation.isPending
                        ? 'Rejecting...'
                        : 'Confirm Rejection'}
                    </Button>
                  </form>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PermissionGate>
  )
}
