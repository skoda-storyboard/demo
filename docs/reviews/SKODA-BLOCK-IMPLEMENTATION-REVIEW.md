# Škoda Storyboard — Block Implementation Review (Critical Technical Deep-Dive)

**Companion to:** `SKODA-STORYBOARD-DISCOVERY.md`, `SKODA-STORYBOARD-DRILLDOWN.md`, `SKODA-EN-BLOCK-INVENTORY.md`
**Date:** 2026-09-04
**Reviewer stance:** Senior frontend specialist reviewing inherited code — critical, evidence-first, focused on what will bite during an EDS rebuild.
**Method:** Static source read (block/plugin JS, 128 KB main bundle, 295 KB `media-room.css`, rendered pages per template) **+ live endpoint replay** (the browser-driven AJAX/REST calls, executed directly with curl to capture real request/response contracts).

> **Tooling caveat — read this.** The Playwright MCP browser did **not** come online this session, and a headless browser could not be installed (no system Chrome; npm binary fetch timed out). So I could not visually click/hover/screenshot. **Instead I captured genuine runtime behavior by replaying the exact XHR/REST endpoints** the page fires — which yields the real data contracts (load-more, banners, media-cart, newsletter, glossary). Items that genuinely require a rendered viewport (focus-trap behavior, computed-style contrast, layout-shift measurement, hover-menu timing) are explicitly marked **[RUNTIME-UNCONFIRMED]** and listed as follow-ups. This is the plan's documented graceful-degradation path.

---

> **Note (2026-09-04):** Corrected by adversarial review (`SKODA-ADVERSARIAL-REVIEW.md`): story pages use SiteOrigin Page Builder (import must flatten a nested widget layout); the gallery has a lightbox with its own breakpoint; the media library has now been measured (see SKODA-MEDIA-DEEP-DIVE.md): ~42.3k attachment pages / ~28.3k distinct logical items / ~200k+ physical files (with the derivative ladder), ≈80–110 GB — not ~52k.

> **Note (2026-09-05):** Deepened by the complex-systems deep-dive (`SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`): the banner platform is a per-market ad server (locale-scoped campaigns + tag/geo/frequency targeting); the Škodapedia glossary's directory+filter are static but term detail is a thin API fetch (pre-bakeable to `/modals/`); `mediakit/v1/mediabox` feeds media-cart downloads and can serve a static downloads block; the site sets zero cookies on anonymous load (all state is opt-in).

---

## 1. Executive Read — Top Cross-Cutting Risks

