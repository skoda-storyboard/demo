# SKODA-103c, Attachment pages and WordPress archive routes: pattern rules and rows

- **Epic:** E01, Foundation & Setup
- **Type:** infrastructure (CDN rules) / import
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Live **before the DNS switch**, in the 103a CDN layer.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d, excluding the C1 export and CDN lead time *(planning
  estimate, not a quote)*. Round 2 adds ≈ 0.25 SP for the archive routes.
- **GitHub issue:** [#434](https://github.com/skoda-storyboard/demo/issues/434) (created 2026-10-21, sub-issue of #422)
- Parent: SKODA-103b ([#422](https://github.com/skoda-storyboard/demo/issues/422))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-F-04 (G-E-02 merged), G-T3-02,
  G-T7-06.

## Why
- **Attachment pages (G-F-04, High, confirmed).** 42,275 in 55 sitemaps, 200 with `index, follow`, canonical = the
  CDN file. Shapes: `{post-path}/attachment/{slug}/` and `/?attachment_id=N` (794 of 929 in sitemap 55). Bodies link
  them (3 on a sampled 2019 release). After 103a they become `…/attachment/{slug}` and 404. The media decision is
  "no item pages".
- **Root-level attachment pages (G-T3-02, Medium, not re-verified).** E.g.
  `/en/150605-skoda-superb-for-czech-president-001-3/` (body class `attachment single-attachment`). They look like
  post slugs, so no pattern can catch them: 7 of 249 distinct Wikimedia-cited URLs (vs 4 `/attachment/`). 3 contain
  underscores, and 4 cited paths change under the importer's path normalisation.
- **Archive routes (G-T7-06, Medium).** `/en/press-releases/page/2/` returns 200 with a self canonical ("Page 2 of
  264"), `/en/2024/05/` returns 200, and every post has an `/embed/` route (the oEmbed iframe other sites use). The
  demo 404s all three. The EDS listings don't use path pagination, so these need pattern rules, not rows.

## Scope
- **T1 Attachments (Q-17 default: parent post, else 410, never the home page).** CDN rule
  `^(.*)/attachment/[^/]+/?$` to `$1` (slashless). Root-level slugs via rows from the parent's C1 export, keyed on
  the raw source path. Build the attachment id to parent map that 103d's query rule uses for `?attachment_id=N`.
- **T2 In-body links (amends SKODA-605):** rewrite `/attachment/` links to the parent post or the DAM file at import.
- **T3 Archive routes (G-T7-06).** `^(.*)/page/\d+/?$` to `$1`; `^(.*)/embed/?$` to `$1`;
  `^/{loc}/\d{4}(/\d{2})?/?$` to the locale news listing, or 410 (record the decision with Q-17).

## Not in scope
- Query routes, including the `?attachment_id=` rule itself: 103d. The slash rule: 103a.

## Acceptance criteria
- [ ] 10 samples each of `/attachment/`, root-level and `?attachment_id=` URLs end on the parent post (200) or 410, as
      Q-17 decides; none ends on the home page.
- [ ] `/en/press-releases/page/2/` ends on `/en/press-releases`, and one post's `/embed/` ends on the post.
- [ ] `/en/2024/05/` ends on the locale news listing or 410, as decided.
- [ ] A re-imported sample of 20 bodies has 0 links to `/attachment/` paths.
- [ ] Every test URL takes at most 2 hops; the samples are on the combined 103a test list.

## Dependencies
- Q-17; parent C1 (attachment table). SKODA-103a (order), 103d (`?attachment_id=` rule), 605 (in-body rewrite),
  709 (pattern rules on the CDN), 713c (harness). Parent: SKODA-103b.
