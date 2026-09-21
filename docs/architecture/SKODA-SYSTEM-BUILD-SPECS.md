# Škoda Storyboard — Build Specs for 5 Key Systems → Edge Delivery (DA / Experience Workspace)

**Companion to:** `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`, `SKODA-EDS-DA-ARCHITECTURE.md`, `SKODA-MEDIA-DEEP-DIVE.md`.
**Date:** 2026-09-05
**Purpose:** turn the "rebuild-as-service / adapt" verdicts into **implementation-grade specs** — content models, index/JSON schemas, `decorate()` outlines, and the exact static-vs-service boundary — for: **Search & filtered listings · Media cart · Newsletter & subscriptions · Škodapedia · Rich media embeds.**
**Method:** read-only, strictly non-mutating (no cart-add/signup/login/tracked-click) source probing + current aem.live doc grounding. POST/stateful contracts described from routes + JS, **not fired**. No browser → runtime items flagged `[RUNTIME-UNCONFIRMED]`. Reflects adversarial-2 corrections (glossary term-detail is a thin API fetch, not "fully static").

---

## 1. Overview — Mechanism & Boundary at a Glance

| System | Works today (source) | EDS/DA mechanism | Static or service? | Pilot? |
|---|---|---|---|---|
| Search & filtered listings | ElasticPress + `admin-ajax` load-more, **15 taxonomy facets** | **query-index (`helix-query.yaml`)** + listing block; Block-Collection **Search** | Static index (pilot); hosted search for body-relevance (prod) | ✅ **Yes** |
| Media cart | `media-cart/v1` state + `mediakit/v1/mediabox` + signed-S3 `/direct-download/` | **Static downloads block** (from mediabox) for pilot; cart = external service (prod) | Downloads static; cart = service | ⚠️ downloads only |
| Newsletter & subscriptions | `newsletter/v1` (10 routes), mailguide.cz, double-opt-in, consent+honeypot | **Form block → ESP API**; consent-gated | Service (ESP) | ❌ stub/defer |
| Škodapedia | 212 terms inline + **class-based A–Z/category filter** + **term-detail thin-HTML fetch** | **Static directory block + client filter + `/modals/` term detail** | Mostly static; detail = thin fetch (or pre-baked) | ✅ Yes (self-contained) |
| Rich media embeds | Vimeo (`dnt=1`), YouTube, Buzzsprout, Spotify; lazy `data-src` swap | **Autoblock-by-URL + lazy `<iframe>`** (`/docs/aem-embed`) | Static | ✅ Yes |

**Doc note (DA-specific):** spreadsheet-based indexing is **not supported in DA** (`/developer/indexing`) → the index is built with **`helix-query.yaml` CSS-selector indexing over published HTML**. This underpins Search/listings and Škodapedia.

---

## 2. Search & Filtered Listings

### How it works today
- **Search:** `/{lang}/search/?filter[search]=<q>` → server-rendered `teaser` results; form fields `search_type` (values: `post, press_release, press_kit, image, video`), `sortby`, `lang`, plus taxonomy facets.
- **Listings/load-more:** `POST /wp/wp-admin/admin-ajax.php` `action=ys_ajax_loader` + nonce. **`query_vars`** (live-captured): `{post_type, post_status:["publish","inherit"], ys_search_filter:true, ep_integrate:true, no_aggs:false, orderby:"post_date", order:"DESC", posts_per_page:6, offset:6}`. Response `{status, data:{html, found_posts, offset, posts_per_page, post_count, current_items}}`. Offset pushed to URL via `history.pushState`.
- **Facets (15, corrected from "14"):** `bodywork, company, concept, derivative, environment, equipment, happening, history, model, motorsport, sponsorship, technology, view, vip, years` (via `data-filter-name`).
- **Backend:** ElasticPress (`ep_integrate`); results server-rendered (HTML, not JSON records).

### EDS/DA target
**query-index + client-side listing block** (`/developer/indexing`, `/developer/block-collection/search`).

**Index schema** (`helix-query.yaml`, per-locale; CSS selectors over published HTML → `/{locale}/query-index.json`):
```
path, title, description, image, template (post|press_release|press_kit|…),
date, model, bodywork, derivative, motorsport, technology, equipment,
company, concept, environment, happening, history, sponsorship, view, vip, years, tags
```
(Facet columns = the 15 taxonomies; multi-value stored as comma-joined for client `includes()` filtering.)

### Content model (DA)
- **Listing page:** a doc containing a `Listing` block table — first row `Listing`; option rows for `template` filter, default sort, page size (6, matching source).
- **Search page:** a doc with the Block-Collection `Search` block (defaults to `/query-index.json`).

