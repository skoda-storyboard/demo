# SKODA-713, SEO migration: per-locale sitemaps and robots, JSON-LD and article meta, noindex, SEO owner, monitoring

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** SEO configuration / head code / launch QA
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Sitemaps, robots and noindex must be live **before the DNS
  switch**. JSON-LD and article meta are proposed as a go-live gate (Google News, see Why).
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d, excluding client SEO and analytics time *(planning estimate,
  not a quote)*. The source findings size the parts at ≈ 10–12 SP; 5 SP holds only if the analytics amendments land
  in SKODA-905/907 and the RUM 404 review in SKODA-712.
- **GitHub issue:** to create
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-02, G-F-03, G-F-06, G-F-07, G-KT-07,
  G-KO-03.

## Why
- **Sitemaps and robots (G-F-02, High, confirmed).** The source publishes a sitemap index of 91 files for all 6
  locales, named in `robots.txt`. The demo serves the EDS default `/sitemap.xml`: one urlset of 434 URLs (433 at
  review time), all `/en` or root, 0 `xhtml:link` alternates. 26 are not content: `/nav`, `/footer`,
  `/media-room/nav` and `/footer`, `/nav-newsletter`, 19 fragments, `/en/test/listing-demo`,
  `/tools/sidekick/blocks/promo-box`. There is no per-locale sitemap config and no production `robots.txt`. Head
  hreflang is ticketed (1001, 1004, 1005); the sitemap side is not. The source has no Google News sitemap
  (`/news-sitemap.xml` 404), so there is none to rebuild.
- **Indexable chrome (G-F-07, Medium, not re-verified).** Bulk metadata sets `robots` only for `/library/**`. The
  volume grows with SKODA-806 (press-kit image fragments) and SKODA-1006 (per-locale chrome).
- **Structured data (G-F-03, High, confirmed).** Source stories carry an Article + WebPage + BreadcrumbList +
  ImageObject + WebSite + Person graph, releases a WebPage graph with `datePublished`, plus `og:type`, `og:site_name`,
  `og:locale` and alternates, `article:published_time`/`modified_time`, `og:image` width/height and robots
  `max-image-preview:large`. The demo story and release have none of these. The date is only a custom `publisheddate`
  meta, and `<title>` loses " - Škoda Storyboard". Only SKODA-807 (FAQPage) emits JSON-LD; the handoff doc assigns it
  to SKODA-205, the closed M1 tags block. The outside critic counted 44 EN and at least 100 CS (the API cap)
  Storyboard items in Google News over 30 days, so the loss shows on day one.
- **No SEO migration owner (G-F-06, High, confirmed).** Traceability 8.1 reads "full redirect map deferred; SEO
  config to validate" and maps only to the closed SKODA-103. No doc covers Search Console, a redirect-map test or
  post-launch indexation monitoring. About 58,700 legacy URLs need a class (16,246 sitemap, 42,275 attachment, 193
  unsitemapped EN stories). The live redirects sheet has 6 rows: 3 sources are slashed (refuter correction, not 2),
  which 103a forbids, and the `/` row targets a feature-branch draft. 103a's 50-URL list tests the slash rule only.
- **Analytics continuity (G-KT-07, G-KO-03, Medium, not re-verified).** Every page path changes form at cutover
  (103a drops the slash), so GA4 and Search Console page reports split into before and after. The `page.*` and
  `content.*` dimensions come from WordPress post types and categories. 804, 905 and D10 never mention a baseline,
  an annotation, a normalised path, a report or its owner. `/direct-download/` counted downloads server-side, and 520
  removes it. Shared CDN PDF URLs carry `_gl` linker params for 2 of the 7 GA4 ids in GTM-M5GMBWF.

