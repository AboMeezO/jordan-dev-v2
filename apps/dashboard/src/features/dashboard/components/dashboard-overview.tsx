import { Command, Radio } from 'lucide-react'
import { permissions } from '@jordan-devs/shared'
import type { useReactTable } from '@tanstack/react-table'

import {
  ChannelDonutChart,
  ChartPanel,
  IncidentBarChart,
  RequestLoadChart,
  ServiceGraphChart,
} from '#/components/dashboard/charts'
import { PermissionButton } from '#/components/auth/permission-gate'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'

import {
  channelMix,
  graphEdges,
  graphNodes,
  incidentBars,
  modules,
} from '../data'
import { compactNumber } from '../utils'
import { ControlCard } from './control-card'
import { MetricCard } from './metric-card'
import { ModuleTable } from './module-table'

import type { DashboardWindowKey, ModuleRow, TrafficPoint } from '../types'

export function DashboardOverview({
  alertsOnly,
  compactMode,
  filteredModules,
  latestTraffic,
  onAlertsOnlyChange,
  onCompactModeChange,
  onThresholdChange,
  table,
  threshold,
  timeWindow,
  totalRequests,
  traffic,
}: {
  alertsOnly: boolean
  compactMode: boolean
  filteredModules: Array<ModuleRow>
  latestTraffic: number
  onAlertsOnlyChange: (checked: boolean) => void
  onCompactModeChange: (checked: boolean) => void
  onThresholdChange: (threshold: Array<number>) => void
  table: ReturnType<typeof useReactTable<ModuleRow>>
  threshold: Array<number>
  timeWindow: DashboardWindowKey
  totalRequests: number
  traffic: Array<TrafficPoint>
}) {
  const onlineModules = filteredModules.filter(
    (module) => module.status === 'online',
  ).length

  return (
    <>
      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="nd-panel min-w-0 overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="nd-label">Operational Readiness</p>
              <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
                <span className="font-display text-[clamp(4.5rem,13vw,11rem)] leading-none tracking-[-0.07em] text-[var(--nd-text-display)]">
                  {threshold[0]}
                </span>
                <span className="mb-4 font-mono text-sm uppercase tracking-[0.16em] text-[var(--nd-text-secondary)]">
                  /100 threshold
                </span>
              </div>
            </div>

            <div className="grid min-w-[240px] gap-4">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Label className="nd-label">Alert Threshold</Label>
                  <span className="font-mono text-xs text-[var(--nd-text-primary)]">
                    {threshold[0]}%
                  </span>
                </div>
                <Slider
                  max={100}
                  min={30}
                  onValueChange={onThresholdChange}
                  step={1}
                  value={threshold}
                />
              </div>
              <div className="flex items-center justify-between border-t border-[var(--nd-border)] pt-4">
                <div>
                  <p className="nd-label">Alerts Only</p>
                  <p className="mt-1 text-sm text-[var(--nd-text-secondary)]">
                    Filter unhealthy modules.
                  </p>
                </div>
                <Switch
                  checked={alertsOnly}
                  onCheckedChange={onAlertsOnlyChange}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Requests"
              unit="total"
              value={compactNumber(totalRequests)}
            />
            <MetricCard
              label="Modules Online"
              tone="success"
              unit={`/${filteredModules.length || modules.length}`}
              value={String(onlineModules)}
            />
            <MetricCard
              label="Traffic"
              tone={latestTraffic > threshold[0] ? 'warning' : 'default'}
              unit={timeWindow}
              value={`${latestTraffic}%`}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <ControlCard
            checked={compactMode}
            label="Compact Sidebar"
            onCheckedChange={onCompactModeChange}
            value={compactMode ? '[ON]' : '[OFF]'}
          />
          <ControlCard
            checked={alertsOnly}
            label="Incident Focus"
            onCheckedChange={onAlertsOnlyChange}
            value={alertsOnly ? '[FILTERED]' : '[ALL]'}
          />
          <div className="nd-panel p-5">
            <p className="nd-label">Live Bus</p>
            <div className="mt-5 flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full border border-[var(--nd-border-visible)]">
                <Radio
                  className="size-5 text-[var(--nd-accent)]"
                  strokeWidth={1.5}
                />
              </span>
              <div>
                <p className="font-mono text-xl text-[var(--nd-text-display)]">
                  312/s
                </p>
                <p className="nd-label mt-1">Gateway events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartPanel
          action={
              <PermissionButton
                aria-disabled="true"
                className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                disabled
                permission={permissions.dashboardRead}
                disabledFallbackReason="Missing dashboard permission"
                title="Export is not available yet"
                variant="outline"
              >
                Export
              </PermissionButton>
          }
          label="Traffic"
          title="Request Load"
        >
          <RequestLoadChart data={traffic} />
        </ChartPanel>

        <ChartPanel label="Incidents" title="Moderation Queue">
          <IncidentBarChart data={incidentBars} />
        </ChartPanel>
      </section>

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="nd-panel min-w-0 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-[var(--nd-border-visible)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="nd-label">Registry</p>
              <h2 className="mt-1 text-xl font-medium tracking-[-0.02em]">
                Modules
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                aria-disabled="true"
                className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                disabled
                title="Command actions are not available yet"
                variant="outline"
              >
                <Command className="size-4" />
                Command
              </Button>
              <Button
                aria-disabled="true"
                className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                disabled
                title="Adding modules is not available yet"
                variant="outline"
              >
                Add
              </Button>
            </div>
          </div>
          <ModuleTable table={table} />
        </div>

        <div className="grid gap-6">
          <ChartPanel label="Channels" title="Source Mix">
            <ChannelDonutChart data={channelMix} />
          </ChartPanel>

          <ChartPanel label="Graph" title="Service Map">
            <ServiceGraphChart edges={graphEdges} nodes={graphNodes} />
          </ChartPanel>
        </div>
      </section>
    </>
  )
}
