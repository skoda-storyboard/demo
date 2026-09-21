# Škoda Storyboard → AEM Edge Delivery — Analysis Overview

> ⚠️ **ARCHIVED / SUPERSEDED (2026-09-14).** This prior consolidated overview has been **superseded by the canonical findings doc [`analysis/SKODA-MASTER.md`](../analysis/SKODA-MASTER.md)** (see its §16 Document Map). Retained as a historical reference point only — do not rely on it for current status; some claims (e.g. "Series is not a template") are corrected in MASTER.

**The capstone summary of the discovery engagement.**
**Date:** 2026-09-04 · **Scope target:** `https://www.skoda-storyboard.com/en/`
**Nature:** Analysis only — no content imported, no code generated, no Git operations. This report **synthesizes** six detailed reports (see §10); it introduces no new claims.

> **Note (2026-09-04):** A later adversarial review (`SKODA-ADVERSARIAL-REVIEW.md`) corrected several findings, applied inline below: **story pages use SiteOrigin Page Builder** (nested panel/widget layout — import must flatten it); a **gallery lightbox** exists (2nd JS breakpoint); **"speeches" is not a content type** (removed from scope); **`real-product-manager` is licensing, not commerce** (no-commerce confirmed, D8 commerce sub-question closed); the media library is now **measured** (`SKODA-MEDIA-DEEP-DIVE.md`): **~42.3k attachment pages / ~28.3k distinct logical items / ~200k+ physical files** (≈80–110 GB), not ~52k; and **translation is uneven per-item** (not a uniform 6× multiple).

---

## 1. Executive Summary

Škoda Storyboard is Škoda Auto's **global editorial + press/media newsroom** — not an e-commerce site. It runs on a **large, mature, heavily-customized WordPress** platform with a deep suite of bespoke plugins, **6 languages** (Polylang), an **Elasticsearch-backed** search/listing layer, and a large media library (**~28,300 distinct assets / ~200k+ physical files**, measured).

**Three things define this migration:**

1. **Scale.** ~**13,300 editorial URLs** across 6 languages (~**3,500 in English**), plus a measured **~42.3k media attachment pages / ~28.3k distinct assets (~200k+ physical files, ≈80–110 GB)**. This is a template-driven, multi-phase programme — not a one-shot lift.
2. **Backend coupling.** The site's most visible features are **not static**: listings and search run on **ElasticPress**; promos are a **46-banner ad-serving platform**; the newsletter is a **subscriber account system**; the press area has a stateful **media-cart**. None have a 1:1 equivalent in EDS's static model — each needs a deliberate "rebuild-as-service vs. drop-for-demo" decision.
3. **Technical debt in the front end.** Everything is **jQuery**-based with three heavyweight libraries (Owl Carousel, Isotope, a 174 KB React banner bundle) and a **295 KB stylesheet** carrying 168 `!important`s and 30 breakpoints. There is **no lift-and-shift** — blocks get rebuilt clean on EDS.

**The good news:** the content model is coherent and repetitive (a handful of templates, ~10 real content blocks), the hero uses a real `<img>` (LCP-friendly), responsiveness is **mostly CSS-only**, and the English subset is only ~26% of the site — a very tractable demo.

**Recommendation:** proceed with a **capability pilot (EN)** — stand up the **reusable block set** (teaser/cards, hero, gallery, embeds) + header/footer, validated on a press-release article + its listing (and a couple of representative pages), forcing early resolution of the two hardest problems (query-index listings/search) at low volume. This is a **capability build (~13–25 AI-days / ~45–68 manual)**, not a one-page proof-of-concept. Story/Page-Builder flattening and the four backend-dependent features are deferred to later phases (§9).

**Overall complexity: HIGH** — driven by scale and backend integrations, not by the page design itself.

---

## 2. The Site at a Glance (reconciled fact base)

| Dimension | Finding | Confidence |
|---|---|---|
| Site type | Editorial / press newsroom (not commerce) | Confirmed |
| Backend CMS | **WordPress** (`/wp-json/`, `rel=shortlink`, `/wp/wp-includes/`) | Confirmed |
| Rendering | Server-rendered HTML + jQuery + custom mu-plugins; **not** a SPA | Confirmed |
| Languages | **6** — cs, sk, en, de, sr, sl (Polylang Pro) | Confirmed |
| Editorial URLs (all languages) | posts 5,282 · press releases 6,715 · pages 551 · Škodapedia 725 → **~13,300** | Confirmed (REST) |
| Editorial URLs (**English**) | posts 1,312 · press releases 1,661 · pages 337 · Škodapedia 189 → **~3,500** (26% of site) | Confirmed (REST) |
| Media assets | **42,275** attachment pages (55 sitemaps) → **~28,300 distinct logical items**; **~200k physical files** with derivatives (≈80–110 GB) — *order-of-magnitude; multiplier varies by image* | **Measured (counts); footprint extrapolated** |
| Search / listings | **ElasticPress / Elasticsearch** (`x-elasticpress-search: true`; `ep_integrate` in listing payload) | Confirmed |
| EN pages crawled for blocks | **3,496** scanned (3,501 enumerated, 8 dead URLs) | Confirmed |

