import { SignInButton, useAuth } from '@clerk/clerk-react'
import { canAll, parsePermissionClaims } from '@jordan-devs/shared'
import type { ReactNode } from 'react'

import { AppLoadingScreen } from '#/components/dashboard/app-feedback'
import { Button } from '#/components/ui/button'
import type { Permission } from '@jordan-devs/shared'

type ProtectedRouteProps = {
  children: ReactNode
  requiredPermissions?: Array<Permission>
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth()

  if (!isLoaded) {
    return <AppLoadingScreen />
  }

  if (!isSignedIn) {
    return (
      <ProtectedRouteState
        action={
          <SignInButton mode="modal">
            <Button className="rounded-full font-mono text-xs uppercase tracking-[0.1em]">
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

  if (!hasRequiredPermissions(sessionClaims, requiredPermissions)) {
    return (
      <ProtectedRouteState
        description="Your account is signed in, but it is missing the required dashboard permission."
        label="Forbidden"
        title="You do not have access"
        tone="danger"
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
          className={`mt-4 font-mono text-2xl tracking-[-0.05em] ${
            tone === 'danger'
              ? 'text-[var(--nd-accent)]'
              : 'text-[var(--nd-text-display)]'
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-sm leading-6 text-[var(--nd-text-muted)]">
            {description}
          </p>
        ) : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  )
}

function hasRequiredPermissions(
  sessionClaims: unknown,
  requiredPermissions: Array<Permission>,
) {
  return canAll(parsePermissionClaims(sessionClaims), requiredPermissions)
}
