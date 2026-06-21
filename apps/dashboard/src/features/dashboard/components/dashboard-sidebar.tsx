import { Gauge, PanelLeftClose, PanelLeftOpen, Settings, X } from 'lucide-react'

import { Button } from '#/components/ui/button'

import { sidebarItems } from '../data'

import type { DashboardSection } from '../types'

export function DashboardSidebar({
  activeSection,
  compactMode,
  onClose,
  onSelect,
  onToggleCompact,
  open,
}: {
  activeSection: DashboardSection
  compactMode: boolean
  onClose: () => void
  onSelect: (section: DashboardSection) => void
  onToggleCompact: () => void
  open: boolean
}) {
  return (
    <aside
      className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 w-[280px] overflow-hidden border-r border-[var(--nd-border)] bg-[var(--nd-surface)] p-4 transition-transform duration-180 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
        compactMode ? 'lg:px-3' : 'lg:px-4'
      } ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div
              className={`transition-[opacity,transform] duration-180 ease-out ${
                compactMode
                  ? 'pointer-events-none -translate-x-2 opacity-0'
                  : 'translate-x-0 opacity-100'
              }`}
            >
              <p className="nd-label">Jordan Devs</p>
              <h1 className="mt-2 text-2xl font-medium tracking-[-0.04em]">
                Control
              </h1>
            </div>
            <div
              aria-hidden={!compactMode}
              className={`absolute inset-0 grid size-10 place-items-center rounded-full border border-[var(--nd-border-visible)] font-mono text-xs text-[var(--nd-text-display)] transition-[opacity,transform] duration-180 ease-out ${
                compactMode
                  ? 'translate-x-0 opacity-100'
                  : 'pointer-events-none translate-x-2 opacity-0'
              }`}
            >
              JD
            </div>
          </div>
          <Button
            aria-label={compactMode ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden shrink-0 rounded-full lg:inline-flex"
            onClick={onToggleCompact}
            size="icon"
            variant="ghost"
          >
            {compactMode ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
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
              ? 'mt-10 grid gap-1 transition-[margin] duration-180 ease-out'
              : 'mt-12 grid gap-1'
          }
        >
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const active = item.id === activeSection

            return (
              <button
                aria-label={item.label}
                className={`flex h-12 w-full items-center overflow-hidden border-l-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-[border-color,color,padding,gap] duration-180 ease-out ${
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
                <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                <span
                  aria-hidden={compactMode}
                  className={`overflow-hidden whitespace-nowrap transition-[width,opacity,transform] duration-180 ease-out ${
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

        <div className="mt-auto grid gap-4 border-t border-[var(--nd-border)] pt-5">
          <div className="flex items-center justify-between gap-4 overflow-hidden">
            <div className="min-w-0">
              <p
                className={`nd-label transition-[width,opacity] duration-180 ease-out ${
                  compactMode ? 'h-0 w-0 opacity-0' : 'w-[88px] opacity-100'
                }`}
              >
                Runtime
              </p>
              <p className="mt-1 overflow-hidden whitespace-nowrap font-mono text-sm text-[var(--nd-success)]">
                <span
                  className={`inline-block transition-[width,opacity] duration-180 ease-out ${
                    compactMode ? 'w-0 opacity-0' : 'w-[72px] opacity-100'
                  }`}
                >
                  [STABLE]
                </span>
                <span
                  aria-hidden={!compactMode}
                  className={`inline-block transition-[width,opacity] duration-180 ease-out ${
                    compactMode ? 'w-[24px] opacity-100' : 'w-0 opacity-0'
                  }`}
                >
                  OK
                </span>
              </p>
            </div>
            <Gauge className="size-5 shrink-0 text-[var(--nd-text-secondary)]" />
          </div>
          <Button
            aria-label="Settings"
            className={
              compactMode
                ? 'h-10 w-full overflow-hidden rounded-full px-0 transition-[padding] duration-180'
                : 'rounded-full font-mono text-xs uppercase tracking-[0.1em]'
            }
            variant="outline"
          >
            <Settings className="size-4" />
            <span
              aria-hidden={compactMode}
              className={`overflow-hidden whitespace-nowrap transition-[width,opacity] duration-180 ${
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
