# Component Spec: SiteOrigin Body (Page-Builder rich-text region)

Status: **DRAFT+MEASURED** (structure + core type measured live 2026-09-15 via Chrome DevTools on a
story; full per-breakpoint sweep + generic-page/model-description instances pending).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

Surfaced by the 2026-09-15 block recount ([`../analysis/SKODA-BLOCK-RECOUNT.md`](../analysis/SKODA-BLOCK-RECOUNT.md)
§3/§6) as the most-rendered content region with no dedicated spec: **1,614 pages** (1,568 STO / 46 MR).
It is the authored body behind the SiteOrigin flatten work (SKODA-801) and needs its own measured spec.

## 1. Identity

- **Component:** the SiteOrigin Page Builder body, the arbitrary author-built region of nested column
  rows holding rich-text, headline, and image widgets. It is the generic "article body" of Storyboard
  stories, the model page's "Model Description", and generic Pages.
- **EDS block(s):** none, this is **default content**. The job is a parser that flattens the SiteOrigin
  panel tree into EDS sections + default content (+ a `columns` block only where an author truly used
  side-by-side columns). No runtime block; the work is import-time (SKODA-801).
- **Client PDF IDs:** STO-D01/D02 (story body), STO-M02 (model description), part of the generic Page.
- **Ticket:** **SKODA-814** (new; the region spec), upstream of / paired with SKODA-801 (story flatten).
- **Source references:**
  - Story: `https://www.skoda-storyboard.com/en/lifestyle/people/an-international-womens-day-surprise/`
  - Model description: any `skoda_model` page (see [`template-model-page.md`](template-model-page.md)).
- **Top-level selectors:** `.entry-content .panel-grid` (a Page-Builder row group), `.panel-grid-cell`
  (a column), `.so-panel` (a widget slot), `.siteorigin-widget-tinymce` (rich text),
  `.sow-headline` / `.siteorigin-widget-sow-headline` (heading widget), image widgets.

## 2. Source anatomy

SiteOrigin renders nested, author-defined column grids. One page carries several stacked grids, each a
row split into 1, 2, or 3 columns, each column a stack of widgets:

```
.entry-content  (the story/page content column)
└── .panel-grid            × N   (one per Page-Builder "row"; measured 4 on the sample story)
    └── .panel-grid-cell   × 1-3 (the columns of that row; measured 6 cells across the 4 grids)
        └── .so-panel      × M   (a widget slot)
            └── .siteorigin-widget-tinymce   (rich text: <p>, <ul>, <a>, inline <img>)   ← the bulk
              | .sow-headline / .siteorigin-widget-sow-headline  (a heading widget, e.g. <h3>)
              | .siteorigin-widget-image      (a standalone image)
```

Measured (story · 1280): 4 `.panel-grid`, 6 `.panel-grid-cell`, 5 `.so-panel`, every widget a
`siteorigin-widget-tinymce`. A two-column row shows as two `.so-panel` at ~half width (399px each in
the 839px content column).

**Libraries / patterns to retire:** SiteOrigin Page Builder (`siteorigin-panels`), its widget CSS/JS,
jQuery. The nested `panel-grid/cell/panel` wrappers carry no semantic value, flatten them away.

## 3. Measured visual spec

`ST` = the Women's-Day story. Values `measured (url · selector · viewport) -> token`.

- **Content column** (`.entry-content .panel-grid`): width `839px` inside the story's primary column
  (66.66% of the 1248 content cap, matches [`story-detail.md`](story-detail.md)); `max-width:none`
  (the column is sized by the shell, not the grid) (· ST · 1280).
- **Column split:** a 2-col Page-Builder row -> two `.so-panel` at `399px` each (≈ 50/50 with the row
  gutter) (· ST · `.so-panel` · 1280). 1-col rows fill the full `839px`.
- **Body text** (`.siteorigin-widget-tinymce p`): `16px / 24px / 400`, color `#161718` -> `--skoda-ink`,
  paragraph `margin-bottom: 20px` (· ST · 1280). Same body scale as the story shell.
- **Headline widget** (`.sow-headline`): rendered `<h3>` at `24px / 24px / 400` on the sample (weight is
  light, not the 600 of section headings, an author-chosen widget) (· ST · 1280). Confirm the full
  heading ramp (h2/h3) across more instances.
