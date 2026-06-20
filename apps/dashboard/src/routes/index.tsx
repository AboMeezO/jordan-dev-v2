import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'
import { createFileRoute } from '@tanstack/react-router'
import {
  Bot,
  Command,
  Database,
  Gauge,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  ChannelDonutChart,
  ChartPanel,
  IncidentBarChart,
  RequestLoadChart,
  ServiceGraphChart,
} from '#/components/dashboard/charts'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'

export const Route = createFileRoute('/')({ component: DashboardHome })

type Section = 'overview' | 'guilds' | 'moderation' | 'assistant'
type Theme = 'light' | 'dark'
type WindowKey = '24h' | '7d' | '30d'
type ModuleStatus = 'online' | 'draft' | 'blocked'

type ModuleRow = {
  module: string
  owner: string
  status: ModuleStatus
  requests: number
  latency: number | null
}

const sidebarItems: Array<{
  id: Section
  label: string
  icon: typeof LayoutDashboard
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'guilds', label: 'Guilds', icon: Database },
  { id: 'moderation', label: 'Moderation', icon: ShieldCheck },
  { id: 'assistant', label: 'Assistant', icon: Bot },
]

const modules: Array<ModuleRow> = [
  {
    module: 'Guild overview',
    owner: 'core',
    status: 'online',
    requests: 18320,
    latency: 24,
  },
  {
    module: 'Moderation tools',
    owner: 'trust',
    status: 'online',
    requests: 9240,
    latency: 41,
  },
  {
    module: 'Reminder engine',
    owner: 'runtime',
    status: 'draft',
    requests: 4880,
    latency: 68,
  },
  {
    module: 'Assistant workspace',
    owner: 'platform',
    status: 'blocked',
    requests: 0,
    latency: null,
  },
]

const trafficByWindow = {
  '24h': [
    { label: '00', requests: 31, errors: 2 },
    { label: '02', requests: 34, errors: 1 },
    { label: '04', requests: 30, errors: 3 },
    { label: '06', requests: 44, errors: 2 },
    { label: '08', requests: 42, errors: 1 },
    { label: '10', requests: 58, errors: 4 },
    { label: '12', requests: 53, errors: 2 },
    { label: '14', requests: 66, errors: 3 },
    { label: '16', requests: 61, errors: 2 },
    { label: '18', requests: 71, errors: 5 },
    { label: '20', requests: 68, errors: 3 },
    { label: '22', requests: 76, errors: 4 },
  ],
  '7d': [
    { label: 'MON', requests: 44, errors: 5 },
    { label: 'TUE', requests: 48, errors: 8 },
    { label: 'WED', requests: 55, errors: 6 },
    { label: 'THU', requests: 63, errors: 2 },
    { label: 'FRI', requests: 70, errors: 3 },
    { label: 'SAT', requests: 78, errors: 1 },
    { label: 'SUN', requests: 88, errors: 2 },
  ],
  '30d': [
    { label: 'W1', requests: 28, errors: 14 },
    { label: 'W2', requests: 41, errors: 9 },
    { label: 'W3', requests: 62, errors: 6 },
    { label: 'W4', requests: 91, errors: 4 },
  ],
} satisfies Record<
  WindowKey,
  Array<{ label: string; requests: number; errors: number }>
>

const incidentBars = [
  { label: '01', count: 5 },
  { label: '02', count: 8 },
  { label: '03', count: 6 },
  { label: '04', count: 2 },
  { label: '05', count: 1 },
  { label: '06', count: 3 },
  { label: '07', count: 2 },
  { label: '08', count: 4 },
  { label: '09', count: 1 },
  { label: '10', count: 0 },
  { label: '11', count: 2 },
  { label: '12', count: 1 },
]

const channelMix = [
  { label: 'discord', value: 62 },
  { label: 'web', value: 24 },
  { label: 'api', value: 14 },
]

