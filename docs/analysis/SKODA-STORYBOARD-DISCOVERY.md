# Škoda Storyboard — Migration Discovery Report

**Target:** `https://www.skoda-storyboard.com/en/`
**Purpose:** Evidence-based pre-migration assessment for a follow-up migration to AEM Edge Delivery Services (EDS).
**Date:** 2026-09-04
**Scope:** Analysis only — no content imported, no code generated, no migration executed. Reconnaissance used public pages, HTTP headers, the WordPress REST API, and XML sitemaps.

> **Note (2026-09-04):** Some findings below were corrected by a later adversarial review — see `SKODA-ADVERSARIAL-REVIEW.md`. Corrections applied inline: speeches is not a public CPT; `real-product-manager` is licensing (no commerce); media now measured (see SKODA-MEDIA-DEEP-DIVE.md): ~42.3k attachment pages / ~28.3k distinct logical items / ~200k+ physical files — not ~52k.

> **Note (2026-09-05):** The dynamic systems were later investigated in depth — see `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`: banners are a per-market ad server; newsletter is a 10-route account system; media-cart state is opt-in (zero cookies on anonymous load); `mediakit/v1/mediabox` feeds downloads; the Škodapedia A–Z directory + filter are static (client-side), while term detail is a thin API fetch (can be pre-baked to `/modals/` to eliminate the call).

---

## 1. Executive Summary

Škoda Storyboard is Škoda Auto's global **editorial + press/media newsroom**, not a product-commerce site. It is a **large, mature, heavily customized WordPress** installation with a deep suite of bespoke plugins, a 6-language Polylang setup, an Elasticsearch-backed search/listing layer, and a very large media/DAM footprint (~42.3k attachment pages / ~28.3k distinct logical media items, measured; ~200k+ physical files with derivatives).

**Scale is the dominant theme.** This is not a "few dozen pages" migration — it is **13,000+ editorial URLs** plus **~42.3k media attachment pages (~28.3k distinct logical items, measured)** across 6 languages, with a dozen custom backend integrations that have no 1:1 equivalent in EDS's static delivery model.

| Dimension | Finding | Confidence |
|---|---|---|
| Backend CMS | WordPress (confirmed via `/wp-json/`, `rel=shortlink`, `/wp/wp-includes/`) | **Confirmed** |
| Rendering | Server-rendered HTML + jQuery + custom mu-plugins; not a SPA | **Confirmed** |
| Editorial content volume (EN + all langs) | posts **5,282**, press releases **6,715**, pages **551**, Škodapedia **725** | **Confirmed (REST totals)** |
| Media assets | 42,275 attachment pages across 55 sitemaps → ~28,300 distinct logical items (measured); ~200k+ physical files with derivatives | **Measured (sitemap enumeration)** |
| Languages | **6** (cs, sk, en, de, sr, sl) via Polylang Pro | **Confirmed** |
| Search | ElasticPress / Elasticsearch (`x-elasticpress-search: true`) | **Confirmed** |
| Migration complexity | **High** — large scale + many stateful/backend integrations | **High** |

**Headline recommendation:** Treat this as a **multi-phase, template-driven** migration. Do **not** attempt a full-site lift. Start with a narrow pilot (one editorial article template + press-release template in English only), prove the block set and the listing/search strategy, then scale by template and language.

---

## 2. Backend & Technology (Phase 2 — confirmed)

**CMS: WordPress**, definitively confirmed by:
- `https://www.skoda-storyboard.com/wp-json/` returns a valid WP REST root (`page_on_front: 46109`, `show_on_front: page`).
- Response header `link: <...>; rel=shortlink` and assets served from `/wp/wp-includes/js/jquery/...`.
- Core assets are jQuery 3.7.1 + jQuery UI + jQuery Migrate → a **classic (non-block-first) theme**, server-rendered. **Not** a React/Vue/Next SPA (the only "next" hits were incidental).

**Custom plugin architecture (the real complexity).** The site runs an extensive suite of bespoke `mu-plugins` and custom REST namespaces. These plugin names map directly to on-page features and are the true migration surface:

