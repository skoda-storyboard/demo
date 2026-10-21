# SKODA-103d, Query routes, old slugs and the slim slug map for near-miss URLs

- **Epic:** E01, Foundation & Setup
- **Type:** infrastructure (CDN rules) / generated data
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Live **before the DNS switch**, in the 103a CDN layer.
- **Estimate:** 4 SP · AI-assisted 2d / manual 3–5d, excluding the C1 export and CDN lead time *(planning estimate,
  not a quote)*. The id map (≈ 16.4k post rows plus 541 page ids) and the slug map are generated; round 2 adds
  ≈ 1.5 SP (more query routes, normalisation, prefix match, slim map).
- **GitHub issue:** [#435](https://github.com/skoda-storyboard/demo/issues/435) (created 2026-10-21, sub-issue of #422)
- Parent: SKODA-103b ([#422](https://github.com/skoda-storyboard/demo/issues/422))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-04, G-KJ-04, G-T7-01, G-T7-02,
  G-T7-03, G-T7-04.

## Why
- **Query routes (G-F-04; G-T7-03, Medium).** `/?p=459338` 301s to its permalink on WordPress, and so do
  `?page_id=`, `?post_type=press_release&p=`, `?press_release=<slug>`, `?cat=` and `/index.php?p=` (5 of 5 probes).
  On EDS the query lands on `/` and the root redirect: `/?p=497870` and `/?page_id=435774` go to a feature-branch
  draft, and `/index.php?p=459338` returns 404. `/en/?s=octavia` 301s to the source search.
- **Old slugs (G-KJ-04, Medium, not re-verified).** `_wp_old_slug` probes 301 on the source and 404 on the demo.
  The outside critic found 26 of 179 Wikipedia-cited page URLs in neither the REST census nor the sitemaps.
- **Truncated slugs (G-T7-01, Medium).** WordPress's permalink guess is a prefix match. 116 of 200 archived 301 URLs
  whose slug isn't current are truncations. An exact lookup recovers 21 of 47 resolving probes; normalising first,
  then a unique-prefix match, recovers 38 of 47. The guess can be wrong: `/en/emobility/meet-the-peaq/` lands on a
  different Peaq story.
- **Case and locale (G-T7-02, Medium).** WordPress matches slugs case-insensitively and adds `/en/` to locale-less
  paths; the demo 404s 3 of 3 such probes. The CDN case rule is 103a's.
- **The wrong lookup table (G-T7-04, Medium).** In the locale query-index, 342 (locale, slug) keys are ambiguous
  over 1,591 paths, 30 of them real content collisions. At full scale it costs about 0.7–0.85 MB per 404 view.
  Search engines don't render 4xx pages, so a 404-page lookup helps people, not link equity. The press-kit move
  (`/press-releases/x-press-kit` to `/press-kits/x-press-kit`) covers 5 of 8 archived unknown EN slugs.

## Scope
- **T1 Query rule on `/` and `/index.php` (G-T7-03).** `p`, `page_id`, `attachment_id`, `post_type=…&p=` and
  `{post_type}=slug` look up a generated id and slug map (posts, releases, press kits, pages, Škodapedia; attachment
  ids from 103c). `cat`, `tag` and taxonomy ids go to the archive page or the locale home. Any other query on `/`
  goes to the locale root without the query, never the draft. Static JSON; an edge lookup if D14 allows one, else
  the 404 page. Runs before 1003's routing.
- **T2 Search.** `?s=` goes to the locale search with `?q=` (the search block reads `q`).
- **T3 Edge rows for SEO-relevant moves (G-T7-04).** Old slugs from C1 (`_wp_old_slug`, `_wp_old_date`) as sheet
  rows; the press-kit move as a pattern rule `/{loc}/press-releases/(.*-press-kit|<listed slugs>)` to
  `/{loc}/press-kits/$1`.
- **T4 Slim slug map (G-T7-04).** Generated per locale at publish or import: slug to path, for story, release,
  press-kit and Škodapedia roots only, ambiguous keys dropped (they go to search). About 40 B a row, about 200 KB
  per locale, or sharded by first letter. SKODA-706's 404 page reads it; never the full query-index.
- **T5 Normalisation and matching spec (G-T7-01, G-T7-02), shared with 706.** Percent-decode; lowercase; strip
  trailing `"`, `'`, `,`, `;`, `)`, `...`, `…`, `-`, `%20` and empty segments; treat a first segment that isn't a
  locale as `en`. Then an exact match, else a unique-prefix match within the same locale and section (minimum 3
  words or 15 characters), else search with the slug words as the query.

## Not in scope
- The 404 page code: SKODA-706. The CDN case and slash rules: 103a. Attachment rows: 103c.

## Acceptance criteria
- [ ] `/?p=459338` reaches `/en/emobility/meet-the-peaq-intuitive-and-comfortable-controls`; 20 sampled ids across
      locales resolve; no `?p=` reaches a draft.
- [ ] `/?page_id=435774` reaches `/en/womens-day/lounge`; `/?post_type=press_release&p=223184`, a
      `/?press_release=<slug>` URL and `/index.php?p=459338` reach their pages; `/?cat=1` reaches an archive or the
      locale home. No query on `/` reaches a draft.
- [ ] `/en/?s=octavia` opens the EN search with results for "octavia".
- [ ] Run offline against the gap review's `probes.json`, the map and spec match the 4 G-KJ-04 probes and the 12
      unique-prefix truncations to their target, and send the 4 ambiguous truncations to search.
- [ ] `/en/press-releases/new-skoda-kodiaq-press-kit/` reaches `/en/press-kits/new-skoda-kodiaq-press-kit` once that
      page is migrated.
- [ ] The slug map has no ambiguous key and stays ≤ about 250 KB per locale or per shard.

## Dependencies
- Parent C1 (old slugs, id map, rewrite config), D14 (edge lookup), 1003 (root routing), 706 (404 page), 103a
  (order, case rule), 103c (attachment ids), 401 (index), 803/1004 (corpus lists), 713c (near-miss set).
  Parent: SKODA-103b.
