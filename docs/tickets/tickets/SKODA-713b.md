# SKODA-713b, Structured data and article meta: JSON-LD helper, og and article tags, image preview

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** head code / bulk metadata
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Proposed as a go-live gate (Google News).
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*. Covers the helper, the
  meta tags, tests per template and the Rich Results runs per locale.
- **GitHub issue:** to create
- Parent: SKODA-713 ([#420](https://github.com/skoda-storyboard/demo/issues/420))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-03.

## Why
- **Structured data (G-F-03, High, confirmed).** Source stories carry an Article + WebPage + BreadcrumbList +
  ImageObject + WebSite + Person graph, releases a WebPage graph with `datePublished`, plus `og:type`, `og:site_name`,
  `og:locale` and alternates, `article:published_time`/`modified_time`, `og:image` width/height and robots
  `max-image-preview:large`. The demo story and release have none of these. The date is only a custom
  `publisheddate` meta, and `<title>` loses " - Škoda Storyboard".
- **No vehicle.** Only SKODA-807 (FAQPage) emits JSON-LD. The handoff doc assigns JSON-LD to SKODA-205, the closed
  M1 tags block, which has no structured-data scope.
- **Day-one impact.** The outside critic counted 44 EN and at least 100 CS (the API cap) Storyboard items in Google
  News over 30 days.
- **Privacy.** The source Person node exposes WordPress login names, which must not carry over.

## Scope
- **T1 JSON-LD helper** in `scripts.js`, fed by page metadata: NewsArticle for releases, Article for stories,
  BreadcrumbList, an Organization publisher. Author names come from authored metadata, never WordPress logins. Keep
  807's FAQPage. The helper must pass the Trusted Types CSP (SKODA-714).
- **T2 Meta tags.** `og:type`, `og:site_name`, `og:locale`, `article:published_time` from `publisheddate`, and
  robots `max-image-preview:large` through bulk metadata.
- **T3 Title suffix.** Apply the parent's C4 decision; SKODA-610 keeps the suffix off index titles only.
- **T4 Tests.** Unit tests for the helper per template; a Rich Results run per template and locale.

## Not in scope
- hreflang and `og:locale:alternate` pairs: 1001, 1004, 1005. Document metadata (PDF Title, Lang, Author): the
  Master template checklist in SKODA-103b C4.

## Acceptance criteria
- [ ] One story, release and press kit per locale pass the Rich Results test with 0 errors, and no `ld+json`
      contains a WordPress login name.
- [ ] Those pages carry `og:type`, `og:site_name`, `og:locale`, `max-image-preview:large` and an
      `article:published_time` equal to `publisheddate`.
- [ ] 807's FAQPage still validates; the helper runs with the SKODA-714 CSP and no console errors.
- [ ] `<title>` follows the C4 decision on every template.

## Dependencies
- SKODA-714 (CSP), 807 (FAQPage), 610 (index titles), 1001/1004 (locales). Parent: SKODA-713 (C4).
