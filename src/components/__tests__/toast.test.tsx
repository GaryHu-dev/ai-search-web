import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '../toast'

function Trigger({ type }: { type: 'success' | 'error' }) {
  const toast = useToast()
  return <button onClick={() => toast(type, type === 'error' ? 'Upload failed' : 'Saved')}>fire</button>
}

describe('ToastProvider', () => {
  it('shows a toast and dismisses it on click', async () => {
    render(<ToastProvider><Trigger type="success" /></ToastProvider>)
    await userEvent.click(screen.getByText('fire'))
    expect(screen.getByText('Saved')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Dismiss'))
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('announces error toasts assertively (role=alert)', async () => {
    render(<ToastProvider><Trigger type="error" /></ToastProvider>)
    await userEvent.click(screen.getByText('fire'))
    expect(screen.getByRole('alert')).toHaveTextContent('Upload failed')
  })
})
