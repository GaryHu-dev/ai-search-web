import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/msw/server'
import { NotificationsPage } from '../NotificationsPage'

const BASE = 'http://localhost:3000'

function ui() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return render(<NotificationsPage />, { wrapper: Wrapper })
}

describe('NotificationsPage', () => {
  beforeEach(() => localStorage.clear())

  it('renders notifications from the API', async () => {
    ui()
    expect(await screen.findByText(/audit completed/i)).toBeInTheDocument()
  })

  it('filters to unread (empty) when the Unread tab is selected', async () => {
    ui()
    await screen.findByText(/audit completed/i)
    await userEvent.click(screen.getByRole('button', { name: /^unread$/i }))
    expect(await screen.findByText(/no unread notifications/i)).toBeInTheDocument()
  })

  it('calls the backend on mark-all-read', async () => {
    let hit = false
    server.use(http.post(`${BASE}/v1/notifications/read-all`, async () => {
      hit = true
      return HttpResponse.json({ data: { count: 1 }, requestId: 'r' })
    }))
    ui()
    await screen.findByText(/audit completed/i)
    await userEvent.click(screen.getByRole('button', { name: /mark all read/i }))
    await new Promise((r) => setTimeout(r, 0))
    expect(hit).toBe(true)
  })
})
