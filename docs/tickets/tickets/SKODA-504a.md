# SKODA-504a, AEM Assets scale-out: the full media set, with rights, dedup and approval (follow-up to SKODA-504)
- **Epic:** E05, Media Pipeline (follow-up to SKODA-504, #49, closed 2026-09-22)
- **Type:** media / integration · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#371](https://github.com/skoda-storyboard/demo/issues/371) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 3–5 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 🔵 TODO (M2), no owner. Gated on decisions.

## Why
SKODA-504 mapped the **demo subset** of S3 images to AEM Assets. Go-live needs the media behind every migrated page:
~28,300 logical items, ~34 GB of masters. That requires rules the demo didn't need: usage rights, duplicate handling,
unmatched items and an approval filter.

## Scope
- Masters-only ingest at scale (SKODA-501 / 506 rules), batched and resumable, from a developer machine.
- Dedup by content hash across posts / press releases / press kits. Unmatched-item report.
- Rights / approval metadata: which assets may be published (client rule, D5 follow-up).
- Feeds SKODA-511 (feed sync) and SKODA-512 (taxonomy).

## Acceptance criteria
- [ ] Every image referenced by an imported EN page resolves to an AEM Assets delivery URL (0 source-CDN references).
- [ ] The dedup and unmatched reports have been reviewed by the client.
- [ ] Only approved assets are published.

## Dependencies
504 ✅, 506 ✅, #219 (WebP activation 404), D5 (instance, rendition scheme, rights rule), D7 (cutoff sets the volume).
