# SKODA-217, Homepage social-media icon cards

- **Epic:** E02, Core Blocks
- **Type:** block variant
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1–2d *(planning estimate, not a quote)*

## UI Specification
Source: `https://www.skoda-storyboard.com/en/`, the `.socials-static .type-social` section.
Home composition and section styling: [`template-home.md`](../../ui-specs/template-home.md);
existing card unit: [`card-teaser.md`](../../ui-specs/card-teaser.md).

## Summary
Render the homepage's three **follow-profile** icon cards as an explicit `Cards (social)`
variant (or equivalent reusable authored social-card treatment). SKODA-201 built the
generic card variants, but did not specify or accept these icon-only homepage cards.

## Requirements / Spec
- Preserve the three authored destinations and labels: Facebook `@skodaglobal`
  (`https://www.facebook.com/skodaglobal/`), Instagram `@skodagram`
  (`https://www.instagram.com/skodagram/`), and YouTube `@skoda`
  (`https://www.youtube.com/@skoda`). These are external **profile links**, not
  share-intent URLs or a live social feed.
- Render a recognizable, accessible SVG icon and visible handle for each card; one
  labeled, keyboard-focusable external link per card. Reuse the existing Cards
  decoration where feasible; do not infer destinations from icon names or fetch
  social APIs. DA authors can edit the link and visible handle.
- Match the source's centered grid: one column below 640px, three columns at and
  above 640px, maximum grid width 720px, card area aspect ratio 1 / 0.8, icon
  approximately 76px wide, icon and handle centered with a 20px gap. Use design
  tokens and component-scoped CSS per
  [`css-guidelines.md`](../../guardrails/css-guidelines.md).
- The containing dark band is **SKODA-218** (Section Metadata), not this block.
  Do not change SKODA-304's footer profile icons, SKODA-215's gallery share links,
  or the page-level `social-share` control.

## Acceptance Criteria
- [ ] `/en/` displays exactly three social profile cards in the source order, with
      correct external URLs, recognizable SVG icons, visible handles, and accessible
      names; keyboard focus is visible and external links are safe.
- [ ] The grid is centered, at most 720px wide, three columns at 1280/768px and
      one column at 500px; icon/card proportions match the live homepage.
- [ ] The cards render in the Social media section without imposing a dark
      background on the block or changing ordinary Cards and footer icons.
- [ ] Browser comparison at 1280/768/500px checks icon, text, layout, and focus
      against the source; lint and focused tests pass.

## Dependencies
- Upstream: SKODA-201 (generic Cards), SKODA-106 (tokens).
- Integration: SKODA-218 (dark section), SKODA-603 (homepage content/pilot pages).
