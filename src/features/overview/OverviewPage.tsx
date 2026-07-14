import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { normalizeUrl } from '../optimize/url'
import { useAuth } from '../../lib/auth/auth-context'

const ENGINES: { name: string; color: string; pct: number }[] = [
  { name: 'ChatGPT', color: '#12C7B6', pct: 48 },
  { name: 'Perplexity', color: '#3E7BFA', pct: 39 },
  { name: 'Overviews', color: '#E1893D', pct: 27 },
]

function VisibilityCard() {
  return (
    <div className="rounded-2xl border border-line bg-card p-[18px] shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
      <div className="mb-3.5 flex items-baseline gap-2.5">
        <span
          className="text-[28px] font-bold leading-none tracking-[-.03em]"
          style={{ background: 'linear-gradient(120deg,#5B4BF0,#3E7BFA)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
        >
          42%
        </span>
        <span className="text-[11px] leading-tight text-muted">of AI answers in your<br />category mention you</span>
      </div>
      <div className="flex flex-col gap-2">
        {ENGINES.map((e) => (
          <div key={e.name} className="flex items-center gap-2">
            <span className="flex w-[74px] items-center gap-1.5 text-[11.5px]">
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: e.color }} />{e.name}
            </span>
            <span className="h-[6px] flex-1 overflow-hidden rounded bg-[var(--line)]">
              <span className="block h-full rounded" style={{ width: `${e.pct}%`, background: e.color }} />
            </span>
            <span className="w-8 text-right text-[11px] font-semibold tabular-nums" style={{ color: e.color }}>{e.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Dashboard landing. The GEO "add your site" hero is a working Analyze form that
// routes into a real GEO audit; the VisibilityCard previews mock data for the
// metric the product will track once it ships.
export function OverviewPage() {
  const { user } = useAuth()
  const name = user?.displayName ?? user?.email ?? 'there'
  const navigate = useNavigate()
  const [site, setSite] = useState('')
  function analyze(e: React.FormEvent) {
    e.preventDefault()
    const url = normalizeUrl(site)
    navigate(url ? `/optimize?url=${encodeURIComponent(url)}` : '/optimize')
  }

  return (
    <div className="flex flex-col gap-[22px]">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {name} 👋</h2>
        <p className="text-[14.5px] text-muted">Here's your workspace. Add a site to start tracking your AI visibility.</p>
      </div>

      <section className="relative grid items-center gap-7 overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-[0_10px_30px_-20px_rgba(14,19,48,.3)] md:grid-cols-[1fr_296px]">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(109,94,252,.22), transparent 68%)' }} />
        <div className="relative">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-hi-soft px-2.5 py-1 text-[11.5px] font-semibold text-hi-deep">✦ New</span>
          <h3 className="text-xl font-bold tracking-tight">Start tracking your AI visibility</h3>
          <p className="mb-4 mt-1.5 max-w-[52ch] text-[14.5px] text-muted">
            Add your website and GEO shows which AI answers{' '}
            <mark className="rounded bg-hi-soft px-1 font-semibold text-hi-deep">mention you</mark> — and which name competitors instead.
          </p>
          <form onSubmit={analyze} className="flex max-w-[520px] gap-2.5" noValidate>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong bg-card px-3">
              <span className="text-[13px] text-faint">https://</span>
              <input
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="yourdomain.com"
                className="w-full min-w-0 bg-transparent py-3 text-[14.5px] outline-none"
                aria-label="Website URL"
              />
            </div>
            <button type="submit" className="grad-primary rounded-xl px-4 py-3 text-[14px] font-semibold">Analyze</button>
          </form>
        </div>
        <div className="relative">
          <VisibilityCard />
        </div>
      </section>

      <div className="grid gap-[18px] md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="text-[15px] font-bold">Files</span>
            <Link to="/files" className="ml-auto border-b-2 border-hi text-[13px] font-semibold">Manage</Link>
          </div>
          <p className="text-sm text-muted">Upload and manage the source files behind your content.</p>
        </section>
        <section className="rounded-2xl border border-line bg-card p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="text-[15px] font-bold">Account</span>
            <Link to="/account" className="ml-auto border-b-2 border-hi text-[13px] font-semibold">Manage</Link>
          </div>
          <p className="text-sm text-muted">{user?.email}</p>
        </section>
      </div>
    </div>
  )
}
