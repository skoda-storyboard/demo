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
