export type AuditStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface Finding {
  dimension: string
  title: string
  status: 'ok' | 'needs_work'
  summary: string
  detail: string
  recommendation: string
  basis: string
  strength: 'hard' | 'advisory'
}

export interface Audit {
  id: string
  url: string
  status: AuditStatus
  findings: Finding[] | null
  error: string | null
  createdAt: string
}

export interface AuditsPageData {
  items: Audit[]
  nextCursor: string | null
}
