import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { NotificationsPage } from '../NotificationsPage'

const ui = () => render(<NotificationsPage />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })

describe('NotificationsPage', () => {
  it('renders grouped notifications with a review action', () => {
    ui()
    expect(screen.getByText(/1 post needs your review/i)).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /review/i })).toHaveAttribute('href', '/content')
  })

  it('filters to published when the tab is selected', async () => {
    ui()
    await userEvent.click(screen.getByRole('button', { name: /^published$/i }))
    expect(screen.queryByText(/1 post needs your review/i)).not.toBeInTheDocument()
    expect(screen.getByText(/published to brew & co/i)).toBeInTheDocument()
  })

  it('clears unread markers on mark-all-read', async () => {
    const { container } = ui()
    expect(container.querySelectorAll('.bg-hi').length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: /mark all read/i }))
    expect(container.querySelectorAll('.bg-hi').length).toBe(0)
  })
})