**Templates (EN, from full crawl):** Press release (1,659 · 47.5%), Story (1,312 · 37.5%), Page (334 · 9.6%), Škodapedia (189 · 5.4%), Listing/index (~7 pages). *"Series" and "Podcast" are not templates — they redirect into the story/press-release templates.* — ⚠️ **CORRECTED 2026-09-14:** Series IS a real 2-level template (directory `/series-2/` + hub `/series/<slug>/`); see SKODA-MASTER §3 / D18. Podcast unverified.

---

## 3. Block Landscape (consolidated)

~**10 content blocks + ~5 chrome elements**. Mechanism and risk reflect the final (post-verification) technical review.

| Block | Mechanism | Variants | EN coverage | Effort / Risk |
|---|---|---|---|---|
| **Cards / Teaser** | JS-light + Isotope | overlay, media, toolbar | 91% | Low–Med 🟡 (media-cart coupling) |
| **Hero** | **CSS-only** (real `<img>`) | image | 45% | Low 🟢 |
| **Gallery** | **JS-heavy** (Owl + width→columns) | — | 50% | Med–High 🟠 |
| **Carousel / Promo** | JS-light | — | 7% | Med 🟡 (auto-rotate a11y) |
| **Embeds** | JS-light (IntersectionObserver) | Vimeo, YouTube, Buzzsprout, Spotify | ~13% | Low–Med 🟢 |
| **Tags** | CSS-only | — | 83% | Low 🟢 |
| **Parallax** | JS (scroll) | — | 47% | Low 🟢 (drop/simplify) |
| **Škodapedia glossary** | JS-medium | term-detail + A–Z filter | 189 pgs | Med 🟡 (accessible modal) |
| **Faceted listing** | **Backend (ElasticPress)** | taxonomy, pagination | 7 pgs | **High 🔴** |
| **Media-cart actions** | **Backend** | — | 91% | **High 🔴** |
| **Promo banner** | **Backend (ad platform)** | sidebar/widget/positional | 47% | **High 🔴** |
| **Newsletter** (chrome) | **Backend (account)** | widget/shortcode | site-wide | **High 🔴** |
| Header/mega-menu, Footer, Social, App badges (chrome) | JS behavior / static | — | site-wide | Low–Med 🟡 |

**Responsive:** overwhelmingly **CSS-only** (295 KB stylesheet, 284 media queries, mobile-first). The genuinely JS-driven responsive behaviors are in the **gallery** — both the column count by width **and** a full-screen **lightbox** (`sb-gallery-lightbox`, `width()<=767`), the latter uncovered by the adversarial review. No block swaps DOM per breakpoint — ports cleanly to EDS's single-markup model.

> **Story-template correction (adversarial review):** story pages (37.5% of EN pages) are **not** linear HTML — they are built with **SiteOrigin Page Builder** (nested `so-panel`/`panel-grid`/`so-widget-*` trees, 13–19 panels each). The story importer must **flatten the builder layout** into EDS sections/blocks — a materially higher effort than a flat-HTML parse, and story-only (press-release/Škodapedia/home are unaffected).

**Front-end debt to retire, not port:** jQuery everywhere; Owl Carousel, Isotope, 174 KB React (banners); 168 `!important`; 30 breakpoints; JS text-truncation (`dotdotdot`); `padding-bottom` ratio hack (no `aspect-ratio`); `:only-child` link detection; a fragile `getComputedStyle(':after').content === 'flickity'` CSS↔JS flag; an unthrottled parallax scroll handler.

---

## 4. Backend & Integrations (the non-static systems)

These drive most of the risk. Contracts below were **live-replayed** during the technical review.