| Custom REST namespace / plugin | Feature it powers | Verified |
|---|---|---|
| `newsletter/v1` (`/subscription/save`, `/extend`) | Newsletter signup + double opt-in / subscription management. **Clarification:** this is a **10-route subscriber account system** (not a single signup form). | HTTP 200 |
| `media-cart/v1` + `skoda-media-cart` + `media-cart-limit` | "Media cart" — add press images/assets, download in bulk. **Clarification:** media-cart state is **opt-in** — no cookie is set until the visitor takes an action. | HTTP 200 |
| `mediakit/v1` | Press kits (chaptered press content + downloads). **Clarification:** `mediakit/v1/mediabox/post/{id}/{lang}` returns the per-post downloadable image set (feeds media-cart; can serve a static downloads block). | HTTP 200 |
| `skodapedia/v1` (`/term`) | Škodapedia encyclopedia/glossary terms. **Clarification:** A–Z directory + filter are static (client-side); term detail is a thin API fetch (`skodapedia/v1/term/{id}` returns a ready-rendered HTML fragment; can be pre-baked to `/modals/` to eliminate the call). | HTTP 200 |
| `speeches/v1` (`/speech`) | Executive speeches **feature plugin** (NOT a public REST content type — verified absent from `wp/v2/types`) | HTTP 200 |
| `skoda-banners/v1` (`/list/en`) | Promotional banner management. **Clarification:** the banner platform is **per-market** (locale-scoped campaigns with tag/geo/frequency targeting). | HTTP 200 |
| `sowb/v1` | "Storyboard web" core theme functionality | HTTP 200 |
| `pll/v1` | Polylang Pro (multilingual: 6 languages) | HTTP 200 |
| `real-media-library`, `real-product-manager`, `ys-media-replace` | DAM / media library management | present |
| `data-store/v1`, `duplicate-post`, `wp-2fa`, `simple-page-ordering` | Editorial/admin tooling | present |

**Client-side plugins** (jQuery modules, confirmed in homepage `<script>` tags): `skoda-carousel`, `skoda-gallery`, `skoda-fb-some` (Facebook/social), `ys-social-feed`, `ys-parallax`, `ys-embed-controller`, `skoda-ajax-loader` / `ys-ajax-loader` (the "Load more" mechanism), `skoda-media-cart`, `skoda-banner`, `skoda-analytics`.

**Dynamic data mechanisms:**
- **"Load more" / infinite listings** → `admin-ajax.php` + `ys-ajax-loader`/`skoda-ajax-loader` modules (AJAX-paginated archives).
- **Search** → `/en/search/?filter[search]=...`, backed by **ElasticPress/Elasticsearch** (`x-elasticpress-search: true` header).
- **Faceted filters** on listings (`filter[...]` query params).

**Custom post types (from `wp/v2/types`):** `post`, `page`, `press_release`, `skodapedia`, plus `attachment` and the WP block/template internals. (Speeches exist via their own namespace.)

---

## 3. URL Inventory & Site Shape (Phase 1)

Content totals are **authoritative** — read from WordPress REST `X-WP-Total` headers (these span all 6 languages combined):

| Content type | Total items | Source |
|---|---|---|
| Posts (editorial stories) | **5,282** | `wp/v2/posts` |
| Press releases | **6,715** | `wp/v2/press_release` |
| Pages | **551** | `wp/v2/pages` |
| Škodapedia entries | **725** | `wp/v2/skodapedia` |
| Categories (taxonomy terms) | **468** | `wp/v2/categories` |
| **Editorial subtotal** | **~13,270** | |
| Media attachments | 42,275 attachment pages across 55 sitemaps → ~28,300 distinct logical items (measured); ~200k+ physical files with derivatives | attachment sitemaps |

**Sitemap structure:** nested `sitemapindex` with **81 sub-sitemaps** — 4 post sitemaps, 1 page sitemap (539 URLs), 6 press-release sitemaps (~1,006 each), ~55 attachment sitemaps, plus taxonomy/entity sitemaps (models, concepts, motorsport, history, Škodapedia, etc.).

**Routing:** locale prefix per language (`/en/`, `/cs/`, `/de/`, `/sk/`, `/sr/`, `/sl/`); Polylang home fronts differ per language (e.g., `page_on_front` 46109 EN vs 46111 CS).

