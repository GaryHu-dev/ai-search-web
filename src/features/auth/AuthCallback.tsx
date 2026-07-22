import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/auth-context'
import { Spinner } from '../../components/Spinner'

// Landing route for the backend's Google OAuth redirect
// (GOOGLE_POST_LOGIN_REDIRECT = /auth/callback). The backend puts the session
// tokens in the URL fragment; AuthProvider reads them on load and flips `status`.
// This page must NOT navigate on mount — doing so would strip the fragment before
// AuthProvider reads it — so it just waits for the resulting status, then routes.
export function AuthCallback() {
  const { status } = useAuth()
  if (status === 'authenticated') return <Navigate to="/" replace />
  if (status === 'anonymous') return <Navigate to="/login" replace /> // failed / no tokens → show login (with googleError)
  return (
    <div className="grid min-h-dvh place-items-center bg-bg text-hi-deep">
      <div className="flex items-center gap-3 text-muted">
        <Spinner className="h-5 w-5" /> Signing you in…
      </div>
    </div>
  )
}
