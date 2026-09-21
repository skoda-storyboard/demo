# Component Spec: Press Kit Variant (bodywork/model-variant subsections + internal categorization)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP on page id 1; source CSS
cross-checked against `media-room-515d2d102b.css`; reference screenshot saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

Composes into [`press-kit-template.md`](press-kit-template.md); reuses [`story-detail.md`](story-detail.md)
(variant sub-page shell), [`press-kit-media.md`](press-kit-media.md) (media within a variant), and the
15-facet metadata that feeds the faceted listing (SKODA-401/402).

## 1. Identity

- **Component:** Press-Kit variant handling, (a) one or more **variant-specific subsections** nested after
  the core narrative (e.g. "Škoda Peaq Sportline"), (b) a **variant/bodywork selector** to move between
  variants where present, and (c) the **internal categorization metadata** (model / bodywork / category)
  that ties a kit to the listing facets and model-page strips.
- **EDS block(s):** a `press-kit-variant` subsection (default-content section, reusing SKODA-805
  conventions) + Metadata facets on the kit's `Metadata` block; the selector is an in-page anchor/toggle
  (no dedicated widget needed, see §8).
- **Client PDF IDs:** MR-PK03 (Variant/Bodywork Selector); requirements §11.7, §11.9, §11.14.
- **Ticket:** SKODA-808 (upstream SKODA-805/806, SKODA-401; downstream SKODA-402 listing, MR-M04 model strips).
- **Source references (URLs used):**
  - Kit landing: `https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-press-kit/`
  - Variant sub-page (Sportline): `https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-press-kit/the-peaq-sportline-dynamic-inside-and-out/`
- **Top-level selectors:** `article.article-teaser` "Škoda Peaq Sportline" (the variant tile on the
  landing, positioned after the core narrative tiles), `article.press_kit` (facet classes),
  `.columns > .column-primary` (variant sub-page shell), `.chapter-nav` (chapter/variant nav).

## 2. Source anatomy

The variant is **not a separate control**, it is a chapter that appears **after** the core narrative,
as its own tile on the landing and its own entry in the chapter-nav, linking to a story-detail-style
sub-page:

```
KIT LANDING  .content .panel-grid   (chapter tiles in order)
├── Introduction … Connectivity      the six core narrative tiles (press-kit-template.md)
└── article.article-teaser "Škoda Peaq Sportline"   ← VARIANT tile, AFTER the core narrative
        → /skoda-peaq-press-kit/the-peaq-sportline-dynamic-inside-and-out/

VARIANT SUB-PAGE  (body.press_kit-template-default, postid-445845)
.chapter-nav ("Chapters" — lists all chapters incl. "Škoda Peaq Sportline")
.columns > .column-primary (66.66%) + .column-secondary (33.33%)
└── h1.entry-title "The Peaq Sportline: dynamic inside and out" + rich text + inline media-box
```

**Internal categorization (re-measured 2026-09-15; the kit landing article and the variant sub-page article
DIFFER):**
```
KIT landing article.press_kit:
  model-peaq  bodywork-suv  category-peaq-en  category-press-kits
  technology-electro-vehicle technology-electromobility technology-emobility  years-61572
VARIANT sub-page article (Sportline) adds:
  derivative-sportline   category-models   technology-meb-2   media-cart-item
```
The **`derivative-sportline`** token is the actual per-variant encoding (absent from the kit landing article);
it, plus `category-models` and `technology-meb-2`, appear only on the variant sub-page article. These class
tokens are the source of the model / bodywork / **derivative** / category / technology / year facets (the
15-facet set, §11.14) that make the kit discoverable via MR-L03 filters and MR-M04 model strips. Map
`derivative-*` to a `variants`/`derivative` Metadata field (SKODA-401 normalization).

**No dedicated variant/bodywork selector widget exists.** The only `<select>` on the variant page is the
global `select.search-type-select` (site search), unrelated. Navigation between variants/chapters is the
tile grid + the "Chapters" sub-nav, i.e. **in-page anchor/link navigation** (· Sportline page ·
`select, [class*=variant|bodywork|selector]` · 1280 → only the search select). **Independently confirmed
by the 2026-09-15 block recount** ([`../analysis/SKODA-BLOCK-RECOUNT.md`](../analysis/SKODA-BLOCK-RECOUNT.md)
§6/§8): a full crawl found **no rendered variant/bodywork selector anywhere**, so `press_kit_variant` was
dropped from the content-block set. The selector below (§7/§8) is therefore a **net-new EDS affordance,
pending client confirmation of MR-PK03**, not a source port. The nested subsection + Chapters anchor-nav
is the real, source-backed pattern.

