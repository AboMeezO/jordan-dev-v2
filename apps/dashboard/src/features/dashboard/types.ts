import type { ColumnDef } from '@tanstack/react-table'
import type { LucideIcon } from 'lucide-react'

export type DashboardSection =
  | 'overview'
  | 'guilds'
  | 'moderation'
  | 'assistant'
export type DashboardTheme = 'light' | 'dark'
export type DashboardWindowKey = '24h' | '7d' | '30d'
export type ModuleStatus = 'online' | 'draft' | 'blocked'

export type DashboardSidebarItem = {
  id: DashboardSection
  label: string
  icon: LucideIcon
  to?: string
}

export type ModuleRow = {
  module: string
  owner: string
  status: ModuleStatus
  requests: number
  latency: number | null
}

export type TrafficPoint = {
  label: string
  requests: number
  errors: number
}

export type IncidentPoint = {
  label: string
  count: number
}

export type ChannelMixPoint = {
  label: string
  value: number
}

export type ServiceGraphNode = {
  id: string
  label: string
  tone: 'primary' | 'success' | 'warning' | 'danger'
  x: number
  y: number
}

export type ServiceGraphEdge = {
  from: string
  to: string
}

export type ModuleColumn = ColumnDef<ModuleRow>
