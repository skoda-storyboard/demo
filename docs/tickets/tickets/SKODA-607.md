# SKODA-607, Press Release detail template
- **Epic:** E08, Editorial at Scale
- **Type:** template / import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/template-press-release.md`](../../ui-specs/template-press-release.md)** (captured via Chrome DevTools on the live Superb-25-years release). Read it before implementing. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture (2026-09-15) that create this ticket:
- The press release is the **single largest template, 47.5% of all EN pages**, and was previously folded into `story-detail.md`. It is a **distinct template** (`press_release-template-default`, `single-press_release`, MR side).
- **Not the story shell:** **no top hero** (text `h1.entry-title` `26px/32.5/600`), uses `.column-primary`/`.column-secondary` (66.66/33.33, **stacks <768**), and the secondary column carries **media-kit downloads + tags + newsletter + side-banner** (not the story sidebar). A **full-bleed dark related-media band** (`.cover-box.dark`, `#0e3a2f`) follows the article.
- Primary column order: lead teaser image → bullet-points (bold `›` list) → perex `16/24/600` → body `16/24/400` (`p mb 20`) → optional podcast/video embed.

## Summary
Deliver the Press Release detail template as a first-class page type, distinct from the Story template. It reuses the two-column shell but on the Media Room side with a text title (no hero), a media-kit-oriented secondary column, and a dark related-media band. Includes the press-release parser feeding the bulk import (SKODA-803).

> **Update (2026-09-24, M1 gap review, [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md)).**
>
> **In-scope pages.** The 5 press releases in the 43-URL set. As of 2026-09-24, all return 404 on preview.
>
> **Importer gaps.** The origin/main `import-press-release.js` + `skoda-press-release-cleanup.js` has three
> problems:
> - it **drops the Buzzsprout AI-audio embed**, although MR-PR03 is M1: map it to `embed` (SKODA-204)
> - it **does not model the optional related-press-release dark rail**: 4 of the 5 PRs have one and Superb has none,
>   so the importer must tolerate its absence
> - its Media Box parser emits one link per asset rather than the Original/1920 dropdown required by SKODA-502
>
> The mediabox API returns 2–5 images per PR.
>
> **Out of scope.** The newsletter and side banner stay ruled out (904/903); strip them.
>
> **Estimate.** Unchanged at 5 SP. The 5 PRs are the reference set.

## Description
Confirmed live (2026-09-15): `press_release` is its own CPT/template. This ticket delivers:
- **Two-column article shell** (`.column-primary` 66.66% / `.column-secondary` 33.33%, stack <768) on the MR chrome (MR header nav + `footer-mediaroom`).
- **Text header:** published date meta (`11px/600 #808080`) + `h1.entry-title` (`26px/32.5/600 #0a0a0a`); no hero image.
- **Primary content:** lead teaser image, bullet-points list, perex, rich-text body, inline embeds.
- **Secondary column:** "Additional info" (media contacts), "Download Media Box" (round `+`, reuse SKODA-502 downloads + media-cart), Images preview (gallery-lightbox + cart), Tags (grey chips, SKODA-205), newsletter widget, side-banner (E09).
- **Dark related-media band** after the article (reuse `carousel-rails`/media grid).
- **Press-release parser:** detect `press_release`, map header→title/date, `.bullet-points`→list, `.entry-summary`→lead, `.entry-content`→body, secondary sections→aside blocks, `.cover-box.dark`→related; emit one canonical Metadata block (template=press-release, model, bodywork, category, date). No hero synthesised.

## Requirements / Spec
- Reuse the story two-column CSS; switch content + side, do not fork the template.
- MR chrome selected by `body.media-room` equivalent / `template=press-release` Metadata.
- Secondary column composes existing blocks (downloads, tags, newsletter, media-cart, promo-banner).
- Parser is content-driven; no new markup invented; feeds SKODA-803 at scale.

## Acceptance Criteria
Measurable gates live in [`template-press-release.md` §10](../../ui-specs/template-press-release.md); summary:
- [ ] MR shell (switcher=Media Room, MR nav, MR footer); single `h1` = text title `26px/32.5/600 #0a0a0a`, date meta `11px/600 #808080` above; **no hero**.
- [ ] Two-column `66.66/33.33` (`.column-primary`/`.column-secondary`) ≥768; **stacks single-column <768**.
- [ ] Primary: lead image → bullet-points → perex `16/24/600` → body `16/24/400` (`p mb 20`) → embeds.
- [ ] Secondary: Additional info + Download Media Box (round `+`) + Images preview (lightbox/cart) + Tags (grey chips) + newsletter + side-banner.
- [ ] Full-bleed dark related-media band (`#0e3a2f`) after the article, `margin-top 32px`.
- [ ] Parser output for ≥2 releases matches source structure/order in local preview; Metadata passes lint.
- [ ] Visual diff vs source at 1280/1024/768/500 ≤ 2% per-pixel.
- [ ] **Amendment (2026-09-25, sweep reconciliation):**
  - **The two-column shell is not built yet.** Verified live: EDS prose is 1248px with no sidebar, while the source
    has 812px prose + a 342px sidebar inside 832 + 416 columns. It must render on all 5 M1 press releases.
  - Sidebar images are 2-col 16:9 171×97 thumbs + a "+N" pill, not a 3:2 full-width stage. The Tags heading is
    present.
  - Bullets, newsletter and the related band are **optional**. The Media Box and Related are two separate
    full-bleed bands.
  - The importer emits the per-release Buzzsprout/Vimeo into Embeds (agent lane, +0.5).
  - Quotes → SKODA-220. The grey info callout → SKODA-824 (grey variant).

## Dependencies
- Upstream: SKODA-601 (import infra/parser conventions), SKODA-202 (hero, N/A here but shared type), SKODA-205 (tags), SKODA-502 (downloads), SKODA-505 (media-cart), SKODA-305 (MR footer)
- Downstream: SKODA-803 (bulk import at scale), SKODA-1001 (per-locale trees)

## Risks / Flags
- **Related-band source/order + autoplay (🟡):** confirm retrieval (related-by-tag vs curated) and read the inline `data-flickity` (see `carousel-rails.md`).
- Facet extraction is a normalization layer (SKODA-401): model/bodywork/category may need derivation.
- Volume: 47.5% of pages, the parser must be robust across many authoring variations, validate broadly before scale.