## Scope
**Client:**
- **C1:** name the SEO owner for skoda-storyboard.com after go-live and give the team read access to the Search
  Console property before go-live (with SKODA-709's G-F-08 question on the DNS TXT tokens).
- **C2:** Škoda analytics: which reports or dashboards read Storyboard GA4 or sDrive data (PR KPIs, download counts),
  and must their series continue across the cutover?
- **C3:** export a 4-week GA4 baseline per template and locale before the freeze (Q-20 sets the freeze).
- **C4:** decide the `<title>` suffix. SKODA-610 keeps it off index titles only.

**Team:**
- **T1 Sitemaps.** One sitemap per live locale plus an index, with hreflang alternates from the translation pairs
  (1004 now, 1005 after go-live). Exclude nav, footer, fragments, drafts, test, tools and library paths.
- **T2 robots.txt** for the production host with the `Sitemap:` line. Previews keep the platform noindex (702).
- **T3 noindex (amends SKODA-103 bulk metadata).** `robots: noindex` for `/**/fragments/**`, `/fragments/**`,
  `/nav*`, `/footer`, `/*/nav`, `/*/footer`, `/drafts/**`, `/**/test/**`, `/tools/**`. Check that the patterns
  cover 806's and 1006's paths.
- **T4 Head parity.** A JSON-LD helper in `scripts.js`, fed by page metadata: NewsArticle for releases, Article for
  stories, BreadcrumbList, an Organization publisher. Author names come from authored metadata, never WordPress
  logins (the source Person node exposes e.g. `natalie.kubincova`). Add `og:type`, `og:site_name`, `og:locale`,
  `article:published_time` from `publisheddate`, and robots `max-image-preview:large` through bulk metadata. Keep
  807's FAQPage. The helper must pass the Trusted Types CSP (SKODA-714).
- **T5 URL migration QA.** Build the legacy URL inventory (all sitemaps incl. `press_kit-sitemap4`, attachments,
  unsitemapped stories, plus 103b's citation and old-slug lists). Class each URL: same path, renamed (sheet row),
  pattern rule (103b) or dropped (404/410). Run a harness against the production host before the DNS switch that
  records the final status and hop count. Fix the 3 slashed sheet rows and the `/` row (with 1003).
- **T6 Launch day.** Submit the sitemaps in Search Console; annotate the switch in GA4.
- **T7 Monitoring, 8 weeks.** A runbook for the SEO owner: weekly Search Console coverage, 404s and sitemap status.
  Misses feed the redirects sheet. The RUM 404 review is SKODA-712's.
- **T8 Analytics continuity (amends SKODA-905, with 907).** Document old-to-new `page.*` and `content.*` values,
  add a slash-normalised page dimension, give report owners path guidance, record a download-KPI decision (DAM
  delivery logs or redirect-with-event, after 103b), add the DAM delivery host to the cross-domain list. Compare
  week 1 and month 1 with the baseline.

## Not in scope
- Attachment, query-route, old-slug, `/direct-download/`, CDN and `wp-json` rules: SKODA-103b.
- The slash rule: 103a. Head hreflang and translation pairs: 1001, 1004, 1005.
- Production host, DNS, TLS and keeping the Search Console TXT record: SKODA-709. RUM key and alerting: SKODA-712.
- The GTM and dataLayer rebuild and consent: 905, 907, 804 (D10, Q-16). Security headers: SKODA-714.

## Acceptance criteria
- [ ] The production sitemap index lists one sitemap per live locale; every `<loc>` returns 200 and none is chrome,
      a fragment, a draft, a test, a tool or a library page.
- [ ] Every sitemap URL with a published translation has reciprocal `xhtml:link` alternates.
- [ ] Production `robots.txt` allows crawling and names the sitemap; `*.aem.page` and `*.aem.live` stay noindex.
- [ ] `/nav`, `/footer`, `/media-room/nav`, `/en/fragments/newsletter-card`, one media-feed fragment and
      `/en/test/listing-demo` send `robots: noindex`.
- [ ] One story, release and press kit per locale pass the Rich Results test with 0 errors, and no `ld+json`
      contains a WordPress login name.
- [ ] Those pages carry `og:type`, `og:site_name`, `og:locale`, `max-image-preview:large` and an
      `article:published_time` equal to `publisheddate`.
- [ ] Every inventory URL has a class. The pre-DNS harness run shows 0 unexpected 404s and at most 2 hops.
- [ ] The redirects sheet has no slashed source, and `/` no longer targets a draft.
- [ ] The SEO owner is named in the register (D15), Search Console access works, the sitemaps are submitted and the
      GA4 annotation is set on launch day.
- [ ] The baseline exists before the freeze; week-1 and month-1 comparisons per template and locale are delivered.

## Dependencies
- SKODA-709 (production host, TXT record), 103a (slash rule, hop count), 103b (rules, inbound lists), 103 (bulk
  metadata, sheet), 1003 (`/` row), 1001/1004/1005 (pairs), 806 and 1006 (fragment paths), 807, 610.
- SKODA-712 (RUM 404 review), 714 (CSP), 710 (freeze date), 905 and 907 (D10). If 905 leaves M2 (G-H-08), T8
  needs another vehicle. Q-17 (attachment class), Q-20 (freeze). Client: C1–C4.
