# Component Spec: SiteOrigin Body (Page-Builder rich-text region)

Status: **MEASURED** (2026-10-28, SKODA-814).
- **Bands:** origin vs `main` preview at 375 / 768 / 780 / 781 / 992 / 1080 / 1280, on three instances: a story, a
  model description and a generic Page.
- **Checked:** the widget census on 53 source pages, and the contract check on 51 + 133 imported pages.
- **Earlier:** 2026-09-15, structure and core type, one story at 1280.

Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

The 2026-09-15 block recount ([`../analysis/SKODA-BLOCK-RECOUNT.md`](../analysis/SKODA-BLOCK-RECOUNT.md) §3/§6)
surfaced this as the most-rendered content region with no dedicated spec: **1,614 pages** (1,568 STO / 46 MR).

## 1. Identity

- **Component:** the SiteOrigin Page Builder body, the author-built region of column rows holding rich-text and
  other widgets. It is the generic article body of Storyboard stories, the model page's "Model Description" and
  generic Pages.
- **EDS block(s):** none. This is **default content**, plus a `Columns` block where an author placed content side
  by side, and the widget blocks the story flatten maps (Gallery, Cards, Quote…). There is no runtime block; the
  work is import-time.
- **Client PDF IDs:** STO-D01/D02 (story body), STO-M02 (model description), part of the generic Page.
- **Ticket:** **SKODA-814**, the region's measured contract and the check that proves it. Who flattens what
  (§7):
  - SKODA-801 owns the story flatten.
  - SKODA-208 owns the model description.
  - SKODA-813 / 843 own the generic Page body.
- **Source references:**
  - Story (two-column row): `https://www.skoda-storyboard.com/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic/`
  - Story (the first sample, also the review draft `/drafts/skoda-814-siteorigin-body`):
    `https://www.skoda-storyboard.com/en/lifestyle/people/an-international-womens-day-surprise/`
  - Model description: `https://www.skoda-storyboard.com/en/skoda-model/peaq/` (see [`template-model-page.md`](template-model-page.md))
  - Generic Page: `https://www.skoda-storyboard.com/en/documents/cookies/` (see [`template-page-base.md`](template-page-base.md))
- **Top-level selectors:**
  - `.panel-layout` (the body);
  - `.panel-grid` (a row);
  - `.panel-grid-cell` (a column);
  - `.so-panel.widget_<kind>` (a widget slot);
  - `.siteorigin-widget-tinymce` / `.textwidget` (rich text).

## 2. Source anatomy

```
article … .panel-layout
└── .panel-grid            × N   (one per Page-Builder "row")
    └── .panel-grid-cell   × 1-3 (the columns of that row)
        └── .so-panel.widget_<kind>   (a widget slot)
            └── .siteorigin-widget-tinymce   (rich text: <p>, <h2>–<h4>, <ul>/<ol>, <table>, <a>, inline <img>)
```

**Widget census (2026-10-28, `node tools/importer/check-siteorigin-body.mjs --census <url lists>`, 53 source pages):**

| Pages | Rows (`.panel-grid`) | Side-by-side rows | Widget kinds in the body |
|---|---|---|---|
| 23 model pages | 1–2 each | **0** | `sow-editor` (the description), `ys-so-widget-highlights`, `ys-so-widget-techdata`, `skoda-offset` |
| 17 generic Pages (`urls-page-base.txt`) | 0–3 each (6 have no Page-Builder body) | **0** | `sow-editor`, `skoda-offset` |
| 12 stories (`urls-story-detail.txt` + the first sample) | 1–7 each | 2 | `sow-editor`, `skoda-offset`, `skoda-carousel-widget` |
| Sustainable Offices (own importer, SKODA-843) | 49 | 26 | `sow-editor`, `skoda-offset` (its own layout) |

- **There is no `sow-headline` (headline) widget on any of these pages.** The 2026-09-15 draft's "headline
  widget" was a heading inside a rich-text editor. Headings come from the editors.
- **The full story corpus** uses the 17 widget types in [`../analysis/SKODA-STORY-WIDGET-CENSUS.md`](../analysis/SKODA-STORY-WIDGET-CENSUS.md).
- **Heading levels** are author-chosen. Every page has one h1 (the title). **7 of the 12 stories** and one generic
  Page (the consent page) skip a level on origin, e.g. h1 → h3.

