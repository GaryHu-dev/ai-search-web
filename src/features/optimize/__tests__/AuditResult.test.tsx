import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/msw/server'
import { AuditResult } from '../AuditResult'

const BASE = 'http://localhost:3000'
function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

const finding = {
  dimension: 'crawler', title: 'AI crawler access', status: 'needs_work' as const,
  summary: 'GPTBot is blocked', detail: 'robots.txt disallows GPTBot', recommendation: 'Allow GPTBot',
  basis: 'robots.txt', strength: 'hard' as const,
}

describe('AuditResult', () => {
  it('shows findings when the audit is COMPLETED', async () => {
    server.use(http.get(`${BASE}/v1/audits/c1`, () =>
      HttpResponse.json({ data: { id: 'c1', url: 'https://x.com', status: 'COMPLETED', findings: [finding], error: null, createdAt: '2026-07-08T00:00:00Z' }, requestId: 'r' })))
    wrap(<AuditResult id="c1" />)
    await screen.findByText('AI crawler access')
    expect(screen.getByText('Allow GPTBot')).toBeInTheDocument()
  })

  it('shows a working state while PROCESSING', async () => {
    server.use(http.get(`${BASE}/v1/audits/p1`, () =>
      HttpResponse.json({ data: { id: 'p1', url: 'https://x.com', status: 'PROCESSING', findings: null, error: null, createdAt: '2026-07-08T00:00:00Z' }, requestId: 'r' })))
    wrap(<AuditResult id="p1" />)
    await waitFor(() => expect(screen.getByText(/Analyzing/i)).toBeInTheDocument())
  })

  it('shows the error when FAILED', async () => {
    server.use(http.get(`${BASE}/v1/audits/f1`, () =>
      HttpResponse.json({ data: { id: 'f1', url: 'https://x.com', status: 'FAILED', findings: null, error: 'Could not reach site', createdAt: '2026-07-08T00:00:00Z' }, requestId: 'r' })))
    wrap(<AuditResult id="f1" />)
    await screen.findByText(/Could not reach site/i)
  })

  it('shows the hook-error UI when the fetch itself fails (distinct from a FAILED audit status)', async () => {
    server.use(http.get(`${BASE}/v1/audits/e1`, () =>
      HttpResponse.json({ statusCode: 500, message: 'Internal error' }, { status: 500 })))
    wrap(<AuditResult id="e1" />)
    await screen.findByText(/Couldn't load this audit/i)
  })
})
