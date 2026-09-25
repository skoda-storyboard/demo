# Story Flattener POC — Findings & Recommendation

> **⏱ SUPERSEDED IN PART (2026-09-07):** §11's widget census (40 stories, 6 types) is now superseded by the **full 100% EN+CS census** (`SKODA-STORY-WIDGET-CENSUS.md`, 2,773 stories, 0 errors) — the true set is **17 canonical types** (the sample undercounted the long tail), but the conclusion **strengthens**: 98.7% of stories / 99.85% of instances are covered by simple mapped widgets, only 1.3% (36 stories) need special handling, and the widget set is **locale-invariant (EN = CS)**. The census also surfaced **101 non-Page-Builder stories (3.6%)** and **large-tree outliers (208 widgets / 293 panel-grids)** — both now in SKODA-801. **Use `SKODA-STORY-WIDGET-CENSUS.md` as the canonical widget reference; this POC remains the record of the parser mechanism + fidelity method.**

**De-risks:** `../tickets/tickets/SKODA-801.md` (SiteOrigin Page-Builder flatten — the M1 critical-path parser).
**Date:** 2026-09-07
**What ran:** a throwaway Node POC (`flatten.mjs`) parsing the **raw server HTML** of **5 real EN stories**, walking the SiteOrigin tree, classifying every widget, mapping to flat EDS output, and measuring content fidelity. Read-only; no DA push; no Git. Structural fidelity only — rendering needs a browser (`[RUNTIME-UNCONFIRMED]`).

---

## 1. Headline: the flatten is SIMPLER than the 13 SP estimate assumed

The core worry behind SKODA-801 was arbitrary, messy nesting with a long tail of widget types. **On real content, that fear is largely unfounded.** Stories are overwhelmingly **rich-text (`sow-editor`) + a related-content carousel + spacers** — a short, closed widget set with shallow effective structure. **Recommendation: PROCEED; the M1 reduced-fidelity flatten is low-risk, and the full parser is likely below 13 SP.**

---

## 2. Sample

| Story | Bytes | panel-grid | panel-row | so-widget |
|---|--:|--:|--:|--:|
| ouninpohja (lifestyle) | 191 KB | 2 | 1 | 20 |
| peaq record (emobility) | 245 KB | 2 | 1 | 25 |
| mixed-reality (Škoda World) | 168 KB | 8 | 3 | 20 |
| license-plate (emobility) | 133 KB | 3 | 2 | 19 |
| peaq 5 reasons (emobility) | 183 KB | 2 | 1 | 22 |

Spans the panel range and topic variety (text-heavy, image-heavy, one with an inline video).

---

## 3. Widget Census (the key de-risk)

Across all 5 stories, **exactly 3 widget types — zero unmapped:**

| Widget | Count | Maps to |
|---|--:|---|
| `sow-editor` (rich text via `siteorigin-widget-tinymce`) | dominant | **default content** (keep inner HTML as-is) |
| `skoda-offset` (`<div style="padding-top:1em">`) | frequent | **DROP** (pure spacer) |
| `skoda-carousel-widget` (Flickity, `search-results-items`) | present in most | **teaser cards → Cards** *(in THIS 5-story sample; see note below)* |
| **UNMAPPED** | **0** | — |

> **Reconciled 2026-09-24 (SKODA-801 build):** this sample's carousels were link-bearing *related-story teaser cards*, but the build-inspected stories (epiq, olive-oil) had **link-free image carousels** (the article's own photos). The widget is used **both ways**; the shipped parser routes **by content** — linked items → Cards (teasers), link-free → Gallery (images). See `SKODA-STORY-WIDGET-CENSUS.md` §7a. The §4 "false-alarm" observation below remains accurate *for this sample* (its carousel content was genuinely non-body teasers).

**No gallery/embed *widgets*** — instead, **video/embeds are inline inside the `sow-editor` HTML** (story3 has an inline Vimeo `<iframe>`), so they come across for free when we preserve the editor content.

---

## 4. Fidelity — and an important false-alarm the POC caught

Raw "content IN vs OUT" counts looked alarming (e.g. story1: 22 `h3` / 33 `img` in → few out). **Investigation showed this is a counting artifact, not content loss:**
- The 22 `h3` / 33 `img` live in the **carousel's related-content teaser cards** (18 h3 + 30 img confirmed inside `search-results-item`), **not** in the article body. Those correctly collapse into a single **Carousel block reference** — they are *not* body content to preserve inline.
- The **actual editorial body** = `<p>` text + a few inline `h2/h3/img/iframe` inside `sow-editor`. Measured per story:

