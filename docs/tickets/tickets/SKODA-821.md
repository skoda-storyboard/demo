# SKODA-821, Story body column text inset (34px extra per side)
- **Epic:** E08, Editorial at Scale
- **Type:** styling
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **Estimate:** 1 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO

## Problem (measured, 1440, branch preview)
Source body text starts at x=106 and is 819px wide, flush with the column. On the
`skoda-801-story-flatten` preview, `.body-column .default-content-wrapper` text starts at x=140 and
is 728px wide (about 34px extra inset per side), while in-body blocks (gallery) use the full 816px.
Text and images therefore don't share a left edge, unlike the source.

## Scope
In `body.story main > .section.body-column`, text wrappers use the full column width, so text,
images, embeds and sliders share the column edges.

## Acceptance Criteria
- [ ] 1440: paragraphs/headings share the column's left edge (±2px) with in-body media.
- [ ] 768/500 match the source column padding.

## Dependencies
SKODA-801 layout, SKODA-822 (ship to main).
