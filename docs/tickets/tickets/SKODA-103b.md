# SKODA-103b, Legacy URL resolution beyond the redirects sheet: attachments, query routes, old slugs, inbound links

- **Epic:** E01, Foundation & Setup
- **Type:** infrastructure (CDN rules) / data export (coordination ticket with sub-tickets)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Must be live **before the DNS switch**, in the same CDN
  layer as SKODA-103a.
- **Estimate:** 2 SP for the shared scope (client requests, inbound inventory, outreach, rule order, template
  checklist) · AI-assisted 1d / manual 2d, excluding the client's database export, logs and CDN lead time *(planning
  estimate, not a quote)*. The rules are in sub-tickets: 103c attachment and archive routes 3 SP; 103d query routes,
  old slugs and the slug map 4 SP; 103e inbound files, the CDN host and `wp-json` 3 SP. Total 12 SP: round 1 summed
  to ≈ 7–10 SP plus the id map, and round 2 adds ≈ 2 SP (prefix lookup, slim map, more query routes, archive
  routes, the document-host target).
- **GitHub issue:** [#422](https://github.com/skoda-storyboard/demo/issues/422) (created 2026-10-21, sub-issue of epic #1)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-04 (G-E-02 merged), G-T3-02,
  G-KJ-04, G-B-08 (G-KO-01 merged), G-T3-01, G-T3-04, G-T3-05, G-T3-06; round 2 G-T7-01 … G-T7-06, G-T8-01,
  G-T8-03, G-T8-04.

## Why
The redirects sheet (SKODA-103) matches exact paths, and 103a only strips the slash. WordPress resolves these
dynamically today, and EDS 404s them:
- **Attachment pages and archive routes (G-F-04, High, confirmed; G-T3-02; G-T7-06).** 42,275 indexed attachment
  pages in 3 shapes, plus `/page/N/`, `/YYYY/MM/` and `/embed/` routes. Detail: SKODA-103c.
- **Query routes and near-miss slugs (G-F-04; G-T7-03; G-KJ-04; G-T7-01, -02, -04).** `?p=`, `?page_id=`, `?s=` and
  more, old slugs, truncated, uppercase and locale-less paths. The demo sends `/?p=` and `/?page_id=` to a
  feature-branch draft. Detail: SKODA-103d.
- **Inbound files and APIs (G-B-08, High, confirmed; G-KO-01; G-T3-05; G-T8-01, High, confirmed; G-T8-04).**
  `/direct-download/`, `cdn.skoda-storyboard.com` and `/wp-json/*` callers have no plan. Detail: SKODA-103e.
- **The inbound inventory is partial (G-T3-01, -05, -06, not re-verified).** 9 more Wikipedia editions, `http` and
  Commons raise it to 370 links / 249 distinct URLs (53 new); 7 wikis answered 429, so it is a lower bound. Nobody
  has asked for the Search Console Links export or the www referrer logs, which go with the WordPress origin.
- **The data asks would come back empty (G-T7-05, Medium).** WordPress keeps no category history (wrong-category
  URLs resolve at runtime, 8 of 8 probes), the site runs no redirect plugin (26 `wp-json` namespaces checked; Yoast
  free), and the default nginx log format has no `Location` field.
- **The Master Press Release template (G-T8-03, Medium).** All 54 `file://` links in 96 sampled PDFs come from the
  template's "skoda-storyboard.com" hyperlink, which has no `https://`; Word resolved it against the internal
  Communications share. It has been dead for readers since 2024. The template also sets a generic Title (37 of 63
  releases; Google News shows it as the headline), Lang `cs` on 55 of 63, including English releases, and the
  editor's name as Author on 41 of 63.

## Sub-tickets
| Ticket | Scope | SP |
|---|---|--:|
| [SKODA-103c](SKODA-103c.md) | Attachment pages (3 shapes), in-body links, `/page/N/`, `/YYYY/MM/`, `/embed/` | 3 |
| [SKODA-103d](SKODA-103d.md) | Query routes on `/` and `/index.php`, `?s=`, old slugs, press-kit move, slug map | 4 |
| [SKODA-103e](SKODA-103e.md) | `/direct-download/`, permanent redirect-only CDN host, document host, `wp-json` | 3 |

## Scope (shared, this ticket)
**Client:**
- **C1 Database and server config (agency, YS.cz per the theme credits; G-T7-05):** `wp_postmeta` `_wp_old_slug` and
  `_wp_old_date` joined to post id, post type, Polylang language and current permalink; the attachment table (MIME
  type, parent post, locale, file path); post and page id to permalink; the nginx server and rewrite config (incl.
  the 11 aliases) and any permalink or rewrite-slug changes (press kits). Don't ask for a category history.
- **C2 Logs and exports (G-T7-05):** 90 days of www and CDN access logs with path and query, status,
  `$sent_http_location`, referrer and user-agent class, no IPs (301 and 404 rows at least; or the agency replays the
  301 paths). The Search Console Links, "Page with redirect" and "Not found (404)" exports via SKODA-713 C1. By
  2026-11-30 (proposed). Keep the logs until 8 weeks after go-live.
- **C3 Decisions:** confirm **Q-17** (attachments) and **Q-21** (document host). Default for the CDN host changes to
  **keep `cdn.skoda-storyboard.com` permanently as a redirect-only host** (G-T8-04): PDFs that can't change link it,
  so Q-18's exit condition ("until no page or PDF references it") never comes true. This changes 520's decision.
- **C4 Outreach and the template (Škoda Communications):** name the sender of the link-update notice; send it by
  2026-11-15 so owners switch to slashless URLs before 2026-12-15 (proposed dates). Accept the template checklist
  (T4) and name its owner.

**Team:**
- **T1 Inbound inventory.** Wikimedia `externallinks` dumps (all wikis, Wikidata, Commons), the C2 exports and logs,
  refreshed 4 weeks before DNS. It seeds SKODA-713c's harness and 523's orphan-document list.
- **T2 Outreach list:** the 12 referrer owners (link, action, date); re-crawl after the switch. Wikipedia can't be
  asked (conflict of interest), so its links rely on permanent 301s.
- **T3 Order with 103a.** File, API and query rules (103e, 103d), then attachment and archive rules (103c), then
  103a's case and slash rules, then the sheet, then the 404 lookup (706 with 103d's map). Targets are slashless and
  lowercase, so a legacy URL takes at most 2 hops. One combined test list, kept with 103a's.
