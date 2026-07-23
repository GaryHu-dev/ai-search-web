# Deployment (Omniport web)

The frontend is a static SPA. It is **not** containerised — it's built into `dist/`
and rsynced onto the server, where the backend's **Caddy** already serves it and
handles TLS. Everything runs on one Ubuntu host under `/opt/omniport`, managed by
the `ai-search-api` repo's Docker stack (`db` + `api` + `caddy`).

```
                    ┌──────────────── Ubuntu server /opt/omniport ─────────┐
  browser ──443──▶  caddy (auto-HTTPS, front door)                         │
                    │   /api/*  → api:3000   (backend, /api stripped)       │
                    │   /*      → /srv/www   (this SPA, history fallback)   │
                    │  api container :3000    db container                  │
                    └──────────────────────────────────────────────────────┘
```

- `/srv/www` is a bind mount of `/opt/omniport/www` — the directory this repo's CD
  fills with `dist/`.
- The public API path is **`/api`** (Caddy's `handle_path /api/*` strips it), so the
  frontend's `VITE_API_BASE_URL` is `https://omniport.online/api`. The client calls
  `…/api/v1/…` → Caddy → `api:3000/v1/…`. Same origin → no CORS.

## How a deploy works

```
push to main ─▶ GitHub runner:
                  1. pnpm install --frozen-lockfile
                  2. pnpm build         (VITE_API_BASE_URL baked in)
                  3. rsync --delete dist/ → SERVER:/opt/omniport/www/
                Caddy serves the new files immediately — no restart.
```

No Docker image for the frontend, no registry.

## Files in this repo

| File | Role |
|---|---|
| `.env.production` | Committed production build config — `VITE_API_BASE_URL` baked into the bundle |
| `.github/workflows/cd.yml` | Build the SPA → rsync `dist/` into `/opt/omniport/www` |
| `.github/workflows/ci.yml` | PR/main checks: install → test → build |

The reverse proxy (`Caddyfile`), server compose, and TLS live in the **backend**
repo (`ai-search-api/deploy/`).

The production API base (`https://omniport.online/api`) lives in the committed
`.env.production` — it's a public value baked into the bundle, so no GitHub
Variable is needed; `vite build` picks it up automatically.

## One-time GitHub setup

**Settings → Secrets and variables → Actions → Secrets** (same names/values as the
backend repo — one deploy key works for both):
- `SSH_HOST` — server IP or hostname
- `SSH_USER` — the deploy user
- `SSH_KEY` — the deploy SSH **private** key

The public half of that key must be in the server's `~/.ssh/authorized_keys`.

## Server side

Nothing extra — the backend stack already provides Caddy and the `www` directory.
Just make sure:

- The backend (`ai-search-api`) is deployed at `/opt/omniport` and its Caddy is up.
- The backend deploy **no longer overwrites `www/index.html`** with a placeholder
  (otherwise a backend redeploy would clobber this SPA). The backend's
  `deploy.yml` should ensure `mkdir -p /opt/omniport/www` and leave the contents to
  this repo. (`www` is owned by the frontend; the stack is owned by the backend.)

## First deploy

With the Variable/Secrets set and the backend stack running, merge to `main` (or
*Actions → CD → Run workflow*). Then open `https://omniport.online` — the app loads
and login works (calls `/api/v1/...` through Caddy to the backend).

## Notes

- Merging to `main` **triggers a deploy** — set the Secrets first, or the rsync step
  fails.
- CD does not run the unit tests — `main` is gated by **CI** on every PR.
- Hardening: `cd.yml` uses `StrictHostKeyChecking=accept-new` (trust-on-first-use,
  same as the backend). To pin the host key, add its public key to a
  `SSH_KNOWN_HOSTS` secret and write it to `~/.ssh/known_hosts` before rsync.
- The Playwright e2e is not part of CI/CD (needs the full backend stack); it's a
  local check (`pnpm test:e2e`).
