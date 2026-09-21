# E04 — Listings & Search (Phase A)

## Goal
Prove the **static listings + search architecture** end-to-end without a server round-trip. Because **DA has no spreadsheet-based indexing**, the index is built with **`helix-query.yaml` CSS-selector indexing over published HTML**, output per-locale at `/{locale}/query-index.json`. On top of that index sit a **faceted listing block** (client-side filter/sort/paginate, reproducing the source's `posts_per_page:6` + `history.pushState` deep-link paging) and a **Block Collection Search block** (index-only for the pilot). Full-text body search, fuzzy/typo tolerance, and relevance ranking are a hosted-search service **deferred to Phase C** — the pilot accepts reduced recall. Search-index design is on the critical path (risk R-A1 / 🟠).

## Phase
**A — capability pilot (EN).** All three tickets are pilot-scoped: index + listing + search (index-only). This is the #1 pilot prototype for the static model.

## Tickets
- **SKODA-401 — Query-index schema + helix-query selectors (15 facets).** Define per-locale `helix-query.yaml` selectors over published HTML producing `/{locale}/query-index.json` with columns `path, title, description, image, template, date` + the **15 taxonomy facets** (model, bodywork, derivative, motorsport, equipment, technology, years, view, company, concept, environment, happening, history, sponsorship, vip) + tags; multi-value stored comma-joined for client `includes()` filtering. — deps 104 — 5SP — Y
- **SKODA-402 — Faceted listing + load-more block (deep-link paging).** Client-side listing block: fetch locale index JSON, read facet state from URL params, filter across the 15 facets + `template`, sort, render first `pageSize=6` as cards, "Load more" appends next slice, `history.pushState` the offset (reproduces source deep-linking). — deps 401,201 — 8SP — Y
- **SKODA-403 — Search block (Block Collection, index-only).** Block Collection Search over `/query-index.json`; title/summary/tag matching only. Body-relevance/hosted search explicitly deferred to Phase C. — deps 401 — 3SP — Y

## Effort Roll-up
| Ticket | Type | SP | AI-assisted | Manual |
|---|---|---|---|---|
| SKODA-401 | setup | 5 | 2–3d | 3–5d |
| SKODA-402 | block | 8 | 3–5d | 6–9d |
| SKODA-403 | block | 3 | 1–2d | 2–4d |
| **Total** | | **16 SP** | **6–10d** | **11–18d** |

*(Planning estimates, not a quote.)*

## Source-Doc Traceability
- **`SKODA-SYSTEM-BUILD-SPECS.md` §2 (Search & listings)** — source mechanism (ElasticPress + `admin-ajax` load-more, `posts_per_page:6`, `offset`, `history.pushState`); the 15-facet list; index schema (`helix-query.yaml`, per-locale, CSS selectors over published HTML → `/{locale}/query-index.json`); Listing `decorate()` outline; static↔service boundary (pilot = index-only, hosted body-search = prod); High effort / 🟠 risk.
- **`SKODA-EDS-DA-ARCHITECTURE.md`** — §2 DA-specific callout (no spreadsheet indexing → `helix-query.yaml`), §6 Listings & Search architecture (per-locale indexes, index columns, faceted load-more with `pushState`, Block Collection Search, honest boundary), §13 risk R-A1 (index design on critical path).
