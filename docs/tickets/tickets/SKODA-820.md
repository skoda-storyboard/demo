# SKODA-820, Story bottom "Related Stories" band (tag-based) is dropped
- **Epic:** E08, Editorial at Scale
- **Type:** import (reuses existing blocks)
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** [#123](https://github.com/skoda-storyboard/demo/issues/123)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO · **Update (late 2026-09-24):** 🟡 importer half merged in PR #113 (commit
  `e763378`: a `Style: dark` band with a curated Story Rail, plus an index-rail fallback). Open block work (≈ 1 SP):
  story-rail curated mode double-wraps cells; the dark band needs a full-width grid rule.

## Origin
Side-by-side QA of the Epiq story (2026-09-24).

## Problem
The source ends with a full-width dark band (`div.cover-box.dark`, `rgb(14 58 47)`, 1440×408):
"Related Stories · Based on tags: 2026, Epiq", a rail of **10** dated story teasers.
`tools/importer/transformers/skoda-story-cleanup.js` drops it as "index-derivable duplicate related
content". It isn't a duplicate: the sidebar "Explore more" has 3 hand-picked stories, while this
band has 10 tag-matched ones.

## Scope
- Importer: stop dropping `.cover-box .related-stories`. Emit a full-width dark section after the
  aside with the heading + "Based on tags" subtitle and the teasers.
- **Reuse, don't build:** either the SKODA-212 `story-rail` (index-driven, by the page's tags, so no
  hard-coded list) or the `carousel` rail with the 10 teasers. Prefer `story-rail` if it can filter
  by the current page's tags. Dark band styling via SKODA-218.
- The Media Box band (`.cover-box` with `.media-box`) stays deferred to **SKODA-604**, with its log line kept.
  **Correction (2026-09-24, M1 gap review §15):** for the 21 in-set stories, the Media Box → `downloads` mapping is
  owned by [SKODA-801a](SKODA-801a.md) (M1), not 604.

## Acceptance Criteria
- [ ] Epiq story renders a full-width dark "Related Stories" band after the two-column body.
- [ ] Rail visuals match `carousel-rails.md` (dated overlay cards).
- [ ] No new block code; the Media Box is still dropped with a log line.
- [ ] **Amendment (2026-09-25, sweep reconciliation):**
  - Emit a rail only where the source has one. **7 of 21** story bands are **curated**, so emit hand-picked rails
    for those. There is no "Based on tags" subtitle on curated rails; where it is shown, it is 16/32
    `rgb(196,198,199)`.
  - An empty index result removes the whole band.
  - Heading contrast on the dark band is covered by SKODA-218.
  - Re-verify after 5aed689.

## Dependencies
SKODA-212 (rails), SKODA-218 (dark-section styling), SKODA-604 (Media Box), SKODA-801.
