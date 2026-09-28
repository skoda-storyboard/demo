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
  - **Amendment (2026-09-27, SKODA-608):** "collapsing" means the whole rail section: the default-content `h2`,
    the "Based on tags" line and the "View all" link go too, not only the block's mount. Measured on the Peaq/Epiq
    pages before 608: an empty rail left a ~116px heading + dead "View all". After 608, Octavia, Superb and Fabia
    Images/Videos rails are still empty and still show the leftover heading until this lands.

**UI half built (2026-09-28, branch `skoda-208-model-template`): no new block.** Everything is a page template
plus variants of existing blocks, built against the already-published pages (no re-import):
- `templates/skoda-model/` (`TEMPLATES` += `skoda-model`): section roles from the importer's heading ids, source
  anchors kept as aliases (`#intro`, `#keyfacts`, `#techdata`, `#derivatives`), the hero chip, the short-page flag.
- **Icon nav (template, option A):** the importer's link list becomes `<nav aria-label="On this page">`, sticky from
  768, 9 source icons (`icons/model-*.svg`, CSS mask so they recolour), scrollspy (`aria-current`), anchors land under
  the nav. Links to missing or collapsed sections are dropped. Below 768 (source: hidden) it is a skip-link strip,
  hidden until focused.
- **Hero:** `hero-image (overlay)` restyled (9:5 → 3:1 → 5:2 at 1080 → 3:1 at 1440, measured).
- **Highlights:** `cards (key-facts)` CSS variant. **Technical Data:** `columns (stats)` variant (value/unit split)
  on a 1248 dark band, mint PDF pill, Fabia banner.
- **Rails:** `story-rail` passes its variants to `carousel`, labels "View all" from the authored link ("All"), and an
  empty rail removes its whole section (heading, "Based on tags", link) and fires `story-rail:empty` (the nav drops
  its link). `carousel (caption)` forces title-below cards, `(center)` centres them; Derivatives =
  `center caption`, Images/Videos = `media caption` (+ `video` play glyph). Card widths follow the source cells.
- Measured against live at 1280/1024/768/375: Octavia/Superb/Fabia/Peaq/Epiq layout matches; remaining offsets
  come from content (fewer rails/nav links until SKODA-603/608 fill the index). Hero pixel diff 0.24–1.38% at
  1024/768/500; 2.92% at 1280 is photo encoding (WebP 2000 vs source JPEG 1440), layout identical.
- **Not in this slice:** lightbox, add-to-cart and size menus on Images/Videos cards (needs a shared lightbox from
  `gallery` + SKODA-505a/b), inline Vimeo previews, the floating share / scroll-top group (SKODA-215), MR footer
  routing (SKODA-305 follow-up).

**Octavia rail data migrated (2026-09-28), all through the import pipeline, no authored cards:**
- News: 9 press releases (`urls-press-release-octavia.txt`); Stories: 8 stories (`urls-story-detail-octavia.txt`);
  Press Kits: the 10 hubs through the page-base importer (`urls-page-base-octavia-press-kits.txt`) as an interim
  until SKODA-805 rebuilds the hub. All imported, pushed, previewed and published; corpus section "OCTAVIA".
  Images/Videos: `model=octavia` queries in the media feed (`media-items/sources.json`), feed republished.
- Importer fixes found on the way (all importers re-bundled): page-base uses `templateDefault` so a flattened CPT page
  keeps its type (`press_kit`); `skoda-metadata` reads a single post's own `<facet>-<slug>` article classes when it
  has no tag row (press-kit hubs); `hero-banner` emits `Hero Image (overlay)` (contract `hero`); page cleanup
  rewrites extension-less Vimeo posters to `.jpg`; the media feed keeps the source listing order for same-day items;
  **`skoda-nbsp`** keeps the source's glued non-breaking spaces (helix html2md turned them into spaces, so copy
  wrapped a line differently on mobile; restored by `push-lib` `wrapPage`).
- Media cards carry the source toolbar (40px ringed cart + download buttons, `mediaToolbar` in story-rail): download
  links the original / MP4; the cart button holds `data-id` and stays inert until SKODA-505. Model rails now span the
  section gutter like the source flickity viewport (arrows at 26 / 1222 at 1280).
- QA vs live Octavia at 1280/1024/768/375: every rail box, card, arrow, toolbar button, "All" pill and the footer
  match to the pixel (375: a 0.17px sub-pixel offset). Press Kits, Stories, Images and Videos list the same items in
  the same order. **News differs by one card:** the source search index misses the Octavia tag on "Simply Clever
  for summer" (17 Aug 2026; the page itself is tagged Octavia, and it is absent from every model-filtered live
  listing), so our rail shows it and drops the oldest item. Not overridden: the index follows the page's tags.

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
