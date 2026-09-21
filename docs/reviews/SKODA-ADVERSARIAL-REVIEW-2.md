# Škoda Storyboard — Adversarial Review #2 (Overclaim & Coverage-Gap Audit of the Docs)

**Target of this audit:** the current `SKODA-*` documentation set (not the source site).
**Predecessor:** `SKODA-ADVERSARIAL-REVIEW.md` (attacked the *early* findings). This pass attacks the *matured* docs — media deep-dive, DA architecture, complex-systems dossiers, effort tables, banner rebuild — most of which were written **after** the only prior red-team and were themselves unaudited.
**Date:** 2026-09-05
**Method:** falsification-biased. Each load-bearing claim → cheapest test that would break it → verdict (**confirmed / overstated / refuted / unverified**). Read-only, anonymous re-probing only where a specific claim needed testing. No browser, no auth, no mutation, no Git.

---

## 1. Verdict Summary

Attacked ~15 load-bearing claims + swept the set for consistency and coverage.

| Verdict | Count | Examples |
|---|---|---|
| **Held up (survived attack)** | 5 | zero-cookies (across 4 templates), no-CORS (jpg+pdf), derivative-multiplier for *normal* images, press-kit = no new block types, speeches-clean |
| **Overstated (real, but softer than written)** | 4 | "glossary fully static / no runtime API"; "masters-only *halves* footprint"; footprint ≈80–110 GB (single-sample confidence); "~60–70% AI compression" |
| **Refuted / needs correction** | 1 | derivative multiplier is **variable, not uniformly ~7–9** (small/odd-ratio images have far fewer) → the ~200k physical-file / GB figures are **over**-stated at the high end |
| **Internal inconsistency** | 1 | **block-count drift** — "8–10" (Discovery) vs "12–14 net-new" (Drilldown) vs "10 content + 5 chrome" (Overview/Inventory), never reconciled |
| **Coverage gaps (asserted, not examined)** | 7 | header/mega-menu & footer, cross-domain apps, forms-beyond-newsletter, SEO/redirect at scale, archives/feeds, live analytics contract, accessibility |

