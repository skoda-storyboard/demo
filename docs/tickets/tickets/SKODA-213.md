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
- Auto-rotation respects `prefers-reduced-motion` (no auto-advance when set); mobile carousel is swipe-operable + focus-safe. Both layouts offer an explicit pause/resume control.
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

`Promo box` is editorial content, not an ad slot. Curated mode uses **exactly three rows** in author order, each with a story link (usually in a teaser title) and an optional image. Author a summary on each row because any card may become the lead. For source fidelity, add the story's publication date as its own paragraph (for example `24. 9. 2026`) and use full-resolution images and migrated story URLs. Image cells may be omitted without breaking decoration. If the row count differs from three or a story link is missing, local/preview shows an error and retains the authored rows for correction; published pages hide the block and log the error.

| Promo box | |
| --- | --- |
| ![Featured story](story-1.jpg) | 24. 9. 2026 <br> ### [Featured story](/en/stories/story-1) <br> Summary |
| ![Second story](story-2.jpg) | ### [Second story](/en/stories/story-2) <br> Summary |
| ![Third story](story-3.jpg) | ### [Third story](/en/stories/story-3) <br> Summary |

Optional index mode uses **only** key/value rows (do not combine with curated rows). `template` defaults to `story`, `index` to `/{locale}/query-index.json`, `sort` to `newest`, and `limit` to 3. `category` and `tags` accept comma-separated slugs (OR within each field; AND across fields); optional `path` scopes to a prefix. Indexed rows use the shared query-index loader and listing selection functions. Missing results, invalid settings, and index failures show an error with technical detail on local/preview hosts; published hosts hide the block and log the error without exposing raw settings or diagnostics to visitors.

| Promo box | |
| --- | --- |
| template | story |
| category | emobility |
| tags | elroq, enyaq |
| limit | 3 |

## Published-content QA (2026-09-24)

The branch's published `/en` page renders the three curated rows; `/en/` requests an absent `/en/index.md` and returns 404. The mobile first card and block heights match the source at 500px. Mobile dot selection, scroll/swipe position, arrow-key selection, and the 10-second advance work on the published page.

The source article has no left margin, but its parent `.item` has 8px left padding: its visible media starts at x8 at 1080px. The requester explicitly wants the first EDS teaser flush to the block edge, so its left margin is removed at ≥768px: first card x0 at 1080px and x336 at 1920px, intentionally 8px farther left and 8px wider than the source. Right-hand cards retain their source positions (x728 at 1080px, x1176 at 1920px); the mobile layout is unchanged. The source promo overlay has two mild gradients; the shared teaser's extra 70% bottom scrim has been removed for promo only. Despite Flickity being disabled on desktop, the source changes the cards' mosaic positions every 10s; the published branch now does likewise (measured 9,999ms between changes), while mobile still advances its slides. Rotation pauses on hover/focus and respects reduced motion.

The source `.promo-box` also has 16px top margin and 32px bottom margin at ≥768px, overridden to **0px bottom margin** on mobile. Matching those margins fixes the previously misattributed 16px top offset: both headers end at y108, and the promo starts at y124 on each page; at 1280px the next wrapper starts at y622 versus source y622.75. DevTools reports the initial lead image as the mobile LCP element (332ms in one 500px capture), already marked `loading="eager"` and `fetchpriority="high"`; remaining images stay lazy.

Promo titles now use the source's two-line `max-height` and `overflow: hidden` instead of CSS `-webkit-line-clamp`: authored titles remain intact in the DOM, and overflow does not acquire a generated ellipsis. The lead title may occupy two lines on desktop/tablet; side and mobile titles have the same two-line cap. Dates remain an authored-content task, not a block-generated value.

Visual acceptance remains **pending**: the authored rows have no date paragraphs, so the source's dates are absent from every card. The second authored image only resolves to **272 × 182px** even when the browser requests a 750px rendition, making it visibly soft; replace that DA asset with a sufficiently large original. The current card links still target the WordPress source rather than migrated story paths. Those are content/import work for home assembly (SKODA-604), not data the block can recover from the authored rows. Recheck comparable pixels once the content is corrected; do not mark the <=2% visual gate accepted yet.

## Indexed home and library authoring (2026-09-24)

DA `/en` now authors the promo as three key/value rows: `template | story`, `sort | newest`, `limit | 3`. It selects the latest three stories from `/en/query-index.json` at render time; the currently indexed dates are 24, 22, and 17 September 2026. Indexed story titles include a site-wide ` - Škoda Storyboard` SEO suffix; the shared teaser renderer strips only that suffix from visible titles and image alt text. The index supplies the card dates and migrated paths, rather than guessing them from home metadata. This is **previewed content only** until the promo-box code lands on `main`; publishing `/en` earlier would expose its config rows on the live main page.

The DA sample document `tools/sidekick/blocks/promo-box` contains two heading-based content variants, **Curated stories** (three authored teasers with dates and internal links) and **Latest three stories** (the same indexed configuration as `/en`). The `tools/sidekick/blocks.json` Blocks sheet references this document and the pre-existing Cards example. Library registration still requires an admin to add a `library` tab in `https://da.live/config#/skoda-storyboard/demo/` with `title | path | format | ref | icon | experience` columns and a `Blocks` row pointing to `https://content.da.live/skoda-storyboard/demo/tools/sidekick/blocks.json`. Confirm that both headings appear as distinct block variants in the editor palette. The config UI requires Adobe sign-in; DA source editing alone cannot register it.

Branch preview `/en` renders the three indexed cards with source dates and internal links at 1280px and 500px, without a promo error or horizontal overflow. The first indexed image is eager/high-priority and remains the browser's LCP element on fresh loads at both widths. The Peaq image from the index **still resolves to 272 × 182px** when requested at 750px; its source media needs replacement before visual QA can accept the page. Re-evaluate the visual gate with the indexed data, including possible title/summary differences from the source.

## Review follow-up (2026-09-25)

Every indexed card now has a summary and 1200px desktop / 750px compact image sources, since desktop rotation moves every card through the lead slot. Curated cards need an authored summary on **each** row for the same reason; all curated images use lead-size sources without replacing their editable DA `<img>` elements. The first image remains eager/high priority; others remain lazy. An explicit pause/resume control is present in both layouts, alongside automatic hover/focus and reduced-motion suspension. Promo copy reads the locale placeholders keys `Promo Featured Stories`, `Promo Featured Story Slides`, `Promo Go To Story` (use `{number}`), `Promo Pause Rotation`, `Promo Resume Rotation`, and `Promo Unavailable`; English is the fallback until translated sheet entries exist.

The index loader still reads all chunks before selecting globally newest stories. Rendering only the first chunk could change the selection when the index grows or chunks are not date-ordered; revisit LCP with measured full-index data and a dedicated feed or ordering contract if needed.

---
### Relations
**Depends on:** #15 (SKODA-201 card-teaser promo variant) · #14 (SKODA-106 tokens) · #16 (SKODA-202 hero/LCP patterns)
**Blocks:** #38 (SKODA-604 home composition)
**Sibling home blocks:** #97 (SKODA-214 feed) · #98 (SKODA-212 rails)

*Ticket source of truth on `main`: `docs/tickets/tickets/SKODA-213.md`.*