| System | What it really is | EDS implication |
|---|---|---|
| **ElasticPress** | Powers **both** search *and* listing "Load more" (`ep_integrate:true`), across **15 taxonomy facets**; deep-links pagination via `history.pushState` | Replace with published **query-index** + client faceting, or hosted search. #1 prototype. |
| **Banner platform** (`skoda-banners/v1`) | **Per-market ad server** — locale-scoped campaigns (cs 51 / en 46 / sk 2 / de 0 / sr 0 / sl 1), content-**tag** targeting, geo-blocking, frequency capping, popup delay/scroll triggers, click-tracking redirects, **174 KB React** | Full ad-serving integration — **not** a block. Rebuilt service/SDK must be locale- & tag-aware. Keep as client-side call or drop for demo. |
| **Newsletter** (`newsletter/v1`, mailguide.cz) | **Subscriber account system**: create/login/logout + subscription save/extend; consent + honeypot | Backend service + GDPR/consent. Do not reduce to a static form. |
| **Media-cart** (`media-cart/v1`) | Session/cookie-stateful; add/download press assets; per-teaser `data-*` hooks | No static equivalent; rebuild as service or drop. Couples into every teaser. |
| **Consent / analytics** | OneTrust (consent + geo), Google Tag Manager (`GTM-M5GMBWF`), Hotjar | Re-integrate scripts (delayed phase). |
| **CDN / DAM** | `cdn.skoda-storyboard.com` + CloudFront/S3 | Maps to EDS media handling; ~28.3k assets / ~200k+ physical files = heaviest lift (see §5). |

**Custom REST namespaces confirmed:** `newsletter`, `media-cart`, `mediakit`, `skodapedia`, `speeches`, `skoda-banners`, `sowb`, `pll` (Polylang) — the true migration surface.

---

## 5. Media (now reviewed in full — see `SKODA-MEDIA-INTEGRATION-REVIEW.md`)

- **~42,275 attachment pages → ~28,300 distinct logical items** (measured); **~200k+ physical files** with the 8-size derivative ladder (≈80–110 GB total, ≈34 GB masters-only), JPG-dominant — the **single heaviest migration workstream**. Galleries on ~1,510 press-release pages hold the bulk.
- **The CDN is a dumb origin cache, not an image service.** Header probes confirmed `cdn.skoda-storyboard.com` (S3 + CloudFront, 1-year immutable) **ignores all transform hints** — `?w=`, `?resize=`, `?format=webp`, and `Accept: image/webp` all return identical original bytes. Responsive derivatives are **pre-baked by WordPress at upload** (8-size ladder, 272→2560w), served via `srcset`/`sizes` with **no `<picture>` and effectively no webp/AVIF** (478 JPG vs 2 webp sampled).
- **Content images → EDS author pipeline = a modernization win.** EDS auto-generates `<picture>` + webp + on-the-fly widths from a single original, so migrating them *upgrades* performance rather than porting like-for-like. Repo gotcha: `<img>` must be a **direct child of `<div>`** (not inside `<p>`) or EDS won't wrap it.
- **Downloadable binaries are the hard part.** Press pages carry large **PDFs (28 MB annual report seen), hi-res JPGs, and MP4 video** via a tracked `/direct-download/` route. These must be **linked / DAM'd, NOT run through the image pipeline** — and they couple to the media-cart.
- **Recommended strategy:** **on-demand, in-use-only, EN-first, masters-only** ingestion (seeded from `SKODA-EN-BLOCK-DATASET.csv`) rather than migrating all ~28.3k / ~200k+ files; **drop the derivative ladder** (EDS regenerates webp + widths — halves the footprint); reference-in-place / DAM-link the large binaries. Avoids migrating archival dead weight while modernizing the images that actually render.
- *Note: counts are from full sitemap enumeration + sampled file weights (`wp/v2/media` count endpoint still times out). Footprint (≈80–110 GB) is a medium-confidence extrapolation — see `SKODA-MEDIA-DEEP-DIVE.md`.*

---

## 6. Search & Listings — the core decision

- **Feasible with an EDS query-index** for the demo: type + **15 taxonomy facets**, sort, and "Load more" all map to a published per-locale `query-index.json` filtered client-side. At EN volume (~3,500 items) this is tractable.
- **What an index cannot replicate:** full-text **body** search, typo/fuzzy matching, and relevance ranking that ElasticPress provides.
- **Decision:** demo = index over title/summary/tags (accept reduced recall); production = keep a hosted search (Algolia/Elastic/Adobe) fed by the index if body-level relevance is a hard requirement. Index and external search are **not** mutually exclusive.

---