**Libraries / patterns to retire:** SiteOrigin panels/sub-page tree, jQuery, the WP category-class
taxonomy encoding (replace with a normalized Metadata block, SKODA-401), the icon-font chapter-nav.

## 3. Measured visual spec

All rows: `measured (source-url · selector · viewport) → token`. `SPORT` = the Sportline sub-page.

### Variant tile (landing), reuse [`card-teaser.md`](card-teaser.md) cards-overlay
- The "Škoda Peaq Sportline" tile is a `ratio-container.ratio-1x1` overlay card, identical styling to the
  other chapter tiles (title `16px / 18px / weight 500 / #fff` overlay), placed **after** Connectivity in
  source order (· LANDING · `article.article-teaser` · 1280). See press-kit-template.md §3.

### Variant sub-page shell, reuse [`story-detail.md`](story-detail.md) + press-kit-template.md §3
- `body.press_kit-template-default` (same template as the core narrative chapters) (· SPORT · 1280).
- `.columns` two-column shell: `.column-primary` 66.66% + `.column-secondary` 33.33% (· SPORT · 1280).
- `h1.entry-title` "The Peaq Sportline: dynamic inside and out" (· SPORT · 1280), press-release-style
  26px heading (per press-kit-template.md §3, no overlay hero on sub-pages).
- `.chapter-nav` present (· SPORT · `.chapter-nav` · 1280) → the variant is reachable from the chapter nav.
- Rich text + inline media-box reuse story-detail.md / press-kit-media.md (delegated).

### Internal categorization (facet metadata)
- The kit landing `article.press_kit` carries `model-peaq bodywork-suv category-peaq-en category-press-kits
  technology-electro-vehicle/-electromobility/-emobility years-61572`; the variant sub-page `article` adds
  `derivative-sportline category-models technology-meb-2 media-cart-item` (· LANDING/SPORT · `article[class]` ·
  1280, re-verified 2026-09-15). These map to the Metadata block fields `model / bodywork / derivative /
  category` (+ technology, year), no new taxonomy invented (§11.14); `derivative-sportline` is the variant key.

## 4. Responsive behavior

- Variant **tile** follows the chapter tile grid: 3 across @≥992, 1 across full-width <992 (per
  press-kit-template.md §4).
- Variant **sub-page** follows the story-detail shell: two-column `66.66 / 33.33` at ≥768, stacked <768.
- No variant-specific breakpoints; the selector (if built as in-page anchors) is layout-neutral.

## 5. Interaction states

- **Variant tile:** whole-card link → variant subsection/sub-page; hover/focus per card-teaser.md §5.
- **Chapter/variant nav:** the sticky "Chapters" nav lists the variant; clicking scrolls/navigates to it
  (press-kit-template.md §3, §5).
- **Selector (rebuild):** an in-page anchor/toggle set, clicking a variant name scrolls to (or reveals)
  that variant subsection; `aria-current`/`aria-selected` on the active variant.

## 6. Accessibility

- Variant subsection is a labeled `<section>` with its own `<h2>` (nested after the core narrative,
  correct heading order, no skips).
- Variant selector (if a toggle/tablist): real `<button aria-selected>`/`<a aria-current>` set with
  keyboard support (Left/Right or Tab) and a labeled group (`aria-label="Vehicle variants"`); visible
  `:focus-visible`.
- One `<h1>` per rendered page/section context; the variant heading is an `<h2>` when composed in-page.
- Facet metadata is not user-facing but must be accurate for filtering (no a11y impact).

## 7. EDS target

**In-page variant subsections** within the press-kit page (SKODA-805 section conventions): each variant is
an ordered default-content section after the core narrative, optionally with its own grouped media
([`press-kit-media.md`](press-kit-media.md)). A lightweight **variant selector** (anchor/toggle) is
generated from the variant section headings. Facets live on the kit `Metadata` block (feeds SKODA-401
normalization / query-index).

