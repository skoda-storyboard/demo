# SKODA-208, Model page template (skoda_model)
- **Epic:** E02, Core Blocks
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** ~~M2 (go-live)~~ → **M1 (15 Oct demo)**. Re-milestoned 2026-09-24 to match the board: 5 model URLs are in the 43-URL M1 set (see update below).
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

> **Update (2026-09-24, M1 gap review, [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md)).**
>
> **In-scope pages.** Peaq, Epiq, Octavia, New Superb, New Fabia.
>
> **What is already on origin/main.** `import-model-page.js` and `page-templates.json` already emit `in-page-nav`,
> `key-facts` and `spec-table`, **but none of the three blocks exists under `blocks/`**. Remaining M1 work:
> 1. **Build the 3 blocks.** Defensive: Bodywork/Derivatives varies by model and is absent on Peaq.
> 2. **Hide empty rails.** A rail with no index rows should render nothing, not an empty heading.
> 3. **Populate the rails.** News, Press Kits and Stories need SKODA-603 (43 URLs + corpus). Images and Videos need
>    **SKODA-608**. With the 43 URLs alone, Fabia has 0 rows and every model has 0 image/video rows.
>
> **Estimate.** About 4 SP remains.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/template-model-page.md`](../../ui-specs/template-model-page.md)** (captured via Chrome DevTools on the live Peaq model page). Read it before implementing. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture (2026-09-15) that create this ticket:
- Model page is a real **`skoda_model` CPT** (`single-skoda_model`, MR side), not a listing or a story. One template serves the STO-M and MR-M client IDs.
- Structure: **full-bleed model hero** (image carousel + "MODELS" chip + model name `36px/700` white overlay, →`24px` mobile) → an **8-item icon section-nav** (Model Description, Key Facts, Technical Data, News, Press Kits, Stories, Images, Videos; in-page anchors `#intro…#videos`, centered flex, **desktop-only**) → intro/key-facts/tech-data content → **5 tag-filtered related rails** (News/Press Kits/Stories/Images/Videos "Based on tags: <model>", headings `26px/32.5/600`, ~`356px` rhythm) → MR footer.

## Summary
Deliver the vehicle Model page template: a model hero + an in-page icon section-nav + Model Description / Key Facts / Technical Data content + five tag-filtered related-content rails, on the Media Room chrome. Reuses hero, carousel/story-rail, card-teaser, gallery-lightbox, media-cart.

## Description
Confirmed live on `/en/skoda-model/peaq/`. This ticket delivers:
- **Model hero:** full-bleed image (carousel) with a category chip + model name overlay.
- **Icon section-nav:** a centered row of 8 icon+label in-page anchors; desktop-only in source, provide an accessible mobile equivalent (in-page skip links).
- **Content sections:** Model Description (rich text), Key Facts, Technical Data (spec table).
- **5 related rails:** News, Press Kits, Stories, Images, Videos, each a query-index rail filtered by the model tag (reuse `carousel-rails`/`story-rail` + `card-teaser`; Images/Videos add lightbox + cart).
- **Parser:** detect `skoda_model`, map hero + description + key-facts + tech-data + the 5 rail queries; emit Metadata (template=model-page, model, bodywork, category).

## Requirements / Spec
- Reuse `hero` overlay variant + `carousel`/`story-rail` (query-index by model tag) + spec-table block.
- Icon section-nav generated from the page's section IDs; smooth-scroll + focus target; mobile-accessible.
- MR chrome; content cap 1248; rails respect their own `data-flickity` config (arrows/dots/autoplay).

## Acceptance Criteria
Measurable gates live in [`template-model-page.md` §10](../../ui-specs/template-model-page.md); summary:
- [ ] MR shell; single `h1` = model name; hero full-bleed (~510px) with chip + name `36px/700` white (→24px @500).
- [ ] Icon section-nav: 8 in-page anchors (Model Description…Videos), centered, not sticky, desktop-only + accessible mobile equivalent.
- [ ] Sections in order: intro / key-facts / tech-data, then 5 tag rails (News, Press Kits, Stories, Images, Videos), headings `26px/32.5/600 #161718`, ~`356px` rhythm.
- [ ] Rails query the model tag; each respects its own carousel config; Images/Videos wire lightbox + cart.
- [ ] Content cap `1248`; a11y (nav landmark, heading order, hero contrast).
- [ ] Visual diff vs source at 1280/1024/768/500 ≤ 2% per-pixel (hero + nav + one rail).

## Dependencies
- Upstream: SKODA-202 (hero), SKODA-201 (cards/rails), SKODA-402 (query-index retrieval), SKODA-203 (gallery-lightbox), SKODA-505 (media-cart), SKODA-601 (import infra)
- Downstream: SKODA-1001 (per-locale trees)

## Risks / Flags
- **Rail retrieval rule (🟡):** "Based on tags: <model>" = model tag; confirm exact taxonomy + per-rail ordering across ≥2 models.
- **Icon-nav on mobile (🟡):** source hides it; default = render as in-page skip links (a11y improvement, confirm).
- Key Facts / Technical Data structured-data source to confirm for import.

## Import contract (SKODA-603)
Contract(s) `in-page-nav`, `spec-table`, `cards-key-facts`, `tags-outline`, `hero` (+ `spec-table-versions` to confirm) in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). The block check currently fails every model page: `Hero` (no block on `main`) and the story-rail `subheading` key (story-rail doesn't read it, so it renders the settings as cards). Build the blocks against the pinned shapes. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
