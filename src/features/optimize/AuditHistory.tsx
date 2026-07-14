import { useAudits } from './queries'
import { formatDate, errorText } from '../../lib/format'
import type { Audit } from './types'

const DOT: Record<string, string> = { COMPLETED: '#12C7B6', FAILED: '#e5484d', PENDING: '#9498B4', PROCESSING: '#3E7BFA' }
const STATUS_LABEL: Record<string, string> = { COMPLETED: 'Completed', FAILED: 'Failed', PENDING: 'Pending', PROCESSING: 'Processing' }

// Cursor-paginated list of past audits. Selecting a row loads it into the result view.
export function AuditHistory({ activeId, onSelect }: { activeId: string | null; onSelect: (id: string, url: string) => void }) {
  const query = useAudits({})
  const items: Audit[] = query.data?.pages.flatMap((p) => p.items) ?? []

  if (query.isError) {
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="px-[18px] py-12 text-center">
          <p className="font-semibold">Couldn't load your audits</p>
          <p className="text-sm text-muted">{errorText(query.error)}</p>
          <button
            onClick={() => void query.refetch()}
            className="mt-3 rounded-lg border border-line-strong bg-card px-3 py-1.5 text-[13px] font-semibold hover:bg-card-2"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!query.isLoading && items.length === 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line bg-card-2 px-[18px] py-3 text-[11.5px] font-semibold uppercase tracking-wider text-faint">
        Recent audits
      </div>
      {items.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id, a.url)}
          className={`flex w-full items-center gap-3 border-t border-line px-[18px] py-3 text-left first:border-t-0 hover:bg-card-2 ${a.id === activeId ? 'bg-hi-soft' : ''}`}
        >
          <span className="h-2 w-2 flex-none rounded-full" style={{ background: DOT[a.status] ?? '#9498B4' }} />
          <span className="sr-only">{STATUS_LABEL[a.status] ?? a.status}</span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{a.url}</span>
          <span className="text-[12px] text-faint">{formatDate(a.createdAt)}</span>
        </button>
      ))}
      {query.hasNextPage && (
        <div className="border-t border-line px-[18px] py-3">
          <button
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="rounded-lg border border-line-strong bg-card px-3 py-1.5 text-[13px] font-semibold hover:bg-card-2"
          >
            {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
