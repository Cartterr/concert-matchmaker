# Concert Matchmaker

Self-hostable app for matching a Spotify-derived artist catalog to nearby live
music events. V1 is built for the Downtown LA SIGGRAPH 2026 trip window,
July 17-24, 2026, with a 12 mile default radius.

## Stack

- Next.js App Router, TypeScript, Tailwind-style UI
- Postgres + Prisma 7
- Auth.js GitHub OAuth with username/email allowlist
- Railway-ready single web service
- REST API plus MCP stdio server for Hermes/OpenClaw-style tools

## Provider Strategy

Event-first scans query date/radius windows, normalize venues and performers,
then score performers against the imported artist catalog.

Provider priority:

1. JamBase, when `JAMBASE_API_KEY` is present
2. Ticketmaster Discovery, when `TICKETMASTER_API_KEY` is present
3. SeatGeek, when `SEATGEEK_CLIENT_ID` is present
4. PredictHQ, when `PREDICTHQ_ACCESS_TOKEN` is present
5. Eventbrite fallback, when `EVENTBRITE_TOKEN` is present
6. Songkick and Bandsintown stay disabled by default in v1

Missing provider credentials create skipped provider runs instead of crashing.

## Security Defaults

- Keep credentials in environment variables or a local ignored `.env`.
- Do not commit OAuth caches, raw exports, datasets, personal configs, browser
  profiles, or provider payload dumps.
- Commit only sanitized fixtures and source code.
- Data APIs reject unauthenticated requests by default. `/api/health` is public
  for Railway healthchecks.

## Local Development

```bash
pnpm install
pnpm prisma:generate
pnpm dev --hostname 127.0.0.1 --port 3001
```

Set the values from `.env.example` before using live auth, database, or provider
scans. For local API testing only, `DEV_AUTH_BYPASS=true` bypasses auth outside
production.

## Database

```bash
pnpm prisma:migrate
pnpm prisma:seed
```

The seed creates the built-in SIGGRAPH 2026 Downtown LA trip profile.

## REST API

- `POST /api/catalogs/import`
- `GET /api/trips`
- `POST /api/trips`
- `GET /api/scans`
- `POST /api/scans`
- `GET /api/matches`
- `PATCH /api/matches`
- `POST /api/manual-events`
- `GET /api/provider-status`
- `POST /api/cron/scan`

## MCP Tools

Run the local stdio MCP server:

```bash
pnpm mcp
```

Tools:

- `import_artist_catalog`
- `scan_trip_events`
- `find_artist_events`
- `list_ranked_matches`
- `review_match`

Sample MCP config lives at `mcp/concert-matchmaker.mcp.json`.

## Railway

1. Create a Railway Postgres database.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, GitHub OAuth vars, allowlist
   vars, provider keys, and `SCHEDULED_SCAN_SECRET`.
3. Deploy this repo. `railway.json` runs migrations before `next start`.
4. Configure a Railway scheduled request to `POST /api/cron/scan` with header
   `x-scheduled-scan-secret`.

## Verification

```bash
pnpm test
pnpm lint
pnpm build
```

Tests cover normalization, dedupe keys, distance math, import parsing, match
confidence, provider skip behavior, allowlist behavior, and repository hygiene.
