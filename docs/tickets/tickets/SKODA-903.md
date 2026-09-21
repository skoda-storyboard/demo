# SKODA-903 — Banner ad platform (per-market feed + vanilla client + geo/freq/tag)
- **Epic:** E09 — Dynamic Services
- **Type:** service
- **Phase:** C  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–12d *(planning estimate, not a quote)*

## Summary
Rebuild the bespoke per-market banner ad server as a small vanilla-JS block over a locale feed, with content-tag + geo + frequency targeting. Challenge whether the full ad-server machinery is warranted vs. a simpler featured-promo block.

## Description
The source banner platform is a **real per-market ad server** — a bespoke WP plugin fronted by a 174KB React SPA. Campaigns are **locale-scoped** (cs 51 / en 46 / sk 2 / de 0 / sr 0 / sl 1 banners), with **content-tag targeting** (`isBannerSameTag()` matches banner `tags` against the current page), **geo-blocking** (`blackListedCountries` + OneTrust geolocation), **frequency capping** (`localStorage["skoda-banner"]`: `bannerMaxedOut`/`showMax`/`showMaxExpiration`), and **popup triggers** (delay + scroll depth). There is no off-the-shelf product to enable — the logic must be re-created.

Rebuild = two pieces: **(a) data source** — either reuse the existing `skoda-banners/v1` API (fast, keeps a legacy dependency) *or* re-home banner management into an EDS **sheet/DA feed** (columns: image, type, target-tags, geo, frequency, link) served as JSON (no WordPress left); **(b) behavior** — a *small* vanilla client block (few hundred lines, rebuilt not ported): fetch `/list/{locale}` → tag/geo/frequency rules (`localStorage` cap) → render sidebar/inline/popup (timer/scroll) → tracked-redirect clicks; consent-gated; emits banner events to the dataLayer (SKODA-905). Dropped for pilot; this is the production build. **Worth challenging** whether the full ad-server machinery is wanted vs. a simpler featured-promo block.

## Requirements / Spec
- Data-source decision: reuse `skoda-banners/v1` API vs. re-home to an EDS sheet/DA feed (locale-scoped).
- Locale- and tag-aware selection: fetch locale feed, match banner tags to current page content tags, apply geo-block via OneTrust country.
- Frequency capping in `localStorage` (`showMax` / `showMaxExpiration` / maxed-out state).
- Render sidebar / inline / popup banner types; popup with delay + scroll-depth triggers.
- Click-through via tracked-redirect endpoint; consent-gated; banner events to the dataLayer.
- Vanilla JS only (no React/jQuery); loaded in delayed phase.

## Acceptance Criteria
- [ ] A documented decision on data source (legacy API vs. EDS feed) and on full-ad-server vs. featured-promo scope.
- [ ] Correct locale feed is loaded; banners are filtered by content-tag match and geo-block.
- [ ] Frequency cap prevents over-showing per `localStorage` rules across sessions.
- [ ] Sidebar/inline/popup render correctly; popup respects delay + scroll triggers; clicks route through the tracked redirect.
- [ ] Consent-gated; no banner logic runs pre-consent; banner events feed the dataLayer.

## Dependencies
- Upstream: SKODA-106 (design tokens + global CSS) / Downstream: SKODA-905 (banner event wiring)

## Risks / Flags
- **High (🔴):** bespoke rebuild; scope creep risk — challenge full ad-server vs. featured-promo before building.
- **Open:** is `skoda-banners/v1` a Škoda-internal service callable from EDS, or must it be replaced? (governance)
- Per-market imbalance (de/sr have 0 banners) — confirm which locales actually need the platform at launch.
- Banner popup timing / React render behavior is `[RUNTIME-UNCONFIRMED]` — verify in a browser.
