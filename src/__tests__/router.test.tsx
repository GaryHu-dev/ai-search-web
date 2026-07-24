import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useRoutes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from '../router'
import { ThemeProvider } from '../lib/theme/theme-context'
import { AuthProvider } from '../lib/auth/auth-context'
import { clearTokens, setRefreshToken } from '../lib/api/token-store'

function RoutesView() {
  return useRoutes(routes)
}

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <RoutesView />
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('routing', () => {
  beforeEach(() => {
    clearTokens()
    localStorage.clear()
  })

  it('redirects anonymous users from / to /login', async () => {
    renderAt('/')
    await waitFor(() => expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument())
  })

  it('renders the shell for authenticated users', async () => {
    setRefreshToken('r-old')
    renderAt('/')
    await waitFor(() => expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0))
  })

  it('navigates between pages via the sidebar', async () => {
    setRefreshToken('r-old')
    renderAt('/')
    // Wait for the shell (authenticated) to render, then drive the sidebar.
    await waitFor(() => expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0))
    // Scope link clicks to the sidebar <nav> — the topbar bell is also a
    // "Notifications" link, so an unscoped query would be ambiguous.
    const nav = screen.getByRole('navigation')

    await userEvent.click(within(nav).getByRole('link', { name: 'Content' }))
    expect(await screen.findByRole('heading', { name: /how to store coffee beans for maximum freshness/i })).toBeInTheDocument()

    await userEvent.click(within(nav).getByRole('link', { name: 'Optimize' }))
    expect(await screen.findByLabelText(/website url/i)).toBeInTheDocument()

    await userEvent.click(within(nav).getByRole('link', { name: 'Notifications' }))
    expect(await screen.findByText(/audit completed/i)).toBeInTheDocument()

    await userEvent.click(within(nav).getByRole('link', { name: 'Account' }))
    expect(await screen.findByRole('button', { name: /delete account/i })).toBeInTheDocument()
  })

  it('toggles the collapsible sidebar', async () => {
    setRefreshToken('r-old')
    renderAt('/')
    await waitFor(() => expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0))
    await userEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(await screen.findByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })
})
