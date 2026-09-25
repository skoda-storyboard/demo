# SKODA-820, Story bottom "Related Stories" band
- **Epic:** E08, Editorial at Scale
- **Type:** import (reuses existing blocks)
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** [#123](https://github.com/skoda-storyboard/demo/issues/123)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🟡 Epiq index-backed rail merged in PR #133; Epiq-specific
  CSS and empty-band behavior prepared on `skoda-820-epiq-visual`. Seven curated
  story bands from the sweep amendment remain. Issue #123 stays open.

## Origin
Side-by-side QA of the Epiq story (2026-09-24), extended by the
[M1 URL→block sweep](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §6/§11.

## Problem
The source ends with a full-width dark band (`div.cover-box.dark`,
`rgb(14,58,47)`): "Related Stories · Based on tags: 2026, Epiq",
with a rail of 10 dated story teasers. It is not the sidebar "Explore more"
(3 hand-picked stories). PR #113 restored the band; PR #133 switched Epiq to an
index-backed `story-rail` that ANDs `model=epiq` with `years=2026` and excludes
the current story. The remaining Epiq gap was heading contrast, subtitle
typography, card widths and section geometry. Other story bands are curated
and must not be replaced with this index filter.

## Scope of the Epiq visual PR
- Keep the published Epiq `.plain.html` configuration (`template=story`,
  `model=epiq`, `years=2026`, `limit=10`, `exclude=<self>`). No re-import for
  CSS-only work. The source date/title/image/link data remains index-driven.
- Reuse SKODA-610's shared `cleanTitle` helper for indexed teaser titles and
  image alt text, including stale index rows. SKODA-610 owns metadata cleanup
  and the remaining publication work; do not duplicate its title logic.
- Scope full-width layout, dark-band heading/subtitle and content-rail sizing
  to story `dark story-rail-container`. SKODA-218 owns cross-template dark
  sections; the generic carousel size ladder is unchanged.
- Remove the entire dark related section when the index is empty or fails,
  not merely its reserved rail mount. Generic rails keep their own collapse
  behavior. No new block.
- SKODA-801a owns the in-set Media Box → downloads mapping; SKODA-604 owns
  longer-tail assembly. Leave the Media Box drop logging alone.

## Published-content gate

At local QA on 2026-09-25 the preview and live `/en/query-index.json` each had
31 rows, including 11 Epiq+2026 stories: the Epiq page plus 10 distinct
related cards linking to EDS. If fewer are published later, show only those
actually indexed, not fabricated or source-site cards.

## CSS-extraction targets (Epiq source, Chrome DevTools, 2026-09-25)

| Viewport | Band height | Heading | Card box | Track |
|---|---:|---|---:|---:|
| 1280 | ~408px | 26px/32.5px, 600, white | ~354px | 1248px |
| 768 | ~384px | 20px/25px, 600, white | ~326px | 768px |
| 500 | ~443px | 20px/25px, 600, white | 430px | 500px |

The source subtitle is `rgb(196,198,199)`, 16px/32px, 600; the background
is `rgb(14,58,47)`, with 20px effective card gap and 10px first-card inset.
The heading switches at **769px**, while card-title sizing changes at 992px
(20px/24px below, 18px/21.6px above). Date-to-title offset is 25px.
Use computed CSS/DOM measurements, not screenshots, for visual QA.

## Acceptance Criteria
- [x] Epiq renders a full-width dark band after the two-column body with
      heading and "Based on tags" subtitle intact (PR #133).
- [x] Epiq index configuration matches both tags, excludes self, and displays
      10 distinct dated EDS links when those stories are published (PR #133).
- [x] The Epiq visual slice matched source CSS geometry at 500/768/1280 and
      edges 767/768/769/991/992 in independent local DevTools QA; the
      992px pre-build reserve, cleaned titles, arrows/focus and unaffected
      home rail were also checked. Recheck on the PR branch preview.
- [ ] **Sweep amendment:** import the 7 curated story bands, omit "Based on
      tags" where absent, and emit a band only where the source has one.
      This requires importer/content validation beyond the Epiq visual PR.
- [ ] Desktop mouse click and drag pass after SKODA-212a's shared pointer fix.
- [ ] Code review and deployed-branch preview accepted before issue closure.
- [x] No new block; Media Box remains separately owned by SKODA-801a.

## Dependencies
SKODA-212 (rails), SKODA-801 (story assembly), SKODA-603 (published rail-feed
content). SKODA-212a owns pointer input; SKODA-610 owns canonical index-title
cleanup; SKODA-218 owns other dark sections. SKODA-801a/604 own Media Box.
