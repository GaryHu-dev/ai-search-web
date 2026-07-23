import { Link } from 'react-router-dom'

// Optimize: prioritized SEO + GEO opportunities for the connected site, plus
// AI-answer coverage. Static/presentational for now.

function ScoreCard({ value, color, title, note }: { value: number; color: string; title: string; note: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-card p-[17px] shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
      <div
        className="relative grid h-[66px] w-[66px] flex-none place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${value}%, var(--card-2) 0)` }}
      >
        <span className="absolute inset-[6px] rounded-full bg-card" />
        <b className="relative text-lg font-extrabold">{value}</b>
      </div>
      <div>
        <div className="text-[15px] font-bold">{title}</div>
        <div className="text-[13px] text-muted">{note}</div>
      </div>
    </div>
  )
}

type Opp = { kind: 'seo' | 'geo'; icon: JSX.Element; title: string; desc: string; impact: 'High' | 'Medium'; action: string; to?: string }
const search = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" /></svg>
const star = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 8.7l5.4-.8z" strokeLinejoin="round" /></svg>
const lines = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 7h16M4 12h10M4 17h7" /></svg>

const OPPS: Opp[] = [
  { kind: 'seo', icon: search, title: 'Rank for “best coffee grinder”', desc: "You're #14 — competitors have in-depth guides. Generate one to compete.", impact: 'High', action: 'Generate', to: '/content' },
  { kind: 'geo', icon: star, title: 'Add FAQ schema to 3 posts', desc: 'Structured data makes these eligible to be cited in AI answers.', impact: 'High', action: 'Fix' },
  { kind: 'seo', icon: lines, title: 'Expand thin content: “Coffee storage tips”', desc: 'Only 320 words — expand to fully answer the query and rank higher.', impact: 'Medium', action: 'Expand' },
  { kind: 'seo', icon: lines, title: '12 pages missing meta descriptions', desc: 'Auto-write descriptions to improve click-through from search.', impact: 'Medium', action: 'Fix all' },
]

const COVERAGE: { q: string; cited: boolean; note: string }[] = [
  { q: '“How should you store coffee beans?”', cited: true, note: 'Cited · ChatGPT' },
  { q: '“What grind size for pour over?”', cited: true, note: 'Cited · Perplexity' },
  { q: '“Best coffee grinder under $200?”', cited: false, note: 'Not cited — competitor is' },
]

export function OptimizePage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13.5px] text-muted">
        What to improve on <b className="text-ink"><span className="mr-0.5 inline-grid h-4 w-4 place-items-center rounded bg-[#16A34A] align-[-3px] text-[9px] font-bold text-white">S</span> Brew &amp; Co</b> to win more search traffic and AI citations.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <ScoreCard value={88} color="var(--c2)" title="SEO health" note="Strong. 12 pages still missing meta descriptions." />
        <ScoreCard value={74} color="var(--c3)" title="GEO cite-readiness" note="Add structured data to be quoted by AI answers." />
      </div>

      {/* opportunities */}
      <section className="rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
        <div className="flex items-center gap-2.5 border-b border-line px-[17px] py-3.5">
          <h3 className="text-sm font-bold">Opportunities</h3>
          <span className="ml-auto text-[12.5px] text-faint">ranked by impact</span>
        </div>
        {OPPS.map((o) => (
          <div key={o.title} className="flex items-center gap-3.5 border-t border-line px-[17px] py-3.5 first:border-t-0">
            <span className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-[9px] ${o.kind === 'seo' ? 'bg-[color-mix(in_srgb,var(--c2)_14%,transparent)] text-c2' : 'bg-[color-mix(in_srgb,var(--c3)_15%,transparent)] text-c3'}`}>{o.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold">{o.title}</div>
              <div className="text-[12.5px] text-muted">{o.desc}</div>
            </div>
            <span className={`rounded-md px-2 py-[3px] text-[10.5px] font-bold uppercase tracking-wide ${o.impact === 'High' ? 'bg-bad-soft text-bad' : 'bg-[color-mix(in_srgb,var(--c3)_14%,transparent)] text-c3'}`}>{o.impact}</span>
            {o.to ? (
              <Link to={o.to} className="grad-primary rounded-lg px-3 py-2 text-[13px] font-semibold">{o.action}</Link>
            ) : (
              <button className="rounded-lg border border-line-strong bg-card px-3 py-2 text-[13px] font-semibold hover:bg-card-2">{o.action}</button>
            )}
          </div>
        ))}
      </section>

      {/* AI answer coverage */}
      <section className="rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
        <div className="flex items-center gap-2.5 border-b border-line px-[17px] py-3.5">
          <h3 className="text-sm font-bold">AI answer coverage</h3>
          <span className="ml-auto text-[12.5px] text-faint">are you cited?</span>
        </div>
        {COVERAGE.map((c) => (
          <div key={c.q} className="flex items-center gap-3 border-t border-line px-[17px] py-3 text-[13px] first:border-t-0">
            <span className="flex-1">{c.q}</span>
            <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-bold ${c.cited ? 'text-good' : 'text-faint'}`}>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: c.cited ? 'var(--good)' : 'var(--faint)' }} />
              {c.note}
            </span>
          </div>
        ))}
      </section>
    </div>
  )
}
