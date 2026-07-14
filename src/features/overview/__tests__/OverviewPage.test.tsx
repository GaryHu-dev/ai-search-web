import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { OverviewPage } from '../OverviewPage'

// Minimal auth stub: OverviewPage reads useAuth().user for the greeting.
vi.mock('../../../lib/auth/auth-context', () => ({
  useAuth: () => ({ user: { email: 'jane@acme.com', displayName: 'Jane' } }),
}))

// Probe reads the *router's* current location (via useLocation), not
// window.location — under MemoryRouter, navigation updates in-memory
// history and never touches window.location, so asserting on the
// rendered destination route is the reliable way to confirm navigation.
function Probe() {
  const location = useLocation()
  return <div>OPTIMIZE {location.search}</div>
}

function wrap() {
  return render(
    <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/optimize" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OverviewPage Analyze', () => {
  it('routes to /optimize with the typed url when Analyze is clicked', async () => {
    wrap()
    await userEvent.type(screen.getByLabelText('Website URL'), 'acme.io')
    await userEvent.click(screen.getByRole('button', { name: 'Analyze' }))
    const probe = await screen.findByText(/OPTIMIZE/)
    expect(probe).toBeInTheDocument()
    expect(probe.textContent).toContain('url=')
    expect(probe.textContent).toContain(encodeURIComponent('https://acme.io'))
  })
})
