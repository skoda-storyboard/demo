# SKODA-713a, Per-locale sitemaps, production robots.txt, noindex for chrome, document index policy

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** SEO configuration
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Live **before the DNS switch**.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d, excluding the Q-21 decision and CDN lead time *(planning
  estimate, not a quote)*
- **GitHub issue:** [#430](https://github.com/skoda-storyboard/demo/issues/430) (created 2026-10-21, sub-issue of #420)
- Parent: SKODA-713 ([#420](https://github.com/skoda-storyboard/demo/issues/420))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-02, G-F-07, G-T8-06 (with G-T8-01).

## Why
- **Sitemaps and robots (G-F-02, High, confirmed).** The source publishes a sitemap index of 91 files for all 6
  locales, named in `robots.txt`. The demo serves the EDS default `/sitemap.xml`: one urlset of 434 URLs (433 at
  review time), all `/en` or root, 0 `xhtml:link` alternates. 26 are not content: `/nav`, `/footer`,
  `/media-room/nav` and `/footer`, `/nav-newsletter`, 19 fragments, `/en/test/listing-demo`,
  `/tools/sidekick/blocks/promo-box`. There is no per-locale sitemap config and no production `robots.txt`. The
  source has no Google News sitemap (`/news-sitemap.xml` 404), so there is none to rebuild.
- **Indexable chrome (G-F-07, Medium, not re-verified).** Bulk metadata sets `robots` only for `/library/**`. The
  volume grows with SKODA-806 (press-kit image fragments) and SKODA-1006 (per-locale chrome).
- **No document index policy (G-T8-06, Medium).** The source CDN PDFs are indexed today: 9 CDN PDF items in Google
  News over 30 days, listed under the Master template's generic title. The migrated PDFs, MP4s and originals are
  served from `publish-p220607-e2281243.adobeaemcloud.com`, whose `robots.txt` is `Disallow: /`, with
  `content-disposition: attachment` (G-T8-01, High, confirmed; 2,831 manifest rows, 227 of them documents). No
  ticket decides whether release PDFs should rank (a crawlable host with a canonical header to the HTML release) or
  carry `X-Robots-Tag: noindex` so that the HTML release with its NewsArticle JSON-LD (713b) ranks instead.

## Scope
- **T1 Sitemaps.** One sitemap per live locale plus an index, with hreflang alternates from the translation pairs
  (1004 now, 1005 after go-live). Exclude nav, footer, fragments, drafts, test, tools and library paths.
- **T2 robots.txt** for the production host with the `Sitemap:` line. Previews keep the platform noindex (702).
  A robots rule for the document host that Q-21 chooses, matching the T4 policy.
- **T3 noindex (amends SKODA-103 bulk metadata).** `robots: noindex` for `/**/fragments/**`, `/fragments/**`,
  `/nav*`, `/footer`, `/*/nav`, `/*/footer`, `/drafts/**`, `/**/test/**`, `/tools/**`. Check that the patterns
  cover 806's and 1006's paths.
- **T4 Document index policy (G-T8-06).** With the SEO owner, choose per document kind (release PDF, press-kit PDF,
  MP4, original): crawlable with a `Link: <release URL>; rel="canonical"` header, or `X-Robots-Tag: noindex`. Set
  the header rule on the document host (Q-21, through SKODA-709's CDN). Record the choice in the Q-21 row.

## Not in scope
- Choosing and setting up the document host: Q-21, SKODA-709 and 523. Redirects from the source CDN: SKODA-103e.
- Head hreflang: 1001, 1004, 1005. JSON-LD and article meta: 713b. Launch-day submission: SKODA-713.

## Acceptance criteria
- [ ] The production sitemap index lists one sitemap per live locale; every `<loc>` returns 200 and none is chrome,
      a fragment, a draft, a test, a tool or a library page.
- [ ] Every sitemap URL with a published translation has reciprocal `xhtml:link` alternates.
- [ ] Production `robots.txt` allows crawling and names the sitemap; `*.aem.page` and `*.aem.live` stay noindex.
- [ ] `/nav`, `/footer`, `/media-room/nav`, `/en/fragments/newsletter-card`, one media-feed fragment and
      `/en/test/listing-demo` send `robots: noindex`.
- [ ] The document policy is recorded per document kind. One migrated release PDF on the document host answers with
      the chosen header, and the host's `robots.txt` doesn't block what the policy wants indexed.

## Dependencies
- SKODA-709 (production host and CDN header rules), Q-21 (document host), 103 (bulk metadata), 1004/1005 (pairs),
  806 and 1006 (fragment paths), 702 (preview noindex), 523 (document kinds). Parent: SKODA-713 (SEO owner, C1).
