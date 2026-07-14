import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/msw/server'
import { useAudits, useCreateAudit, useAudit } from '../queries'

const BASE = 'http://localhost:3000'
function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useAudits', () => {
  it('passes search + limit as query params and returns items', async () => {
    let seen = ''
    server.use(
      http.get(`${BASE}/v1/audits`, ({ request }) => {
        seen = new URL(request.url).search
        return HttpResponse.json({ data: { items: [{ id: 'a1', url: 'https://x.com', status: 'COMPLETED', findings: [], error: null, createdAt: '2026-07-08T00:00:00Z' }], nextCursor: null }, requestId: 'r' })
      }),
    )
    const { result } = renderHook(() => useAudits({ search: 'x.com' }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.pages[0].items[0].id).toBe('a1'))
    expect(seen).toContain('search=x.com')
    expect(seen).toContain('limit=20')
  })
})

describe('useCreateAudit', () => {
  it('POSTs the url and returns the created audit', async () => {
    let body: unknown
    server.use(
      http.post(`${BASE}/v1/audits`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 'new1', url: 'https://acme.io/', status: 'PENDING', findings: null, error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'r' }, { status: 202 })
      }),
    )
    const { result } = renderHook(() => useCreateAudit(), { wrapper: wrapper() })
    const audit = await result.current.mutateAsync('https://acme.io/')
    expect(body).toEqual({ url: 'https://acme.io/' })
    expect(audit.status).toBe('PENDING')
  })
})

describe('useAudit', () => {
  it('is disabled when id is null', async () => {
    const { result } = renderHook(() => useAudit(null), { wrapper: wrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
  it('fetches a terminal audit and stops polling', async () => {
    server.use(
      http.get(`${BASE}/v1/audits/a2`, () =>
        HttpResponse.json({ data: { id: 'a2', url: 'https://x.com', status: 'COMPLETED', findings: [{ dimension: 'metadata', title: 'Core metadata', status: 'ok', summary: 's', detail: 'd', recommendation: 'r', basis: 'b', strength: 'advisory' }], error: null, createdAt: '2026-07-08T00:00:00Z' }, requestId: 'r' })),
    )
    const { result } = renderHook(() => useAudit('a2'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.status).toBe('COMPLETED'))
    expect(result.current.data?.findings?.[0].title).toBe('Core metadata')
  })

  it('enters error state (and stops polling) when the detail fetch fails', async () => {
    let hits = 0
    server.use(
      http.get(`${BASE}/v1/audits/bad1`, () => {
        hits += 1
        return HttpResponse.json({ statusCode: 500, message: 'Internal error' }, { status: 500 })
      }),
    )
    const { result } = renderHook(() => useAudit('bad1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(hits).toBe(1)
    // refetchInterval evaluates to false once query.state.status === 'error', so no
    // further poll should fire — wait past the 1.5s interval and confirm no retry.
    await new Promise((resolve) => setTimeout(resolve, 1700))
    expect(hits).toBe(1)
    expect(result.current.fetchStatus).toBe('idle')
  }, 10000)
})
