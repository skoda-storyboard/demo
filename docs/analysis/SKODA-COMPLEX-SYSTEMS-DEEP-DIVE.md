# Škoda Storyboard — Complex Systems Deep-Dive

**Companion to:** the nine prior `SKODA-*` artifacts (esp. `-BLOCK-IMPLEMENTATION-REVIEW`, `-EDS-DA-ARCHITECTURE`).
**Date:** 2026-09-05
**Purpose:** Learn *how* each dynamic backend system actually works — API surface, data contracts, state model, client architecture, targeting rules, dependencies — to firm up the rebuild/replace/drop decisions.
**Method:** Read-only, anonymous. Enumerated custom REST route maps (GET only); replayed safe GET contracts; read the driving client JS; mapped dependencies from CSP. **Strictly non-mutating** — no POST that creates state, no login, no cart-add, no newsletter signup, no conversion-recording banner click. Auth-gated behaviors are described from JS/route shape, not exercised.

---

## 1. Executive Summary — What Each System Really Is

| System | What it really is (learned this dive) | Verdict | Impact |
|---|---|---|---|
| **ElasticPress** | Search + listings over 15 facets; `admin-ajax` load-more with nonce; server-rendered results | 🔵 Adapt (index) + 🟠 hosted-search for body/relevance | High |
| **Banner platform** | A **real per-market ad server** — locale-scoped campaigns (cs 51, en 46, sk 2, de/sr 0), content-**tag targeting**, geo-block, frequency-cap in `localStorage`, popup triggers, click-tracking redirect endpoint, 174 KB React SPA | 🟠 Rebuild-as-service (client SDK + banner API) or 🔴 drop for pilot | High |
| **Newsletter / subscriber** | A **full subscriber account system** — 10 routes incl. create/login/logout, subscription save/extend, confirmation-URL fetch (single + batch); double-opt-in; via **mailguide.cz**; honeypot + `terms` consent | 🟠 Rebuild-as-service (external ESP + consent) | High |
| **Media-cart** | Anonymous, **opt-in server-side state** (no cookie until you act); collects press **mediabox** images (sourced from `mediakit/v1`); enforces an item **limit**; bulk download via signed-S3 `/direct-download/` | 🟠 Rebuild-as-service or 🔴 drop for pilot | High |
| **Mediakit (`mediakit/v1`)** | **Newly exercised** — `mediabox/post/{id}/{lang}` returns the downloadable image set per press post; the data source behind the media-cart | 🔵 Adapt (feeds downloads block) | Med |
| **Škodapedia (`skodapedia/v1`)** | `term/{id}` returns **rendered HTML** (not data) — a server-render fragment endpoint for the glossary modal | 🔵 Adapt (static + modal) | Med |
| **Consent/analytics (vendor)** | OneTrust (+ `geolocation.onetrust.com`), GTM with a **server-side sync** (`europe-west3-skoda-gtm-sync-server.cloudfunctions.net`), Hotjar | 🔵 Adapt (delayed-phase scripts) | Med |
| **`skoda-analytics` (bespoke, §2.6)** | A **custom 140 KB tracking layer** over GTM with a structured `dataLayer` event schema; **instruments forms, downloads, share, banner, media-cart, video, load-more** — a cross-cutting dependency of nearly every interactive block | 🟠 Rebuild-as-service (instrumentation module, per-block wiring) | **High (hidden)** |
| **`ys-social-feed` (§2.7)** | **Not a live feed** — a one-line Owl Carousel over **server-rendered/curated** social cards; no API/fetch | 🔵 Adapt (normal carousel block) | Low |
| **`sowb/v1` / `data-store/v1` / `speeches/v1`** | POST-only widget/permission/speech endpoints — editor/runtime helpers, not public content APIs | 🔵/🔴 mostly out of scope | Low |

**Cross-cutting insight:** the site sets **zero cookies on anonymous load** — all four stateful systems are **opt-in** (state created only on user action). This is *good* for EDS: pages stay cacheable/CDN-friendly; the dynamic features bolt on client-side without breaking the static delivery model.

---

## 2. Per-System Dossiers

