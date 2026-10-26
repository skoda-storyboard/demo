# SKODA-802 — Remaining templates (Škodapedia pre-baked terms, pages)
- **Epic:** E08 — Editorial at Scale
- **Type:** import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–7d *(planning estimate, not a quote)*

> **Re-scoped (2026-09-11):** the Press Kit detail template was **broken out** into dedicated tickets after the requirements doc (§11.8–11.14) confirmed it is *not* a "reuse existing blocks, no new blocks" case — it needs a fixed narrative template (**SKODA-805**), grouped media/download areas + whole-kit ZIP (**SKODA-806**), an FAQ block (**SKODA-807**), and variant subsections + a selector (**SKODA-808**). This ticket now covers **only Škodapedia + generic pages** (8 SP → 5 SP).

## Summary
Cover the remaining reuse-only editorial templates once the story parser lands: Škodapedia glossary (with terms pre-baked as `/modals/` docs) and generic pages — reusing existing blocks, adding none. (Press kits moved to SKODA-805–808.)

## Description
With the hardest template (story) solved in SKODA-801, this ticket completes template coverage:

- **Škodapedia:** the A–Z directory and letter/category filter are already 100% client-side (class-based, no fetch). The term *detail* is otherwise a thin `skodapedia/v1/term/{id}` fetch returning ready-rendered HTML. **Pre-bake each term as its own DA doc under `/modals/skodapedia/{slug}`** so the directory links open via the EDS modal convention — this makes the glossary **fully static with zero runtime API** (recommended over keeping a thin fetch). ~189 EN term docs to generate.
- **Pages:** the generic page template (~9.6%) is native DA default content — straightforward doc + metadata.

> **Press kits** are handled separately in **SKODA-805–808** (structured template, grouped media + ZIP, FAQ, variant subsections) — they are `press_release` items surfaced via the shared listing filter, but the detail page is a structured template, not a reuse-only import.

## Requirements / Spec
- Škodapedia glossary block: inline directory (all terms present for SEO), A–Z + category client-side filter reproducing the source's class-based toggle model.
- Generate one `/modals/skodapedia/{slug}` doc per term from the source term content; wire directory links to open via `autoLinkModals()` / `/modals/` convention.
- Generic page parser: sections + default content + metadata table.
- Content-driven detection only; no new blocks introduced.

## Acceptance Criteria
- [ ] Škodapedia index renders the full inline directory; A–Z and category filters work client-side with no network fetch.
- [ ] Each term opens as an accessible `/modals/` doc (focus-trap, Escape, return-focus); no `skodapedia/v1` runtime call remains.
- [ ] Generic pages import as default-content docs with correct metadata.
- [ ] All output passes lint and renders correctly vs. source in local preview.

## Dependencies
- Upstream: SKODA-801 (story parser + shared import infra) / Downstream: SKODA-803 (bulk import), SKODA-1001 (per-locale trees)
- Related: SKODA-805–808 (press-kit template, split out of this ticket)

## Risks / Flags
- **Škodapedia decision (🟡):** pre-bake (recommended, fully static) vs. keep a thin fetch — confirm with stakeholders; ~189 EN term docs to generate and keep in sync.
- Modal focus behavior is `[RUNTIME-UNCONFIRMED]` — verify accessibility in a browser.

## Amendment (2026-10-22, M2 gap review §7.2)
Source: [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2, row "802 / 206": G-C-02
(Medium, was High, CONFIRMED), G-C-03 (Medium, CONFIRMED, browser-checked), G-C-04 (Medium, CONFIRMED), G-C-05 (Low,
CONFIRMED), G-C-06 (Low, not re-verified). The block side is SKODA-206 / 206a. The in-body glossary spans
(G-C-01) are SKODA-849a, not repeated here; 849a already links each span to "the term at the target locale's public
path", which is the path SKODA-802a sets.

**Added scope:**
- Moved to SKODA-802a.

**Added acceptance criteria:**
- Moved to SKODA-802a.

**Estimate after the amendment:** 7 SP in total (was 5 SP), split as proposed:
- **SKODA-802** (2 SP · AI-assisted 1d / manual 1–3d, the 7 SP total less 802a *(planning estimate, not a quote)*):
  generic pages. The Škodapedia items in the Description, Requirements and Acceptance Criteria above are carried by
  802a, with term docs at `/{loc}/skodapedia/{slug}` instead of `/modals/skodapedia/{slug}`.
- **[SKODA-802a](SKODA-802a.md)** (5 SP): Škodapedia: the directory parser with facets, the index sheet, term docs at
  public paths, category archives, term media and the per-locale generator that 1004a–c run.

**Added dependencies:** Moved to SKODA-802a.
