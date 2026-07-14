import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../../../test/msw/server'
import { AuthProvider } from '../../../lib/auth/auth-context'
import { LoginPage } from '../LoginPage'
import { clearTokens } from '../../../lib/api/token-store'

const BASE = 'http://localhost:3000'
const ui = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )

describe('LoginPage', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
  })

  it('shows a validation error for a bad email', async () => {
    ui()
    await userEvent.type(screen.getByLabelText(/^email$/i), 'not-an-email')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
  })

  it('maps a 401 to an inline "invalid email or password" message', async () => {
    server.use(
      http.post(`${BASE}/v1/auth/login`, () =>
        HttpResponse.json({ statusCode: 401, error: 'Unauthorized', message: 'Invalid email or password' }, { status: 401 })),
    )
    ui()
    await userEvent.type(screen.getByLabelText(/^email$/i), 'jane@acme.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })
})
