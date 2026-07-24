import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ContentPage } from '../ContentPage'

const ui = () => render(<ContentPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

describe('ContentPage', () => {
  it('renders the generated post with SEO and GEO panels', () => {
    ui()
    expect(screen.getByRole('heading', { name: /how to store coffee beans for maximum freshness/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^SEO$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /GEO · cite-ready/i })).toBeInTheDocument()
  })

  it('offers approve and regenerate actions', () => {
    ui()
    expect(screen.getByRole('button', { name: /approve & schedule/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument()
  })
})
