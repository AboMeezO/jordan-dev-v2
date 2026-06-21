import { atom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const storageKey = 'dashboard-theme'

export const themePreferenceAtom = atom<ThemePreference>(
  readStoredThemePreference(),
)

export function ThemeSync() {
  const themePreference = useAtomValue(themePreferenceAtom)

  useEffect(() => {
    applyThemePreference(themePreference)
    writeStoredThemePreference(themePreference)

    if (themePreference !== 'system') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      applyThemePreference('system')
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [themePreference])

  return null
}

export function useThemePreference() {
  const themePreference = useAtomValue(themePreferenceAtom)
  const setThemePreference = useSetAtom(themePreferenceAtom)

  return {
    themePreference,
    setThemePreference,
    toggleTheme() {
      setThemePreference((currentTheme) => {
        const resolvedTheme = resolveThemePreference(currentTheme)
        return resolvedTheme === 'dark' ? 'light' : 'dark'
      })
    },
  }
}

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const savedTheme = window.localStorage.getItem(storageKey)

  if (
    savedTheme === 'light' ||
    savedTheme === 'dark' ||
    savedTheme === 'system'
  ) {
    return savedTheme
  }

  return 'system'
}

function writeStoredThemePreference(themePreference: ThemePreference) {
  if (typeof window === 'undefined') {
    return
  }

  if (window.localStorage.getItem(storageKey) === themePreference) {
    return
  }

  window.localStorage.setItem(storageKey, themePreference)
}

function applyThemePreference(themePreference: ThemePreference) {
  if (typeof document === 'undefined') {
    return
  }

  const darkMode = resolveThemePreference(themePreference) === 'dark'

  document.documentElement.classList.toggle('dark', darkMode)
  document.body?.classList.toggle('dark', darkMode)
}

function resolveThemePreference(
  themePreference: ThemePreference,
): ResolvedTheme {
  if (themePreference === 'system') {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light'
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  return themePreference
}
