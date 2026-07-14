import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api/client'
import type { Audit, AuditsPageData } from './types'

// Server-state hooks for the Optimize (GEO audit) feature, all built on apiFetch.
// The audit lifecycle is async: create returns a PENDING row, then useAudit polls
// the detail endpoint until the status is terminal (COMPLETED/FAILED).

export function useAudits(params: { search?: string }) {
  return useInfiniteQuery({
    queryKey: ['audits', params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams({ limit: '20' })
      if (params.search) q.set('search', params.search)
      if (pageParam) q.set('cursor', pageParam)
      return apiFetch<AuditsPageData>(`/v1/audits?${q.toString()}`)
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

export function useCreateAudit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => apiFetch<Audit>('/v1/audits', { method: 'POST', body: { url } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audits'] }),
  })
}

const isTerminal = (s?: string) => s === 'COMPLETED' || s === 'FAILED'

export function useAudit(id: string | null) {
  return useQuery({
    queryKey: ['audit', id],
    enabled: id != null,
    queryFn: () => apiFetch<Audit>(`/v1/audits/${id}`),
    // Poll every 1.5s while working; stop once terminal OR once the fetch itself errors
    // (a 404/broken id leaves data undefined, which must not poll forever).
    refetchInterval: (query) =>
      query.state.status === 'error' || isTerminal(query.state.data?.status) ? false : 1500,
  })
}
