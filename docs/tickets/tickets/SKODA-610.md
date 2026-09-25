# SKODA-610, Clean index titles (drop " - Škoda Storyboard")
- **Epic:** E06, Import Pilot Content
- **Type:** import / metadata
- **Phase:** A · **Milestone:** M1 (demo-visible on every card and rail)
- **Estimate:** 1 SP · AI-assisted 0.25–0.5d / manual 0.5–1d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO. **Re-verified on main after #110** (CDP, 1440): `scripts/card-teaser.js:186` now
  trims the suffix in `buildCardTeaser()`, so the `stories` feed and the promo box are clean. It is **not** fixed
  elsewhere, so the estimate stays at 1 SP:
  - `/en` still shows **25** suffixed titles (and 25 suffixed `img alt`) in the `story-rail` → `carousel` cards, which
    don't go through `buildCardTeaser()`.
  - `query-index.json`: **28 of 31** titles still carry the suffix.
  - The search page lists suffixed titles (4 hits).

## Origin
Demo URL/block sweep, 2026-09-25 (report §5; raised by 4 groups). It was noted before only under SKODA-602 "Follow-ups found".

## Problem (measured)
- Index rows carry the page `<title>`: "The Škoda Peaq Will Win You Over Fast - Škoda Storyboard", "Elroq - Škoda
  Storyboard", "Škoda Auto: Klaus Zellmer to leave the company - Škoda Storyboard".
- On the Epiq Related Stories rail, the card title link wraps to **3 lines (65px)** and is still cut off. The source shows the bare
  title on 1 line (~22px).

## Scope
- `skoda-metadata.js` (+ the mirrored `skoda-metadata-extract.mjs`): write the Metadata `Title` without the site-name
  suffix (source `og:title` / `h1`). Keep the page `<title>` suffix only via the site's head template, if wanted.
- Re-import + republish the imported pages (`npm run import:push`) so the index rebuilds.
- Defensive trim in `story-rail rowToCells` / `carousel` (the path #110 didn't cover), and in the `listing` / `search` result cards, reusing one helper from `scripts/`.

## Acceptance Criteria
- [ ] No `query-index.json` title ends in " - Škoda Storyboard".
- [ ] Related Stories / home rail titles fit the 1-line clamp as on the source; 0 suffixed card titles or `img alt`
      on `/en`, the Epiq story, the listing pages and search.
- [ ] Unit test in `skoda-metadata-extract.test.mjs`.

## Dependencies
SKODA-401 (metadata), SKODA-602 (push tool), SKODA-603 (re-import).
