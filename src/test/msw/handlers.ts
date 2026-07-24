import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000'
const tokens = (n: string) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  tokenType: 'Bearer',
  expiresIn: 900,
})

export const handlers = [
  http.post(`${BASE}/v1/auth/login`, async () =>
    HttpResponse.json({ data: tokens('1'), requestId: 'req_login' })),
  http.post(`${BASE}/v1/auth/register`, async () =>
    HttpResponse.json({ data: tokens('1'), requestId: 'req_reg' }, { status: 201 })),
  http.post(`${BASE}/v1/auth/google`, async () =>
    HttpResponse.json({ data: tokens('1'), requestId: 'req_g' })),
  http.post(`${BASE}/v1/auth/refresh`, async () =>
    HttpResponse.json({ data: tokens('2'), requestId: 'req_ref' })),
  http.post(`${BASE}/v1/auth/logout`, async () => new HttpResponse(null, { status: 204 })),
  http.get(`${BASE}/v1/users/me`, async () =>
    HttpResponse.json({
      data: { id: 'u1', email: 'jane@acme.com', displayName: 'Jane Doe', createdAt: '2026-07-01T00:00:00.000Z' },
      requestId: 'req_me',
    })),
  http.get(`${BASE}/v1/files`, async () =>
    HttpResponse.json({ data: { items: [], nextCursor: null }, requestId: 'req_files' })),
  http.get(`${BASE}/v1/audits`, async () =>
    HttpResponse.json({ data: { items: [], nextCursor: null }, requestId: 'req_audits' })),
  http.post(`${BASE}/v1/audits`, async () =>
    HttpResponse.json({ data: { id: 'seed1', url: 'https://acme.io/', status: 'PENDING', findings: null, error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'req_audit_new' }, { status: 202 })),
  http.get(`${BASE}/v1/audits/:id`, async ({ params }) =>
    HttpResponse.json({
      data: {
        id: params.id, url: 'https://acme.io/', status: 'COMPLETED', error: null, createdAt: '2026-07-09T00:00:00Z',
        findings: [
          { dimension: 'answerability', title: 'Add a concise answer', status: 'needs_work', summary: 'The page buries the answer.', detail: '…', recommendation: 'Lead with a 1–2 sentence answer.', basis: 'heuristic', strength: 'advisory' },
        ],
      },
      requestId: 'req_audit_one',
    })),

  // Notifications
  http.get(`${BASE}/v1/notifications`, async ({ request }) => {
    const unread = new URL(request.url).searchParams.get('unread') === 'true'
    const items = unread
      ? []
      : [{ id: 'n1', type: 'audit_completed', title: 'Audit completed', body: 'Your audit for acme.io finished.', data: null, readAt: null, createdAt: '2026-07-09T00:00:00.000Z' }]
    return HttpResponse.json({ data: { items, nextCursor: null }, requestId: 'req_notifs' })
  }),
  http.get(`${BASE}/v1/notifications/unread-count`, async () =>
    HttpResponse.json({ data: { count: 1 }, requestId: 'req_nc' })),
  http.post(`${BASE}/v1/notifications/read-all`, async () =>
    HttpResponse.json({ data: { count: 1 }, requestId: 'req_nra' })),
  http.patch(`${BASE}/v1/notifications/:id/read`, async ({ params }) =>
    HttpResponse.json({ data: { id: params.id, type: 'audit_completed', title: 'Audit completed', body: 'Your audit for acme.io finished.', data: null, readAt: '2026-07-10T00:00:00.000Z', createdAt: '2026-07-09T00:00:00.000Z' }, requestId: 'req_nr' })),
]
