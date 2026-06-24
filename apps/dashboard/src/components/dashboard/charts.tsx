import { lazy, Suspense } from 'react'
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
export type StatusCountPoint = { label: string; value: number }
export type RoleCountPoint = { role: string; users: number }

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
      <div className="flex items-center justify-between gap-4 border-b border-(--nd-border) p-4">
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

export function ServiceGraphChart({
  edges,
  nodes,
}: {
  edges: Array<GraphEdge>
  nodes: Array<GraphNode>
}) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  return (
    <div className="h-70 min-w-0 overflow-hidden">
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

function nodeFill(tone: GraphNode['tone']) {
  if (tone === 'success') return 'var(--nd-success)'
  if (tone === 'warning') return 'var(--nd-warning)'
  if (tone === 'danger') return 'var(--nd-accent)'
  return 'var(--nd-text-display)'
}

const RequestLoadChartInner = lazy(() =>
  import('./_recharts').then((m) => ({ default: m.RequestLoadChart })),
)

const IncidentBarChartInner = lazy(() =>
  import('./_recharts').then((m) => ({ default: m.IncidentBarChart })),
)

const ChannelDonutChartInner = lazy(() =>
  import('./_recharts').then((m) => ({ default: m.ChannelDonutChart })),
)

const VerificationStatusChartInner = lazy(() =>
  import('./_recharts').then((m) => ({ default: m.VerificationStatusChart })),
)

const UsersByRoleChartInner = lazy(() =>
  import('./_recharts').then((m) => ({ default: m.UsersByRoleChart })),
)

function ChartSkeleton() {
  return (
    <div className="flex min-h-50 items-center justify-center text-xs text-(--nd-text-disabled) font-mono">
      Loading chart...
    </div>
  )
}

export function RequestLoadChart(props: { data: Array<TrafficPoint> }) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RequestLoadChartInner {...props} />
    </Suspense>
  )
}

export function IncidentBarChart(props: { data: Array<IncidentPoint> }) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <IncidentBarChartInner {...props} />
    </Suspense>
  )
}

export function ChannelDonutChart(props: { data: Array<ChannelPoint> }) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <ChannelDonutChartInner {...props} />
    </Suspense>
  )
}

export function VerificationStatusChart(props: {
  data: Array<StatusCountPoint>
}) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <VerificationStatusChartInner {...props} />
    </Suspense>
  )
}

export function UsersByRoleChart(props: { data: Array<RoleCountPoint> }) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <UsersByRoleChartInner {...props} />
    </Suspense>
  )
}