### 2.1 ElasticPress (search + listings)
- **API surface:** front-end search at `/{lang}/search/?filter[search]=…`; listings/load-more via `POST /wp/wp-admin/admin-ajax.php` `action=ys_ajax_loader` (nonce-protected). Response: `{status, data:{html, found_posts, offset, posts_per_page, post_count, current_items}}`.
- **Data contract:** `query_vars` carries `post_type`, `ep_integrate:true`, `ys_search_filter:true`, `posts_per_page`, `offset`, `orderby/order`; **15 taxonomy facets** via `data-filter-name` (model, bodywork, derivative, motorsport, equipment, technology, years, view, company, concept, environment, happening, history, sponsorship, vip).
- **State:** offset pushed to URL via `history.pushState` (deep-linkable). Server-rendered result HTML (not JSON records).
- **EDS/DA fit:** facets/sort/paging → **`helix-query.yaml` index + client faceting** (DA has no spreadsheet index — see `-EDS-DA-ARCHITECTURE` §6). Full-text **body** search, fuzzy, relevance ranking → **hosted search** (Algolia/Elastic/Adobe) fed by the index; **pilot = index-only**.

### 2.2 Banner platform (`skoda-banners/v1`)
- **API surface (3 routes):** `GET /list/{language}` (banner set for a locale), `GET /redirect/banner/{id}/{language}` (click-tracking redirect), root.
- **Data contract (46 EN banners):** per banner — `id, title, type (sidebar 17 / widget 27 / positional 2), creative{mobile,tablet,desktop}, imgAlt, minViews, showMax, showMaxExpiration, popupTriggerDelay, popupTriggerScroll, blackListedCountries, tags[], url(tracking redirect)`.
- **Targeting/rules engine (this is the depth finding):**
  - **Per-market campaigns:** locale counts differ sharply — **cs 51, en 46, sk 2, sl 1, de 0, sr 0**. Banners are managed per language, not globally.
  - **Content-tag targeting:** `isBannerSameTag()` in the bundle matches banner `tags` (company/design/safety/innovations/heritage/motorsport/hockey/cycling/emobility…) against the current page → contextual serving.
  - **Frequency capping:** client-side via `localStorage["skoda-banner"]` (`bannerMaxedOut`, `showMax`, `showMaxExpiration`).
  - **Geo:** `blackListedCountries` per banner (+ `geolocation.onetrust.com` for country).
  - **Popup triggers:** delay + scroll-depth (`popupTriggerDelay`, `popupTriggerScroll`).
- **Client architecture:** 174 KB **React** bundle; functions `getPopupBanner/getPositionalBanner/getSidebarBanner/getWidgetBanner`, `loadBanners`, `saveBannerDisplay`, `reloadBannerSettings`.
- **EDS/DA fit:** **Rebuild-as-service.** This is a **bespoke WP plugin** — there is no off-the-shelf product to enable; the logic must be re-created. Two pieces: **(a) data source** — reuse the existing `skoda-banners/v1` API (fast; keeps a legacy dependency) *or* re-home banner management into an EDS **sheet/DA feed** (image, type, target-tags, geo, frequency, link) served as JSON (no WordPress left); **(b) behavior** — a *small vanilla* client block (few hundred lines, rebuilt not ported): fetch `/list/{locale}` → tag/geo/frequency rules (`localStorage` cap) → render sidebar/inline/pop-up (timer/scroll) → tracked-redirect clicks; consent-gated. **Drop for pilot.** Never a static block. *Worth challenging whether the full ad-server machinery is wanted vs a simpler "featured promo" block.*

### 2.3 Newsletter / subscriber (`newsletter/v1`, mailguide.cz)
- **API surface (10 routes):** `POST subscriber/create`, `POST subscriber/login`, `DELETE subscriber/logout`, `POST subscription/save`, `POST subscription/extend`, `GET login/{email}`, `GET extend/{email}`, `GET fetchConfirmationUrl/{email}`, `POST fetchConfirmationUrl/batch`, root.
- **Data contract:** form `data-form-code="NewsletterFormWidgetV2"` / `NewsletterFormShortcode`; fields `email`, `terms` (consent checkbox), `titel-nme-field` (**honeypot**). Double-opt-in via confirmation URLs.
- **State/auth:** it's an **account system** — `login/{email}` (GET) returned **HTTP 500 on a fake email** (expects a real subscriber; not exercised further). Logout is a `DELETE`. So there is per-subscriber session state.
- **Dependencies:** **mailguide.cz** (Czech ESP) is the backend; consent via `terms` + OneTrust.
- **EDS/DA fit:** **Rebuild-as-service** — front the ESP (mailguide or replacement) with a vanilla form block; consent must be preserved (GDPR). Not reducible to a static form. Pilot: embed provider form or stub.

