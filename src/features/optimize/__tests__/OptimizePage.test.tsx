import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { OptimizePage } from '../OptimizePage'

function ui() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return render(<OptimizePage />, { wrapper: Wrapper })
}

describe('OptimizePage', () => {
  beforeEach(() => localStorage.clear())

  it('renders the analyze form and an empty run history', async () => {
    ui()
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument()
    expect(await screen.findByText(/no audits yet/i)).toBeInTheDocument()
  })

  it('runs an audit and renders its findings', async () => {
    ui()
    await userEvent.type(screen.getByLabelText(/website url/i), 'acme.io')
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }))
    expect(await screen.findByText(/add a concise answer/i)).toBeInTheDocument()
  })

  it('rejects an empty URL', async () => {
    ui()
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }))
    expect(await screen.findByText(/enter a valid website url/i)).toBeInTheDocument()
  })
})