### DA authoring model (worked example)

```
## Connectivity                       ← last core narrative section
## Škoda Peaq Sportline               ← variant subsection (Section Metadata Style: variant)
   …rich text + [Press Kit Media]…
| Metadata |                          |
| template | press-kit               |
| model    | Peaq                     |
| bodywork | SUV                      |
| category | Press kits, Models       |
| variants | Peaq, Peaq Sportline     |   ← drives the in-page selector
| date     | 2026-06-23               |
```

### `decorate()` outline (repo conventions, `_FOUNDATIONS` §7)

1. Detect variant sections (`Section Metadata Style: variant`, or headings after the core narrative);
   render each as `<section class="press-kit-variant">` with its `<h2>` + content.
2. If ≥1 variant, generate a selector: a labeled `<nav>`/tablist of variant names → anchor links (or
   toggle that reveals one variant at a time); mark the active one `aria-current`/`aria-selected`.
3. Read `model / bodywork / category / variants` from the `Metadata` block → normalize into the
   query-index record (SKODA-401) so the kit surfaces under MR-L03 facets + MR-M04 model strips.
4. Facet extraction is a **normalization layer** (SKODA-401): variant/bodywork/category may need derivation
   from headings/metadata, not a clean selector read.
5. CSS scoped to `.press-kit-variant`; tokens only; reuse card-teaser/story-detail values.

## 8. Open decisions + recommended default

- **In-page toggle vs separate variant kits, RESOLVED → in-page anchor/toggle (default).** Evidence: on
  the live Peaq kit the Sportline variant is a **chapter within the same kit** (a tile after the core
  narrative + a chapter-nav entry + a sub-page under the same `/skoda-peaq-press-kit/` path), **not a
  separate kit** and **not a dedicated selector widget** (the only `<select>` is site search). Recommend
  modelling variants as **in-page subsections reached by an anchor/toggle selector**, one kit per model
  with N nested variants. Separate variant kits would fragment the model and break the single-kit
  discovery pattern. (Assumption to confirm in design.)
- **Selector interaction:** default = an anchor list / lightweight tablist generated from variant headings.
  A reveal-one-at-a-time toggle is an opt-in if the client wants to de-clutter long kits (adds tab ARIA).
- **Facet metadata:** carry `model / bodywork / category` (+ technology, year) on the Metadata block, reuse
  the confirmed 15-facet model; derive via SKODA-401 normalization (not direct class read). Which facets
  are demo-critical is scoped by D12.
- **Tokens:** no new tokens, reuse card-teaser (cards-overlay tile), story-detail (two-column shell,
  prose), and press-kit-template (`--chapter-nav-height: 44px`) values.

## 9. Pixel-perfect acceptance criteria

Compare EDS render to source at each viewport. WHAT / WHERE / viewport / expected / actual.

- [ ] Variant subsection: renders **after** the core narrative (Introduction … Connectivity), in source
      order, as a `<section>` with its own `<h2>`; nests grouped media where authored.
- [ ] Variant tile (overview): `ratio-1x1` overlay card, title `16px / weight 500 / #fff`, positioned after
      the core-narrative tiles.
- [ ] Variant sub-page/section shell: two-column `66.66 / 33.33` @≥768, stacked <768; title `26px / weight
      600` (or `<h2>` when composed in-page).
- [ ] Selector: switches/navigates between variants accessibly (keyboard + `aria-current`/`aria-selected`);
      active variant marked.
- [ ] Metadata: kit `Metadata` carries `model / bodywork / category` (+ variants); the kit surfaces under
      the correct MR-L03 facets and MR-M04 model strips.
- [ ] Omission: a single-variant kit (no Sportline) renders with no empty selector and no layout break.
- [ ] A11y: variant `<section>` labeled by its `<h2>`; selector is a labeled `<nav>`/tablist with keyboard
      support; `:focus-visible` throughout; heading order preserved.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/press-kit-variant/`: `sportline-1280.png` (the "Škoda Peaq Sportline" variant sub-page: chapter-nav
listing the variant, two-column shell, model/bodywork facet classes on the article). Selector-control and
mobile captures pending (source has no dedicated selector widget; the selector is a rebuild addition).
