import { formatBytes, formatDate, fileExt } from '../../lib/format'
import { IconDownload, IconTrash } from '../../components/icons'
import type { FileItem } from './types'

const TILE: Record<string, string> = {
  PDF: 'tile-pdf',
  DOC: 'tile-doc',
  DOCX: 'tile-doc',
  ZIP: 'tile-zip',
  PNG: 'tile-img',
  JPG: 'tile-img',
  CSV: 'tile-csv',
}

export function FileRow({
  file,
  onDownload,
  onDelete,
  deleting,
}: {
  file: FileItem
  onDownload: (f: FileItem) => void
  onDelete: (f: FileItem) => void
  deleting?: boolean
}) {
  const ext = fileExt(file.filename)
  const tile = TILE[ext] ?? 'tile-default'
  return (
    <div className="grid grid-cols-[1fr_130px_150px_88px] items-center gap-3 border-t border-line px-[18px] py-3 first:border-t-0 hover:bg-card-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px] text-[9.5px] font-bold ${tile}`}>
          {ext.slice(0, 4)}
        </span>
        <span className="min-w-0 truncate text-[13.5px] font-medium">{file.filename}</span>
      </div>
      <span className="text-[13px] text-muted tabular-nums">{formatBytes(file.size)}</span>
      <span className="text-[13px] text-muted">{formatDate(file.createdAt)}</span>
      <span className="flex justify-end gap-1.5">
        <button
          aria-label={`Download ${file.filename}`}
          onClick={() => onDownload(file)}
          className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-line bg-card text-muted hover:bg-card-2 hover:text-ink"
        >
          <IconDownload />
        </button>
        <button
          aria-label={`Delete ${file.filename}`}
          onClick={() => { if (!deleting) onDelete(file) }}
          disabled={deleting}
          className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-line bg-card text-muted hover:border-bad hover:text-bad disabled:opacity-60"
        >
          <IconTrash />
        </button>
      </span>
    </div>
  )
}
