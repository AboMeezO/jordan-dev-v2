import { SignInButton, useAuth } from '@clerk/clerk-react'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'

export type DashboardPermission =
  | 'dashboard:read'
  | 'guilds:read'
  | 'moderation:read'
  | 'assistant:read'

type ProtectedRouteProps = {
  children: ReactNode
  requiredPermissions?: Array<DashboardPermission>
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth()

  if (!isLoaded) {
    return <ProtectedRouteState label="Auth" title="[CHECKING SESSION]" />
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
        label="Protected"
        title="Sign in to continue"
      />
    )
  }

  if (!hasRequiredPermissions(sessionClaims, requiredPermissions)) {
    return (
      <ProtectedRouteState
        label="Forbidden"
        title="[MISSING PERMISSION]"
        tone="danger"
      />
    )
  }

  return <>{children}</>
}

function ProtectedRouteState({
  action,
  label,
  title,
  tone = 'default',
}: {
  action?: ReactNode
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
        {action ? <div className="mt-6">{action}</div> : null}
      </section>
    </main>
  )
}

function hasRequiredPermissions(
  sessionClaims: unknown,
  requiredPermissions: Array<DashboardPermission>,
) {
  if (requiredPermissions.length === 0) {
    return true
  }

  const grantedPermissions = readPermissions(sessionClaims)

  return requiredPermissions.every((permission) =>
    grantedPermissions.has(permission),
  )
}

function readPermissions(sessionClaims: unknown) {
  const claims = sessionClaims as
    | {
        metadata?: { permissions?: Array<string> }
        publicMetadata?: { permissions?: Array<string> }
      }
    | undefined

  return new Set([
    ...(claims?.metadata?.permissions ?? []),
    ...(claims?.publicMetadata?.permissions ?? []),
  ])
}
