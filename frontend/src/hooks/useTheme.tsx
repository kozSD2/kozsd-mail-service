import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme
    return stored || 'auto'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  // Update resolved theme when theme or system preference changes
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        setResolvedTheme(systemTheme)
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateResolvedTheme)

    return () => {
      mediaQuery.removeEventListener('change', updateResolvedTheme)
    }
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
  }

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}