import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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
    await waitFor(() => expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument())
  })

  it('renders the shell for authenticated users', async () => {
    setRefreshToken('r-old')
    renderAt('/')
    await waitFor(() => expect(screen.getAllByText(/overview/i).length).toBeGreaterThan(0))
  })
})
