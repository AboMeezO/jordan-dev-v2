import { useRouterState } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'

export function AppLoadingScreen({
  label = 'Loading dashboard',
  message = 'Preparing the workspace and session state.',
}: {
  label?: string
  message?: string
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="nd-panel w-full max-w-md overflow-hidden p-6">
        <div className="flex items-center gap-4">
          <LoadingSpinner size="lg" />
          <div>
            <p className="nd-label">{label}</p>
            <h1 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-[var(--nd-text-display)]">
              Jordan Devs Dashboard
            </h1>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-[var(--nd-text-secondary)]">
          {message}
        </p>
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-[var(--nd-surface-raised)]">
          <div className="dashboard-loading-bar h-full w-1/2 rounded-full bg-[var(--nd-accent)]" />
        </div>
      </section>
    </main>
  )
}

export function AppPendingIndicator() {
  const isPending = useRouterState({
    select: (state) => state.status === 'pending',
  })

  if (!isPending) {
    return null
  }

  return (
    <div
      aria-live="polite"
      aria-label="Loading"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center pt-3"
      role="status"
    >
      <div className="flex items-center gap-2 rounded-full border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] px-3 py-2 shadow-lg">
        <LoadingSpinner />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--nd-text-secondary)]">
          Loading
        </span>
      </div>
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
        <p className="mt-3 text-sm leading-6 text-[var(--nd-text-secondary)]">
          {message}
        </p>
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