const graphNodes = [
  { id: 'bot', label: 'BOT', tone: 'primary', x: 74, y: 128 },
  { id: 'api', label: 'API', tone: 'success', x: 178, y: 78 },
  { id: 'db', label: 'DB', tone: 'success', x: 318, y: 86 },
  { id: 'queue', label: 'QUEUE', tone: 'warning', x: 196, y: 188 },
  { id: 'jobs', label: 'JOBS', tone: 'danger', x: 332, y: 178 },
] as const

const graphEdges = [
  { from: 'bot', to: 'api' },
  { from: 'api', to: 'db' },
  { from: 'api', to: 'queue' },
  { from: 'queue', to: 'jobs' },
  { from: 'jobs', to: 'db' },
]

const columns: Array<ColumnDef<ModuleRow>> = [
  { accessorKey: 'module', header: 'Module' },
  { accessorKey: 'owner', header: 'Owner' },
  { accessorKey: 'status', header: 'State' },
  { accessorKey: 'requests', header: 'Requests' },
  { accessorKey: 'latency', header: 'Latency' },
]

const statusTone: Record<ModuleStatus, string> = {
  online: 'text-[var(--nd-success)]',
  draft: 'text-[var(--nd-warning)]',
  blocked: 'text-[var(--nd-accent)]',
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem('dashboard-theme')

  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function DashboardHome() {
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [alertsOnly, setAlertsOnly] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [threshold, setThreshold] = useState([72])
  const [timeWindow, setTimeWindow] = useState<WindowKey>('7d')

  useEffect(() => {
    const darkMode = theme === 'dark'
    document.documentElement.classList.toggle('dark', darkMode)
    document.body.classList.toggle('dark', darkMode)
    window.localStorage.setItem('dashboard-theme', theme)
  }, [theme])

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return modules.filter((module) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        module.module.toLowerCase().includes(normalizedQuery) ||
        module.owner.toLowerCase().includes(normalizedQuery)

      return matchesQuery && (!alertsOnly || module.status !== 'online')
    })
  }, [alertsOnly, query])

  const table = useReactTable({
    columns,
    data: filteredModules,
    getCoreRowModel: getCoreRowModel(),
  })

  const traffic = trafficByWindow[timeWindow]
  const latestTraffic = traffic.at(-1)?.requests ?? 0
  const totalRequests = filteredModules.reduce(
    (sum, module) => sum + module.requests,
    0,
  )
  const onlineModules = filteredModules.filter(
    (module) => module.status === 'online',
  ).length

  return (
    <main className="min-h-screen bg-background text-foreground">
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <div
        className={
          compactMode
            ? 'grid min-h-screen w-full transition-[grid-template-columns] duration-200 ease-out lg:grid-cols-[72px_minmax(0,1fr)]'
            : 'grid min-h-screen w-full transition-[grid-template-columns] duration-200 ease-out lg:grid-cols-[280px_minmax(0,1fr)]'
        }
      >
        <DashboardSidebar
          activeSection={activeSection}
          compactMode={compactMode}
          onClose={() => setSidebarOpen(false)}
          onToggleCompact={() => setCompactMode((current) => !current)}
          onSelect={(section) => {
            setActiveSection(section)
            setSidebarOpen(false)
          }}
          open={sidebarOpen}
        />

        <section className="min-w-0 px-4 py-4 sm:px-6 lg:px-8">
          <header className="nd-panel sticky top-4 z-20 flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
            <Button
              aria-label="Open sidebar"
              className="rounded-full lg:hidden"
              onClick={() => setSidebarOpen(true)}
              size="icon"
              variant="outline"
            >
              <Menu className="size-4" />
            </Button>

            <div className="relative order-2 min-w-full flex-1 sm:order-none sm:min-w-0">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--nd-text-disabled)]" />
              <Input
                aria-label="Search modules"
                className="h-11 rounded-full border-[var(--nd-border-visible)] bg-transparent pr-4 pl-10 font-mono text-sm"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search module / owner"
                value={query}
              />
            </div>

            <Select
              onValueChange={(value) => setTimeWindow(value as WindowKey)}
              value={timeWindow}
            >
              <SelectTrigger className="h-11 w-[104px] rounded-full border-[var(--nd-border-visible)] font-mono text-xs uppercase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
              </SelectContent>
            </Select>

            <Button
              aria-label="Toggle theme"
              className="rounded-full"
              onClick={() =>
                setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
              }
              size="icon"
              variant="outline"
            >
              {theme === 'dark' ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            <Button className="rounded-full font-mono text-xs uppercase tracking-[0.1em]">
              <RefreshCcw className="size-4" />
              <span className="hidden sm:inline">Sync</span>
            </Button>
          </header>

          <div className="grid min-w-0 gap-6 py-6">
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
                        onValueChange={setThreshold}
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
                        onCheckedChange={setAlertsOnly}
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
                  onCheckedChange={setCompactMode}
                  value={compactMode ? '[ON]' : '[OFF]'}
                />
                <ControlCard
                  checked={alertsOnly}
                  label="Incident Focus"
                  onCheckedChange={setAlertsOnly}
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
                  <Button
                    className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                    variant="outline"
                  >
                    Export
                  </Button>
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
                      className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
                      variant="outline"
                    >
                      <Command className="size-4" />
                      Command
                    </Button>
                    <Button
                      className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
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
          </div>
        </section>
      </div>
    </main>
  )
}

