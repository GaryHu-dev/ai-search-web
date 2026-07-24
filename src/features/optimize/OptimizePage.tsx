import { useState } from 'react'
import { Spinner } from '../../components/Spinner'
import { formatDate, errorText } from '../../lib/format'
import { normalizeUrl } from './url'
import { useAudit, useAudits, useCreateAudit } from './queries'
import type { Audit, Finding } from './types'

// Optimize: run a real GEO/SEO audit against a site URL (backend /v1/audits),
// poll to completion, and show findings + recent-run history.

function StatusPill({ status }: { status: Audit['status'] }) {
  const map: Record<Audit['status'], string> = {
    PENDING: 'text-c2 bg-[color-mix(in_srgb,var(--c2)_15%,transparent)]',
    PROCESSING: 'text-c2 bg-[color-mix(in_srgb,var(--c2)_15%,transparent)]',
    COMPLETED: 'text-good bg-good-soft',
    FAILED: 'text-bad bg-bad-soft',
  }
  return <span className={`rounded-full px-2.5 py-[3px] text-[10.5px] font-bold uppercase tracking-wide ${map[status]}`}>{status.toLowerCase()}</span>
}

function FindingRow({ f }: { f: Finding }) {
  const ok = f.status === 'ok'
  return (
    <div className="flex items-start gap-3 border-t border-line px-[17px] py-3.5 first:border-t-0">
      <span className={`mt-0.5 grid h-[26px] w-[26px] flex-none place-items-center rounded-lg ${ok ? 'bg-good-soft text-good' : 'bg-[color-mix(in_srgb,var(--c3)_15%,transparent)] text-c3'}`}>
        {ok ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 8v5M12 16h0" /></svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold">{f.title}</span>
          <span className="rounded bg-card-2 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-faint">{f.dimension}</span>
        </div>
        <p className="mt-0.5 text-[12.5px] text-muted">{f.summary}</p>
        {!ok && f.recommendation && (
          <p className="mt-1.5 text-[12.5px] text-ink"><span className="font-semibold text-hi-deep">Fix:</span> {f.recommendation}</p>
        )}
      </div>
    </div>
  )
}

function Result({ id }: { id: string }) {
  const { data: audit, isError } = useAudit(id)

  if (isError) return <p role="alert" className="rounded-2xl border border-bad-soft bg-card px-4 py-6 text-center text-sm text-bad">Couldn't load this audit.</p>
  if (!audit) return <div className="flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-6 text-sm text-muted"><Spinner className="h-4 w-4" /> Loading…</div>

  if (audit.status === 'PENDING' || audit.status === 'PROCESSING') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-card px-5 py-6 shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
        <Spinner className="h-5 w-5" />
        <div>
          <div className="text-sm font-semibold">Analyzing {audit.url}</div>
          <div className="text-[12.5px] text-muted">Crawling the page and running GEO/SEO checks…</div>
        </div>
      </div>
    )
  }
  if (audit.status === 'FAILED') {
    return <p role="alert" className="rounded-2xl border border-bad-soft bg-card px-4 py-6 text-sm text-bad">Audit failed: {audit.error ?? 'unknown error'}</p>
  }

  const findings = audit.findings ?? []
  const needsWork = findings.filter((f) => f.status === 'needs_work').length
  return (
    <section className="rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-[17px] py-3.5">
        <h3 className="text-sm font-bold">Findings</h3>
        <StatusPill status={audit.status} />
        <span className="ml-auto text-[12.5px] text-faint">
          {needsWork === 0 ? 'Signals look good' : `${needsWork} to improve`} · {findings.length} checks
        </span>
      </div>
      {findings.length === 0
        ? <p className="px-[17px] py-6 text-sm text-muted">No findings returned.</p>
        : findings.map((f, i) => <FindingRow key={i} f={f} />)}
    </section>
  )
}

export function OptimizePage() {
  const [input, setInput] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const create = useCreateAudit()
  const history = useAudits()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const url = normalizeUrl(input)
    if (!url) { setFormError('Enter a valid website URL.'); return }
    try {
      const audit = await create.mutateAsync(url)
      setSelectedId(audit.id)
    } catch (err) {
      setFormError(errorText(err))
    }
  }

  const runs = history.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Optimize</h2>
        <p className="text-[14.5px] text-muted">Run a GEO/SEO audit on any page to see what to improve for search and AI answers.</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row" noValidate>
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-line-strong bg-card px-3">
          <span className="text-[13px] text-faint">https://</span>
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); setFormError(null) }}
            placeholder="yourstore.com/blog/post"
            aria-label="Website URL"
            className="w-full min-w-0 bg-transparent py-3 text-[14.5px] outline-none"
          />
        </div>
        <button type="submit" disabled={create.isPending}
          className="grad-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold disabled:opacity-60">
          {create.isPending && <Spinner className="h-3.5 w-3.5" />}
          {create.isPending ? 'Starting…' : 'Analyze'}
        </button>
      </form>
      {formError && <p role="alert" className="text-sm text-bad">{formError}</p>}

      {selectedId && <Result id={selectedId} />}

      <section className="rounded-2xl border border-line bg-card shadow-[0_14px_34px_-22px_rgba(14,19,48,.35)]">
        <div className="flex items-center gap-2.5 border-b border-line px-[17px] py-3.5">
          <h3 className="text-sm font-bold">Recent audits</h3>
          {history.isLoading && <Spinner className="h-3.5 w-3.5 text-muted" />}
        </div>
        {runs.length === 0 ? (
          <p className="px-[17px] py-6 text-sm text-muted">No audits yet — run your first one above.</p>
        ) : (
          runs.map((a) => (
            <button key={a.id} onClick={() => setSelectedId(a.id)}
              className="flex w-full items-center gap-3 border-t border-line px-[17px] py-3 text-left text-[13px] first:border-t-0 hover:bg-card-2">
              <span className="min-w-0 flex-1 truncate font-medium">{a.url}</span>
              <StatusPill status={a.status} />
              <span className="whitespace-nowrap text-[12px] text-faint">{formatDate(a.createdAt)}</span>
            </button>
          ))
        )}
      </section>
    </div>
  )
}
