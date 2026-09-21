# Škoda Storyboard — Adversarial Review (Red-Team of Our Own Findings)

**Companion to:** the six `SKODA-*` reports.
**Date:** 2026-09-04
**Purpose:** Hostile audit of the discovery engagement — assume our own reports are wrong and try to *break* their load-bearing claims. Bias toward falsification.
**Method:** Read-only, anonymous source probing (WordPress REST, live pages, CDN headers, JS bundle inspection). No browser this session — genuinely browser-only checks are marked *still-unverifiable*.

---

## 1. Verdict Summary

Ran falsification tests against 14 load-bearing / convenient claims.

| Verdict | Count | Examples |
|---|---|---|
| **Confirmed (survived attack)** | 6 | No-commerce (strengthened), CDN-no-transforms, editorial counts, 6 languages exist, press-kits ⊂ press_release, index-search feasibility |
| **Refuted / materially wrong** | 3 | **Stories use SiteOrigin Page Builder** (missed entirely); **"speeches" is not a content type**; **translation is uneven, not 6× uniform** |
| **Overstated / confidence downgraded** | 4 | "Responsive is CSS-only" (2nd JS breakpoint found); "~52k media" (never actually confirmed); "dated jQuery stack" (modern perf features present); language-negotiated routing missed |
| **Still unverifiable (need browser/stakeholder)** | — | Focus traps, layout shift, hover timing, lightbox behavior, per-language content totals |

**Top newly-found issues (ranked by migration impact):**
1. 🔴 **Stories are built with SiteOrigin Page Builder** — a nested panel-grid/widget layout, not linear HTML. This is the single biggest miss and changes how ~1,300 EN (5,282 all-lang) story pages must be imported.
2. 🟠 **Translation coverage is uneven per-item** — the "6 languages → ~13,300 pages" framing implies uniformity that doesn't exist; a story may live in 4 of 6 languages. Scale/locale estimates need re-basing.
3. 🟠 **A gallery lightbox exists** (`sb-gallery-lightbox`, `width()<=767` breakpoint) — an interactive block never catalogued, and a *second* JS-driven responsive behavior.
4. 🟡 **Root/language routing is Accept-Language-negotiated** — a redirect behavior the migration must replicate; never noted.
5. 🟡 **"~52k media" was never actually verified** — the count endpoint timed out again; the number is an estimate presented as near-fact.

---

## 2. Falsification Log

| # | Claim (from prior reports) | Break-test run | Evidence | Verdict |
|---|---|---|---|---|
| C1 | "No commerce; `real-product-manager` is a possible product surface to rule out" | Probed `real-product-manager-wp-client/v1` routes | Routes are `plugin-update`, `license`, `telemetry`, `announcement`, `feedback` — it's the **RankMath/Real-Media vendor licensing client**, not products | **Confirmed** (no-commerce *strengthened*; open question D8 closed) |
| C2 | "CDN does no on-the-fly transforms" | Re-probed with `?w`, `?width`, `?resize`, `?format=webp`, `Accept: image/webp` | Identical bytes every time; `image/jpeg`; `AmazonS3`/CloudFront | **Confirmed** |
| C3 | "~13,300 editorial URLs; EN ~3,500" | Re-pulled `X-WP-Total` per type | EN press_release still **1,661**; totals stable | **Confirmed** |
| C4 | "Press-kits is a template/type" | `wp/v2/press_kit` | **HTTP 404** — `press_kit` is a **search filter/taxonomy**, not a CPT; press-kits are `press_release`s | **Confirmed** (refines earlier loose wording) |
| C5 | "Index-based search is feasible for the demo" | Re-checked facet model + content types | 14 facets *(later recounted as **15** — see `SKODA-SYSTEM-BUILD-SPECS.md`)* + type filter are index-able; body/relevance still the gap | **Confirmed** (unchanged) |
| C6 | "Stories are linear editorial HTML with blocks" | Grepped story markup for layout system | **`so-panel`, `panel-grid`, `so-widget-*` — SiteOrigin Page Builder**, 13–19 panels + 19–25 widgets *per story*, consistent across 4+ sampled stories | **REFUTED** |
| C7 | "`speeches` is a content type to migrate" | `wp/v2/types` + `speeches/v1/speech` | Not in `types`; namespace 404s without params — it's a **feature plugin, not a public CPT** | **REFUTED** |
| C8 | "6 languages → ~13,300 pages (implied uniform)" | Read `hreflang` on a sample story | Story exists in **cs/sk/en/de only** (4 of 6) — SR/SL absent | **REFUTED** (uneven translation) |
| C9 | "Responsive is CSS-only except gallery columns" | Grepped bundle for width→DOM branches | Found a **2nd** width branch: `width()<=767` gating a **gallery lightbox** | **Overstated** (downgrade) |
| C10 | "~52,000 media assets" | Retried `wp/v2/media` count via `_fields`, alt namespaces | Endpoint **timed out again**; never confirmed — remains a sitemap-based *estimate* | **Overstated** (downgrade) |
| C11 | "Dated jQuery/classic stack" | Inspected `<head>` for modern features | **Speculation Rules API** (prefetch) present — platform layers modern perf on the jQuery theme | **Overstated** (nuance) |
| C12 | "Root serves EN" | Root request with `Accept-Language: de / cs` | Redirects **/de/ and /cs/ respectively** — language-negotiated routing | **New behavior** (missed) |
| C13 | "Custom post types = post, page, press_release, skodapedia" | Full `wp/v2/types` dump | Confirmed exactly these 4 public CPTs (+ core WP internals) | **Confirmed** |
| C14 | "Newsletter + search are the only forms" | Grepped forms on content pages | Found a distinct **search-form** (GET) + newsletter (2 variants) — minor, but search-form was uncatalogued | **Minor gap** |