**Libraries / patterns retired:** SiteOrigin Page Builder (`siteorigin-panels`), its widget CSS/JS, jQuery. The
`panel-grid/cell/panel` wrappers carry no meaning and are flattened away.

## 3. Measured visual spec

Measured on 2026-10-28 with Playwright (viewport height 900, DPR 1, fonts loaded), origin vs `main` preview. Each
element was matched by its text on both sides. **Every value below is equal on both** unless the table says
otherwise. Colour `rgb(22, 23, 24)` is `#161718` → `--skoda-ink`. Margins are top | bottom.

| Element | 375 | 768 | 780 | 781 | 992 | 1080 | 1280 |
|---|---|---|---|---|---|---|---|
| **Body text** `p` (all three) | 16 / 24 / 400, `0 | 20px` | same | same | same | same | same | same |
| Story h2 | 24 / 27 / 300, `0 | 16px` | 24 / 27 / 300 | **40 / 45 / 300** | 40 / 45 / 300 | same | same | same |
| Model h2 ("Model Description") | 40 / 45 / 300, `0 | 40px` | same | same | same | same | same | same |
| Generic Page h2 | 40 / 45 / 300, `0 | 16px` | same | same | same | same | same | same |
| Generic Page h3 | 24 / 27.6 / 300, `0 | 16px` | same | same | same | same | same | same |
| Generic Page `li` | 16 / 24 / 400, `0 | 16px`, 24px indent | same | same | same | same | same | same |
| Story text column x / width | 10 / 355 | 10 / 498.7 | 10 / 506.7 | 10 / 507.3 | 10 / 648 | 10 / 706.7 | 26 / 818.7 |
| Story 2-col row, first cell's text width | 355 (stacked) | 498.7 (stacked) | 506.7 (stacked) | **296.3** (side by side) | 380.7 | 415.9 | 483 (origin) / 483.2 |
| Model description x / width | 10 / 355 | 10 / 748 | 10 / 760 | **20 / 741 vs 10 / 761** | 182 / 628 | 196.7 / 686.7 | 240.7 / 798.7 |
| Generic Page text x / width | 20 / 335 | 20 / 728 | 20 / 740 | 30 / 721 | 30 / 932 | 30 / 1020 | 46 / 1188 |

- **One difference:** the model description's inset is 10px instead of origin's 20px **from 781 to 991**
  (781 / 800 / 860 / 900 / 960 / 991 measured). It is the model template's CSS, filed as **#538**. The two-column
  widths differ by ≤ 0.2px (rounding).
- **Vertical rhythm:** paragraph to paragraph 20px, heading to text 16px (model description 40px), list item to
  item 16px, on both.
- **Inline media:** images, galleries and embeds inside editors use the shared systems; see
  [`gallery-lightbox.md`](gallery-lightbox.md) / [`embeds.md`](embeds.md).

## 4. Responsive behavior

- **Two-column rows:** they stack at **≤ 780px** and sit side by side from **781px** (SiteOrigin's collapse; the
  same edge as `Columns` `split`, SKODA-225).
- **Story h2:** steps from 24/27 to 40/45 above 768px (769–780 is already 40/45 while the row is still stacked).
  Model and generic Page h2 are 40/45 at every width.
