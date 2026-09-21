# Škoda Story Corpus — Full Widget Census (EN + CS, 100%)

**De-risks:** `../tickets/tickets/SKODA-801.md` (SiteOrigin flatten) — moves from *sampled* to *near-complete* confidence.
**Supersedes:** the 5-story POC and 40-story census in `SKODA-FLATTENER-POC-FINDINGS.md`.
**Date:** 2026-09-07
**What ran:** enumerated **every EN + CS story** from the WordPress REST API and **scanned 100% of them** (2,773 pages, 0 fetch errors) for the SiteOrigin widget tree — capturing per-page widget **types**, **ordered recipe**, and **panel/row counts**. Read-only, raw HTML (rendered fidelity `[RUNTIME-UNCONFIRMED]`).
**Dataset:** `SKODA-STORY-WIDGET-DATASET.csv` (one row per story; the flattener's real test corpus).

---

## 1. Headline

The full census **confirms the flatten is low-risk and re-validates the SKODA-801 re-point (8 SP)** — while surfacing the honest long tail the sample missed. **98.7% of stories** need only widgets that map to simple EDS blocks/default-content; **99.85% of all widget instances** are covered by the mapped set. Only **1.3% of stories (36)** contain a genuinely special widget (interactive charge-map / charging-calculator / a nested-builder edge case). The widget set is **perfectly locale-invariant** (EN and CS use the identical 17 types — the CS parser needs nothing extra).

**Recommendation: PROCEED. Keep SKODA-801 at 8 SP** (reduced-fidelity M1 slice ~2–3), add mapping rows for the newly-surfaced common widgets, and treat the 3 special widgets as deferred/embedded. Two concrete new risks to log (§7).

---

## 2. Universe Enumerated

| | Stories | Page-Builder | Non-PB |
|---|--:|--:|--:|
| EN | 1,312 | — | — |
| CS | 1,461 | — | — |
| **Total** | **2,773** | **2,672 (96.4%)** | **101 (3.6%)** |

- **0 fetch errors** — true 100% scan.
- **101 stories are NOT Page Builder** (e.g. `/en/models/the-upgraded-skoda-octavia/`) — likely newer/linear posts or model pages filed under `post`. **New finding:** the story parser must handle a **linear (non-builder) story variant** too, or route those to the plain-post path. Small but real.
- Verified (spot-check): press-release + Škodapedia pages have **zero** Page-Builder markup → the "Page Builder is story-only" assumption holds.
- Widgets/story: min 0, **max 208** (one outlier), avg 12.7; max panel-grids = 293 (two stories) — deep-nesting outliers exist (§7).

---

## 3. Definitive Widget-Type Census (100% of 2,773 stories; 35,159 instances)

Canonicalized (button-wire instance variants folded into `sow-button`, charge-map variants unified):

| Widget | Instances | % | In # stories | Maps to |
|---|--:|--:|--:|---|
| `sow-editor` (rich text) | 29,359 | **83.5%** | 2,526 | default content |
| `skoda-offset` (spacer) | 2,889 | 8.2% | 815 | drop |
| `skoda-carousel-widget` | 1,420 | 4.0% | 416 | Carousel/Cards block |
| `sow-slider` | 516 | 1.5% | 67 | slider → Carousel/Gallery |
| `skoda-quote` | 402 | 1.1% | 164 | pull-quote → blockquote |
| **`skoda-captioned-image`** *(new)* | 253 | 0.7% | 45 | image + caption → figure/image block |
| `sow-button` (+ wire variants) | 89 | 0.3% | ~10 | button/CTA |
| **`skoda-image-box`** *(new)* | 60 | 0.2% | 16 | image/card block |
| **`charge-map`** (`k2tools`) | 42 | 0.1% | 30 | **interactive — external embed / defer** |
| `sow-image` | 41 | 0.1% | ~8 | image |
| **`ys-milestones`** *(new)* | 36 | 0.1% | 18 | timeline → new/omit block |
| **`ys-embed-share`** *(new)* | 31 | 0.1% | 12 | share widget → chrome/omit |
| `siteorigin-panels-builder` | 7 | 0.02% | 6 | **nested builder — edge, skip+log** |
| `highlights` | 6 | 0.02% | 2 | small block/omit |
| `iframe-embed` | 4 | 0.01% | 2 | embed |
| `skoda-newsletter-widget` | 2 | 0.01% | 2 | newsletter (chrome/service) |
| `charging-calculator` (`k2tools`) | 2 | 0.01% | 2 | **interactive — external embed / defer** |

**17 canonical widget types** total (the 40-story sample found 6 — the census found the real long tail, as intended).

---

## 4. Widget-Combination Census (the "recipes")

**51 distinct widget-mix signatures** across 2,773 stories — a small, tractable set of real layout patterns. Top recipes:

| Stories | Widget mix (types present, order-independent) |
|--:|---|
| 1,453 | `sow-editor` only |
| 472 | `skoda-offset + sow-editor` |
| 210 | `skoda-carousel + skoda-offset + sow-editor` |
| 136 | `skoda-carousel + sow-editor` |
| 101 | *(empty / non-Page-Builder)* |
| 73 | `skoda-quote + sow-editor` |
| 60 | `skoda-carousel` only |
| 30 | `skoda-offset + sow-editor + sow-slider` |
| 29 | `skoda-quote` only |
| 24 | `sow-editor + sow-slider` |

**Insight:** the overwhelming majority of stories are **just rich-text ± a carousel ± spacers ± a quote** — exactly the shape the POC predicted. The long-tail widgets (captioned-image, image-box, milestones, charge-map…) appear in a **small, enumerable set of recipes**, all listed in the dataset.

---

## 5. Cross-Locale Finding (EN vs CS)

**The widget set is perfectly locale-invariant.** EN uses **17** types, CS uses the **same 17** — **zero EN-only, zero CS-only** widgets. The instance distribution is near-identical (e.g. `sow-editor` EN 14,264 / CS 15,095). **Implication: the flattener built for EN works unchanged for CS** — the second launch locale adds *volume*, not *parser complexity*. Strong de-risk for the EN→CS rollout.

---

## 6. Parser Coverage & Confidence

- **98.7% of stories (2,737)** are fully covered by mapped widgets (simple → block/default-content).
- **99.85% of all widget instances** covered by the mapped set.
- **Only 1.3% of stories (36)** contain a special widget — **charge-map** (30 stories), **charging-calculator** (2), **nested `siteorigin-panels-builder`** (6). These are the exact parser test/decision set (URLs in the dataset, `has_rare=yes`).
- **Confidence statement:** with a 100% EN+CS scan and 0 errors, the widget universe is now **known, not estimated**. The mapping table + a "skip-and-log unknown" safety net covers 99.85% of instances; the residual is a **known, enumerated 36-story set**, not an open unknown.

---

## 7. New Risks / Corrections vs Prior Findings

1. **Non-Page-Builder story variant (NEW, 101 stories / 3.6%):** some `post`-type stories aren't Page Builder at all — the importer needs a **linear-story fallback path** (or detect + route to the plain-post parser). Not hard, but not previously captured.
2. **Deep-nesting outliers (NEW):** one story = **208 widgets**; two stories = **293 panel-grids**. The parser must be **robust to very large trees** (perf + recursion limits) — the reduced-fidelity M1 flatten should linearize these safely.
3. **Long tail is bigger than the sample showed (11 → 12 extra types):** but still tiny by volume (0.15% of instances). Adds a few **common-ish** mappings to SKODA-801: `skoda-captioned-image` (45 stories), `skoda-image-box` (16), `ys-milestones` (18 — timeline), `ys-embed-share` (12 — share), `sow-button` (CTAs). All simple except milestones (a timeline block — new-block or omit for demo).
4. **3 interactive widgets confirmed defer/embed:** `charge-map`, `charging-calculator` (both `k2tools`, external Škoda apps — match the `sdrive`/charging CSP hosts), and the `siteorigin-panels-builder` nested edge case → skip+log.
5. **SKODA-801 effort holds at 8 SP** — the census *confirms* rather than changes the re-point; the extra common widgets are simple, and the special ones are deferred, not built. The mapping table should be **expanded** with items 3–4 (flag for a separate edit).

---

## 8. Recommended Actions (flag for separate propagation)

- **SKODA-801:** expand the widget mapping table with `skoda-captioned-image`, `skoda-image-box`, `sow-button`, `ys-milestones`, `ys-embed-share`; add a **non-Page-Builder linear-story fallback**; add a **large-tree robustness** acceptance criterion; keep 8 SP.
- **`SKODA-FLATTENER-POC-FINDINGS.md`:** note the census supersedes its §11 (6 types → 17; coverage now 100%-measured).
- **Parser test corpus:** use the 36 `has_rare=yes` stories + the 208-widget outlier + a non-PB story as the explicit test set.
- **Confirm** with Škoda whether `charge-map`/`charging-calculator` should render (embed the external app) or be dropped in migrated stories.

---

## 9. Method, Limitations & Reproducibility

- Enumerated via `wp/v2/posts?lang=en|cs` (paginated, authoritative); scanned each with a Python census (`scan.py`, 24-worker parallel, resumable, 0 deps). Widget types from `so-panel widget_<type>` + `so-widget-<type>` class tokens (hashes normalized).
- **Raw server HTML only** — widget *presence, count, and combination are exact*; **rendered layout fidelity remains `[RUNTIME-UNCONFIRMED]`** (needs a browser — especially the multi-column and 208-widget outliers).
- **EN + CS complete.** DE/SK/SR/SL (~2,700 more stories) not scanned — but given perfect EN/CS locale-invariance, they're very unlikely to add widget types; flagged as extrapolation, extend if go-live needs certainty.
- **Dataset retained:** `SKODA-STORY-WIDGET-DATASET.csv` (2,773 rows: `url, locale, is_pb, panel_grids, panel_rows, widget_count, recipe, rare, has_rare`). Scratch fetch files cleaned up.
