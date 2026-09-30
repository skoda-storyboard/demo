# SKODA-611b, Storyboard home: band spacing (Should slice of SKODA-611)
- **Epic:** E06, Import Pilot Content
- **Parent:** [SKODA-611](SKODA-611.md) (home composition, [#147](https://github.com/skoda-storyboard/demo/issues/147))
- **Type:** section styling (CSS)
- **Phase:** A · **Milestone:** M1 · **Tier:** Should (§11.2 cut line; builds on 611a)
- **GitHub issue:** [#153](https://github.com/skoda-storyboard/demo/issues/153)
- **Estimate:** 1.5 SP · AI-assisted 0.5d / manual 1–1.5d *(planning estimate, not a quote)*
- **Status (2026-09-30):** 🟡 In progress. Built on branch `skoda-611b-home-spacing` (local, not yet committed or
  pushed).

## Origin
Split from SKODA-611 (sweep-reconciliation decision D2, [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §11).

## Problem (measured)
- The Lifestyle heading at y=3536 touches the eMobility track end at 3537 (0px gap; source 67px).
- Source cover-box pad is 12px 0, plus a search-results margin of 24px 0 16px, giving a 320px rail pitch at 1440.

## Scope
- Section spacing for `cover-box` / `cover-box dark` to the measured pitch, via tokens, following
  `docs/guardrails/css-guidelines.md` (fluid first; no new breakpoint without a layout reason).

## Scope decision (2026-09-30)
Band spacing only. Measured on 2026-09-30, the 320px pitch at 1440 also needs live's larger rail cards (354×199
against our 276×155) and the "All" header button. That is rail work, split out to
[SKODA-226](SKODA-226.md): the pitch parts of the ACs below are met where the cards already match (below 768)
and complete with 226.

## Acceptance Criteria
- [ ] 1440: 67px heading-to-previous-track gap as on the source; 320px rail pitch (±4px). *(Re-measured, the
      source gap is 66px (rail end → heading); ours is 64. The 2px left is the heading centred in live's 36px
      "All" header, SKODA-226. The pitch is 272 until SKODA-226 resizes the cards: 12 + 24 + 33 + 20 + 155 + 16 +
      12.)*
- [ ] 768 / 375: band spacing follows the source within the sweep thresholds (±2px or ±2%). *(Spacing yes, at
      every width. The 375 pitch is 296–297 against 298–299; at 768 the pitch waits on SKODA-226.)*
- [ ] `npm run lint:css` passes; story pages (which share the section styles) are unchanged.
- [ ] Preview link on the PR: `{branch}--demo--skoda-storyboard.aem.page/en`.

## Implementation (2026-09-30, branch `skoda-611b-home-spacing`)
- **Source (live `/en/`, CSS + DevTools):**
  - Light band: `.cover-box { padding: .75em 0; margin: 0 }`. The rail's `.search-results { margin: 1.5em 0 1em }`
    puts 24px above the header and 16px below the rail. Header → rail is 20px.
  - The Latest Stories feed's `.search-results.latest-articles` has no bottom margin.
  - `.promo-box { margin: 1rem 0 2rem }`, and `0` below 720.
  - The dark bands (margin 36/24) were already matched by SKODA-218 / 611a.
- **`styles/styles.css`:**
  - Light `cover-box` bands: margin 0, padding 36 / 28 (`--cover-box-light-padding-top/-bottom`). The section
    carries live's band padding plus the rail container's margins, since our markup has no inner container.
  - The Latest Stories band ends 12px under Load more (`--cover-box-feed-padding-bottom`).
  - A section before a light band (the promo) drops its 40px margin. The gap is the promo block's own, live's
    `.promo-box` bottom margin: 0, or 2rem from 720. `promo-box.css` moved that margin from its 768 grid switch to
    720, live's own step for it. 720 is a project breakpoint.
  - The rail-card list-margin reset now covers light bands too. The global `li` margin made every light rail
    8px taller than live and than its loading reserve.
- **Measured, ours vs live** (heading y at 375 / 719 / 720 / 767 / 768 / 991 / 992 / 1280 / 1440):
  - Latest Stories: within 1px at every width.
  - Social media and Models: within 1px where the cards above match (≤ 992). At 1280 / 1440 they sit 10px
    higher, because the Latest Stories cards there are narrower until SKODA-222 (#231) lands.
  - Rail end → next heading: 64 against 66. Series: 130 = 130. Latest News: 120 against 122.
  - The last band meets the footer (gap 0), as on live.
- **Loading reserve:** each light rail's reserve now equals its built height (155 → 155 at 1440, 126 → 126 at 768,
  180 → 180 at 375). On `main` each rail grew by 8px after building.
- **Unchanged (section geometry identical to `main` at 1440 + 375):** the Media Room home, the Epiq story, the Epiq
  model archive, News, Images, Series (130 years), the Octavia model page and Press kits. Only the Storyboard home
  has light `cover-box` bands.
- **Media Room home, 720–767 only:** the promo now ends with live's 32px there too.
  - The band under it (News heading) moves 32px down, e.g. 577 → 609 at 720; live has 647.
  - The News heading is now a steady 38px above live at every width (375 / 719 / 720 / 767 / 768 / 1440). That
    38px predates this branch: the Media Room band spacing is outside 611b.
- **Code review (2026-09-30):**
  - The promo gap is set once, in `promo-box.css`, instead of a second section rule and token.
  - SKODA-226 builds on the existing `press` end card and the `story-rail-news` ladder.
  - Doc numbers and wording fixed.

## Dependencies
SKODA-611a (section structure), SKODA-218 (dark sections).
