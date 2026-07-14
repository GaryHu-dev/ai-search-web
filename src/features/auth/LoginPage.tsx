import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/auth-context'
import { Showcase } from './Showcase'
import { AuthCard } from './AuthCard'

export function LoginPage() {
  const { status } = useAuth()
  if (status === 'authenticated') return <Navigate to="/" replace />
  return (
    <div className="grid min-h-dvh md:grid-cols-[1.2fr_1fr]">
      <Showcase />
      <div className="flex items-center justify-center bg-bg p-8">
        <AuthCard />
      </div>
    </div>
  )
}
