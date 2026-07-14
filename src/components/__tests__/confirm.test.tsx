import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider, useConfirm } from '../confirm'

function Harness({ onResult }: { onResult: (v: boolean) => void }) {
  const confirm = useConfirm()
  return (
    <button onClick={async () => onResult(await confirm({ title: 'Delete', message: 'Sure?', confirmLabel: 'Yes' }))}>go</button>
  )
}

function setup() {
  const results: boolean[] = []
  render(
    <ConfirmProvider>
      <Harness onResult={(v) => results.push(v)} />
    </ConfirmProvider>,
  )
  return results
}

describe('ConfirmProvider', () => {
  it('resolves true when confirmed', async () => {
    const results = setup()
    await userEvent.click(screen.getByText('go'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await waitFor(() => expect(results).toEqual([true]))
  })

  it('resolves false on Cancel and on Escape', async () => {
    const results = setup()
    await userEvent.click(screen.getByText('go'))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(results).toEqual([false]))

    await userEvent.click(screen.getByText('go'))
    await screen.findByRole('dialog')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(results).toEqual([false, false]))
  })

  it('resolves a superseded dialog as false when a new confirm opens', async () => {
    const results = setup()
    await userEvent.click(screen.getByText('go'))
    await userEvent.click(screen.getByText('go')) // opens a second before settling the first
    await waitFor(() => expect(results).toEqual([false])) // the first request was auto-cancelled
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await waitFor(() => expect(results).toEqual([false, true]))
  })
})
