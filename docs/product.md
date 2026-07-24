# Omniport — Product Overview

The single source of truth for **what Omniport is as a product** — its user, the
core loop, the capabilities, and what's actually built vs planned. Engineering
docs ([architecture](architecture.md), [deploy](DEPLOY.md)) describe *how*; this
describes *what* and *why*.

---

## What it is & who it's for

**Omniport is a content-operations platform for Shopify & WordPress stores.** It
runs a store's content on autopilot: you set a strategy once, and Omniport
generates posts, optimizes them for search and AI answers, publishes them on a
schedule, and reports on the results.

- **User:** store owners/operators who need a steady stream of quality content
  (blogs, guides) but don't have the time or team to run it themselves.
- **Model — fully managed, low-involvement (全托管).** The default is hands-off:
  Omniport does the work; the user sets direction and reviews, rather than writing.
  This is the core differentiator, not "another SEO tool."
- **Scope:** Shopify and WordPress stores of any size that need ongoing content ops
  — SEO, GEO (AI-answer) visibility, generation, and monthly reporting.

---

## The core loop

```
 Connect store  →  Set strategy  →  Generate  →  Optimize  →  Review  →  Publish  →  Report
 (Shopify/WP)      themes ·           AI drafts    SEO + GEO    light      to the      monthly:
                   cadence · tone     on schedule  tuning       touch      store       traffic ·
                                                                                       rankings ·
                                                                                       AI citations
```

Set it up once; the loop runs itself. The user's job is direction and approval,
not production.

---

## Capabilities

Legend: 🟢 **Live** (wired end to end) · 🟡 **Mock** (UI only, no backend yet) ·
⚪ **Planned** (not built).

| Capability | What it does | Status |
|---|---|---|
| **Sign-in** | Google-only, backend-driven OAuth | 🟢 Live |
| **Account** | Profile, delete account | 🟢 Live |
| **Notifications** | Activity feed (needs-review, published, citations, rankings), unread badge | 🟢 Live |
| **Optimize (GEO/SEO audit)** | Audit any URL → findings on search + AI-answer readiness | 🟢 Live |
| **Dashboard** | Autopilot overview: pipeline, strategy, headline metrics | 🟡 Mock |
| **Content strategy** | Themes, cadence, tone that drive autopilot | 🟡 Mock (shown in Account) |
| **Content generation** | AI-drafted posts in a workbench with SEO/GEO panels | 🟡 Mock |
| **Connected stores** | Link Shopify / WordPress | 🟡 Mock (shown in Account) |
| **Publishing** | Push approved posts to the store, scheduled | ⚪ Planned |
| **Monthly report** | Traffic, rankings, AI citations, what shipped | ⚪ Planned |
| **Multi-site / workspace** | Multiple stores per account, site switcher | ⚪ Planned |

> **Reality check.** The shell, design system, auth, account, notifications, and the
> GEO/SEO audit are real. The *content engine itself* — generation, publishing,
> scheduling, reporting — is not built yet; those screens are presentational. The
> hard product architecture is still ahead (see [architecture.md](architecture.md) §6).

---

## Roadmap (near-term, in order)

1. **Content generation** — backend content domain (Post + async job state machine:
   draft → in-review → scheduled → published) + LLM drafting; wire the Content
   workbench and Dashboard pipeline to real data.
2. **Store integration & publishing** — Shopify Admin API / WordPress REST adapters,
   credential custody, publish + schedule.
3. **Multi-site workspace** — a site/tenant context so everything scopes to the
   selected store (the `Tenant` model already exists on the backend).
4. **Monthly report** — assemble traffic / rankings / AI-citation data into the
   shareable report.

---

## Not building (yet)

Explicit boundary, to keep scope honest:

- Social media, email, or paid-ads content — this is on-site blog/content only.
- Platforms beyond Shopify & WordPress.
- Human-written / agency services — Omniport is the software, not a content agency.
- A general-purpose CMS or page builder — it operates *within* the store's own CMS.
