# Škoda Demo — Per-Template Content Models (Phase 1 #9)

The DA authoring shape (ordered sections + block tables) each of the 23 templates imports to. This is the
parser/transformer target: for each template, the sequence of sections and the block table (name + config
rows) the importer must emit. Visual detail lives in the `docs/ui-specs/template-*.md` specs; the metadata
each item carries lives in `SKODA-METADATA-SCHEMA.md`; reuse decisions in `SKODA-BLOCK-DATA-MODEL.md`.

Legend: **Meta** = the Metadata block emitted (drives the query-index). Rows shown as `| key | value |`.
Ordered Tier-1 first (build/import order per the 2026-09-17 sequencing decision).

---

## TIER 1 — irreducible core

### T1 · Storyboard home (`/en/`) — `en-landing` (DONE, polish only)
Sections: featured promo → Latest Stories → Social (dark) → Models → eMobility → Lifestyle →
Škoda World → Series (dark) → Latest News. Already built + live. Blocks:
`stories` (promo, offset 0 limit 3) · `stories` (latest, offset 3) · `cards-social` · `story-rail`×
(Models `template=skoda_model`, eMobility `category=emobility`, Lifestyle, Škoda World, Series
`template=skoda_series`, Latest News `category=press-releases`). Meta: `template=page`.

### T2 · Story detail — Shell A (two-column)
Sections: hero → columns(primary: rich text + `gallery-lightbox` + `embeds` + `press-kit-media`;
secondary: `tags` + `newsletter` + `social-share`) → related `story-rail`.
Meta: `title, description, image, publisheddate, category, tags, model?, template=story`.

### T3 · Storyboard model page (`/en/skoda-model/<slug>/`)
Sections: `hero` (overlay carousel) → icon section-nav → "Model Description" rich text → key-facts →
5× `story-rail` (News `template=press_release tags=<model>`, Press Kits `template=press_kit tags=<model>`,
Stories `template=story tags=<model>`, Images `template=image tags=<model>`, Videos `template=video
tags=<model>`). Meta: `title, image, template=skoda_model, model=<slug>, tags=<slug>`.

### T4 · Series directory (`/en/series-2/`) — Shell B tiles, `series variant=directory`
Sections: `hero` (overlay) → `cards-overlay` grid of series cards.
Meta: `template=page`.

### T5 · Series hub (`/en/series/<slug>/`) — `series variant=hub`
Sections: `hero` (overlay) → curated `cards-overlay` story grid (FIXED, no load-more).
Meta: `title, image, template=skoda_series`.

### T6 · Media Room home (`/en/media-room/`)
Sections: featured promo → News feed (`stories template=press_release`, load-more) → Models (dark,
`story-rail template=skoda_model`) → Latest Stories (`story-rail template=story`) → Images
(`story-rail template=image`) → Videos (`story-rail template=video`) → Press Kits (`story-rail
template=press_kit`). Footer = `footer-mediaroom`. Meta: `template=page`.

### T7 · Category listing (`/en/category/<slug>/`, incl. podcast) — `card-teaser` grid + load-more
Sections: `hero` → `stories` (or `listing` no-facets) filtered `category=<slug>`, load-more. No facets.
Meta: `template=page`.

### T8 · Tag/model listing (`/en/tag/model/<slug>/`)
Sections: CTA `hero` (Discover/Configure/Images/Videos) → filtered grid `tags=<slug>` + load-more.
Meta: `template=page`.

---

## TIER 2 — differentiators (after Tier-1 green)

### T9 · Faceted listing — News (`/en/news/`) — Shell C `listing`
`| listing |` · `template=press_release` · `facets=model,derivative,year,company,event,technology` ·
`sort=newest` · `perpage=6` · `columns=3`. Meta: `template=page`.

### T10 · Images listing (`/en/images/`) — `listing` `columns=4` + `gallery-lightbox` + `media-cart`
`| listing |` · `template=image` · `facets=...` · `columns=4`. Per-item cells add add-to-cart + lightbox.

### T11 · Videos listing (`/en/videos/`) — `listing` + `embeds` (Vimeo) + `media-cart`
`| listing |` · `template=video` · `columns=3`. Cells add Vimeo thumb + add-to-cart.

### T12 · Press-kit hub (`/en/press-kits/<slug>/`) — Shell B tiles
Sections: `hero` → chapter-nav → `cards-overlay` chapter tiles → `downloads` (whole-kit ZIP) →
`faq-accordion`. Meta: `title, image, template=press_kit, tags=<model>`.

### T13 · Press-kit chapter — Shell A (two-column, no top hero)
columns(primary: `chapter-nav` + article body + `gallery-lightbox` + `press-kit-media` [large Media Box];
secondary: `downloads` + `tags`). Meta: `template=page` (chapter sub-page).

### T14 · Press-kit resource (infographics) — `press-kit-variant`
Grid of preview→PDF/JPG dual-format items. Meta: `template=page`.

### T15 · Press release detail (`/en/press-releases/<slug>/`) — Shell A, MR side, no hero
Text title → lead teaser + bullets + rich text → columns(secondary: `downloads` + `tags` + `newsletter`)
→ `embeds` (Buzzsprout AI-audio) → `press-kit-media` (Media Box) → full-bleed dark related band.
Meta: `title, description, image, publisheddate, category=press-releases, tags, model?, template=press_release`.

### T16 · Company: board-of-management (`/en/board-of-management/`) — exec-bio accordion
`hero` → `faq-accordion`-style exec-bio rows (expandable gallery + CV/photo-ZIP/press/LinkedIn).
Meta: `template=page`.

### T17 · Company: annual-reports (`/en/annual-reports/`) — download-list
`hero` → reverse-chron `downloads` list (PDF-cover thumbs). Meta: `template=page`.

### T18 · Company: company-logo (`/en/company-logo/`) — brand-asset grid
`hero` → `cards-media` grid, dual PDF+PNG download per variant. Meta: `template=page`.

### T19 · Company: media-services-app (`/en/skoda-media-services-application/`) — app-promo
`hero` → screenshots → QR + app-store badges. Meta: `template=page`.

### T20 · Company: contacts (`/en/contacts/`) — contact-directory
`hero` → dept-grouped `cards-media` (photo/title/email/phone/LinkedIn). Meta: `template=page`.

### T21 · Newsletter archive + signup (`/en/newsletter/`) — `newsletter`
`hero` → date-listed archive → GDPR-consent signup form. Meta: `template=page`.

---

## Chrome (all templates)
`header` (STO nav fragment vs MR nav fragment) + `language-switcher` (existence-aware) +
`footer` (STO) / `footer-mediaroom` (MR). Legal/copyright bar = separate strip.

## Parser implication
Net-new parsers needed only for structural blocks (series, card-teaser, listing, gallery-lightbox,
embeds, media-cart, press-kit-*, company sub-types, newsletter). Rails reuse `story-rail`/`stories`.
Transformers emit the per-family metadata above so the index-driven rails/listings populate.
