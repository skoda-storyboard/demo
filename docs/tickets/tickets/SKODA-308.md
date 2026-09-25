# SKODA-308, Chrome parity pass (header, search, mobile nav, footer, topbar newsletter)
- **Epic:** E03, Chrome Fragments
- **Type:** styling + small behaviour
- **Phase:** A · **Milestone:** M1 (demo-visible on every page)
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

## Acceptance Criteria
- [ ] Every value above matches at 1440 and 390 (±2px), verified on `.aem.page` **and** `.aem.live`.
- [ ] Search opens the 624px bar with the scope select; Esc closes it; submit routes to the search page (SKODA-403).
- [ ] Footer shows the 4 legal links; the newsletter panel opens/closes (aria-expanded, Esc) and posts nothing.

## Dependencies
SKODA-301/302/303/304 (built chrome), SKODA-307 (null guard), SKODA-403 (search), SKODA-823 / SKODA-904 (newsletter).
