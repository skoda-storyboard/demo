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

## Dependencies
- Upstream: SKODA-601 (import infra/parser conventions), SKODA-202 (hero, N/A here but shared type), SKODA-205 (tags), SKODA-502 (downloads), SKODA-505 (media-cart), SKODA-305 (MR footer)
- Downstream: SKODA-803 (bulk import at scale), SKODA-1001 (per-locale trees)

## Risks / Flags
- **Related-band source/order + autoplay (🟡):** confirm retrieval (related-by-tag vs curated) and read the inline `data-flickity` (see `carousel-rails.md`).
- Facet extraction is a normalization layer (SKODA-401): model/bodywork/category may need derivation.
- Volume: 47.5% of pages, the parser must be robust across many authoring variations, validate broadly before scale.
