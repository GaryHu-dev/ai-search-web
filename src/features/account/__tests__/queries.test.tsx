import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/msw/server'
import { useUpdateProfile } from '../queries'

const BASE = 'http://localhost:3000'
function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useUpdateProfile', () => {
  it('PATCHes the display name', async () => {
    let body: unknown
    server.use(
      http.patch(`${BASE}/v1/users/me`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { id: 'u1', email: 'j@a.com', displayName: 'New', createdAt: 'x' }, requestId: 'r' })
      }),
    )
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: wrapper() })
    await act(async () => {
      await result.current.mutateAsync({ displayName: 'New' })
    })
    expect(body).toEqual({ displayName: 'New' })
  })
})
