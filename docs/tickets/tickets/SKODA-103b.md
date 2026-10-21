# SKODA-103b, Legacy URL resolution beyond the redirects sheet: attachments, query routes, old slugs, inbound links

- **Epic:** E01, Foundation & Setup
- **Type:** infrastructure (CDN rules) / data export
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Must be live **before the DNS switch**, in the same CDN
  layer as SKODA-103a.
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d, excluding the client's database export, logs and CDN lead
  time *(planning estimate, not a quote)*. The source findings sum to ≈ 7–10 SP plus the `?p=` id map
  (≈ 16.4k rows).
- **GitHub issue:** to create
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-04 (G-E-02 merged), G-T3-02,
  G-KJ-04, G-B-08 (G-KO-01 merged), G-T3-01, G-T3-04, G-T3-05, G-T3-06.

## Why
The redirects sheet (SKODA-103) matches exact paths, and 103a only strips the slash. WordPress resolves these
dynamically today, and EDS 404s them:
- **Attachment pages (G-F-04, High, confirmed).** 42,275 in 55 sitemaps, 200 with `index, follow`, canonical = the CDN
  file. Shapes: `{post-path}/attachment/{slug}/` and `/?attachment_id=N` (794 of 929 in sitemap 55). Bodies link them
  (3 on a sampled 2019 release). After 103a they become `…/attachment/{slug}` and 404. The media decision is "no item
  pages".
- **Root-level attachment pages (G-T3-02, Medium, not re-verified).** E.g.
  `/en/150605-skoda-superb-for-czech-president-001-3/` (body class `attachment single-attachment`). They look like post
  slugs, so no pattern can catch them: 7 of 249 distinct Wikimedia-cited URLs (vs 4 `/attachment/`). 3 contain
  underscores, and 4 cited paths change under the importer's path normalisation.
- **Query routes (G-F-04).** `/?p=459338` 301s to its permalink on WordPress. On EDS the query lands on `/` and the root
  redirect: the demo sends `/?p=497870` to a feature-branch draft. `/en/?s=octavia` 301s to the source search.
- **Old and near-miss slugs (G-KJ-04, Medium, not re-verified).** `_wp_old_slug` and WordPress's permalink guess: 4 of
  4 probes 301 on the source and 404 on the demo. Volume unknown. The outside critic found 26 of 179 Wikipedia-cited
  page URLs in neither the REST census nor the sitemaps; 11 resolve only through a dynamic 301. The guess can be
  wrong: `/en/emobility/meet-the-peaq/` lands on a different Peaq story.
- **Inbound files and APIs (G-B-08, High, confirmed; G-KO-01, Medium).** `/direct-download/{yyyy}/{mm}/{file}`,
  `cdn.skoda-storyboard.com` URLs and `/wp-json/*` callers have no plan. EN pages alone hold 6,886 `/direct-download/`
  and 483 CDN links (520 census), the EN feed 139 CDN images in 10 items. Wikipedia has 219 links in 101 articles (40
  to the CDN), Wikidata 19 (12 to the CDN). 9 of 13 sampled press-release PDFs link CDN photos, and their binaries
  migrate unchanged. 520's decision (2026-10-16) to drop the source CDN as soon as possible breaks all of these.
- **The inbound inventory is partial (G-T3-01, -05, -06, not re-verified).** 9 more Wikipedia editions, `http` and
  Commons raise it to 370 links / 249 distinct URLs (53 new); 7 wikis answered 429, so it is a lower bound. 5 of 38
  cited CDN files carry a GA4 `_gl` query, 1 ends in `.pdf/`. Nobody has asked for the Search Console Links export or
  the www referrer logs, which go with the WordPress origin.

## Scope
**Client:**
- **C1 Database export (agency):** attachments (slug, file URL, `post_parent`), `_wp_old_slug` and category history,
  post id to permalink.
- **C2 Logs:** 90 days of www and CDN access logs (path, status, referrer, user agent; no IPs) and the Search Console
  Links report, by 2026-11-30 (proposed). Keep the logs until 8 weeks after go-live.
