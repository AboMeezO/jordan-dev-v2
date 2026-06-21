import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import ClerkProvider from '../integrations/clerk/provider'

import { ThemeSync } from '../features/theme/theme-store'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const themeBootScript = `(function(){try{var theme=window.localStorage.getItem('dashboard-theme')||'system';var systemDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=theme==='dark'||(theme==='system'&&systemDark);document.documentElement.classList.toggle('dark',isDark);document.body&&document.body.classList.toggle('dark',isDark);}catch(error){}})();`

const Devtools = import.meta.env.DEV
  ? lazy(() => import('../components/dev/Devtools'))
  : null

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Jordan Devs Dashboard',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootScript,
          }}
        />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <ClerkProvider>
          <ThemeSync />
          {children}
          {Devtools ? (
            <Suspense fallback={null}>
              <Devtools />
            </Suspense>
          ) : null}
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}
