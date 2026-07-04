# AI Review Prompt For Concert Matchmaker

You are reviewing the repository `concert-matchmaker`. Treat this as a serious
pre-production architecture, product, code quality, security, and UI/UX review.
Do not provide generic advice. Inspect the repository deeply and return concrete,
file-referenced issues and improvements.

## Objective

This app should help a user import a Spotify-derived artist catalog, scan event
providers for concerts near a trip location/date window, normalize events and
performers, match performers against the imported artists, and present ranked
concert recommendations for review.

The first target use case is:

- Trip: Downtown Los Angeles for SIGGRAPH 2026
- Date range: July 17-24, 2026
- Anchor area: Freehand Los Angeles / Los Angeles Convention Center
- Default radius: 12 miles
- Artist source: personal Spotify liked-artists export, kept outside the repo

The product should be self-hostable, Railway-ready, and easy to wire into
Hermes/OpenClaw through MCP tools.

## Stack

- Next.js App Router, currently on latest Next.js from `package.json`
- React 19
- TypeScript
- Tailwind CSS 4 via `@tailwindcss/postcss`
- Prisma 7 with Postgres and `@prisma/adapter-pg`
- Auth.js / `next-auth` v5 beta with GitHub OAuth
- Auth.js Prisma adapter
- Vitest
- MCP TypeScript SDK over stdio
- Railway single-service deployment with Railway Postgres

## Current Repository Directory

```text
.env.example
.gitignore
AI_REVIEW_PROMPT.md
README.md
app/api/auth/[...nextauth]/route.ts
app/api/catalogs/import/route.ts
app/api/cron/scan/route.ts
app/api/health/route.ts
app/api/manual-events/route.ts
app/api/matches/route.ts
app/api/provider-status/route.ts
app/api/scans/route.ts
app/api/trips/route.ts
app/globals.css
app/import/page.tsx
app/layout.tsx
app/matches/page.tsx
app/page.tsx
app/trips/page.tsx
auth.ts
components/app-shell.tsx
components/import-form.tsx
components/manual-event-form.tsx
components/match-table.tsx
components/provider-status-grid.tsx
components/review-buttons.tsx
components/setup-panel.tsx
components/stat-card.tsx
components/trip-scan-client.tsx
eslint.config.mjs
fixtures/sample-artists.json
lib/api.ts
lib/catalogs.ts
lib/db.ts
lib/env.ts
lib/geo.ts
lib/import-artists.ts
lib/manual-events.ts
lib/matching.ts
lib/normalize.ts
lib/providers/adapters.ts
lib/providers/http.ts
lib/providers/index.ts
lib/providers/types.ts
lib/scans.ts
lib/trips.ts
lib/ui.ts
mcp/concert-matchmaker.mcp.json
next-env.d.ts
next.config.ts
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
postcss.config.mjs
prisma.config.ts
prisma/migrations/20260704000000_initial/migration.sql
prisma/schema.prisma
prisma/seed.ts
railway.json
scripts/mcp-server.ts
tests/geo.test.ts
tests/import-artists.test.ts
tests/matching.test.ts
tests/normalize.test.ts
tests/provider-status.test.ts
tests/security.test.ts
tsconfig.json
types/next-auth.d.ts
vitest.config.ts
```

## Current Implemented Behavior

### UI Pages

- `/`: dashboard with setup status, active trip stats, provider health, and top
  matches.
- `/import`: upload form for `liked-artists.csv` or JSON plus recent catalog list.
- `/trips`: active trip profile, scan action, provider health, and manual event
  fallback form.
- `/matches`: ranked matches table with accept/reject/ambiguous review actions.

### REST API

- `POST /api/catalogs/import`: import CSV or JSON artist catalog.
- `GET /api/trips`: list trip profiles; seeds default trip when DB is available.
- `POST /api/trips`: create trip profile.
- `GET /api/scans`: list recent provider runs.
- `POST /api/scans`: scan configured providers and match against the latest or
  selected catalog.
- `GET /api/matches`: list ranked matches.
- `PATCH /api/matches`: review a match.
- `POST /api/manual-events`: manually add an event and match it.
- `GET /api/provider-status`: show configured/skipped/disabled provider health.
- `POST /api/cron/scan`: scheduled scan endpoint protected by
  `x-scheduled-scan-secret`.
- `GET /api/health`: public Railway healthcheck.

### MCP Tools

The stdio MCP server is in `scripts/mcp-server.ts`.

- `import_artist_catalog`
- `scan_trip_events`
- `find_artist_events`
- `list_ranked_matches`
- `review_match`

### Provider Strategy

Event-first scans by date/radius should be preferred over artist-by-artist API
lookups. Providers should skip gracefully when credentials are missing.

Priority:

1. JamBase
2. Ticketmaster Discovery
3. SeatGeek
4. PredictHQ
5. Eventbrite fallback
6. Songkick and Bandsintown disabled by default because of licensing/partner
   constraints

Matching priority should be:

1. Shared external IDs
2. Exact normalized names
3. Aliases
4. Guarded fuzzy matching, with ambiguous matches kept for review

## Critical Review Instructions

