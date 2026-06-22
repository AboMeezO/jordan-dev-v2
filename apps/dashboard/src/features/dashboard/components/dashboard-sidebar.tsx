import { X } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'

import { SidebarBrandHeader } from '#/components/dashboard/sidebar-brand-header'
import { SidebarUserMenu } from '#/components/dashboard/sidebar-user-menu'
import { Button } from '#/components/ui/button'

import { adminSidebarItems, sidebarItems } from '../data'

import type { DashboardSection } from '../types'

function SidebarLink({
  active,
  compactMode,
  icon: Icon,
  label,
  onClick,
  to,
}: {
  active: boolean
  compactMode: boolean
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  onClick?: () => void
  to?: string
}) {
  const className = `flex h-12 w-full items-center gap-3 overflow-hidden border-l-2 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-left transition-[border-color,color] duration-180 ease-out ${
    active
      ? 'border-(--nd-accent) text-(--nd-text-display)'
      : 'border-transparent text-(--nd-text-disabled) hover:text-(--nd-text-primary)'
  }`

  const content = (
    <>
      <Icon className="size-4 shrink-0" strokeWidth={1.5} />
      <span
        aria-hidden={compactMode}
        className={`overflow-hidden whitespace-nowrap transition-[width,opacity,transform] duration-180 ease-out ${
          compactMode
            ? 'w-0 translate-x-1 opacity-0'
            : 'w-40 translate-x-0 opacity-100'
        }`}
      >
        {label}
      </span>
    </>
  )

  if (to) {
    return (
      <Link
        className={className}
        onClick={onClick}
        title={label}
        to={to}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      className={className}
      onClick={onClick}
      title={label}
      type="button"
    >
      {content}
    </button>
  )
}

export function DashboardSidebar({
  activeSection,
  compactMode,
  onClose,
  onSelect,
  onToggleCompact,
  open,
}: {
  activeSection: DashboardSection | undefined
  compactMode: boolean
  onClose: () => void
  onSelect: (section: DashboardSection) => void
  onToggleCompact: () => void
  open: boolean
}) {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

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
            const active = item.id === activeSection

            return (
              <SidebarLink
                active={active}
                compactMode={compactMode}
                icon={item.icon}
                key={item.id}
                label={item.label}
                onClick={() => {
                  onSelect(item.id)
                  onClose()
                }}
              />
            )
          })}
        </nav>

        <div className="mt-4 border-t border-(--nd-border) pt-4">
          <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-(--nd-text-disabled)">
            Administration
          </p>
          <nav className="grid gap-1">
            {adminSidebarItems.map((item) => {
              const active = currentPath.startsWith(item.to ?? '')

              return (
                <SidebarLink
                  active={active}
                  compactMode={compactMode}
                  icon={item.icon}
                  key={item.id}
                  label={item.label}
                  onClick={onClose}
                  to={item.to}
                />
              )
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-(--nd-border)">
          <SidebarUserMenu compactMode={compactMode} />
        </div>
      </div>
    </aside>
  )
}
