import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const KEY = 'geo.theme'

// 'system' removes the attribute so the prefers-color-scheme media query wins;
// 'light'/'dark' pin it via data-theme (which overrides the media query in tokens.css).
function apply(theme: Theme): void {
  const el = document.documentElement
  if (theme === 'system') el.removeAttribute('data-theme')
  else el.setAttribute('data-theme', theme)
}

function readStored(): Theme {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'system'
}

interface ThemeValue {
  theme: Theme
  setTheme(theme: Theme): void
}

const Ctx = createContext<ThemeValue | null>(null)

export function useTheme(): ThemeValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTheme must be used within ThemeProvider')
  return v
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStored)

  useEffect(() => {
    apply(theme)
  }, [theme])

  function setTheme(next: Theme): void {
    setThemeState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    // DOM write happens once, in the [theme] effect above, on the resulting re-render.
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}
