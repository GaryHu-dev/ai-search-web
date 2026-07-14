import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../theme-context'

function Probe() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('light')}>light</button>
      <button onClick={() => setTheme('system')}>system</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to system (no data-theme attribute)', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })

  it('pins dark, persists it, then returns to system', async () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    await userEvent.click(screen.getByText('dark'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('geo.theme')).toBe('dark')
    await userEvent.click(screen.getByText('system'))
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    expect(localStorage.getItem('geo.theme')).toBe('system')
  })

  it('restores a stored theme on mount', () => {
    localStorage.setItem('geo.theme', 'light')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
