import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/msw/server'
import { OptimizePage } from '../OptimizePage'

const BASE = 'http://localhost:3000'
function wrap(ui: ReactNode, initialEntries = ['/optimize']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OptimizePage', () => {
  it('rejects an empty/invalid url without calling the API', async () => {
    let posted = false
    server.use(http.post(`${BASE}/v1/audits`, () => { posted = true; return HttpResponse.json({ data: {}, requestId: 'r' }, { status: 202 }) }))
    wrap(<OptimizePage />)
    await userEvent.click(screen.getByRole('button', { name: /Analyze/i }))
    expect(await screen.findByText(/Enter a valid website/i)).toBeInTheDocument()
    expect(posted).toBe(false)
  })

  it('submits a normalized url and shows the result', async () => {
    let body: unknown
    server.use(
      http.post(`${BASE}/v1/audits`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 'r1', url: 'https://acme.io/', status: 'PENDING', findings: null, error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'r' }, { status: 202 })
      }),
      http.get(`${BASE}/v1/audits/r1`, () =>
        HttpResponse.json({ data: { id: 'r1', url: 'https://acme.io/', status: 'COMPLETED', findings: [{ dimension: 'llms', title: 'llms.txt', status: 'ok', summary: 'present', detail: 'd', recommendation: 'r', basis: 'b', strength: 'advisory' }], error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'r' })),
    )
    wrap(<OptimizePage />)
    await userEvent.type(screen.getByLabelText(/Website URL/i), 'acme.io')
    await userEvent.click(screen.getByRole('button', { name: /Analyze/i }))
    expect(await screen.findByText('llms.txt')).toBeInTheDocument()
    expect(body).toEqual({ url: 'https://acme.io/' })
  })
})