1. **jQuery is load-bearing everywhere.** Core (`jquery.min.js` + `jquery-migrate`) plus every block module is a jQuery IIFE. EDS is vanilla-JS/no-jQuery. **Every block's JS must be rewritten from scratch** — there is no lift-and-shift. Budget for reimplementation, not porting.
2. **Three heavyweight JS libraries underpin the "simple" blocks:** **Owl Carousel** (gallery + carousels), **Isotope** (masonry grids), and a **174 KB React bundle** for banners. None survive to EDS; each needs a lightweight native replacement.
3. **The "promo banner" is a full ad-serving platform, not a block.** The `skoda-banners/v1` API returns targeted banners with geo-blocking, frequency capping, popup triggers, and click-tracking. Crucially, banner sets are **per-market/locale-scoped campaigns**, not one global list — measured per-locale counts (cs 51, en 46, sk 2, de 0, sr 0, sl 1) with **content-tag targeting** (banners match the page's tags), geo-blocking, `localStorage` frequency-capping, and popup triggers: a real per-market ad server (see `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`). This was under-scoped in prior reports — see §3.7. **Re-classify as an integration.**
4. **The newsletter is an account system, not a form.** `newsletter/v1` exposes **10 routes** — `subscriber/create|login|logout`, `subscription/save|extend`, and confirmation-URL fetch (single + batch) — plus a honeypot field, i.e. login state and subscription management, not a fire-and-forget signup (see `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`). **Backend service required.**
5. **Listings AND search both run on ElasticPress.** The load-more payload carries `ep_integrate:true` + `ys_search_filter:true` — confirmed live. The EDS query-index approach (per Drill-Down §1) must replicate ElasticPress-backed faceting; the dependency is broader than "just search."
6. **CSS is a maintenance-debt codebase:** 168 `!important`, **30 distinct breakpoints** (no consistent scale), `z-index:9999` escalation, JS-based text truncation (`dotdotdot`), `padding-bottom` ratio hacks (no modern `aspect-ratio`), and `:only-child` link detection — the exact anti-pattern this project's own `AGENTS.md` warns against. **Do not port the CSS; re-derive tokens and rebuild.**
7. **Media-cart couples into every teaser.** Each card carries `data-id/data-action/data-event-type` attributes wired to the cart. Teasers can't be cleanly migrated without deciding the media-cart's fate first.
8. **Story pages are built with SiteOrigin Page Builder** *(adversarial review correction)*. Story-template pages (**story only** — not press-release, Škodapedia, or home) are laid out as a nested SiteOrigin panel-grid/widget tree (`so-panel`, `panel-grid`, `so-widget-*`), **not** linear HTML. **Implication:** the story import parser must **flatten the builder tree** into EDS sections/blocks rather than reading a flat DOM. This raises the story-template import effort beyond what a straight HTML parse would suggest.

---

## 2. JS Library & Dependency Inventory

| Library | Used by | Refs in main.js | EDS disposition |
|---|---|--:|---|
| **jQuery + Migrate** | everything | 48 | **Remove** — rewrite all blocks vanilla |
| **Owl Carousel** | gallery, carousels | 10 | Replace with native scroll-snap / small carousel |
| **Isotope** | masonry card grids | 29 | Replace with CSS grid / `column` layout |
| **isMobile** | device sniff | 3 | Replace with CSS media queries / `matchMedia` |
| **dotdotdot** | title/summary line-clamp | 2 | Replace with CSS `line-clamp` |
| **lazyload** | images | 10 | Native `loading="lazy"` |
| **React** (banner.js, 174 KB) | banner popups | — | Drop; rebuild banner integration if kept |
| **IntersectionObserver** | embed lazy-swap | native | Keep pattern (native) |

**Implication:** the JS surface looks small per-block (files are 0.5–2.5 KB) only because the heavy lifting is in shared libraries. Real reimplementation effort is higher than file sizes suggest.

---

## 3. Per-Block Dossiers

### 3.1 Hero
- **Backend/data:** server-rendered; no API. **Good.**
- **Markup:** `<div class="hero">` containing a real `<img>` (not a CSS background-image). **Excellent for EDS** — maps directly to a `<picture>` and is LCP-friendly.
- **JS:** none block-specific.
- **CSS:** full-bleed via container; overlay text over image. Watch overlay/text **contrast** over arbitrary photos **[RUNTIME-UNCONFIRMED]**.
- **Metadata:** `ImageObject` structured data present — preserve.
- **a11y:** verify `<h1>` lives in hero and alt text is meaningful.
- **EDS:** **CSS-only port, Low risk.** Prior "Low effort" rating holds.

### 3.2 Cards / Teaser
- **Backend/data:** server-rendered cards, **but each teaser embeds media-cart hooks:** `data-event-type="Attachment" data-action="add" data-id="452813" data-original-only="true"`.
- **Markup:** `article-teaser` / `teaser-media` / `teaser-toolbar` / `entry-buttons`. Toolbar holds favorite + media-cart actions.
- **JS:** `dotdotdot` clamps `.entry-title` / `.entry-summary` — **JS truncation**; replace with CSS `line-clamp`.
- **CSS:** image containment via `object-fit`/ratio hack; grid via Isotope on some layouts.
- **Coupling risk:** **teaser cannot be migrated in isolation** — its toolbar depends on the media-cart decision (§3.5). For the demo, render teasers **without** cart actions.
- **EDS:** **JS-light + coupling. Low–Medium risk** (up from Low, due to cart coupling + Isotope on grid variants).

### 3.3 Gallery
- **Backend/data:** server-rendered image set; downloads link to CDN assets.
- **JS:** **Owl Carousel** (`gallery-layout-contentspecial`) with custom prev/next injection, **plus** the column-count-by-width logic (`>1024px & >19 items → 5 cols; >9 → 4; else 3`). This is the **most JS-driven content block.**
- **Lightbox** *(adversarial review correction)*: the gallery also includes a full-screen **lightbox** (`sb-gallery-lightbox`) with its **own** JS-driven `width() <= 767` mobile breakpoint — a **second** responsive behavior distinct from the column-count logic. The rebuild therefore carries **focus-trap / keyboard-a11y scope** (open/close, arrow navigation, Escape, return-focus) on top of the responsive grid work.
- **CSS:** `padding-bottom` ratio hack for thumbnails; overflow hidden.
- **a11y:** Owl galleries are typically **keyboard/focus-poor** — verify arrow-key nav and focus management **[RUNTIME-UNCONFIRMED]**; likely needs rebuild for WCAG.
- **EDS:** **JS-heavy. Medium–High risk.** Rebuild as native carousel + responsive grid; reimplement column logic with `matchMedia`/CSS.

### 3.4 Carousel / Promo rotation
- **Backend/data:** `promo-box` with `data-rotate` / `data-pause` intervals; content server-rendered.
- **JS (`skoda-carousel/public.js`):** rotates by moving the first `.item` to the end on an interval; **hover-pause**; and a genuinely **hacky CSS-flag check** — it reads `getComputedStyle(el, ':after').content === 'flickity'` to decide whether to defer to Flickity. This is fragile, undocumented coupling between CSS and JS.
- **a11y:** auto-rotating content with no pause/stop control is a **WCAG 2.2.2 violation** risk — must add controls in rebuild.
- **EDS:** **JS-light but fix a11y. Medium risk.** Drop the `:after`-content flag hack entirely.

### 3.5 Media-Cart actions
- **Backend/data:** `media-cart/v1` REST — replayed live: `GET /history` → `{"hasHistory":false}`, `GET /actions` → `{"mediaCart":""}`. State is **opt-in** and server-side; add/download actions mutate server state. Note: the site sets **no cookies on anonymous load** — the empty cart for anon users reflects that all stateful systems (cart, favorites, newsletter) are opt-in, which is good for EDS cacheability (see `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`).
- **Downloads data source:** `mediakit/v1/mediabox/post/{id}/{lang}` returns the per-post downloadable image set — this is the cart's underlying data source. It can feed a **static downloads block** even if the cart itself is dropped.
- **Markup contract:** every asset carries `data-action="add|download" data-id data-size data-event-type="Attachment"`.
- **JS:** `skoda-media-cart` + `media-cart-limit` (12 KB) enforce a cart item cap.
- **EDS:** **Backend-dependent. High risk / demo-descope.** No static equivalent for the cart itself, but `mediakit/v1/mediabox` makes a static per-post downloads block feasible. For the demo, render assets as plain download links (optionally sourced from the mediabox set); defer the cart to a service decision.

### 3.6 Faceted Listing + Load-more
- **Backend/data (replayed live):** `POST /wp/wp-admin/admin-ajax.php` with `action=ys_ajax_loader`, `nonce`, and serialized `query_vars`. Response: `{status, data:{html, found_posts:1659, offset, posts_per_page, post_count, current_items}}`. **`ep_integrate:true` + `ys_search_filter:true` confirm ElasticPress backs listings.**
- **Client behavior:** appends rendered HTML, updates a live counter, and **mutates the URL via `history.pushState`** (offset query param) — deep-linkable pagination.
- **Facets:** **15 taxonomy dimensions** exposed via `data-filter-name` (model, bodywork, derivative, motorsport, equipment, technology, years, view, company, concept, environment, happening, history, sponsorship, vip).
- **CSS:** relies on server-rendered `loop` partial template.
- **EDS:** **Backend-dependent → re-architect. High risk.** Replace with a published query-index + client faceting. Must preserve deep-link offsets and the 15 facets. **This is the #1 demo prototype.**

### 3.7 Promo Banner  ⚠️ **RE-SCOPED — bigger than a block**
- **Backend/data (replayed live):** `GET /wp-json/skoda-banners/v1/list/{locale}` → **35 KB, 46 banners for `en`.** Banner sets are **locale-scoped campaigns**, not one global list: measured per-locale counts are **cs 51, en 46, sk 2, de 0, sr 0, sl 1** — a genuine per-market ad server (see `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`). Per-banner fields: `creative{mobile,tablet,desktop}`, `type` (sidebar 17 / widget 27 / positional 2 for `en`), `minViews`, `showMax`, `showMaxExpiration` (frequency capping), `popupTriggerDelay`, `popupTriggerScroll`, `blackListedCountries` (geo-targeting), `tags` (**content-tag targeting — banners match the page's tags**), and a **click-tracking redirect** `.../v1/redirect/banner/{id}/{locale}`.
- **JS:** `banner.js` is **174 KB and bundles React**, uses `localStorage` for view-capping (frequency capping), drives popups.
- **EDS:** **Full per-market ad-serving integration, not a content block. High risk.** Decision required: keep the banner service (call the per-locale API client-side) or drop for demo. Prior reports treated this as a "Medium" block and a single "46 banners" list — **corrected to a per-market backend integration.**

### 3.8 Škodapedia Glossary
- **Backend/data:** term list rendered **inline** (all ~190 terms in `sp__list`) — **no per-term AJAX** for the directory, which is good. The A–Z directory + filter are **100% client-side static (no fetch)**. Term detail, however, is a **thin API fetch on click**: `skodapedia/v1/term/{id}` returns ready-rendered HTML (a bare `skodapedia/v1/term` 404s, needs params); detail overlay reads inline `data-term`. Net: **directory+filter static; term detail a thin API fetch (pre-bakeable to `/modals/`)** — eliminable by pre-baking terms as `/modals/` docs (see `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`).
- **JS:** A–Z `letterFormWidget` filters the inline list client-side; `sp__term-detail` overlay opens term detail.
- **a11y:** overlay needs **focus trap + Escape + return-focus** — verify **[RUNTIME-UNCONFIRMED]**; typical WP modals miss this.
- **EDS:** **JS-medium, self-contained. Medium risk.** Clean to migrate: directory+filter static; term detail a thin API fetch (pre-bakeable to `/modals/`) — index terms in a spreadsheet, client A–Z filter, and an accessible `/modals/` dialog; no backend needed once terms are pre-baked.

### 3.9 Embeds (video / audio)
- **Backend/data:** none — third-party iframes.
- **JS (`ys-embed-controller`):** `IntersectionObserver` swaps `data-src`→`src` on scroll (lazy). **Keep this pattern (native).**
- **Privacy:** Vimeo uses `dnt=1` (do-not-track) and `app_id`; Buzzsprout podcast via `data-src`. Consent-aware. Providers confirmed: Vimeo, YouTube, Buzzsprout, Spotify.
- **CSS:** responsive sizing via ratio hack.
- **EDS:** **JS-light. Low–Medium risk.** URL-based autoblocking + lazy iframe; preserve `dnt=1`.

### 3.10 Tags / Parallax / Newsletter / Social / App-badges
- **Tags:** `tag-list`, taxonomy-driven links. CSS-only. **Low.**
- **Parallax (`ys-parallax`):** ⚠️ **unthrottled `scroll` handler** writing `transform` every event (no rAF/throttle) — **jank/perf red flag**; skips IE11; only animates the *first* `.ys-parallax_background`. Decorative — **simplify or drop on mobile.** Low value, easy to cut.
- **Newsletter (`newsletter/v1`):** ⚠️ **account system exposing 10 routes** — `subscriber/create|login|logout`, `subscription/save|extend`, and confirmation-URL fetch (single + batch). Uses **mailguide.cz** (`data-form-code="NewsletterFormWidgetV2"`). Fields include `email`, `terms` (consent), honeypot (`titel-nme-field`). **Backend + consent + GDPR. High.** Do **not** submit test data.
- **Social feed (`ys-social-feed`):** 224-byte stub client-side; feed content server/embedded. Low, but external dep.
- **App badges:** static store links in footer. **Trivial.**

### 3.11 Header/Mega-menu + Footer (chrome)
- **Mega-menu:** `nav.primary-nav` with `dotdotdot` on menu text; desktop hover vs mobile hamburger is a real **behavior switch** — verify timing/focus **[RUNTIME-UNCONFIRMED]**.
- **Footer:** newsletter + social + app badges + legal; build once as an EDS fragment.
- **EDS:** rebuild as `header`/`footer` fragment blocks (expected work). **Medium.**

---

## 4. Runtime Interaction Findings (via endpoint replay)

What replaying the page's own network calls uncovered that static HTML did **not**:

| Interaction | Endpoint (live-replayed) | Finding |
|---|---|---|
| "Load more" on listing | `POST admin-ajax.php?action=ys_ajax_loader` | Nonce-protected; `ep_integrate:true` (ElasticPress); returns `found_posts:1659` + rendered HTML; `history.pushState` deep-links offset |
| Promo banners | `GET skoda-banners/v1/list/{locale}` | Locale-scoped campaigns (cs 51 / en 46 / sk 2 / de 0 / sr 0 / sl 1); tag/geo/freq/popup targeting; click-tracking redirects; React 174 KB — a per-market ad server |
| Media cart | `GET media-cart/v1/history`, `/actions` | Opt-in server state (no cookies on anon load); empty for anon; add/download mutate server |
| Mediabox (downloads) | `GET mediakit/v1/mediabox/post/{id}/{lang}` | Per-post downloadable image set — the cart's data source; can feed a static downloads block |
| Newsletter | `newsletter/v1/subscriber/*`, `subscription/*` | 10 routes; full subscriber lifecycle (login state) + honeypot — an account system |
| Škodapedia term | `skodapedia/v1/term/{id}` | Returns rendered HTML (not data); bare route 404s; directory+filter static, term detail a thin API fetch (pre-bakeable to `/modals/`) |

**Still requires a real browser [RUNTIME-UNCONFIRMED]:** focus-trap correctness on glossary/banner modals; auto-rotating carousel pause controls; mega-menu hover timing; computed-style contrast on hero overlays; Cumulative Layout Shift when AJAX content and banners inject.

---

## 5. Section & Background System

- **Observed section classes are thin:** `container` (135×), `theme-skoda-bnr-web`, `section`, and only light use of `dark`/`light`. The site does **not** appear to use a rich dark/accent/inverse section taxonomy on content pages the way the WKND EDS boilerplate does — backgrounds are mostly per-block (hero image, banner creatives) rather than per-section themes.
- **Parallax background** is a single decorative layer via `transform` on scroll (see §3.10).
- **EDS mapping:** a **small** section-metadata vocabulary suffices (default + a `dark` variant + full-bleed for hero). Don't over-build a section theme system the source doesn't have. Full-bleed hero + contained content is the dominant pattern.

---

## 6. Consolidated Risk & Effort Table

| Block | Mechanism | Top concern | Effort | Risk |
|---|---|---|---|---|
| Hero | CSS-only | Overlay contrast | Low | 🟢 |
| Cards/Teaser | JS-light + Isotope | Media-cart coupling; JS truncation | Low–Med | 🟡 |
| Gallery | JS-heavy (Owl) | Column logic + a11y + Owl replacement | Med–High | 🟠 |
| Carousel/Promo | JS-light | `:after`-content flag hack; auto-rotate a11y | Med | 🟡 |
| Media-cart | Backend | No static equivalent; per-teaser coupling | High | 🔴 |
| Faceted Listing | Backend (ElasticPress) | Re-architect to query-index; 15 facets; deep-link | High | 🔴 |
| Promo Banner | Backend (per-market ad server) | Locale-scoped campaigns (cs 51/en 46/…), tag/geo/freq/popup, React 174 KB | High | 🔴 |
| Škodapedia | JS-medium | Accessible modal + A–Z filter | Med | 🟡 |
| Embeds | JS-light (IO) | Preserve `dnt=1`; 4 providers incl. audio | Low–Med | 🟢 |
| Tags | CSS-only | — | Low | 🟢 |
| Parallax | JS (scroll) | Unthrottled handler; drop/simplify | Low | 🟢 |
| Newsletter | Backend + consent | Account lifecycle; GDPR; mailguide | High | 🔴 |
| Header/Footer | JS behavior switch | Mega-menu desktop/mobile; fragment | Med | 🟡 |

---

## 7. Corrections & Deepenings vs. Prior Reports

1. **Promo banner** was "Medium block" / "46 banners" → **corrected to a full per-market ad-serving backend integration** (locale-scoped campaigns: cs 51 / en 46 / sk 2 / de 0 / sr 0 / sl 1; content-tag/geo/freq/popup targeting; React) — see `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`.
2. **Newsletter** was "form + external service" → **deepened: a 10-route subscriber account system** (create/login/logout, subscription save/extend, confirmation-URL fetch single+batch, + honeypot).
3. **Faceted listing**: **now confirmed ElasticPress-backed** (not just search) via `ep_integrate` in the live load-more payload — the ES dependency is broader than Drill-Down §1 implied.
4. **Gallery** confirmed as the standout JS-driven content block (Owl + width-based columns).
5. **New anti-patterns catalogued:** 168 `!important`, 30 breakpoints, `dotdotdot` JS truncation, `:after`-content JS flag, unthrottled parallax scroll, `:only-child` link detection, Isotope masonry.
6. **New backend map:** listings via `admin-ajax` + nonce; banners/media-cart/newsletter REST contracts captured live.

---

## 8. Open Questions / Confirmations Needed

1. **Media cart, favorites, banners, newsletter** — for each: rebuild as a service, or drop for the demo? (All four are backend-dependent; they dominate risk.)
2. **ElasticPress replacement** — accept a query-index with title/summary/tag matching + 15 facets, or procure hosted search? (Confirms Drill-Down §1 decision.)
3. **Auto-rotating carousels & modals** — commit to WCAG-compliant rebuilds (pause controls, focus traps)?
4. **Live-render confirmations** — approve a short follow-up once a browser is available to close the `[RUNTIME-UNCONFIRMED]` items (contrast, CLS, focus traps, hover timing).

---

## Appendix — Evidence Captured

- **JS:** `main.js` (128 KB), `banner.js` (174 KB, React), `media-cart-limit.js` (12 KB), `ys-ajax-loader` module, `skoda-carousel/public.js`, `skoda-gallery/public.min.js`, `ys-parallax/parallax.js`, `ys-embed-controller`.
- **CSS:** `media-room.css` (295 KB, 284 media queries, 168 `!important`), plugin CSS (banner, media-cart).
- **Live endpoint replays:** `ys_ajax_loader` load-more (found_posts 1659), `skoda-banners/v1/list/en` (46 banners), `media-cart/v1/history|actions`, `newsletter/v1/*` route map, `skodapedia/v1/term`.
- **Pages:** story, press release, Škodapedia index + term, news listing, homepage.
- **Structured data:** Yoast graph (Article, Person, BreadcrumbList, ImageObject, WebPage/WebSite, CollectionPage for glossary) — preserve during migration.
- **Limitation:** no rendered-DOM/visual verification this session; `[RUNTIME-UNCONFIRMED]` items require a browser follow-up.
