import { useRef, useState } from 'react'
import { IconUpload } from '../../components/icons'
import { Spinner } from '../../components/Spinner'

const MAX_BYTES = 10 * 1024 * 1024

export function UploadDropzone({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function pick(file: File | undefined) {
    if (!file || uploading) return // ignore drops/picks while an upload is in flight
    if (file.size > MAX_BYTES) {
      setError('That file is over the 10 MB limit. Choose a smaller file.')
      return
    }
    setError(null)
    onUpload(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          pick(e.dataTransfer.files?.[0])
        }}
        className="flex items-center gap-3.5 rounded-2xl border border-dashed border-line-strong bg-card px-5 py-4 text-muted"
      >
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-hi-soft text-hi-deep"><IconUpload className="h-[18px] w-[18px]" /></span>
        <div>
          <b className="text-sm font-semibold text-ink">Drag files here to upload</b>
          <div className="text-[12.5px]">or browse — up to 10 MB each</div>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="grad-primary ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] font-semibold disabled:opacity-60"
        >
          {uploading && <Spinner className="h-3.5 w-3.5" />}
          {uploading ? 'Uploading…' : 'Upload file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          aria-label="Choose file to upload"
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = '' // allow re-selecting the same filename
          }}
        />
      </div>
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
    </div>
  )
}
