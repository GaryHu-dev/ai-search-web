import { useAuth } from '../../lib/auth/auth-context'
import { startGoogleLogin } from './google'

const PERKS = [
  'Connect Shopify & WordPress in one click',
  'Auto-published, optimized posts on your schedule',
  'A monthly report of traffic, rankings & AI citations',
]

// Google-only sign-in. Backend-driven OAuth: the button does a full-page navigate
// to the backend, which redirects to Google and back; AuthProvider establishes the
// session from the URL fragment on the /auth/callback landing.
export function AuthCard() {
  const { googleError } = useAuth()

  return (
    <div className="w-full rounded-[20px] border border-line bg-card p-8 shadow-[0_30px_70px_-40px_rgba(20,25,72,.5)]">
      <h2 className="text-[26px] font-bold tracking-tight">Sign in to Omniport</h2>
      <p className="mb-6 mt-2 text-[15px] leading-relaxed text-muted">
        Autopilot SEO + GEO content for your Shopify &amp; WordPress stores.
      </p>

      {googleError && (
        <div role="alert" className="mb-4 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {googleError}
        </div>
      )}

      <button type="button" onClick={startGoogleLogin}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line-strong bg-card py-[15px] text-[15.5px] font-semibold hover:border-hi hover:bg-card-2">
        <svg aria-hidden="true" className="h-[19px] w-[19px]" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
        Continue with Google
      </button>

      <p className="mt-4 text-center text-[13px] text-faint">No passwords — we only use Google to sign you in.</p>

      <div className="my-5 flex items-center gap-3 text-[11.5px] text-faint">
        <span className="h-px flex-1 bg-line" />what you get<span className="h-px flex-1 bg-line" />
      </div>
      <ul className="flex flex-col gap-3 text-left">
        {PERKS.map((p) => (
          <li key={p} className="flex items-center gap-3 text-[13.5px] text-muted">
            <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-hi-soft text-hi-deep">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-[22px] flex justify-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-1.5 text-[12.5px] font-semibold text-muted">🛍 Shopify</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-1.5 text-[12.5px] font-semibold text-muted">⬛ WordPress</span>
      </div>
    </div>
  )
}