---

## 3. Newly-Uncovered Gaps (not in any prior report)

1. **SiteOrigin Page Builder on stories (🔴 high impact).** Story bodies are `panel-grid` → `panel-row` → `panel-grid-cell` → `so-widget` trees. Widgets seen: `sow-editor` (rich text), `skoda-carousel-widget`, `skoda-offset`, `tinymce`. **Migration implication:** a story importer cannot assume linear `<h>/<p>` flow — it must flatten a nested builder layout into EDS sections/blocks. This likely *raises* the story-template effort and is a new parser requirement. (Note: Page Builder is **story-only** — press releases, Škodapedia, and the homepage are *not* built this way, which localizes the risk.)

2. **Gallery lightbox (`sb-gallery-lightbox`).** A full-screen image viewer with its own `width()<=767` mobile breakpoint — never listed among blocks. Adds interactive/a11y scope (focus trap, keyboard nav) to the gallery block.

3. **Language-negotiated root routing.** `/` 301s to `/en/`, `/de/`, `/cs/`… based on `Accept-Language`. The migration must decide how (or whether) to reproduce geo/language detection.

4. **Uneven translation coverage.** hreflang proves per-item language sets vary (sampled story = 4 langs). The ~13,300 total is real but **not** a clean 6× multiple of EN; per-language counts were never pulled for all 6.

5. **Search-form as a distinct component** (separate from the newsletter and the facet UI) — small, but it's a form the block inventory didn't name.

6. **Speculation Rules prefetch** — a modern performance layer; minor, but it contradicts the "uniformly dated" characterization and is worth preserving.

---

## 4. Corrections to Prior Reports

| Prior statement | Correct position | Affected report(s) |
|---|---|---|
| Stories = editorial body + blocks (linear) | Stories = **SiteOrigin Page Builder** panel/widget layouts | INVENTORY, IMPLEMENTATION-REVIEW, OVERVIEW |
| "speeches" content type in scope (Škodapedia/speeches/press-kits owners needed) | **speeches is not a public CPT**; drop from content-type scope | DISCOVERY, DRILLDOWN, OVERVIEW |
| `real-product-manager` = possible hidden commerce (open question D8) | **Licensing/update client**, not commerce — **D8 commerce sub-question closed** | DISCOVERY, OVERVIEW |
| "Responsive is CSS-only; only the gallery grid is JS" | **Two** JS width-branches: gallery columns **and** gallery lightbox (`≤767`) | INVENTORY (§8), OVERVIEW |
| "~52,000 media assets" (stated with High confidence) | **Unverified estimate** — count endpoint never returned; treat as order-of-magnitude | all reports citing 52k |
| Press-kits implied as a template/type | Press-kits are `press_release` items surfaced via a **filter**, not a CPT | DRILLDOWN, INVENTORY |

---

## 5. Confidence Downgrades (survived, but weaker than presented)

