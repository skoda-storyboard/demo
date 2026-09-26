# Škoda Demo: pending-block import contract (SKODA-603)

*Created 2026-09-25 for the M1 content fan-in ([SKODA-603](../tickets/tickets/SKODA-603.md)). The machine-readable side is [`tools/importer/push/block-contracts.json`](../../tools/importer/push/block-contracts.json). [`tools/importer/validate-blocks.mjs`](../../tools/importer/validate-blocks.mjs) (`npm run import:validate-blocks`) enforces it before every push. Where this doc and the older [`SKODA-BLOCK-DATA-MODEL.md`](SKODA-BLOCK-DATA-MODEL.md) disagree about a block's DA shape, this doc wins (the data model is partly stale, see the demo sweep report §6).*

## Why

Content for M1 is imported **before** some of the blocks it uses exist. Some blocks exist only as a ticket. Others have a parser but no block code. Without a shared contract, each importer invents its own table shape, and then every block ticket either has to handle several shapes or force a re-import of every page.

This contract pins **one DA table shape per pending block**. The importers emit that shape now, and the block ticket builds against it. When the block lands, the pages need a **re-QA, not a re-import**.

## Rules

1. **Pin the shape before importing.** No wave imports a family whose pages would emit a pending block that has no pinned entry here. The check fails on any block that is neither on `main` nor in the registry.
2. **The block ticket builds against the pinned shape.** If it needs a different shape, the same PR bumps `shape` in the JSON and updates the section below. The tracker then flags the affected pages, which are re-imported through the push tool's `update` path.
3. **If the parser is missing but the source is known,** the parser, or the story-flatten widget map, emits the contract table now. **If the shape can't be decided yet** (status `proposed`, e.g. `spec-table-versions`), the page falls back to default content. The tracker then notes `re-import on <ticket>`, and the page is named in the publish approval request.
4. **One name per block.** The name is kebab-case. The DA table header is its Title Case form (`Spec Table` → `.spec-table`), and variants go in parentheses (`Cards (overlay, tiles)`). There are no aliases: a superseded name (`Cards (promo)`, `version`) fails the check and says what to emit instead.
5. **Prefer a variant to a new block.** Use a variant of an existing block before creating a new one: "one engine per job" (block data model §3). A styled region that has to **contain** other blocks can't be a block, because DA tables don't nest. It's a **section** with a Section Metadata `Style`. The vendored `decorateSections` doesn't apply `Style`, so the section needs the `scripts.js` hook.
6. **Config rows** are 2-cell key/value rows, and the keys are the lowercase keys the block code reads (normalised like `toClassName`). Unknown keys are never emitted. For `story-rail`, an unknown key makes the code treat the whole table as curated cards, which renders the settings as cards (the SKODA-208 `subheading` bug).
7. **Content cells** hold one kind of content each:
   - text;
   - a masters-only `<picture>` with its alt text;
   - a caption paragraph;
   - root-relative `/en/…` links;
   - a bare embed URL.

   Optional cells may be empty but are **never dropped**, so that cell positions stay stable (authors omit cells, and decoration stays defensive).
8. **Publish rule** (tightened 2026-09-25 after the M1 sweep and the 208/801a amendments, which require **0 block JS 404s**):
   - A page with a **pending *block*** (no code in `blocks/` yet) **stays preview-only**, because its JS would 404. To publish such a page before the block lands, the importer emits the default-content fallback for that part, and the tracker flags `re-import on <ticket>`.
   - A page whose only pending items are **variants of a block on `main`** (e.g. `Cards (overlay, tiles)`) may publish if every fallback is **readable**; its QA reads `pending: <ticket>` rather than fail.
   - A **broken** fallback (visible config rows, or stacked raw images that hide the content) stays preview-only unless the publish is explicitly approved at the wave gate.
