import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '../DashboardPage'

const ui = () => render(<DashboardPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

describe('DashboardPage', () => {
  it('renders the autopilot hero and headline metrics', () => {
    ui()
    expect(screen.getByRole('heading', { name: /your content is running itself/i })).toBeInTheDocument()
    expect(screen.getByText(/organic traffic/i)).toBeInTheDocument()
    expect(screen.getByText(/AI citations · GEO/i)).toBeInTheDocument()
  })

  it('shows the content pipeline and a generate-post entry', () => {
    ui()
    expect(screen.getByText(/how to store coffee beans for freshness/i)).toBeInTheDocument()
    const generate = screen.getByRole('link', { name: /generate a post/i })
    expect(generate).toHaveAttribute('href', '/content')
  })
})
