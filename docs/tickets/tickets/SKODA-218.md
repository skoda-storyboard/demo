# SKODA-218, Metadata-driven dark section styling

- **Epic:** E02, Core Blocks
- **Type:** section styling
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-28):** 🟡 In review, branch `skoda-218-dark-sections`. The Storyboard Series and Social media
  bands and the Media Room Models band are `Style: cover-box, dark` (importer: `transformers/skoda-dark-bands.js` +
  `parsers/social-cards.js`); the dark bands take live's own margin, 2.25em auto 1.5em (Media Room 0 auto 1em), with
  the measured inner spacing. The story dark panel amendment moves to SKODA-824 (in-column). Open elsewhere: Series has
  no cards until the index carries Series rows (SKODA-603/608); the visible gaps around the bands (44/24 vs live 64/62)
  need the light home sections as cover-boxes too (SKODA-611a/611b); the page gutter (SKODA-826).

## UI Specification
[`template-home.md`](../../ui-specs/template-home.md) measures the Storyboard
Social media and Series bands, and the Media Room Models band. Source:
`https://www.skoda-storyboard.com/en/`. Section rules already exist in
`styles/styles.css`; this ticket completes their use and visual parity.

## Summary
Use EDS **Section Metadata** (`Style: cover-box, dark`: two classes, `cover-box` + `dark`) for dark-green
content bands instead of a Series-specific carousel style or a new block.
Ensure the authored/imported homepage marks the Social media and Series sections
as dark, and that their headings, links, cards, and controls are legible.

## Requirements / Spec
- Keep section styling separate from block configuration: `story-rail`/`carousel`
  selects Series items; section metadata controls the band's background and
  foreground. Use the existing `.section.dark` and `--dark-color` (`#0e3a2f`)
  primitive, extending section-level styles only where parity is missing. Do not
  put page-specific rules on all carousels/cards.
- The dark background spans the viewport **up to 1440px, then is capped and centred** (live: x240 w1440 at 1920,
  x1000 at 3440; every home section is capped the same way); the inner content remains capped at
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
- [ ] Section Metadata `Style: cover-box, dark` produces a green band (full width up to 1440px, centred above)
      with a 1248px-capped inner region at 1280/768/500px; no new block is required.
- [ ] Storyboard `/en/` has dark Social media and Series bands in the correct
      positions; their headings/links/rail controls and social cards remain readable
      and keyboard focus visible. Adjacent light sections remain light.
- [ ] Other section styles and existing dark bands do not regress; browser
      comparison against source at 1280/768/500px checks color, geometry, and
      contrast. `npm run lint:css` and focused checks pass.

## Amendments (2026-09-25, sweep reconciliation, [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §6 + §11.1 V3)
- [ ] **Heading contrast on every dark band** (Related Stories, the press-release bands, home bands). h1–h6 inside
      `.section.dark` (and `cover-box dark`) are white, not `rgb(22,23,24)`. Today the global `h*` colour beats the
      section style (`styles/styles.css:210–224`). Check with computed style plus a WCAG AA contrast check.
- [ ] The dark SiteOrigin `panel-row-style` band (`#0e3a2f`) that stories import becomes a dark section with its
      source padding.
- Boundary with SKODA-824: 218 owns **section-level** dark bands. 824 owns the **in-column** highlight panel
  (dark + grey variants) inside the story body column. Both share the colour tokens.
- Not a defect: the Epiq Related band's 1248px box is fine, because its `::before` paints the green full-bleed to
  1440 (verified live).

## Follow-ups from the SKODA-217 review ([PR #188](https://github.com/skoda-storyboard/demo/pull/188), 2026-09-28)
- **Style name.** `Style: cover-box, dark` (comma) for every home dark band. Written without the comma, EDS makes one
  class, `cover-box-dark`, which nothing styles. The 217 Social media band emits `cover-box, dark` since `4446cd9`.
- **Shared rules, not per-band CSS.** 217 styles its own section (`:has(.cards.social)` in `styles/styles.css`).
  Move to the shared dark / home-band rules here:
  - the heading colour (h1–h6 in a dark band = white; the amendment above);
  - the home section heading (centred 26/32.5/600, 20px gap to the content; template-home §7);
  - the 1440px cap and the band spacing (the social band's own 64/80 inner spacing stays a social value).
  Keep only social-specific values with the Cards (social) variant.
- **Every home section is capped at 1440px on live, light ones too** (e.g. "Models" at x240 w1440 at 1920). Ours
  are full width. Cap them with the same shared rule (or record the light sections on SKODA-611b).
  → Done in SKODA-611a: light home bands are `Style: cover-box` sections, and `.section.cover-box` is the shared
  1440px cap. The dark-band padding and margins are keyed on `.cover-box.dark`.

## Dependencies
- Upstream: SKODA-106 (tokens/section CSS).
- Integration: SKODA-212 (Series rail), SKODA-217 (social cards),
  SKODA-603 (homepage content/pilot pages).
