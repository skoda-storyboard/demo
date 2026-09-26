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
  hard-coded list) or the `carousel` rail with the 10 teasers. Prefer `story-rail`:
  derive the specific `epiq` tag from the source "Based on tags" heading and
  author it as `tag | epiq`, `template | story`, `limit | 10`. Do not filter on
  generic `2026` alone. Keep the source heading/subtitle. The existing
  `main .section.dark` styling provides the green band; SKODA-218 is a
  separate cross-template Section Metadata styling ticket.
- The Media Box band (`.cover-box` with `.media-box`) stays deferred to **SKODA-604**, with its log line kept.
  **Correction (2026-09-24, M1 gap review §15):** for the 21 in-set stories, the Media Box → `downloads` mapping is
  owned by [SKODA-801a](SKODA-801a.md) (M1), not 604.

## Content gate (measured 2026-09-24)
Chrome DevTools confirms 10 distinct story links in the source band (read the
`.entry-title a` link, not the image lightbox link). On that date the published
EDS index contained **8 stories total and only 1 with an `epiq` tag**.
Recheck the live index after SKODA-603's subsequent publishes: an index-driven
rail can show only the stories with matching published URLs and metadata.
Build/test the band independently; do not duplicate or invent cards to reach 10.

PR #113 merged a **curated source-teaser rail** for bands with source cards and
an index-driven fallback only when the source band has none. That restores the
band visually, but does not by itself prove that the cards link to published EDS
stories. SKODA-605 may have rewritten eligible source-host links since the
initial import; verify the currently published destinations. For tag-based
bands, use the tag-scoped index configuration above once matching stories are
published and re-import; keep explicitly curated bands curated.

## Acceptance Criteria
- [ ] Epiq story renders a full-width dark "Related Stories" band after the two-column body.
- [ ] Rail visuals match `carousel-rails.md` (dated overlay cards).
- [ ] With at least 10 published Epiq-tagged stories, show 10 distinct dated cards; with
      fewer, show only the matching published cards, never empty duplicates or
      source-site links when migrated destinations exist.
- [ ] No new block code; the Media Box is still dropped with a log line.
- [ ] **Amendment (2026-09-25, sweep reconciliation):**
  - Emit a rail only where the source has one. **7 of 21** story bands are **curated**, so emit hand-picked rails
    for those. There is no "Based on tags" subtitle on curated rails; where it is shown, it is 16/32
    `rgb(196,198,199)`.
  - An empty index result removes the whole band.
  - Heading contrast on the dark band is covered by SKODA-218.
  - Re-verify after 5aed689.

## Dependencies
SKODA-212 (rails), SKODA-801 (story assembly), SKODA-218 (heading contrast on the dark band, sweep amendment).
SKODA-603 is the content integration gate for 10-card visual fidelity; SKODA-604's Media Box is separate.
