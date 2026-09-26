# SKODA-208, Model page template (skoda_model)
- **Epic:** E02, Core Blocks
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** ~~M2 (go-live)~~ → **M1 (15 Oct demo)**. Re-milestoned 2026-09-24 to match the board: 5 model URLs are in the 43-URL M1 set (see update below).
- **Estimate:** 5 SP **+1 net Must = 6 SP** (2026-09-25 amendment, below) · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

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

## Importer plan (2026-09-26, importer-only slice; UI/blocks stay open)

> **Status (2026-09-26): importer slice done, awaiting QA; UI half open.** All 22 EN model pages are imported,
> pushed, previewed, **published and indexed** (`urls-model-page.txt`).
> - **Blocks:** `import:validate-blocks` 22/0 errors, 0 held. On the preview, every page loads only `hero-image`,
>   `cards`, `columns` and `story-rail`, with no missing-block requests.
> - **Metadata:** `validate-metadata` 22/22. `model` / `bodywork` / `derivative` come from the rail filters
>   (e.g. `kodiaq` + `suv`, `enyaq` + `rs`).
> - **Nav:** 6–9 links per page; 0 dangling anchors against the real pipeline heading ids on all 22.
> - **Bodywork rails** fill from the index (live Kodiaq: RS, iV, Sportline, as on the source).
> - **Tag rails** use the source's AND filter. They fill where content is indexed (Peaq: 2 News, 10 Stories). Kodiaq
>   and similar stay empty until 603/608 import matching `model` + `bodywork` content: the source rails are
>   model+bodywork AND, 79/80 items.
> - **Media:** `media:build` delivery-only (0 failures) and `media:apply`. The audit reports 22/22 pages, 179 images,
>   0 missing / unresolved, and 20 PDF links = 10 unique Tech Data PDFs, all tracked as `document` rows. 168 image
>   originals and 10 PDFs are pending the DAM ingest (`media:build --from-manifest --dam-base …`, dry run first,
>   needs the DAM token + approval).
> - **Overwrites:** 6 DA docs (Elroq live, 5 unpreviewed drafts) were checked, found to be old importer output with no
>   hand edits, and overwritten with `--force`.
> - **Deviation from the plan:** Technical Data is a `Columns` 3-cell-per-row stat grid (the source's 3-column
>   layout) rather than label | value rows.
> - **Tests:** `parsers/model-page.test.mjs` (incl. a 22-page corpus test: only main blocks, no dangling nav, every
>   source image in the output) and media PDF tests; `npm test` 338/338.

Scope is set by the source `skoda_model-sitemap.xml`, not our URL lists. That sitemap has **22 EN model pages**:
11 parents plus 11 derivatives. The derivatives are in no list yet (the M1 set has 5, the corpus 10). Probe copies
of all 22 are in `.migration/model-probe/en/` (untracked). Other locales (54 URLs) stay with SKODA-1001.

**Source variance.** Detect sections by SiteOrigin widget class (`widget_sow-editor`, `widget_ys-so-widget-highlights`,
`widget_ys-so-widget-techdata`), not by `#id`: Superb iV, Elroq RS, Enyaq RS, Scala and Kamiq have the widget without its id.

| Group | Pages | Sections |
|---|---|---|
| Full (ref. `new-kodiaq`) | kodiaq, octavia, new-superb, karoq-6, enyaq-iv-2, elroq + kodiaq iV/RS/Sportline, octavia RS/Sportline, karoq Sportline, enyaq Sportline iV, elroq Sportline | intro, Highlights, Tech Data + PDF, Bodywork, 5 tag rails |
| No Bodywork | scala, kamiq, new-fabia | Fabia: 3 tag rails, a Tech Data top image |
| Partial | new-superb-iv, elroq-rs, enyaq-rs | ids missing, some rails absent |
| Minimal | peaq, epiq | intro + 5 rails, no Highlights / Tech Data |

**Mapping (existing blocks only).** The importer never emits `in-page-nav`, `spec-table`, `Hero` or `Section Metadata`.
The last of these becomes a 404 block outside `body.story`.
- Hero (always 1 slide) → `Hero Image (overlay)`: picture, then "Models" chip + model name `h1`.
- Model Description (1–3 editor widgets, Liftback/Combi images on Octavia/Superb) → default content.
- Highlights → `h2` + `Cards (key-facts)` (pinned contract).
- Technical Data → `h2` + `Columns` (value | label) + "Download PDF" link; Fabia's `.bg-image` as default content.
- Bodywork / Derivatives → `h2` + `Story Rail`, `template: skoda_model`, `path: /en/skoda-model/<parent>`. The parent
  page adds `exclude: <self>`. Parity: children list the parent and all siblings.
- News / Press Kits / Stories / Images / Videos → `h2` + "Based on tags: …" `p` as default content, then a `Story Rail`,
  following the `skoda-story-cleanup.js` related band. Facets (`model`, `bodywork`, `derivative`) come from the page's
  "All" `filter[…]` hrefs; Stories has no "All" link, so it borrows them. `viewall` only where the source has one.
  Never `subheading`: an unknown key turns the rail into curated cards.