**Top new overclaims to fix:**
1. 🔴 **"Škodapedia glossary is fully static / no runtime API"** (in **6 docs**) — the term-detail panel actually **fetches `skodapedia/v1/term/{id}` on click**. The A–Z *directory list* IS inline/static (212 items in the HTML), but the detail interaction is an API call. Correct to: "list static; detail fetched (thin HTML fragment)."
2. 🟠 **Physical-file count (~200k–250k) & footprint (~80–110 GB)** rest on a "~7–9 derivatives/image" multiplier that is **only true for large photos** — a full-width hero I tested had **1** derivative, not 8. The multiplier is real for normal content images (verified: 8/8 exist, avg 7.1/srcset) but **variable**; the headline should widen the range and lower confidence.
3. 🟠 **Effort numbers & "~60–70% AI compression"** remain untested judgement in an exec deck — no new evidence either way; should stay explicitly labelled as planning estimates (they are, but the deck's precision implies more).

**Biggest coverage gap:** the **header/mega-menu + footer** have been called "chrome, build as fragments" in every doc but **never structurally analyzed** — yet the nav is one of the more complex builds (megamenu, 6-language switcher, mobile behavior). This is the largest un-opened box.

---

## 2. Overclaim Log (hypothesis → test → verdict)

| # | Claim (doc) | Test run | Evidence | Verdict |
|---|---|---|---|---|
| O1 | "Glossary fully static / no runtime API" (6 docs) | Fetched `/en/skodapedia/`; checked for term API refs + inline list | A–Z directory **inline** (212 `sp__list-directory__item`), BUT page references `skodapedia/v1/term` + `admin-ajax`; single `sp__term-detail__data` container → **detail fetched on click** | **Overstated** — list static, detail is an API fetch (thin HTML) |
| O2 | "~200k–250k physical files" (media deep-dive + propagated) | Probed named-size existence for 2 image bases | Normal content image: **8/8** sizes exist (multiplier holds); full-width hero: **1/8** (small source, no upscale) | **Overstated at high end** — multiplier is variable; true count likely **lower** than 200k |
| O3 | "Masters-only *halves* the footprint" | Logic check vs O2 | If many images have few derivatives, the ladder is *less* than half the bytes → masters-only saves **less** than "halves" implies (still a big win, just not necessarily 2×) | **Overstated** (directionally right) |
| O4 | "Footprint ≈80–110 GB / ≈34 GB masters" | Provenance check | Extrapolated from a ~280-file sample × an uncertain multiplier (O2) | **Overstated confidence** — keep as order-of-magnitude, widen band |
| O5 | "Zero cookies on anonymous load → cacheable" | 4 templates, `set-cookie` count | **0 across all 4** (home, PR, skodapedia, news) | **Confirmed** — *caveat:* OneTrust/GTM set cookies **client-side via JS** (not visible to an HTTP probe), so "zero cookies" is true for the *initial server response*, not the *running page*. Reword precisely. |
| O6 | "CDN has no CORS" | `Origin:` header on jpg + pdf | No `access-control-allow-origin` on either | **Confirmed** |
| O7 | "Banner = per-market ad server" | (from prior dive) locale counts + JS fns | cs 51/en 46/sk 2/de 0/sr 0/sl 1; tag/geo/freq functions | **Confirmed** (holds) |
| O8 | "Derivative multiplier ~7 per image" | srcset count on a PR | avg **7.1** candidates/srcset (min 5, max 8) | **Confirmed for normal images** (but see O2 — not universal) |
| O9 | "Press-kit needs no new blocks" | Opened an EN press-kit in depth | 59 `download` + 45 `gallery-item`; no new block types | **Confirmed** — press-kit = gallery + downloads (already-planned blocks) |
| O10 | Effort ranges + "~60–70% AI compression" (SITE-FACTS deck) | Assumption stress-test | Pure judgement; no measurement; depends on unresolved scope (langs, which services rebuilt) | **Unverified** — label as estimate (mostly is) |
| O11 | DA "spreadsheet indexing not supported" (architecture) | Re-read fetched `/developer/indexing` text | Doc explicitly states spreadsheet indexing "not supported in DA" | **Confirmed** (citation accurate) |

---

## 3. Coverage-Gap Register (asserted, never examined — ranked)

| # | Gap | Why it matters | Status | To close |
|---|---|---|---|---|
| G1 | **Header/mega-menu + footer structure** | Called "chrome/fragments" everywhere but never analyzed; nav is a complex build (megamenu data, 6-lang switcher, mobile) | **Never opened** | Structural dive on `nav`/`footer` markup + fragment model |
| G2 | **`skoda-analytics` live event contract** | High-risk cross-cutting dependency; catalog read from **minified strings**, not live `dataLayer` | Partial (JS-string only) | Needs browser capture + Škoda GTM spec |
| G3 | **Accessibility** | "WCAG gaps" asserted but **never tested** (contrast, keyboard, SR, focus) | Asserted, untested | Needs a browser + axe/manual audit |
| G4 | **Škoda cross-domain apps** (`sdrive`, charging calculators) | In CSP; could be embedded features = extra integrations | `[PARTIAL]`, open | Scoped crawl for embeds across model/company pages |
| G5 | **Forms beyond newsletter/search** | Only newsletter + search confirmed; contact/accreditation/event-reg unknown | Not swept | Grep forms across template sample (this pass: none found on PR/skodapedia/press-kit) |
| G6 | **SEO/redirect at scale** | hreflang checked on 1 page; dead-URL count (8) from a partial crawl; canonical chains unaudited | Sampled only | Bulk hreflang/canonical/redirect audit |
| G7 | **Archives / RSS feeds / date-taxonomy pages / AMP** | Enumerated as existing; never analyzed as templates | Not examined | Template analysis of archive/feed URLs |

**Partial closes this pass:** G5 — swept forms on 3 more templates (PR, skodapedia, press-kit): only newsletter + search present, **no new form types found** (raises confidence, not conclusive). G9-glossary — the "static vs API" question is now answered (O1).

---

## 4. Internal-Consistency Findings

| Finding | Detail | Fix |
|---|---|---|
| **C1 — block-count drift** | Discovery "**8–10** net-new"; Drilldown "**12–14** net-new"; Overview/Inventory "**~10 content + ~5 chrome**". Three framings, never reconciled. | Pick one canonical statement (e.g., "~10 content blocks + ~5 chrome ≈ 12–14 net-new vs boilerplate") and align all docs. |
| **C2 — ~52k mentions** | All remaining `~52,000` refs are in **legitimate historical/"corrected-from" contexts** (Adversarial #1, Media Deep-Dive before/after column). | ✅ No action — clean. |
| **C3 — speeches** | No doc still calls speeches a content type. | ✅ Clean. |
| **C4 — glossary "fully static"** | Claim present in **6 docs** (Discovery, Inventory, Impl-Review, Architecture, Complex-Systems, Overview) — all now **partially overstated** per O1. | Soften in all 6: "directory static; term detail = thin API fetch." |
| **C5 — deck vs source** | HTML decks carry measured media numbers + per-market banner (propagated correctly in prior passes). | ✅ In sync (spot-checked). |

---

## 5. Confidence-Calibration Table (stated vs warranted)

| Headline claim | Stated confidence | Warranted | Gap |
|---|---|---|---|
| 42,275 attachment URLs / ~28.3k logical | High (measured) | **High** | none — full enumeration |
| ~200k–250k physical files | implied firm | **Medium-low** | multiplier variable (O2) → widen to "~120k–250k, rough" |
| Footprint ≈80–110 GB | Medium | **Low-medium** | single-sample × uncertain multiplier |
| Glossary "fully static, no API" | stated as fact | **Overstated** | detail fetched on click (O1) |
| Zero cookies → cacheable | stated as fact | **True (server response)** | reword: client-side consent cookies exist |
| No CORS | stated as fact | **High** | confirmed on 2 asset types |
| Banner per-market ad server | High | **High** | confirmed |
| Effort ranges / AI % | "estimate" | **Estimate** | ok, but deck precision implies more |
| DA doc citations | High | **High** | spot-check accurate |

---

## 6. Recommended Corrections & Follow-ups (flagged for propagation — not auto-applied)

**Re-word (soften) across docs:**
1. **Glossary** (6 docs): "A–Z directory is static/inline; **term detail is fetched via `skodapedia/v1/term/{id}` on click** (a thin, ready-rendered HTML fragment — cheap, but not zero-API)." Fit stays 🔵, not 🟢.
2. **Physical-file/footprint** (media docs + propagated): widen to **"~120k–250k physical files, order-of-magnitude"** and **"footprint tens of GB (rough; masters-only materially smaller)"**; stop implying a clean 2× halving.
3. **Zero cookies**: "no cookies on the **initial server response** (consent/analytics set cookies client-side after load)."

**Actually investigate (real gaps):**
4. **Header/mega-menu + footer** structural dive (G1) — the biggest un-opened build.
5. **Accessibility** audit (G3) and **live `skoda-analytics` capture** (G2) — both need a browser.
6. **Cross-domain apps / archives / feeds** (G4, G7) — scoped crawls.

**Reconcile:** the **block-count** statement (C1) into one canonical figure.

---

## 7. Residual Unknown-Unknowns (honest boundary)

- **Browser-dependent (unchanged):** real a11y (contrast/keyboard/SR), live `dataLayer` event capture, banner/modal/carousel runtime, actual LCP/CLS, whether the glossary term-fetch is lazy or prefetched.
- **Auth-dependent:** newsletter subscriber flows, media-cart add/state, any editor-only endpoints.
- **Stakeholder-dependent:** true media-library rights, GTM event spec, DAM ownership, which locales/services are actually in scope.
- **Not-yet-crawled:** press-kit corpus at scale (1 opened), archive/feed templates, cross-domain embeds, full redirect/hreflang correctness.
- **Meta:** this audit is itself anonymous + no-browser — its own "confirmed" verdicts (zero-cookies, no-CORS) are confirmed *for the HTTP layer only*. The pattern from Adversarial #1 repeats: **claims verified by a direct probe held; claims resting on a single sample or inference (glossary-static, derivative multiplier, footprint) are the ones that bent.**

---

## Appendix — Evidence Captured This Pass

- Zero-cookies: `set-cookie` = 0 on `/en/`, PR, skodapedia, news (server responses).
- No-CORS: no ACAO header on a jpg and the 26 MB PDF with `Origin:` set.
- Derivative multiplier: PR image 8/8 named sizes exist, srcset avg 7.1 candidates; hero image 1/8 (small source).
- Glossary: `/en/skodapedia/` has 212 inline `sp__list-directory__item` + references to `skodapedia/v1/term` and `admin-ajax`; single `sp__term-detail__data` container.
- Press-kit: one EN press-kit opened — 59 `download`, 45 `gallery-item`, no new block types.
- Forms sweep (PR/skodapedia/press-kit): only `mailguide-subscribe` + `search-form` — no new form types.
- Consistency greps across all `SKODA-*.md/.html`: block-count drift (3 framings); ~52k only in historical contexts; speeches clean; glossary "fully static" in 6 docs.
- **Limitation:** anonymous, non-mutating, no browser; findings audit the docs, not a fresh site discovery.
