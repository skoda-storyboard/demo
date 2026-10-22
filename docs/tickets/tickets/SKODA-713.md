# SKODA-713, SEO migration: per-locale sitemaps and robots, JSON-LD and article meta, noindex, SEO owner, monitoring

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** SEO configuration / head code / launch QA (coordination ticket with sub-tickets)
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Sitemaps, robots, noindex and the redirect harness run
  must be done **before the DNS switch**. JSON-LD and article meta are proposed as a go-live gate (Google News).
- **Estimate:** 2 SP for the shared scope (client inputs, SEO owner, launch day, monitoring) · AI-assisted 1d /
  manual 2d, excluding client SEO and analytics time *(planning estimate, not a quote)*. The build work is in
  sub-tickets: 713a sitemaps, robots, noindex and document policy 3 SP; 713b structured data and article meta 3 SP;
  713c legacy URL inventory and redirect harness 3 SP; 713d analytics continuity 2 SP. Total 13 SP: round 1 sized
  the parts at ≈ 10–12 SP, and round 2 adds ≈ 1 SP (archive routes, near-miss set, alias URLs, document policy).
- **GitHub issue:** [#420](https://github.com/skoda-storyboard/demo/issues/420) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-02, G-F-03, G-F-06, G-F-07, G-KT-07,
  G-KO-03; round 2 G-T7-06, G-T7-07, G-T5-05, G-T8-06, G-T8-07.

## Why
- **Sitemaps, robots and indexable chrome (G-F-02, High, confirmed; G-F-07, Medium).** The source publishes a
  sitemap index of 91 files for 6 locales. The demo serves one EDS default urlset of 434 URLs, all `/en` or root,
  with 0 alternates and 26 non-content URLs. There is no production `robots.txt`. Detail: SKODA-713a.
- **Documents (G-T8-06, Medium).** The source CDN PDFs are indexed today (9 in Google News over 30 days). The
  migrated files come from the raw AEM publish host, whose `robots.txt` is `Disallow: /` (G-T8-01, Q-21), so they
  leave the index by accident. Nobody has decided whether PDFs should rank. Detail: SKODA-713a.
- **Structured data (G-F-03, High, confirmed).** Source stories and releases carry an Article or WebPage graph and
  article meta; the demo has none. The outside critic counted 44 EN and at least 100 CS Storyboard items in Google
  News over 30 days, so the loss shows on day one. Detail: SKODA-713b.
- **No SEO migration owner (G-F-06, High, confirmed).** No doc covers Search Console, a redirect-map test or
  post-launch indexation monitoring. About 58,700 legacy URLs need a class. Round 2 adds archive routes that 404 on
  the demo (G-T7-06), near-miss URLs whose WordPress target is sometimes wrong (G-T7-07), alias hosts (G-T5-05) and
  page links inside PDFs (G-T8-07). Detail: SKODA-713c.
- **Analytics continuity (G-KT-07, G-KO-03, Medium, not re-verified).** Every page path changes form at cutover, so
  GA4 and Search Console page reports split into before and after. Detail: SKODA-713d.

## Sub-tickets
| Ticket | Scope | SP |
|---|---|--:|
| [SKODA-713a](SKODA-713a.md) | Per-locale sitemaps, production `robots.txt`, noindex for chrome, document policy | 3 |
| [SKODA-713b](SKODA-713b.md) | JSON-LD helper, `og:*` and article meta, robots `max-image-preview:large` | 3 |
| [SKODA-713c](SKODA-713c.md) | Legacy URL inventory, URL classes, near-miss and alias sets, pre-DNS harness run | 3 |
| [SKODA-713d](SKODA-713d.md) | GA4 baseline, path mapping, normalised page dimension, download KPI, comparisons | 2 |

## Scope (shared, this ticket)
**Client:**
- **C1:** name the SEO owner for skoda-storyboard.com after go-live and give the team read access to the Search
  Console property before go-live (with SKODA-709's G-F-08 question on the DNS TXT tokens). Through that access,
  export the "Page with redirect", "Not found (404)" and Links reports as inventory inputs for 713c and SKODA-103b
  (G-T7-05), and the count of indexed `cdn.skoda-storyboard.com` PDFs and their clicks, to size the de-indexing risk
  (G-T8-06).
- **C2:** Škoda analytics: which reports or dashboards read Storyboard GA4 or sDrive data (PR KPIs, download counts),
  and must their series continue across the cutover? (713d)
- **C3:** export a 4-week GA4 baseline per template and locale before the freeze (Q-20 sets the freeze). (713d)
- **C4:** decide the `<title>` suffix. SKODA-610 keeps it off index titles only. (713b)

**Team:**
- **T1 SEO launch checklist.** One checklist that tracks 713a–d and the SEO items of 103a, 103b, 709 and 1003 to
  the DNS date, owned with the SEO owner.
- **T2 Launch day.** Submit the sitemaps in Search Console; annotate the switch in GA4; run URL Inspection on one
  migrated release page and one migrated release PDF (G-T8-06).
- **T3 Monitoring, 8 weeks.** A runbook for the SEO owner: weekly Search Console coverage, 404s, sitemap status and
  the indexed-document count. Misses feed the redirects sheet or the 103b rules. The RUM 404 review is SKODA-712's.

## Not in scope
- Attachment, archive, query-route, old-slug, `/direct-download/`, CDN and `wp-json` rules: SKODA-103b and its
  sub-tickets 103c–103e. The 404 page lookup: SKODA-706.
- The slash and case rules: 103a. Head hreflang and translation pairs: 1001, 1004, 1005.
- Production host, DNS, TLS, alias rules and keeping the Search Console TXT record: SKODA-709. The document host
  itself: Q-21 (709, 523). RUM key and alerting: SKODA-712.
- The GTM and dataLayer rebuild and consent: 905, 907, 804 (D10, Q-16). Security headers: SKODA-714.

## Acceptance criteria
- [ ] The SEO owner is named in the register (D15), and Search Console access works before go-live.
- [ ] The C1 exports (Page with redirect, Not found, Links, indexed CDN PDFs) are received and filed with 713c's
      inventory, outside the served tree.
- [ ] 713a and 713c are accepted before the DNS switch; 713b is accepted before the switch if the gate is agreed.
- [ ] On launch day, the sitemaps are submitted, the GA4 annotation is set, and URL Inspection results for one
      release page and one release PDF match 713a's document policy.
- [ ] The monitoring runbook exists, and the SEO owner receives 8 weekly reports after go-live.

## Dependencies
- Sub-tickets 713a–d. SKODA-709 (production host, TXT record, alias rules), 103a (slash and case rules), 103b and
  103c–103e (rules, inbound lists), 103 (bulk metadata, sheet), 1003 (`/` row), 1001/1004/1005 (pairs).
- SKODA-712 (RUM 404 review), 714 (CSP), 710 (freeze date), 523 (PDF census), 905 and 907 (D10). If 905 leaves M2
  (G-H-08), 713d is the only vehicle for analytics continuity. Q-17 (attachments), Q-20 (freeze), Q-21 (document
  host). Client: C1–C4.