- **Media scale (~52k):** order-of-magnitude only; `wp/v2/media` count is effectively unqueryable anonymously (times out). Any media-migration sizing built on 52k inherits this uncertainty.
- **"Mostly CSS-only responsive":** directionally true (284 media queries, mobile-first) but not absolute — at least two JS breakpoint behaviors exist; more may hide in the 128 KB bundle.
- **Per-language scale:** all-language totals were summed from REST but **per-language distribution was never enumerated for all 6**; the 26%-EN figure is EN-confirmed, the other five are inferred.
- **Block coverage completeness:** the signature crawl explained the common blocks but **missed an entire layout system (Page Builder) and a lightbox** — so "we found all the blocks" should be read as "we found the *common, class-signposted* blocks."

---

## 6. Residual Unknown-Unknowns (still can't know without…)

**…a real browser:**
- What SiteOrigin Page Builder actually *renders* (the DOM after JS) vs. the raw panel markup — the true content shape for the importer.
- Lightbox, glossary modal, mega-menu, carousel: focus traps, keyboard, layout shift.
- Whether any content is injected/personalized client-side (banners, A/B, consent-gated) that anonymous HTML never shows.

**…stakeholder/authenticated access:**
- True media-library size and rights/licensing on downloadable assets.
- Whether `sowb/v1`, `mediakit/v1`, `data-store/v1` gate any editor-only or member behaviors (probed anonymously only).
- Per-language editorial totals and which locales are actually maintained vs. stale.

**…deeper crawl:**
- Long-tail/rare page types outside the sampled templates (campaign/landing/microsite pages), and non-EN structural differences.

---

## 7. Updated Open Questions & Risk Deltas

**New/changed risks to add to the register:**
- **R11 (new, High):** Story import must flatten **SiteOrigin Page Builder** layouts — new parser complexity; re-estimate the story template upward.
- **R12 (new, Med):** Uneven per-language translation means locale rollout can't assume parity; content-ops must map which items exist per language.
- **R13 (new, Low–Med):** Language-negotiated root routing to reproduce or consciously drop.
- **R4 (amend):** media sizing rests on an **unverified** ~52k — flag the number as an estimate everywhere it appears.
- **R-gallery (amend):** gallery block scope now includes a **lightbox** (interactive + a11y), not just responsive columns.

**Open questions changed:**
- **D8 — commerce sub-question: CLOSED** (no commerce; `real-product-manager` is licensing). The Škodapedia/press-kits owners part stands; **speeches removed** from scope.
- **New:** Confirm per-language content counts and which locales are actively maintained before any multi-language estimate.

**Recommended propagation (on request):** update OVERVIEW §2/§3/§5/§8, INVENTORY §8, and IMPLEMENTATION-REVIEW to reflect Page Builder, the lightbox, the speeches/press-kit corrections, and the 52k caveat. *(Not auto-applied — flagged per plan.)*

---

## 8. What the Adversarial Pass Confirms About Process Quality

- The signature-crawl method is good at **common, class-labelled** components but **structurally blind** to layout-builder architectures (SiteOrigin) whose meaning lives in nesting, not class names. Any future audit should add a "layout-system detection" pass (grep for `so-panel`/`elementor`/`wp-block-`/`vc_row` families) **before** trusting a block inventory.
- Two of the three refutations came from **querying `wp/v2/types` and `hreflang` directly** — cheap checks that should have been in the *original* discovery. Lesson: verify content-type and translation claims from authoritative endpoints, not inference.
- The most convenient claims (no-commerce, CDN-dumb, counts) **held up** — good — but the ones taken *on trust without a confirming query* (speeches, 52k, uniform translation, linear stories) are exactly the ones that broke.

---

## Appendix — Evidence Captured This Pass

- `wp/v2/types` → 4 public CPTs only (post, page, press_release, skodapedia); no `speeches`, no `press_kit`.
- `real-product-manager-wp-client/v1` routes → licensing/update/telemetry (not commerce).
- `wp/v2/press_kit` → 404 (not a CPT). `speeches/v1/speech` → 404 without params.
- Story markup → `so-panel`/`panel-grid`/`so-widget-*` on **4/4** sampled stories (13–19 panels each); **0** on press-release/Škodapedia/home.
- `hreflang` on sample story → cs, sk, en, de (SR/SL absent).
- Root redirect → `/en/` default; `Accept-Language: de/cs` → `/de/`, `/cs/`.
- Bundle → `width()<=767` gating `sb-gallery-lightbox`; `matchMedia`=0, one `innerWidth`, one resize listener.
- `<head>` → `<script type="speculationrules">` prefetch present.
- `wp/v2/media` count → timed out again (unverifiable anonymously).
- EN press_release `X-WP-Total` = 1,661 (stable vs prior).
- **Limitation:** anonymous, no browser; sampling still English-biased; per-language and rendered-DOM checks remain open.
