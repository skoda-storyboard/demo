# SKODA-226, Storyboard home rails: live card ladder + "All" header button and end card
- **Epic:** E02, Core Blocks
- **Type:** block CSS + import (content: the "All" link per rail)
- **Phase:** A · **Milestone:** M1 Should (demo-visible: the first page shown)
- **GitHub issue:** — (to open)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-30):** 🔵 TODO. Split from SKODA-611b (decision 2026-09-30: 611b does the band spacing only).

## Origin
SKODA-611b measurement, 2026-09-30 (live `/en/` vs `main--demo--skoda-storyboard.aem.page/en`, DevTools at
1440 / 992 / 768 / 375). With every band spacing matched, a light band on live is still 48px taller at 1440
(320 vs 272 pitch), 36px at 992 (276 vs 240) and 60px at 768 (303 vs 243). The difference is the rails
themselves, not the band.

## Problem (measured, live `/en/` light category rails: Models, eMobility, Lifestyle, Škoda World)
- **Card ladder:** live home rails use **90% / 45% / 30%** cells (`.search-results-item.flickity-cell`,
  10px padding).
  - Cells are 338 / 346 / 298 / 374 wide at 375 / 768 / 992 / 1440. The rail is 1248 wide at 1440.
  - Cards are 318×179 / 326×183 / 278×156 / 354×199.
  - The EDS category rails use the generic 90% / 30% / 22.5% ladder (`carousel-rails.md` §4, measured
    2026-09-23), so the cards are 320×180 / 224×126 / 276×155 at 375 / 768 / 1440. They match only below 768.
  - The home "Latest News" rail already has the wide ladder: `story-rail-news` (`layout: news`, SKODA-827;
    `story-rail.js`, `story-rail.css`).
  - `carousel-rails.md` already documents 90 / 45 / 30 as the "content-heavy" and story-band ladder. Live now
    applies it to the home category rails too (re-measure, or a source change after 2026-09-23).
- **"All" header button:** each rail header holds `a.btn-ghost-compact.search-results-header-link` "All" next to
  the heading, linking to the category archive (e.g. `/en/category/emobility/`).
  - The button is 90×36: 16px / 600, padding 8px 32px, a 2px `#464748` border, 50px radius, `#464748` text on
    white.
  - It makes the header 36px tall; the heading is centred in it, 2px lower than ours.
  - EDS: `story-rail` supports a `viewall` config key (a text link, `.story-rail-viewall`), but the home content
    doesn't author it, and it isn't styled as the source's ghost pill. The `press` variant (SKODA-224) already
    reads a header "All" pill from the band's default content (`pressAllLink`).
- **"All" end card:** each rail ends with `.item-all > a.link-all` "All" (same href), the size of a card
  (354×199 at 1440), with a 1px `#161718` border, 16px / 600 ink text, centred.
  - EDS builds this card only for the `press` variant (`appendPressAllCard`, `.story-rail-all`, SKODA-224).
    There it's white on the dark related band; the home needs an ink-on-white version.

## Scope
- The 4 home category rails (the `story-rail` rails in the Storyboard home's light bands): the 90 / 45 / 30 cell
  ladder. Reuse or generalise the `story-rail-news` sizing rather than adding a third ladder, and keep the
  loading reserve (`story-rail-mount` aspect-ratio) equal to the built height (no shift). Other rails (story
  related band, press-release rails, model rails) keep their ladders.
- The "All" header button: import the per-rail category link into the home `Story Rail` config (`viewall`), and
  style it as the source's ghost pill in these bands (align with the `press` header pill).
- The "All" end card: generalise the `press` end card (`appendPressAllCard`, `.story-rail-all`) to these rails,
  with ink-on-white styling. It must be keyboard-reachable, with an accessible name ("All eMobility stories").

## Acceptance Criteria
- [ ] 1440 / 992 / 768 / 375: home rail cards match the source sizes (±2px). The light band pitch then matches
      the source: 320 at 1440, 276 at 992, 303 at 768, 299 at 375 (±4px). Band spacing is SKODA-611b's.
- [ ] The "All" header button and the "All" end card render on the 4 light category rails with the source's
      href, size and styles; both are keyboard-reachable with visible focus.
- [ ] No layout shift when the rails build (reserve = built height). Other rails are unchanged.
- [ ] Lint + tests green; preview link on the PR (`{branch}--demo--skoda-storyboard.aem.page/en`).

## Dependencies
SKODA-611b (band spacing), SKODA-212 / 212a (carousel + story-rail), SKODA-224 (the `press` end card and header pill
to generalise), SKODA-611a / 827 (home importer + the `news` rail layout).
