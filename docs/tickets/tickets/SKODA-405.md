# SKODA-405, RSS feed generation (query-index → RSS 2.0)
- **Epic:** E04, Listings & Search
- **Type:** integration · **Phase:** A · **Pilot:** stretch · **Milestone:** ~~M1~~ **M2**, aligned to the board (GitHub #52) on 2026-09-25, per the M1 gap review §7/§11
- **Estimate:** ~2 SP

## Summary
Generate an RSS 2.0 feed from the per-locale query-index (footer link continuity, requirements §9). Top autonomous-agent eval pick: a machine-readable output with a public-standard oracle and zero visual judgment.

## Acceptance Criteria
- [ ] Feed passes the W3C Feed Validator / RSS 2.0 schema.
- [ ] Item count == filtered query-index rows; per-item fields diff clean vs the index.
- [ ] pubDate is RFC-822; links resolve (no 404/loop).

## Dependencies
- Upstream: SKODA-401 (query-index). Generation has no other deps.
- Delivery (/en/feed/ content-type / edge function) is a separate human/infra step.

## Agent handoff
agent-fit + first agent-eval pick (handoff candidate A1): success == a green validator run.

## M2 readiness review (2026-10-15)
- **Output paths to keep:** the source footer links **`/en/feed/`** (RSS) and **`/en/press-releases/feed/`**, which 302s to `/en/feed/?post_type=press_release`. Both are on every page. The EDS feeds need these URLs, or redirect rows from them, so existing subscribers keep working.
- Census: [coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §3.
