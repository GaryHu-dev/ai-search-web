import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api/client'
import type { User } from '../../lib/auth/auth-context'

export function useUpdateProfile() {
  // The updated user is written back into auth-context via setUser() by the
  // caller, which is the single source of truth for the current user.
  return useMutation({
    mutationFn: (input: { displayName: string }) =>
      apiFetch<User>('/v1/users/me', { method: 'PATCH', body: input }),
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => apiFetch<void>('/v1/users/me', { method: 'DELETE' }),
  })
}