function DashboardSidebar({
  activeSection,
  compactMode,
  onClose,
  onSelect,
  onToggleCompact,
  open,
}: {
  activeSection: Section
  compactMode: boolean
  onClose: () => void
  onSelect: (section: Section) => void
  onToggleCompact: () => void
  open: boolean
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-[280px] overflow-hidden border-r border-[var(--nd-border)] bg-[var(--nd-surface)] p-4 transition-[width,padding,transform] duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
        compactMode ? 'lg:!w-[72px] lg:!px-3' : 'lg:!w-[280px]'
      } ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-full flex-col">
        <div
          className={
            compactMode
              ? 'grid justify-items-center gap-3'
              : 'flex items-start justify-between gap-4'
          }
        >
          {compactMode ? (
            <>
              <Button
                aria-label="Expand sidebar"
                className="hidden rounded-full lg:inline-flex"
                onClick={onToggleCompact}
                size="icon"
                variant="ghost"
              >
                <PanelLeftOpen className="size-4" />
              </Button>
              <div className="grid size-10 place-items-center rounded-full border border-[var(--nd-border-visible)] font-mono text-xs text-[var(--nd-text-display)]">
                JD
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="nd-label">Jordan Devs</p>
                <h1 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
                  Control
                </h1>
              </div>
              <Button
                aria-label="Collapse sidebar"
                className="hidden rounded-full lg:inline-flex"
                onClick={onToggleCompact}
                size="icon"
                variant="ghost"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </>
          )}
          <Button
            aria-label="Close sidebar"
            className="rounded-full lg:hidden"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav
          className={
            compactMode
              ? 'mt-10 grid gap-1 transition-[margin] duration-200 ease-out'
              : 'mt-12 grid gap-1'
          }
        >
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const active = item.id === activeSection

            return (
              <button
                aria-label={item.label}
                className={`flex h-12 w-full items-center overflow-hidden border-l-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-[border-color,color,padding,gap] duration-200 ease-out ${
                  compactMode ? 'gap-0 px-3' : 'gap-3 px-3 text-left'
                } ${
                  active
                    ? 'border-[var(--nd-accent)] text-[var(--nd-text-display)]'
                    : 'border-transparent text-[var(--nd-text-disabled)] hover:text-[var(--nd-text-primary)]'
                }`}
                key={item.id}
                onClick={() => onSelect(item.id)}
                title={item.label}
                type="button"
              >
                <Icon
                  className="size-4 shrink-0 transition-transform duration-200 ease-out"
                  strokeWidth={1.5}
                />
                <span
                  aria-hidden={compactMode}
                  className={`overflow-hidden whitespace-nowrap transition-[width,opacity,transform] duration-200 ease-out ${
                    compactMode
                      ? 'w-0 translate-x-1 opacity-0'
                      : 'w-[160px] translate-x-0 opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div
          className={
            compactMode
              ? 'mt-auto grid justify-items-center gap-5 border-t border-[var(--nd-border)] pt-5'
              : 'mt-auto grid gap-4 border-t border-[var(--nd-border)] pt-5'
          }
        >
          <div
            className={
              compactMode
                ? 'grid justify-items-center gap-2'
                : 'flex items-center justify-between gap-4'
            }
          >
            <div>
              {!compactMode ? <p className="nd-label">Runtime</p> : null}
              <p className="mt-1 font-mono text-sm text-[var(--nd-success)]">
                {compactMode ? 'OK' : '[STABLE]'}
              </p>
            </div>
            <Gauge className="size-5 text-[var(--nd-text-secondary)]" />
          </div>
          <Button
            aria-label="Settings"
            className={
              compactMode
                ? 'h-10 w-full overflow-hidden rounded-full px-0 transition-[width,padding] duration-200'
                : 'rounded-full font-mono text-xs uppercase tracking-[0.1em]'
            }
            variant="outline"
          >
            <Settings className="size-4" />
            <span
              aria-hidden={compactMode}
              className={`overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ${
                compactMode ? 'w-0 opacity-0' : 'w-[64px] opacity-100'
              }`}
            >
              Settings
            </span>
          </Button>
        </div>
      </div>
    </aside>
  )
}

function MetricCard({
  label,
  tone = 'default',
  unit,
  value,
}: {
  label: string
  tone?: 'default' | 'success' | 'warning'
  unit: string
  value: string
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[var(--nd-success)]'
      : tone === 'warning'
        ? 'text-[var(--nd-warning)]'
        : 'text-[var(--nd-text-display)]'

  return (
    <div className="border border-[var(--nd-border)] p-4">
      <p className="nd-label">{label}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className={`font-mono text-4xl tracking-[-0.07em] ${toneClass}`}>
          {value}
        </span>
        <span className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--nd-text-secondary)]">
          {unit}
        </span>
      </div>
    </div>
  )
}

function ControlCard({
  checked,
  label,
  onCheckedChange,
  value,
}: {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
  value: string
}) {
  return (
    <div className="nd-panel flex items-center justify-between gap-4 p-5">
      <div>
        <p className="nd-label">{label}</p>
        <p className="mt-2 font-mono text-sm text-[var(--nd-text-primary)]">
          {value}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function ModuleTable({
  table,
}: {
  table: ReturnType<typeof useReactTable<ModuleRow>>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              className="border-b border-[var(--nd-border-visible)]"
              key={headerGroup.id}
            >
              {headerGroup.headers.map((header) => (
                <th className="nd-th" key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr
                className="border-b border-[var(--nd-border)] last:border-0"
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <td className="px-4 py-4" key={cell.id}>
                    <TableCell
                      cellId={cell.column.id}
                      value={cell.getValue()}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="px-4 py-16 text-center font-mono text-xs uppercase tracking-[0.12em] text-[var(--nd-text-disabled)]"
                colSpan={columns.length}
              >
                [NO MATCHING MODULES]
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function TableCell({ cellId, value }: { cellId: string; value: unknown }) {
  if (cellId === 'status') {
    const status = value as ModuleStatus
    return (
      <span
        className={`font-mono text-xs uppercase tracking-[0.12em] ${statusTone[status]}`}
      >
        {status}
      </span>
    )
  }

  if (cellId === 'requests') {
    return <span className="font-mono">{compactNumber(value as number)}</span>
  }

  if (cellId === 'latency') {
    return (
      <span className="font-mono">
        {typeof value === 'number' ? `${value}ms` : '--'}
      </span>
    )
  }

  if (cellId === 'owner') {
    return (
      <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--nd-text-secondary)]">
        {String(value)}
      </span>
    )
  }

  return <span>{String(value)}</span>
}

function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 1,
    notation: 'compact',
  }).format(value)
}