9. **When a block lands,** re-QA the pages that use it (the tracker's "pending blocks" column lists them). A re-import is needed only if `shape` changed.

## Entry fields (JSON)

| Field | Meaning |
|---|---|
| `id` | the stable id; each id has a `### <id>` section below (a unit test enforces this) |
| `block` / `variants` / `variantPatterns` | the block name and the variants this entry covers (`null` block = not a block: section style, index row, code-only or metadata) |
| `status` | `pinned` (import against it) · `proposed` (shape drafted, owner confirmation outstanding; the check warns) · `resolve` (the current importer output must change first; the check fails) · `out-of-scope` (the check fails) |
| `ticket` | the owning ticket, which builds the block against this shape |
| `fallback` | `readable` or `broken`: how the page renders before the code lands (rule 8) |
| `shape` | the shape version; parsers cite it as `contract <id> v<shape>` in their header comment |
| `configKeys` / `config` | allowed keys; `only` = every row is config, `or-curated` = config table or curated rows |
| `emittedBy` | the importer parsers and transformers that emit it today (empty = parser still to write) |
| `replaces` | superseded names that now fail the check with a pointer to this entry |

## Blocks on `main` (the check's baseline)

These blocks have code on `main`, with the variants and config keys that code reads:

| Block | Variants | Config keys |
|---|---|---|
| `cards` | `media`, `overlay`, `toolbar` | – |
| `carousel` | `dots` | – |
| `columns` | – | – |
| `downloads` | – | Media Box rows: `source`, `postid`, `lang`, `columns`, `sizes` (SKODA-502) |
| `embed` | – | `url`, `ratio`, `title`, `poster` (`or-curated`: a bare Vimeo / YouTube / Buzzsprout / Spotify URL on its own line still autoblocks). A self-hosted `.mp4`/`.webm`/`.mov`/`.m4v` `url` renders a native `<video>` with the `poster` image (SKODA-801a, WordPress `[video]`) |
| `gallery` | – | – |
| `hero-image` | `story` (default), `overlay`, `archive` | – |
| `listing` | – | `index`, `path`, `template`, `facets`, `facetlabels`, `sort`, `perpage`, `columns` (config only) |
| `stories` | – | `index`, `path`, `template`, `category`, `tag(s)`, `heading`, `sort`, `initial`, `perpage`, `columns`, `excludefeatured` (config only) |
| `story-rail` | – | `index`, `path`, `template`, `category`, `tag(s)`, `heading`, `view-all`, `sort`, `limit`, `exclude`, `dots` + the index facets (`model`, `years`, …); config **or** curated rows |
| `tags` | `chips` | – |
| `promo-box` | – | curated rows **or** config (`index`, `template`, `path`, `category`, `tags`, `limit`, `sort`); never mixed (PR #110, merged) |
| `search`, `fragment`, `header`, `footer`, `widget`, `newsletter-stub` | – | – |

`blocks/hero` exists only as an **empty boilerplate stub** (`hero.js` is 0 bytes). It isn't a baseline block: the project hero is `hero-image`, see `hero` below.

Two findings from the first inventory (2026-09-25), both caught by the check:
- `parsers/series-grid.js` emits `Listing` with a `tags` row, but `listing` doesn't read `tags`, so the hub would list every story. Series hubs move to `Cards (overlay, tiles)` anyway (see `cards-tiles`).
- The model importer's rail rows use `subheading`, which `story-rail` doesn't read yet. The SKODA-208 amendment makes it a config key ("a two-cell subheading row is config, never a card"), so it is pinned as the pending key `story-rail-subheading`.

## Contracts

### `hero`
- **Status:** `resolve` · **Ticket:** SKODA-202 (the parser change sits with 207/208) · **Fallback:** readable
- **Finding:** `parsers/hero.js` (model page) and `parsers/hero-banner.js` (page / category / tag / series / listing banners) emit `Hero`, but the `hero` folder on `main` is only an **empty boilerplate stub** (`hero.js` is 0 bytes, `hero.css` is 504 bytes of boilerplate) left from #104. The project's hero is `hero-image`, so a `Hero` table renders undecorated, with boilerplate styling. *(Corrected 2026-09-25: the first inventory said there was no `hero` block at all.)*
- **Contract:** emit the existing block, with no new `hero` block:
  - `Hero Image (overlay)` for full-bleed overlay heroes (model, series hub, press-kit hub, listings, pages);
  - `Hero Image (archive)` for the image-only category/tag band.
- **Rows** (hero-image's shape):
  1. a masters-only `<picture>`;
  2. the heading (H1), then optional perex/caption paragraphs and optional chip text.

  A CTA is only emitted if one was authored (hero.md: no CTA in any source hero).
- **Until resolved:** the check fails pages that contain `hero`. Affected families: models (W2c), series (W3), listings (W2b), and the press-kit hubs (W3).

### `in-page-nav`
- **Status:** `pinned` · **Ticket:** SKODA-208 · **Fallback:** readable (a column of anchor links)
- **Emitted by:** `parsers/in-page-nav.js`
- **Shape:** header `In-Page Nav`, then one row per section anchor: `[<a href="#section-id">Label</a>]`. The source icon SVGs are dropped; the block supplies the icons by label.
- **Example** (`/en/skoda-model/peaq/`): rows `Model Description` · `Key Facts` · `Technical Data` · `News` · `Press Kits` · `Stories` · `Images` · `Videos`. The spec wants 9/8/6 items depending on the model, and the sticky behaviour is the block's job.

### `spec-table`
- **Status:** `resolve` (2026-09-25: the SKODA-208 amendment requires **0 block JS 404s** and moves Key Facts / Technical Data to **Should**) · **Ticket:** SKODA-208 · **Fallback:** readable (label/value text pairs)
- **Resolve to:** existing blocks, i.e. `Columns` rows (label | value + unit) in a dark section (218) plus a download link, unless 208 decides to build `spec-table`. The check fails `Spec Table` until then.
- **Emitted by:** `parsers/spec-table.js`
- **Shape:** the `Technical Data` heading stays as default content above the table. Header `Spec Table`, then rows `[label, value + unit]`. The last row is `[<a href="…pdf">Download PDF</a>]` when the source has one. The optional background image isn't imported.

### `spec-table-versions`
- **Status:** `resolve` (801a amendment: 0 block JS 404s; the `version` block is named explicitly) · **Ticket:** SKODA-801a (story importer) · **Fallback:** readable
- **Finding:** a raw source spec table (`<table class="version">`) leaks through the story flattener as an unknown `version` block (published Epiq story; a 404 in the demo sweep). The contract `replaces: version`, so the check fails any page that still emits it.
- **Shape:** header `Spec Table (versions)`. The first row is `[ "", version 1 name, version 2 name, … ]`, and each following row is `[label, value 1, value 2, …]` with units kept in the value text. It's the same block as `spec-table`, and the variant adds the multi-column layout.
- **Resolve to:** `Columns` rows or text in the story importer (801a), since `spec-table` isn't built. The shape above applies only if 208 builds `spec-table`.

### `cards-key-facts`
- **Status:** `pinned` · **Ticket:** SKODA-208 · **Fallback:** readable (`cards.js` renders them as plain cards)
- **Emitted by:** `parsers/key-facts.js`
- **Shape:** the `Highlights` heading stays as default content above the table. Header `Cards (key-facts)`, then rows `[square <picture>, <h3>title</h3><p>text</p>]` (the cards row shape). The variant only changes the styling.

### `story-rail-subheading`
- **Status:** `pinned` · **Ticket:** SKODA-208 · **Fallback:** **broken** (today `story-rail` treats a table with an unknown key as curated cards, so the settings render as cards)
- **Form: a config key added to `story-rail`, not a block.** Row `[subheading, <text>]`, e.g. "Based on tags: Fabia". It's allowed at import, but pages that use it are held from publishing until `story-rail` reads the key (208).
- **Emitted by:** `parsers/story-rail.js` (model page rails).

### `tags-outline`
- **Status:** `pinned` · **Ticket:** SKODA-208 (with SKODA-205) · **Fallback:** readable (renders as chips)
- **Emitted by:** `transformers/skoda-model-tags.js` (`Tags (chips, outline)`)
- **Shape:** the same as `tags`, a single row of tag links. `outline` is a style modifier on `chips`.

### `promo-box`
- **Status:** ✅ **on `main`** (PR #110 merged 2026-09-25). It moved to the baseline table above and is no longer a pending entry; this section stays as the shape reference. **Ticket:** SKODA-213
- **Emitted by:** `parsers/promo-box.js`. **Finding:** it currently emits `Cards (promo)`, which PR #110 doesn't read. The contract `replaces: cards (promo)`, so the header must change to `Promo Box` before `/en` or the MR home is re-imported.
- **Shape (curated, what the home importer emits):** header `Promo Box`, then one row per hand-picked item: `[<a href="/en/…"><picture/></a>, <a href="/en/…">Title</a>]`, in source order (usually 3).
- **Shape (index mode, PR #110):** only 2-cell config rows with `index`, `template`, `path`, `category`, `tags`, `limit`, `sort`. PR #110 rejects a mix of curated and config rows, and so does the check.
- **Still to do:** the importer header change (`Cards (promo)` → `Promo Box`). The check keeps failing `Cards (promo)` and points at `promo-box`.

### `cards-tiles`
- **Status:** `pinned` · **Ticket:** SKODA-221, now **Could** (importers: 207 series hub, 805a press-kit hub) · **Fallback:** readable (a uniform overlay-card grid). Plain cards are the documented deviation until 221 lands (805a amendment), so the hubs don't wait for 221 and publish on the fallback.
- **Shape:** header `Cards (overlay, tiles)`, then one row per tile: `[size token, <picture>, <a href="/en/…">Title</a>]`.
  - The size token is one of `sq`, `sq-small`, `wide`, `third`, `feature`.
  - Source `ratio-2x1` maps to `wide` (series) or `feature` (press kits).
  - An empty token cell means the default `sq-small`. The cell stays, per rule 7.
  - Tiles have no date and no excerpt.
- **Example** (`/en/series/125-years-of-motorsport/`): the curated mosaic in source order. It's **not** index-driven (sweep report §5: series hubs are curated), so it replaces the `series-grid` `Listing`.

### `gallery-slider`
- **Status:** `pinned` · **Ticket:** SKODA-819 · **Fallback:** readable (the current Gallery lead + thumbnails)
- **Emitted by:** `parsers/story-flatten.js` for link-free `skoda-carousel-widget`, once 801a/819 switch it over (today it emits `Gallery`).
- **Shape:** header `Gallery (slider)`, then one row per slide: `[<picture>, caption paragraph or empty]`. Captions are visible on the source for some sliders (13.33/20 centred; 6 of 16 lifestyle sliders, plus Octavia, Slavia and 365 km/h per the 819 amendment), so the caption cell is always present. Link-bearing carousels keep routing to `Cards`.
- **Example** (`/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`): 3 sliders with 5, 8 and 4 rows.

### `quote`
- **Status:** `pinned` · **Ticket:** SKODA-220 · **Fallback:** readable (two text cells)
- **Shape:** header `Quote`, then a single row `[<p>quote text</p>, <p><strong>Attribution</strong>, role</p>]`. An empty attribution cell is kept. The source's decorative `hr` is **never** emitted, because a bare `hr` in DA splits sections.
- **Importers:**
  - the press-release cleanup (detects `p[style*=center] > em`, the following `hr`, and the centred `strong`);
  - the press-kit importer (805c);
  - `story-flatten.js` `skoda-quote`. It currently emits a default-content `<blockquote>` and loses the attribution; W1 switches it to this table.
- **Example:** the Zellmer press release (`/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company/`).

### `columns-split`
- **Status:** `pinned` · **Ticket:** SKODA-225 · **Fallback:** readable (equal columns, portrait stretched)
- **Shape:** header `Columns (split-NN)`, where `NN` is the first cell's share of the row width in percent, rounded (source 518 | 320 → `split-62`). The rows are the normal `columns` rows. The check accepts `split-10` … `split-99`.
- **Emitted by:** `story-flatten.js` for 2-cell SiteOrigin rows with unequal cells (graffiti, Kylaq, charging, Peaq comfort).

### `accordion`
- **Status:** `pinned` · **Ticket:** SKODA-805c (minimal SKODA-807) · **Fallback:** readable (all panels open as text)
- **Shape:** header `Accordion`, then one row per toggle: `[summary label (text), body (rich content: paragraphs, lists, links, images)]`. Rows appear in source order and are all closed by default. Nested blocks inside a panel aren't supported: an embed inside a panel stays a bare link.
- **Example** (`/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/`): 8 rows.

### `highlight`
- **Status:** `pinned` (decided 2026-09-25: section style) · **Ticket:** SKODA-824 · **Fallback:** readable (plain ink text, as today)
- **Form: section style, not a block.** The dark box can contain a `Gallery (slider)` or a `Columns` row, and DA blocks can't nest (rule 5).
- **Shape:** a section holding the panel's content (h3, text, images, and any nested blocks), closed by `Section Metadata` with `Style` = `highlight, dark` (story panel) or `highlight, grey` (PR FAQ/info callout). Consecutive highlighted rows each become their own section with the same style; the runtime joins them.
- **Runtime:** a body-column-scoped treatment through the `scripts.js` section hook. It must not reuse the full-bleed `.section.dark` rule.
- **Until the importer emits it** (824 importer half), pages keep the current unwrap (default content) and are marked `re-import on SKODA-824`. The shape is fixed, so the 824 runtime and importer can be built in parallel.

### `media-item`
- **Status:** `pinned` · **Ticket:** SKODA-608 · **Fallback:** readable
- **Form: index row, not a block.** Image and video item pages carry the metadata the `listing` media card reads:
  - `template` = `image` | `video`;
  - `title`, `description`, `image` (masters-only thumbnail), `publisheddate`, `tags`, `model` and the facet fields in `query-index-config.yaml`;
  - download fields (JPG Original + 1920, or the MP4 source), plus the Vimeo ID / poster for videos (608 amendment).

  The item body is a single `<picture>` or embed plus the caption. The listing media-card cell (date, filename, add/download toolbar, lightbox) is built inside `listing`, not as a new block.

### `floating-action-bar`
- **Status:** `pinned` · **Ticket:** SKODA-215 · **Fallback:** readable (absent)
- **Form: code-only.** It's template chrome (share toggle + scroll-to-top) added at runtime on **every template** (215: all 43 captures), so the importers emit **nothing** for it.

### `media-room-chrome`
- **Status:** `pinned` · **Ticket:** SKODA-309 (with 305) · **Fallback:** readable (Storyboard chrome)
- **Form: bulk metadata, not importer output** (309 amendment). The 16 MR-side URLs (5 press releases, **5 model pages**, 4 press kits, Images, Videos) get `nav` / `footer` from `metadata.json` rows for the MR path globs. Those rows are activated only once both MR fragments return 200 on preview and live. The importers emit nothing, and the push tool's fragment check requires the fragments to be live before publishing.

### `skodapedia`
- **Status:** `out-of-scope` · **Ticket:** SKODA-206 · **Fallback:** broken
- `parsers/skodapedia.js` emits it, but no M1 URL uses it and the block data model removed it. The check fails any M1 page that contains it.

## Changing a contract
1. Edit the entry here and in `block-contracts.json` in the same PR, and bump `shape`.
2. Update the emitting parsers (and their `contract <id> v<shape>` comment).
3. Run `npm run import:validate-blocks -- --urls <affected family list>`, then `npm run import:status`. Pages still on the old shape show up as errors and are re-imported through `npm run import:push`.
