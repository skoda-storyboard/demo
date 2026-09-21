# SKODA-807, FAQ block (Press Kit)
- **Epic:** E08, Editorial at Scale
- **Type:** block
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/faq-accordion.md`](../../ui-specs/faq-accordion.md)** (captured via Chrome DevTools, FAQ opened live on the Peaq kit). Read it before implementing.

Key facts from capture (resolves §11.10):
- FAQ present: a SiteOrigin `row-toggle` accordion (28 Qs). Trigger `h2.row-title` `16px`/wt600, padding `24px`, `#e4e4e4` top+bottom dividers; plus-icon `\e027` **rotates 45° over `.2s`**; answer `display:none→block`; **multi-open**.
- Source has **no `aria-expanded` and no FAQPage schema**, both are **required fixes** (hard gates).
- **Decision → per-kit authored** (default).
- Reuse `--divider-color:#e4e4e4`.

## Summary
Build an accessible FAQ (question/answer) block for the Press Kit detail page, the first confirmed appearance of an FAQ pattern anywhere in the requirements set (§11.10). Question/answer pairs presented as a distinct, named section.

## Description
Confirmed on the live Peaq press kit (§11.10): a named FAQ section of question/answer entries. Earlier review of the Model Page template found no FAQ, so this is press-kit-specific for now. A standard collapsible Q/A block covers it.

**Open (§11.10):** is FAQ content authored **per press kit**, or drawn from a **shared, filtered pool**? Default assumption: authored per kit (simplest, matches the fixed-template model). If a shared pool is required, the source becomes the query-index (a filtered FAQ collection), note the branch but don't build it until confirmed.

## Requirements / Spec
- FAQ block = list of question/answer rows authored inline in the press-kit doc.
- Collapsible (accordion) presentation with correct ARIA (`button` + `aria-expanded`, region association, keyboard operable), reuse the accordion a11y approach shared with SKODA-806 grouped areas if presented that way.
- Emits FAQPage/Question structured data where feasible (SEO parity, supports §8.1).
- Content-driven; no runtime fetch in the per-kit (default) model.

## Acceptance Criteria
- [ ] FAQ renders as a named section of Q/A pairs from authored content.
- [ ] Expand/collapse works via mouse and keyboard; `aria-expanded` reflects state; screen-reader announces the region.
- [ ] Structured data (FAQPage) emitted where content allows; passes validation.
- [ ] Output passes lint and matches source in local preview.
- [ ] Accordion mechanics match source (trigger `16px`/600, `24px` padding, `#e4e4e4` dividers, plus-icon rotates 45° `.2s`) with added `aria-expanded` + FAQPage schema; visual diff vs source ≤ 2% per-pixel.

## Dependencies
- Upstream: SKODA-805 (press-kit template hosts the FAQ section), SKODA-106 (design tokens)
- Downstream: SKODA-1001 (per-locale trees), FAQ content is localized content

## Risks / Flags
- **Per-kit vs shared pool (🟡, §11.10):** confirm authoring source before extending beyond the per-kit inline model.
- Accordion focus/ARIA is `[RUNTIME-UNCONFIRMED]`, verify in a browser (shared concern with SKODA-806 / gallery lightbox a11y).

## Note — 2026-09-15 block recount
The full-site recount (`docs/analysis/SKODA-BLOCK-RECOUNT.md`) confirms the FAQ is **one instance of a shared `row_toggle` collapsible primitive** (`ys-row-toggle`) that also powers board exec-bio "show more" (SKODA-810) and press-kit content sections — 33 pages carry it site-wide; a standalone Q/A FAQ did **not** render on the sampled press-kit hub/sub-pages (it's a separate `/frequently-asked-questions/` chapter). **Scope implication (simplification):** build **one shared accordion block** and reuse it here + in SKODA-810, rather than a press-kit-specific FAQ block. SP held at 2 pending the press-kit walkthrough (§10 Q6).
