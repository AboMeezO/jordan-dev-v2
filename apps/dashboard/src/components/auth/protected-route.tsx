import { SignInButton, useAuth } from '@clerk/clerk-react'
import { can, canAll, canAny, parsePermissionClaims } from '@jordan-devs/shared'
import type { ReactNode } from 'react'

import { Button } from '#/components/ui/button'
import type { Permission } from '@jordan-devs/shared'

type ProtectedRouteProps = {
  children: ReactNode
  fallback?: ReactNode
  permission?: Permission
  allOf?: Array<Permission>
  anyOf?: Array<Permission>
  requiredPermissions?: Array<Permission>
}

// Client-side route protection is only a UX guard. Loaders, server handlers,
// and backend endpoints must still enforce auth and permissions.
export function ProtectedRoute({
  allOf,
  anyOf,
  children,
  fallback,
  permission,
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth()

  if (!isLoaded) {
    return (
      <ProtectedRouteState
        description="The dashboard is checking your current session."
        label="Checking"
        title="Checking session"
      />
    )
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

  const requiresPermissions = hasPermissionRequirements({
    allOf,
    anyOf,
    permission,
    requiredPermissions,
  })

  if (requiresPermissions && !sessionClaims) {
    return (
      <ProtectedRouteState
        description="The dashboard could not read the current session. Refresh the page or sign in again."
        label="Auth unavailable"
        title="Session unavailable"
        tone="danger"
      />
    )
  }

  if (
    !hasRequiredPermissions(sessionClaims, {
      allOf,
      anyOf,
      permission,
      requiredPermissions,
    })
  ) {
    if (fallback) {
      return <>{fallback}</>
    }

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
  {
    allOf,
    anyOf,
    permission,
    requiredPermissions,
  }: {
    allOf?: Array<Permission>
    anyOf?: Array<Permission>
    permission?: Permission
    requiredPermissions: Array<Permission>
  },
) {
  const permissions = parsePermissionClaims(sessionClaims)

  return (
    can(permissions, permission) &&
    canAll(permissions, requiredPermissions) &&
    canAll(permissions, allOf) &&
    canAny(permissions, anyOf)
  )
}

function hasPermissionRequirements({
  allOf,
  anyOf,
  permission,
  requiredPermissions,
}: {
  allOf?: Array<Permission>
  anyOf?: Array<Permission>
  permission?: Permission
  requiredPermissions: Array<Permission>
}) {
  return Boolean(
    permission ||
      allOf?.length ||
      anyOf?.length ||
      requiredPermissions.length > 0,
  )
}
