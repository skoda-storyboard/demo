# Škoda Storyboard → AEM Edge Delivery (DA / Experience Workspace) — MASTER Knowledge Document

**Status:** Canonical single source of truth. Consolidates the full `SKODA-*` engagement (14 reports + 2 decks + the `skoda/` delivery backlog) into one document, with the **latest corrected values applied throughout** and a completeness proof in `SKODA-MASTER-COVERAGE.md`.
**Date:** 2026-09-07 · **Target:** DA / Experience Workspace + EDS (not AEM Author / UE / JCR).
**Nature:** analysis, architecture & planning synthesis. No content imported, no code, no Git. Detail lives in the source docs (§16); this master supersedes their scattered/older figures.

---

## 1. Executive Summary

> **⏱ CLIENT-CONFIRMED SCOPE & DATES (Sept 2026 briefing) — see `SKODA-DELIVERY-PLAN.md` for the full milestone plan.** Two mission-critical dates: **functioning demo 15 Oct 2026** (front end working · approved **AEM Assets** · **blog posts replicated** · **media-cart replicated**) and **go-live 02 Jan 2027** (content fully migrated, authoring workflows running). Key confirmations that revise earlier findings: **media-cart is device-ID based, no login** (collect + zip-download) and is **required in the demo**, not deferred; **AEM Assets** is the approved-asset source (resolves DAM question); primary localization is **EN + CS** (DE/SK/SR/SL on-demand per local office; some articles single-language → selector shows only existing languages); nav is **metadata-tag-driven**; **no user auth / no personalization / no edge functions** today (authors auth via Škoda IDP); consent = **OneTrust**; tags = **GA + Facebook pixel + Yoast SEO**; video stays **Vimeo/YouTube embeds**; design system in **Figma** + **Material UI** components (showcase **Figma-to-AEM**). **NEW requirement:** **content embargoes** — confidential media-room items visible only to select authors until a release date (no native EDS gate → staged-publish; see delivery plan §4).

Škoda Storyboard is Škoda Auto's **global editorial + press/media newsroom** — not e-commerce. It runs on a **large, mature, heavily-customized WordPress** platform with a deep bespoke-plugin suite, **6 languages** (Polylang), an **Elasticsearch (ElasticPress)** search/listing layer, and a large media library.

**Three things define the migration:**
1. **Scale** — ~**13,300 editorial URLs** across 6 languages (~**3,500 EN**), plus a measured **~42,275 media attachment pages / ~28,300 distinct logical items / ~200k physical files** (order-of-magnitude).
2. **Backend coupling** — the most visible features are **not static**: ElasticPress search+listings, a **per-market banner ad platform**, a **subscriber-account newsletter**, a **media-cart**, and a **bespoke `skoda-analytics` layer**. Each is a deliberate rebuild-as-service vs drop decision.
3. **Front-end debt** — everything is **jQuery** + heavyweight libs (Owl Carousel, Isotope, 174 KB React banners) + a 295 KB stylesheet (168 `!important`, 30 breakpoints). **No lift-and-shift** — blocks are rebuilt clean.

**Good news:** the content model is coherent and repetitive (~5 templates, ~10 content blocks + ~5 chrome), hero uses a real `<img>` (LCP-friendly), responsiveness is **mostly CSS-only**, header/footer are simpler than first feared, and EN is only ~26% of the site.

**Recommendation:** a **capability pilot (EN)** — stand up the reusable block set + chrome + one query-index listing + index search + static downloads + Škodapedia glossary, validated on a press-release article + its listing. **Story/SiteOrigin-Page-Builder flattening and the four backend services are deferred.** Overall complexity **HIGH**, driven by scale + backend integrations, not page design.

---

## 2. Site Profile & Scale (reconciled fact base)

| Dimension | Value | Confidence |
|---|---|---|
| Site type | Editorial / press newsroom (not commerce) | Confirmed |
| Backend | **WordPress** (`/wp-json/`, `rel=shortlink`, `/wp/wp-includes/`); server-rendered + jQuery + custom mu-plugins; **not a SPA** | Confirmed |
| Modern layer | Speculation-Rules prefetch; server-side GTM sync (Cloud Functions) | Confirmed |
| Languages | **6** — cs, sk, en, de, sr, sl (Polylang Pro); **uneven per-item translation** (not a uniform 6×) | Confirmed |
| Editorial URLs (all langs) | posts 5,282 · press releases 6,715 · pages 551 · Škodapedia 725 → **~13,300** | Confirmed (REST) |
| Editorial URLs (**EN**) | posts **1,312** · press releases **1,661** · pages **337** · Škodapedia **189** → **~3,500** (~26%) | Confirmed (REST) |
| Media | **42,275** attachment pages (55 sitemaps) → **~28,300** distinct logical items (5 locales; SL absent) → **~200k physical files** with the derivative ladder (**order-of-magnitude**) | Measured (counts); footprint extrapolated |
| Media footprint | **≈80–110 GB** total / **≈34 GB** masters-only (order-of-magnitude; multiplier varies by image) | Extrapolated |
| Search/listings | **ElasticPress / Elasticsearch** (`x-elasticpress-search`; `ep_integrate` in load-more) | Confirmed |
| Anonymous state | **Zero cookies on anonymous server response**; all stateful features opt-in (consent cookies set client-side) | Confirmed |

---

## 3. URL & Template Inventory

**Sitemap** at `/sitemap_index.xml` (301 from `/sitemap.xml`): 55 attachment sitemaps + 4 post + 6 press_release + 3 press_kit (~2,927) + page + ~20 taxonomy sitemaps.

