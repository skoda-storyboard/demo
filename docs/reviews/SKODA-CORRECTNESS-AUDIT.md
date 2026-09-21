# Škoda Docs — Final Correctness Audit (Cross-Doc Consistency)

**Scope:** all top-level `SKODA-*.md` reports + the two `.html` decks + the `skoda/` backlog (as consistency reference).
**Date:** 2026-09-05
**Method:** two-pass — (1) harvest the canonical cross-cutting facts into one criteria list; (2) sweep every doc for divergent/stale values, classifying each hit **stale / historical-OK / contradiction**.
**Nature:** audit only — findings + recommended fixes; not auto-applied.

---

## 1. Verdict Summary

The set is **~95% consistent**. The many correction rounds propagated well, with **one real drift cluster**: the **effort figure (~13–25 AI-days) was updated to the canonical ~30–50 in the deck and backlog, but NOT in the OVERVIEW (md+html) or the Architecture doc** — those still show the old number. Plus one stale count in the backlog intro. Everything else checks out or is legitimately historical.

| Severity | Count | Items |
|---|---|---|
| 🔴 Stale (should fix) | **6** | Effort ~13–25 in 3 docs (4 instances); "narrow English pilot / one article" recommendation in OVERVIEW.html; "40 tickets" in backlog OVERVIEW intro |
| 🟡 Framing (verify, likely fine) | 2 | PR count 1,659 (crawl) vs 1,661 (REST); footprint band wording |
| ✅ Historical-OK (not defects) | many | ~52k & 14-facet in adversarial/"before-after" tables |
| ✅ Clean (consistent everywhere) | 14 criteria | see §4 |

---

## 2. Canonical Criteria (source of truth)

| # | Criterion | Canonical value |
|---|---|---|
| C1 | Facet count | **15** (incl. `history`) |
| C2 | Media scale | 42,275 pages / ~28,300 logical / ~200k physical (order-of-mag); **not ~52k** |
| C3 | Footprint | ≈80–110 GB / ≈34 GB masters (order-of-magnitude) |
| C4 | Glossary | directory+filter static; term detail thin fetch; pre-bakeable to `/modals/` → static (**not** unqualified "fully static") |
| C5 | Banner | bespoke **per-market** ad server (cs51/en46/sk2/de0/sr0/sl1); not a global 46-block |
| C6 | skoda-analytics | bespoke ~140 KB cross-cutting dependency |
| C7 | ys-social-feed | not live — curated carousel |
| C8 | Header/mega-menu | plain nested link lists; mobile-nav ARIA gap |
| C9 | Story template | SiteOrigin Page Builder → flatten; Phase B |
| C10 | speeches | not a public content type |
| C11 | real-product-manager | licensing, not commerce; D8 commerce closed |
| C12 | EN counts | posts 1,312 · PR 1,661 · pages 337 · Škodapedia 189 (REST) |
| C13 | i18n | 6 locales, uneven per-item; not uniform 6× |
| C14 | DA constraint | no spreadsheet indexing → `helix-query.yaml` |
| C15 | Pilot definition | capability pilot; story + 4 services deferred |
| C16 | **Pilot effort** | **~30–50 AI-days / ~60–90 manual** (canonical, per `skoda/OVERVIEW.md` §5) |
| C17 | Backlog totals | **41 tickets / 189 SP**; E02 = 21 SP (post SKODA-206) |
| C18 | Zero cookies | server-response only; consent cookies set client-side |
| C19 | CDN | S3+CloudFront pass-through; no transforms; no CORS |

---

## 3. Findings (stale / contradiction)

### 🔴 F1 — Pilot effort figure not fully propagated (the main issue)
The last alignment updated **`SKODA-STORYBOARD-SITE-FACTS.html`** and **`skoda/OVERVIEW.md`** to the canonical **~30–50 AI-days / ~60–90 manual**, but three docs still carry the **old ~13–25 / ~45–68**:

| File | Line | Current (stale) | Should be |
|---|---|---|---|
| `SKODA-STORYBOARD-ANALYSIS-OVERVIEW.md` | 23 | "capability build (**~13–25 AI-days / ~45–68 manual**)" | ~30–50 AI-days / ~60–90 manual |
| `SKODA-STORYBOARD-ANALYSIS-OVERVIEW.md` | 145 | "the **~13–25 AI-day / ~45–68 manual-day** effort estimate prices" | ~30–50 / ~60–90 |
| `SKODA-STORYBOARD-ANALYSIS-OVERVIEW.html` | ~390 | Phase A card "**~13–25 AI-days**" | ~30–50 AI-days |
| `SKODA-EDS-DA-ARCHITECTURE.md` | 214 | "Effort: **~13–25 AI-days** (capability, not one page)" | ~30–50 AI-days |

**Classification:** stale. The `skoda/OVERVIEW.md §5` and the SITE-FACTS deck are canonical (~30–50); these four instances lag. **Fix:** update all four to ~30–50 AI-days / ~60–90 manual, ideally citing `skoda/OVERVIEW.md` as the source.

