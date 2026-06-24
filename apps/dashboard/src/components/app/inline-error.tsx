export function InlineError({
  error,
  title = 'ERROR',
}: {
  error: unknown
  title?: string
}) {
  const message =
    error instanceof Error ? error.message : 'The dashboard could not continue.'

  return (
    <div className="border border-(--nd-accent) p-4" role="alert">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-(--nd-accent)">
        [{title}]
      </p>
      <p className="mt-2 text-sm leading-6 text-(--nd-text-secondary)">
        {message}
      </p>
    </div>
  )
}
