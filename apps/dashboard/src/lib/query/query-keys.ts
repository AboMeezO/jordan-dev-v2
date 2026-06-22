export const queryKeys = {
  admin: {
    root: ['admin'] as const,
    users: {
      root: () => [...queryKeys.admin.root, 'users'] as const,
      list: (filters?: Record<string, unknown>) => [...queryKeys.admin.users.root(), 'list', filters] as const,
      detail: (id: string) => [...queryKeys.admin.users.root(), 'detail', id] as const,
    },
    roles: {
      root: () => [...queryKeys.admin.root, 'roles'] as const,
      list: () => [...queryKeys.admin.roles.root(), 'list'] as const,
      detail: (id: string) => [...queryKeys.admin.roles.root(), 'detail', id] as const,
    },
    permissions: {
      list: () => [...queryKeys.admin.root, 'permissions', 'list'] as const,
    },
  },
  dashboard: {
    root: ['dashboard'] as const,
    overview: () => [...queryKeys.dashboard.root, 'overview'] as const,
  },
  session: {
    root: ['session'] as const,
    current: () => [...queryKeys.session.root, 'current'] as const,
  },
} as const
