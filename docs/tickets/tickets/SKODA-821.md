# SKODA-821, Story body column text inset (34px extra per side)
- **Epic:** E08, Editorial at Scale
- **Type:** styling
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** [#124](https://github.com/skoda-storyboard/demo/issues/124)
- **Estimate:** 1 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO

## Problem (measured, 1440, branch preview)
Source body text starts at x=106 and is 819px wide at 1440. On the
`skoda-801-story-flatten` preview, the actual paragraph starts at x=140 and is
728px wide (the outer `.default-content-wrapper` starts at x=100, not x=140).
The EDS Gallery starts at x=136; the source *slider viewport* starts at x=96,
bleeding 10px beyond the source text edge on each side. Text and media should
**not** be flush: the 10px bleed is intentional (story-image-carousel.md).

At 768, source text is x=10/w=499 and the slider viewport x=0/w=519;
EDS text and Gallery are both x=24/w=448. At 500, source text is x=10/w=480,
slider x=0/w=500; EDS text and Gallery are both x=24/w=452.

## Scope
Adjust only story body text/container spacing to the measured source text
insets. SKODA-819 owns the slider's separate 10px bleed; do not flatten that
bleed by forcing prose and media to the same edge. Check image and embed widths
against their own source components, not against the paragraph box.

## Acceptance Criteria
- [ ] 1440: paragraphs/headings start at x≈106 and span ≈819px, not x=140/w=728.
- [ ] 768: text starts at x≈10/w≈499; 500: x≈10/w≈480. Slider viewport
      intentionally starts 10px farther left and extends 10px farther right.
- [ ] The change is story-scoped and leaves other page/template spacing intact.

## Dependencies
SKODA-801 layout (on main via SKODA-822 / PR #113); SKODA-826 global gutter (neighbour).
