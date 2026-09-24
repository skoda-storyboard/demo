# SKODA-822, Ship the SKODA-801 two-column story layout to `main`
- **Epic:** E08, Editorial at Scale
- **Type:** release
- **Phase:** A · **Milestone:** M1
- **Estimate:** 1 SP *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO. Needs the stakeholder go-ahead to open the PR and merge.
  **Update (late 2026-09-24):** ✅ merged as PR #113 (21:35). Close after the post-merge render check.

## Problem
The two-column story layout (body 816px + aside 408px, grid-on-main, `decorateStorySections`) and
the story heading scale (h2 40px/300) are committed on `skoda-801-story-flatten`. That branch is
pushed but **not merged** (5 ahead of and 2 behind `main` on 2026-09-24). So
`main--demo--skoda-storyboard.aem.page` stacks the aside full-width below the body (y≈4842 at
1440), with 34px/600 h2s. The branch preview already renders the two columns correctly
(816/408 vs source 819/409).

## Scope
Rebase onto `main` and open a PR with the preview link
`https://skoda-801-story-flatten--demo--skoda-storyboard.aem.page/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds`.
Merge after review, then republish the re-imported story content (SKODA-816/817/818/820).

## Acceptance Criteria
- [ ] `main` preview of the Epiq story shows body + aside side by side at ≥768.
- [ ] No regressions on home / listing / press-release templates.
