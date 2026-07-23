import { Navigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth/auth-context'
import { AuthCard } from './AuthCard'

const GLOW =
  'radial-gradient(46% 40% at 50% -8%, color-mix(in srgb, var(--hi) 18%, transparent), transparent 70%),' +
  'radial-gradient(40% 34% at 88% 108%, color-mix(in srgb, var(--c1) 14%, transparent), transparent 70%)'
const GRID =
  'linear-gradient(var(--line) 1px, transparent 1px),' +
  'linear-gradient(90deg, var(--line) 1px, transparent 1px)'

// Centered-minimal sign-in (Omniport). Google-only auth lives in AuthCard.
export function LoginPage() {
  const { status } = useAuth()
  if (status === 'authenticated') return <Navigate to="/" replace />
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg p-6">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: GLOW }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[.35]"
        style={{ backgroundImage: GRID, backgroundSize: '44px 44px', WebkitMaskImage: 'radial-gradient(60% 55% at 50% 42%, #000, transparent 85%)', maskImage: 'radial-gradient(60% 55% at 50% 42%, #000, transparent 85%)' }}
      />

      <div className="relative z-[1] flex w-full max-w-[452px] flex-col items-center text-center">
        <div className="mb-7 flex items-center gap-2.5 text-[18px] font-bold">
          <span className="grid h-8 w-8 place-items-center grad-avatar rounded-[9px] text-[15px] shadow-[0_8px_20px_-8px_rgba(91,75,240,.6)]">◆</span>
          Omniport
          <span className="rounded-md bg-hi-soft px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-hi-deep">beta</span>
        </div>
        <AuthCard />
        <p className="mt-6 max-w-[320px] text-[11.5px] leading-relaxed text-faint">
          By continuing you agree to our <a href="#" className="text-muted underline underline-offset-2">Terms</a> &amp;{' '}
          <a href="#" className="text-muted underline underline-offset-2">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
