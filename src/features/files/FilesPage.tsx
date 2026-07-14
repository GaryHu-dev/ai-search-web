import { useEffect, useState } from 'react'
import { useFiles, useUploadFile, useDeleteFile, downloadFile } from './queries'
import { UploadDropzone } from './UploadDropzone'
import { FileRow } from './FileRow'
import { IconSearch, IconUpload } from '../../components/icons'
import { useToast } from '../../components/toast'
import { useConfirm } from '../../components/confirm'
import { errorText } from '../../lib/format'
import type { FileItem } from './types'

const SORTS = [
  { label: 'Newest first', value: '-createdAt' },
  { label: 'Name', value: 'filename' },
  { label: 'Largest', value: '-size' },
]

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[1fr_130px_150px_88px] items-center gap-3 border-t border-line px-[18px] py-3 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="skeleton h-[34px] w-[34px] rounded-[9px]" />
        <span className="skeleton h-3.5 w-44" />
      </div>
      <span className="skeleton h-3 w-14" />
      <span className="skeleton h-3 w-20" />
      <span className="skeleton h-[30px] w-[66px] justify-self-end" />
    </div>
  )
}

// Files screen: debounced search, sort, drag-and-drop + button upload, cursor
// "Load more" pagination, and download/delete (styled confirm dialog + toasts).
export function FilesPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('-createdAt')
  const toast = useToast()
  const confirm = useConfirm()

  // Debounce the search box so we fire one request after typing settles, not one per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const query = useFiles({ search: search || undefined, sort })
  const upload = useUploadFile()
  const del = useDeleteFile()

  const items: FileItem[] = query.data?.pages.flatMap((p) => p.items) ?? []

  async function onDelete(file: FileItem) {
    if (del.isPending) return // guard against a fast double-click firing two DELETE requests
    const yes = await confirm({
      title: 'Delete file',
      message: `Delete "${file.filename}"? This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!yes) return
    del.mutate(file.id, {
      onSuccess: () => toast('success', `Deleted ${file.filename}`),
      onError: (e) => toast('error', errorText(e)),
    })
  }

  function onDownload(file: FileItem) {
    downloadFile(file.id, file.filename).catch(() => toast('error', `Couldn't download ${file.filename}.`))
  }

  function onUpload(file: File) {
    upload.mutate(file, {
      onSuccess: () => toast('success', `Uploaded ${file.name}`),
      onError: (e) => toast('error', errorText(e)),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex w-[280px] max-w-full items-center gap-2 rounded-xl border border-line-strong bg-card px-3">
          <IconSearch className="h-4 w-4 flex-none text-faint" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search files"
            aria-label="Search files"
            className="w-full min-w-0 bg-transparent py-2.5 text-[13.5px] outline-none"
          />
        </div>
        <label className="sr-only" htmlFor="sort">Sort</label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-line-strong bg-card px-3 py-2.5 text-[13.5px]"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <UploadDropzone onUpload={onUpload} uploading={upload.isPending} />

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="overflow-x-auto">
          <div className="min-w-[540px]">
            <div className="grid grid-cols-[1fr_130px_150px_88px] gap-3 border-b border-line bg-card-2 px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-wider text-faint">
              <span>Name</span>
              <span>Size</span>
              <span>Uploaded</span>
              <span className="text-right">Actions</span>
            </div>

            {query.isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

            {!query.isLoading && !query.isError && items.map((file) => (
              <FileRow key={file.id} file={file} onDownload={onDownload} onDelete={onDelete} deleting={del.isPending} />
            ))}
          </div>
        </div>

        {query.isError && (
          <div className="px-[18px] py-12 text-center">
            <p className="font-semibold">Couldn't load your files</p>
            <p className="text-sm text-muted">{errorText(query.error)}</p>
            <button
              onClick={() => void query.refetch()}
              className="mt-3 rounded-lg border border-line-strong bg-card px-3 py-1.5 text-[13px] font-semibold hover:bg-card-2"
            >
              Try again
            </button>
          </div>
        )}

        {!query.isLoading && !query.isError && items.length === 0 && (
          <div className="flex flex-col items-center px-[18px] py-14 text-center">
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-hi-soft text-hi-deep">
              {search ? <IconSearch className="h-5 w-5" /> : <IconUpload className="h-5 w-5" />}
            </div>
            <p className="font-semibold">{search ? 'No files match your search' : 'No files yet'}</p>
            <p className="mt-0.5 text-sm text-muted">{search ? 'Try a different search.' : 'Upload your first file to get started.'}</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex items-center gap-3 border-t border-line px-[18px] py-3.5 text-[13px] text-muted">
            <span>Showing {items.length}</span>
            {query.hasNextPage && (
              <button
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="ml-auto rounded-lg border border-line-strong bg-card px-3 py-1.5 text-[13px] font-semibold text-ink hover:bg-card-2"
              >
                {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