**Templates (EN, from full crawl of 3,496 pages):**
| Template | Pages | Share |
|---|---|---|
| Press release | 1,659 (scanned) | 47.5% |
| Story (editorial post) — **SiteOrigin Page Builder** | 1,312 | 37.5% |
| Page | 334 | 9.6% |
| Škodapedia | 189 | 5.4% |
| Listing / index | ~7 | — |

> **"Page" family — 5 named sub-types** *(surfaced 2026-09-14, previously subsumed in the 334 "Page" count):* **board-of-management** (exec-bio accordion), **annual-reports** (reverse-chron download list), **company-logo** (36-asset brand grid, PDF+PNG), **skoda-media-services-application** (app-promo), **contacts** (department-grouped directory). Each needs a net-new block; deferred to M2 (SKODA-810, decision D18).

- **"Series" IS a real 2-level template** *(corrected 2026-09-14 — 22-URL analysis; supersedes the earlier "Series 301-redirects" claim)*: a series **directory** (`/series-2/`, ~20 series cards) → a series **hub** (`/series/<slug>/`, e.g. `125-years-of-motorsport`, curated story-card grid). Both render real pages, not redirects. **Podcast** remains unverified in this batch — still assumed to 301 into story/press-release (re-check before relying on it).
- **Press-kits** = filtered view of `press_release` **for the REST data source only** (`wp/v2/press_kit` → 404) — **but the *rendered pages ARE a real `press_kit` post type*** *(corrected 2026-09-15, live DevTools — `../ui-specs/_TEMPLATES.md`)*: body classes `single-press_kit`, hub `press_kit-template-template-tiles`, sub-pages `press_kit-template-default`. So "not a CPT" is a **REST-API-only** statement, not a template statement. The **page composition is a distinct type** *(verified 2026-09-14)*: a hub landing (TOC of 8 chapters + resource tabs + WhatsApp/ZIP) plus chaptered sub-pages that carry a persistent chapter sub-nav, technical-spec tables, and a large Media Box (84 images / 6 PDFs on the Epiq exterior sub-page). "= press_release" holds for the REST source, not the template.
- **"speeches"** = a feature plugin, **not a public content type** (absent from `wp/v2/types`).
- **Cross-locale redirects** are unstable (e.g. `/en/models/…` → a Slovenian article); **8 dead EN URLs** (redirect loops/404s). Build URL lists from sitemaps/REST, never nav.
- Root routing is **`Accept-Language`-negotiated** (`/` → `/de/`, `/cs/`…).

**Custom post types (4 public):** `post`, `page`, `press_release`, `skodapedia`.

---

## 4. Block Inventory (full-crawl, 3,496 EN pages)

**~10 content blocks + ~5 chrome elements.** Coverage from the signature crawl (`SKODA-EN-BLOCK-DATASET.csv`).

| Block | Mechanism | Variants | EN coverage | EDS mapping / effort |
|---|---|---|---|---|
| **Cards / Teaser** | JS-light + Isotope | overlay, media, toolbar | 91% | Block Collection Cards + variants · Low–Med (media-cart coupling) |
| **Hero** | **CSS-only**, real `<img>` | image | 45% | Hero block · Low |
| **Gallery** | JS-heavy (Owl + width→columns) **+ lightbox** (`sb-gallery-lightbox`, `width()<=767`) | — | 50% | New block + `/modals/` lightbox · Med–High |
| **Carousel** ("Series"/related) | JS-light | — | 7% (story) | New carousel block · Med |
| **Embeds** | JS-light (IntersectionObserver) | Vimeo, YouTube, Buzzsprout, Spotify | ~13% | Embed autoblock + native lazy; keep `dnt=1` · Low–Med. **All video/audio externally hosted (no MAM/AEM-Assets video) → zero video-migration workstream; no player to rebuild; video not in the media footprint.** |
| **Tags** | CSS-only | — | 83% | Tags/metadata block · Low |
| **Parallax** | JS (unthrottled scroll) | — | 47% | Drop/simplify (decorative) · Low |
| **Škodapedia glossary** | JS-medium | directory + A–Z/category filter + term-detail modal | 189 pgs | New block; directory+filter **static**, term detail thin fetch (pre-bakeable to `/modals/` → static) · Med |
| **Faceted listing** | **Backend (ElasticPress)** | taxonomy, pagination | ~7 pgs | query-index + client faceting · **High** |
| **Media-cart actions** | **Backend** | item | 91% | Service (or drop) · High |
| **Promo banner** | **Backend (per-market ad server)** | sidebar/widget/positional | 47% | Service/SDK, not a block · High |
| Header/mega-menu, Footer, Social, App badges (chrome) | JS behavior / static | — | site-wide | Fragments · Low–Med |

**Net-new blocks surfaced by the 22-URL analysis (2026-09-14, all unbuilt):** series-directory grid + series-hub grid (Series template, → M1 SKODA-207); press-kit index/TOC + persistent chapter sub-nav + technical-spec table (press-kit template, SKODA-805/808); exec-bio accordion, download-list, brand-asset grid, app-promo, contact-directory (the 5 "Page" sub-types, → M2 SKODA-810). The **faceted-listing engine** (COM07/MR-L02/L03) is confirmed as one shared component underlying the MR **news/images/videos/search** listings — but **not** the STO **category/tag archives**, which (corrected 2026-09-15, `../ui-specs/template-category-archive.md`) are a simpler hero + card-grid + pagination with **no facet panel** (own template, SKODA-209). Likewise the **model page** is a real `skoda_model` CPT (hero + icon nav + 5 related rails, SKODA-208), not a listing; **gallery+lightbox and Vimeo embed** (already in §4 as adapt-effort) are the per-item renderers the Images/Videos listings and full-fidelity stories depend on.

