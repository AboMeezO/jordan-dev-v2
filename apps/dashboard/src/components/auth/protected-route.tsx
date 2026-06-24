import { SignInButton, useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

import { LoadingState } from '#/components/app'
import { Button } from '#/components/ui/button'

type ProtectedRouteProps = {
  children: ReactNode
}

// Client-side route protection is only a UX guard. Loaders, server handlers,
// and backend endpoints must still enforce auth and permissions.
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <LoadingState
        description="The dashboard is checking your current session."
        title="Checking session"
      />
    )
  }

  if (!isSignedIn) {
    return (
      <ProtectedRouteState
        action={
          <SignInButton mode="modal">
            <Button className="rounded-full font-mono text-xs uppercase tracking-widest">
              Sign in
            </Button>
          </SignInButton>
        }
        description="Use your Jordan Devs account to access the dashboard."
        label="Protected"
        title="Sign in to continue"
      />
    )
  }

  return <>{children}</>
}

function ProtectedRouteState({
  action,
  description,
  label,
  title,
  tone = 'default',
}: {
  action?: ReactNode
  description?: string
  label: string
  title: string
  tone?: 'default' | 'danger'
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <section className="nd-panel w-full max-w-md p-6">
        <p className="nd-label">{label}</p>
        <h1
          className={`mt-4 font-mono text-2xl tracking-tighter ${
            tone === 'danger'
              ? 'text-(--nd-accent)'
              : 'text-(--nd-text-display)'
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-sm leading-6 text-(--nd-text-muted)">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  )
}