## 7. Unified Risk Register (merged & ranked)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Scale (13k+ editorial, ~28.3k media / ~200k+ files, 6 langs) underestimated | High | High | Template-driven phasing; EN-first; masters-only; automate import |
| R2 | Four backend features (media-cart, banners, newsletter, favorites) have no static equivalent | High | High | Early rebuild-vs-drop decision per feature (§8) |
| R3 | Search/listings on ElasticPress across 15 facets | High | High | Prototype query-index in pilot; decide hosted-search need |
| R4 | Media/DAM strategy for ~28.3k assets / ~200k+ files (≈80–110 GB) + hi-res downloads | High | High | **Measured & reviewed** — recommend on-demand/in-use-only/masters-only ingestion + DAM-link large binaries; still need DAM owner (§8 D5) |
| R5 | Front-end debt (jQuery, Owl, Isotope, React, CSS) → full rebuild | High | Med | Re-derive tokens; rebuild blocks vanilla; don't port |
| R6 | Multilingual (6 langs) multiplies every estimate | High | High | Confirm locale scope before estimating; locale-extensible structure |
| R7 | Auto-rotating carousels & modals fail WCAG (pause/focus-trap) | Med | Med | Rebuild with controls + focus management |
| R8 | Unstable cross-locale redirects; 8 dead EN URLs | Med | Med | Build URL lists from sitemaps/REST only; audit redirects |
| R9 | Gallery responsive JS (column-by-width) needs reimplementation | Med | Med | `matchMedia`/CSS grid rebuild |
| R10 | `[RUNTIME-UNCONFIRMED]` checks not yet done (no browser this session) | Med | Low–Med | Short browser follow-up (see §8) |

---

## 8. Key Decisions Required (consolidated)

- **D1 — Language scope:** EN-only for phase 1, or all 6 from the start?
- **D2 — Media-cart:** rebuild as a service, or drop for the demo?
- **D3 — Banners:** keep the ad-serving platform (client-side API), or drop for the demo?
- **D4 — Newsletter:** re-integrate the subscriber/account service (with consent), or stub for the demo?
- **D5 — Media/DAM:** measured — **~28.3k logical assets / ~200k+ physical files, ≈80–110 GB** (≈34 GB masters-only). Review recommends **on-demand / in-use-only / masters-only** ingestion (drop the derivative ladder — EDS regenerates it) with large PDF/MP4/hi-res binaries **linked/DAM'd, not optimized**. Still needs a call on **where the DAM lives and who owns it**, plus whether the legacy CDN can be referenced in place (note: **no CORS header**) and for how long.
- **D6 — Search:** accept index-based search (title/summary/tags), or procure hosted search for body-level relevance?
- **D7 — Content cutoff:** full archive, or content from a date forward?
- **D8 — Scope check:** ~~confirm no hidden commerce~~ **RESOLVED** — `real-product-manager` is a plugin licensing/update client, **not commerce** (adversarial review); no-commerce confirmed. **"speeches" removed** — it is not a public content type. Remaining: identify owners for **Škodapedia and press-kits** content models (press-kits = filtered `press_release`).

**Outstanding browser follow-up (`[RUNTIME-UNCONFIRMED]`):** focus-trap correctness (glossary/banner modals), auto-rotate pause controls, mega-menu hover timing, hero overlay contrast, and layout-shift when AJAX/banners inject — to be confirmed once a headless browser is available.

---

## 9. Recommended Path Forward

- **Phase A — Capability pilot (prove the reusable model), EN only:** this is **not** a single-page throwaway — it stands up the **reusable EN capability** on a few representative pages. Build the core blocks — **teaser/cards, hero, gallery, embeds** — plus **header + footer** fragments; prove **one query-index listing** (replacing ElasticPress "Load more") and **one index-search** slice; validate on a **press-release article + the press-release listing** (+ a couple of representative pages). **Story/SiteOrigin-Page-Builder flattening is deferred to Phase B** (hardest template — not needed to prove the model). Defer media-cart/banners/newsletter (plain download links, no cart). *This is what the ~13–25 AI-day / ~45–68 manual-day effort estimate prices — the capability, not "one article."*
- **Phase B — Editorial at scale:** remaining templates (story — incl. flattening SiteOrigin Page Builder layouts, Škodapedia, press-kits); automate bulk import from sitemaps/REST; wire consent + analytics.
- **Phase C — Backend features:** media-cart, banners, newsletter, favorites, faceted search — each per its §8 decision.
- **Phase D — Localization:** extend to the other 5 languages once the EN template set is stable (structure is locale-prefixed and index-per-locale from day one).

**Build-priority order:** Cards/Teaser → Hero → Gallery → Faceted-listing-over-index → Embeds → Carousel → Škodapedia glossary → Header/Footer chrome → (deferred) backend features.

---

## 10. Document Map & Provenance