**Deep page-analysis pass (2026-09-14, 10 parallel agents over MR-home / Model / Series×2 / News / Images / Videos / Press-kit hub+chapter) — refinements + additional net-new variants:**
- **MR home = 7 content rails**, NOT hero+featured as two: the top is **one static Featured promo** (hero-equivalent) + **6 Flickity carousels** (News, Images, Videos, Models, Press Kits, Latest Stories). **No lightbox on MR home** (zoom = download buttons). Media-cart affordance is pervasive (per-card add/remove + Original/1920px download).
- **New variants to add:** `cards-media-models` (MR-home Models rail — dark section, centered label-pill, no date/toolbar); `story-rail-dark` (MR-home Press Kits rail — dark bg + download toolbar); **`accordion`** (press-kit chapter collapsible sub-sections — not in the local inventory). Suggestion: consider one **query-index rail block parameterized by post-type** rather than 6 separate carousels.
- **Model page (Peaq): zero net-new blocks** — hero (**no CTAs**) + 1 prose paragraph + 5 tag-driven carousels all reuse `hero-image`/`cards-overlay`/`story-rail`/`cards-toolbar`. "Key Facts" + "Technical Data" are **anchor-nav entries with empty bodies** on Peaq (no spec table to migrate for this model).
- **Series confirmed a real 2-level template, both levels HTTP 200** (not 301): directory `/series-2/` = 25 series cards, **no pagination**; hub `/series/<slug>/` = hero + **curated 8 story cards (image+title only), drawn from multiple categories, no load-more** → editorial curation, not a tag feed. `cards-overlay`+`hero-image` cover it; optional `series-directory`/`series-hub` block for authoring ergonomics.
- **Listing engine confirmed = WordPress Search & Filter Pro**, 15 taxonomy facet groups, 6-per "Load more", newest/oldest sort, `current/total` count. **Images total = exactly 33,313; Videos = exactly 913.** Content-type switching is via nav to sibling URLs (no on-page tab bar in the DOM).
- **Press-kit hub = 8 chapter TOC + 5 resource *sub-page* tabs** (Texts/Infographics/Tech data/Images/Videos — navigation to sub-pages, **not** JS tab panels) + WhatsApp + whole-kit **ZIP = a pre-built static CDN `.zip`** (not on-demand). Chapter sub-page carries a **persistent 13-entry chapter sub-nav** (fragment) + in-body Vimeo + photo carousel + **Media Box "1 video / 84 images / 6 PDFs"**; the spec table lives on the separate `/technical-data/` chapter, not every chapter. Press-kit migration is **N+1 documents** (hub + 8 chapters + 5 resource pages sharing one sub-nav fragment).

**Front-end debt to retire (not port):** jQuery; Owl Carousel; Isotope; 174 KB React (banners); 168 `!important`; 30 breakpoints; `dotdotdot` JS truncation; `padding-bottom` ratio hack (no `aspect-ratio`); `:only-child` link detection; `getComputedStyle(':after').content==='flickity'` CSS↔JS flag; unthrottled parallax scroll.

---

## 5. Responsive & Behavioral Notes

- **Overwhelmingly CSS-only** responsive: 295 KB stylesheet, 284 media queries, mobile-first (186 `min-width` vs 105 `max-width`), breakpoints cluster at 768/992/1080px.
- **Two genuinely JS-driven responsive behaviors, both in the gallery:** column-count-by-width (`>1024px & >19 items → 5 cols; >9 → 4; else 3`) **and** the lightbox (`width()<=767`).
- **No block swaps DOM per breakpoint** — one DOM restyled/hidden by CSS → ports cleanly to EDS single-markup.
- **Mobile nav** is a **CSS checkbox-hack with `aria-expanded` absent** → an accessibility gap to fix on rebuild (real button + ARIA).

---

## 6. Complex Systems (how each works + EDS approach)

*(Full build specs in `SKODA-SYSTEM-BUILD-SPECS.md`; runtime contracts read-only, non-mutating — POST bodies described from routes/JS, not fired.)*

### 6.1 Search & filtered listings (ElasticPress)
- **Today:** `/{lang}/search/?filter[search]=`; load-more = `POST admin-ajax.php` `action=ys_ajax_loader` + nonce, `query_vars{ep_integrate:true, ys_search_filter:true, posts_per_page:6, offset}`; response `{html, found_posts, offset, …}`; offset → `history.pushState`. **15 taxonomy facets** (`model, bodywork, derivative, motorsport, equipment, technology, years, view, company, concept, environment, happening, history, sponsorship, vip`). Content types: post/press_release/press_kit/image/video.
- **EDS:** `helix-query.yaml` CSS-selector index over published HTML → `/{locale}/query-index.json` (columns: path,title,description,image,template,date + 15 facets + tags); client-side listing block filters/sorts/paginates + `pushState`. **DA has no spreadsheet indexing.** Body/relevance/fuzzy → hosted search (Algolia/Elastic/Adobe) fed by the index, **production only; pilot = index-only.**

### 6.2 Media cart
- **Today:** `media-cart/v1` (`history`/`actions`, anon empty, **opt-in server state**, no cookie until action, item **limit**); data source `mediakit/v1/mediabox/post/{id}/{lang}` → `{images:[{imageUrl,link,translated,title}]}`; bulk download via signed-S3 `/direct-download/` (24h expiry, `Content-Disposition: attachment`).
- **EDS:** **static Downloads block** (from mediabox) for pilot; the **cart = external service** (state + signed-download) for production, or drop.
- **⚠️ Scope update:** client scope makes the **cart mission-critical for the 15 Oct demo** (device-ID, no login — D2 above). The bulk **zip-download** is the non-EDS-native piece; ranked options (client-side zip / serverless endpoint / reuse legacy / pre-zipped bundles) + demo-vs-prod recommendation + backlog re-point flag are in **`SKODA-MEDIA-CART-DOWNLOAD.md`**. Demo path hinges on **CORS-enabled AEM Assets delivery** (ties to SKODA-501/504).