### 2.4 Media-cart (`media-cart/v1`) + Mediakit (`mediakit/v1`)
- **API surface:** media-cart `GET history` → `{"hasHistory":false}` (anon), `GET actions` → `{"mediaCart":""}` (anon, empty). Mediakit `GET mediabox/post/{id}/{lang}` → `{images:[{imageUrl,link,translated,title}]}` — **the press image set for a post** (this is what the cart collects).
- **State model:** **no cookie on anonymous load**; state is **opt-in server-side** keyed after an add action. Cart has an **item limit** (`skoda-media-cart-limit` JS, cookie-based).
- **Client architecture:** per-asset `data-action="add|download|link"`, `data-id`, `data-size="giant|original"` on teasers/galleries; bulk download resolves to the **signed-S3 `/direct-download/` flow** (24 h expiring URL, `Content-Disposition: attachment`).
- **EDS/DA fit:** **Rebuild-as-service** (needs a cart-state backend + signed-download service) or **drop for pilot** (render assets as plain download links). Mediabox itself → can feed a static **downloads block** per press page.
- **⚠️ Scope update (2026-09-07):** the client's confirmed scope makes **"media cart functionality replicated" mission-critical for the 15 Oct demo** (device-ID, no login) — so "drop for pilot" is **no longer valid** for the demo. The bulk **zip-download** is the non-EDS-native piece; options (client-side zip / serverless endpoint / reuse legacy service / pre-zipped bundles) and a demo-vs-prod recommendation are in **`SKODA-MEDIA-CART-DOWNLOAD.md`**.

### 2.5 Supporting integrations
- **Consent:** OneTrust + `geolocation.onetrust.com` (country detection, also feeds banner geo). Loaded via GTM, not an inline `data-domain-script`.
- **Analytics:** GTM (`GTM-M5GMBWF`) **with a server-side sync endpoint** (`europe-west3-skoda-gtm-sync-server.cloudfunctions.net` — server-side tagging) + Hotjar. EDS: load in `delayed.js`.
- **Škoda cross-domain services (CSP):** `sdrive.skoda-auto.com`/`sdrive.azureedge.net`, `chargingcalculator/charging-calculator/chargemap.skoda-auto.com`, `cross.skoda-auto.com` — external Škoda apps that may be embedded on some pages (not seen on sampled editorial pages; **[PARTIAL]** — worth a scoped check).
- **`sowb/v1`** (POST widgets/forms|previews|permission), **`data-store/v1`** (POST/DELETE permission), **`speeches/v1`** (POST speech) — runtime/editor helpers; not public content sources; mostly out of migration scope.

### 2.6 `skoda-analytics` — bespoke tracking layer (deep-dived 2026-09-05)
- **What it is:** a **custom 140 KB analytics instrumentation layer** (mu-plugin) that sits *on top of* GTM — it **pushes a structured event schema to `window.dataLayer`**, not a thin GTM snippet. This is a genuine bespoke system, previously un-examined.
- **Event schema (dimensions):** `page.Section`, `page.Group`, `page.Name`, `page.LanguageVersion`, `page.ResponsiveLayout`, `page.Orientation`, `appweb.Name`, `content.Type`, `content.CategoryL`, `form.Type`, `form.Place`, `cta.Type`, `hit.ClickURL`. Events: `pageView`, **`trackEvent`**, **`trackEcEvent`** (an *ecommerce*-style event schema — 10 refs — even on this non-commerce site, likely for campaign/lead measurement).
- **Cross-cutting coupling (the important finding):** it explicitly instruments **forms (34 refs), downloads (23), share (14), BANNER (11), MediaCart (8), video (Vimeo/YouTube, 65 refs), and the AjaxLoader** (`YS.AjaxLoader.onAfterShowContent` / `SkodaAjaxLoader.afterShowContent` hooks — so load-more/listing interactions are tracked). **It is a dependency of nearly every interactive block**, not a standalone feature.
- **Dependencies:** `window.dataLayer` → GTM (`GTM-M5GMBWF`) → the server-side GTM sync (`…cloudfunctions.net`); consent-gated via OneTrust.
- **EDS/DA fit:** 🟠 **Rebuild-as-service (instrumentation).** The tracking is **not** carried by content — it must be re-implemented as an EDS instrumentation module that pushes the same `dataLayer` event schema, wired into each rebuilt block's decorate function, loaded in the **delayed phase** and consent-gated. **Risk: this is a hidden cost multiplier** — "rebuild the banner/media-cart/gallery/forms" each implicitly includes re-wiring their analytics events, or Škoda loses its established measurement taxonomy. **Open question:** obtain the full GTM/dataLayer spec from Škoda's analytics team so the event contract is preserved 1:1.

