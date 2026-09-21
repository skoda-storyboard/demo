# SKODA-502, Static Downloads block (from mediakit/v1/mediabox)
- **Epic:** E05, Media Pipeline
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/downloads.md`](../../ui-specs/downloads.md)** (captured via Chrome DevTools). Read it before implementing.

Key facts from capture that change this ticket:
- Downloads is a **thumbnail grid** (flex-wrap, ~`169px` tiles, `16:9`), **not** a text list.
- Each tile = lightbox thumbnail + round download button (`40×40`, radius `50px`, white / `2px` ink border, icon `\e012`, hover `#f1f1f1`) + a **size dropdown offering only "Original" and "1920px"** (no KB/MIME label exists in source).
- API context: `mediakit/v1/mediabox/post/{id}/{lang}` → `{images:[{imageUrl,link,translated,title}]}`.
- Reuse tokens: `--pill-radius:50px`, `--dropdown-hover-bg:#f1f1f1`.

## Summary
Build a static Downloads block that renders a press page's downloadable image set as plain download links, baked at import from the `mediakit/v1/mediabox/post/{id}/{lang}` response, no cart, no signed-URL service.

## Description
The source press pages expose a per-post downloadable image set via `mediakit/v1/mediabox/post/{id}/{lang}`, which returns `{images:[{imageUrl, link, translated, title}]}`. The stateful media-cart (`media-cart/v1` state + signed-S3 `/direct-download/` bulk download) is only needed for *cross-page bulk collection* and is deferred to Phase C (SKODA-902). For the pilot, the per-page download list is a purely static block: fetch the mediabox data at import time and render labelled `<a>` download links directly.

## Requirements / Spec
- Content model: a `Downloads` block table, first row `Downloads`; each subsequent row = one asset (image/link + title + size label).
- Populate rows **at import** from the mediabox response (`images[].imageUrl` / `link` / `title`); authored fallback also supported.
- Render as static, accessible download links (labelled `<a>` with meaningful text), no cart-add, no `data-action`/state, no signed-URL resolution.
- No runtime call to `media-cart/v1` or `/direct-download/`; those are out of scope for the pilot.
- Block-scoped CSS/JS following repo conventions; degrade gracefully if a row lacks fields.

## Acceptance Criteria
Measurable gates live in [`downloads.md` §9](../../ui-specs/downloads.md); summary:
- [ ] `Downloads` renders a **thumbnail grid** (~`169px` `16:9` tiles), one tile per mediabox image.
- [ ] Each tile has a round `40×40` download button (radius `50px`, `2px` ink, hover `#f1f1f1`) + an Original/1920px size dropdown.
- [ ] Rows populated at import from `{images:[{imageUrl,link,translated,title}]}`; no cart/state/signed-URL code.
- [ ] Keyboard-accessible controls with descriptive labels; graceful on missing fields.
- [ ] Tokens-only CSS; `npm run lint` clean.

## Dependencies
- Upstream: SKODA-102 (boilerplate scaffold). / Downstream: SKODA-603 (pilot import + validation); SKODA-902 (media-cart service, Phase C) builds on this.

## Risks / Flags
- Cart service (state + signed bulk download) is 🔴 high-risk and **deferred**, do not scope-creep it into the pilot.
- Whether the cart signed-download service can be reused standalone or must be rebuilt is an open question (Phase C).
