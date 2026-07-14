import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { server } from '../../../test/msw/server'
import { FilesPage } from '../FilesPage'

const BASE = 'http://localhost:3000'
const file = { id: 'f1', filename: 'brand.pdf', contentType: 'application/pdf', size: 2400000, createdAt: '2026-07-06T00:00:00Z' }

function ui() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return render(<FilesPage />, { wrapper: Wrapper })
}

describe('FilesPage', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('renders files and a Load more button when more pages exist', async () => {
    server.use(http.get(`${BASE}/v1/files`, () => HttpResponse.json({ data: { items: [file], nextCursor: 'f1' }, requestId: 'r' })))
    ui()
    expect(await screen.findByText('brand.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument()
  })

  it('deletes a file after confirm', async () => {
    let deleted = false
    server.use(
      http.get(`${BASE}/v1/files`, () => HttpResponse.json({ data: { items: [file], nextCursor: null }, requestId: 'r' })),
      http.delete(`${BASE}/v1/files/f1`, () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    ui()
    await userEvent.click(await screen.findByLabelText(/delete brand.pdf/i))
    await waitFor(() => expect(deleted).toBe(true))
  })

  it('shows an empty state with no files', async () => {
    server.use(http.get(`${BASE}/v1/files`, () => HttpResponse.json({ data: { items: [], nextCursor: null }, requestId: 'r' })))
    ui()
    expect(await screen.findByText(/no files yet/i)).toBeInTheDocument()
  })
})
