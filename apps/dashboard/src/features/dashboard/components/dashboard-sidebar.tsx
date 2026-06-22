import { Gauge, X } from 'lucide-react'

import { SidebarBrandHeader } from '#/components/dashboard/sidebar-brand-header'
import { SidebarUserMenu } from '#/components/dashboard/sidebar-user-menu'
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
      className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 w-70 overflow-hidden border-r border-(--nd-border) bg-(--nd-surface) p-4 transition-transform duration-180 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
        compactMode ? 'lg:px-3' : 'lg:px-4'
      } ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex h-full flex-col">
        <SidebarBrandHeader compactMode={compactMode} onToggleCompact={onToggleCompact} />

        <Button
          aria-label="Close sidebar"
          className="absolute right-1 top-4 rounded-full lg:hidden"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>

        <nav className="mt-8 grid gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const active = item.id === activeSection

            return (
              <button
                aria-label={item.label}
                className={`flex h-12 w-full items-center gap-3 overflow-hidden border-l-2 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-left transition-[border-color,color] duration-180 ease-out ${
                  active
                    ? 'border-(--nd-accent) text-(--nd-text-display)'
                    : 'border-transparent text-(--nd-text-disabled) hover:text-(--nd-text-primary)'
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
                      : 'w-40 translate-x-0 opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto grid border-t border-(--nd-border) pt-4">
          <div className="flex items-center justify-between gap-4 overflow-hidden px-1 pb-4">
            <div className="min-w-0">
              <p
                className={`nd-label overflow-hidden transition-[width,opacity] duration-180 ease-out ${
                  compactMode ? 'w-0 opacity-0' : 'w-22 opacity-100'
                }`}
              >
                Runtime
              </p>
              <p className="mt-1 overflow-hidden whitespace-nowrap font-mono text-sm text-(--nd-success)">
                <span
                  className={`inline-block transition-[width,opacity] duration-180 ease-out ${
                    compactMode ? 'w-0 opacity-0' : 'w-18 opacity-100'
                  }`}
                >
                  [STABLE]
                </span>
                <span
                  aria-hidden={!compactMode}
                  className={`inline-block transition-[width,opacity] duration-180 ease-out ${
                    compactMode ? 'w-6 opacity-100' : 'w-0 opacity-0'
                  }`}
                >
                  OK
                </span>
              </p>
            </div>
            <Gauge className="size-5 shrink-0 text-(--nd-text-secondary)" />
          </div>
          <SidebarUserMenu compactMode={compactMode} />
        </div>
      </div>
    </aside>
  )
}
