# SKODA-308, Chrome parity pass (header, search, mobile nav, footer, topbar newsletter)
- **Epic:** E03, Chrome Fragments
- **Type:** styling + small behaviour
- **Phase:** A · **Milestone:** M1 (demo-visible on every page)
- **GitHub issue:** [#144](https://github.com/skoda-storyboard/demo/issues/144)
- **Estimate:** 3 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

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
branch `skoda-303-language-switcher`). What stays here is the topbar's inline padding: the switcher sits 14px left of
the source edge (1320 vs 1334 @1440) until the header rebases onto `--page-gutter`.

## Dependencies
SKODA-301/302/303/304 (built chrome), SKODA-307 (null guard), SKODA-403 (search), SKODA-823 / SKODA-904 (newsletter).
