# SKODA-213, Promo-box block (featured mosaic / auto-rotate slider)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 2–3d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/carousel-rails.md`](../../ui-specs/carousel-rails.md) §3/§5** (promo-box: `data-flickity {autoPlay:10000, pauseAutoPlayOnHover:true, prevNextButtons:false, watchCSS:true}`; rotating mosaic ≥768 vs 1-up auto-rotate <768). Home-composition context: [`template-home.md`](../../ui-specs/template-home.md) §Promo-box. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Gap that creates this ticket (2026-09-23): the featured `.promo-box` leads both `/en/` and `/en/media-room/` and has its **own** Flickity config (autoPlay + mosaic-vs-1up), distinct from the arrow-only rails (SKODA-212) and the Load-more feed (SKODA-214). `blocks/promo-box` does not exist on `main`. **NOT the ad-server promo-banner** (that is `promo-banner.md` / SKODA-9xx) — this is the editorial featured-story showcase.

## Summary
Deliver the `promo-box` featured showcase at the top of the home: a **mosaic grid ≥768** (no Flickity carousel, but featured cards cycle positions every 10s) that switches to a **1-up auto-rotating carousel <768** (10s, pause-on-hover, no prev/next buttons). Wraps `card-teaser` units with a promo-scale first card. The single most prominent module on the home.

## Description
Confirmed live: `.promo-box .items` at the top of `/en/` and `/en/media-room/` (impression context "Media Room - Promo box"). Per `carousel-rails.md` §3/§5 + §84–92:
- **≥768:** mosaic grid — `watchCSS:true` keeps Flickity un-booted (`@media (min-width:768px){ .promo-box .items:after{content:"" } }`); separate source behavior still cycles the featured cards between grid positions every 10s (confirmed in DevTools 2026-09-24).
- **<768:** `.promo-box .items:after{content:"flickity"}` activates it; 1-up auto-rotating carousel, `{ autoPlay:10000, pauseAutoPlayOnHover:true, prevNextButtons:false, watchCSS:true }`; only the first item shows until booted.
- Promo first-card title `29.6px / 35.5 / 400` white (`.promo-box .item:first-child .entry-title`), per `template-home.md` §74 + `card-teaser` promo scale.

Reuse-first: wraps `card-teaser` (SKODA-201, promo variant); may source items from author-curated cells (featured) — query-index optional.

## Requirements / Spec
- Responsive mode switch: **CSS mosaic ≥768** (Flickity un-booted, cards rotate between positions every 10s) / **JS 1-up carousel <768** (autoPlay 10s, pause-on-hover, no arrows).
- First item LCP-friendly (`fetchpriority=high`) — it is the home LCP candidate; rest lazy.
- Auto-rotation respects `prefers-reduced-motion` (no auto-advance when set); mobile carousel is swipe-operable + focus-safe.
- CSS scoped to `.promo-box`; tokens only; fluid → intrinsic → breakpoint per `docs/guardrails/css-guidelines.md`.

## Acceptance Criteria
Measurable gates in [`carousel-rails.md`](../../ui-specs/carousel-rails.md) §3/§5; summary:
- [ ] `blocks/promo-box` exists and decorates defensively.
- [ ] ≥768 renders a mosaic with cards cycling positions every 10s (no carousel booted); <768 renders a 1-up auto-rotating carousel (10s, pause-on-hover, no prev/next).
- [ ] `prefers-reduced-motion` disables auto-advance; mobile carousel swipe-operable + focus-safe.
- [ ] Promo first-card title `29.6px / 35.5 / 400` white ≥768; first image LCP-friendly.
- [ ] Output passes `npm run lint` + unit tests; visual diff vs source at 1280/768/500 ≤ 2% per-pixel.

## Dependencies
- Upstream: SKODA-201 (card-teaser promo variant), SKODA-106 (tokens), SKODA-202 (hero/LCP patterns); SKODA-402 (query-index) optional if items are indexed vs curated
- Downstream: SKODA-604 (home composition)

## Risks / Flags
- **Auto-rotate + watchCSS a11y:** the mosaic↔carousel mode switch, desktop card cycling, mobile dots/swipe/auto-advance, and reduced-motion/focus behavior require browser coverage; shared concern with SKODA-212/702/703.
- **Not promo-banner:** keep distinct from the ad-server `promo-banner` (E09) — this is the editorial featured showcase only.
- **Curated vs indexed items:** both author-curated (featured) and optional query-index-driven sources are supported.
- **Home composition boundary:** builds the *block*; assembly into `/en/` is SKODA-604.

## Authoring contract (issue #99)

`Promo box` is editorial content, not an ad slot. Curated mode uses **exactly three rows** in author order, each with a story link (usually in a teaser title), an optional image and optional summary. For source fidelity, add the story's publication date as its own paragraph (for example `24. 9. 2026`) and use full-resolution images and migrated story URLs. Image cells may be omitted without breaking decoration. If the row count differs from three or a story link is missing, the block displays a visible error and retains the authored rows for correction.

| Promo box | |
| --- | --- |
| ![Featured story](story-1.jpg) | 24. 9. 2026 <br> ### [Featured story](/en/stories/story-1) <br> Summary |
| ![Second story](story-2.jpg) | ### [Second story](/en/stories/story-2) |
| ![Third story](story-3.jpg) | ### [Third story](/en/stories/story-3) |

Optional index mode uses **only** key/value rows (do not combine with curated rows). `template` defaults to `story`, `index` to `/{locale}/query-index.json`, `sort` to `newest`, and `limit` to 3. `category` and `tags` accept comma-separated slugs (OR within each field; AND across fields); optional `path` scopes to a prefix. Indexed rows use the shared query-index loader and listing selection functions. Missing results, invalid settings, and index failures show an error instead of a blank promo.

| Promo box | |
| --- | --- |
| template | story |
| category | emobility |
| tags | elroq, enyaq |
| limit | 3 |

## Published-content QA (2026-09-24)

The branch's published `/en` page renders the three curated rows; `/en/` requests an absent `/en/index.md` and returns 404. Against the source homepage, card geometry is within 1px at 1280px and 768px; the mobile first card and block heights match at 500px. Mobile dot selection, scroll/swipe position, arrow-key selection, and the 10-second advance work on the published page.

Follow-up DevTools measurements at 1080px place the first and second cards at x8/x728 on **both** pages; at 1920px they are x344/x1176 on both. The large-screen side gutters match the source, so they were left unchanged. The source promo overlay has two mild gradients; the shared teaser's extra 70% bottom scrim has been removed for promo only. Despite Flickity being disabled on desktop, the source changes the cards' mosaic positions every 10s; the published branch now does likewise (measured 9,999ms between changes), while mobile still advances its slides. Rotation pauses on hover/focus and respects reduced motion.

Visual acceptance remains **pending**: the authored rows have no date paragraphs, so the source's dates are absent from every card. The second authored image only resolves to **272 × 182px** even when the browser requests a 750px rendition, making it visibly soft; replace that DA asset with a sufficiently large original. The current card links still target the WordPress source rather than migrated story paths. Those are content/import work for home assembly (SKODA-604), not data the block can recover from the authored rows. The 16px top-position difference at 500px comes from the surrounding header, not promo layout. Recheck comparable pixels once the content and header are corrected; do not mark the <=2% visual gate accepted yet.
