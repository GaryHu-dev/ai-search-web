import { apiUrl } from '../../lib/api/client'

// Backend-driven Google OAuth (authorization-code / redirect flow). The frontend
// only navigates the browser to the backend, which redirects to Google's consent
// screen and, after the callback, redirects back with the session tokens in the
// URL fragment (handled on load by AuthProvider). No Google client id or GIS
// script lives in the frontend anymore.
export function startGoogleLogin(): void {
  window.location.href = apiUrl('/v1/auth/google')
}
