# SKODA-611b, Storyboard home: band spacing (Should slice of SKODA-611)
- **Epic:** E06, Import Pilot Content
- **Parent:** [SKODA-611](SKODA-611.md) (home composition, [#147](https://github.com/skoda-storyboard/demo/issues/147))
- **Type:** section styling (CSS) + home rails (block + import)
- **Phase:** A · **Milestone:** M1 · **Tier:** Should (§11.2 cut line; builds on 611a)
- **GitHub issue:** [#153](https://github.com/skoda-storyboard/demo/issues/153)
- **Estimate:** 1.5 SP · AI-assisted 0.5d / manual 1–1.5d *(planning estimate, not a quote; the home rails added on
  2026-09-30 are about 2 SP more, not re-estimated)*
- **Status (2026-10-01):** 🟡 In review, PR #238 (branch `skoda-611b-home-spacing`).
  - The latest `main` (222, 303, 216, 702a) is merged. The one conflict was `stories.configKeys`, resolved by keeping both `exclude` (this branch) and `feature` (222).
  - With 222's wider Latest Stories cards, the last gap is closed: every band heading and the footer are within 1px of live at 375 / 768 / 992 / 1280 / 1440 (see "After merging main").
  - The re-imported `/en` (with the rails' "All" links) goes to DA after the PR merges.

## Origin
Split from SKODA-611 (sweep-reconciliation decision D2, [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §11).

## Problem (measured)
- The Lifestyle heading at y=3536 touches the eMobility track end at 3537 (0px gap; source 67px).
- Source cover-box pad is 12px 0, plus a search-results margin of 24px 0 16px, giving a 320px rail pitch at 1440.

## Scope
- Section spacing for `cover-box` / `cover-box dark` to the measured pitch, via tokens, following
  `docs/guardrails/css-guidelines.md` (fluid first; no new breakpoint without a layout reason).

## Scope decision (2026-09-30)
First pass: band spacing only. Measured on 2026-09-30, the 320px pitch at 1440 also needs the source's larger rail
cards and its "All" links. **Decision (2026-09-30): fix those here too**, in the same branch; no separate ticket.

## Acceptance Criteria
- [x] 1440: 67px heading-to-previous-track gap as on the source; 320px rail pitch (±4px). *(Re-measured, the
      source gap is 66px, rail end → heading. With the rails round the pitch is 310 / 319 / 320 against the
      source's 310 / 320 / 319.)*
- [x] 768 / 375: band spacing follows the source within the sweep thresholds (±2px or ±2%). *(Every band heading is
      within 1–2px of the source at 375 / 768 / 992.)*
- [x] `npm run lint:css` passes; story pages (which share the section styles) are unchanged.
- [x] Preview link on the PR: `{branch}--demo--skoda-storyboard.aem.page/en`. *(PR #238: `/en` and `/en/media-room`.
      The preview shows the pills and end cards only once the re-imported `/en` is pushed to DA.)*

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
  - Social media and Models: within 1px where the cards above match (≤ 992). At 1280 / 1440 they sat 10px
    higher, because the Latest Stories cards there were narrower until SKODA-222 (#231). *(Closed 2026-10-01 after merging main: within 1px.)*
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
  - Doc numbers and wording fixed.

## Home rails round (2026-09-30, decision "fix it in 611b")
Found while matching the pitch, measured on the live `/en/` rails at 375 / 768 / 992 / 1440:
- **Card ladder:** the source uses 90% / 45% / 30% cells.
  - Its cards are 318×179 / 326×183 / 278×156 / 354×199.
  - Ours use the generic 90% / 30% / 22.5% ladder (`carousel-rails.md`), so the cards are 320×180 / 224×126 /
    … / 276×155. They match only below 768.
  - The home "Latest News" rail already has the wide ladder (`story-rail-news`, SKODA-827).
- **"All" header button:** the source's rail headers have a grey ghost pill (90×36, 16/600, 2px `#464748` border,
  50px radius) linking to the category archive, e.g. `/en/category/emobility/`. `story-rail` supports a `viewall`
  key, but the home content doesn't author it.
- **"All" end card:** each source rail ends with a card-sized "All" link (1px `#161718` border, 16/600 ink). EDS
  builds one only for the `press` variant (`appendPressAllCard`, SKODA-224).
- **Effect:** with the band spacing matched, a light band is still 48px shorter than the source at 1440, 36 at 992
  and 60 at 768.
- **Caption cards:** the source's Models and Series rails (and the Media Room's Models band) are taxonomy cards.
  - Each is a 16:9 image with 8px corners, then the title centred on a 45px white row, 16/600 black. On a dark
    band the two share one rounded card.
  - They have no date. EDS rendered them as overlay cards because their index rows carry a date.
- **Which rails get what, on the source:**
  - The post rails (eMobility, Lifestyle, Škoda World, Latest News) show 10 cards plus the "All" end card.
  - Models and Series show every item and have no end card. Series has the header pill, Models has neither.

**Built (branch `skoda-611b-home-spacing`):**
- `blocks/story-rail/story-rail.js`:
  - `railLayout()` (pure, tested) gives every index rail in a home `cover-box` band the wide layout (`story-rail-wide`,
    the former `story-rail-news`: the 1248px bleed track, cells in container units).
  - Models (`story-rail-models`) keeps the source's model ladder: 90 → 45 (576) → 30 (768) → 22.5% (992).
  - Models and series (`story-rail-caption`) render caption cards: `rowToCells` drops the date for
    `skoda_model` / `skoda_series` rows.
  - A post rail with a `viewall` link gets the "All" end card when more stories match than it shows. This
    generalises the press band's `appendAllCard`, and its accessible name is "All: <heading>".
- `blocks/story-rail/story-rail.css`:
  - The wide ladder, with the model ladder on top.
  - The caption cards, and a reserve that adds the 45px caption row.
  - The ghost "All" pill (90×36; hover fills `#f1f1f1`, as on the source).
  - The end card: shared geometry, with its colour and cell width set per band (white on the press band, ink on
    the home's white bands).
- `tools/importer/parsers/home-rail.js`: keeps the source's "All" header link as a `viewall` row (tested). Both
  home bundles are re-bundled.
- `tools/importer/push/block-contracts.json`: `stories` allows `offset` / `exclude`, which the block has read since
  SKODA-214. Without them the /en contract check held the page from publishing.
- **Content:** the re-imported `/en` adds a `viewall` row to eMobility, Lifestyle, Škoda World, Series and Latest
  News. `import:validate-blocks` passes. **Not yet pushed to DA.**
  - The Series and Latest News links stay absolute (`https://www.skoda-storyboard.com/en/series-2/`, `/en/news/`):
    those pages exist on EDS but aren't in the SKODA-605 allow-list (link policy, SKODA-609 / #228).

**Measured, ours vs live** (the `viewall` rows injected into the published `/en` for the test):
- Cards are equal at 1440 / 992 / 768 / 600 / 375:
  - Models: 261×192 / 203×159 / 210×163 / 250×186 / 318×224.
  - Post rails: 354×199 / 278×156 / 326×183 / 520×293 / 318×179.
  - Series: 354×244 / 278×201 / 326×228 / 520×338 / 318×224.
- Pill 90×36, header 36px. The end card is card-sized.
- The loading reserve equals the built height on every rail, and there is no horizontal overflow.
- Band headings sit within 1–2px of the source at 375 / 768 / 992. At 1440 the pitch matches; the page sat 10px
  higher until SKODA-222 (#231) widened the Latest Stories cards. *(Closed 2026-10-01: within 1px.)*
- Lifestyle has no end card: only 9 of its stories are migrated, so the rail isn't full.
- Unchanged against `main`: the Zellmer press band (end card included), the Octavia model page and the Epiq story.
- **Media Room home, compact dark band:**
  - The Models band now equals the source at 1440 / 768 / 375: card 261×192 / 210×163 / 318×224 and band height
    652 / 607 / 663.
  - Its Press Kits rail (the same band) now equals the source too: 354×199 / 278×156 / 326×183 / 318×179 at 1440 /
    992 / 768 / 375. Before this, it was 276×155 / 219×123 / 224×126 / 320×180.
  - Its News heading is now at the source's x106 / x10. Before, the wide rail's header sat 10px left, x96 / x0.
  - **On the next Media Room re-import**, the rebundled home-mr importer also emits `viewall` for its rails with a source
    "All" link. Press Kits then gets the pill and end card, as on the source. The light-band rails (News, Images,
    Videos, Latest Stories) get the plain `.story-rail-viewall` link, since the pill is scoped to cover-box bands.
    That is not measured yet.
- **Code review (rails round):** the end card needs the wide layout. The pill is named "All: <heading>", like the
  end card. A caption title keeps the full text as a tooltip. The 45px caption row is one token,
  `--card-caption-row`, shared with the model page's derivatives rail. Tests were added for Press Kits and the
  wide-cell scope.
- **Known, not changed:** the source's Series rail shows all 24 series; ours shows 10 of the 15 indexed.

## Pre-PR code review (2026-09-30: malformed input, crash isolation, state; after PR #231's P2)
- **Merged `main`:**
  - `stories.configKeys` keeps `offset` (main) plus `exclude`.
  - `media-manifest.json` is main's rows plus this branch's one `/en` og-image row.
  - Both home bundles are rebuilt from the merged sources; they match the auto-merge byte for byte.
- **Fixed, major:** a row image the URL parser rejects (e.g. `https://`) in the story index made `rowToCells` throw, and
  the whole home band collapsed. The code predates this branch, but every home band now goes through it. The card
  now falls back to its image-less form with a console warning. In the browser, with one eMobility row's image set
  to `https://`, the rail keeps its 10 cards and 1 is image-less.
- **Fixed, the "All" link is validated** (`safeViewAll`):
  - Only an http(s) link or a root-relative path that leaves the page counts.
  - `javascript:`, `data:`, `https://`, `#`, plain text, a protocol-relative link or the current page give no pill and
    no end card. With several links, the first is used.
  - The importer emits `viewall` only for an absolute http(s) or root-relative source href.
- **Fixed:**
  - `template` is trimmed and lowercased.
  - A rail build that throws outside the index try collapses the rail instead of leaving it stuck and hidden
    (`buildRailSafely`).
  - If a rail collapses while its pill has focus, focus moves to the next focusable element instead of `<body>`.
  - The end card gets the demo link policy (`decorateLinks`, #228): live `/en/news/` and `/en/series-2/` links now become
    the demo pages on the pill and the end card alike.
- **Kept on purpose:** `limit: -5` still becomes 1, as pinned by the SKODA-212 test.
- **Tests:**
  - `safeViewAll`: 13 rejected values.
  - A malformed viewall and a padded template through `parseConfig`.
  - `rowToCells` with invalid image urls.
  - The importer skipping `#`, `javascript:`, relative and empty hrefs.
- **Found, not changed (pre-existing, outside 611b):**
  - A curated `carousel` with an `<img src="https://">` renders empty: `carousel.js` `optimizeImages` throws after the
    cells moved. This affects model-page curated rails; home rails are index rails.
  - The carousel's Tab order is Previous → cards → Next.

## Full pre-PR review (2026-10-01; reviewer process: ACs, specs, measured origin vs ours, a11y, code)
- **Measured sweep:** origin `/en` vs ours (with the re-imported `viewall` rows injected) at 320 / 375 / 390 / 414 / 576 / 600 /
  720 / 767 / 768 / 991 / 992 / 1079 / 1080 / 1280 / 1440 / 1920. For every band, the band height, heading position, pill
  box, first card box, card gap and end card are within 2px. The exceptions are all explained:
  - Latest Stories at ≥ 1248 was 10px narrower until SKODA-222 (#231). *(Closed 2026-10-01 after merging main.)*
  - Lifestyle has no end card because only 9 of its stories are migrated.
  - The Social media heading text sits at the same x (644–796); the source heading box is just shorter.
- **Fixed in this round:**
  - The Series dark band's header row sits at 64px, as on the source (`--cover-box-padding-top` was 66). With the
    "All" pill its heading is at 66, and the band is 424 tall, both matching the source.
  - A long rail heading wraps beside the pill instead of pushing it off a narrow screen.
  - The rail's `layout` follows the normalised template, so ` Press_Release ` stays wide.
  - `safeViewAll` rejects backslash URLs and treats `/en/` on `/en` as the same page.
  - The focus hand-off skips hidden, unrendered and disabled targets.
  - A carousel that fails to decorate (`loadBlock` swallows its errors) collapses the rail.
  - The importer keeps the trimmed href.
  - Doc fixes: the rail spec ACs, and the requirement mapping and traceability rows for STO-H03–H08.
  - Tests: a jsdom focus test file, padded template → layout, safeViewAll backslash and trailing slash, importer
    padded href.
- **Site-wide effects (beyond the home):** `safeViewAll`, the "All: <heading>" pill name and the template normalisation
  apply to every story-rail, model pages included. Model-page rails with a valid "All" link are unchanged; they
  measured identical to `main`.
- **Found, not changed (pre-existing, outside 611b):**
  - The site header overflows horizontally from 1080 to about 1180px (scroll width 1181 at 1080, `.nav-sections` /
    `.nav-tools`), on `main` too.
  - Rail card images use the title as alt text, so it is read twice. The re-imported `/en` has no h1.
  - The curated-carousel image throw and the carousel Tab order are noted above.
- **Kept as the source has it:**
  - Caption titles are one line with an ellipsis; the full title is in the link's tooltip.
  - The home end card shows only when more stories match than the rail shows.
  - A heading-less rail's pill is named just "All".

## After merging main (2026-10-01: 222, 303, 216, 702a)
- **Conflict:** `block-contracts.json` `stories.configKeys`, resolved as `offset`, `exclude`, `feature`. The contract doc's baseline row now lists `exclude` too.
- **Unchanged:** both home bundles rebuild byte for byte, ESLint and Stylelint are clean, `import:validate-blocks` passes on `/en`, and the story-rail, stories, promo-box, home-rail and push tests pass.
- **Measured, ours vs live** (the merged code with the published `/en` plus the 5 re-imported `viewall` rows; heading y and footer):
  - Δ 0 at 375.
  - Δ −1 at 768, 992, 1280 and 1440, for every band (Latest Stories, Social media, Models, eMobility, Lifestyle, Škoda World, Series, Latest News) and the footer.
  - The first Latest Stories card equals live: 355×200 / 364×205 / 476×268 / 604×340 / 604×340.
  - 5 pills and 3 end cards (Lifestyle and Series have none, as explained above). No horizontal overflow.
- **303's header** is 108px tall on live, `main` and this branch, so it moves nothing.
- **Found on `main`, not changed:** `blocks/header/header-locales.test.mjs` "the topbar group becomes a <div> list…" fails. It expects `/cs/emobility/x` and gets `https://www.skoda-storyboard.com/cs`. It fails the same way with `main` plus an unrelated branch, so it came with 303 (#232); owner SKODA-303.
- **Content freshness (not code):** live has published one newer story ("King of space… Superb celebrates 25 years"), not migrated yet. Live's promo and feed are one story ahead of ours until it is.

## Dependencies
SKODA-611a (section structure), SKODA-218 (dark sections).
