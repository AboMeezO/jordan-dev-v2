import { useRouterState } from '@tanstack/react-router'

import { InlineError, LoadingState } from '#/components/app'
import { Button } from '#/components/ui/button'

export function AppLoadingScreen() {
  return <LoadingState title="Loading" />
}

export function AppPendingIndicator() {
  const isPending = useRouterState({
    select: (state) =>
      state.matches.some((match) => match.status === 'pending'),
  })

  if (!isPending) {
    return null
  }

  return (
    <output
      aria-live="polite"
      aria-label="Loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-100lex justify-center pt-4"
    >
      <LoadingSpinner />
    </output>
  )
}

export function AppErrorFallback({
  error,
  reset,
}: {
  error: unknown
  reset?: () => void
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="nd-panel w-full max-w-lg p-6">
        <p className="nd-label">Dashboard Error</p>
        <h1 className="mt-4 text-2xl font-medium tracking-[-0.04em] text-(--nd-accent)">
          Something went wrong
        </h1>
        <div className="mt-5">
          <InlineError error={error} title="Render failed" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {reset ? (
            <Button
              className="rounded-full font-mono text-xs uppercase tracking-widest"
              onClick={reset}
              type="button"
            >
              Try again
            </Button>
          ) : null}
          <Button
            className="rounded-full font-mono text-xs uppercase tracking-widest"
            onClick={() => window.location.reload()}
            type="button"
            variant="outline"
          >
            Reload
          </Button>
        </div>
      </section>
    </main>
  )
}

function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <span
      aria-hidden="true"
      className={`dashboard-spinner rounded-full border-2 border-(--nd-border-visible) border-t-(--nd-accent) ${
        size === 'lg' ? 'size-10' : 'size-4'
      }`}
    />
  )
}
