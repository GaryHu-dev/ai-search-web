import { Navigate, type RouteObject } from 'react-router-dom'
import type { JSX } from 'react'
import { useAuth } from './lib/auth/auth-context'
import { Spinner } from './components/Spinner'
import { AppShell } from './layouts/AppShell'
import { LoginPage } from './features/auth/LoginPage'
import { AuthCallback } from './features/auth/AuthCallback'
import { OverviewPage } from './features/overview/OverviewPage'
import { FilesPage } from './features/files/FilesPage'
import { OptimizePage } from './features/optimize/OptimizePage'
import { AccountPage } from './features/account/AccountPage'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { status } = useAuth()
  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-hi-deep">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }
  if (status === 'anonymous') return <Navigate to="/login" replace />
  return children
}

// Route table. /login is public; everything under "/" is gated by ProtectedRoute
// and rendered inside AppShell (Overview / Files / Optimize / Account).
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  // Landing route for the backend's Google OAuth redirect. Must be a real route
  // (not the catch-all) so it doesn't redirect away and strip the token fragment
  // before AuthProvider consumes it.
  { path: '/auth/callback', element: <AuthCallback /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'files', element: <FilesPage /> },
      { path: 'optimize', element: <OptimizePage /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },
  // Unknown paths bounce to "/", which then routes to login or the app by auth status.
  { path: '*', element: <Navigate to="/" replace /> },
]
