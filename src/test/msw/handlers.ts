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
    HttpResponse.json({ data: { id: params.id, url: 'https://acme.io/', status: 'COMPLETED', findings: [], error: null, createdAt: '2026-07-09T00:00:00Z' }, requestId: 'req_audit_one' })),
]