### 2.7 `ys-social-feed` — display carousel, NOT a live integration (deep-dived 2026-09-05)
- **What it is:** the full JS is a **one-liner** — it initializes **Owl Carousel** on a `.social-feed` container (autoplay 10 s, responsive 1/2/3 items). **It does no fetching** — no API call, no live Instagram/Facebook/Twitter pull, no token.
- **Content source:** the feed items are **server-rendered** (authored/curated in WP and cached into the page), then merely *displayed* as a rotating carousel. The `.social-feed` container did not appear on the homepage or the Škoda-World/Lifestyle hubs sampled → it's used on specific pages only (likely an about/campaign page). **[PARTIAL]** — exact placement not pinned down.
- **EDS/DA fit:** 🔵 **Adapt (a normal block), NOT a service.** This is **downgraded from the earlier "possible fifth dynamic system" concern** — it's just curated social cards in a carousel. Rebuild = the same **carousel block** already planned (native, replacing Owl), fed by authored content. If Škoda actually wants a *live* auto-updating feed, that would be a new SaaS-embed decision — but the current implementation is **not** live.

---

## 3. Cross-System Themes

- **Everything is opt-in & cookieless-until-action** → the static page stays cacheable; dynamic features are client-side add-ons. This is the key enabler for an EDS build.
- **Consent is the hub:** OneTrust geolocation feeds both consent *and* banner geo-blocking; GTM orchestrates analytics + consent. Any dynamic feature must respect the consent gate.
- **Per-locale everything:** banners, subscribers, mediaboxes, and search are all locale-scoped — reinforcing the per-locale architecture (indexes, trees) from `-EDS-DA-ARCHITECTURE` §9.
- **Signed-S3 downloads** are the shared delivery mechanism for press binaries (media-cart + direct-download) — a single service to reproduce, not per-feature.
- **The "dynamic surface" to reproduce** = 4 services (search, banners, newsletter, media-cart) + consent/analytics glue. None is content; all are integrations behind clean API boundaries.

---

## 4. EDS/DA Integration Boundary Map

| System | Static in EDS? | Recommended pattern | Minimal API contract EDS calls |
|---|---|---|---|
| Search (facets) | ✅ index | `helix-query.yaml` → `/{locale}/query-index.json`; client faceting | GET index JSON |
| Search (body/relevance) | ❌ | Hosted search SaaS fed by index | GET search API |
| Listings / load-more | ✅ index | Client block reads index, paginates, `pushState` | GET index JSON (chunked) |
| Banners | ❌ service | Vanilla client block + banner API + localStorage freq-cap | `GET /list/{locale}`, `GET /redirect/banner/{id}/{locale}` |
| Newsletter | ❌ service | Vanilla form block → ESP; consent preserved | `POST subscriber/create`, `subscription/save` (+opt-in) |
| Media-cart | ❌ service | Cart client + state backend + signed-download | `GET actions/history`, mediabox, `/direct-download/` |
| Mediabox downloads | ✅ static | Downloads block per press page | `GET mediabox/post/{id}/{lang}` (or bake at import) |
| Glossary term | ✅ static | Terms as content + modal (`/modals/`) | none (static) |
| Consent/analytics | ✅ delayed | OneTrust + GTM in `delayed.js` | vendor scripts |

---

## 5. Effort & Risk (pilot vs production)

| System | Pilot | Production | Risk | Confidence |
|---|---|---|---|---|
| Search index + facets | Build (index-only) | + hosted search | Med | High |
| Banners | **Drop** | Rebuild client + API/SaaS | High | High |
| Newsletter | Stub/embed | Rebuild + ESP + consent | High | High |
| Media-cart | **Drop** (plain links) | Rebuild cart + signed-download | High | High |
| Mediabox downloads | Build (static) | Build | Low | High |
| Consent/analytics (vendor scripts) | Include (delayed) | Include | Low | High |
| **`skoda-analytics` (custom event layer)** | Minimal (basic pageview) | **Rebuild instrumentation + per-block event wiring** | **High (hidden)** | High |
| `ys-social-feed` | Build (carousel, curated) | Build | Low | High |

