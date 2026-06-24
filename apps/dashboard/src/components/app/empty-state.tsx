import type { ReactNode } from 'react'

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode
  description?: string
  title: string
}) {
  return (
    <div className="grid justify-items-center px-4 py-12 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-(--nd-text-disabled)">
        {title}
      </p>
      {description ? (
        <p className="mt-3 max-w-md text-sm leading-6 text-(--nd-text-secondary)">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
