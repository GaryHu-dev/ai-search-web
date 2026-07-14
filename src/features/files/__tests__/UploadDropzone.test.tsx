import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadDropzone } from '../UploadDropzone'

describe('UploadDropzone', () => {
  it('rejects a file over 10 MB and does not call onUpload', async () => {
    const onUpload = vi.fn()
    render(<UploadDropzone onUpload={onUpload} uploading={false} />)
    const big = new File([new Uint8Array(11 * 1024 * 1024)], 'big.zip', { type: 'application/zip' })
    await userEvent.upload(screen.getByLabelText('Choose file to upload'), big)
    expect(screen.getByText(/over the 10 MB limit/i)).toBeInTheDocument()
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('accepts a small file', async () => {
    const onUpload = vi.fn()
    render(<UploadDropzone onUpload={onUpload} uploading={false} />)
    await userEvent.upload(screen.getByLabelText('Choose file to upload'), new File(['hi'], 'note.txt'))
    expect(onUpload).toHaveBeenCalledOnce()
    expect(onUpload.mock.calls[0][0].name).toBe('note.txt')
  })

  it('ignores picks while an upload is already in flight', async () => {
    const onUpload = vi.fn()
    render(<UploadDropzone onUpload={onUpload} uploading />)
    await userEvent.upload(screen.getByLabelText('Choose file to upload'), new File(['hi'], 'note.txt'))
    expect(onUpload).not.toHaveBeenCalled()
  })
})