### 6.3 Newsletter & subscriptions
- **Today:** `newsletter/v1` — **10 routes** (create/login/logout, subscription save/extend, confirmation-URL fetch single+batch); via **mailguide.cz**; double-opt-in; fields `email`, `terms` (consent), `titel-nme-field` (honeypot); `login/{email}` → 500 on fake (auth-gated). **A subscriber account system.**
- **EDS:** form block → ESP API; consent preserved (GDPR). Rebuild-as-service. Pilot: stub/embed.

### 6.4 Banner platform (bespoke per-market ad server)
- **Today:** `skoda-banners/v1` (`list/{locale}`, `redirect/banner/{id}/{locale}`). **Per-market campaigns** (cs 51, en 46, sk 2, de 0, sr 0, sl 1); **content-tag targeting** (`isBannerSameTag`), geo-block (`blackListedCountries` + `geolocation.onetrust.com`), **localStorage frequency-cap** (`showMax`/`showMaxExpiration`), popup delay/scroll triggers, click-tracking redirect; **174 KB React** SPA.
- **EDS:** **bespoke — nothing off-the-shelf.** Rebuild = (a) data source (reuse `skoda-banners/v1` API **or** re-home to an EDS sheet/DA feed) + (b) a small vanilla client block (fetch→tag/geo/freq→render sidebar/inline/popup→tracked redirect), consent-gated. Drop for pilot. *Challenge whether the full ad-server machinery is wanted vs a simpler featured-promo block.*

### 6.5 `skoda-analytics` (bespoke tracking layer — hidden cross-cutting dependency)
- **Today:** a **custom ~140 KB layer over GTM** pushing a structured `dataLayer` schema (`page.Section/Group/Name/LanguageVersion`, `content.Type`, `form.Type/Place`, `cta.Type`, `hit.ClickURL`; events `pageView`/`trackEvent`/`trackEcEvent`). **Instruments forms, downloads, share, banner, media-cart, video, load-more** → a dependency of nearly every interactive block.
- **EDS:** rebuild as an instrumentation module re-emitting the same `dataLayer` schema, wired into each block's decorate, delayed-phase, consent-gated. **Hidden cost multiplier** — rebuilding any block implies re-wiring its events. Needs Škoda's GTM/dataLayer spec.

