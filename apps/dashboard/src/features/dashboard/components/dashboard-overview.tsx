import { Activity, ShieldCheck, Users, UserX, UserCheck, GitBranch } from 'lucide-react'
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
  const { stats, verificationStatusCounts, usersByRole, recentUsers, recentVerificationEvents, system } = overview

  return (
    <>
      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="nd-panel min-w-0 overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="nd-label">System Status</p>
              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                <span className="font-display text-[clamp(3rem,8vw,6rem)] leading-none tracking-[-0.07em] text-[var(--nd-text-display)]">
                  {compactNumber(stats.totalUsers)}
                </span>
                <span className="mb-4 font-mono text-sm uppercase tracking-[0.16em] text-[var(--nd-text-secondary)]">
                  total users
                </span>
              </div>
            </div>

            <div className="grid min-w-[240px] gap-3 text-sm text-[var(--nd-text-secondary)]">
              <div className="flex items-center justify-between border-b border-[var(--nd-border)] pb-2">
                <span className="nd-label">Database</span>
                <span className={system.databaseReady ? 'text-[var(--nd-success)]' : 'text-[var(--nd-accent)]'}>
                  {system.databaseReady ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--nd-border)] pb-2">
                <span className="nd-label">Generated</span>
                <span className="font-mono text-xs">{new Date(system.generatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <MetricCard
              label="Total Users"
              unit="registered"
              value={compactNumber(stats.totalUsers)}
            />
            <MetricCard
              label="Verified"
              tone="success"
              unit={`/${compactNumber(stats.totalUsers)}`}
              value={compactNumber(stats.verifiedUsers)}
            />
            <MetricCard
              label="Unverified"
              tone={stats.unverifiedUsers > 0 ? 'warning' : 'default'}
              unit={`/${compactNumber(stats.totalUsers)}`}
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

        <div className="grid gap-4">
          <div className="nd-panel p-5">
            <p className="nd-label">User Breakdown</p>
            <div className="mt-5 grid gap-4">
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-full border border-[var(--nd-border-visible)]">
                  <UserCheck className="size-5 text-[var(--nd-success)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-mono text-xl text-[var(--nd-text-display)]">
                    {compactNumber(stats.verifiedUsers)}
                  </p>
                  <p className="nd-label mt-1">Verified</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-full border border-[var(--nd-border-visible)]">
                  <UserX className="size-5 text-[var(--nd-warning)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-mono text-xl text-[var(--nd-text-display)]">
                    {compactNumber(stats.unverifiedUsers)}
                  </p>
                  <p className="nd-label mt-1">Unverified</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-full border border-[var(--nd-border-visible)]">
                  <ShieldCheck className="size-5 text-[var(--nd-accent)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-mono text-xl text-[var(--nd-text-display)]">
                    {String(stats.pendingRoleGrants)}
                  </p>
                  <p className="nd-label mt-1">Pending Grants</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-full border border-[var(--nd-border-visible)]">
                  <GitBranch className="size-5 text-[var(--nd-text-display)]" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="font-mono text-xl text-[var(--nd-text-display)]">
                    {String(stats.totalRoles)}
                  </p>
                  <p className="nd-label mt-1">Roles</p>
                </div>
              </div>
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
            <EmptyState title="No verification data" description="No users have completed verification yet." />
          )}
        </ChartPanel>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="nd-panel min-w-0 overflow-hidden">
          <div className="border-b border-[var(--nd-border-visible)] p-4">
            <p className="nd-label">Activity</p>
            <h2 className="mt-1 text-xl font-medium tracking-[-0.02em]">
              Recent Users
            </h2>
          </div>
          {recentUsers.length > 0 ? (
            <div className="divide-y divide-[var(--nd-border-visible)]">
              {recentUsers.map((user) => (
                <div
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                  key={user.id}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] text-xs font-medium text-[var(--nd-text-secondary)]">
                    {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--nd-text-primary)]">
                      {user.displayName ?? user.email ?? 'Unknown'}
                    </p>
                    <p className="truncate text-xs text-[var(--nd-text-disabled)]">
                      {user.email ?? 'No email'}
                    </p>
                  </div>
                  <time className="shrink-0 font-mono text-[11px] text-[var(--nd-text-disabled)]">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent users" description="No users have been created yet." />
          )}
        </div>

        <div className="nd-panel min-w-0 overflow-hidden">
          <div className="border-b border-[var(--nd-border-visible)] p-4">
            <p className="nd-label">Verification</p>
            <h2 className="mt-1 text-xl font-medium tracking-[-0.02em]">
              Recent Events
            </h2>
          </div>
          {recentVerificationEvents.length > 0 ? (
            <div className="divide-y divide-[var(--nd-border-visible)]">
              {recentVerificationEvents.map((event) => (
                <div
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                  key={event.id}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--nd-border-visible)] bg-[var(--nd-surface)]">
                    <Activity className="size-4 text-[var(--nd-text-secondary)]" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--nd-text-primary)]">
                      {event.type}
                    </p>
                    <p className="truncate text-xs text-[var(--nd-text-disabled)]">
                      {event.status}
                      {event.message ? ` — ${event.message}` : null}
                    </p>
                  </div>
                  <time className="shrink-0 font-mono text-[11px] text-[var(--nd-text-disabled)]">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent events" description="No verification events have been recorded yet." />
          )}
        </div>
      </section>
    </>
  )
}
