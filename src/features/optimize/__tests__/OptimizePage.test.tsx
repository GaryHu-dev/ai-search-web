import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OptimizePage } from '../OptimizePage'

const ui = () => render(<OptimizePage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

describe('OptimizePage', () => {
  it('renders SEO/GEO health scores and prioritized opportunities', () => {
    ui()
    expect(screen.getByText(/SEO health/i)).toBeInTheDocument()
    expect(screen.getByText(/GEO cite-readiness/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /opportunities/i })).toBeInTheDocument()
    expect(screen.getByText(/Rank for/i)).toBeInTheDocument()
  })

  it('routes the generate opportunity to the content workbench', () => {
    ui()
    expect(screen.getByRole('link', { name: /generate/i })).toHaveAttribute('href', '/content')
  })

  it('shows AI answer coverage with cited state', () => {
    ui()
    expect(screen.getByRole('heading', { name: /AI answer coverage/i })).toBeInTheDocument()
    expect(screen.getByText(/Not cited — competitor is/i)).toBeInTheDocument()
  })
})
