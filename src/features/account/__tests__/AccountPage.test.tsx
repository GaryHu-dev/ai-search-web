import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/msw/server'
import { AuthProvider } from '../../../lib/auth/auth-context'
import { AccountPage } from '../AccountPage'
import { setRefreshToken, clearTokens } from '../../../lib/api/token-store'

const BASE = 'http://localhost:3000'

function ui() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return render(<AccountPage />, { wrapper: Wrapper })
}

describe('AccountPage', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
    setRefreshToken('r-old')
    vi.restoreAllMocks()
  })

  it('saves a new display name', async () => {
    let body: unknown
    server.use(
      http.patch(`${BASE}/v1/users/me`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 'u1', email: 'jane@acme.com', displayName: 'Janet', createdAt: 'x' }, requestId: 'r' })
      }),
    )
    ui()
    const input = await screen.findByLabelText(/display name/i)
    await waitFor(() => expect((input as HTMLInputElement).value).toBe('Jane Doe'))
    await userEvent.clear(input)
    await userEvent.type(input, 'Janet')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => expect(body).toEqual({ displayName: 'Janet' }))
  })

  it('deletes the account after confirm', async () => {
    let deleted = false
    server.use(
      http.delete(`${BASE}/v1/users/me`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    ui()
    await screen.findByLabelText(/display name/i)
    await userEvent.click(screen.getByRole('button', { name: /delete account/i }))
    await waitFor(() => expect(deleted).toBe(true))
  })
})
