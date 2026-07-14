import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileRow } from '../FileRow'
import type { FileItem } from '../types'

const file: FileItem = {
  id: 'f1',
  filename: 'brand.pdf',
  contentType: 'application/pdf',
  size: 2400000,
  createdAt: '2026-07-06T00:00:00Z',
}

describe('FileRow', () => {
  it('disables the delete button while a delete is in flight and ignores clicks', async () => {
    const onDelete = vi.fn()
    render(<FileRow file={file} onDownload={vi.fn()} onDelete={onDelete} deleting />)

    const deleteButton = screen.getByLabelText(/delete brand.pdf/i)
    expect(deleteButton).toBeDisabled()

    await userEvent.click(deleteButton)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('calls onDelete when not in flight', async () => {
    const onDelete = vi.fn()
    render(<FileRow file={file} onDownload={vi.fn()} onDelete={onDelete} deleting={false} />)

    const deleteButton = screen.getByLabelText(/delete brand.pdf/i)
    expect(deleteButton).not.toBeDisabled()

    await userEvent.click(deleteButton)
    expect(onDelete).toHaveBeenCalledWith(file)
  })
})
