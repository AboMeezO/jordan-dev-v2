import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Button } from '#/components/ui/button'

function JordanDevsLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="38" height="38" rx="10" stroke="currentColor" strokeWidth="1.5" />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fill="currentColor"
        fontSize="13"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
        letterSpacing="1"
      >
        JD
      </text>
    </svg>
  )
}

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
          <JordanDevsLogo className="absolute inset-0 text-(--nd-text-display) transition-opacity duration-180 ease-out group-hover:opacity-0 group-focus-visible:opacity-0" />
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
      <JordanDevsLogo className="size-10 shrink-0 text-(--nd-text-display)" />
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
