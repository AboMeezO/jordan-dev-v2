export const queryKeys = {
  dashboard: {
    root: ['dashboard'] as const,
    overview: () => [...queryKeys.dashboard.root, 'overview'] as const,
  },
  session: {
    root: ['session'] as const,
    current: () => [...queryKeys.session.root, 'current'] as const,
  },
} as const
