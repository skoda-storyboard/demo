# SKODA-805, Press Kit template + structured narrative sections
- **Epic:** E08, Editorial at Scale
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live). The **M1 slices** are split out; see the update below.
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*
- **Status (2026-10-26):** 🟡 **Phase A in review** (branch `skoda-805-phase-a`): the template is measured against the
  source on every kit shape, the ACs are reconciled with the hub + chapter model (D-1 = A), the open decisions are
  recorded, and the Chapters bar now matches the source. **No new importer is needed** (see "Phase A" below). What's
  left in the press-kit area is volume (SKODA-847), the `template-press-release` importer (SKODA-836, which also
  covers six `layout-article` kits) and the SiteOrigin body (SKODA-814).

> **Update (2026-09-24, M1 gap review, [`SKODA-M1-GAP-REVIEW.md`](../../reviews/SKODA-M1-GAP-REVIEW.md)).**
>
> The 43-URL M1 set contains **4 press kits**, so M1 slices were split out:
>
> | Slice | Page(s) | Scope | Size |
> |---|---|---|---|
> | **SKODA-805a** | 3 tiles hubs: Peaq-2, Epiq-2, Motorsport | hub + importer | 3 SP |
> | **SKODA-805b** | the hubs' 50 child pages | import, or link out: decision D-1 | Could tier |
> | **SKODA-805c** | `skoda-peaq-first-glimpse-…` | `press_kit-template-default` article + accordion | 3 SP |
>
> The full structured-narrative template, SKODA-806/807/808, and bulk import (803) remain M2.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/press-kit-template.md`](../../ui-specs/press-kit-template.md)** (captured via Chrome DevTools on the live Peaq kit `/en/press-kits/skoda-peaq-press-kit/`). Read it before implementing. Page-type context: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture (resolves §11.8):
- Kit is a **"tiles" template**: overlay hero (`16:9`, `61.8vh`, title `48px`/wt300 → `28px` mobile, reuse `hero.md` landing variant) over a **grid of chapter tiles**, each linking to a **story-detail-style two-column sub-page** (`.column-primary` 66.66%/~832px + secondary 33.33%), with a **sticky "Chapters" sub-nav (`44px`)**.
- Section order confirmed: Introduction → Exterior → Interior → Battery/powertrain → Safety → Connectivity, then variant, FAQ, media groups.
- **Decision resolved → optional/conditional (superset):** each chapter is an independently authored tile/sub-page (distinct post IDs), so omission is native, not a special case.
- Sub-page prose matches `story-detail.md` exactly (p `16/24`, `20px` gap), no delta.
- New tokens: `--perex-font-size:20px`, `--chapter-nav-height:44px`.

## Summary
Build the Press Kit page structure and its fixed narrative-section sequence (Introduction → Exterior → Interior → Battery/powertrain → Safety & assistance → Connectivity), plus the press-kit header. Press kits are `press_release` items surfaced via the shared listing filter (not a separate CPT), but the *detail* page is a distinct, more-structured template than a Story.

## Description
Confirmed on the live Peaq press kit (requirements §11.8): the Press Kit detail page presents a **fixed sequence of named narrative sections**, each a heading + rich text + imagery, in contrast to the freely-orderable component model used for Stories (SKODA-801). This ticket delivers:

- **Press Kit Header** (MR-PK01): title, imagery, and date/model/category metadata where applicable.
- **Structured Narrative** (MR-PK02): the ordered section set as a reusable page structure so an editor composes a kit without page-specific development.
- The **press-kit parser** (feeds SKODA-803 bulk import): detect press-kit source pages, map narrative headings → DA sections, reduce chrome, emit one canonical Metadata block (template=press-kit, model, bodywork, category, date).

**Key modelling decision (open, §11.8):** is the section sequence *fixed across every kit* or does it vary by product type (a combustion model has no battery/powertrain section)? This determines whether the sections are **required fields** or **optional/conditional**. Default assumption pending confirmation: sections are optional/conditional (author includes the ones that apply), which is the safer superset.

## Requirements / Spec
- Press-kit page structure = ordered default-content sections keyed by heading; no bespoke per-kit code.
- Header block reuses the hero/`hero-image` pattern where applicable; carries model/bodywork/category/date metadata.
- Parser: content-driven detection; maps `press_kit`-flavoured source into narrative sections + Metadata; no new markup invented.
- Section set authored as optional/conditional (superset) until §11.8 fixed-vs-conditional is confirmed.
- Nests cleanly with the grouped-media areas (SKODA-806), variant subsections (SKODA-808), and FAQ (SKODA-807).

## Acceptance Criteria
Measurable gates live in [`press-kit-template.md` §9](../../ui-specs/press-kit-template.md); summary. **Rewritten
2026-10-26 for the hub + chapter-page model** (D-1 = A, decision below) and measured source vs EDS (preview) at
375 / 768 / 992 / 1080 / 1280 / 1440 (hubs: Peaq-2, Motorsport; chapters: one of each of the 4 kits):
- [x] **Hub:** overlay hero + chapter-tile grid. Hero 1280×556.2 / 768×572.2 / 375×431.7, title 48 / 300 white
      (28 below 1280, ink at 375), perex 20 / 600: equal to the source. Tiles 13 (Peaq-2) / 24 (Motorsport) in source
      order, boxes equal (2:1 feature tiles, then 1:1; 1-up at 375). *(805a, 828 F1, 221.)*
- [x] **Chapter pages:** story-detail-style two-column sub-pages, one per tile (805b), with the source's **Chapters
      bar** (fixed here, see below): "← Introduction" (the hub) left, "Chapters ⌄" right, 20 / 22.5 / 500, sticky,
      `nav` labelled "Chapters" with a `button aria-expanded`; Escape closes and returns focus. Stuck at the top it
      is the source's fixed bar: a 76.3 white band, text 8px lower, the menu at y 76.3 (PR #503 review, measured
      2026-10-27 at 1280 / 375 on all 4 kits, menu open and closed).
- [x] **Narrative order** follows the source: the Peaq-2 outline is H1 → Introduction → Exterior → Interior →
      Battery and powertrain variants → Safety and assistance systems → Connectivity → Sportline → FAQ → Texts →
      Infographics → Technical data → Images → Videos, equal to the source.
- [x] **Chapters are optional** (decision below): each is its own authored page and tile, so a kit carries only its
      own (Motorsport's 23 and Classic Days' 30 are different sets). Tile counts equal the source on every hub; there
      is no empty tile or heading.
- [x] **Chapter prose** matches the story scale: p 16 / 24 / 400 `#161718`, 20px gap; h1 26 / 32.5 / 600 (28 / 35
      below 1280), and the h1 → body gap (16 / 18) equal to the source.
