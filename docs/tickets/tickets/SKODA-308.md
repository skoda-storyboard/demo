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
| Search open | 730–1354 (624; 540 at 1080 = 50vw), white, over the menu; scope select 84×48 (All / Stories / News / Press Kits / Images / Videos; Stories on Storyboard pages, All in the Media Room); pill 540×48 `#f1f1f1` r200 with the leading icon, 16px, placeholder `#464748`; the button becomes a 19.2px grey ✕ | same; Esc closes, focus back on the button; submit goes to `/en/search?filter[search]=…&search_type=…` |
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
- **Search extras:** the ✕ no longer moves focus on press. In Safari / Firefox on macOS a clicked button isn't focused, so the field's `focusout` used to close the bar and the click re-opened it. Closing returns focus to the button.
- **Suggestions:** they open under the pill (y100 @1440, as the source `.suggest-container`).
- **Review:** an independent read-only review (one must-fix: the suggestions covered the field; six should-fixes) was addressed in full and re-measured.
- **Tests:** `header-chrome.test.mjs` (14: search, URL, dropdown keys, hover / focus dismissal, newsletter panel). `newsletter-stub.test.mjs` +2 (topbar).
  - Header, footer and newsletter tests are green.
  - Blocks / scripts / templates: 512/514. The 2 also fail on `main`: `header-locales` (SKODA-303a) and `media-cart-download` (a missing `fflate` here).
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
