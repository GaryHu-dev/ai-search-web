import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api/client'
import type { Notification, NotificationsPageData } from './types'

// Server-state hooks for notifications, all built on apiFetch.
// Backend: GET /v1/notifications (cursor page, optional ?unread), unread-count,
// POST read-all, PATCH :id/read.

const LIST_KEY = 'notifications'
const COUNT_KEY = ['notifications', 'unread-count'] as const

export function useNotifications(params: { unread?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: [LIST_KEY, { unread: params.unread ?? false }],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams({ limit: '30' })
      if (params.unread) q.set('unread', 'true')
      if (pageParam) q.set('cursor', pageParam)
      return apiFetch<NotificationsPageData>(`/v1/notifications?${q.toString()}`)
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: COUNT_KEY,
    queryFn: () => apiFetch<{ count: number }>('/v1/notifications/unread-count'),
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<Notification>(`/v1/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [LIST_KEY] })
      void qc.invalidateQueries({ queryKey: COUNT_KEY })
    },
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<{ count: number }>('/v1/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [LIST_KEY] })
      void qc.invalidateQueries({ queryKey: COUNT_KEY })
    },
  })
}