> ⚠️ **Stale-redirect finding (unknown-unknown):** `/en/models/enyaq/` returned **HTTP 301 to a Slovenian lifestyle article** (`/sl/.../enyaq-…`). The "Models" concept the homepage nav implies is **not a stable EN URL space** — model/topic URLs redirect unpredictably across locales. Any URL list built from nav assumptions will be wrong; **the sitemaps + REST API are the only reliable URL source.**

**Date discrepancy resolved:** sitemap `lastmod` values cluster in 2023, but articles render 2025–2026 dates. The site is **actively publishing** (fresh press releases dated Sept 2026); the sitemap lastmod is unreliable and must **not** be used to scope "active vs. archived" content.

---

## 4. Page Archetypes (Phase 3)

Representative pages fetched and structurally inspected (raw HTML):

| # | Archetype | Example (verified HTTP 200) | Key structural elements |
|---|---|---|---|
| 1 | **Homepage / editorial hub** | `/en/` (325 KB) | Hero/featured `teaser` grid (51 teaser units), category card rows (eMobility, Lifestyle, Škoda World), "Series" carousel, newsletter, social feed, promo banners, app-download |
| 2 | **Listing / archive** | `/en/press-releases/`, `/en/press-kits/` | Tabs (All/News/Press Kits/Images/Videos), faceted filters, **AJAX "Load more"**, teaser card grid |
| 3 | **Article / story** | `/en/press-releases/skoda-octavia-turns-30…/` (110 KB) | H1 + lead, body (`h3`×14, `p`×13, `ul`, `ol`), **embedded Vimeo player** + **Buzzsprout podcast iframe**, image gallery, tags, social share, download buttons, media-cart actions, newsletter widget |
| 4 | **Press kit (mediakit)** | `/en/press-kits/` | Chapter side-nav, infographic + PDF/JPG downloads, expandable galleries, bulk media-cart |
| 5 | **Škodapedia** | `/en/skodapedia/` (139 KB) | Encyclopedia/glossary terms, cross-linking, term API (`skodapedia/v1/term`) |
| 6 | **Model / topic** | `/en/models/…` | ⚠️ Redirects across locales — unstable; needs stakeholder clarification on canonical model URLs |
| 7 | **Header + Footer** | site-wide | Mega-menu (`menu-item-has-children`, taxonomy + model menu items), 6-language selector, comprehensive footer (nav repeat, social, RSS, legal, app links, media cart) |

**Recurring component vocabulary (from real markup):** `teaser` / `teaser-media` / `teaser-overlay` / `teaser-toolbar` / `teaser-container` (the universal card unit, 51 instances on the homepage alone), `media-cart-*`, `gallery-item`, `download` / `download-badge` / `download-buttons`, `social-links` / `share`, `tag-list`, `newsletter-subscribe-widget`, `promo-box`, `app-download`.

---

## 5. Block Inventory & EDS Mapping (Phase 4)

| Component (source) | Frequency | EDS approach | Effort / Risk |
|---|---|---|---|
| **Teaser card** (`teaser`) | Ubiquitous | **Cards block** + variants (overlay, media, toolbar) | Low — core pattern |
| **Card grid / category row** | Every hub page | Cards block in styled section | Low |
| **Hero / featured** | Homepage, articles | Hero block + variant | Low |
| **Carousel / slider** (`skoda-carousel`, "Series") | Homepage, galleries | **New block** (carousel) — needs JS decoration | Medium |
| **Article body** (h/p/ul/blockquote) | All articles | Default content | Low |
| **Image gallery** (`skoda-gallery`, expandable) | Articles, press kits | **New block** (gallery w/ show-more) | Medium |
| **Video/podcast embeds** (Vimeo, YouTube, Buzzsprout) | Articles | Embed block / autoblocking by URL | Medium |
| **Download / asset buttons** (PDF/JPG) | Press releases/kits | New block or default links | Low–Medium |
| **Newsletter signup** (`newsletter/v1`) | Site-wide | **New block + external service** (see §6) — note: `newsletter/v1` is a **10-route subscriber account system** | **High** |
| **Media cart** (add/collect/bulk-download assets) | Press area | **No EDS equivalent** — needs backend service; state is **opt-in** (no cookie until action) | **High** |
| **Listing + "Load more" + filters** | Archives | **Indexed queries** (EDS spreadsheet/JSON index + client render) | **High** |
| **Search** (ElasticPress) | Site-wide | External search service (EDS has no native ES) | **High** |
| **Social feed** (`ys-social-feed`, FB/IG) | Homepage/footer | Embed block or 3rd-party widget | Medium |
| **Promo banners** (`skoda-banners/v1`) | Various | New block or section metadata | Medium |
| **Parallax** (`ys-parallax`) | Homepage | CSS/JS block behavior | Medium |
| **Favorites / bookmark** (add/remove) | Teasers | **Stateful — needs backend** (see §6) | **High** |
| **Mega-menu header** | Site-wide | Custom nav block (fragment) | Medium |
| **Footer** | Site-wide | Footer fragment | Low–Medium |
| **Škodapedia terms** | Encyclopedia | New block + content model | Medium |
| **Breadcrumbs + structured data** | Articles | Block + metadata (schema.org present) | Low |

