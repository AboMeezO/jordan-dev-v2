import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Button } from '#/components/ui/button'

export function SidebarBrandHeader({
  compactMode,
  onToggleCompact,
}: {
  compactMode: boolean
  onToggleCompact: () => void
}) {
  if (compactMode) {
    return (
      <div className="flex h-14 items-center justify-center overflow-hidden">
        <button
          className="group relative size-10 shrink-0"
          onClick={onToggleCompact}
          type="button"
          aria-label="Expand sidebar"
        >
          <img src="/logo.png" alt="Jordan Devs" className="absolute inset-0 size-full object-contain transition-opacity duration-180 ease-out group-hover:opacity-0 group-focus-visible:opacity-0" />
          <PanelLeftOpen
            className="absolute inset-0 p-3 text-(--nd-text-secondary) opacity-0 transition-opacity duration-180 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
            strokeWidth={1.5}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-14 items-center gap-3 overflow-hidden">
      <img src="/logo.png" alt="Jordan Devs" className="size-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="nd-label">Jordan Devs</p>
        <p className="mt-0.5 font-mono text-[11px] text-(--nd-text-disabled)">
          System Dashboard
        </p>
      </div>
      <Button
        aria-label="Collapse sidebar"
        className="hidden shrink-0 rounded-full lg:inline-flex"
        onClick={onToggleCompact}
        size="icon"
        variant="ghost"
      >
        <PanelLeftClose className="size-4" strokeWidth={1.5} />
      </Button>
    </div>
  )
}
