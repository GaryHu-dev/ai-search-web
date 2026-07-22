import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../lib/auth/auth-context'
import { LoginPage } from '../LoginPage'
import { clearTokens } from '../../../lib/api/token-store'

const ui = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )

describe('LoginPage (Google-only)', () => {
  const original = window.location
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
  })
  afterEach(() => {
    Object.defineProperty(window, 'location', { value: original, writable: true, configurable: true })
  })

  it('shows only Google sign-in — no email/password or register', () => {
    ui()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument()
  })

  it('navigates to the backend Google entry point on click', async () => {
    const loc = { href: '', hash: '', pathname: '/', search: '' } as unknown as Location
    Object.defineProperty(window, 'location', { value: loc, writable: true, configurable: true })
    ui()
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }))
    expect(loc.href).toMatch(/\/v1\/auth\/google$/)
  })
})
