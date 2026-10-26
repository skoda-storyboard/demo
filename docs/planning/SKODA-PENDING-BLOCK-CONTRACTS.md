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
| `styles` | section-style entries only: the Section Metadata `Style` tokens that identify the contract (`highlight-dark`), so the check can hold publish on section styles, which aren't blocks |
| `shape` | the shape version; parsers cite it as `contract <id> v<shape>` in their header comment |
| `configKeys` / `config` | allowed keys; `only` = every row is config, `or-curated` = config table or curated rows |
| `emittedBy` | the importer parsers and transformers that emit it today (empty = parser still to write) |
| `replaces` | superseded names that now fail the check with a pointer to this entry |

## Blocks on `main` (the check's baseline)

These blocks have code on `main`, with the variants and config keys that code reads:

| Block | Variants | Config keys |
|---|---|---|
| `cards` | `media`, `overlay`, `toolbar`, `tiles`, `series-directory`, `social` (SKODA-217: one row per profile, one cell with a link whose text is the handle; its section carries `Style: cover-box, dark`, the SKODA-218 home band) | – |
| `carousel` | `dots` | – |
| `accordion` | `faq` (SKODA-807: FAQPage JSON-LD on a kit's FAQ chapter) | – (SKODA-805c; see `accordion` below) |
| `columns` | `banners` (SKODA-805c: a row of linked banner images at their authored 240px, the press-kit PDF/share buttons; see `columns-banners` below), `callout` (SKODA-805c: `[icon, text]`, the 50px icon in a 60px cell beside its text; the press-kit WhatsApp callout) | – |
| `downloads` | `media-box` (SKODA-510), `gallery` (SKODA-806: a press-kit Images-chapter group, emitted by `parsers/press-kit-media.js` with `collapse | auto`; an Images chapter past 200 images moves its largest groups to `Fragment` blocks, `/fragments<page>/<slug>`) | Media Box rows: `source`, `postid`, `lang`, `columns`, `sizes`, `collapse` (SKODA-502/510) |
| `embed` | – | `url`, `ratio`, `title`, `poster`, `height` (`or-curated`: a bare Vimeo / YouTube / Buzzsprout / Spotify URL on its own line still autoblocks). A self-hosted `.mp4`/`.webm`/`.mov`/`.m4v` `url` renders a native `<video>` with the `poster` image (SKODA-801a, WordPress `[video]`). YouTube as on the source: a `youtube.com/embed/…` URL is the source's iframe, YouTube's own player (lazy-loaded, its query kept); a `watch` / `youtu.be` URL is the source's lite-youtube, the poster until clicked (SKODA-702a). `height` (px) is a fixed-height player box at full width, as the source's `width="100%" height="448px"` iframe |
| `gallery` | – | – |
| `hero-image` | `story` (default), `overlay`, `archive`, `page` | – |
| `listing` | – | `index`, `path`, `template`, `facets`, `facetlabels`, `sort`, `perpage`, `columns` (config only) |
| `media-cart` | – | – (an empty block: authored cells are ignored; it renders the device's cart, the cart page `/{lang}/media-cart`, SKODA-505b) |
| `stories` | – | `index`, `path`, `template`, `category`, `categories`, `tag(s)`, `heading`, `sort`, `initial`, `perpage`, `columns`, `excludefeatured`, `offset`, `exclude`, `feature` (config only; `exclude` registered by SKODA-611b, `feature` since SKODA-222, `categories` since SKODA-831) |
| `story-rail` | – | `index`, `path`, `template`, `category`, `tag(s)`, `heading`, `view-all`, `sort`, `limit`, `exclude`, `order`, `dots` + the index facets (`model`, `years`, …); config **or** curated rows (`order` since #272: a comma list of page paths, shown in that order whatever their template, every one unless a `limit` is set; the Storyboard home's Models band) |
| `tags` | `chips` | – |
| `timeline` | `black` (the black year pills), `large` (18pt titles), `xl` (24pt model lines) | – (SKODA-815; see `timeline` below) |
| `quote` | `left` | – (SKODA-220; see `quote` below) |
| `footnotes` | – | – (SKODA-805d; see `footnotes` below) |
| `promo-box` | – | curated rows **or** config (`index`, `template`, `path`, `category`, `tags`, `limit`, `sort`); never mixed (PR #110, merged) |
| `newsletter-stub` | `card` (SKODA-823: the story-sidebar sign-up card, emitted by `transformers/skoda-story-aside.js`) | `label`, `placeholder`, `button`, `consent`, `manage`, `message`, `list`, `language` (footer, SKODA-305) + `image`, `heading`, `error`, `consent-error` (card); config only |
| `search`, `fragment`, `header`, `footer`, `widget` | – | – |

**`Cards (series-directory)`** (SKODA-207, 2026-09-27; the M2 series directory `/en/series-2`). One row per source card, in source order: `[<picture>, <h2><a href="/en/series/…">Title</a></h2><p>excerpt</p>]`. The title sits over the image and the excerpt below it (`cards.css`). Emitted by `parsers/series-grid.js`. Replaces the index `Listing` proposal (`Cards (overlay, series-directory)` in `series.md` §7): the variant has its own layout, so it doesn't combine with `overlay`.

`blocks/hero` exists only as an **empty boilerplate stub** (`hero.js` is 0 bytes). It isn't a baseline block: the project hero is `hero-image`, see `hero` below.

Two findings from the first inventory (2026-09-25), both caught by the check:
- `parsers/series-grid.js` emits `Listing` with a `tags` row, but `listing` doesn't read `tags`, so the hub would list every story. Series hubs move to `Cards (overlay, tiles)` anyway (see `cards-tiles`).
- The model importer's rail rows use `subheading`, which `story-rail` doesn't read yet. The SKODA-208 amendment makes it a config key ("a two-cell subheading row is config, never a card"), so it is pinned as the pending key `story-rail-subheading`.

## Contracts

### `hero`
- **Status:** `resolve` · **Ticket:** SKODA-202 (the parser change sits with 207/208) · **Fallback:** readable
- **Model hero resolved (SKODA-208, 2026-09-26):** `parsers/hero.js` emits `Hero Image (overlay)`: row 1 the picture, row 2 the "Models" chip `<p>` then the H1 (source order; the truncated teaser is dropped).
- **Series hub resolved (SKODA-207, 2026-09-27):** `parsers/series-hero.js` emits `Hero Image (overlay)`: row 1 the picture, row 2 the "Series" chip `<p>`, the H1, then the standfirst `<p>`. `templates/skoda-series/` shows them as H1 → badge → standfirst. `hero-banner.js` stays unchanged (page/company still to resolve).
- **Archive term band resolved (SKODA-828, 2026-10-05):** `parsers/archive-hero.js` emits `Hero Image (archive)` (previously default content): row 1 the banner picture, or an empty cell when the term has no banner (the source's empty band); row 2 the single H1 with **one line per source label**, separated by `<br>` (`<h1>Models<br>Peaq</h1>`; the accessible name stays "Models Peaq"). A category label is a link to its term (`<h1><a href="/en/category/lifestyle">Lifestyle</a><br><a href="/en/category/lifestyle/people">People</a></h1>`); tag labels are text, and equal labels both stay (`tag/crew/technology`: Technology, Technology). The block renders each line as a grey label chip (a link line is the chip itself) on the bottom-left of the 184/224/240px band. An H1 without `<br>` renders as one chip.
- **Finding:** `parsers/hero.js` (model page, now resolved) and `parsers/hero-banner.js` (page / category / tag / series / listing banners) emit `Hero`, but the `hero` folder on `main` is only an **empty boilerplate stub** (`hero.js` is 0 bytes, `hero.css` is 504 bytes of boilerplate) left from #104. The project's hero is `hero-image`, so a `Hero` table renders undecorated, with boilerplate styling. *(Corrected 2026-09-25: the first inventory said there was no `hero` block at all.)*
- **Generic page band resolved (SKODA-813, 2026-10-21):** `parsers/hero-banner.js` (page-base and company
  pages) emits `Hero Image (page)`: row 1 the banner picture, or an empty cell when the page has none (the
  source's grey band, e.g. `/en/copyright`); row 2 the H1. The block draws a 240px full-bleed band at every
  width, the image covering it under the shared scrim (else 5% ink under it), and the white 48/52.8 wt300
  title on its bottom-left, 16px up.
- **Contract:** emit the existing block, with no new `hero` block:
  - `Hero Image (overlay)` for full-bleed overlay heroes (model, series hub, press-kit hub, listings);
  - `Hero Image (archive)` for the image-only category/tag band;
  - `Hero Image (page)` for the generic page's title band (page-base, company pages).
- **Rows** (hero-image's shape):
  1. a masters-only `<picture>`;
  2. the heading (H1), then optional perex/caption paragraphs and optional chip text.

  A CTA is only emitted if one was authored (hero.md: no CTA in any source hero).
- **Until resolved:** the check fails pages that contain `hero`. Affected families: models (W2c), series (W3), listings (W2b), and the press-kit hubs (W3).

### `in-page-nav`
- **Status:** `resolve` (shape 2, 2026-09-26) · **Ticket:** SKODA-208 · **Fallback:** readable
- **Resolved in the 208 importer slice:** there is no `in-page-nav` block. `parsers/in-page-nav.js` now emits **default
  content**, a `<ul>` of `<a href="#<heading id>">Label</a>` links built last from the section headings the other
  model parsers emitted. Links whose section is absent are dropped (Peaq/Epiq/Fabia/partial pages: 6–9 links). The
  href is the pipeline heading id (github-slugger, verified on all 22 previewed pages: 0 dangling). The check now
  fails any page that still emits `In-Page Nav`.
- Icons, stickiness and the mobile form are the 208 UI half (a decorator on this list or a new block + contract).

### `spec-table`
- **Status:** `resolve` (shape 2, 2026-09-26) · **Ticket:** SKODA-208 · **Fallback:** readable
- **Resolved in the 208 importer slice** to existing blocks. `parsers/spec-table.js` emits, as default content, the
  optional band image, the `Technical Data` h2, then `Columns` (the source's 3-column stat grid: rows of 3 cells, the
  last row padded, each cell `<p><strong>value unit</strong></p><p>label</p>`), then `<p><a href="…pdf">Download
  PDF</a></p>`. The PDF is tracked in the media manifest as a `document` row for the DAM ingest.
- **Not emitted:** the dark band (SKODA-218 `Section Metadata Style: dark`). `decorateStorySections` only consumes
  Section Metadata on `body.story`; on a model page it would 404 as a block. The band needs that hook widened (UI half).
- The check fails any page that still emits `Spec Table`.

### `spec-table-versions`
- **Status:** `resolve` (801a amendment: 0 block JS 404s; the `version` block is named explicitly) · **Ticket:** SKODA-801a (story importer) · **Fallback:** readable
- **Finding:** a raw source spec table (`<table class="version">`) leaks through the story flattener as an unknown `version` block (published Epiq story; a 404 in the demo sweep). The contract `replaces: version`, so the check fails any page that still emits it.
- **Shape:** header `Spec Table (versions)`. The first row is `[ "", version 1 name, version 2 name, … ]`, and each following row is `[label, value 1, value 2, …]` with units kept in the value text. It's the same block as `spec-table`, and the variant adds the multi-column layout.
- **Resolve to:** `Columns` rows or text in the story importer (801a), since `spec-table` isn't built. The shape above applies only if 208 builds `spec-table`.
- **Resolved (SKODA-830, 2026-10-05):** `transformers/skoda-story-cleanup.js` turns every body data table into `Columns`: the source header row first (`Version | Epiq 35 | Epiq 40 | Epiq 55`), then one row per source row, a `colspan` value repeated across the columns it spans. No `version` block is emitted.

### `cards-key-facts`
- **Status:** `pinned` · **Ticket:** SKODA-208 · **Fallback:** readable (`cards.js` renders them as plain cards)
- **Emitted by:** `parsers/key-facts.js`
- **Shape:** the `Highlights` heading stays as default content above the table. Header `Cards (key-facts)`, then rows `[square <picture>, <h3>title</h3><p>text</p>]` (the cards row shape). The variant only changes the styling.

### `stories-feature`
- **Status:** ✅ **on `main` once SKODA-222 merges** (the same PR adds `feature` to `stories`' baseline config keys above
  and drops the pending entry; this section stays as the shape reference). **Ticket:** SKODA-222
- **Runtime (SKODA-222):** the card is the grid's first cell. From 992 it's a grey card in the third column across
  the first two rows; below 992 it's first and full width, collapsed behind a dark disclosure bar. With it, the first
  page shows `initial - 2` stories (the source's archive offset is 4). The primary CTA is read from `<strong>` or, as
  the page holds it by the time blocks run, `a.button.primary` (`decorateButtons`). External links (the configurator)
  open in a new tab.
- **Form:** a config key added to `stories`, not a block. Row `[feature, <cell>]`. The cell holds a `<picture>`,
  then an `<h3>` title ("Explore the Epiq"), then one `<p>` per CTA link. The primary CTA is wrapped in `<strong>`
  (source `a.btn`); secondary CTAs are plain links (source `a.btn-secondary`).
- **Placement is not imported.** It's responsive layout (SKODA-222). The source puts the card in the right column,
  ~2 rows tall, from 992, and first, full-width and collapsible (`h2.toggle`) below 992. In the DOM it's item 1.
- **Emitted by:** `parsers/archive-list.js` from the source `.featured-model` card. That's on 11 model tag
  archives: Elroq, Enyaq, Epiq, Fabia, Kamiq, Karoq, Kodiaq, Octavia, Peaq, Scala, Superb.
- **CTA links** go through the SKODA-605 rewrite. The model pages (SKODA-208) and the Images/Videos listings
  (SKODA-608) are on the allow-list, so the links are site-relative even before those pages are published
  (stakeholder decision 2026-09-26).

### `story-rail-subheading`
- **Status:** `pinned` · **Ticket:** SKODA-208 · **Fallback:** **broken** (today `story-rail` treats a table with an unknown key as curated cards, so the settings render as cards)
- **Form: a config key added to `story-rail`, not a block.** Row `[subheading, <text>]`, e.g. "Based on tags: Fabia". It's allowed at import, but pages that use it are held from publishing until `story-rail` reads the key (208).
- **Emitted by:** nothing since the 208 importer slice (2026-09-26). The model rails emit the heading + "Based on tags: …" line as default content before a config-only `Story Rail` (the story related-band pattern), so no page is held. The key stays pinned for the UI half if the rail should own its header.

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
- **Status:** implemented by SKODA-221 (shape 4 since 2026-10-14, the press mosaic; historical pending entry retained for version tracking) · **Ticket:** SKODA-221 (importers: 207 series hub, 805a press-kit hub). Series pages using shape 2 need rendered QA; press-kit pages need re-import with shape 3 before QA and publication.
- **Emitted by:** `parsers/series-grid.js` (207) and `parsers/press-kit-hub-tiles.js` (805a). The existing press-kit DA previews still have ambiguous old `feature`/`sq` rows, including Motorsport's all-`sq` grid; the runtime and `import:validate-blocks` both reject these on `/en/press-kits/`. Re-import and push the shape 3 output before tile QA/publish.
- **Shape:** header `Cards (overlay, tiles)`, then one row per tile: `[size token, <picture>, <a href="/en/…">Title</a>]`. A press-mosaic banner (shape 4) is `[banner size token, <a href="…"><picture> with alt text</a>]`; `import:validate-blocks` / the publish gate check both forms (`push/block-check.mjs`).
  - The size token names the tile's share of its source row and its image ratio. Series uses twelfths; press kits use twentieths:

    | Token | Row share | Ratio | Token | Row share | Ratio |
    |---|---|---|---|---|---|
    | `sq` | 6/12 | 1:1 | `third` | 4/12 | 2:1 |
    | `wide` | 6/12 | 2:1 | `third-sq` | 4/12 | 1:1 |
    | `sq-small` | 3/12 | 1:1 | `two-thirds` | 8/12 | 2:1 |
    | `quarter` | 3/12 | 2:1 | `banner` | 12/12 | 4:1 |
    | `feature` | 8/20 | 2:1 | `banner-tall` | 12/12 | 3:1 |
    | `press-square` | 4/20 | 1:1 | `press-quarter` | 5/20 | 1:1 |

  - **Row breaks:** a row closes at 12/12 (series) or 20/20 (press kits). A short row marks its last tile `end` (`wide end`). The renderer never guesses; unknown tokens, mixed track types and overfilled/unterminated rows are errors.
  - The importer takes the share from the SiteOrigin layout CSS (`#pgc-<post>-<row>-<cell>{width:N%}`) and the ratio from the tile's `ratio-NxM` class.
  - An empty token cell means the default series `sq-small`. The cell stays, per rule 7; press-kit rows must carry explicit press tokens.
  - Tiles have no date and no excerpt.
- **Why shape 2:** v1 (`sq`, `sq-small`, `wide`, `third`, `feature`) covered the 5 M1 hubs, where every row fills 12/12. The 10 corpus hubs added:
  - quarter-width 2:1 tiles (back-to-the-past);
  - square thirds (evolution-of-parts, my-life-my-car);
  - 1/3 + 2/3 rows (winter-tips);
  - full-width 4:1 and 3:1 banners (czech-footprint, unknown-parts, evolution-of-parts, my-life-my-car, sustainable-mobility);
  - short rows (road-trip row 2, sustainable-mobility row 22).

  v1 tokens keep their meaning, so v1 rows are valid v2 and v3 rows. **Shape 3** adds the 20-column press-kit track: `feature` = 8/20, `press-square` = 4/20, `press-quarter` = 5/20. Peaq/Epiq open with `feature feature press-square` and then five `press-square` tiles per row; Motorsport has four `press-quarter` tiles in its last row. This addition does not change any series token or require a series re-import.

  **Shape 4 (2026-10-13, Classic Days 2026)** adds the press **mosaic**: a hub whose image banners share rows with its tiles. Any of these tokens switches the block to a 30-column track, which fits fifths, thirds, halves, 3/5 and 2/5. The 20-column track can't split in three, and 60 columns would need more gaps than the row is wide.

    | Token | Row share | Shape |
    |---|---|---|
    | `press-third` | 10/30 | 2:1 less the gutter, a titled tile |
    | `press-banner-wide` | 18/30 | image-only banner, its own ratio |
    | `press-banner-narrow` | 12/30 | image-only banner, its own ratio |
    | `press-banner-half` | 15/30 | image-only banner, its own ratio |

  On the mosaic track `press-square` = 6/30, `feature` = 12/30 and `press-half` = 15/30. `press-quarter` has no 30-column span, so a mosaic with quarters is an error. A banner row is **two cells**, `[size, linked picture]`: the image's alt names the link. Banner sizes need banner rows and vice versa. The hub importer emits the mosaic only when a source tile row also holds a banner cell; on 2026-10-13 only Classic Days does, and the other 17 hubs keep shape 3. The banners are then not repeated in the `press-kit-banners` section.
- **Proof** (all 15 hubs, `test/fixtures/series/`, `tools/importer/series-hub.test.mjs`): replaying the tokens with "close at 12/12 or on `end`" recovers every source row. Tiles per hub: 125-years 8, 130-years 14, roads-places 10, unexpected-jobs 5, minutes 12, road-trip 3, winter-tips 4, back-to-the-past 22, unknown-parts 3, hidden-helpers 19, czech-footprint 5, sustainable-mobility 93, my-life-my-car 11, evolution-of-parts 8, 60-seconds-walkaround 17.
- **Example** (`/en/series/125-years-of-motorsport/`): `sq sq` / `sq-small wide sq-small` / `third third third`, the curated mosaic in source order. It's **not** index-driven (sweep report §5: series hubs are curated), so it replaces the `series-grid` `Listing`.

### `gallery-slider`
- **Status:** `pinned` · **Ticket:** SKODA-819 · **Fallback:** readable (the current Gallery lead + thumbnails)
- **Emitted by:** `parsers/story-flatten.js` for link-free `skoda-carousel-widget`, once 801a/819 switch it over (today it emits `Gallery`).
- **Shape:** header `Gallery (slider)`, then one row per slide: `[<picture>, caption paragraph or empty]`. Captions are visible on the source for some sliders (13.33/20 centred; 6 of 16 lifestyle sliders, plus Octavia, Slavia and 365 km/h per the 819 amendment), so the caption cell is always present. Link-bearing carousels keep routing to `Cards`.
- **Example** (`/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`): 3 sliders with 5, 8 and 4 rows.

### `gallery-preview`
- **Status:** `pinned` (2026-09-27) · **Ticket:** SKODA-223 · **Fallback:** readable (the normal Gallery: main image + thumbnails, in the sidebar column)
- **Emitted by:** `transformers/skoda-press-release-layout.js` (renames the `parsers/gallery.js` table in the press-release sidebar).
- **Shape:** header `Gallery (preview)`, then one row per image `[<picture>, caption paragraph or empty]`, the same rows as `Gallery`. Preceded by an `h3` "Images" as default content.
- **Example** (`/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/`): 4 rows. The 5 M1 releases carry 1, 3, 4, 2 and 3.
- **Landing:** branch `skoda-223-gallery-preview` renders this shape as-is: no re-import, and the fallback goes away
  once it merges. Rows beyond 4 stay in the lightbox behind a "+N" pill. Keep the contract pinned until the branch
  merges and QA verifies it.

### `gallery-story`
- **Status:** `pinned` (2026-09-29) · **Ticket:** SKODA-216 · **Fallback:** readable (the normal Gallery: main image + thumbnails)
- **Emitted by:** nothing yet. `transformers/skoda-story-cleanup.js` drops `.sb-gallery` today (deferred to SKODA-604/801); emitting this shape is that work, not SKODA-216.
- **Shape:** header `Gallery (story)`, then one row per image in the source `data-gallery` order: `[<picture>, caption paragraph or empty]`, the same rows as `Gallery`. The first row is the lead image; the strip shows rows 2–5. The lightbox title is the story `h1` (the source `data-title`), so no title row. The source `content` is empty on the measured galleries, so the caption cell is usually empty.
- **Example** (`/en/emobility/an-icon-in-modern-form-the-electrifying-favorit/`): 5 rows. Rendered on `/drafts/skoda-216-story-gallery`.

### `story-rail-press`
- **Status:** `pinned` (2026-09-27) · **Ticket:** SKODA-224 · **Fallback:** readable (the default carousel cards)
- **Emitted by:** `transformers/skoda-press-release-layout.js` (the "Related Press Releases" band; replaces the default-content cards of SKODA-612).
- **Shape:** header `Story Rail (press)`, then one **curated** row per card `[<picture>, <p>date</p><h3><a href>Title</a></h3>]`. No config rows (they can't mix with curated rows). The band heading (`h2`), the "Based on tags: …" paragraph and the "All" link paragraph are default content before the table, in a `dark, full-width, related` section. Title links go through `skoda-links`; a card without a title link is dropped, so no `href=""` is ever emitted.
- **Example** (`/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs/`): 6 rows. Zellmer 10, National Theatre 5, Board 1; Superb has no band.

### `downloads-file-rows`
- **Status:** `pinned` (2026-09-27) · **Ticket:** SKODA-510 · **Fallback:** readable on `main`
  until PR #186 merges (image tiles and a plain PDF link from `templates/press-release`, and from
  `templates/press-kit` for the press-kit Media Box, which emits the same empty-image rows, #189).
- **Landing:** PR #186 implements this shape without re-import; each empty-image row renders as
  a file tile and the template fallback is removed. The block gets its Media Box appearance from
  a `media-box` section or a `Downloads (media-box)` variant. Authored `collapse=auto|none` optionally
  controls the two-row disclosure (default `auto` in a Media Box, `none` elsewhere); authored
  `columns` controls desktop columns and the number disclosed. Neither option changes the three-cell
  asset row shape. Keep the contract pinned until the branch merges and QA verifies it.
- **Emitted by:** `parsers/downloads.js` and `parsers/press-kit-media.js` (press-release Media Box; since SKODA-830 also the story Media Box, wired in `import-story-detail.js`, in a `dark, full-width, media-box` section built by `skoda-story-cleanup.js`: `h2` Media Box, the stats paragraph, `Downloads`, between the `sidebar` and the related band). A row shape of the `downloads` block on `main`, so the check classifies these pages as `main`, not pending.
- **Shape (v2, #275):** header `Downloads`, then 3 cells per row: `[<picture> or empty, title text, links]`, plus, in a Media Box, the tile's source date (`23. 3. 2026`) in a cell before the title: `[<picture> or empty, date, title text, links]`. The block content-sniffs the date (shown above the tile's `h3` title); it comes first so a block that predates it still reads the last text cell as the title. v1 rows (no date) still render. Emitted so far by `parsers/press-kit-media.js` (the press-kit Media Box); `parsers/downloads.js` (releases, stories) still emits v1 rows. The links cell holds one `<a>` per size, its text the size label: `Original` + `1920px` (image, `/direct-download/…` and `…-1920xH.jpg`), `MP4` (video, Vimeo poster as the picture), `PDF` (document, empty picture cell).
- **Example** (Peaq): 5 rows, `MP4`, 3 × `Original`+`1920px`, `PDF`.

### `press-release-sections`
- **Status:** `pinned` (2026-09-27) · **Ticket:** SKODA-607 · **Fallback:** readable (sections stack in source order; the dark bands use the global `.section.dark` rule)
- **Emitted by:** `transformers/skoda-press-release-layout.js`. Laid out by `templates/press-release/` (selected by `template: press_release` → `body.press-release`).
- **Shape:** five sections, split by `---`:
  1. header: date `<p>` + `h1` (no Section Metadata);
  2. `Style: body-column`: lead image, bullets `<ul>` (optional), perex `<p><strong>`, the Buzzsprout URL, body, an inline Vimeo URL (optional);
  3. `Style: sidebar`: `h3` Additional info + `<ul>` (Media contacts, "Download Media Box" → `#media-box`), `h3` Images + `Gallery (preview)`, `h3` Tags + `Tags`;
  4. `Style: dark, full-width, media-box`: `h2` Media Box, the stats paragraph, `Downloads`;
  5. `Style: dark, full-width, related` (optional): see `story-rail-press`.

### `not-found`
- **Status:** `pinned` (2026-10-19) · **Ticket:** SKODA-706 · **Fallback:** readable (without the template the photos, the heading and the copy stack as default content)
- **Emitted by:** `import-404.js`, one fragment per source `template-404` variant page (`/en/youve-reached-a-dead-end/`, `/en/welcome-to-our-remote-car-park/`) at `/{locale}/fragments/404/<slug>`. Laid out by `templates/error-404/` (selected by `template: error-404`: the site-root `404.html`, or a QA draft that carries the section itself). Spec: [`template-404.md`](../ui-specs/template-404.md).
- **Shape:** one section: the desktop photo `<p><img></p>`, the mobile photo `<p><img></p>` (both `alt=""`), the optional label `<p>404</p>`, the `h1`, the copy `<p>`, the homepage `<p>` with its link, and Section Metadata `Style: not-found`; a white message adds `not-found-white` (the global `light` style is a grey band, so it isn't reused). Škodapedia `term-explain` tooltips are plain text until SKODA-206.

### `quote`
- **Status:** ✅ **on `main`** with `blocks/quote` (SKODA-220 block, landed with SKODA-805c). It moved to the baseline table above and is no longer a pending entry; this section stays as the shape reference. **Ticket:** SKODA-220
- **Runtime:** each row renders as `figure > blockquote + figcaption`: the quote centred 16/24 italic, a 2px black rule 10% of the column wide 20px below it and 10px above the attribution (measured on first-glimpse at 1440/1280/768/390). The rule is CSS, never an `hr`.
- **Shape:** header `Quote`, then one row per quote `[<p>quote text</p>, <p><strong>Attribution</strong>, role</p>]`. The centred imports emit one row per table, and `Quote (left)` emits one row per consecutive quote; the block renders every row. An empty attribution cell is kept. The source's decorative `hr` is **never** emitted, because a bare `hr` in DA splits sections.
- **`Quote (left)`** (SKODA-220, press-kit chapters): the WordPress `figure.quote > blockquote > p > em` + `figcaption > em > strong` quote. It is left-aligned with no rule. The browser's open and close marks each sit on their own 24px line, the paragraphs are italic with a 20px rhythm, and the name is 600 italic. The rows are the same `[quote, attribution]`, **one row per quote**: consecutive figures (flush on the source, 0px apart) share one block, and a paragraph between them starts a new one. Several quote paragraphs stay several `<p>`, and other blocks in the figure are kept, never inside a `<p>`. A `cite` stands in for a missing `figcaption`, and a figure holding media is left as authored. Measured against the Peaq/Epiq chapters at 1440/1080/992/768/390 (identical heights and gaps; see SKODA-220).
- **Nested in an accordion answer:** blocks can't nest in DA, so a `Quote` / `Quote (variant)` table in an accordion answer arrives as a plain `<table>`. `blocks/accordion` rebuilds it as a quote block in its own wrapper and loads it (Elroq press kit, "Modern Solid design with Tech-Deck Face"). Other tables, a multi-cell head, a head with no rows, or a Quote inside a table cell stay as authored.
- **Importers:** `parsers/quote.js` (SKODA-220). It detects a centred `p` with only `em` content, the `hr` right after it, and an optional centred `p > strong`. helix-importer's preProcess drops every `hr` before `transform`, so each importer's `preprocess` marks the runs (`markQuotes`) and the parser builds the table after the layouts have run.
  - `import-press-release.js`: 6 quotes on the 4 M1 releases (Zellmer 2, National Theatre 2, Superb 1, Board 1; Peaq none). They stay in the `body-column` section.
  - `import-press-kit-default.js`: the 2 first-glimpse quotes (Zellmer, Stefani). They are built after `press-kit-content` flattening, so the layout's source-table pass never sees them. The same importer also runs `parseFigure` for the chapters' figure quotes (`Quote (left)`). That gives 5 chapters: Peaq intro (Zellmer, Jahn, Neft in one block), Peaq exterior (Stefani), Epiq intro (Zellmer, Jahn), Epiq exterior (Stefani) and Epiq battery (Neft).
  - `story-flatten.js` `skoda-quote`: not switched yet. It still emits a default-content `<blockquote>` and loses the attribution, and W1 switches it to this table.
- **Example:** the Zellmer press release (`/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company/`).

### `timeline`
- **Status:** ✅ **built** in `blocks/timeline` (SKODA-815, on `main` once its PR merges). It is a baseline block (table above), so there is no pending entry; this section is the shape reference. **Ticket:** SKODA-815. **Spec:** [`timeline.md`](../ui-specs/timeline.md)
- **Source:** the story `ys-milestones` widget (`section.milestones > ul > li`, each holding `.line > .year`, `.title`, `.thumbnail > img` and `.description` after a decorative `.dot`). It appears on 9 EN stories and their 9 CS counterparts (census `ys-milestones`).
- **Shape:** header `Timeline`, then one row per milestone, in source order: `[year, title, <picture>, description]`.
  - `year` is plain text (`1905`).
  - `title` is a `<p>` with the source's lines as `<br>` and the model in `<strong>` (`Laurin & Klement<br><strong>VOITURETTE A</strong><br>(vehicle on display: 1905)`).
  - The image cell holds the image at its own ratio (square on 8 of the 9 stories), alt as authored (empty on the source). A milestone with stacked images keeps them all, in order (iconic cars, 1970).
  - `description` holds the `<p>` text with its links, href only.
  - The source's inline font-size spans and the Škodapedia `term-explain` tooltip markup are unwrapped to their text (glossary tooltips are SKODA-206).
- **`Timeline (black)`:** a widget whose year pills are `#000000` (125 years of Škoda: iconic cars); the default is the green `#9c0`.
- **Fifth cell, space above the title (shape v2, PR #373 review):** optional; a plain pixel count (`15`, `44`), clamped to 200, set as the entry's `--timeline-title-space`. The importer writes it only from two source patterns: an inline `margin-top` on the first title paragraph (15px on four steering-wheel entries) and leading spacer paragraphs (`<p>&nbsp;</p>`, 44px each: iconic cars, 1970). When no entry has space, the rows keep four cells.
- **Title semantics:** the title stays the source's paragraphs (`div.timeline-title > p`), not a heading (PR #373 review).
- **`Timeline (xl)`:** the widgets with a 24pt (32px) model line under an 18pt maker (wheels, gear stick; the dominant inline title size is 32px). The block sizes the title paragraphs by role: an all-bold paragraph is the model line (32 / 48), a paragraph starting with "(" the note (16 / 24), the rest the maker line (24 / 36).
- **`Timeline (large)`:** a widget whose titles are authored at 18pt (the dominant inline title size is 24px; 4 of the 9 EN stories): titles 24px on a 36px line instead of 18.67 / 28. The variants combine (`Timeline (black, large)`).
- **Runtime:** an `<ol>` of entries (year pill, paragraph title, image, description; the line and dots are CSS). It is a left rail up to 1079px and two-sided from 1080 (the source's switch), and it keeps the rail inside a column narrower than 600px.
- **Defensive:** a full four-cell row keeps its columns, so a blank year or image cell is a blank value and the description stays (PR #373 review). A shorter row is read by content: the image cell by its picture, and a row without a year (its first text cell longer than a label) renders without a pill. An empty row is dropped. Every link opens in a new tab with `noopener`, as the source widget's (DA keeps only the href).
- **Importer:** `parsers/story-flatten.js` `milestonesCells`. A widget without list entries falls back to its images and text as default content, never dropped.

### `footnotes`
- **Status:** ✅ on `main` with `blocks/footnotes` once SKODA-805d merges (block and importer land together). **Ticket:** SKODA-805d
- **Why a block:** the source sets small print with an inline size (`<span style="font-size: 10pt">`). DA keeps no inline size, and its inline marks are only `strong`/`b`, `em`/`i`, `u`, `s`, `sup`, `sub`, `code` (no `small`, no `span`). It keeps classes only on block `<div>`s, so the small print has to be a block.
- **Runtime:** each paragraph renders at 10pt (13.33px) on the body's 24px line, with the 20px paragraph gap, in ink, as the source does (measured on first-glimpse at 375/768/992/1080/1280/1440).
  - Links are the source's accent green (`--skoda-green-accent`, `#419468`), ink on hover, no underline. Like the source's, they show no focus ring (PO, 2026-10-21: an accepted exception to css-guidelines §8).
  - Only the footnote link is green (decision 2026-10-05); other body links stay `--link-color` ink.
  - Green on white is 3.71:1, under WCAG AA's 4.5:1 for text this size; the source has the same.
- **Shape:** header `Footnotes`, then one row per paragraph of small print, one cell: `[<p>¹ … <a href>HERE</a><br>² …</p>]`. Links, line breaks and `sup` markers stay. Consecutive small-print paragraphs share one table.
- **Importer:** `parsers/footnotes.js`, run by `import-press-kit-default.js` and, for the story body's small print (Epiq "¹ Available at a later date.", #296), `import-story-detail.js`. `preprocess` marks the paragraphs (`markFootnotes`) on the source as published, before helix-importer's clean-up (which keeps styled spans today); the parser builds the table after the layouts have run, whose source-table pass would flatten it.
  - **Counts:** a `p` whose every word is set below the 16px body size by its nearest sized ancestor (a span). The size is the one CSS applies, the CSSOM's winning `font-size` declaration (`!important` beats a later one; invalid values are dropped), and it must be a plain px or pt length. A `sup` marker outside the sized span is neutral.
  - **Doesn't count:**
    - a few small letters inside an ordinary sentence ("1st", "7th");
    - a paragraph set small as a whole (`<p style="font-size: 12px">`, the Peaq/Epiq chapters' 12/18 style, not handled yet);
    - a paragraph with media (an image or a player);
    - relative sizes (`em`, `%`, keywords) and `0px`.
  - **Top level only:** a marked paragraph that lands in a table (an accordion answer, a Columns cell), a list, a blockquote or a figure stays text, because blocks can't nest.
- **Examples:**
  - first-glimpse (`/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/`): one row, the ¹ MOON POWER and ² V2H notes.
  - The rule also matches the Epiq-2 First Edition chapter's ⁷ ⁸ ⁹ notes (same shape: 10pt lines with `sup` markers), on its next re-import.

### `columns-split`
- **Status:** `pinned` (shape 3, 2026-10-15) · **Ticket:** SKODA-225 · **Fallback:** readable (equal columns, portrait stretched)
- **Shape:** header `Columns (split-NN)` or `Columns (split-NN, portrait-NNN)`; an equal row `Columns (centered[, portrait-NNN][, captioned])` (shape 3).
  - `split-NN` is the first cell's share of the row width in percent, rounded (source 518 | 320 → `split-62`). The rows are the normal `columns` rows. The check accepts `split-10` … `split-99`.
  - **Shape 2 adds `portrait-NNN`:** the authored display width in px of the row's single image, when it's smaller than the file. The source shows `width="235"` portraits of 500px files; DA keeps only the file's own size, so the width travels in the variant. An image at its file size (the charging `sow-image`, `width` = its largest `srcset` entry) gets no token and fills its cell. The check accepts `portrait-10` … `portrait-999`.
  - **Shape 3 adds `centered`:** an equal row (cells within 2%) whose every image the source centres (`img.aligncenter`, a `figure.wp-caption.aligncenter`, a centred paragraph): the Miss Peaches rider profiles, the interview portraits. Each image cell is centred, its images at their own size. `portrait-NNN` is then each image cell's first image, when they share one authored width below the file (`portrait-300` for 300px portraits of 384px files). `captioned` says each of those images is a caption figure, whose caption DA keeps as the paragraphs after it. The check accepts `centered` and `captioned` as literal tokens.
  - **Also on a story row (#516, 2026-10-16):** `text-center` and `text-small` (the cells' text centred / in 10pt, as the source editor set it), and `offset-A-B…` (one px value per cell, `offset(-N){1,6}`): the source's spacer widgets leading a cell, applied from 720px. `lead-A-B…` (the same form, `lead(-N){1,6}`, #380 review 2026-10-20): the blank editor lines leading a cell's text, 44px each, at every width. And `pad-T-R-B-L` / `pad-m-T-R-B-L` (px, `pad(-m)?(-N){4}`): a centred or unequal row's own SiteOrigin padding (`#pg-…> .panel-row-style`), desktop from 781px / mobile up to 780px (the Miss Peaches profile rows: `pad-m-15-15-15-15`).
- **Emitted by:** `parsers/story-flatten.js` for 2-cell SiteOrigin rows with unequal cells (graffiti, Kylaq, Peaq comfort: `split-62, portrait-235`; charging: `split-75`), and for equal rows of centred images (`centered`, 26 rows in 15 stories as of 2026-10-15). The cell widths come from the page's head CSS (`#pgc-<id>{width:61.8%}`), read in `import-story-detail.js`'s `preprocess` (`markCellWidths()`), and so does each editor image's alignment (`markCentredImages()`). Other equal rows, unmeasured rows and 3+ cell rows stay plain `Columns`.
- **Section style `centered-images`** (same importer, no block): added to every `body-column` Section Metadata of a story whose body images narrower than the 819px column are all centred on the source (6 of the 82 migrated stories; 2 quiz stories keep theirs left, and none mix). `styles.css` centres those images.
- **Re-import:** the stories imported with shape 1 output (plain `Columns`) are re-imported through the push tool's `update` path.

### `spacer` (story body) and the story text styles
- **Status:** `pinned` (2026-10-16, #516) · **Ticket:** SKODA-225 follow-up · **Fallback:** without `blocks/spacer` the table shows its height as text (`broken` on a code base without the block; it ships with the importer change)
- **Shape:** header `Spacer`, one cell with the height in px (`24px`): the source's spacer widget (`skoda-offset`, 24px per em), drawn from 720px. `Spacer (line)`: a blank editor line, `44px`, at every width. A missing or malformed height takes no space. This is a top-level block in a story body; the one-cell `Spacer` nested in an accordion answer (above) is a different, accordion-drawn table.
- **Story text styles (section styles, no block):** a styled run of the source editor becomes its own `body-column` section with `text-center`, `text-small` (10pt), `text-medium` (14pt), `text-large` (16pt) or `text-xlarge` (18pt); a padded box adds `text-box` with rows `box-background`, `box-padding`, `box-color`, `box-shadow`. Highlight panels carry their own colours as rows `highlight-background`, `highlight-color`, `highlight-link` (hex).
- **Emitted by:** `parsers/story-flatten.js` (`markTextStyles()` in `import-story-detail.js`'s `preprocess`, then `splitTextRuns()`, `spacerHeight()`, `panelColours()`). Runtime: `blocks/spacer`, `blocks/columns` (`decorateOffsets`), `scripts/section-box.js`, `scripts/highlight-geometry.js`, `styles/styles.css`.

### `columns-banners`
- **Status:** ✅ **on `main`** (variant of `columns`, SKODA-805c). **Fallback:** readable (the banners fill their cells)
- **Shape:** header `Columns (banners)`, then one row of normal `columns` cells, each only a linked image (the source's `download-en.png` / `share-en.png`, authored at 240×150).
- **Emitted by:** `parsers/press-kit-content.js` for a top-level SiteOrigin row whose 2+ filled cells are each a single linked image with an authored `width` ≤ 400. Other 2+-cell rows (photo pairs, the contact cards) become plain `Columns`, one cell per source cell, as in `story-flatten.js`. Rows inside an accordion answer stay linear (DA blocks can't nest). In the corpus, 36 of the 51 `press_kit-template-default` pages have the banner row, 16 the contact row and 4 a photo pair.
- **`Columns (callout)`:** `skoda-press-kit-default-layout.js` emits it for a one-row `[small image | text]` layout table (authored width ≤ 60): the chapters' "What's up, Škoda?" WhatsApp callout, whose 512px PNG DA can't size.
- **Runtime:** `blocks/columns` keeps banner images at 240px, and callout icons at 50px in a 60px cell. `templates/press-kit` sets body-column rows side by side from the source's 781px stack width, 20px apart, and stacks them 40px apart below.

### `accordion`
- **Status:** ✅ **on `main`** with `blocks/accordion` (SKODA-805a/805c; minimal SKODA-807). It moved to the baseline table above; this section stays as the shape reference. **Ticket:** SKODA-805c
- **Shape:** header `Accordion`, then one row per toggle: `[summary label (text), body (rich content: paragraphs, lists, links, images)]`. Rows appear in source order and are all closed by default. Nested blocks inside a panel aren't supported: an embed inside a panel stays a bare link.
- **Example** (`/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/`): 8 rows.
- **Variant `faq` (SKODA-807, on `main` with the block):**
  - Header `Accordion (faq)`, with the same rows.
  - `parsers/press-kit-content.js` emits it on a kit's FAQ chapter, a `…/frequently-asked-questions/` page (Peaq-2: 28 rows, Epiq-2: 5).
  - The block behaves as the default variant and adds one schema.org `FAQPage` JSON-LD script to the head. It has one `Question` / `acceptedAnswer` per complete row; every FAQ accordion on the page shares that one script.
  - Fallback: without the variant code the block is a plain accordion (`readable`).
- **Answer layout tables (#275, 2026-10-13):** DA keeps neither the source's empty paragraphs (a pushed `<p>&nbsp;</p>` is dropped on preview) nor its SiteOrigin cell widths. So `parsers/answer-layout.js` carries them as small tables nested in the answer, as a nested Quote is carried:
  - `Spacer`, a one-cell table: the source's blank line, drawn as one body line plus the paragraph gap (44px).
  - `Spacer (row)`: an empty builder row, its two 10px cell insets (20px).
  - `Media row`, a head plus one row of widths (`50.4%` | `49.6%`), placed before the first image of a side-by-side image row. Only rows whose cells aren't equal carry one; `templates/press-kit` sizes the cells from it (≥ 781px) and removes it.
  - `blocks/accordion` draws the spacers. A Spacer with more cells or rows, another name, or one inside a table cell stays as authored. Fallback: without the code the tables show as one-word tables (`readable`).
  - In use, across all 56 press kits: first glimpse (2 × `Spacer` in item 1, `Media row` in item 3, `Spacer (row)` in item 8), Peaq-2 Connectivity, Epiq-2 intro and the Elroq covered drive (one `Media row` each), and Fabia 130 (three; not pushed until its PDF / MP4 links are in the DAM).

### `highlight`
- **Status:** `pinned` (decided 2026-09-25: section style; **shape 2** 2026-09-28; runtime landed 2026-10-05) · **Ticket:** SKODA-824 · **Fallback:** `readable` (it was `broken` until the runtime landed: the panel had no box or text treatment, and each extra `body-column` section moved the sidebar) · **Styles:** `highlight-dark`, `highlight-grey`
- **Form: section style, not a block.** The dark box can contain a `Gallery (slider)` or a `Columns` row, and DA blocks can't nest (rule 5).
- **Shape (v2):** a section holding the panel's content (h3, text, images, and any nested blocks), closed by `Section Metadata` with `Style` = `body-column, highlight-dark` (story panel) or `body-column, highlight-grey` (PR FAQ/info callout). The body resumes after it in a new `body-column` section; no resumed section is emitted when nothing follows, and none is left before a panel that opens the body (story: `dropEmptySections()` after `afterTransform`; press release: the leading body marker is dropped). Consecutive highlighted rows each become their own section with the same style; the runtime joins them.
- **Why v2 (was `highlight, dark` / `highlight, grey`):** v1 collided with existing CSS, so its "readable" fallback wasn't true:
  - `.section.dark` is the full-bleed 100vw story band (`body.story main > .section.dark`) and the press-release dark bands;
  - `.section.highlight` is the boilerplate light band in `styles.css`;
  - both templates (`body.story`, `body.press-release`) only keep `.body-column` sections in the reading track, so every other section spans the full grid.

  `body-column` keeps the panel in the text column. The single `highlight-*` class matches no existing rule.
- **Geometry rows (story, PO 2026-10-13: the panel inset as the source):** the source panel's content sits its row padding + the 10px cell padding + each widget's margin in. Most layouts keep the theme's (no row padding; widget margin `0 15px` from 781px, `15px` up to 780px; a gallery with no margin), which `styles.css` draws by default. A layout that sets its own carries extra `Section Metadata` rows, each a 1–4 value px box:
  - `highlight-padding` / `highlight-padding-mobile`: the row padding (`#pg-…> .panel-row-style { padding }`);
  - `highlight-margin` / `highlight-margin-mobile`: the text widgets' margin (`#pl-… #panel-… { margin }`), `0px 0px 0px 0px` when the layout gives them none;
  - `highlight-gallery-margin` / `highlight-gallery-margin-mobile`: the carousel widget's margin.
  - The mobile row is the `@media (max-width:780px)` rule, or the desktop value when there's none.
  - **A multi-column row (SKODA-227, 2026-10-19)** whose layout sets a cell's own widget margin or `.panel-cell-style` padding carries them per cell, one box per Columns cell joined by ` | `: `highlight-cell-margin` / `-mobile` and `highlight-cell-padding` / `-mobile` (a cell without its own keeps the theme's `0 15px` / `15px` margin, no padding), plus its `highlight-padding` rows. The runtime gives the section `hl-cells`: the panel keeps only its row padding, and each cell has the 10px cell padding + its padding + its margin. A panel right after it is pulled up 40px over its inset, as the source's row (`margin-top: -40px`). In use: the charging story's "Five questions" (`0px 0px 0px 15px | 0px 10px 0px 0px`; padding `0 | 15px`): its portrait is the source's 150 × 224 at 1280. Other multi-column panels (5 in the 82 stories) carry none and keep the default inset.
  - `parsers/story-flatten.js` `markHighlights()` reads them in `preprocess`. Delivered pages have them as the section's `data-highlight-*` attributes; `scripts/highlight-geometry.js` turns them into the section's `--hl-*` boxes.
  - Fallback: without the code the panel keeps the default inset (`readable`).
  - In use: 10 panels on 8 stories (camouflage ×2, sportline, what-you-learn ×2, cruise control, the plates story, designers on the Peaq, an epic start, park your Škoda).
- **Variant:** from the background colour's luminance, `dark` below 0.5 and `grey` above (white = no panel). All 16 M1 story rows are `#0e3a2f`; the Zellmer FAQ panel is `#f3f3f3`.
- **Importers:**
  - `parsers/story-flatten.js`: `import-story-detail.js`'s `preprocess` calls `markHighlights()`, because the row colour is only in the SiteOrigin head CSS (`#pg-<id>> .panel-row-style`). This gives 16 rows on 11 of the 19 M1 stories: Epiq, Octavia, Slavia, plates, graffiti, Froome, Peaq production, Peaq Tour de France, Kylaq ×3, paper Kodiaq ×3, and charging ×2 (consecutive; one is a 2-cell Columns row).
  - `transformers/skoda-press-release-layout.js`: a `div[style*=background]` direct child of `.entry-content` (the Zellmer FAQ, the last body content).
- **Runtime (SKODA-824 runtime half, landed 2026-10-05; measured spec: [`highlight.md`](../ui-specs/highlight.md)):**
  - **Panel styling.** The colours are global in `styles/styles.css`. The story geometry is also in `styles.css`: the panel spans the body track plus 10px, bleeds full width below 768, and keeps the source's 25px content inset. The press-release callout geometry is in `templates/press-release/press-release.css`: the text column, padded 25px.
  - **Join.** Consecutive same-variant panels read as one band. The first drops its bottom inset, and the second keeps the 10px cell padding.
  - **Sidebar span.** `scripts/split-body.js` `spanSidebar()` counts the `body-column` run that the `.section.sidebar` closes. It runs from `decorateStorySections` and `decorateTemplateSections`. Both grids span the sidebar from the first part, and the last part takes the slack (`grid-template-rows: repeat(n, auto) 1fr`). A page with a single body section gets no counts, so its layout is unchanged.
- **Publish gate:** the entry lists its `styles`, so `checkPage` still reports `highlight` as pending on any page whose Section Metadata carries one. With `fallback: readable` the page publishes. The hold mechanism for a broken section-style fallback stays covered in `block-check.test.mjs`.

### `cover-box`
- **Status:** `pinned` (2026-09-28) · **Ticket:** SKODA-218 · **Fallback:** readable (a light rail, as before)
- **Form: section style, not a block.** A homepage band holds one or more rails (Media Room "Models" + "Press Kits"), and DA blocks can't nest (rule 5).
- **Shape:** each source `.cover-box.dark` band becomes its own section closed by `Section Metadata` with `Style` = `cover-box, dark`. The Media Room home adds `compact` (`cover-box, dark, compact`: its bands sit 16px tighter at the top). Detected by the source class, never by heading or URL. Emitted by `transformers/skoda-dark-bands.js` (both home importers) and, for the Social media band (a heading + `Cards (social)`), by `parsers/social-cards.js` (SKODA-217); the transformer skips `.socials-static` so the band is styled once.
- **Runtime:** `styles.css`. `cover-box` = the band box (1440px cap, centred; live inner spacing 66/60, compact 48; 48px between rails); `dark` = the existing green/white primitive, with headings in the band following its white text.

### `media-item`
- **Status:** `pinned` (shape 6, 2026-09-28) · **Ticket:** SKODA-608 · **Fallback:** readable (story-style listing/rail cards until SKODA-406)
- **Form: a row of the generated media feed, not a page** (docs/architecture/SKODA-MEDIA-ITEMS-OPTIONS.md, option B:
  AEM Assets is the source of truth; pages per item are retired). The feed is a DA sheet at `/en/media-feed.json`
  (`{total, offset, limit, data, ":type": "sheet"}`), read by `listing` and `story-rail` via `index: /en/media-feed.json`.
- **Emitted by:** `tools/importer/media-items/build-media-items.mjs` (M1: from the source listing cards;
  `--push` uploads, previews and publishes it). **M2:** the AEM Assets sync job (SKODA-511) writes the same rows from
  published assets.
- **Row (every value a string, lists comma-joined):** `path` (the card link: the image's CDN original or
  `https://vimeo.com/<id>`, until the SKODA-406 lightbox), `title`, `description` (caption), `image` (thumbnail: the
  768px source rendition / Vimeo poster; in M2 the asset's published delivery URL), `template` image|video, `date`,
  `category` images|videos, `tags` + the 15 facets (mapped by term name; in M2 from AEM tags, SKODA-512),
  `original`, `rendition-1920`, `mp4`, `vimeo-id`, `poster` (stable CDN URLs, never `/direct-download/`), `id`
  (source attachment id / M2 asset id, the cart key), `source`.
- **Shape 4 (2026-09-28, SKODA-208):** + the lightbox detail panel, as the source colorbox shows it (fetched per
  item from the source `image-overlay-meta-data` panel): `filetype` (JPG), `filesize` (10 MB), `dimensions`
  (8256 × 5504 px), `labels` (tag chip names in source order, comma-joined), `related` (the parent article: a
  site path when it is a demo page, else the absolute source URL) and `related-title`. Empty when the source panel
  is empty. In M2 the AEM Assets sync writes them from the asset metadata.
- **Shape 5 (2026-09-28, SKODA-208):** + `template` **`asset`** (`category` `assets`): an image that page copy links
  to (the model pages' Liftback / Combi drawings, `<a href="…jpg"><img class="wp-image-N">`), found by scanning the
  pages in `sources.json` `assetPages`. Title (the source panel's first line), `date` (its Published), `original` and
  the shape-4 detail fields; no facets, cart or download fields. Only the lightbox reads them (matched by file name);
  listings and rails never show them (they scope `template=image|video`).
- **Shape 6 (2026-09-28, SKODA-208):** + the video lines of the source panel: `length` (14:05), `bitrate`
  (29994kb/s), `audioformat` (the source's "Audio format", `.meta-dataformat`: quicktime). Empty for images.
- **Detail gate (2026-09-29, #200 review):** every row the lightbox offers as a file (images, `asset` rows, videos
  with an MP4) must carry `filetype`, `filesize` and `dimensions`. The builder re-fetches incomplete or missing
  panels (3 attempts, fresh nonce), caches only complete ones, writes `detail-gaps.json`, and **fails the build**
  on any gap not recorded as a verified source gap in `sources.json` `knownDetailGaps` (6 today: 5 Peaq / Epiq
  videos with an empty source panel, 1 video without a dimensions line).
- **Manifest gate (2026-09-29, #200 review):** every binary a row serves (thumbnail, `rendition-1920`, `original`,
  `poster`, `mp4`) has a row in `tools/importer/media/media-manifest.json` (`npm run media:build -- --feed …`);
  `media-items:build --push` refuses to publish while one is missing. DAM upload stays deferred (import-time rows).
- **Sharding (SKODA-517; reader 2026-10-19, generator 2026-10-21):** a sheet holds 500k cells (~12,500 rows
  at 40 columns), and every reader downloaded the whole feed. The feed is split by how it is read. A registry
  sheet `/en/media-feed/index.json` lists one row per shard file: `kind | key | url | rows | total | build`.
  - `head`, key = template (`image`, `video`): the newest 48 rows of one template, newest first; `total` = all
    its rows. A listing's first page in the default view (no filter, no path, newest first, not past 48 rows).
  - `facets`, no key: every row in the whole feed's order, with only `id`, `template`, `date`, `detail` (the
    key of the detail shard holding the full row) and `f`, the facet values compact as
    `key:value|key:value` (the reader expands them into the facet columns; 5 columns at any size).
  - `detail`, key `<template>:<year>`, or `<template>:<year>-<n>` when a year holds more than 400 rows (parts
    in the feed's newest-first order): full rows, filled in for the page a listing shows.
  - `slice`, key `<facet>:<value>` for the rails' facets (`model`, `bodywork`): full rows carrying that value
    (values of one facet are unioned).
  - `keyed`, key `0` … `n-1`: full rows by file name, `keyShard(fileKey(original), n)` (32-bit FNV-1a) in
    `scripts/media-feed.js`. The generator must import that function. Used for image-link and lightbox lookups.
  - `url` is a root-relative `.json` path. Every row of a registry carries the same `build`: mixed builds, or
    no valid row, mean no registry.
  - **Generator:** `npm run media-items:shards -- [--feed <file|url>] [--dry-run] [--push]`
    (`tools/importer/media-items/build-media-shards.mjs`, the pure split in `media-shards.mjs`). It reads the
    published feed (its AEM Assets and Media Bus URLs) and writes every shard in the build's folder under
    `/en/media-feed/` (the folder is a hash of the rows, so the same feed gives the same names). On `--push` it
    publishes every shard first and the registry last: a failed run leaves the previous build live. A sheet
    over 500k cells fails the build. Run it after every `media-items:build --push`.
  - **Without a registry, every reader reads the whole feed, as before.** The loader (`scripts/media-feed.js`)
    looks for a registry only for a `/{locale}/media-feed.json` index. A shard that fails to load, or a detail
    shard without a row the facet index names, falls back to the whole feed, so publish it until the shards
    replace it.
- Domain-restricted Vimeo videos (oEmbed `domain_status_code: 403`) can't play on the demo and are not emitted.

### `page-body`
- **Status:** `pinned` (2026-10-21) · **Ticket:** SKODA-813 · **Fallback:** readable (unstyled default content
  under the band) · **Styles:** `page-body`, `page-body, half`, `page-body, half, empty-cell`
- **Emitted by:** `transformers/skoda-page-rows.js` (page-base importer). One section per SiteOrigin row of the
  generic page's body, each closed by its `Section Metadata`; a body without rows is one `page-body` section.
- **Shape:** `page-body`: the row's flattened default content (h2/h3/p/lists/links). `half`: the row held its
  text in the left cell of a 50/50 row, the right cell empty: from 781px the text keeps half the column less a
  40px gutter. `empty-cell`: that right cell held an empty widget rather than none, so on phones the source
  stacks it under the text, 10px tall.
- **Runtime (styles.css):** every row 10px under the band or the row before; text 20px inside the column,
  30px from 781px; h2 40/45 and h3 24/27.6, wt300, 16px under; paragraphs 20px apart; green links, ink on hover.
- **Example** (`/en/copyright/`): `page-body` (the h2 row), `page-body, half, empty-cell`, then 3 × `page-body,
  half`. Equal to the source at 390 / 768 / 780 / 781 / 992 / 1440 (every text box, the band, the footer gap).

### `floating-action-bar`
- **Status:** `pinned` · **Ticket:** SKODA-215 · **Fallback:** readable (absent)
- **Form: code-only.** It's template chrome (share toggle + scroll-to-top) added at runtime on **every template** (215: all 43 captures), so the importers emit **nothing** for it.

### `media-room-chrome`
- **Status:** `pinned` · **Ticket:** SKODA-309 (with 305) · **Fallback:** readable (Storyboard chrome)
- **Form: bulk metadata, not importer output** (309 amendment). The 16 MR-side URLs (5 press releases, **5 model pages**, 4 press kits, Images, Videos) get `nav` / `footer` from `metadata.json` rows for the MR path globs. Those rows are activated only once both MR fragments return 200 on preview and live. The importers emit nothing, and the push tool's fragment check requires the fragments to be live before publishing.
- **Rows** (SKODA-309, 2026-09-28): every row sets `nav: /media-room/nav`, `footer: /media-room/footer` and `section: media-room`. `header-switcher.js` uses `section` to activate the Media Room tab; the Media Room header also gets a lighter topbar.
  - Patterns: `/en/press-releases/**`, `/en/press-kits/**`, `/en/skoda-model/**`, `/en/skodapedia/**`, plus an exact row and a `/**` row each for `/en/news`, `/en/images`, `/en/videos`, `/en/media-room`, `/en/contacts`, `/en/search` and `/en/newsletter` (the SKODA-305 footer list).
  - **Tag archives (SKODA-209, 2026-10-22):** an exact row and a `/**` row each for `/en/tag/company`, `/en/tag/crew`,
    `/en/tag/derivative`, `/en/tag/environment`, `/en/tag/people` and `/en/tag/years`. On the source these taxonomies'
    archives are Media Room pages (`body.media-room`, MR nav and footer); model tags and categories are Storyboard.
    The Stories grid ends 48px under its pager on a `section: media-room` page (16 elsewhere), as the source does.
  - The rows don't overlap each other and none matches a Storyboard page. Page-level metadata still wins over the bulk rows (aem.live bulk metadata).
- **Fragment check:** `fragmentPaths()` reads the preview and live `/metadata.json` rows whose pattern matches a pushed page (`bulkPatternMatches`). So an MR batch requires `/media-room/nav` and `/media-room/footer` to be live, and Storyboard batches don't.

### `skodapedia`
- **Status:** `out-of-scope` · **Ticket:** SKODA-206 · **Fallback:** broken
- `parsers/skodapedia.js` emits it, but no M1 URL uses it and the block data model removed it. The check fails any M1 page that contains it.

## Changing a contract
1. Edit the entry here and in `block-contracts.json` in the same PR, and bump `shape`.
2. Update the emitting parsers (and their `contract <id> v<shape>` comment).
3. Run `npm run import:validate-blocks -- --urls <affected family list>`, then `npm run import:status`. Pages still on the old shape show up as errors and are re-imported through `npm run import:push`.
