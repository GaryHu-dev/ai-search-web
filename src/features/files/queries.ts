import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api/client'
import type { FileItem, FilesPageData } from './types'

// Server-state hooks for the Files feature, all built on apiFetch. useFiles is an
// infinite query driving cursor pagination; the mutations invalidate ['files'] so
// the list refetches after an upload/delete.
export function useFiles(params: { search?: string; sort?: string }) {
  return useInfiniteQuery({
    queryKey: ['files', params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams({ limit: '20' })
      if (params.sort) q.set('sort', params.sort)
      if (params.search) q.set('search', params.search)
      if (pageParam) q.set('cursor', pageParam)
      return apiFetch<FilesPageData>(`/v1/files?${q.toString()}`)
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

export function useUploadFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      return apiFetch<FileItem>('/v1/files', { method: 'POST', body: fd })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}

export function useDeleteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/v1/files/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files'] }),
  })
}

export async function downloadFile(id: string, filename: string): Promise<void> {
  const res = await apiFetch<Response>(`/v1/files/${id}/download`, { raw: true })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Defer revoke so the browser has started reading the blob before the URL is invalidated.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