- [x] **Parser output** matches the source order and content: tiles, chapter labels and section order equal on all
      4 kits.
- [x] **Metadata:** `template=press_kit` (hubs) / `press_kit_chapter`, `category=press-kits`, `date`, `model`,
      `bodywork` + facets from the source (e.g. Peaq-2: `peaq`, `suv`, 2026-09-21), so kits list in Press Kits and
      on the model pages' "Press Kits" rails.
- [x] **Measured geometry replaces the ≤ 2% pixel diff** (decision below): every value above, plus the Chapters
      bar table under "Phase A".
- **Open, not blocking:** 39 chapter pages still carry an H2 Media Box heading, where the source and the current
  importer have an H3 (stale content, [#498](https://github.com/skoda-storyboard/demo/issues/498), next content wave).

## Dependencies
- Upstream: SKODA-801 (import infra + parser conventions), SKODA-202 (hero), SKODA-402 (press-kit listing filter view, MR-H06)
- Downstream: SKODA-803 (bulk import at scale), SKODA-806/807/808 (compose into this template), SKODA-1001 (per-locale trees)

## Risks / Flags
- ~~**Fixed-vs-conditional sections (🟡, §11.8)**~~ Decided 2026-10-26: optional (below).
- ~~No live press-kit detail page has been reviewed~~ Resolved: all 80 EN top-level kits were classified on the
  source, and every EDS kit shape was measured (Phase A).
- Ties to the DA-vs-Universal-Editor authoring-model decision (D13). The project authors in DA; nothing here
  needs UE.

## Decisions (2026-10-26, confirmed by the ticket owner, @vijayr-adobe)
1. **Chapters are optional / conditional.** A kit carries the chapters that apply, in the source order; there is no
   fixed set (§11.8).
2. **The header shows title + perex only**, as the source. Date / model / category stay metadata (feed facets).
3. **A kit is a hub page plus one page per chapter**, as the source (D-1 = A, 2026-09-28), not one stacked page.
   The spec's single-page recommendation (§7 / §8) is superseded.
4. **Measured geometry replaces the ≤ 2% per-pixel visual diff** (review evidence is measured values, as SKODA-209).

## Phase A (2026-10-26, branch `skoda-805-phase-a`)
**What the press-kit corpus is.** The source has **80 EN top-level kits**: 46 `default`, 22
`template-press-release`, 12 `template-layout-article` (body classes; the SKODA-836 survey said 49 / 22 / 12). The
demo index holds 55 kits and 79 chapter pages, in these shapes:

| EDS shape | Kits | State |
|---|---|---|
| Tiles hub + all chapters | 4: Peaq-2, Epiq-2, Motorsport, Classic Days | complete; measured equal (above) |
| Tiles hub without chapters | 39 | the 489 tile links go to the live chapters (link policy D-3 b); importing them is volume, SKODA-847 |
| Single article (805c shape) | 6: first-glimpse, Epiq preview, Elroq, Fabia 130, Enyaq RS Race, … | 805c / 807 |
| `template-press-release` (flattened / tags only) | 2: RS 245, Octavia RS | SKODA-836 |
| `template-layout-article`, flattened by page-base | 4: Fabia update, Geneva 2018, Paris 2018, Kodiaq RS | text and images present (e.g. Paris 2018: 2,425 / 13 source, 2,159 / 13 EDS) |

**The 12 `template-layout-article` kits are two different layouts, and neither needs a new 805 importer:**
- **Shape A, long article (6):** the press-release DOM (`header h1` → `.columns` primary + secondary → Media Box
  band), identical to SKODA-836's `template-press-release` kits; only the body class differs. Handed to 836, with the
  suggestion to detect by structure, not body class
  ([#280 comment](https://github.com/skoda-storyboard/demo/issues/280#issuecomment-6415612879)): Superb new-era,
  Fabia R5, Kodiaq Paris 2016, New Superb, Karoq, Fabia Combi. None is on the demo yet.
- **Shape B, SiteOrigin panels (6):** hero + `panel-grid` rows of editor / post-teaser widgets. The page-base flatten
  already carries four of them; their layout belongs with SKODA-814.

**Chapters bar fixed (template code, `templates/press-kit`).** Measured on the source's `.chapter-nav`:

| Part | Source = EDS now |
|---|---|
| Left | "Introduction" → the kit hub, preceded by `\e003` (20px icon font) and a space; 20 / 22.5 / 500 ink, text at the bar's bottom (20px top inset). Its accessible name adds the kit ("Introduction: Škoda Peaq – Press Kit"), since the first chapter is also "Introduction" |
| Right | "Chapters", a space, 4px, `\e007` (16px); a 66 × 2 ink line under the word when open |
| Insets | 10px up to the 1248 content cap, then on the cap's edge (fluid `clamp()`, no breakpoint) |
| Menu | white, shadow `0 3px 8px rgb(0 0 0 / 15%)`, 24px under the bar, as wide as its longest title (max-content, capped at the viewport less 10px), right-aligned with the toggle (15px past it once the cap leaves room); rows of 41px, 16 / 18 / 500, inset 24 / 12; the chapters only (the hub is the bar's link) |
| Stuck (PR #503 review) | the source's `.chapter-nav.affix` (fixed, padding `8px 0 24px`): a white band 0 – 76.3 across the viewport, text at y 27 (8px lower than just before it sticks), the menu opening at y 76.3. EDS: `.is-stuck` (an IntersectionObserver) moves the row by a translate and paints the band; a layer under the row takes the clicks on its white |

- **Measured equal at 375 – 1440 on Peaq-2, Epiq-2 and Classic Days** (the toggle within 1px: icon-glyph metrics).
- **Motorsport's menu is wider than the source** (820 vs 706 at 1280): its source titles carry line breaks (`<br>`)
  that the importer flattens. That's content, so it goes with the #498 re-import, together with keeping the breaks.
- **Not copied:** the source's current chapter has no visual mark; EDS keeps only `aria-current="page"`, as before
  minus the bold.
- **Checks:** `press-kit.test.mjs` 20 / 20 (2 new); lint clean; axe on the chapter page: no new rule, open or
  closed.
- **Stuck state (review fix, 2026-10-27), source vs branch code at 1280 and 375 on all 4 kits, after a 1500px
  scroll, menu opened by a real click:** band 76.3, text y 27, menu y 76.3 on both; before the scroll still y 127
  and menu 176.3. At 1280 the white reaches x 0 – 1280 (screenshot pixels: white from the top down to the content
  at 75.5, the same as the source). It sticks at a 108px scroll and comes off again under 100, without flickering.
  Page height and the first paragraph's position don't change (4024 / 184 on Peaq Exterior), and no layout shift is
  recorded while wheel-scrolling through it (the source's affix records 0.03 – 0.05). The page doesn't get wider.
  `press-kit.test.mjs` 21 / 21 (1 new). Lint clean.

**Related Press Releases band on the resource pages (2026-10-27, reported on the Peaq FAQ).** The source ends the
resource children without a Media Box (FAQ, Texts, Infographics, Technical data; checked on Peaq) in the dark
"Related Press Releases" band; the import dropped it on every press-kit page.
- **Import** (`skoda-press-kit-default-layout.js`): a band with cards becomes a `dark, full-width, related` section
  (heading, "Based on tags" line, "All" link, `Story Rail (press)`), the press-release import's output. Chapters
  with a Media Box have no such band and are unchanged. Tests: `press-kit-default.test.mjs` +2.
- **Template** (`templates/press-kit`): the band's header, "All" pill and two-line card titles (see the UI spec
  §9); an FAQ column ends on its last question (the accordion margin under it was 20px too much; the rule
  matches the Peaq and Epiq FAQs only, of the 79 pages in the four kits). `press-kit.test.mjs` +1.
- **Measured** (source vs branch code with the re-imported FAQ, 375 / 768 / 992 / 1080 / 1280 / 1440): band box,
  header, pill, cards, dates, titles and the 16px to the footer equal; the band top equal before a scroll (the
  source's affix pulls the page up 44px after one). Next, a card and All give the same results by real click; the
  outline is equal (35 headings). The other resource pages get the band when re-imported.