| Story | body `p` | body `h2` | body `h3` | body `img` | body `iframe` |
|---|--:|--:|--:|--:|--:|
| ouninpohja | 5 | 0 | 0 | 0 | 0 |
| peaq record | 16 | 0 | 0 | 3 | 0 |
| mixed-reality | 14 | 2 | 2 | 4 | 1 (Vimeo) |
| license-plate | 15 | 4 | 1 | 3 | 0 |
| peaq 5 reasons | 11 | 5 | 0 | 3 | 0 |

**The body content is captured cleanly** — the POC's flattened output for story1 opens with the real article prose (3.8 KB). The lesson: **fidelity must be measured on the `sow-editor` body, not the whole panel region** (or you double-count teaser sub-elements). A production parser should treat the carousel as an opaque block and diff only the editorial body.

---

## 5. Before → After (real, trimmed — story1)

**Before (SiteOrigin):**
```
<div id="panel-450668-0-0-0" class="so-panel widget widget_sow-editor">
  <div class="so-widget-sow-editor"><div class="siteorigin-widget-tinymce textwidget">
    <p>Ouninpohjantie is a solid gravel road in southern Finland…</p>
</div></div></div>
<div id="panel-450668-0-0-2" class="so-panel widget widget_skoda-offset">
  <div class="so-widget-skoda-offset"><div style="padding-top:1em;"></div></div></div>
<div class="so-widget-skoda-carousel-widget"><div class="search-results-items" data-flickity=…>…</div></div>
```
**After (flat DA/EDS):**
```
Ouninpohjantie is a solid gravel road in southern Finland…

---

| Carousel |
| --- |
| (related-content items) |
```
(spacer dropped; editor prose preserved; carousel → block.)

---

## 6. What held vs what broke (vs SKODA-801 mapping table)

| SKODA-801 assumption | POC result |
|---|---|
| `sow-editor` → default content | ✅ Held — keep inner `.textwidget` HTML verbatim (headings/lists/inline img/iframe already clean) |
| `skoda-offset` → drop/section | ✅ Held — pure spacer, drop |
| `skoda-carousel` → block | ✅ Held — teasers in *this* sample → Cards; **but see the §3 reconcile note: the widget is also used as link-free image carousels → Gallery. Shipped parser routes by content.** |
| gallery / embed **widgets** | ⚠️ **None found** — embeds are **inline in editor HTML**, not separate widgets. So the embed/gallery widget-mapping rows are likely unnecessary for stories (galleries live on press releases, not stories). |
| arbitrary deep nesting, long tail | ✅ **Not observed** — 3 widget types, 0 unmapped, shallow effective structure |
| img out of `<p>` | ✅ Handled (regex lifts `<p><img></p>`) |

**Net:** the mapping table is correct and can be **simplified** for stories — really just *rich-text + carousel + drop-spacers*.

---

## 7. Reduced-fidelity M1 flatten (now concretely definable)

For the Oct 15 demo, the flatten needs only:
1. **Extract each `sow-editor` `.textwidget` inner HTML** → default content (verbatim; headings, paragraphs, lists, inline images, inline embeds all pass through).
2. **Lift `<img>` out of `<p>`** (EDS `<picture>` requirement); carry `alt` + `data-caption`.
3. **Drop `skoda-offset` spacers.**
4. **Collapse `skoda-carousel-widget` → a block** — routed by content in the shipped parser: linked items → Cards (teasers), link-free → Gallery (images). *(This rec originally said Cards-only; see the §3 reconcile note.)*
5. **Panel-row boundaries → section breaks** (optional for single-column demo).

That is a **small, well-defined transform** — not a research project.

---

## 8. Effort Re-Estimate for SKODA-801

- **Original: 13 SP** (largest ticket), premised on messy nesting + unknown widget long-tail.
- **POC evidence:** 3 widget types, 0 unmapped, shallow structure, embeds inline.
- **Revised: ~5–8 SP likely suffices** for a robust story parser (the reduced-fidelity M1 version is ~2–3 SP). **Recommend re-pointing SKODA-801 down** — pending the caveats in §9.
- This materially **eases the M1 critical path** (the hardest ticket is less hard than feared).

---

## 9. Risks / Caveats / `[RUNTIME-UNCONFIRMED]`

