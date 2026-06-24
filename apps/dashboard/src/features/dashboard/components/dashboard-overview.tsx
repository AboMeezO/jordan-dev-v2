import type { DashboardOverview } from '@jordan-devs/shared'

import {
  ChartPanel,
  UsersByRoleChart,
  VerificationStatusChart,
} from '#/components/dashboard/charts'
import { EmptyState } from '#/components/app'

import { compactNumber } from '../utils'
import { MetricCard } from './metric-card'

export function DashboardOverview({
  overview,
}: {
  overview: DashboardOverview
}) {
  const {
    stats,
    verificationStatusCounts,
    usersByRole,
    recentUsers,
    recentVerificationEvents,
    system,
  } = overview

  return (
    <>
      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="nd-panel min-w-0 overflow-hidden p-6">
          <p className="nd-label">System Status</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="font-display text-[clamp(4rem,10vw,7rem)] leading-none tracking-tighter text-(--nd-text-display)">
              {compactNumber(stats.totalUsers)}
            </span>
            <span className="font-mono text-sm uppercase tracking-[0.16em] text-(--nd-text-secondary)">
              total users
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-(--nd-text-secondary)">
            <div className="flex items-center gap-2">
              <span className="nd-label">Database</span>
              <span
                className={
                  system.databaseReady
                    ? 'font-mono text-xs text-(--nd-success)'
                    : 'font-mono text-xs text-(--nd-accent)'
                }
              >
                {system.databaseReady ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="nd-label">Generated</span>
              <span className="font-mono text-xs text-(--nd-text-disabled)">
                {new Date(system.generatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            <MetricCard
              label="Total Users"
              unit="registered"
              value={compactNumber(stats.totalUsers)}
            />
            <MetricCard
              label="Verified"
              tone="success"
              unit={`of ${compactNumber(stats.totalUsers)}`}
              value={compactNumber(stats.verifiedUsers)}
            />
            <MetricCard
              label="Unverified"
              tone={stats.unverifiedUsers > 0 ? 'warning' : 'default'}
              unit={`of ${compactNumber(stats.totalUsers)}`}
              value={compactNumber(stats.unverifiedUsers)}
            />
            <MetricCard
              label="Roles"
              unit="defined"
              value={String(stats.totalRoles)}
            />
            <MetricCard
              label="Permissions"
              unit="known"
              value={String(stats.totalPermissions)}
            />
            <MetricCard
              label="Pending Role Grants"
              tone={stats.pendingRoleGrants > 0 ? 'warning' : 'default'}
              unit={stats.pendingRoleGrants === 1 ? 'job' : 'jobs'}
              value={String(stats.pendingRoleGrants)}
            />
          </div>
        </div>

        <div className="nd-panel p-6">
          <p className="nd-label">User Breakdown</p>
          <div className="mt-6 grid gap-5">
            <div className="flex items-center justify-between border-b border-(--nd-border) pb-3">
              <span className="nd-label shrink-0">Verified</span>
              <span className="font-mono text-lg text-(--nd-success)">
                {compactNumber(stats.verifiedUsers)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-(--nd-border) pb-3">
              <span className="nd-label shrink-0">Unverified</span>
              <span
                className={`font-mono text-lg ${stats.unverifiedUsers > 0 ? 'text-(--nd-warning)' : 'text-(--nd-text-display)'}`}
              >
                {compactNumber(stats.unverifiedUsers)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-(--nd-border) pb-3">
              <span className="nd-label shrink-0">Pending Grants</span>
              <span
                className={`font-mono text-lg ${stats.pendingRoleGrants > 0 ? 'text-(--nd-warning)' : 'text-(--nd-text-display)'}`}
              >
                {String(stats.pendingRoleGrants)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="nd-label shrink-0">Roles</span>
              <span className="font-mono text-lg text-(--nd-text-display)">
                {String(stats.totalRoles)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartPanel label="Distribution" title="Users by Role">
          <UsersByRoleChart data={usersByRole} />
        </ChartPanel>

        <ChartPanel label="Verification" title="Status Breakdown">
          {verificationStatusCounts.length > 0 ? (
            <VerificationStatusChart data={verificationStatusCounts} />
          ) : (
            <EmptyState
              title="No verification data"
              description="No users have completed verification yet."
            />
          )}
        </ChartPanel>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="nd-panel min-w-0 overflow-hidden">
          <div className="border-b border-(--nd-border-visible) p-5">
            <p className="nd-label">Activity</p>
            <h3 className="mt-1 font-sans text-xl font-medium tracking-[-0.02em] text-(--nd-text-display)">
              Recent Users
            </h3>
          </div>
          {recentUsers.length > 0 ? (
            <div className="divide-y divide-(--nd-border)">
              {recentUsers.map((user) => (
                <div
                  className="flex items-center gap-3 px-5 py-3"
                  key={user.id}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-(--nd-border-visible) font-mono text-xs text-(--nd-text-secondary)">
                    {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm text-(--nd-text-primary)">
                      {user.displayName ?? user.email ?? 'Unknown'}
                    </p>
                    <p className="truncate font-mono text-[11px] text-(--nd-text-disabled)">
                      {user.email ?? 'No email'}
                    </p>
                  </div>
                  <time className="shrink-0 font-mono text-[11px] text-(--nd-text-disabled)">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10">
              <EmptyState
                title="No recent users"
                description="No users have been created yet."
              />
            </div>
          )}
        </div>

        <div className="nd-panel min-w-0 overflow-hidden">
          <div className="border-b border-(--nd-border-visible) p-5">
            <p className="nd-label">Verification</p>
            <h3 className="mt-1 font-sans text-xl font-medium tracking-[-0.02em] text-(--nd-text-display)">
              Recent Events
            </h3>
          </div>
          {recentVerificationEvents.length > 0 ? (
            <div className="divide-y divide-(--nd-border)">
              {recentVerificationEvents.map((event) => (
                <div className="px-5 py-3" key={event.id}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-(--nd-text-secondary)">
                      {event.type}
                    </span>
                    <span className="font-mono text-[11px] text-(--nd-text-disabled)">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-(--nd-text-disabled)">
                    {event.status}
                    {event.message ? ` — ${event.message}` : null}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10">
              <EmptyState
                title="No recent events"
                description="No verification events have been recorded yet."
              />
            </div>
          )}
        </div>
      </section>
    </>
  )
}
