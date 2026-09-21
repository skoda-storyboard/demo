# E09 — Dynamic Services (Phase C)

- **Phase:** C — Dynamic services
- **Goal:** Build the four stateful backend systems that have no native EDS equivalent, each behind a clean API boundary, plus rebuild the cross-cutting analytics instrumentation. None of these block content delivery — the static site works without them — so each is an independently-scheduled, decision-gated workstream. The recurring theme: the source systems are bespoke (a per-market ad server, a subscriber account system, a signed-download cart, a 140KB dataLayer layer), so the work is *rebuild-as-service* or *drop*, never a static copy.
- **Scope note:** SKODA-905 is a hidden cross-cutting dependency — every rebuilt interactive block (banners, media-cart, newsletter, gallery, forms, load-more, video, share, downloads) must re-emit its `skoda-analytics` events, or Škoda loses its established measurement taxonomy.

## Tickets
- **SKODA-901 — Hosted body-relevance search** (8SP) — decision-gated: only if full-text body / fuzzy / relevance search is required beyond the index-only facets from Phase A. Hosted SaaS (Algolia/Elastic/Adobe) fed by the query-index.
- **SKODA-902 — Media-cart production hardening** (8SP, re-scoped) — the demo cart + client-side zip ship in **M1 (SKODA-505)**; this hardens for production: a **serverless zip endpoint** (large/unlimited selections), **signed access** for gated assets, optional **cross-device state**, and the reuse-vs-rebuild decision. Was 13SP "build the cart from scratch"; reduced to 8SP now that M1 delivers the baseline.
- **SKODA-903 — Banner ad platform** (8SP) — per-market feed + small vanilla client block with content-tag/geo/frequency targeting. Challenge whether the full ad-server machinery is needed vs. a simpler featured-promo block.
- **SKODA-904 — Newsletter / subscriber** (8SP) — ESP-fronted (mailguide.cz or replacement) form block with double-opt-in, consent, and honeypot.
- **SKODA-905 — skoda-analytics rebuild** (8SP) — dataLayer event schema + per-block event wiring; the cross-cutting instrumentation module every interactive block feeds.
- **SKODA-906 — Restricted end-user article access (QR-code journey)** (5SP, provisional) — end-user gated delivery (EDS has none natively); investigation + build once the access model is defined. Blocked on D17. Closes gap G4 (§6.6). Distinct from author-side embargo (SKODA-811).

## Effort roll-up
- **Total: 45 SP** · AI-assisted ~17–28d / manual ~34–62d *(planning estimates, not a quote)*
- SKODA-901 is decision-gated (may drop). **SKODA-902 re-scoped 13→8 SP** — the demo cart + client-side zip moved to M1 (SKODA-505, E05); this ticket now covers production hardening only. **SKODA-906 (+5 SP)** added 2026-09-14 to close gap G4 (§6.6/D17); SP provisional pending the D17 access model.

## Source-doc traceability
- SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md §2.1–§2.4 (search/banner/newsletter/media-cart dossiers), §2.6 (skoda-analytics), §4 (integration boundary map)
- SKODA-SYSTEM-BUILD-SPECS.md §2 (search boundary), §3 (media-cart), §4 (newsletter)
- SKODA-EDS-DA-ARCHITECTURE.md §8 (static↔dynamic boundary), §3 (fit matrix — backend systems)
- SKODA-ADVERSARIAL-REVIEW.md §2 C5 (index-search feasibility), C14 (search-form)