- **C3 Decisions:** confirm **Q-17**. Keep `cdn.skoda-storyboard.com` as a redirect-only host for an agreed period, or
  sunset it (changes 520's decision; Q-18's default keeps the CDN read-only while pages or PDFs reference it).
- **C4 Outreach (Škoda Communications):** name the sender of the link-update notice; send it by 2026-11-15 so owners
  switch to slashless URLs before 2026-12-15 (proposed dates). Update the Master Press Release template.

**Team:**
- **T1 Attachments (Q-17 default: parent post, else 410, never the home page).** CDN rule `^(.*)/attachment/[^/]+/?$`
  to `$1` (slashless). `?attachment_id=N` and root-level slugs via rows from C1, keyed on the raw source path.
- **T2 In-body links (amends SKODA-605):** rewrite `/attachment/` links to the parent post or the DAM file at import.
- **T3 Query routes.** A generated id-to-path map for `?p=` (static JSON; an edge lookup if D14 allows one, else the
  404 page). `?s=` goes to the locale search with `?q=` (the search block reads `q`). Both run before 1003's routing.
- **T4 Old slugs.** Sheet rows from C1. In `404.html` (amends SKODA-706): look up the last path segment in the locale
  query-index and replace the location on an exact slug match only; otherwise offer search.
- **T5 Inbound files and APIs.** `/direct-download/*` and, after C3, the CDN host map to the AEM Assets delivery URL
  through the media manifest; drop the query and a trailing `/` first. Misses get the 404 page with search.
  `/wp-json/*` returns 410 or a documented replacement.
- **T6 Inbound inventory.** Wikimedia `externallinks` dumps (all wikis, Wikidata, Commons), the C2 export and logs,
  refreshed 4 weeks before DNS. It seeds SKODA-713's harness and 523's orphan-document list.
- **T7 Outreach list:** the 12 referrer owners (link, action, date); re-crawl after the switch. Wikipedia can't be
  asked (conflict of interest), so its links rely on permanent 301s.
- **T8 Order with 103a.** File, API and query rules, then attachment rules, then the slash rule, then the sheet, then
  the 404 lookup. Targets are slashless, so a legacy URL takes at most 2 hops.

## Not in scope
- The slash rule: 103a. Per-locale base and slug rows: 1004. Exact rows for renamed pages: 103.
- Classifying the full inventory, the pre-DNS harness run and Search Console monitoring: SKODA-713.
- Our own CDN references: 520. Link census inside PDFs and annual reports: SKODA-523.
- RSS delivery and the mobile app's endpoint: SKODA-908 / 405. CDN choice and DNS: SKODA-709 (D14).

## Acceptance criteria
- [ ] 10 samples each of `/attachment/`, root-level and `?attachment_id=` URLs end on the parent post (200) or 410, as
      Q-17 decides; none ends on the home page.
- [ ] `/?p=459338` reaches `/en/emobility/meet-the-peaq-intuitive-and-comfortable-controls`; 20 sampled ids across
      locales resolve; no `?p=` reaches a draft.
- [ ] `/en/?s=octavia` opens the EN search with results for "octavia".
- [ ] The G-KJ-04 probes resolve through a row or an exact lookup; an inexact slug gets the 404 page with search.
- [ ] `/direct-download/2018/12/57_KODIAQ_RS_ext-1920x1280.jpg` reaches the DAM copy of the file; an unmapped file
      gets the 404 page with search.
- [ ] If the CDN host stays, the 6 cited URLs with `_gl` or `.pdf/` resolve to their DAM files.
- [ ] `/wp-json/wp/v2/posts` returns 410 or the documented replacement.
- [ ] The rule order is documented with 103a, and every test URL ends in 200 or 410 in at most 2 hops.
- [ ] The inbound inventory is stored outside the served tree and refreshed ≤ 4 weeks before DNS; the outreach list
      is sent.

## Dependencies
- **Q-17**, Q-18, D14; client C1–C4.
- SKODA-709 (CDN supports pattern rules), 103a (order, test list), 103, 1003 (root), 520, 523, 605, 706, 713
  (harness), 908, 1004. The media manifest (`tools/importer/media/media-manifest.json`) supplies the file map.