### `decorate()` / data-flow outline (Listing block)
1. Read current locale from URL prefix → fetch `/{locale}/query-index.json` (chunked if large).
2. Read facet state from URL query params (deep-link) → filter rows client-side across the 15 facet columns + `template`.
3. Sort (date/title); render first `pageSize` as cards; wire **"Load more"** → append next slice; `history.pushState` the offset (reproduces source deep-linking).
4. Render facet UI from distinct column values; on change, re-filter + update URL.

### Static ↔ service boundary
- **Static/index:** type filter, 15 taxonomy facets, sort, paging, deep-links, title/summary/tag match.
- **Service (prod only):** full-text **body** search, fuzzy/typo, relevance ranking → hosted search (Algolia/Elastic/Adobe) fed by the same index. **Pilot = index-only** (accept reduced recall).

### Perf / a11y / SEO
- Index fetch is one JSON GET (cacheable); paginate client-side. Facet checkboxes need labels + keyboard support. Listing pages should still expose canonical content for crawlers.

### Pilot vs prod / effort
- **Pilot:** index + listing block + Search block (index-only). **Prod:** add hosted search. **Effort: High** (the #1 pilot prototype). Risk 🟠.

---

## 3. Media Cart

### How it works today
- **Data source — `mediakit/v1/mediabox/post/{id}/{lang}`** (live): `{images:[{imageUrl, link, translated, title}]}` — the per-press-post downloadable image set.
- **Cart — `media-cart/v1`:** `GET /history` → `{hasHistory:false}` (anon), `GET /actions` → `{mediaCart:""}` (anon empty). State is **opt-in server-side** (no cookie until an add action); item **limit** enforced by `skoda-media-cart-limit` JS (cookie-based).
- **Per-asset hooks:** `data-action="add|download|link"`, `data-id`, `data-size="giant|original"`, `data-event-type="Attachment"`.
- **Download — `/direct-download/…`:** redirects **through the site to a signed S3 URL** (`skoda-storyboard.s3.eu-central-1…`, `X-Amz-Signature`, ~24 h expiry, `Content-Disposition: attachment`).

### EDS/DA target
**Two-tier:** (a) **Static downloads block** per press page (from mediabox data — bake at import); (b) **cart = external service** (production only).

### Content model (DA)
- **Downloads block:** first row `Downloads`; each row = asset (image/link + title + size label). Populated at import from the mediabox response (or authored).

### `decorate()` / data-flow
- **Pilot (static):** render download links directly (plain `<a download>` to the CDN/DAM asset); no cart, no signed-URL service.
- **Prod (cart service):** a cart client block calls a cart API (`add/remove/list`), persists to `localStorage` + a state service, and resolves bulk download via a **signed-download endpoint** (reproduce the S3-signing server-side; never expose keys client-side).

### Static ↔ service boundary
- **Static:** the per-page asset list + individual downloads (mediabox → block).
- **Service (prod):** cross-page **collection** (the cart), item-limit state, and **signed bulk download**. No static equivalent — rebuild or drop.

### Perf / a11y / pilot / effort
- Downloads block is trivial + accessible (labelled links). Cart service is **High effort** (state + signing). **Pilot: downloads-block only; cart deferred.** Risk 🔴 (cart), 🟢 (downloads).
- **⚠️ Scope update (2026-09-07):** client scope now makes the **media cart mission-critical for the 15 Oct demo** (device-ID, no login) — the "cart deferred" line above is superseded for the demo. The bulk **zip-download** (non-EDS-native) options + demo/prod recommendation are in **`SKODA-MEDIA-CART-DOWNLOAD.md`**.

---

## 4. Newsletter & Subscriptions

### How it works today
- **`newsletter/v1` — 10 routes:** `POST subscriber/create`, `POST subscriber/login`, `DELETE subscriber/logout`, `POST subscription/save`, `POST subscription/extend`, `GET login/{email}`, `GET extend/{email}`, `GET fetchConfirmationUrl/{email}`, `POST fetchConfirmationUrl/batch`, root. → a **subscriber account system**, not a fire-and-forget form.
- **Form:** `data-form-code="NewsletterFormWidgetV2"` / `NewsletterFormShortcode`; fields `email`, `terms` (consent checkbox), `titel-nme-field` (**honeypot**). **Double-opt-in** via confirmation URLs.
- **Backend:** **mailguide.cz** (ESP). `GET login/{fake-email}` → HTTP 500 (auth-gated; not exercised).
- ⚠️ **POST bodies not captured** (non-mutating rule) — described from route shape + form fields only.

### EDS/DA target
**Form block → external ESP API**, consent-gated. EDS has no subscriber backend; front the ESP.

### Content model (DA)
- **Newsletter block:** first row `Newsletter`; rows for heading, consent-text (link to privacy), success/error messages (or via `placeholders`). Rendered as a `<form>`.

### `decorate()` / data-flow
1. Render form (email + consent checkbox + hidden honeypot).
2. On submit: validate email + `terms` checked + honeypot empty → `POST` to the ESP/newsletter endpoint (mailguide or replacement).
3. Show "check your email" (double-opt-in) success; the confirmation link completes subscription server-side.
4. **Consent-gated:** only after OneTrust consent; load in delayed phase.

### Static ↔ service boundary
- **Static:** the form UI + client validation + honeypot.
- **Service:** everything else — subscriber create/login/subscription state, double-opt-in emails, consent record. **Rebuild-as-service** (keep mailguide or swap ESP).

### a11y / privacy / pilot / effort
- Real labels, error messaging, focus on error; GDPR consent + honeypot preserved. **Pilot: stub or embed provider form; full account flow = prod.** Risk 🔴. **Open: capture the ESP POST contract from mailguide's spec.**

---

## 5. Škodapedia Encyclopedia  *(corrected per adversarial-2: NOT fully static)*

### How it works today
- **Directory (static):** the index page renders **212 term titles inline** as `sp__list-directory__item`, each carrying **CSS classes = its letter + categories** (e.g. `sp-a kamiq karoq technology`). **27 A–Z nav links** (`sp__list-nav__link`).
- **Filtering (client-side, no fetch):** the A–Z letter filter and category filter (`sp__filter-input--checkbox`) work by **matching those CSS classes** — pure client-side, no API.
- **Term detail (thin API fetch):** clicking a term calls **`skodapedia/v1/term/{id}`** → `{content:"<div…>…</div>"}` — a **ready-rendered HTML fragment** shown in the `sp__term-detail` overlay. (Bad id → `{content:"<…error…>"}`.)

### EDS/DA target
**Static directory block + client-side filter + `/modals/` term detail** (`/developer/block-collection/modal`).

### Content model (DA)
- **Glossary index doc:** a `Glossary` block; each row = a term (title + letter + category tags) → rendered as the filterable directory.
- **Term detail:** two options —
  - **(a) Pre-bake (recommended):** each term is its own DA doc under `/modals/skodapedia/{slug}`; the directory links to it → EDS modal convention shows it, **zero runtime API**. Fully static.
  - **(b) Fetch:** keep a thin endpoint returning the term HTML (mirrors source) if terms must stay dynamic.

### `decorate()` / data-flow
1. Render the inline directory (all terms present → SEO-friendly, no fetch).
2. A–Z + category filter = toggle CSS visibility by class (reproduce source's client-side model).
3. Term click → open `/modals/…` doc (option a) with focus-trap/Escape/return-focus, **or** fetch the fragment (option b).

### Static ↔ service boundary
- **Static:** directory + A–Z/category filtering (100% client-side, confirmed).
- **Thin/optional:** term-detail fetch — **eliminable** by pre-baking terms as `/modals/` docs. So Škodapedia can be **fully static** if we pre-bake (recommended), or keep a thin fetch to mirror source.

### a11y / pilot / effort
- Modal must be accessible (the current overlay's focus behavior is `[RUNTIME-UNCONFIRMED]`). Directory is inline → good SEO. **Pilot: yes (self-contained).** Risk 🟡. **Effort Medium** (directory + filter + accessible modal).

---

## 6. Rich Media Embeds

### How it works today
- **Providers:** **Vimeo** (`player.vimeo.com/video/{id}?dnt=1&app_id=…`, poster from `i.vimeocdn.com`), **YouTube**, **Buzzsprout** (podcast, lazy `data-src`), **Spotify** (audio, ~1% pages).
- **Lazy mechanism (`ys-embed-controller`):** `IntersectionObserver` swaps `data-src`→`src` when the wrapper scrolls into view. `embed-controller-wrapper` present per embed.
- **Privacy:** Vimeo `dnt=1` (do-not-track); 3 `dnt=1` params on the sampled page.

### EDS/DA target
**Autoblock-by-URL + lazy `<iframe>`** (`/docs/aem-embed`, `/developer/markup-sections-blocks` auto-blocking). A bare provider URL on its own line becomes an embed block.

### Content model (DA)
- Author pastes the **provider URL** (Vimeo/YouTube/Buzzsprout/Spotify) on its own line → auto-blocked into an Embed block. No table needed for the common case.

### `decorate()` / data-flow
1. Detect provider from URL host; build the correct iframe embed URL (preserve **`dnt=1`** for Vimeo).
2. Set `loading="lazy"` (native) — reproduces the IntersectionObserver lazy-swap without custom JS.
3. Use an aspect-ratio wrapper (CSS) to avoid layout shift; optional poster/click-to-load for perf + consent.
4. **Consent:** gate third-party iframes behind OneTrust if required (click-to-load pattern).

### Static ↔ service boundary
- **Fully static** — no backend. External iframes only.

### a11y / perf / pilot / effort
- `<iframe title>`, lazy-load, aspect-ratio box (no CLS). Audio (Buzzsprout/Spotify) is a variant of the same block. **Pilot: yes.** Risk 🟢. **Effort Low–Medium** (provider matrix + lazy + consent).

---

## 7. Cross-System Boundary Map & Pilot Plan

| System | In capability pilot? | Static in EDS | Needs a service |
|---|---|---|---|
| Search & listings | ✅ | index + block + Search | hosted search (prod, body-relevance) |
| Media cart | ⚠️ downloads-block only | per-page downloads | cart state + signed-download (prod) |
| Newsletter | ❌ (stub/embed) | form UI | ESP + consent + account (prod) |
| Škodapedia | ✅ | directory + filter (+ pre-baked modals) | none (if pre-baked) |
| Embeds | ✅ | everything | none |

**In the capability pilot:** Search/listings (index-only), Škodapedia (pre-baked), Embeds, plus a static Downloads block. **Deferred:** the media-cart *service*, newsletter *account*, hosted body-search.

**Consent/analytics coupling (applies to all):** third-party embeds, newsletter, and any tracked interaction sit behind **OneTrust consent** and feed the bespoke **`skoda-analytics`** dataLayer (see `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md` §2.6) — each rebuilt block must re-emit its analytics events, loaded in the delayed phase.

---

## 8. Risks, Open Questions & Residual Unknowns

**Risks:**
- **Search index design is on the critical path** (DA has no spreadsheet index; `helix-query.yaml` selectors must extract 15 facet columns reliably). 🟠
- **Signed-download service** (media-cart) + **ESP POST contract** (newsletter) are unquantified backends. 🔴
- **Term-detail decision** (pre-bake vs fetch) changes whether Škodapedia is fully static. 🟡

**Open questions:**
- Exact **mailguide.cz POST body/consent contract** (not fired; needs vendor spec).
- Whether the **cart signed-download** service can be reused standalone or must be rebuilt.
- **Škodapedia:** pre-bake ~189 EN term docs under `/modals/` (recommended) vs keep a thin fetch?
- **Search:** is index-only recall acceptable for launch, or is hosted search required at go-live?

**Residual `[RUNTIME-UNCONFIRMED]`:** term-detail modal focus behavior, embed lazy-load timing, load-more scroll/render, consent-modal gating — all need a browser.

**Correction to log (for propagation):** facet count is **15**, not "14" as stated in earlier docs (`bodywork, company, concept, derivative, environment, equipment, happening, history, model, motorsport, sponsorship, technology, view, vip, years`).

---

## Appendix — Evidence (read-only, this pass)

- Load-more `query_vars` (live) incl. `posts_per_page:6, ep_integrate:true`; template `modules/media-room/templates/partials/loop`.
- 15 `data-filter-name` facets enumerated; search form fields (`search_type` values post/press_release/press_kit/image/video, `sortby`, `lang`, `terms`).
- `mediakit/v1/mediabox/post/{id}/en` → `{images:[{imageUrl,link,translated,title}]}`.
- Škodapedia: 212 inline `sp__list-directory__item`, 27 `sp__list-nav__link`, class-based filter tokens (`sp-a kamiq technology`), `skodapedia/v1/term/{id}` → `{content:"<html>"}`.
- Embeds: Vimeo `dnt=1&app_id`, Buzzsprout `data-src`, `embed-controller-wrapper`, poster `i.vimeocdn.com`.
- Docs cited: `/developer/indexing`, `/developer/block-collection/search`, `/developer/block-collection/modal`, `/developer/markup-sections-blocks` (auto-blocking), `/docs/aem-embed`, `/docs/fragments`, `/docs/placeholders`.
- **Limitation:** anonymous, non-mutating, no browser; POST/stateful contracts described from routes+JS, not fired.
