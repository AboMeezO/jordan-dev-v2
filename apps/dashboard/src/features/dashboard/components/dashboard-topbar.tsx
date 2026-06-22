import { Menu, Moon, RefreshCcw, Search, Sun } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useThemePreference } from '#/features/theme/theme-store'

import type { DashboardWindowKey } from '../types'

export function DashboardTopbar({
  onOpenSidebar,
  onQueryChange,
  onTimeWindowChange,
  query,
  timeWindow,
}: {
  onOpenSidebar: () => void
  onQueryChange?: (query: string) => void
  onTimeWindowChange?: (window: DashboardWindowKey) => void
  query?: string
  timeWindow?: DashboardWindowKey
}) {
  const { themePreference, toggleTheme } = useThemePreference()

  return (
    <header className="nd-panel sticky top-4 z-20 flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
      <Button
        aria-label="Open sidebar"
        className="rounded-full lg:hidden"
        onClick={onOpenSidebar}
        size="icon"
        variant="outline"
      >
        <Menu className="size-4" />
      </Button>

      {onQueryChange !== undefined ? (
        <div className="relative order-2 min-w-full flex-1 sm:order-none sm:min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--nd-text-disabled)]" />
          <Input
            aria-label="Search modules"
            className="h-11 rounded-full border-[var(--nd-border-visible)] bg-transparent pr-4 pl-10 font-mono text-sm"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search module / owner"
            value={query ?? ''}
          />
        </div>
      ) : null}

      {onTimeWindowChange !== undefined ? (
        <Select
          onValueChange={(value) =>
            onTimeWindowChange(value as DashboardWindowKey)
          }
          value={timeWindow ?? '7d'}
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
      ) : null}

      <Button
        aria-label={`Toggle theme (${themePreference})`}
        className="rounded-full"
        onClick={toggleTheme}
        size="icon"
        variant="outline"
      >
        <Sun className="hidden size-4 dark:block" />
        <Moon className="size-4 dark:hidden" />
      </Button>

      <Button
        aria-disabled="true"
        className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
        disabled
        title="Sync is not available yet"
      >
        <RefreshCcw className="size-4" />
        <span className="hidden sm:inline">Sync</span>
      </Button>
    </header>
  )
}
