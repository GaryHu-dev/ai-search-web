import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { NotificationsBell } from '../NotificationsBell'

function ui() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider>
  )
  return render(<NotificationsBell />, { wrapper: Wrapper })
}

describe('NotificationsBell', () => {
  beforeEach(() => localStorage.clear())

  it('shows the unread count on the bell', async () => {
    ui()
    expect(await screen.findByRole('button', { name: /1 unread/i })).toBeInTheDocument()
  })

  it('opens a preview with recent notifications and a link to the full page', async () => {
    ui()
    await userEvent.click(await screen.findByRole('button', { name: /notifications/i }))
    expect(await screen.findByText(/audit completed/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see all/i })).toHaveAttribute('href', '/notifications')
  })
})