Return a rigorous review with file paths and line references wherever possible.
Prioritize real defects, missing production requirements, architectural risks,
security gaps, data integrity risks, provider/API incompatibilities, auth issues,
and frontend UX/design weaknesses.

Do not stop at high-level comments. For each issue, include:

- Severity: `P0`, `P1`, `P2`, or `P3`
- File and line reference
- Why it matters
- Exact recommended change
- Suggested test coverage
- Whether it blocks production deployment

Also include a section of "Best Next PRs" with an ordered implementation plan.

## Specific Areas To Inspect

### 1. Frontend Design And UI/UX - Very High Priority

Heavily inspect the frontend. The current UI is functional and compact, but the
goal is a much sleeker, more polished, more ergonomic product experience.

Review these files in depth:

- `app/page.tsx`
- `app/import/page.tsx`
- `app/trips/page.tsx`
- `app/matches/page.tsx`
- `app/globals.css`
- `components/app-shell.tsx`
- `components/provider-status-grid.tsx`
- `components/match-table.tsx`
- `components/import-form.tsx`
- `components/trip-scan-client.tsx`
- `components/manual-event-form.tsx`
- `components/review-buttons.tsx`
- `components/setup-panel.tsx`
- `components/stat-card.tsx`

Design review requirements:

- Propose a clearer visual hierarchy for dashboard, import, trip scan, and
  matches pages.
- Improve layout density without making it feel cramped.
- Check responsive behavior across mobile, tablet, laptop, and wide desktop.
- Check whether the sidebar/topbar structure is ideal.
- Improve typography, spacing, color, contrast, and component states.
- Evaluate if the app needs tabs, filters, segmented controls, drawers, command
  menus, sticky toolbars, or better table affordances.
- Add polished empty states, loading states, auth setup states, provider skipped
  states, scan-running states, error states, and manual review states.
- Improve the match table for real usage: filtering by confidence/status/provider,
  sorting, grouping by date/venue, direct ticket/provider actions, and bulk review.
- Improve provider status UX: show why a provider is skipped, what env var is
  missing, what coverage it contributes, and how trustworthy it is.
- Improve import UX: drag/drop, preview parsed rows, duplicate detection,
  import validation summary, and rollback/retry behavior.
- Improve trip scan UX: progress timeline, provider run logs, last successful
  scan, distance/date filters, and active catalog selection.
- Keep the app as an actual tool, not a marketing landing page.
- Avoid decorative clutter. Aim for a polished, modern, operational dashboard.
- Recommend a concrete design system direction: color tokens, spacing scale,
  component primitives, icon usage, table styles, badges, buttons, forms,
  dialogs, and responsive breakpoints.
- Identify exact frontend files/components that should be split, rewritten, or
  replaced.

Return a separate "Frontend Redesign Plan" with:

1. Page-by-page redesign recommendations.
2. Component hierarchy.
3. New/changed component list.
4. Interaction model.
5. Accessibility fixes.
6. Data loading and mutation UX.
7. A prioritized implementation sequence.

### 2. Architecture And Data Flow

Review the architecture across:

- `lib/scans.ts`
- `lib/providers/adapters.ts`
- `lib/providers/types.ts`
- `lib/catalogs.ts`
- `lib/manual-events.ts`
- `lib/matching.ts`
- `lib/import-artists.ts`
- `lib/normalize.ts`
- `lib/env.ts`
- `lib/api.ts`
- `scripts/mcp-server.ts`
- API routes under `app/api/**`

Check:

- Whether provider scanning should be parallel, queued, transactional, or split
  into background jobs.
- Whether provider run status is robust enough for long scans and retries.
- Whether scan results should be associated with a trip/catalog explicitly in
  the data model.
- Whether matches are correctly scoped to trip, catalog, scan run, and event.
- Whether upsert logic can overwrite reviewed match status incorrectly.
- Whether event dedupe keys are stable across providers and repeated scans.
- Whether manual imports need stronger provenance/audit data.
- Whether raw provider payload references are meaningful without storing raw
  payloads.
- Whether MCP tools reuse the right service boundaries.
- Whether code should introduce service objects, repositories, job models,
  queue abstractions, or provider contracts.

### 3. Prisma Schema And Database Integrity

Review:

- `prisma/schema.prisma`
- `prisma/migrations/20260704000000_initial/migration.sql`
- `prisma/seed.ts`
- `lib/db.ts`
- `prisma.config.ts`

Check:

- Auth.js Prisma adapter compatibility for the exact installed Auth.js version.
- Prisma 7 adapter usage and deploy compatibility on Railway.
- Need for `TripProfile`, `ProviderRun`, `Event`, and `Match` relationships.
- Missing indexes and unique constraints.
- Cascading behavior and deletion safety.
- Whether provider runs should store `tripId`, `catalogId`, request params,
  startedBy, and scan summary.
- Whether events should store source provider and normalized fields correctly.
- Whether JSON fields need typed validation or relational normalization.
- Whether timestamps, timezone handling, local dates, and UTC fields are correct.
- Whether using fallback local connection strings is acceptable or risky.

### 4. Auth And Security