- **Inline media:** images/embeds inside tinymce widgets use the shared `.ratio-container` +
  colorbox/embed systems, see [`gallery-lightbox.md`](gallery-lightbox.md) / [`embeds.md`](embeds.md).

> Pending capture: the h2 ramp, list/blockquote/table styling, and the exact row gutter + vertical
> rhythm between stacked `.panel-grid` rows across 500/768/1024/1280.

## 4. Responsive behavior

- Multi-column Page-Builder rows collapse to a single column on narrow viewports (SiteOrigin's default
  mobile stacking). Exact breakpoint to confirm live (SiteOrigin default is ~780px, matches the
  `template-page-base` / press-kit collapse observed elsewhere).
- Body type does not shrink (source keeps `16/24` at every band, consistent with the other specs).

## 5. Interaction states

- Static content. Interactivity comes only from embedded components (links, inline galleries, embeds).

## 6. Accessibility

- Heading order is **author-driven and often wrong** (widgets let authors pick any level, the sample
  uses `<h3>` with no `<h2>` above it). The flatten MUST re-derive a correct heading hierarchy (single
  page `<h1>` from the title, body headings demoted/promoted into order).
- Strip presentational wrappers; keep semantic elements (`<p>`, `<ul>`, `<a>`, `<figure>`).
- Preserve link text + image `alt`.

## 7. EDS target

**Import-time flatten, no runtime block.** The parser (see [`../architecture/IMPORT-PIPELINE.md`](../architecture/IMPORT-PIPELINE.md))
walks the SiteOrigin tree and emits clean EDS content:

- Each `.panel-grid` row -> a section (`---`) when it carries a distinct band/background; otherwise its
  content merges into the running flow.
- A multi-column row (`.panel-grid-cell` > 1) -> a `columns` block (or section columns) ONLY when the
  author genuinely placed content side by side; single-column rows -> plain default content.
- `.siteorigin-widget-tinymce` -> default content (unwrap to `<p>`/`<ul>`/`<a>`, keep inline media as
  authored, route images through `optimizeImageInPlace`).
- `.sow-headline` -> a heading at the **re-derived** correct level (not the author's arbitrary tag).
- Image widget -> `<picture>`; inline gallery/embed -> the `gallery` / `embed` handling.
- Drop all `panel-grid/cell/panel/so-widget` wrapper divs and SiteOrigin classes.

This is the mechanism SKODA-801 depends on; SKODA-814 owns the region's measured contract + the
flatten rules, SKODA-801 owns applying it to the story corpus at scale.

## 8. Open decisions + recommended default

- **When is a 2-col row a real `columns` block vs an authoring accident?** Recommend: treat as columns
  only if both cells have substantive content; a cell that is just a spacer/empty collapses away.
  (Assumption to confirm against a sample of multi-col stories.)
- **Section boundaries:** recommend deriving a new EDS section only on a background/band change or an
  explicit divider, not per SiteOrigin row (rows are a layout artifact, not semantic). Confirm.
- **No new tokens** expected, reuse the story-detail body ramp (`16/24/400`, `--skoda-ink`, `mb 20px`).

## 9. Pixel-perfect acceptance criteria

- [ ] Body text: flattened body renders `16px / 24px / 400` `#161718`, paragraph `margin-bottom 20px`.
- [ ] Column split: a source 2-col row renders as a `columns` block matching the `~50/50` split at
      `>=768`, stacked `<768`; a 1-col row is plain default content (no stray wrapper).
- [ ] Heading order: exactly one `<h1>` (page title); body headings form a valid, gap-free order (fixes
      the source's author-chosen `<h3>`-without-`<h2>`).
- [ ] No SiteOrigin residue: output has no `panel-grid`/`so-panel`/`siteorigin-widget-*` classes or
      empty wrapper `<div>`s.
- [ ] Inline media: images/galleries/embeds inside the body keep their `.ratio-container` ratio and
      route through the `gallery` / `embed` handling.
- [ ] Visual diff vs source at 1280/768/mobile <= 2% per-pixel (excluding image content).

## 10. Reference screenshots

`assets/siteorigin-body/`: capture pending (story body at 1280/768/mobile + a 2-column row instance +
a model-description instance).
