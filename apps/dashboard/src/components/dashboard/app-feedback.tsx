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
    <div
      aria-live="polite"
      aria-label="Loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center pt-4"
      role="status"
    >
      <LoadingSpinner />
    </div>
  )
}

export function AppErrorFallback({
  error,
  reset,
}: {
  error: unknown
  reset?: () => void
}) {
  const message =
    error instanceof Error ? error.message : 'The dashboard failed to render.'

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="nd-panel w-full max-w-lg p-6">
        <p className="nd-label">Dashboard Error</p>
        <h1 className="mt-4 text-2xl font-medium tracking-[-0.04em] text-[var(--nd-accent)]">
          Something went wrong
        </h1>
        <div className="mt-5">
          <InlineError error={error} title="Render failed" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {reset ? (
            <Button
              className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
              onClick={reset}
              type="button"
            >
              Try again
            </Button>
          ) : null}
          <Button
            className="rounded-full font-mono text-xs uppercase tracking-[0.1em]"
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
      className={`dashboard-spinner rounded-full border-2 border-[var(--nd-border-visible)] border-t-[var(--nd-accent)] ${
        size === 'lg' ? 'size-10' : 'size-4'
      }`}
    />
  )
}
