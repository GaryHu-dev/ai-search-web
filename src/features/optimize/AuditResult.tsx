import { useAudit } from './queries'
import { FindingCard } from './FindingCard'
import { Spinner } from '../../components/Spinner'

// Live view of a single audit. Polls via useAudit; renders a working state while
// PENDING/PROCESSING, the six finding cards when COMPLETED, or the error on FAILED.
export function AuditResult({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useAudit(id)

  // isError must be checked before the `!data` loading fallback below: once the query
  // fails, `data` is also undefined, so a loading-based `!data` check alone would
  // permanently show the loading state and this branch would never be reached.
  if (isError) {
    return (
      <div className="rounded-2xl border border-line bg-card px-[18px] py-6">
        <p className="font-semibold">Couldn't load this audit</p>
        <p className="text-sm text-muted">{error instanceof Error ? error.message : 'Something went wrong'}</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-card px-[18px] py-6 text-muted">
        <Spinner className="h-5 w-5 text-hi-deep" />
        <span className="text-sm">Loading audit…</span>
      </div>
    )
  }

  const working = data.status === 'PENDING' || data.status === 'PROCESSING'

  return (
    <div className="flex flex-col gap-3">
      <div aria-live="polite" className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-card px-[18px] py-4">
        <span className="truncate text-[15px] font-semibold">{data.url}</span>
        {working && (
          <span className="ml-auto flex items-center gap-2 text-[13px] text-muted">
            <Spinner className="h-4 w-4 text-hi-deep" /> Analyzing — checking 6 AI-visibility signals…
          </span>
        )}
        {data.status === 'COMPLETED' && data.findings && (
          <span className="ml-auto text-[13px] text-muted">
            <b className="text-ink">{data.findings.filter((f) => f.status === 'ok').length}</b> of {data.findings.length} signals look good
          </span>
        )}
      </div>

      {data.status === 'FAILED' && (
        <div className="rounded-2xl border border-line bg-card px-[18px] py-5">
          <p className="font-semibold">Audit failed</p>
          <p className="text-sm text-muted">{data.error ?? 'The site could not be analyzed.'}</p>
        </div>
      )}

      {data.status === 'COMPLETED' && data.findings && (
        <div className="grid gap-3 md:grid-cols-2">
          {data.findings.map((f) => (
            <FindingCard key={f.dimension} finding={f} />
          ))}
        </div>
      )}
    </div>
  )
}
