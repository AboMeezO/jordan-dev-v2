export function LoadingState({
  description,
  title = 'LOADING',
}: {
  description?: string
  title?: string
}) {
  return (
    <main
      aria-label={title}
      className="grid min-h-screen place-items-center bg-background px-6 text-foreground"
      role="status"
    >
      <section className="nd-panel grid w-full max-w-md justify-items-center p-6 text-center">
        <div className="dot-grid size-12 rounded-full" />
        <p className="nd-label mt-5">{title}</p>
        {description ? (
          <p className="mt-3 text-sm leading-6 text-[var(--nd-text-secondary)]">
            {description}
          </p>
        ) : null}
      </section>
    </main>
  )
}
