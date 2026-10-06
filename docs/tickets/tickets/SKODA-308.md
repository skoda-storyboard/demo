# SKODA-308, Chrome parity pass (header, search, mobile nav, footer, topbar newsletter)
- **Epic:** E03, Chrome Fragments
- **Type:** styling + small behaviour
- **Phase:** A · **Milestone:** M1 (demo-visible on every page)
- **GitHub issue:** [#144](https://github.com/skoda-storyboard/demo/issues/144)
- **Estimate:** 3 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **Status:** 🟡 built 2026-10-06 on branch `skoda-308-chrome-parity` (local), see below (was 🔵 TODO)

## Status (2026-10-06)
Re-measured live vs ours before building (live DOM / computed styles, 1440 / 1280 / 1080 / 768 / 390). Already matching
then, from 302 / 303 / 304 / 826:
- the hamburger (68×64 at 322,44) and the drawer (375×800, 61px rows, 64px search row, backdrop);
- content starting at y124;
- the footer badges and social row, the © line font, and the legal links (306).

**Built** (`blocks/header/*`, `blocks/footer/footer.css`, `blocks/newsletter-stub/*`):

| Item | Live | Now |
|---|---|---|
| Nav row and topbar inline padding | `--page-gutter` (826 handover); drawer compensations rebased | same |
| Logo (`a.logo`) | 256×48 at x106 (1440), wordmark at 122,68; phones: wordmark x16 (x31 in the drawer) | 106,52 256×48 / 122,67; 16 / 31 |
| Section tabs | 90 / 125 wide, 21px padding, 14/600 0.28px (14px on phones too) | 89.6 / 124.8 |
| Mega-menu | x362 (no brand gap), items y44 h64, panel top y108 | same (the global 8px `li` margin dropped) |
| Item widths (16/24, 0.032px tracking) | 116.1 / 106.5 / 123.9 / 155.6 / 83.4 / 122.1 / 97.5 | exact; drop triggers 20 / 44px padding, chevron 29px from the end |
| Hover underline | under the label only (52.1px for Models), 17px from the bottom | same |
| Dropdown panel | as wide as its item (116), rows 12px 24px, 48px (72 when a label wraps between words), no mid-word breaks | Models 116.1×696, identical rows |
| Search closed | 41×41 at 1310,56 | 1309.5,55.5 |
| Search open | 730–1354 (624; 540 at 1080 = 50vw), white, over the menu; scope select 84×48 (All / Stories / News / Press Kits / Images / Videos; Stories on Storyboard pages, All in the Media Room); pill 540×48 `#f1f1f1` r200 with the leading icon, 16px, placeholder `#464748`; the button becomes the source's invisible submit at the pill's end (a query searches, none closes; see the search QA round) | same; Esc closes, focus back on the button; submit goes to `/en/search?filter[search]=…&search_type=…` |
| 1080–1180 overflow | — | fixed: one row at every width, no horizontal scroll (1080 / 1120 / 1179 / 1280 / 1440) |
| Newsletter panel | `#0e3a2f`, 575.6,44 626.8×198.9 @1440; 390×311 full width @390 | 626.8×198.9; 390×310 |
| Newsletter form | label 12.8/19.2; field 392.2×41.6; Subscribe 142.8×41.6 emerald r32; consent 14/18 `#a1a1a1`, 18px box; links emerald; ✕ 25.6 at 1164,56.8; on phones the pill under the consent (127×44) | same, phones pill 128.8×44 |
| Footer sitemap | the legal copy follows it directly; rows 19px (a 16/18 line with a 12/18 link); headings and sub-links 12/18, 1px tracking; columns 1/7 + 22px end padding | footer 830 / disclaimer 647 / © 733 at 1080–1440; 809 / 554 / 694 at 390; columns 175px at 1440 (were 179) |

- **1080–1180 fix:** the logo box gives way first (`--nav-brand-min`, flex 210 → 256px). Wrapping stays as the fallback for a longer authored menu.
- **Newsletter panel content:** the form is the existing `newsletter-stub` block, as a new `topbar` variant.
  - It's validated in the block like the card, and posts nothing (SKODA-904 owns the ESP).
  - The topbar Subscribe and the phone mail icon become disclosure buttons (`aria-expanded` / `aria-controls`).
  - The ✕ and Esc close the panel and return focus to the opening trigger.
  - The 2px ink bar under the open trigger is kept.
  - The content is a new companion fragment `/nav-newsletter` (a `Newsletter Stub (topbar)` block). The header loads it after rendering and never waits for it. Without it the triggers stay links.
  - Not added to `/nav` itself: a 5th nav section would render inside the header with the current `main` code, and preview content is shared across branches.
- **Keyboard (309 QA):**
  - Escape now hides a desktop dropdown shown by `:focus-within` or `:hover` (`data-dismissed`, WCAG 1.4.13).
    - The dismissal is cleared when focus or the pointer leaves.
    - Focus only moves for a dropdown opened from the keyboard.
  - Space on a trigger, or on the focused `li`, toggles what's on screen without scrolling. A trigger whose panel is shown by focus hides it on the first press. Enter still follows the link.
  - Focus moving on closes an open dropdown (one at a time).
  - Escape on phones returns focus to the hamburger (no longer the first nav button).
- **Newsletter panel extras:**
  - It sits in the DOM right after the topbar CTA, so Tab moves into it.
  - It closes on Escape at a trigger, on focus moving to another control, on a click outside, and when the drawer opens.
  - A trigger replaced while focused keeps focus.
- **Search extras:** the search button no longer moves focus on press. In Safari / Firefox on macOS a clicked button isn't focused, so the field's `focusout` used to close the bar and the click re-opened it. A keyboard close keeps focus on the button; a pointer close releases it.
- **Suggestions:** they open under the pill (y100 @1440, as the source `.suggest-container`).
- **QA round (2026-10-06):**
  - **Logo:** `icons/skoda-storyboard-logo.svg` was a typed-text placeholder ("ŠKODA" + "Storyboard" in a font). It's now the source's own wordmark SVG (7 paths, `#0e3a2f`, viewBox 255.19 × 23.1), shown at 194 × 17.56. The Media Room uses the same one, as on the source.
  - **Tabs:** text at y15 like the source (13px above a 20px line), not centred (was y13.5).
  - **Subscribe:** an 18px line in a flex utility box (text y15, icon y14), was 1px high.
  - **Pixel-identical to the source at 1440:** tabs (127 / 216.6, y15), Subscribe (x1022.7), the locales (1184.1–1320.4).
  - **Dropdown chevron:** now `icons/nav-chevron.svg`, drawn from the source glyph (icon font e007 at 16px, scaled .75): an 11.2 × 6.7px "v", ~1.7px strokes, centred 29px from the end and on the row's middle. Was a rotated 8px border box, smaller, bolder and ~3px low.
- **Search QA round (2026-10-06).** Re-measured live, including its icon font `skoda-bnr-icons`, whose glyph outlines were read from the woff2.
  - **Icons:** `icons/nav-search.svg` is the source `search` glyph (U+E02D), a thin ring + handle: 24px on the button, 19.2px `#464748` in the pill. Was the heavier filled `search.svg`. `icons/nav-chevron.svg` is now the exact `caret-down` glyph (U+E007), at 11.16 × 6.7px for the menu and the scope select.
  - **No ✕:** the open bar shows none, as the source (its submit glyph sits under the field). The button at the pill's end now searches with a query and closes the bar without one, as the source's submit does. The label follows: "Search" / "Close search". The browser's own search-field clear "×" is hidden.
  - **No focus ring for the mouse:** the source shows none. The field's ring now appears only for keyboard use (Tab, or the button pressed from the keyboard). A pointer close leaves focus nowhere instead of moving a ring onto the button.
  - **Opening:** the bar now grows from the 48px slot to 624px leftwards (`width .15s ease-in-out`, the source's own transition), the pill taking the rest as it grows. Was a 0.2s fade.
  - **Text:** placeholder `#464748` at 30% opacity (source). Scope label ellipsed in its 84px, "Sto…" (16 / 32px padding). Its label had inherited the tools row's `line-height: 0` and was drawn as a sliver.
  - **Suggestions:** as wide as the bar (624px from x730 @1440, source).
  - **Clicking outside** closes the bar, as on the source.
  - **Escape still closes it** (the source keeps it open). Kept for keyboard users.
  - **Contrast note:** the 30% placeholder is ~1.7:1 on the pill, below AA for text. It matches the source; the field is named by its `aria-label` and the visible magnifier. Flagged for SKODA-703.
- **Full review round (2026-10-06):** a second independent code review plus a measured live-vs-ours sweep. The sweep covered:
  - **1440 / 1080 / 390:** topbar, tabs, Subscribe, locales, logo, items, search button, content start.
  - **Desktop 1440 states:** dropdown panel / rows / hover / underline; search bar, scope, pill and icon; newsletter panel and form.
  - **390 states:** drawer rows / chevrons / sub-menu / search row / locales; the phone newsletter panel.

  The sweep matched live everywhere except the documented items:
  - the AA greys;
  - the 1080–1128 one-row choice;
  - live's 10px overflow at ≤ 1268;
  - the 1 – 2px sub-pixel offsets.

  Fixed from the review:
  - **Dropdowns:**
    - Escape on a panel link moves focus to the trigger, never left on a hidden link.
    - A dismissed panel is `visibility: hidden`, so Tab skips its links.
    - Text-only parents (Media Room "Models") toggle what's on screen on click / Enter.
    - The pointer coming back (`pointerenter`) clears a dismissal.
  - **Search:**
    - The keyboard ring flag is set by any Tab in the nav (the drawer field too) and cleared by any pointer press.
    - The ring is inset, so the bar's overflow doesn't clip it.
    - Focus moving to another control or a click elsewhere closes the bar even with a query (kept). A click on the bar's own text doesn't.
    - A mouse close releases focus from any bar control.
    - The authored search link must resolve to http(s) (`isWebUrl`), else the locale's /search.
  - **Forced colors:** the mask-drawn panel ✕ uses `canvastext`, so it stays visible in Windows High Contrast. The search and caret glyphs are inline SVG in the text colour since the loading round (below), which forced colors repaint on their own.
  - **Newsletter field** text black (source).
  - **Comments:** stale comments corrected.
  - **Tests:** header-chrome 21. Blocks / scripts / templates 523/525; the 2 also fail on `main`.

  Left as noted:
  - English chrome strings ("Close search", "Search in", scope names), as the rest of the M1 chrome. Locale copy belongs to SKODA-1001.
  - In the drawer, one Escape in the search field closes the whole drawer.
  - `icons/search.svg` is no longer used by the header and is kept as the house icon (gallery reference).
- **Review:** an independent read-only review (one must-fix: the suggestions covered the field; six should-fixes) was addressed in full and re-measured.
- **Loading / "jerk" round (2026-10-06, QA: the logo jumps for about a second, the Subscribe icon jumps, the search icon size differs, the menu arrows are jerky).** Measured on a cold load at 1440, live vs ours:
  - **Topbar faces:** the SKODA Next 300 / 700 faces arrived after the header showed, and their swap moved the right-aligned Subscribe + language group about 8px. This also happens on `main`, and live moves 38px.
    - Now the header waits for those faces and the logo before it shows, for at most 250ms (`preloadHeaderAssets`), so a slow network never holds it back longer.
    - After that: one paint in the final position, zero header layout shifts. Logo y67.8, Subscribe x998.7.
  - **Logo:** it now starts at its final place (top padding 15.8px, matching the live ink at y68) and is decoded before the header shows, so it no longer pops in and moves.
  - **Subscribe icon:** a fixed 20×16 box with a 4px gap. The ink is at x1002.2 y17.3, 13.5×9.5, the same as live.
  - **Glyphs (search, dropdown caret, scope caret):** they were CSS masks. Chrome snaps a CSS mask or background image to whole pixels:
    - the 11.2px caret drew 10 × 6 (ink 16.4 vs live 19.6) and could jump a pixel as the row settled;
    - the magnifier drew 20.0 where live draws 20.3.
    - They are now inline SVG (`glyph()` in header.js, `aria-hidden`, `fill: currentcolor`) with the exact source outlines (skoda-bnr-icons U+E02D / U+E007).
    - Ink vs live: caret 11.0 wide, 19.3 / 19.6; scope caret 19.3 / 19.6; magnifier 81.8 / 82.7; pill icon 56.1 / 56.7.
    - `icons/nav-search.svg` and `icons/nav-chevron.svg` are removed (no longer used).
  - **Menu underline:** live keeps the line at full label width and grows it from 0 to 2px (`all .2s ease-in`, white → ink), as `header-megamenu.md` says. Ours swept in from the left (width 0 → 52px), which read as a jerk next to the caret. It now matches live.
  - **Drawer (390):** unchanged. Its rows keep their own accordion caret, and the desktop caret is hidden there.
- **Tests:** `header-chrome.test.mjs` (22: search, URL, dropdown keys, hover / focus dismissal, newsletter panel, inline glyphs). `newsletter-stub.test.mjs` +2 (topbar).
  - Header, footer and newsletter tests are green.
  - Blocks / scripts / templates: 532/534. The 2 also fail on `main`:
    - `header-locales` (SKODA-303a): the CZ link resolves to the site root instead of keeping `/cs/emobility/x`;
    - `media-cart-download`: a missing `fflate` here.
  - `npm run lint` is clean.

**Content (pending approval):** a new DA page `/nav-newsletter` with the `Newsletter Stub (topbar)` block, using the live wording, list 389 and en_GB. Upload + preview now (harmless for `main`), publish after merge.

**Notes.**
- **1080–1128 (Storyboard):** live wraps the menu onto a second row (header 172px, which also has a 10px horizontal scroll). Ours keeps one row by shrinking the logo box's spare space (≤ 46px).
  - This is the AC's "compress" option; a 172px header would shift the page once the header loads.
  - The Media Room menu (787px) fits on live and on ours.
- **Live overflow not copied:** live's search slot sits 10px past the container, so live scrolls horizontally by 10px below 1268px. Ours stops at the viewport edge.
- **Search scope:** the select carries the scope (`search_type`), but the SKODA-403 search page doesn't filter by type yet, so results are all types. Belongs to 403's follow-up.
- **Subscribe colour:** `--skoda-grey-700`, as the language links (SKODA-303): 5.45:1 on the bar, where the source `#7c7d7e` is 3.3:1 and fails AA.
  - The inactive section tab has the same 3.3:1 issue. It's kept as on the source; flagged for SKODA-703.
- **Footer at 992–1079:** live's columns are irregular (flex) there; ours stay 1/7 columns.
- **Phone mail icon:** ours is 24×24 at x298; live's glyph is 26×18 at x292.
- **Drawer:** the panel starts at y44 with the logo row inside. Live's `nav` starts at y108 under a white logo row, so the white area is the same (y44–844).
- **Not verified yet** (needs push / publish): the AC's `.aem.page` and `.aem.live` checks.

## Origin
Demo URL/block sweep, 2026-09-25 (report §4 V9, §5). Measured with scripted interaction states (mega-menu hover, drawer open,
search open) on `/en`, a press release, the Epiq story and a press kit.

## Problem (measured, source → EDS)
- **Topbar:** switcher `ul` x 106 → 120 (nav-topbar inline padding 10 vs 24); active tab 89×44 (li pad 13/21/10, ls .28px)
  → 93×44. Language links 12px/300 lh18, margin-left 12, right edge 1334 → 12/400 lh12, margin 6, edge 1320.
- **Logo:** link box 256×48 (pad 0 46 0 16) → 194×19; mobile x 16 → 24.
- **Mega-menu:** nav `ul` x 362 → 338; items y44 h64 (panel top y108) → y40 h72 (panel top y104); drop the 8px li margin-bottom.
- **Search:** closed icon 41×41 at 1310,56 → 48×48 at 1272,52. Open bar **624px** (x730–1354) with a scope select
  (All/Stories/News/Press Kits/Images/Videos, 84×48) and a 540×48 `#f1f1f1` r200 input → 340px field (x980–1320), no scope, 14px vs 16px text.
- **Mobile (390):** hamburger tap target 68×64 at 322,44 → 20×22 at 346,65; drawer fixed header, overlay
  `rgba(227,227,227,.8)`, panel 375×792 at y108 → 375×856 at y44; drawer languages 16px/700 → 14px mixed.
- **Header offset:** main starts at y124 (16px below the header) → y108.
- **Footer:** badges x841/988 (gap 12), social from x1133 (gap 10) → x812/963 (gap 16), x1138 (gap 40), plus an extra 1px
  white border; column pitch 175 → 155+24; headings 12/500 lh18 ls 1px → 13/400 lh19.5. **The 4 legal links (Data
  Protection, Copyright, Cookies policies, Whistleblower system) in `#78faae` inside the disclaimer are missing.** They are
  in the source DOM; SKODA-304 says otherwise. © line 12/600 lh18 → 13/600 lh19.5.
- **Topbar newsletter:** "Subscribe to our stories" opens a dark-green panel on the source (627×199 at x576 y44; 390: 390×311
  full width; bg `#0e3a2f`, email 392×42, Subscribe 143×42 `#78faae` r32, consent 14/500 `#a1a1a1`, close X). EDS navigates to
  `#subscribe` and nothing opens. UI stub only; the ESP is SKODA-904.

## Scope
Header/footer CSS + `header.js` (search expand + scope select, drawer), footer fragment content (legal links), topbar
newsletter panel UI stub (shares markup/CSS with the SKODA-823 sidebar widget).

**Header edge alignment (handed over from SKODA-826, 2026-09-29):**
- 826 sets the page content to `--page-gutter` (10px at every width, inside the 1248 cap), so the header now sits
  inside the content edge. The header nav row (`header nav` padding) and the topbar are still on
  `var(--spacing-l)` / `var(--spacing-xl)`.
- Measured on the Epiq story:
  - logo at 24 on mobile (content 10; live logo image 16);
  - logo at 24 at 1080 (live 10) and at 40 at 1280 (live 26 = the content edge).
- Rebase the nav row and topbar inline padding onto `--page-gutter`, and adjust the drawer's negative-margin
  compensations (`calc(-1 * var(--spacing-l))`) with them.

## Acceptance Criteria
- [ ] Every value above matches at 1440 and 390 (±2px), verified on `.aem.page` **and** `.aem.live`.
- [ ] Search opens the 624px bar with the scope select; Esc closes it; submit routes to the search page (SKODA-403).
- [ ] Footer spacing/typography values above match; the newsletter panel opens/closes (aria-expanded, Esc) and posts nothing.
- **Note (2026-09-25, sweep reconciliation D3):** the 4 footer legal links are owned by **SKODA-306** (#102) and
  are no longer in 308's scope. Priority: **Should** (§11.2 cut line), plan B extension.

## Found in SKODA-816 QA (2026-09-25)
- **Horizontal overflow at 1080–~1180px on every page.** The desktop nav row doesn't fit: at 1080, `.nav-sections`
  (891px wide) ends at x=1133 and `.nav-tools` (search) at x=1181, so `scrollWidth` = 1181 against a 1080 viewport.
  From 1200 up it fits. Measured on the live Epiq story (Chrome DOM, no screenshots). Expected: no horizontal
  scroll at any width, either by compressing the nav gaps/labels or by keeping the hamburger layout up to the
  width where the row fits.

## Found in SKODA-309 QA (2026-09-28)
Measured with DevTools on both sides, Storyboard (`/en/lifestyle/ouninpohja-finlands-roller-coaster-stage`) and Media Room (`/drafts/mr-chrome-qa`) against the source. All four issues are on `main` too, and they apply to both navs.
- **Nav row inset:** top-level items sit **24px left** of the source at 1440 and 1280 (News x338 vs 362; Storyboard Models x338 vs 362). The brand link is 194×19 at x120; the source logo is 256×48 at x106. Match the brand box and the header's inner padding.
- **Dropdown triggers ~8px too wide:** `li.nav-drop > p > a` has `padding: 0 52px 0 20px`; the source is `0 44px 0 20px` (Models 123.9 vs 116.1, Company 139.1 vs 131.4, Škoda World 163.2 vs 155.6). The extra width adds up item by item across the row. Move the chevron to match.
- **Section tabs at ≥1080:** the tabs start 14px right of the source. Tab link padding is `0 24px`; the source is about 21px (MR active tab 128×44 at x213.6 vs 124.8×44 at x195.6; Storyboard 93.6×44 at x120 vs 89.6×44 at x106). At 992 and 375 they match.
- **Keyboard:**
  - Escape resets `aria-expanded` on a desktop dropdown, but `li:focus-within > ul` (header.css ~837) keeps the panel visible.
  - Space on a focused dropdown trigger scrolls the page (its default isn't prevented).

## Language links: covered by SKODA-303 (2026-09-30)
The language-link values above (topbar 12/300, line height 18, margin 12; drawer 16/700) are done in SKODA-303 (#24,
PR #232). **The topbar's inline padding is also done there** (`--page-gutter`): the switcher now ends on the source edge,
and the section tabs start at 106 @1440. The nav row padding (logo, mega-menu) stays here.

**Drawer menu height (measured 2026-09-30, 390×800, open drawer):**
- the 8 top-level rows are **61px** on the source with no margin; EDS rows are **73px + 8px** `margin-bottom` (+160px);
- the search row is **64px** vs 80;
- the source drawer starts at y108 (under the bar), EDS at y44 with the logo row inside.
So on phones shorter than about 860px the language row sits below the fold on EDS (it's the drawer's last item) where
the source shows it at the bottom.

## Dependencies
SKODA-301/302/303/304 (built chrome), SKODA-307 (null guard), SKODA-403 (search), SKODA-823 / SKODA-904 (newsletter).
