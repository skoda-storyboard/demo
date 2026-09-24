# SKODA-805, Press Kit template + structured narrative sections
- **Epic:** E08, Editorial at Scale
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live). The **M1 slices** are split out; see the update below.
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

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
Measurable gates live in [`press-kit-template.md` §9](../../ui-specs/press-kit-template.md); summary:
- [ ] Kit landing renders overlay hero + chapter-tile grid + sticky Chapters sub-nav (`44px`); chapters open story-detail-style two-column sub-pages (66.66/33.33, stack <768).
- [ ] Narrative order: Introduction, Exterior, Interior, Battery/powertrain, Safety, Connectivity.
- [ ] Sections are **optional/conditional** (independently authored); omitting one degrades cleanly (no empty heading/tile).
- [ ] Sub-page prose matches `story-detail.md` scale (p `16/24`, `20px` gap).
- [ ] Parser output for Peaq matches source order/content in local preview.
- [ ] Metadata carries template/model/bodywork/category/date; passes lint.
- [ ] Visual diff vs source at 1280/768 ≤ 2% per-pixel (landing + a chapter sub-page).

## Dependencies
- Upstream: SKODA-801 (import infra + parser conventions), SKODA-202 (hero), SKODA-402 (press-kit listing filter view, MR-H06)
- Downstream: SKODA-803 (bulk import at scale), SKODA-806/807/808 (compose into this template), SKODA-1001 (per-locale trees)

## Risks / Flags
- **Fixed-vs-conditional sections (🟡, §11.8):** blocks final field model, confirm with business whether the sequence is mandatory or varies by product type.
- No live press-kit detail page has been reviewed by us beyond the reported Peaq structure, **request a live example** (requirements §10 Q6 / §11.1) before locking the template.
- Ties to the DA-vs-Universal-Editor authoring-model decision (D13), a controlled/structured template is exactly the case where UE field-editing differs from DA.