- **T4 Template checklist (G-T8-03).** For the Master Press Release template: absolute `https://` links to slashless
  pages; media links to the document host (Q-21); Title = the headline; Lang per document; Author "Škoda Auto
  Communications"; a dated version before the freeze.

## Not in scope
- The slash and case rules: 103a. Per-locale base and slug rows: 1004. Exact rows for renamed pages: 103.
- Classifying the full inventory, the pre-DNS harness run and Search Console monitoring: SKODA-713, 713c.
- Our own CDN references: 520. Link census inside PDFs and annual reports: SKODA-523.
- RSS delivery and the mobile app's endpoint: SKODA-908 / 405. CDN choice, DNS and alias rules: SKODA-709 (D14).

## Acceptance criteria
- [ ] The C1 and C2 requests go out in the G-T7-05 form (old slug and date, rewrite config, logs with `Location`),
      and the answers are filed outside the served tree.
- [ ] Q-17 and Q-21 are decided, and the CDN-host default is recorded as permanent.
- [ ] The rule order is documented with 103a, and every test URL from 103c–103e ends in 200 or 410 in at most 2
      hops.
- [ ] The inbound inventory is stored outside the served tree and refreshed ≤ 4 weeks before DNS; the outreach list
      is sent.
- [ ] Communications accepts the checklist and issues a dated template version before the freeze.

## Dependencies
- **Q-17**, Q-18, **Q-21**, D14; client C1–C4. Sub-tickets 103c–103e.
- SKODA-709 (CDN supports pattern rules), 103a (order, test list), 103, 1003 (root), 520, 523, 605, 706, 713 and 713c
  (harness), 908, 1004. The media manifest (`tools/importer/media/media-manifest.json`) supplies the file map.
