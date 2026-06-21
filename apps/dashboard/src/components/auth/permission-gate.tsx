import { useAuth } from '@clerk/clerk-react'
import {
  can,
  canAll,
  canAny,
  parsePermissionClaims,
} from '@jordan-devs/shared'
import type { ComponentProps, ReactNode } from 'react'

import { Button } from '#/components/ui/button'

import type { Permission } from '@jordan-devs/shared'

type PermissionRequirement = {
  permission?: Permission
  allOf?: readonly Permission[]
  anyOf?: readonly Permission[]
}

type PermissionGateProps = PermissionRequirement & {
  children: ReactNode
  fallback?: ReactNode
}

export function usePermission(requirement: PermissionRequirement = {}) {
  const { isLoaded, isSignedIn, sessionClaims } = useAuth()
  const permissions = parsePermissionClaims(sessionClaims)

  const hasAccess =
    isLoaded &&
    Boolean(isSignedIn) &&
    can(permissions, requirement.permission) &&
    canAll(permissions, requirement.allOf) &&
    canAny(permissions, requirement.anyOf)

  return {
    hasAccess,
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    permissions,
  }
}

export function PermissionGate({
  children,
  fallback = null,
  ...requirement
}: PermissionGateProps) {
  const { hasAccess } = usePermission(requirement)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

type PermissionButtonProps = ComponentProps<typeof Button> &
  PermissionRequirement & {
    disabledFallbackReason?: string
  }

export function PermissionButton({
  allOf,
  anyOf,
  disabled,
  disabledFallbackReason = 'Missing permission',
  permission,
  title,
  ...props
}: PermissionButtonProps) {
  const { hasAccess, isLoaded } = usePermission({ allOf, anyOf, permission })
  const isPermissionDisabled = !isLoaded || !hasAccess

  return (
    <Button
      disabled={disabled || isPermissionDisabled}
      title={isPermissionDisabled ? disabledFallbackReason : title}
      {...props}
    />
  )
}
