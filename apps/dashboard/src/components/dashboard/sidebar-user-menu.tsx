import { useAuth } from '@clerk/clerk-react'
import { ChevronUp, LogOut, Settings, User } from 'lucide-react'
import type { ComponentType } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { useBackendSession } from '#/features/session'

type UserMenuItem = {
  id: string
  label: string
  icon?: ComponentType<{ className?: string }>
  href?: string
  onSelect?: () => void
  destructive?: boolean
  disabled?: boolean
}

export function SidebarUserMenu({ compactMode }: { compactMode: boolean }) {
  const { isLoaded, isSignedIn, signOut } = useAuth()
  const session = useBackendSession()

  const user = session?.user

  const menuItems: Array<UserMenuItem> = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      disabled: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      disabled: true,
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: LogOut,
      onSelect: () => signOut(),
      destructive: true,
    },
  ]

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-3 py-2.5 pl-1.5">
        <div className="size-10 animate-pulse rounded-full bg-(--nd-border)" />
        {!compactMode ? (
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-(--nd-border)" />
            <div className="h-2 w-32 rounded bg-(--nd-border)" />
          </div>
        ) : null}
      </div>
    )
  }

  if (!isSignedIn || !user) {
    return null
  }

  const initials = (user.displayName ?? user.email ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-13 w-full items-center gap-3 border-t border-(--nd-border) pl-1.5 pt-4 text-left transition-colors hover:text-(--nd-text-primary)"
          type="button"
        >
          <Avatar className="size-10 shrink-0">
            {user.avatarUrl ? (
              <AvatarImage
                alt={user.displayName ?? 'User'}
                src={user.avatarUrl}
              />
            ) : null}
            <AvatarFallback className="font-mono text-xs text-(--nd-text-secondary)">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div
            className={`min-w-0 flex-1 overflow-hidden transition-[width,opacity] duration-180 ease-out ${
              compactMode ? 'w-0 opacity-0' : 'w-40 opacity-100'
            }`}
          >
            <p className="truncate font-sans text-sm text-(--nd-text-primary)">
              {user.displayName ?? user.email ?? 'User'}
            </p>
            <p className="truncate font-mono text-[11px] text-(--nd-text-disabled)">
              {user.email ?? ''}
            </p>
          </div>
          <ChevronUp
            className={`size-4 shrink-0 text-(--nd-text-secondary) transition-[width,opacity] duration-180 ease-out ${
              compactMode ? 'w-0 opacity-0' : 'w-4 opacity-100'
            }`}
            strokeWidth={1.5}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56"
        side="top"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {user.avatarUrl ? (
                <AvatarImage
                  alt={user.displayName ?? 'User'}
                  src={user.avatarUrl}
                />
              ) : null}
              <AvatarFallback className="font-mono text-xs text-(--nd-text-secondary)">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-sm text-(--nd-text-primary)">
                {user.displayName ?? 'User'}
              </p>
              <p className="truncate font-mono text-[11px] text-(--nd-text-disabled)">
                {user.email ?? ''}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <DropdownMenuItem
                key={item.id}
                disabled={item.disabled}
                onSelect={item.onSelect}
                variant={item.destructive ? 'destructive' : 'default'}
              >
                {Icon ? (
                  <Icon className="size-4" strokeWidth={1.5} />
                ) : null}
                <span>{item.label}</span>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
