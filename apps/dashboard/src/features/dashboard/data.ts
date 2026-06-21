import { Bot, Database, LayoutDashboard, ShieldCheck } from 'lucide-react'

import type {
  ChannelMixPoint,
  DashboardSidebarItem,
  DashboardWindowKey,
  IncidentPoint,
  ModuleColumn,
  ModuleRow,
  ModuleStatus,
  ServiceGraphEdge,
  ServiceGraphNode,
  TrafficPoint,
} from './types'

export const sidebarItems: Array<DashboardSidebarItem> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'guilds', label: 'Guilds', icon: Database },
  { id: 'moderation', label: 'Moderation', icon: ShieldCheck },
  { id: 'assistant', label: 'Assistant', icon: Bot },
]

export const modules: Array<ModuleRow> = [
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

export const trafficByWindow = {
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
} satisfies Record<DashboardWindowKey, Array<TrafficPoint>>

export const incidentBars: Array<IncidentPoint> = [
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

export const channelMix: Array<ChannelMixPoint> = [
  { label: 'discord', value: 62 },
  { label: 'web', value: 24 },
  { label: 'api', value: 14 },
]

export const graphNodes: Array<ServiceGraphNode> = [
  { id: 'bot', label: 'BOT', tone: 'primary', x: 74, y: 128 },
  { id: 'api', label: 'API', tone: 'success', x: 178, y: 78 },
  { id: 'db', label: 'DB', tone: 'success', x: 318, y: 86 },
  { id: 'queue', label: 'QUEUE', tone: 'warning', x: 196, y: 188 },
  { id: 'jobs', label: 'JOBS', tone: 'danger', x: 332, y: 178 },
]

export const graphEdges: Array<ServiceGraphEdge> = [
  { from: 'bot', to: 'api' },
  { from: 'api', to: 'db' },
  { from: 'api', to: 'queue' },
  { from: 'queue', to: 'jobs' },
  { from: 'jobs', to: 'db' },
]

export const moduleColumns: Array<ModuleColumn> = [
  { accessorKey: 'module', header: 'Module' },
  { accessorKey: 'owner', header: 'Owner' },
  { accessorKey: 'status', header: 'State' },
  { accessorKey: 'requests', header: 'Requests' },
  { accessorKey: 'latency', header: 'Latency' },
]

export const statusTone: Record<ModuleStatus, string> = {
  online: 'text-[var(--nd-success)]',
  draft: 'text-[var(--nd-warning)]',
  blocked: 'text-[var(--nd-accent)]',
}