Review:

- `auth.ts`
- `lib/api.ts`
- `lib/env.ts`
- API routes under `app/api/**`
- `.env.example`
- `.gitignore`
- `tests/security.test.ts`

Check:

- GitHub allowlist correctness and failure modes.
- Whether missing allowlist should fail closed in production and how dev should
  behave.
- Whether `DEV_AUTH_BYPASS` is safe enough and impossible in production.
- Whether all data-changing routes are protected.
- Whether GET data routes should be protected or partially public.
- Whether scheduled scan secret header is sufficient.
- Whether provider keys or tokens can leak in logs/errors/responses.
- Whether OAuth tokens stored by Auth.js need special handling.
- CSRF, file upload limits, CSV injection risks, JSON payload limits, provider
  URL validation, and server-side request timeout concerns.

### 5. Provider API Correctness

Heavily verify provider adapter correctness against official API documentation:

- JamBase Data API
- Ticketmaster Discovery API v2
- SeatGeek events API
- PredictHQ Events API
- Eventbrite API
- Disabled Songkick/Bandsintown handling

Review `lib/providers/adapters.ts` and `lib/providers/http.ts`.

Check:

- Endpoint URLs.
- Authentication mechanism.
- Query params for radius/date/category.
- Pagination.
- Rate limiting.
- Error handling.
- Timeouts.
- Handling empty/partial payloads.
- Venue coordinate mapping.
- Performer/artist extraction.
- Ticket/provider URL extraction.
- Whether event-first scanning misses events that require artist-specific lookup.
- Whether provider adapters should be contract-tested with recorded sanitized
  fixtures.

### 6. Matching Quality

Review:

- `lib/matching.ts`
- `lib/normalize.ts`
- `lib/scans.ts`
- `tests/matching.test.ts`
- `tests/normalize.test.ts`

Check:

- Normalization correctness across punctuation, accents, leading "The", aliases,
  features, DJ sets, collaborations, festivals, and multiple performers.
- Whether fuzzy matching is too strict or too permissive.
- Whether ambiguous matches are handled correctly.
- Whether matching should use external IDs from MusicBrainz, Spotify,
  Ticketmaster, JamBase, SeatGeek, etc.
- Whether imported artist aliases/external IDs are stored and used effectively.
- Whether confidence scoring needs a more explainable model.
- Whether the app needs manual review queues and correction learning.

### 7. Import Pipeline

Review:

- `lib/import-artists.ts`
- `lib/catalogs.ts`
- `components/import-form.tsx`
- `app/api/catalogs/import/route.ts`
- `tests/import-artists.test.ts`

Check:

- CSV/JSON support for real Spotify-derived exports.
- Schema validation and error reporting.
- Duplicate behavior across repeated imports.
- Large file handling.
- Multipart file size limits.
- CSV injection protection if exported later.
- Catalog versioning.
- Ability to import the user's real 2129-artist catalog safely without storing
  personal export files in git.

### 8. Testing And Verification

Review:

- `tests/*.test.ts`
- `vitest.config.ts`
- `package.json`

Recommend missing tests:

- API integration tests.
- Auth allowlist integration tests.
- Provider contract tests with sanitized fixtures.
- MCP tool response tests.
- E2E UI smoke tests.
- Accessibility tests.
- Railway deployment smoke tests.
- Secret scanning / git hygiene improvements.
- Import large-file tests.
- Scan dedupe idempotency tests.

### 9. Railway And Deployment

Review:

- `railway.json`
- `.env.example`
- `README.md`
- `prisma.config.ts`
- `package.json`

Check:

- Whether `pnpm prisma:migrate && pnpm start` is the correct start command.
- Whether migrations should run separately.
- Whether Railway scheduled scan should be configured as a cron service, HTTP
  cron, or separate worker.
- Whether the app needs `AUTH_URL`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST`, or other
  Auth.js/Railway settings.
- Whether build scripts are deterministic with latest dependency versions.
- Whether dependencies should be pinned instead of `latest`.

## Expected Output Format

Please return:

1. Executive summary: most important production blockers.
2. P0/P1 findings first, with file/line references.
3. Provider API compatibility audit.
4. Database/schema audit.
5. Auth/security audit.
6. Frontend UI/UX audit.
7. Frontend Redesign Plan.
8. Testing gaps and exact tests to add.
9. Best Next PRs, ordered from highest leverage to lowest.
10. Optional: proposed file/module structure after refactor.

Use a concise but thorough engineering tone. Be direct. If a recommendation is
based on uncertain provider documentation, say exactly what needs verification.
If you propose a UI redesign, make it concrete enough that another engineer can
implement it without guessing.

## Additional Constraints

- Do not ask for real credentials.
- Do not suggest committing personal Spotify exports.
- Do not suggest scraping DICE, RA, Songkick, or Bandsintown pages in v1.
- Preserve the self-hostable/Railway-ready direction.
- Preserve GitHub allowlist auth; no public signup.
- Preserve MCP compatibility for Hermes/OpenClaw.
- Favor resilient provider abstractions over one-off scripts.
- Favor a sleek operational product interface over a marketing landing page.
