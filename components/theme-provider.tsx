'use client'

import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'
type Attribute = `data-${string}` | 'class'

export interface ThemeProviderProps extends React.PropsWithChildren<{
  defaultTheme?: Theme
  storageKey?: string
  attribute?: Attribute | Attribute[]
  enableSystem?: boolean
  enableColorScheme?: boolean
  disableTransitionOnChange?: boolean
  themes?: Theme[]
}> {}

const ThemeContext = React.createContext<{
  theme: Theme
  resolvedTheme: ResolvedTheme
  systemTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
} | undefined>(undefined)

function getStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme
  const storedTheme = window.localStorage.getItem(storageKey)
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    return storedTheme
  }
  return defaultTheme
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(
  theme: Theme,
  systemTheme: ResolvedTheme,
  attribute: Attribute | Attribute[],
  themes: string[],
  enableColorScheme: boolean
) {
  const html = document.documentElement
  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const attributes = Array.isArray(attribute) ? attribute : [attribute]

  attributes.forEach((attr) => {
    if (attr === 'class') {
      html.classList.remove(...themes.filter(Boolean))
      html.classList.add(resolvedTheme)
    } else {
      html.setAttribute(attr, resolvedTheme)
    }
  })

  if (enableColorScheme) {
    html.style.colorScheme = resolvedTheme
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  attribute = 'class',
  enableSystem = true,
  enableColorScheme = true,
  themes = ['light', 'dark'],
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(() =>
    getStoredTheme(storageKey, defaultTheme)
  )
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() =>
    getSystemTheme()
  )

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [enableSystem])

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(storageKey, theme)
    applyTheme(theme, systemTheme, attribute, themes, enableColorScheme)
  }, [theme, systemTheme, storageKey, attribute, themes, enableColorScheme])

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, systemTheme, setTheme }),
    [theme, resolvedTheme, systemTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider')
  }

  return context
}