---

## 6. New Findings & Corrections vs Prior Reports

1. **Banner platform is per-market, not global** — locale counts (cs 51 / en 46 / sk 2 / de 0 / sr 0 / sl 1) prove it's a real campaign engine keyed by language; earlier reports said "46 banners" as if global. *(Deepens `-IMPLEMENTATION-REVIEW`.)*
2. **`mediakit/v1/mediabox` newly exercised** — it's the per-post image set feeding the media-cart; **it can serve a static downloads block** even if the cart is dropped. (Not previously mapped.)
3. **`skodapedia/v1/term/{id}` returns rendered HTML**, not data — a server-render fragment. The glossary directory + filtering are static/client-side; the term detail is a thin API fetch (not fully static as such), but it's eliminable by pre-baking each term as a `/modals/` doc — so the glossary can be fully static in EDS with no API.
4. **Newsletter is confirmed an account system with 10 routes** incl. confirmation-URL fetch (single + batch) and a honeypot field — richer than "form + service."
5. **Zero cookies on anonymous load** — all state is opt-in; strengthens the "static pages stay cacheable" architecture assumption.
6. **Server-side GTM** (`…cloudfunctions.net`) — analytics uses server-side tagging, a detail for the consent/analytics re-integration.
7. **`sowb`/`data-store`/`speeches` are POST-only helpers** — not public content APIs; confirms `speeches` is not a migratable content type (consistent with adversarial review).

---

## 7. Open Questions & Residual Unknowns

- **Banner API ownership:** is `skoda-banners/v1` a Škoda-internal service that could be called directly from EDS, or must it be replaced? (governance)
- **ESP contract:** mailguide.cz API terms/consent flow for a rebuilt form — needs the vendor's spec (POST bodies not exercised).
- **Media-cart backend:** what stores cart state server-side; can a signed-download service be reused standalone?
- **`skoda-analytics` event contract:** obtain the full **GTM container + `dataLayer` event/dimension spec** from Škoda's analytics team so the custom event taxonomy (page/content/form/cta/ecommerce dimensions + video/download/share/banner/media-cart/load-more events) is preserved 1:1 in the EDS instrumentation rebuild. This is the key input for scoping the hidden analytics cost.
- **`ys-social-feed`:** which page(s) actually render it, and does the business want a *live* feed (new SaaS decision) or is the current curated-carousel behavior sufficient? **[PARTIAL]** — placement not pinned down.
- **Škoda cross-domain apps** (`sdrive`, charging calculators): do any editorial/model pages embed these? **[PARTIAL]** — needs a scoped page crawl.
- **`[RUNTIME-UNCONFIRMED]`:** banner popup timing/React render, consent-modal gating behavior, media-cart add flow, newsletter double-opt-in UX — all need a browser + (for some) real accounts.
- **Non-mutating limits:** POST contracts (create/save/add/permission) were **described from routes/JS, not fired** — exact request bodies remain unconfirmed by design.

---

## Appendix — Evidence Captured (all GET/read-only)

- Route maps: `skoda-banners/v1` (3), `media-cart/v1` (3), `newsletter/v1` (10), `skodapedia/v1` (2), `mediakit/v1` (2), `sowb/v1` (4), `data-store/v1` (2), `speeches/v1` (2).
- Banner `list/{locale}` replayed for all 6 locales (46/51/2/0/0/1); full field schema; tag histogram; React bundle function/localStorage inventory.
- Media-cart `history`/`actions` (anon empty); `mediakit mediabox/post/452813/en` (image set); skodapedia `term/1` (rendered-HTML 404 body).
- Newsletter route map + form fields (`email/terms/titel-nme-field`); `login/{fake}` → HTTP 500 (auth-gated, not pursued).
- Anonymous page load: **0 cookies**; CSP host inventory (mailguide, onetrust+geolocation, GTM server-side sync, Hotjar, Vimeo/YT, Škoda cross-domain).
- **Limitation:** anonymous, non-mutating, no browser; POST bodies and authenticated flows described from route shape/JS, not executed.