- **Insets step at 781:** the generic Page from 20 to 30px; the model description from 10 to 20px on origin
  (#538). Story text keeps 10px until the 1280 cap.
- **Body type never shrinks:** `16/24` at every band.

## 5. Interaction states

- Static content. Interactivity comes only from embedded components (links, inline galleries, embeds).

## 6. Accessibility

- **Heading levels are kept as the source has them** (SKODA-814 decision, 2026-10-28, for a human to confirm in
  the PR).
  - The import does not promote or demote headings, even where the source skips a level (h1 → h3 on 7 of the 12
    sample stories).
  - Reasons: the review rule treats an outline that differs from origin as a defect, and the story h2 and h3 are
    styled differently, so promoting an h3 would change its size.
  - The guarantees are **exactly one h1** (the title) and **every body heading at its source level**.
- Strip presentational wrappers; keep the semantic elements (`<p>`, `<ul>`, `<a>`, `<figure>`, `<table>`).
- Preserve link text and image `alt`.

## 7. EDS target

**Import-time flatten, no runtime block.** Each template's importer flattens its own body. The shared contract is
§3 / §9, proved by one check.

| Instance | Importer | How the body is flattened |
|---|---|---|
| Story | `import-story-detail.js` → `parsers/story-flatten.js` (SKODA-801) | Widget map (§2 census). Side-by-side rows → `Columns` (`split-NN`, `centered` variants). One `body-column` section, plus highlight bands. |
| Model description | `import-model-page.js` (SKODA-208) | The `.so-panel.widget_sow-editor` is default content in its own section; key facts and tech data have their own parsers. |
| Generic Page | `import-page-base.js` + `transformers/skoda-page-rows.js` (SKODA-813 / 843) | Default content, **one `page-body` section per SiteOrigin row** (half-width rows `page-body, half`). Spacers, tables and buttons via the 843 transformers. |

**Proof:** `tools/importer/check-siteorigin-body.mjs` (unit tests in `check-siteorigin-body.test.mjs`). Per page, it
checks the source's editors against the output `.plain.html`:
- every text block is present;
- every body heading is at its source level;
- no SiteOrigin class is left;
- there is exactly one h1.

It also lists any widget kind outside the known map. Run it after every import, and as the gate of the story
corpus run (SKODA-801b):

```bash
node tools/importer/check-siteorigin-body.mjs tools/importer/urls-model-page.txt tools/importer/urls-page-base.txt
node tools/importer/check-siteorigin-body.mjs --local=content <urls>   # a local import, before the push
```

**Result on `main` (2026-10-28):**
- **51 / 51** pass (23 model pages, 17 generic Pages, 11 stories).
- Of the 133 stories in the preview index, 129 pass and 1 is a demo-only page with no source. The other 3 lose
  text in the story importer:
  - #536: the bold name after a portrait image (2 pages);
  - #537: dash lines turned into a list with literal backslashes (1 page).

## 8. Decisions

- **Heading levels: keep the source's (§6).** A human confirms this in the SKODA-814 PR.
- **No headline-widget mapping:** the census found none. A `sow-headline` found later is reported by the check as
  a widget outside the map, and gets mapped then.
- **Section boundaries are per template, as built and measured:**
  - stories: one section, plus highlight bands;
  - generic Pages: one section per SiteOrigin row (813 / 843 matched origin's row spacing that way);
  - the model description: its own section.

  The 2026-09-15 recommendation, "a new section only on a band change", is not applied to the Page body,
  because its row spacing depends on the per-row sections.
- **Two-column rows:** the story flatten emits `Columns` when more than one cell has widget output (one cell left
  → linear flow). Only stories and Sustainable Offices have such rows in the census. The draft's "both cells
  substantive" rule stays a check for the corpus run (SKODA-801b), not a code change here.
- **No new tokens.** The values above are the story / page / model tokens already on `main`.

## 9. Pixel-perfect acceptance criteria

- [x] **Body text:** `16px / 24px / 400` `#161718`, `margin-bottom 20px`, equal to origin at all 7 widths on all
      three instances (§3).
- [x] **Column split:** a source two-column row → `Columns`, side by side ≥ 781 and stacked ≤ 780, with the cell
      text width equal to origin (≤ 0.2px). A one-column row is plain default content.
- [x] **Headings:** exactly one `<h1>`, and every body heading at its source level. 51 / 51 pages pass
      (`check-siteorigin-body.mjs`). Re-derivation is not done (§6).
- [x] **No SiteOrigin residue:** no `panel-grid` / `so-panel` / `siteorigin-*` / `so-widget-*` class in any checked
      output.
- [ ] **Text complete:** every source text block is in the output. This fails on 3 of 133 stories, all story
      importer defects (#536, #537).
- [ ] **Inline-media widths:** galleries and embeds route through `gallery` / `embed` (SKODA-216 / 204). Their
      own specs cover the ratios, so they weren't re-measured here.
- [ ] **Model description inset at 781–991:** 10 vs 20px (#538).
- [ ] **Visual diff:** ≤ 2% per pixel at 1280 / 768 / mobile, excluding images. Not run; the measured boxes
      above are equal.

## 10. Reference screenshots

None committed. The measured values in §3 are the evidence (review rule: a screenshot never replaces a
measurement). The review draft `/drafts/skoda-814-siteorigin-body` shows the first sample story as the importer
writes it.
