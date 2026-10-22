# SKODA-713c, Legacy URL inventory and pre-DNS redirect harness

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** launch QA / data
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). The harness runs against the production host **before the
  DNS switch**.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d, excluding the client exports *(planning estimate, not a
  quote)*. Round 2 adds ≈ 0.5 SP (archive classes, near-miss set, alias set, PDF links).
- **GitHub issue:** [#432](https://github.com/skoda-storyboard/demo/issues/432) (created 2026-10-21, sub-issue of #420)
- Parent: SKODA-713 ([#420](https://github.com/skoda-storyboard/demo/issues/420))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-06, G-T7-06, G-T7-07, G-T5-05,
  G-T8-07.

## Why
- **No URL migration QA (G-F-06, High, confirmed).** Traceability 8.1 reads "full redirect map deferred; SEO config
  to validate" and maps only to the closed SKODA-103. About 58,700 legacy URLs need a class (16,246 sitemap, 42,275
  attachment, 193 unsitemapped EN stories). The live redirects sheet has 6 rows: 3 sources are slashed (refuter
  correction, not 2), which 103a forbids, and the `/` row targets a feature-branch draft. 103a's 50-URL list tests
  the slash rule only.
- **Archive routes (G-T7-06, Medium).** `/page/N/` pagination (self-canonical; 264 pages for EN releases alone,
  about 2,000 estimated for the primary listings), `/YYYY/MM/` date archives (about 12 a year per locale) and the
  per-post `/embed/` (one per REST item, 12,019) return 200 on the source and 404 on the demo. They are in no
  sitemap, so the inventory misses them.
- **Near-miss URLs (G-T7-07, Low).** Truncated and mistyped URLs can't be enumerated, so "every inventory URL has a
  class" can pass while they 404. WordPress's own target isn't ground truth: 2 of 4 ambiguous truncation probes land
  in another language (EN to CS, CS to SR).
- **Alias hosts (G-T5-05, Medium).** Alias path handling works today only through WordPress's permalink guess (e.g.
  `skoda-newsroom.com/en/` lands on an unrelated release). `media.skoda-auto.com` has 9,105 archived SharePoint-era
  URLs, 723 of them first captured in 2024–2026. SKODA-709 has 2 alias test URLs.
- **Links inside PDFs (G-T8-07, Low).** 24 of 96 sampled PDFs link 46 Storyboard page URLs, 42 of them slashed.
  They sit in files that can't change, and the inventory doesn't read documents.

## Scope
- **T1 Inventory.** All sitemaps incl. `press_kit-sitemap4`, attachments, unsitemapped stories, 103b's citation and
  old-slug lists, the parent's C1 Search Console exports, the archive route classes (G-T7-06) and the page links
  from SKODA-523's PDF census (G-T8-07). Stored outside the served tree.
- **T2 Classes.** Each URL: same path, renamed (sheet row), pattern rule (103b sub-tickets), or dropped (404/410).
  Archive routes follow the 103c rules.
- **T3 Near-miss regression set (G-T7-07).** The gap review's `probes.json` (57 URLs, 8 classes) with an expected EDS
  outcome per URL (row, lookup or search), not the source `Location`. Refresh it from 103b's C2 logs and the Search
  Console exports. A cross-locale target counts as a fail.
- **T4 Alias set (G-T5-05).** About 15 alias-host URLs sampled from the Wayback CDX list, including
  `media.skoda-auto.com` legacy portal paths, with the outcomes 709's alias rule spec defines.
- **T5 Harness.** A script that runs the inventory and both sets against the production host before the DNS
  switch and records the final status and hop count per URL. Fix the 3 slashed sheet rows and the `/` row (with
  1003).

## Not in scope
- Writing the rules: 103a, 103b–103e, 709 (aliases). Post-launch monitoring: the parent ticket.

## Acceptance criteria
- [ ] Every inventory URL has a class. The pre-DNS harness run shows 0 unexpected 404s and at most 2 hops.
- [ ] The inventory includes the archive classes; `/en/press-releases/page/2/`, `/en/2024/05/` and one post's
      `/embed/` end as the 103c rules decide.
- [ ] Every URL in the near-miss set matches its expected outcome; none lands in another locale.
- [ ] The ≈ 15 alias URLs match 709's rule spec; none ends on an unrelated page.
- [ ] The 46 page links from the PDF census end in 200 in at most 2 hops.
- [ ] The redirects sheet has no slashed source, and `/` no longer targets a draft.

## Dependencies
- SKODA-103a (slash and case rules), 103b–103e (rules, inbound lists, C2 logs), 709 (alias rules, production
  host), 523 (PDF census), 103 (sheet), 1003 (`/` row). Parent: SKODA-713 (C1 exports).
