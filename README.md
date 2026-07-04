# Concert Matchmaker

Self-hostable tooling for matching a personal artist catalog to nearby live music events.

The project goal is to ingest an artist list, query live-event providers, normalize venues and performers, then score likely matches for a date range and location.

## Security Defaults

- Keep real credentials in local environment variables or a local `.env` file.
- Do not commit OAuth caches, raw exports, datasets, personal configs, browser profiles, or provider payload dumps.
- Commit only sanitized examples and source code.

## Planned Inputs

- Artist catalog with stable IDs and names.
- Date range and geographic center/radius.
- Provider credentials for supported event APIs.

## Planned Outputs

- Normalized event records.
- Artist-event match records with confidence scores.
- Ranked recommendations with source links and venue distance.

