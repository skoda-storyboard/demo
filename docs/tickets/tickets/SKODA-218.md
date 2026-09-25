# SKODA-218, Metadata-driven dark section styling

- **Epic:** E02, Core Blocks
- **Type:** section styling
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1–2d *(planning estimate, not a quote)*

## UI Specification
[`template-home.md`](../../ui-specs/template-home.md) measures the Storyboard
Social media and Series bands, and the Media Room Models band. Source:
`https://www.skoda-storyboard.com/en/`. Section rules already exist in
`styles/styles.css`; this ticket completes their use and visual parity.

## Summary
Use EDS **Section Metadata** (`Style: cover-box dark`) for full-width dark-green
content bands instead of a Series-specific carousel style or a new block.
Ensure the authored/imported homepage marks the Social media and Series sections
as dark, and that their headings, links, cards, and controls are legible.

## Requirements / Spec
- Keep section styling separate from block configuration: `story-rail`/`carousel`
  selects Series items; section metadata controls the band's background and
  foreground. Use the existing `.section.dark` and `--dark-color` (`#0e3a2f`)
  primitive, extending section-level styles only where parity is missing. Do not
  put page-specific rules on all carousels/cards.
- The dark background spans the viewport; the inner content remains capped at
  1248px. Match the home spec's section spacing (12px vertical at the source),
  headings (26px / 32.5px / weight 600), and readable white foreground/links.
  Light sections remain white. Ensure no selector leakage to other page sections;
  if the generic dark style changes, check existing dark bands as well.
- Apply section metadata in the homepage authoring/import path for Social media
  and Series, not by matching heading text or URL. Keep the same mechanism reusable
  for the Media Room Models band and other dark related-content sections.
- Follow [`css-guidelines.md`](../../guardrails/css-guidelines.md): reuse tokens,
  fluid and intrinsic layout first, and no new breakpoint without a behavior change.

## Acceptance Criteria
- [ ] Section Metadata `Style: cover-box dark` produces a full-width green band
      with a 1248px-capped inner region at 1280/768/500px; no new block is required.
- [ ] Storyboard `/en/` has dark Social media and Series bands in the correct
      positions; their headings/links/rail controls and social cards remain readable
      and keyboard focus visible. Adjacent light sections remain light.
- [ ] Other section styles and existing dark bands do not regress; browser
      comparison against source at 1280/768/500px checks color, geometry, and
      contrast. `npm run lint:css` and focused checks pass.

## Dependencies
- Upstream: SKODA-106 (tokens/section CSS).
- Integration: SKODA-212 (Series rail), SKODA-217 (social cards),
  SKODA-603 (homepage content/pilot pages).
