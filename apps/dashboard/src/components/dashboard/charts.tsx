import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type TrafficPoint = { label: string; requests: number; errors: number }
export type IncidentPoint = { label: string; count: number }
export type ChannelPoint = { label: string; value: number }
export type GraphNode = {
  id: string
  label: string
  x: number
  y: number
  tone: 'primary' | 'success' | 'warning' | 'danger'
}
export type GraphEdge = { from: string; to: string }

const fallbackTraffic: Array<TrafficPoint> = [
  { label: 'MON', requests: 44, errors: 5 },
  { label: 'TUE', requests: 48, errors: 8 },
  { label: 'WED', requests: 55, errors: 6 },
  { label: 'THU', requests: 63, errors: 2 },
  { label: 'FRI', requests: 70, errors: 3 },
  { label: 'SAT', requests: 78, errors: 1 },
  { label: 'SUN', requests: 88, errors: 2 },
]

const fallbackIncidents: Array<IncidentPoint> = [
  { label: '01', count: 5 },
  { label: '02', count: 8 },
  { label: '03', count: 6 },
  { label: '04', count: 2 },
  { label: '05', count: 1 },
  { label: '06', count: 3 },
]

const fallbackChannels: Array<ChannelPoint> = [
  { label: 'discord', value: 62 },
  { label: 'web', value: 24 },
  { label: 'api', value: 14 },
]

export function ChartPanel({
  action,
  children,
  label,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  label: string
  title: string
}) {
  return (
    <div className="nd-panel min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--nd-border)] p-4">
        <div>
          <p className="nd-label">{label}</p>
          <h2 className="mt-1 text-xl font-medium tracking-[-0.02em]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export function RequestLoadChart({ data }: { data: Array<TrafficPoint> }) {
  const chartData = data.length > 0 ? data : fallbackTraffic

  return (
    <MeasuredChartFrame>
      {({ height, width }) => (
        <AreaChart
          data={chartData}
          height={height}
          margin={{ bottom: 0, left: -18, right: 8, top: 12 }}
          width={width}
        >
          <CartesianGrid stroke="var(--nd-border)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            fontFamily="var(--font-mono)"
            fontSize={10}
            stroke="var(--nd-text-disabled)"
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            axisLine={false}
            fontFamily="var(--font-mono)"
            fontSize={10}
            stroke="var(--nd-text-disabled)"
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: 'var(--nd-border-visible)' }}
          />
          <Area
            dataKey="requests"
            fill="var(--nd-chart-fill)"
            isAnimationActive={false}
            name="Requests"
            stroke="var(--nd-text-display)"
            strokeWidth={2}
            type="linear"
          />
          <Area
            dataKey="errors"
            fill="transparent"
            isAnimationActive={false}
            name="Errors"
            stroke="var(--nd-accent)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            type="linear"
          />
        </AreaChart>
      )}
    </MeasuredChartFrame>
  )
}

export function IncidentBarChart({ data }: { data: Array<IncidentPoint> }) {
  const chartData = data.length > 0 ? data : fallbackIncidents

  return (
    <MeasuredChartFrame>
      {({ height, width }) => (
        <BarChart
          data={chartData}
          height={height}
          margin={{ bottom: 0, left: -24, right: 4, top: 16 }}
          width={width}
        >
          <CartesianGrid stroke="var(--nd-border)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            fontFamily="var(--font-mono)"
            fontSize={10}
            stroke="var(--nd-text-disabled)"
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            axisLine={false}
            fontFamily="var(--font-mono)"
            fontSize={10}
            stroke="var(--nd-text-disabled)"
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'var(--nd-surface-raised)' }}
          />
          <Bar
            dataKey="count"
            isAnimationActive={false}
            name="Incidents"
            radius={0}
          >
            {chartData.map((entry) => (
              <Cell
                fill={
                  entry.count > 6
                    ? 'var(--nd-accent)'
                    : entry.count > 3
                      ? 'var(--nd-warning)'
                      : 'var(--nd-text-display)'
                }
                key={entry.label}
              />
            ))}
          </Bar>
        </BarChart>
      )}
    </MeasuredChartFrame>
  )
}