| For detail on… | See |
|---|---|
| Site shape, backend, scale, integrations, first risk register | `SKODA-STORYBOARD-DISCOVERY.md` |
| Search feasibility, EN-only scope, template block-gap review | `SKODA-STORYBOARD-DRILLDOWN.md` |
| Full EN block audit (3,496 pages), variants, template×block matrix, CSS-vs-JS responsive analysis | `SKODA-EN-BLOCK-INVENTORY.md` |
| Per-block critical review, live backend contracts, CSS/JS debt, corrections | `SKODA-BLOCK-IMPLEMENTATION-REVIEW.md` |
| Media types, CDN/derivative pipeline, downloads, EDS integration matrix, scale strategy | `SKODA-MEDIA-INTEGRATION-REVIEW.md` |
| Adversarial red-team: falsification log, corrections, newly-found gaps | `SKODA-ADVERSARIAL-REVIEW.md` |
| Measured media: counts, footprint, file weights, video/PDF, CDN/CORS, import footprint | `SKODA-MEDIA-DEEP-DIVE.md` |
| Complex dynamic systems: API surface, data contracts, targeting, integration boundary | `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` |
| DA/Experience-Workspace fit-based target architecture | `SKODA-EDS-DA-ARCHITECTURE.md` |
| Raw per-URL block data / aggregates | `SKODA-EN-BLOCK-DATASET.csv`, `SKODA-EN-BLOCK-AGGREGATE.json` |

**Refinements made during the engagement (final positions shown above):**
- Promo banner: "Medium block" → **backend ad-serving platform**.
- Newsletter: "form + service" → **subscriber account system**.
- ElasticPress: "powers search" → **powers search *and* listings** (`ep_integrate`).
- Škodapedia A–Z filter: earlier 1,866 count was a **false positive** (collision with `NewsletterFormWidgetV2`); real glossary = **189** Škodapedia pages.
- "Series"/"Podcast": **not templates** (redirect into story/press-release). — ⚠️ **CORRECTED 2026-09-14:** Series IS a real 2-level template (see SKODA-MASTER §3 / D18); Podcast unverified.
- Media: dedicated review now **complete** — CDN confirmed a **pass-through cache** (no dynamic transforms); EDS pipeline is an *upgrade* for content images; large PDF/MP4/hi-res downloads must be **linked/DAM'd, not optimized**.
- **Adversarial review corrections:** story pages use **SiteOrigin Page Builder** (import must flatten a nested widget layout); a **gallery lightbox** exists (2nd JS breakpoint); **"speeches" is not a content type** (dropped); **`real-product-manager` = licensing, not commerce** (D8 commerce closed); **translation is uneven per-item** (not a clean 6× multiple).
- **Media deep-dive (measured):** the "~52k" estimate is replaced by **42,275 attachment pages → ~28,300 distinct logical items** (5 locales) / **~200k+ physical files** with the derivative ladder (**≈80–110 GB**, ≈34 GB masters-only); self-hosted MP4 uses a **signed-S3 download flow**; the CDN has **no CORS**; alt-text coverage is **96%**, `data-caption` **53%** (importer must read it).
- **Complex-systems deep-dive:** the banner platform is a **per-market ad server** (locale-scoped campaigns + content-tag/geo/frequency targeting), not a global 46-banner set; the **Škodapedia glossary directory + A–Z/category filter are static (client-side); term detail is a thin API fetch** (`skodapedia/v1/term/{id}` → ready-rendered HTML) — **eliminable by pre-baking terms as `/modals/` docs** → fully static; **`mediakit/v1/mediabox`** feeds press-page downloads as a **static block** (media-cart only needed for cross-page bulk collection); the newsletter is a **10-route** account system; the site sets **zero cookies on anonymous load** (all state opt-in → EDS pages stay cacheable).
- **Search facets = 15** (not 14): model, bodywork, derivative, motorsport, equipment, technology, years, view, company, concept, environment, happening, history, sponsorship, vip.
- **Media physical-file/footprint figures are order-of-magnitude** — the per-image derivative multiplier is variable (large photos have ~8 sizes; small/odd-ratio images far fewer), so ~200k files / ≈80–110 GB is a rough upper band, not a firm count.

**Method & limitations:** evidence from public pages, HTTP headers, the WordPress REST API, XML sitemaps, a full EN crawl (3,496 pages), source JS/CSS inspection, live endpoint replay, and CDN header probing. **No headless browser** was available this session, so visual/rendered-layout checks remain `[RUNTIME-UNCONFIRMED]`. The **media-integration review** (§5) is now complete. All findings are analysis-only; no Git operations were performed.