### 🔴 F2 — OVERVIEW.html recommendation still says "narrow English pilot / one press-release article"
- **`SKODA-STORYBOARD-ANALYSIS-OVERVIEW.html` line 244:** *"proceed with a **narrow English pilot** — one press-release article + its listing —"*
- The **markdown** OVERVIEW (line 23) was already reframed to "**capability pilot**… not a one-page proof-of-concept," but the **HTML deck's Executive-Summary recommendation** wasn't updated to match (its Phase-A card was, but not this paragraph).
- **Classification:** stale / internal contradiction (deck says two different things about the pilot). **Fix:** reword line 244 to the capability-pilot framing, matching OVERVIEW.md line 23.

### 🔴 F3 — Backlog OVERVIEW intro says "40 tickets" (should be 41)
- **`skoda/OVERVIEW.md` line 3:** *"10 epics, **40 tickets**"* — but SKODA-206 was added; the register total, epic-index, and effort tables all say **41 tickets / 189 SP**. Only the prose intro is stale.
- **Classification:** stale count. **Fix:** "40 tickets" → "41 tickets".

### 🟡 F4 — PR count: 1,659 vs 1,661 (framing, verify not fix)
- `SKODA-STORYBOARD-ANALYSIS-OVERVIEW.md` line 43 uses **1,659** (full-crawl *scanned* pages) in the template table; line 38 and the drilldown use **1,661** (REST `X-WP-Total`). The 2-page gap = the dead/redirect-loop URLs that failed to scan (documented in the inventory).
- **Classification:** **not an error** — different denominators (crawled vs REST total), both correct in context. **Optional:** add a one-word "(scanned)" to line 43 to preempt confusion.

### 🟡 F5 — Footprint wording varies slightly
- "≈80–110 GB" appears with "order-of-magnitude" caveat in most places; verify no instance states it as a firm number. (Sweep found the caveat present where it matters.) **Classification:** likely clean; low priority.

---

## 4. Clean Bill (criteria confirmed consistent everywhere)

C1 facets (15 + history) ✅ · C2 media scale ✅ · C3 footprint (caveated) ✅ · C4 glossary (softened everywhere) ✅ · C5 banner per-market ✅ · C6 skoda-analytics ✅ · C7 social-feed ✅ · C8 header/ARIA ✅ · C9 story/Page-Builder ✅ · C10 speeches ✅ · C11 real-product-manager ✅ · C12 EN counts ✅ (see F4 framing) · C13 i18n ✅ · C14 DA no-spreadsheet-index ✅ · C17 backlog 41/189 SP in tables ✅ (intro prose = F3) · C18 zero-cookies ✅ · C19 CDN ✅.

**Historical-OK (correctly preserved, not defects):** `~52k` and `14 facets` inside `SKODA-ADVERSARIAL-REVIEW.md` (annotated) and the `SKODA-MEDIA-DEEP-DIVE.md` before/after column; the header dossier's own "prior docs over-described the megamenu" note (the rich-panel overclaim was already removed elsewhere — C11-header sweep clean).

---

## 5. Recommended Fixes (grouped; for a separate propagation pass)

**Safe auto-fixes (mechanical, no judgement):**
1. **F1** — replace `~13–25 AI-days` → `~30–50 AI-days` and `~45–68 manual` → `~60–90 manual` in: OVERVIEW.md (lines 23, 145), OVERVIEW.html (Phase A card), EDS-DA-ARCHITECTURE.md (line 214). *(4 instances.)*
2. **F3** — OVERVIEW.md (backlog) line 3: "40 tickets" → "41 tickets".

**Judgement-call fixes:**
3. **F2** — reword OVERVIEW.html line 244 recommendation from "narrow English pilot — one press-release article" to the capability-pilot framing (align to OVERVIEW.md line 23). *(Prose rewrite, not a swap.)*
4. **F4 (optional)** — annotate OVERVIEW.md line 43 PR count "1,659 (scanned)" to distinguish from the 1,661 REST total.

**Effort:** all four are minutes; F1+F3 are pure find-replace, F2 is a one-sentence rewrite.

---

## 6. Residual / Notes

- **The effort drift (F1) is the meaningful one** — it's the exact failure mode this audit was meant to catch: a number aligned in *some* artifacts (deck, backlog) but not the *narrative* docs (overview, architecture). Left unfixed, a stakeholder reading the OVERVIEW sees ~13–25 while the deck and backlog say ~30–50.
- **Pattern (again):** corrections propagate reliably to *tables and dossiers* but occasionally miss *prose summaries and recommendation paragraphs* — worth a targeted prose sweep as the standard last step of any future correction round.
- `[RUNTIME-UNCONFIRMED]` items (a11y, modal focus, LCP/CLS) remain open by design — not audit defects.
- No source re-probing was needed; this was a pure internal-consistency pass.

*(Audit only — no docs edited. On request I'll apply F1+F3 as safe find-replaces and F2 as a rewrite.)*
