# SKODA-106 — Design tokens + global CSS (re-derived, not ported)
- **Epic:** E01 — Foundation & Setup
- **Type:** setup
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–5d *(planning estimate, not a quote)*

## Summary
Establish global design tokens (colors, fonts, spacing) and global CSS re-derived from the source design — not ported from the legacy jQuery/Owl/Isotope theme.

## Description
Creates the coherent design-system foundation (CSS custom properties + global/section styles) that all E02/E03 blocks consume. Per `SKODA-EDS-DA-ARCHITECTURE.md` §5 (rebuild vanilla, no jQuery/Owl/Isotope) and `SKODA-EN-BLOCK-INVENTORY.md` §8: the source is mobile-first CSS-driven (`media-room.css` ≈295 KB, 284 `@media` rules, breakpoints at 768/992/1080px) with tiny block JS — so responsive layout re-derives cleanly into a mobile-first token system rather than a code port.

## Requirements / Spec
- Define tokens in `styles/styles.css` `:root`: color palette, font families, spacing scale, breakpoints.
- **Mobile-first** authoring; `min-width` media queries at the project's tablet/desktop breakpoints (align to the source's 768/992/1080 clusters, normalized to the boilerplate 600/900/1200 convention).
- Global + section styles in `styles/styles.css` (LCP-critical) and `styles/lazy-styles.css` (below-fold).
- Fonts in `styles/fonts.css` / `fonts/`; **Stylelint rule — font-family names unquoted** (`font-family: Roboto, sans-serif;`).
- All block CSS must consume these tokens (`var(--...)`) — no hardcoded values downstream.
- Re-derive from source computed styles; do **not** copy the legacy theme CSS wholesale.
- `width`/`height` on media to keep CLS low (source already ships dimensions).

## Acceptance Criteria
- [ ] `:root` token set (colors/fonts/spacing/breakpoints) present and documented.
- [ ] Global + section styles render; mobile-first with min-width breakpoints.
- [ ] `npm run lint` passes (incl. unquoted font-family rule).
- [ ] No legacy jQuery/Owl/Isotope CSS ported verbatim.
- [ ] A sample block styled purely via tokens (no hardcoded colors/spacing).

## Dependencies
- Upstream: SKODA-102
- Downstream: SKODA-201, SKODA-202, SKODA-203 (core blocks), SKODA-301/304 (chrome), SKODA-903 (banner block reuses tokens)

## Risks / Flags
- Re-derivation (not port) is a deliberate quality upgrade — resist pasting Figma/legacy CSS with quoted fonts (Stylelint will fail).
- Tokens are a shared contract; late changes ripple across all blocks — lock the palette/spacing scale early.
