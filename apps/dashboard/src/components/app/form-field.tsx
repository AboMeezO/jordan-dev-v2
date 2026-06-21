import type { ReactNode } from 'react'

import { Label } from '#/components/ui/label'

export function FormField({
  children,
  error,
  hint,
  label,
}: {
  children: ReactNode
  error?: string
  hint?: string
  label: string
}) {
  return (
    <label className="grid gap-2">
      <Label asChild>
        <span>{label}</span>
      </Label>
      {children}
      {error ? (
        <span className="text-xs leading-5 text-[var(--nd-accent)]">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs leading-5 text-[var(--nd-text-secondary)]">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
