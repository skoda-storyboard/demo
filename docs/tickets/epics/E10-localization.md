# E10 — Localization (Phase D)

- **Phase:** D — Localization
- **Goal:** Roll out the site across all six locales (EN + DE/CS/SK/SR/SL) using EW's native Translation, per-locale content trees, per-locale query-indexes, and language-negotiated root routing. Localization is treated as content-ops on top of the proven EN capability, not a code fork.
- **Key reality:** translation coverage is **uneven per-item** (a story may live in 4 of 6 languages) — this is native to a per-locale-docs model (a story in 4 languages is simply 4 docs), not a defect. Per-locale everything (banners, subscribers, mediaboxes, search) reinforces the locale-scoped architecture.

## Tickets
- **SKODA-1001 — Per-locale content trees + per-locale query-index** (5SP) — `/en/ /de/ /cs/ /sk/ /sr/ /sl/` trees with `helix-query.yaml` per-locale index definitions.
- **SKODA-1002 — EW Translation projects rollout (DE/CS/SK/SR/SL)** (8SP) — URL-list Translation projects; fills locale gaps on demand. Largely content-ops (effort varies with corpus).
- **SKODA-1003 — Language-negotiated root routing + per-locale placeholders** (3SP) — reproduce `Accept-Language` root redirect + externalize UI strings per locale.

## Effort roll-up
- **Total: 16 SP** · AI-assisted ~6–10d / manual ~6–9d + content-ops (SKODA-1002 varies with translated volume) *(planning estimates, not a quote)*
- Critical path: SKODA-1001 (blocks 1002 and 1003).

## Source-doc traceability
- SKODA-EDS-DA-ARCHITECTURE.md §9 (i18n architecture), §12 (Phase D roadmap), §6 (per-locale index)
- SKODA-ADVERSARIAL-REVIEW.md C8 (uneven translation, refuted uniform 6×), C12 (language-negotiated root routing)
- SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md §3 (per-locale everything: banners cs51/en46/sk2/de0/sr0/sl1)