export function ChannelDonutChart({ data }: { data: Array<ChannelPoint> }) {
  const chartData = data.length > 0 ? data : fallbackChannels

  return (
    <div className="grid gap-5">
      <MeasuredChartFrame height={190}>
        {({ height, width }) => (
          <PieChart height={height} width={width}>
            <Tooltip content={<ChartTooltip />} />
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="value"
              innerRadius={54}
              isAnimationActive={false}
              nameKey="label"
              outerRadius={82}
              paddingAngle={2}
              stroke="var(--nd-surface)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  fill={
                    index === 0
                      ? 'var(--nd-text-display)'
                      : index === 1
                        ? 'var(--nd-text-secondary)'
                        : 'var(--nd-accent)'
                  }
                  key={entry.label}
                />
              ))}
            </Pie>
          </PieChart>
        )}
      </MeasuredChartFrame>
      <div className="grid gap-3">
        {chartData.map((segment) => (
          <div
            className="flex items-center justify-between border-b border-[var(--nd-border)] pb-2 last:border-0"
            key={segment.label}
          >
            <span className="nd-label">{segment.label}</span>
            <span className="font-mono text-sm">{segment.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MeasuredChartFrame({
  children,
  height = 280,
}: {
  children: (size: { height: number; width: number }) => ReactNode
  height?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const updateWidth = () => {
      setWidth(Math.max(280, Math.floor(element.getBoundingClientRect().width)))
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-w-0 overflow-hidden" ref={ref} style={{ height }}>
      {children({ height, width })}
    </div>
  )
}

export function ServiceGraphChart({
  edges,
  nodes,
}: {
  edges: Array<GraphEdge>
  nodes: Array<GraphNode>
}) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  return (
    <div className="h-[280px] min-w-0">
      <svg
        aria-label="Service dependency graph"
        className="h-full w-full"
        role="img"
        viewBox="0 0 420 260"
      >
        <defs>
          <pattern
            height="16"
            id="graph-dots"
            patternUnits="userSpaceOnUse"
            width="16"
          >
            <circle cx="1" cy="1" fill="var(--nd-border)" r="1" />
          </pattern>
        </defs>
        <rect fill="url(#graph-dots)" height="260" width="420" />
        {edges.map((edge) => {
          const from = nodeById.get(edge.from)
          const to = nodeById.get(edge.to)

          if (!from || !to) return null

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              stroke="var(--nd-border-visible)"
              strokeDasharray="4 6"
              strokeWidth="1.25"
              x1={from.x}
              x2={to.x}
              y1={from.y}
              y2={to.y}
            />
          )
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              fill={nodeFill(node.tone)}
              r="18"
              stroke="var(--nd-surface)"
              strokeWidth="4"
            />
            <circle
              cx={node.x}
              cy={node.y}
              fill="transparent"
              r="23"
              stroke="var(--nd-border-visible)"
              strokeWidth="1"
            />
            <text
              fill="var(--nd-text-primary)"
              fontFamily="var(--font-mono)"
              fontSize="10"
              textAnchor="middle"
              x={node.x}
              y={node.y + 40}
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean
  label?: string
  payload?: Array<{ name?: string; value?: number | string }>
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] px-3 py-2">
      <p className="nd-label">{label}</p>
      <div className="mt-2 grid gap-1">
        {payload.map((item) => (
          <div
            className="flex items-center justify-between gap-6 font-mono text-xs"
            key={item.name}
          >
            <span className="text-[var(--nd-text-secondary)]">{item.name}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function nodeFill(tone: GraphNode['tone']) {
  if (tone === 'success') return 'var(--nd-success)'
  if (tone === 'warning') return 'var(--nd-warning)'
  if (tone === 'danger') return 'var(--nd-accent)'
  return 'var(--nd-text-display)'
}

export type StatusCountPoint = { label: string; value: number }
export type RoleCountPoint = { role: string; users: number }

function statusFill(label: string): string {
  const key = label.toUpperCase()
  if (key === 'VERIFIED' || key === 'COMPLETED') return 'var(--nd-success)'
  if (key === 'PENDING' || key === 'ROLE_GRANT_PENDING') return 'var(--nd-warning)'
  if (key === 'FAILED' || key === 'ROLE_GRANT_FAILED') return 'var(--nd-accent)'
  return 'var(--nd-text-display)'
}

function statusOpacity(index: number): number {
  return index === 0 ? 1 : index === 1 ? 0.6 : 0.3
}

export function VerificationStatusChart({
  data,
}: {
  data: Array<StatusCountPoint>
}) {
  const chartData = data.length > 0 ? data : [{ label: 'No data', value: 1 }]

  return (
    <div className="grid gap-5">
      <MeasuredChartFrame height={190}>
        {({ height, width }) => (
          <PieChart height={height} width={width}>
            <Tooltip content={<ChartTooltip />} />
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="value"
              innerRadius={54}
              isAnimationActive={false}
              nameKey="label"
              outerRadius={82}
              paddingAngle={2}
              stroke="var(--nd-surface)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  fill={statusFill(entry.label)}
                  fillOpacity={statusOpacity(index)}
                  key={entry.label}
                />
              ))}
            </Pie>
          </PieChart>
        )}
      </MeasuredChartFrame>
      <div className="grid gap-2">
        {chartData.map((segment, index) => (
          <div
            className="flex items-center justify-between border-b border-[var(--nd-border)] pb-2 last:border-0"
            key={segment.label}
          >
            <span className="nd-label">{segment.label}</span>
            <span className="font-mono text-sm" style={{ color: statusFill(segment.label), opacity: statusOpacity(index) }}>
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UsersByRoleChart({
  data,
}: {
  data: Array<RoleCountPoint>
}) {
  const chartData = data.length > 0 ? data : [{ role: 'no data', users: 0 }]

  return (
    <MeasuredChartFrame>
      {({ height, width }) => (
        <BarChart
          data={chartData}
          height={height}
          margin={{ bottom: 0, left: -24, right: 4, top: 16 }}
          width={width}
        >
          <CartesianGrid stroke="var(--nd-border)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="role"
            fontFamily="var(--font-mono)"
            fontSize={10}
            stroke="var(--nd-text-disabled)"
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
            fontSize={10}
            stroke="var(--nd-text-disabled)"
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'var(--nd-surface-raised)' }}
          />
          <Bar
            dataKey="users"
            isAnimationActive={false}
            name="Users"
            radius={0}
          >
            {chartData.map((entry) => (
              <Cell
                fill="var(--nd-text-display)"
                key={entry.role}
              />
            ))}
          </Bar>
        </BarChart>
      )}
    </MeasuredChartFrame>
  )
}
