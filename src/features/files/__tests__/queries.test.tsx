import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/msw/server'
import { useFiles } from '../queries'

const BASE = 'http://localhost:3000'
function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useFiles', () => {
  it('loads the first page of files', async () => {
    server.use(
      http.get(`${BASE}/v1/files`, () =>
        HttpResponse.json({
          data: {
            items: [{ id: 'f1', filename: 'a.pdf', contentType: 'application/pdf', size: 1024, createdAt: '2026-07-06T00:00:00Z' }],
            nextCursor: null,
          },
          requestId: 'r',
        })),
    )
    const { result } = renderHook(() => useFiles({}), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.data?.pages[0].items[0].filename).toBe('a.pdf'))
  })

  it('passes search and sort as query params', async () => {
    let seen = ''
    server.use(
      http.get(`${BASE}/v1/files`, ({ request }) => {
        seen = new URL(request.url).search
        return HttpResponse.json({ data: { items: [], nextCursor: null }, requestId: 'r' })
      }),
    )
    const { result } = renderHook(() => useFiles({ search: 'brand', sort: '-size' }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(seen).toContain('search=brand')
    expect(seen).toContain('sort=-size')
  })
})