- **Sample = 5 EN stories.** Confident on the common shape; the **long tail across ~1,300 EN / 5,282 all-lang stories** could still hold rare widgets (campaign/interactive/older layouts). Keep the "skip + log unknown widgets" safety net; run a **full widget census across all stories** before finalizing the production parser (cheap: grep `so-widget-*` classes over a bulk fetch).
- **Structural only.** The POC never rendered anything — column layouts, carousel behavior, and visual fidelity are `[RUNTIME-UNCONFIRMED]`. The demo build must verify rendered output in a browser.
- **Multi-column layouts.** The sample was largely single-column-effective; stories with genuine multi-column `panel-row`s (story3 had 3 rows / 8 grids) need a decision: preserve columns or linearize. **M1: linearize; M2: decide per design.**
- **Carousel semantics.** `skoda-carousel-widget` is used **both** as related-content teaser rails ("you might also like", possibly auto-generated) **and** as link-free in-body image carousels (build finding 2026-09-24). The shipped parser distinguishes them by content (linked → Cards, link-free → Gallery). For the *teaser* variant, still confirm whether it should be migrated as content or regenerated from the query-index at render time. *(Possible further simplification for that variant only.)*
- **POC counter pitfall** (documented §4) — measure fidelity on the editor body, not the whole panel region.

---

## 10. Recommendation

**PROCEED — and re-scope SKODA-801 downward.** The flatten's feared complexity did not materialize on real content: a 3-widget, no-unmapped, shallow structure with embeds inline. The **M1 reduced-fidelity flatten is genuinely low-risk (~2–3 SP)**; the **full parser likely ~5–8 SP** (down from 13). 

**Before committing:** run a **bulk widget census across all EN stories** (one grep pass) to confirm no long-tail widgets, and **verify rendered output in a browser** during the demo build. Then re-point SKODA-801 and update the delivery plan's M1 critical-path risk (R-A) from 🔴 down to 🟠.

---

## 11. Widget Census — 40-story (⚠️ SUPERSEDED by the full 100% EN+CS census: `SKODA-STORY-WIDGET-CENSUS.md`)

> This 40-story census found 6 types; the **full 2,773-story EN+CS census** found **17 canonical types** with 98.7%/99.85% coverage by simple widgets and perfect EN/CS locale-invariance. The section below is retained as the interim step; **the full census is canonical.**

Ran the census the POC recommended: **40 EN stories** (spread across topics via REST pagination), **1,787 widget instances**. The 5-story POC undercounted the type set — the census found **6 widget types**, but the distribution is heavily concentrated:

| Widget | Instances | % | In ~N/40 stories | Maps to |
|---|--:|--:|--:|---|
| `sow-editor` | 1,539 | **86.1%** | 40/40 | default content |
| `skoda-offset` | 126 | 7.1% | 14/40 | drop (spacer) |
| `skoda-carousel-widget` | 69 | 3.9% | 6/40 | Carousel/Cards block |
| **`sow-slider`** *(new)* | 34 | 1.9% | 2/40 | **image slider → Carousel/Gallery block** |
| **`skoda-quote`** *(new)* | 15 | 0.8% | 1/40 | **pull-quote → blockquote / small block** |
| `k2tools-charge-map` *(new, rare)* | 3 | 0.2% | 1/40 | **interactive charging-map — external/embed widget; likely defer or embed** |
| `siteorigin-panels-builder` | 1 | 0.1% | 1/40 | nested-builder edge case — flag/log |

**Coverage:** the **core 3 cover 97.0%**; **adding slider + quote → 99.8%**. The rare interactive bits (charge-map, nested builder) are **0.22%** of instances.

**What this changes:**
- The mapping table needs **2 more common rows** (`sow-slider` → slider/gallery block; `skoda-quote` → pull-quote) — both simple. Add to SKODA-801.
- **`k2tools-charge-map`** is a genuine long-tail item: a **hosted interactive widget** (Škoda charging map, `sdrive`/charging-calculator family from the CSP). It's rare (0.2%, ~1 story) → **defer / treat as an external embed**, not a demo blocker. Flag as a decision.
- **Verdict holds:** it's still a **small, closed, mostly-simple widget set** — the "skip + log unknown" safety net covers the 0.1% nested-builder edge case. The re-point stands.

## Appendix — Method & Reproducibility
- POC script: `flatten.mjs` (Node, no deps; regex/string DOM walk). Inputs: 5 story HTML files. Outputs: `.flat.txt` per story + census/fidelity to stdout.
- Widget classification by class token (`sow-editor` / `skoda-offset` / `skoda-carousel` / gallery / embed / UNKNOWN).
- Fidelity = content-tag counts (editor body vs whole region — see §4 pitfall).
- **Limitation:** raw-HTML only (no browser), 5-story sample, structural not visual. Findings are directional but strong; the bulk census + browser check close the residual risk.
- Scratch files (`.poc-tmp/`) cleaned up after this report.
