/* eslint-disable react-doctor/nextjs-no-img-element --
   TanStack Start has no built-in Image component. */
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Button } from '#/components/ui/button'

export function SidebarBrandHeader({
  compactMode,
  onToggleCompact,
}: {
  compactMode: boolean
  onToggleCompact: () => void
}) {
  return (
    <div className="flex h-14 items-center gap-3 overflow-hidden">
      <div className="relative size-10 shrink-0">
        {compactMode ? (
          <button
            className="group absolute inset-0"
            onClick={onToggleCompact}
            type="button"
            aria-label="Expand sidebar"
          >
            <img
              src="/logo.png"
              alt="Jordan Devs"
              className="absolute inset-0 size-full object-contain transition-opacity duration-180 ease-out group-hover:opacity-0 group-focus-visible:opacity-0"
            />
            <PanelLeftOpen
              className="absolute inset-0 p-3 text-(--nd-text-secondary) opacity-0 transition-opacity duration-180 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
              strokeWidth={1.5}
            />
          </button>
        ) : (
          <img
            src="/logo.png"
            alt="Jordan Devs"
            className="size-full object-contain"
          />
        )}
      </div>

      <div
        className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-opacity duration-180 ease-out ${
          compactMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <p className="nd-label">Jordan Devs</p>
        <p className="mt-0.5 font-mono text-[11px] text-(--nd-text-disabled)">
          System Dashboard
        </p>
      </div>

      <Button
        aria-label="Collapse sidebar"
        className={`shrink-0 rounded-full transition-opacity duration-180 ease-out ${
          compactMode ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={onToggleCompact}
        size="icon"
        variant="ghost"
      >
        <PanelLeftClose className="size-4" strokeWidth={1.5} />
      </Button>
    </div>
  )
}