### 6.6 `ys-social-feed` (NOT a live integration)
- **Today:** a one-line Owl Carousel over **server-rendered/curated** social cards. No API/fetch.
- **EDS:** a normal carousel block fed by authored content. Low. *(If a live feed is later wanted, that's a new SaaS decision — current build is not live.)*

### 6.7 Škodapedia glossary
- **Today:** **212 term titles inline** (static directory) + **27 A–Z nav links**; letter/category filter is **100% client-side CSS-class matching (no fetch)**; only **term detail** is a thin fetch (`skodapedia/v1/term/{id}` → ready-rendered HTML fragment).
- **EDS:** static directory + client filter + `/modals/` term detail. As-built the term detail is a thin fetch; **pre-baking terms as `/modals/` docs eliminates it → fully static, no runtime API** (recommended).

### 6.8 Supporting integrations
- **Consent:** OneTrust + `geolocation.onetrust.com` (feeds consent *and* banner geo). **Analytics:** GTM (`GTM-M5GMBWF`) with **server-side sync** + Hotjar. **Škoda cross-domain apps** (`sdrive`, charging calculators, `cross.skoda-auto.com`) in CSP — not seen on sampled editorial pages `[PARTIAL]`. **`sowb`/`data-store`/`speeches`** = POST-only editor/runtime helpers (out of scope).

---

## 7. Media

- **Scale (measured):** 42,275 attachment pages → ~28,300 distinct logical items (5 locales) → ~200k physical files with the 8-size derivative ladder; ≈80–110 GB (≈34 GB masters). All **order-of-magnitude** — the per-image derivative multiplier is **variable** (large photos ~8 sizes; small/odd-ratio far fewer); `wp/v2/media` count endpoint times out.
- **CDN:** `cdn.skoda-storyboard.com` = **S3 + CloudFront pass-through cache** — ignores `?w`/`?resize`/`?format=webp`/`Accept: image/webp` (identical bytes); **no CORS** header. Derivatives pre-baked by WordPress; **JPG-dominant, no webp/AVIF**. Responsive via `srcset`/`sizes` (no `<picture>`); one `sizes="32x32"` bug.
- **Downloads:** PDFs (to 26 MB), hi-res JPG, **MP4** via signed-S3 `/direct-download/`. Link/DAM, **never the image pipeline**.
- **Metadata:** **96% alt** coverage; **53% captions in `data-caption`** (importer MUST read it); no embedded EXIF/IPTC rights strings (licensing not machine-readable).
- **EDS strategy:** **masters-only, in-use-only, EN-first** ingestion — drop the derivative ladder (EDS regenerates `<picture>`+webp; a modernization win); `<img>` must be a **direct child of `<div>`** to be wrapped; PDF/MP4 link/DAM. DAM = AEM Assets/Dynamic Media if licensed, else reference-in-place (legacy CDN, no-CORS caveat).

---

## 8. Header / Footer Chrome

- **Header/mega-menu = plain nested link lists** (no images/rich panels): 3 sections with children — **Models** (12 models + Classic Cars + Concepts), **Lifestyle** (People/Sports/Adventures), **Škoda World** (5 topics); rest flat. Topbar newsletter dropdown + 6-locale language switcher; inline SVG brand logo.
- **Mobile nav** = CSS checkbox-hack, **`aria-expanded` absent** → rebuild with a real button + ARIA (a11y upgrade).
- **Footer** = repeats the WP nav menu + social (FB/IG/YT/WhatsApp) + **Škoda Media Room app badges** (iOS/Android) + WhatsApp channel + RSS + legal bar (Data Protection/Copyright/Cookies/Whistleblower) + copyright.
- **Media Room footer differs from the Storyboard footer** *(client walkthrough 2026-09-14, provisional pending transcript)* — the built footer is the Storyboard variant; a **distinct MR footer** is net-new scope (likely a `footer` fragment variant, see SKODA-304). Confirm exact deltas against the transcript.
- **Header language selector is per-page dynamic** *(client walkthrough 2026-09-14, provisional)* — a locale appears only if the article exists in it (confirms the "show only existing languages" rule, §COM05/D1).
- **EDS:** Header/Footer blocks + per-locale `nav`/`footer` fragments. Combined effort **Medium** (lower than initially feared).

---

## 9. Target Architecture (DA / Experience Workspace)

*(Full detail + doc citations in `SKODA-EDS-DA-ARCHITECTURE.md`, grounded in the current aem.live docs.)*

- **Platform:** DA/EW (`da.live`) HTML docs; buildless GitHub repo + Code Sync; `*.aem.page`/`*.aem.live` delivery; Sidekick v7. **No AEM Author / UE / JCR / crosswalk.** "Document Authoring is now Experience Workspace" — adds visual editor, AI assistant, native Import, Bulk Operations, Translation, Sheets, MCP.
- **Hard DA constraint:** **spreadsheet indexing NOT supported** → `helix-query.yaml` selector indexing over published HTML (drives all listings/search).
- **Content model:** docs → sections (`---`) → block tables; page Metadata table; site-wide bulk-metadata sheet; Section Metadata for styles.
- **Fit scale:** 🟢 native / 🔵 adapt / 🟠 rebuild-as-service / 🔴 drop. Templates: press-release 🔵, **story 🟠 (flatten SiteOrigin)**, page 🟢, Škodapedia 🔵 (static if pre-baked), listing 🔵. Backend systems 🟠/🔴 (see §6/§10).
- **i18n:** per-locale content trees (`/en/`,`/de/`…); EW native Translation (Google default, pluggable); per-locale query-index; placeholders per locale; `Accept-Language` root routing to reproduce. Uneven translation is native (docs per locale).
- **Import pipeline:** EW native Import (by index/URL) **+** scripted DA source-API (`POST admin.da.live/source/{org}/{repo}/{path}.html`, credentials injected — never a token in chat); per-template parsers/transformers (**story parser must flatten Page Builder**); content-driven detection only; Bulk Operations to preview/publish.
- **Non-functional:** buildless 3-phase load + RUM (Lighthouse ~100 target); EDS ships canonical content in initial HTML (SEO gain over AJAX listings); preserve structured data (Article/Person/BreadcrumbList/ImageObject) + hreflang; redirects sheet (migrate legacy + cross-locale; audit dead URLs); WCAG rebuilds (carousel pause, modal focus-traps, nav ARIA); consent + delayed analytics.

---

## 10. Integration / Service Boundary (static ↔ service)

| Feature | Static in EDS | Needs a service | Pilot |
|---|---|---|---|
| Search facets/listings | index + block + Search | hosted body-search (prod) | ✅ index-only |
| Škodapedia glossary | directory + filter (+ pre-baked `/modals/`) | none (if pre-baked) | ✅ |
| Embeds | all (autoblock + lazy) | none | ✅ |
| Downloads (mediabox) | static block | none | ✅ |
| Media cart | client-side (device-ID + client-side zip) | serverless zip endpoint + signed access + cross-device (prod) | ✅ demo cart (SKODA-505) + downloads |
| Newsletter | form UI | ESP + consent + account | ❌ stub |
| Banners | — | per-market feed + client (or drop) | ❌ |
| `skoda-analytics` | event hooks in blocks | dataLayer rebuild + per-block wiring | ❌ stub |
| Consent/analytics vendor | delayed scripts | re-integrate OneTrust/GTM/Hotjar | ✅ stub |

---

## 11. Unified Risk Register (merged, ranked)

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R1 | Scale (13k+ editorial, ~28.3k media/~200k files, 6 langs) | High | High | Template-driven phasing; EN-first; masters-only; automate import |
| R2 | 4 backend features (media-cart, banners, newsletter, favorites) no static equivalent | High | High | Rebuild-vs-drop decision per feature |
| R3 | Search/listings on ElasticPress, 15 facets | High | High | query-index prototype in pilot; decide hosted search |
| R4 | Media/DAM strategy (~28.3k assets/~200k files, ≈80–110 GB) | High | High | On-demand/in-use/masters-only + DAM-link binaries; name DAM owner |
| R5 | Front-end debt (jQuery/Owl/Isotope/React/CSS) → full rebuild | High | Med | Re-derive tokens; rebuild vanilla |
| R6 | Multilingual (6) multiplies estimates | High | High | Confirm locale scope; locale-extensible from day one |
| R7 | Auto-rotating carousels & modals fail WCAG | Med | Med | Rebuild with controls + focus mgmt |
| R8 | Unstable cross-locale redirects; 8 dead EN URLs | Med | Med | URL lists from sitemaps/REST; audit redirects |
| R9 | Story SiteOrigin Page-Builder flattening | ~~High~~ **Med** | Med | **De-risked** by POC + the **100% EN+CS widget census** (`SKODA-STORY-WIDGET-CENSUS.md`, 2,773 stories, 0 errors): widget universe now **known, not estimated** — **17 canonical types**, but **98.7% of stories / 99.85% of instances** covered by simple mapped widgets; only **1.3% (36 stories)** need special handling; **widget set is locale-invariant (EN = CS)**. SKODA-801 re-pointed 13→8 SP. New sub-items: **101 non-Page-Builder stories (3.6%)** need a linear fallback; **large-tree outliers** (208 widgets / 293 panel-grids). Residual: 3 interactive widgets (charge-map/calculator/nested-builder) + browser-unverified layout fidelity |
| R10 | `skoda-analytics` hidden cross-cutting dependency | Med–High | Med | Rebuild instrumentation; get GTM spec; leave block hooks |
| R11 | Uneven per-item translation (not uniform 6×) | Med | Med | Content-ops map per-locale coverage |
| R12 | `[RUNTIME-UNCONFIRMED]` (a11y, modal focus, LCP/CLS) not browser-verified | Med | Low–Med | Short browser follow-up |

---

## 12. Open Decisions (updated by client briefing — full detail in `SKODA-DELIVERY-PLAN.md` §8)

| # | Decision | Status |
|---|---|---|
| D1 | Language scope | **Refined:** EN + CS for the demo; DE/SK/SR/SL on-demand per local office (M2) |
| D2 | Media-cart | **RESOLVED:** required in the Oct 15 demo; **device-ID, no login**, collect + zip-download |
| D3 | Banners keep/rebuild/drop | Open — M2 or defer |
| D4 | Newsletter service | Open — M2 or defer |
| D5 | Media/DAM ownership & location | **RESOLVED:** **AEM Assets** is the approved-asset source |
| D6 | Search index-only vs hosted | Index-only for demo; hosted-search decision for M2 |
| D7 | Content cutoff / archival scope | Open — full migration by Jan 2 go-live |
| D8 | Scope check (commerce) | **CLOSED** — no commerce; speeches not a CPT; owners for Škodapedia/press-kits still needed |
| **D9 (new)** | **Content embargo** mechanism (confidential-until-date media-room items) | Open — recommend **staged-publish** (delivery plan §4); needed for M2, no native EDS gate |
| **D10 (new)** | **Analytics** — is the bespoke `skoda-analytics` dataLayer layer needed, or GA + FB pixel + Yoast-style metadata sufficient? | Open — confirm with Škoda (likely lighter than earlier flagged) |
| **D11 (new)** | **Figma-to-AEM** showcase scope for the demo | Open — recommend 1–2 components |

---

## 13. Delivery Plan

> **Now milestone-driven around two client-mandated dates — see `SKODA-DELIVERY-PLAN.md` (canonical for phasing).** **M1 = functioning demo, 15 Oct 2026** (~5.5 weeks; front end + blog posts + media-cart + AEM Assets + EN/CS; a key demo milestone). **M2 = go-live, 02 Jan 2027** (full content migration + authoring workflows + on-demand locales + embargoes). Note the demo scope **exceeds** the earlier capability-pilot: **media-cart and the story/SiteOrigin-Page-Builder flatten are pulled forward into M1**. The flatten was the top critical-path worry but is now **de-risked** (100% EN+CS census → known widget universe; SKODA-801 re-pointed 13→8 SP). Realistic M1 ≈ **~40–66 AI-assisted engineer-days** across the team — tight; parallelize and start immediately.

**Phases (the earlier framing, now mapped to milestones):** A capability pilot (E01–E07) ≈ core of M1 → B editorial at scale (E08) mostly M2 (but SKODA-801 story-flatten pulled into M1) → C dynamic services (E09) — media-cart **demo build now an M1 ticket (SKODA-505, E05)** with **prod hardening (SKODA-902) re-scoped to M2/Phase C**, banners/newsletter M2 → D localization (E10) — EN/CS in M1, rest M2. **Backlog = 63 tickets across 10 epics, 261 SP** (`../tickets/OVERVIEW.md` — canonical; grew from the earlier 43/190 via the media-cart re-point, D18 22-URL additions, the 2026-09-14 gap tickets SKODA-305/809/811/812/906, the 2026-09-15 ui-specs template-gap tickets SKODA-607/208/209/706/813, and the 2026-09-15 block-recount tickets SKODA-210/814).

**Capability pilot (Phase A)** — reusable EN capability, not one page: core blocks (teaser/cards, hero, gallery+lightbox, embeds, tags, **Škodapedia glossary — SKODA-206**), header/footer fragments (+ mobile ARIA fix), query-index listing + index search, masters-only media + static downloads, import infra + pilot pages, QA/perf/a11y/sign-off. **Story/Page-Builder + 4 services deferred.**

**Effort (planning, not a quote):**
| Scope | SP | AI-assisted days | Manual days |
|---|--:|--:|--:|
| **Pilot (E01–E07)** | **78** | **~30–50** | **~60–90** |
| Phase B (E08) | 34 | 13–21 | 28–44 |
| Phase C (E09) | 45 | 17–28 | 34–60 |
| Phase D (E10) | 16 | 6–10 | 10–15+ |
| **Full program** | **189** | **~72–117** | **~142–231** |

**Critical path (pilot):** foundation (101→102→106) → blocks/index → **SKODA-402 (faceted listing, hardest block)** and **SKODA-603 (pilot-page fan-in)** converge → QA → sign-off.

---

## 14. Corrections Ledger (superseded → canonical)

| Claim (as first stated) | Final canonical value | Why / source |
|---|---|---|
| ~52,000 media assets (High confidence) | **42,275 pages / ~28,300 logical / ~200k physical**, order-of-magnitude | Measured all 55 attachment sitemaps + sampled weights (Media Deep-Dive; count endpoint times out) |
| "14 taxonomy facets" | **15** (added `history`) | Re-enumerated (System Build-Specs) |
| Škodapedia "fully static / no runtime API" | directory+filter static; **term detail = thin fetch, pre-bakeable to `/modals/`** | Adversarial #2 + Build-Specs |
| Promo banner = "Medium block" / "46 banners" | **bespoke per-market ad server** (cs51/en46/sk2/de0/sr0/sl1) | Complex-Systems Deep-Dive |
| Newsletter = "form + service" | **10-route subscriber account system** | Complex-Systems Deep-Dive |
| ElasticPress "powers search" | powers **search *and* listings** (`ep_integrate`) | Complex-Systems Deep-Dive |
| Stories = linear editorial HTML | **SiteOrigin Page Builder** (flatten; Phase B) — **but 3.6% ARE linear** (need a fallback path) | Adversarial #1 + census |
| Flattener widget set = "6 types" (40-story sample) | **17 canonical types** (100% EN+CS census); 98.7% stories / 99.85% instances covered by simple widgets; **locale-invariant (EN=CS)**; SKODA-801 stays 8 SP | `SKODA-STORY-WIDGET-CENSUS.md` |
| Story flatten = single hardest ticket (13 SP, High) | **8 SP, Med risk** — widget universe now measured, not estimated; residual = 36 special-widget stories + large-tree outliers + browser fidelity | POC + full census |
| "speeches" is a content type | **not a public CPT** (feature plugin) | Adversarial #1 |
| `real-product-manager` = possible commerce | **licensing/update client** — no commerce (D8 closed) | Adversarial #1 |
| Translation uniform across 6 langs | **uneven per-item** | Adversarial #1 |
| "Rich image-grid megamenu" | **plain nested link lists**; mobile-nav ARIA gap | Header/Footer Analysis |
| `ys-social-feed` = possible live feed | **curated carousel, not live** | Complex-Systems Deep-Dive |
| Footprint stated firmly | **order-of-magnitude** (variable multiplier) | Adversarial #2 |
| Pilot = "one press-release article" | **capability pilot** (reusable machinery) | Pilot-scope decision |
| Pilot effort ~13–25 AI-days | **~30–50 AI-days / ~60–90 manual** (canonical) | Ticket-derived backlog (resolves audit F1) |
| Backlog "40 tickets / 184 SP" | **42 tickets / 187 SP** (added SKODA-206 glossary + SKODA-504 asset-mapping; SKODA-801 re-pointed 13→8) | Backlog adversarial fix + census/POC re-points |
| Backlog "42 tickets / 187 SP"; media-cart all in Phase C | **43 tickets / 190 SP** at the media-cart re-point (→ now **63 tickets / 261 SP**, see `../tickets/OVERVIEW.md`) — added **SKODA-505** (demo device-ID cart + client-side zip, M1, 8 SP); **SKODA-902 re-scoped 13→8** (prod hardening only) | Media-cart re-point (`../media/SKODA-MEDIA-CART-DOWNLOAD.md`) |
| Media-cart = high-risk account system, deferred to Phase C | **Device-ID, no login** (collect + zip-download); **required in the Oct 15 demo** | Client briefing (Sept 2026) |
| DAM ownership open (D5) | **AEM Assets** = approved-asset source | Client briefing |
| Pilot = EN only | Demo = **EN + CS**; DE/SK/SR/SL on-demand | Client briefing |
| Analytics = bespoke 140 KB cross-cutting rebuild | Likely **GA + FB pixel + Yoast**-fed (lighter) — **confirm** | Client briefing (D10) |
| *(not previously captured)* | **Content embargoes** required (confidential-until-date media-room) | Client briefing (D9, new) |

*This master applies all canonical values; the correctness-audit's open F1–F3 are resolved here. Propagation into the individual source docs can be done separately on request.*

---

## 15. Provenance, Method & Limitations

- **Evidence:** public pages, HTTP headers, WordPress REST API, XML sitemaps, a full EN crawl (3,496 pages), source JS/CSS inspection, live read-only endpoint replay, CDN header probing, and the current aem.live docs (`docpages-index.json`, 204 pages).
- **Discipline:** read-only, anonymous, **strictly non-mutating** — no cart-add/signup/login/tracked-click; POST/stateful contracts described from routes+JS, not fired.
- **No headless browser** across the engagement → `[RUNTIME-UNCONFIRMED]` items remain open: modal focus-traps (gallery lightbox, Škodapedia), mega-menu hover/mobile-drawer timing, real LCP/CLS, embed lazy timing, contrast, live `dataLayer` capture. Concentrated in the a11y/QA tickets (SKODA-203, 302, 702, 703).
- **Stakeholder/auth-gated unknowns:** ESP POST contract (mailguide), media-cart backend, media rights/licensing, GTM/dataLayer spec, per-locale content totals, whether cross-domain apps embed on any page `[PARTIAL]`.
- **Estimates** are planning-level (SP + AI/manual day ranges) — **not a quote**; AI-assisted assumes the migration tooling + experienced engineers steering it.

---

## 16. Document Map (detail sources)

> **Paths are relative to `docs/`** (this doc lives at `docs/analysis/SKODA-MASTER.md`). The corpus was reorganized into topic subfolders on 2026-09-14 — see `docs/README.md`.

| Topic | Source doc |
|---|---|
| Site shape, backend, scale, first risks | `analysis/SKODA-STORYBOARD-DISCOVERY.md` |
| Search feasibility, EN scope, template gaps | `analysis/SKODA-STORYBOARD-DRILLDOWN.md` |
| Full block audit + variants + matrix + responsive | `analysis/SKODA-EN-BLOCK-INVENTORY.md` (+ `analysis/SKODA-EN-BLOCK-DATASET.csv`/`-AGGREGATE.json`) |
| **Block universe recount** (2026-09-15) — appearance counts per block vs the ui-specs universe, **split STO/MR**, signatures Explore-validated; supersedes the inventory's counts | `analysis/SKODA-BLOCK-RECOUNT.md` (+ `analysis/SKODA-BLOCK-RECOUNT-DATASET.csv` 3,499 rows / `-AGGREGATE.json`) |
| Per-block critical review + live contracts + debt | `reviews/SKODA-BLOCK-IMPLEMENTATION-REVIEW.md` |
| Media integration strategy | `media/SKODA-MEDIA-INTEGRATION-REVIEW.md` |
| Measured media (counts, footprint, CDN/CORS) | `media/SKODA-MEDIA-DEEP-DIVE.md` |
| Mapping existing S3 images → AEM Assets (manifest, A/B) | `media/SKODA-ASSET-MAPPING.md` |
| Story-flattener POC (parser mechanism + fidelity method) | `analysis/SKODA-FLATTENER-POC-FINDINGS.md` |
| **Full 100% EN+CS widget census** (types, combinations, coverage, locale-invariance) + per-story dataset | `analysis/SKODA-STORY-WIDGET-CENSUS.md` + `analysis/SKODA-STORY-WIDGET-DATASET.csv` |
| Complex dynamic systems (contracts, targeting) | `analysis/SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` |
| Media-cart **bulk zip-download** feasibility + options (A–F) + demo/prod recommendation | `media/SKODA-MEDIA-CART-DOWNLOAD.md` |
| Header/footer structure | `analysis/SKODA-HEADER-FOOTER-ANALYSIS.md` |
| DA/EW target architecture (doc-cited) | `architecture/SKODA-EDS-DA-ARCHITECTURE.md` |
| **Custom authoring UI in DA/EW** (build any bespoke authoring control without App Builder; decision framework + cookbook) | **`architecture/SKODA-DA-EW-EXTENSIBILITY.md`** |
| Build specs for 5 systems | `architecture/SKODA-SYSTEM-BUILD-SPECS.md` |
| Red-team of findings / of docs / consistency | `reviews/SKODA-ADVERSARIAL-REVIEW.md`, `reviews/SKODA-ADVERSARIAL-REVIEW-2.md`, `reviews/SKODA-CORRECTNESS-AUDIT.md` |
| Prior consolidated overview (superseded by this master) | `archive/SKODA-STORYBOARD-ANALYSIS-OVERVIEW.md` (+ `archive/…-OVERVIEW.html`, `archive/SKODA-STORYBOARD-SITE-FACTS.html`) |
| **Date-driven delivery plan (Oct 15 demo / Jan 2 go-live)** | **`planning/SKODA-DELIVERY-PLAN.md`** (canonical for phasing/scope) |
| **Client requirements doc → our status mapping (per-ID, ticket-linked)** | **`planning/SKODA-CLIENT-REQUIREMENTS-MAPPING.md`** (maps `source/CMS-MediaRoomMigration-Requirements-*.pdf` COM/STO/MR/MIG IDs to built/solvable/open status; adds decisions D17/D18) |
| **M1 demo target (tiered scope + signable definition-of-done)** | **`planning/SKODA-M1-DEMO-TARGET.md`** (irreducible core / differentiators / blueprint tiers vs the already-built `/en`) |
| **Autonomous-agent handoff candidates (framework eval)** | **`planning/SKODA-AGENT-HANDOFF-CANDIDATES.md`** (which isolated, objective-oracle parts can be handed to an agentic team; no-visual-fidelity constraint) |
| Delivery backlog (epics/tickets) | `tickets/OVERVIEW.md` + `tickets/epics/` + `tickets/tickets/` |
| **Completeness proof for this master** | `analysis/SKODA-MASTER-COVERAGE.md` |
| **22-URL block-by-block gap analysis** (2026-09-14) — corrected §3 Series claim, refined press-kit claim, named the 5 "Page" sub-types, and surfaced decision D18 | `../.migration/plans/url-analysis-comparison.md` + `url-analysis-matrix.json` |
| **Architecture diagrams** (integration / authoring-flow / import-pipeline; Mermaid, integration also embedded in the client decks) | `architecture/SKODA-DIAGRAMS.md` |
| **Minimal PoC URL coverage set** (24 live URLs exercising every template/variant/functionality) + **URL × component × client-requirement matrix** | `planning/SKODA-POC-URL-SET.md` (+ `skoda-poc-urls.json`/`.txt`) · `planning/SKODA-POC-COVERAGE-MATRIX.md` |
| **Measured UI spec library** (2026-09-15) — 25 component specs + 6 template specs with live-DevTools DOM+CSS at breakpoints 768/992/1080; template census → blocks → ticket; source of the template-gap tickets 607/208/209/706/813 | `ui-specs/README.md` (index + coverage matrix) · `ui-specs/_TEMPLATES.md` (page-type census) · `ui-specs/_FOUNDATIONS.md` · `ui-specs/_CAPTURE-PROTOCOL.md` |

*This master is canonical going forward; source docs are retained for detail (now under `docs/` topic subfolders), not deleted.*
