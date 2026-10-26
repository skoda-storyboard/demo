# SKODA-401a, Index payload at full corpus: slim index for rails and cards, budget per page type, 5k-row measurement

- **Epic:** E04, Listings & Search
- **Type:** setup / measurement; an over-budget listing result becomes a follow-up ticket
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 2.5 SP · AI-assisted 1.5d / manual 3d: 401's part 2 SP (1d / 2d) and 402's part 0.5 SP (0.5d / 1d)
  *(planning estimate, not a quote)*. The review sizes G-KT-05 at 2–3 SP for both tickets.
- **GitHub issue:** [#473](https://github.com/skoda-storyboard/demo/issues/473) (created 2026-10-22, sub-issue of #5)
- **Parent:** SKODA-401 (with SKODA-402's M2 part). Both parents are done on M1 scope (#27, #28 closed).
- **Status (2026-10-22):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2 row "401 / 402": G-KT-05 (Medium,
  ESTIMATE-RISK, not re-verified).

## Why
- `scripts/query-index.js` pages through the whole `/{locale}/query-index.json` with no limit parameter. At the EDS
  default of 1,000 rows per request the chunks load one after another. `story-rail` (on every story) and the home
  rails call it (G-KT-05).
- Today's EN index: 409 rows, 376,462 B raw, 64,901 B gzip, about 920 B a row. At D7's ≈ 4,620 EN pages that is about
  4.3 MB raw and 0.73 MB gzip in 5 requests per locale; CS is about 4,000 rows (G-KT-05).
- New rows per year: EN 145–187, CS 181–368, SK up to 335. The drilldown flagged "needs chunking/sharding at full
  scale"; no ticket sets a budget or re-measures LCP and INP with a full index (G-KT-05).
- Listings keep the full index, and nothing measures a listing at that size (G-KT-05).

## Scope
- **A slim index for rails and cards** (401): recent N months, or per template, with fewer columns. Pick one and
  record why. Rails and card blocks (story rails, home rails) read it; listings and search keep the full index.
- **A payload budget per page type** (401), handed to SKODA-712's quarterly capacity checkpoint, which already names
  "the payload budget from the 401 amendment G-KT-05".
- **Measure at full corpus** (401): load a 5k-row synthetic index on a preview branch and measure.
- **Listings at full corpus** (402): measure the query-index listings (`/en/news`, `/en/press-kits`), the `stories`
  feed that reuses the listing logic (home, model tag archives) and search with the 5k-row synthetic index, against
  the budget. An over-budget result is recorded as a follow-up, not fixed here.

## Not in scope
- Index caching (G-T6-06, `max-age=7200` on `query-index.json` and `media-feed.json`): SKODA-850a owns the
  listing-freshness fix, and its AC already checks `/en/news` after a timed release. The slim index path from this
  ticket must be covered by 850a's header or fetch rule as well.
- The Images and Videos listings: they read the media feed (SKODA-517).
- Fixing an over-budget listing: a follow-up ticket.

## Acceptance criteria
- [ ] A 5k-row synthetic EN index is served on a preview branch; a story page and the home page are measured
      (bytes, requests, LCP, INP) and the numbers recorded per page type (G-KT-05).
- [ ] A budget per page type is recorded and passed to SKODA-712 (G-KT-05).
- [ ] At 5k rows a story page's rails load the slim index only, within its budget, and the full index isn't requested
      on a story page (G-KT-05).
- [ ] The slim index path is in SKODA-850a's freshness rule (G-T6-06).
- [ ] `/en/news`, `/en/press-kits`, one model tag archive and search are measured with the 5k-row synthetic index at
      mobile and desktop (bytes, requests, time to first card, LCP, INP), and the numbers are recorded against the
      budget (G-KT-05).
- [ ] At 5k rows, facet counts, deep links and Load more still behave as at today's size (G-KT-05).

## Dependencies
D7 (corpus size), SKODA-850a (index caching), SKODA-712 (capacity checkpoint), SKODA-517 (media-feed listings).
Parents: SKODA-401 (index schema, `scripts/query-index.js`) and SKODA-402 (listing block).
