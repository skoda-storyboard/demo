# SKODA-801, Story template: SiteOrigin Page-Builder flattening parser
- **Epic:** E08, Editorial at Scale
- **Type:** import
- **Phase:** B (work-grouping) · **Milestone:** M1 (15 Oct demo, blog/story pages are a demo deliverable per deck §3/§7; reduced-fidelity slice)
- **Estimate:** **8 SP → trending to the low end (~5–6 SP)** · AI-assisted **3–5d** / manual **6–10d** *(planning estimate, not a quote)*, **re-pointed down from 13 SP** and **confirmed by the 100% EN+CS widget census** (`SKODA-STORY-WIDGET-CENSUS.md`, 2,773 stories, 0 errors): **17 canonical widget types**, but **98.7% of stories / 99.85% of instances** covered by simple mapped widgets; only **1.3% (36 stories)** need special handling; **widget set is perfectly locale-invariant (EN = CS)**. Reduced-fidelity M1 slice ≈ 2–3 SP. Estimate holds, extra widgets are simple, specials are deferred.

> **Build-confirmed (2026-09-10).** The shipped EN homepage + story/rails slice exercised the reduced-fidelity path: for those stories the "flatten" was a **light cleanup transformer + one canonical Metadata block**, and the `sow-editor` + carousel model held, now **browser-verified**, not merely structural. This **retires the `[RUNTIME-UNCONFIRMED]` caveat for the common story/rails shape** and points the estimate to the low end. The **full-corpus long tail remains M2 work** (multi-column preservation, the 36 `has_rare=yes` specials, 208-widget outliers) and stays `[RUNTIME-UNCONFIRMED]` until run at scale. Effort freed here is re-allocated to the metadata-normalization + media-conditioning work surfaced in the build (see SKODA-401, E05, delivery plan §8/§9).

## Summary
Build the import parser that flattens SiteOrigin Page Builder story layouts into clean DA sections + blocks. This is the hardest single parser in the migration and the highest-effort ticket in the whole program.

## UI Specification
**Render target for the flattened output: [`docs/ui-specs/story-detail.md`](../../ui-specs/story-detail.md)** (captured via Chrome DevTools). The flatten's `sow-editor` rich-text output must hit the measured prose scale: content column `.content` `66.66%` (~`819px`), paragraphs `16/24` wt400 with `20px` gaps, `h2` `40/45` wt300 (→`24px` mobile), `h3` `24/27.6` wt300, lists `list-style:none` padding `1.5em`. Widget→block mappings should target the atomic specs (`gallery-lightbox.md`, `embeds.md`, `card-teaser.md`, `carousel-rails.md`). New token candidate: `--prose-paragraph-gap:20px` (+ optional `--prose-measure`).