- Emit only the rails the source has. An empty rail shows its heading until the block can collapse its section.
- Icon nav → a default-content link list, built last, linking only to emitted heading ids.
- Metadata: `template=skoda_model`, plus `model` / `bodywork` / `derivative` from the rail facets. The URL slug is wrong
  for `new-kodiaq`, `new-fabia`, `karoq-6`, `enyaq-iv-2` and `new-superb`. Title suffix trimmed (610).

**Steps.**
1. Parsers + `node --test` over the 22 probes. Only `import-model-page.js` uses the five model parsers.
2. Importer and `page-templates.json`: widget detection; `urls-model-page.txt` → 22 URLs.
3. Allow-list: add the 11 derivatives, then re-bundle all 16 importers.
4. Contracts: hero → `hero-image (overlay)`, tech data → `columns`, nav → link list.
5. Import all 22.
6. Media (below).
7. Validate: `import:validate-blocks` (0 unknown blocks), `validate-metadata`, local render of full / partial / minimal,
   and a diff against the 6 prior imports.
8. Push --dry-run → push + preview → publish (+ fragments). Check `.aem.page` and `.aem.live`.
9. `import:status`, this ticket, the push manifest, and a PR with the branch preview link.

**Media tracking for the later AEM DAM import.** The tracker is `tools/importer/media/media-manifest.json`: one row per
image, holding the master (`-WxH` stripped), `dam_page_path` and `steps.dam`.
- Every source image must land as a content `<img>`: hero, intro, Highlights and the Fabia tech image. A test counts
  source images against output images per page.
- Run `media:build` delivery-only on all 22 pages.
- Audit: `audit-m1-media.mjs --urls tools/importer/urls-model-page.txt` must report 0 missing images and each original
  pending for the DAM.
- Commit the manifest. The later ingest is `media:build --from-manifest --dam-base …`, dry run first, run after
  token/approval. It is not part of this slice.
- **Tech Data PDFs (20) are tracked too.** `media-lib.mjs` accepts only image extensions (`IMAGE_EXT_RE`). Add a
  document kind so a linked `.pdf` gets a manifest row with a DAM path and `deliver: n/a`. The link stays on the
  source CDN until the ingest.

**Left open for the UI half.**
- Sticky icon nav.
- Key-facts card styling.
- Dark Tech Data band: needs a Section Metadata hook outside `body.story` in `scripts.js`.
- `story-rail` collapsing its section when empty, and reading `subheading`.

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

## Amendments (2026-09-25, sweep reconciliation, [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §6 + §11)
These **supersede** the conflicting items above: 8 anchors / not sticky / ~510px hero.
- [ ] Section-nav is a **sticky** icon nav on desktop with an accessible mobile equivalent. Match the source link
      count per model: 9 / 8 / 6. Emit only links whose target section exists (no dangling anchors). Hero height is
      about 480px.
- [ ] Match the source rail count per model: 3 / 5 / 6. Rail tags and the subheading come per model from the source
      (e.g. Fabia `model=fabia`, `bodywork=hatchback`), with an "All" deep link. A hardcoded `elroq` is rejected.
      A two-cell subheading row is config, never a card. An empty rail removes its section. The Bodywork rail is
      centred (`cellAlign: center`).
- [ ] **Block names:** the importer emits only blocks that exist. Today the Elroq page references `in-page-nav` and
      `spec-table`, and both 404 on preview and live. Map them to existing blocks/sections (e.g. `columns` + a 218
      dark section + a download link), or to the section-nav this ticket builds. Check: 0 block JS 404s on the 5
      model pages.
- [ ] **Should, not Must** (§11.2 cut line): Key Facts (5–6 illustrated rows) and Technical Data (dark band, 6 rows +
      PDF) on Superb / Octavia / Fabia.
- Estimate: +1.5 (§9, including Key Facts / Tech Data) +0.5 (block names) −1 (Key Facts / Tech Data → Should) =
  **+1 SP net Must**.

## Dependencies
- Upstream: SKODA-202 (hero), SKODA-201 (cards/rails), SKODA-402 (query-index retrieval), SKODA-203 (gallery-lightbox), SKODA-505 (media-cart), SKODA-601 (import infra)
- Downstream: SKODA-1001 (per-locale trees)

## Risks / Flags
- **Rail retrieval rule (🟡):** "Based on tags: <model>" = model tag; confirm exact taxonomy + per-rail ordering across ≥2 models.
- **Icon-nav on mobile (🟡):** source hides it; default = render as in-page skip links (a11y improvement, confirm).
- Key Facts / Technical Data structured-data source to confirm for import.

## Import contract (SKODA-603)
Contract(s) `in-page-nav`, `spec-table`, `cards-key-facts`, `tags-outline`, `hero` (+ `spec-table-versions` to confirm) in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). The block check currently fails every model page: `Hero` (no block on `main`) and the story-rail `subheading` key (story-rail doesn't read it, so it renders the settings as cards). Build the blocks against the pinned shapes. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