**Roughly 8–10 net-new blocks** beyond the AEM boilerplate set, plus **3–4 features that require backend services** EDS does not provide statically.

---

## 6. Integrations & Complications Register (Phase 5)

The CSP header enumerated the **full third-party surface**. Mapped to migration approach:

| Integration | Purpose | EDS migration approach |
|---|---|---|
| **Newsletter (`newsletter/v1`, mailguide.cz)** | Signup, double opt-in, subscription mgmt | Re-integrate via external form service / API; **not** static. **Clarification:** this is a **10-route subscriber account system**, not a single signup form. |
| **Media cart (`media-cart/v1`)** | Collect & bulk-download press assets | **Requires a backend service** — no static equivalent. **Clarification:** cart state is **opt-in** (no cookie until the visitor acts). |
| **Favorites / bookmarks** | Per-visitor saved items | **Requires state/backend** (localStorage or service) |
| **ElasticPress search** | Site search + faceted filters | External search index/service (Algolia/ES/EDS index) |
| **AJAX "Load more"** listings | Paginated archives | EDS indexed queries (published JSON) + client render |
| **OneTrust** (`*.onetrust.com`, `cookies.skoda-auto.com`) | Cookie consent / geolocation | Re-integrate consent script |
| **Google Tag Manager** (`GTM-M5GMBWF`) + `skoda-analytics` | Analytics/tag mgmt | Re-add GTM container |
| **Hotjar** | Behavior analytics | Re-add script (delayed phase) |
| **Vimeo / YouTube / Buzzsprout** | Video + podcast embeds | Embed block / autoblocking |
| **Facebook/Instagram/Twitter feeds & share** | Social | Embed/share blocks |
| **RSS feeds** | Syndication | Generate feeds from EDS index |
| **CDN** (`cdn.skoda-storyboard.com`, CloudFront, S3) | Asset delivery | Map to EDS media handling / DAM |
| **Škoda cross-domain** (`sdrive`, `chargingcalculator`, `cross.skoda-auto.com`) | Charging calc, SSO/cross features | Assess per-feature; likely external embed |
| **Polylang (6 languages)** | Multilingual | EDS multi-site/locale strategy — **scope multiplier** |

**SEO:** schema.org present (`WebSite`, `WebPage`, `BreadcrumbList`, `SearchAction`, `ImageObject`, `ReadAction`) — must be preserved. Cross-locale 301 redirects exist and are messy (see §3).

---

## 7. Risk Register (Phase 6)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Scale underestimated** — 13k+ editorial + ~28k logical / ~200k+ physical media files across 6 langs | High | High | Template-driven phased migration; automate import; scope EN-first |
| R2 | **Media-cart & favorites have no EDS equivalent** | High | High | Early decision: rebuild as external service, or descope for phase 1 |
| R3 | **Search (ElasticPress) not native to EDS** | High | High | Choose external search early (Algolia/ES); design index |
| R4 | **"Load more"/faceted listings** need re-architecture | High | Medium | Prototype EDS indexed-query listing in pilot |
| R5 | **Newsletter + consent (OneTrust)** are regulated integrations | Medium | High | Involve compliance; re-integrate, don't reinvent |
| R6 | **Multilingual (6 langs)** multiplies every estimate | High | High | Confirm which locales are in scope before estimating |
| R7 | **Unstable cross-locale redirects** (models URLs) | Medium | Medium | Build URL list from sitemaps/REST only; audit redirects |
| R8 | **Custom post types** (press_release, skodapedia) need content models | High | Medium | Model each type explicitly in EDS |
| R9 | **Embeds** (Vimeo/YouTube/Buzzsprout) vary per article | Medium | Low | URL-based autoblocking |
| R10 | **Import parser must be content-driven**, not URL/template-coupled | Medium | Medium | Detect blocks from DOM selectors (per project standard) |