**Scope (2026-09-15):** this parser is **story-only** (Page Builder is story-only). The **press-release** template + parser is separate, **SKODA-607** / [`template-press-release.md`](../../ui-specs/template-press-release.md); the full page-type map is [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

## Description
Story pages (~37.5% of the corpus; 1,312 EN + 1,461 CS scanned, 5,282 all-lang) are mostly not linear editorial HTML, their bodies are SiteOrigin Page Builder trees: `panel-grid` → `panel-row` → `panel-grid-cell` → `so-widget-*`. Census reality: **avg ~13 widgets/story, but with outliers up to 208 widgets / 293 panel-grids**, the parser must be robust to very large trees. The meaning lives in the nesting, not in class names, so a signature/linear crawl cannot handle them (this was the single biggest miss in discovery, caught only in the adversarial pass). Page Builder is **story-only**, press releases, Škodapedia, and the homepage are not built this way, which localizes the risk to this one template.

**Non-Page-Builder story variant (census finding):** **101 of 2,773 EN+CS stories (3.6%) are NOT Page Builder**, plain/linear `post`-type stories. The importer needs a **linear-story fallback**: detect the absence of the SiteOrigin tree and route those to the plain-post path (no flatten needed).

The parser must walk the builder tree and map it to the EDS authoring model: each `so-panel` / panel-row → a DA section; `sow-editor` / `tinymce` rich-text widgets → default content; `skoda-carousel-widget` / `skoda-offset` and similar structured widgets → the corresponding block table (cards/teaser, gallery, carousel, embed). Must be content-driven detection only (no URL/positional/template-order assumptions per repo import rules), and carry image `alt` + `data-caption` into figure captions (53% of captions live in `data-caption`).

## What "flattening" means (concrete)

The story body is a **nested visual-builder tree**, not linear content. The meaning lives in the nesting + widget types; the `panel-*` wrappers are pure layout scaffolding with no editorial meaning.

**Source tree (conceptual):**
```
panel-grid                         ← whole layout
 └─ panel-row                      ← a horizontal row  → EDS section break (---)
     ├─ panel-grid-cell (column)
     │    └─ so-widget
     │         • sow-editor        → rich text (h/p/ul)
     │         • skoda-carousel    → image carousel
     │         • skoda-offset      → spacer
     └─ panel-grid-cell (column)
          └─ so-widget …
```

**Flattening = strip the scaffolding, keep the content, map each widget to its EDS equivalent, turn rows into sections.**

**Widget → EDS mapping table** (17 canonical types; % = share of 35,159 instances, 100% EN+CS census):
| SiteOrigin widget | Share | EDS output |
|---|--:|---|
| `sow-editor` / `tinymce` (rich text) | 83.5% | **default content** (h/p/ul; inline images + inline embeds pass through as-is) |
| `skoda-offset` (spacer) | 8.2% | **dropped**, or a section break |
| `skoda-carousel-widget` | 4.0% | **routed BY CONTENT — CORRECTED 2026-09-24 (build):** the corpus uses this widget **both ways**, so the parser routes on content, not name: **link-free** items (the article's own photo sets — images + captions, no links) → **Gallery** (SKODA-203 / STO-D04, same as `sow-slider`); **linked** items ("you might also like" teasers) → **Cards** (SKODA-201). *(Original census assumed teasers-only; build-inspected stories were image-only, the 5-story POC saw teasers — both real. The sidebar `.related` teaser rail is separately handled by `skoda-story-aside` → Cards.)* See census §7a. |
| `sow-slider` | 1.5% | **image slider → Carousel/Gallery block** |
| `skoda-quote` | 1.1% | **pull-quote → `<blockquote>` / small quote block** |
| `skoda-captioned-image` *(census, 45 stories)* | 0.7% | **image + caption → figure / image block** |
| `sow-button` (+ `sow-button-wire` variants) *(census)* | 0.3% | **button / CTA** (EDS button-decoration: `<p><strong><a>`) |
| `skoda-image-box` *(census, 16 stories)* | 0.2% | **image / small card block** |
| `sow-image` *(census)* | 0.1% | **image** (lift out of `<p>`) |
| `ys-milestones` *(census, 18 stories)* | 0.1% | **timeline → new block, or omit for demo** |
| `ys-embed-share` *(census, 12 stories)* | 0.1% | **social-share widget → chrome/omit** (not body content) |
| `iframe-embed` *(census)* | 0.01% | **embed block** (preserve `dnt=1`) |
| `highlights` / `ys-so-widget-highlights` *(census)* | 0.02% | small block / omit |
| `skoda-newsletter-widget` *(census, 2 stories)* | 0.01% | newsletter (chrome/service, see D4) |
| **`k2tools-charge-map`** *(census, 30 stories)* | 0.1% | **hosted interactive charging map → external embed; likely DEFER** (external Škoda `sdrive`/charging app) |
| **`k2tools-charging-calculator`** *(census, 2 stories)* | 0.01% | **hosted interactive calculator → external embed; likely DEFER** |
| `siteorigin-panels-builder` (nested-builder edge) *(census, 6 stories)* | 0.02% | **skip + log** (safety net) |
| inline `<img>` (inside `sow-editor`) |, | lifted to **direct child of `<div>`** (so EDS wraps in `<picture>`); carry `alt` + `data-caption` |
| `panel-row` boundary |, | **section break (`---`)**, M1: linearize multi-column rows |

*Distribution measured across the **full EN+CS corpus (2,773 stories / 35,159 instances)**, `SKODA-STORY-WIDGET-CENSUS.md`. 17 canonical types; **98.7% of stories / 99.85% of instances** covered by mapped widgets; the 3 bold "defer" widgets (charge-map, calculator, nested-builder) are the only special cases, **1.3% of stories (36)**, all enumerated in `SKODA-STORY-WIDGET-DATASET.csv` (`has_rare=yes`). **Widget set is identical in EN and CS**, the parser is locale-invariant.*

**Before → After (illustrative):**
```
BEFORE (SiteOrigin):
<div panel-grid><div panel-row>
  <div cell><div so-widget sow-editor><h2>Title</h2><p>Body…</p></div></div>
  <div cell><div so-widget skoda-carousel>…imgs…</div></div>
</div></div>

AFTER (DA/EDS):
## Title
Body…

---

| Carousel |
| -------- |
| img | img | img |
```

**Fidelity split (why this is pulled into M1):**
- **M1 / demo:** a **reduced-fidelity flatten** on the demo story set, linearize multi-column rows to single-column stacked sections, map the common widgets (`sow-editor`, carousel, gallery, embed, image). Good enough to show a real, correct blog post.
- **M2 / go-live:** the **full parser**, arbitrary nesting, multi-column layout preservation where it matters, the widget long-tail, run at scale across ~1,300 EN (5,282 all-lang) stories.
- **Prototype first:** run the flatten on **one real story before committing the M1 schedule**, this is the top unknown-unknown (odd widgets / deep nesting only surface on real content).

## Requirements / Spec
- Detect the SiteOrigin layout system from DOM structure (`so-panel`, `panel-grid`, `so-widget-*`), not from URL or page type.
- Map builder nesting → DA sections (`---`) and section metadata; map each widget type → default content or a block table.
- Widget mapping table covering at least: `sow-editor`/`tinymce` (rich text → default content), `skoda-carousel-widget` (→ carousel/cards block), `skoda-offset` (→ layout/section), gallery widgets (→ gallery block), embed widgets (→ embed block, preserve `dnt=1`).
- Preserve heading hierarchy, links/buttons, and image handling (`<img>` lifted to direct child of `<div>`; `alt` + `data-caption` carried).
- Graceful handling of unknown/empty widgets (skip cleanly, log for review; never crash).
- Descendant filtering so nested widgets inside an already-matched block are not double-parsed.
- **Linear-story fallback:** detect stories with **no SiteOrigin tree** (3.6% of corpus) and route them to the plain-post parser, no flatten attempted.
- **Large-tree robustness:** handle outliers (up to **208 widgets / 293 panel-grids** per story) without perf/recursion failure; M1 reduced-fidelity may linearize aggressively.
- **Defer the 3 interactive widgets** (`k2tools-charge-map`, `k2tools-charging-calculator`, nested `siteorigin-panels-builder`), external embed or skip+log; confirm with Škoda whether to render or drop.

## Acceptance Criteria
- [x] Parser flattens a representative sample into valid DA HTML with sections + block tables, no builder markup left. *(2026-09-24: `tools/importer/parsers/story-flatten.js`; verified on epiq 13-widget, olive-oil 9-widget multi-column, + linear octavia — 0 builder markup remaining in every output.)*
- [x] Rich-text, carousel, gallery, and embed widgets each map to the correct DA output. *(sow-editor → default content; `sow-slider` → Gallery; `skoda-carousel-widget` routed by content — link-free → Gallery, linked → Cards; sidebar related teasers → Cards; embeds pass through. `dnt=1`/nocookie embed markup preserved as-is from the source `.page-embed`.)*
- [x] Image captions from `data-caption` appear as figure captions; `alt` preserved. *(captioned-image/image-box → `<figure>`+`<figcaption>` from `data-caption`, alt kept.)*
- [x] Detection is purely content/DOM-driven (`.panel-layout`/`.panel-grid`/`.so-panel`/`so-widget-*`), no URL/positional/template-order assumptions.
- [x] Unknown widget types are skipped without failing the import and are logged. *(`unknown` salvages rich text then skips + logs; `console.warn` summary emitted.)*
- [x] Output passes lint and renders correctly in local preview vs. the source story. *(eslint + stylelint clean; browser-verified two-column render at 1280 = 816/408px and stacked at 500px, aside below body; prose scale h2 40/45→28, p 16/24.)*
- [x] **M1 acceptance (reduced-fidelity):** demo story set flattens with the common widgets mapped, a correct, presentable blog post, **now upgraded**: the primary column keeps full widget fidelity + a real two-column body+aside layout (grid-on-main). **M2 (full):** arbitrary nesting + widget long-tail at scale — still to run over the whole corpus.
- [x] Parser prototyped on ≥1 real story **before** committing (top unknown-unknown). *(prototyped on epiq + olive-oil raw HTML; 0 unmapped widgets against the census set.)*
- [x] **Non-Page-Builder stories** (no SiteOrigin tree, 3.6%) are detected and routed to the plain-post path, not force-flattened. *(verified on `/en/models/the-upgraded-skoda-octavia/`: no flatten log, clean default content.)*
- [x] **Robust to large trees**, the 208-widget / 293-panel-grid outliers parse without failure. *(unit test: 293-grid synthetic tree flattens in ~210–310ms, 0 builder markup.)*
- [ ] Validated against the **full census test corpus**: the 36 `has_rare=yes` stories + the 208-widget outlier + a non-Page-Builder story (`SKODA-STORY-WIDGET-DATASET.csv`). *(unit-tested synthetically + 3 real stories incl. one non-PB; the full 36-story `has_rare` at-scale run remains M2.)*

**Aside/two-column layout (design as-built):** the body flattens to a single primary-column section (`Style: body-column`); the `.sidebar` is rebuilt (not dropped) into a `Style: sidebar` section (Cards + Tags) by `skoda-story-aside.js`; a story-scoped CSS grid on `main` (`styles.css`, `body.story`, ≥768) places them 66.66/33.33 and stacks them mobile-first. NB the vendored `decorateSections` does not apply Section Metadata `Style` classes, so a story-scoped `decorateStorySections` hook in `scripts.js` applies them (and consumes the section-metadata div so it is not mis-decorated as a block). Deviation from the ticket's "panel-row → `---`": the render-target spec models the body as one column beside the aside, so panel-rows linearize within the body rather than emit per-row section breaks; genuine multi-column panel-grids are preserved as a Columns block.

## Dependencies
- Upstream: SKODA-601 (import infra: parsers/transformers), SKODA-603 (pilot page set validated)
- Block targets the flatten emits (render inert until built): **SKODA-203** (Gallery + lightbox — `skoda-carousel-widget`/`sow-slider` map here), **SKODA-201** (Cards — the sidebar related rail via `skoda-story-aside`)
- Downstream: **SKODA-604** (full-fidelity restore extends this path — in-body `.sb-gallery`/colorbox galleries + Media Box that this flatten defers), SKODA-802 (remaining templates), SKODA-803 (bulk import automation), **SKODA-814** (generalize the flatten to model/Page bodies at M2)

## Risks / Flags
- **R-A2 / R11 (Medium):** the **100% EN+CS census** (`SKODA-STORY-WIDGET-CENSUS.md`, 2,773 stories, 0 errors) makes the widget universe **known, not estimated**, 17 types, 98.7% of stories / 99.85% of instances covered by simple mapped widgets; residual is a **known, enumerated 36-story special set**. Widget set is **locale-invariant (EN = CS)** → CS adds volume, not parser complexity.
- **Non-PB variant (new):** 3.6% of stories are linear (no builder) → needs the fallback path (now in spec).
- **Large-tree outliers (new):** up to 208 widgets / 293 panel-grids → perf/recursion robustness required.
- **3 interactive widgets** (`charge-map`, `charging-calculator`, nested `panels-builder`) → defer/embed; confirm render-vs-drop with Škoda.
- Rendered SiteOrigin DOM (post-JS) may differ from raw panel markup, **the common story/rails shape is now browser-confirmed (2026-09-10)**; the residual `[RUNTIME-UNCONFIRMED]` is scoped to the **full-corpus long tail** (multi-column layouts, the 36 specials, 208-widget outliers), validated during the M2 at-scale run.