**Unknown-unknowns surfaced during recon:**
1. Cross-locale 301 redirects break nav-based URL assumptions.
2. Buzzsprout **podcast** embeds (audio) exist alongside video — an easily-missed content type.
3. A **"speeches"** feature exists but is **not a public content type** (absent from `wp/v2/types`; its namespace requires params) — do not scope it as a migratable CPT. *(Corrected by adversarial review.)*
4. `real-product-manager-wp-client` namespace hints at possible product/commerce data — **worth verifying** whether any commerce-like pages exist. **Verified (adversarial review): `real-product-manager` is the plugin vendor's licensing/update/telemetry client — NOT a commerce surface. The no-commerce finding is confirmed.**
5. Sitemap `lastmod` is stale/misleading — cannot be used for content triage.

---

## 8. Open Questions for Stakeholders

1. **Which languages** are in scope for phase 1 (EN only, or all 6)?
2. **Media cart** and **favorites** — migrate, rebuild as a service, or drop?
3. **Search** — acceptable to replace ElasticPress with a hosted search (Algolia/EDS index)?
4. **Content scope** — full 13k+ archive, or only content from a cutoff date forward?
5. **Media/DAM** — migrate all (~28.3k logical / ~200k+ physical, ≈80–110 GB) vs on-demand? Where will the DAM live?
6. **Speeches / Škodapedia / press-kits** — in scope, and who owns their content models?
7. Are there any **gated/authenticated** areas or a **commerce** surface (the `real-product-manager` plugin)?
8. What is the **canonical model-page** URL structure (given the redirect mess)?

---

## 9. Recommended Migration Phasing

- **Phase A — Pilot (prove the model):** EN only. Migrate the **article/story template** + **press-release template** + the **teaser/cards, hero, gallery, embed** blocks. Stand up the **header + footer**. Prove one **indexed-query listing** (replacing AJAX "Load more") and one **external search** integration on a small slice.
- **Phase B — Editorial at scale:** Roll out remaining editorial templates (Škodapedia, press kits), automate bulk import from sitemaps/REST, wire newsletter + consent + analytics.
- **Phase C — Backend-dependent features:** Media cart, favorites, faceted search/filters, social feeds — each as a deliberate service decision.
- **Phase D — Localization:** Extend to the remaining 5 languages once the EN template set is stable.

**Pilot recommendation:** Start with **one press-release article + the press-release listing**, English only. It exercises the most reusable blocks (teasers, gallery, downloads, embeds, share, newsletter) and forces early resolution of the two hardest problems (listing/pagination and search) at low volume.

> **Commerce note:** The site is editorial, not e-commerce, so the `excat-commerce` plugin is **not needed** — with one caveat: the `real-product-manager-wp-client` REST namespace should be verified during Phase A to rule out any hidden product surface. If product/pricing pages turn up, enabling `excat-commerce` for those specific pages would be worthwhile.

---

## Appendix — Evidence Sources

- HTTP headers: `/en/` (CSP, `x-elasticpress-search`, `rel=shortlink`, nginx, `x-proxy-cache`).
- REST API: `/wp-json/` (namespaces, front page), `/wp/v2/types`, `X-WP-Total` counts for posts/press_release/pages/skodapedia/categories, `/pll/v1/languages`.
- Sitemaps: index + `page-sitemap.xml` (539), `press_release-sitemap.xml` (1,006), `attachment-sitemap[1-3].xml` (~950 each).
- Fetched pages: `/en/` (325 KB), press-release article (110 KB), `/en/skodapedia/` (139 KB), `/en/press-kits/` (200), redirect probes for models/search.
- Scripts/CSP: confirmed custom mu-plugin suite and third-party hosts (GTM, OneTrust, Hotjar, Vimeo, Buzzsprout, Facebook/Instagram/Twitter, S3/CloudFront CDN).
