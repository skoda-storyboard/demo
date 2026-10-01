# SKODA-302, Mobile nav toggle with ARIA (fix checkbox-hack a11y gap)
- **Epic:** E03, Chrome Fragments
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-10-01):** 🟡 IN REVIEW. Built in `blocks/header` (drawer band only; the desktop
  mega-menu is unchanged) and measured against the live header at 375 / 500 / 768 / 1024 / 1079.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/mobile-nav.md`](../../ui-specs/mobile-nav.md)** (captured via Chrome DevTools, token-mapped, pixel-perfect AC). Read it before implementing.

Key facts from capture that change this ticket:
- **Premise correction:** the source hamburger is **already a real `<button>`, NOT a CSS checkbox-hack** (prior analysis was wrong). The defect is that its `aria-expanded` / `aria-controls` / accessible name are **all null**, and the accordion sub-menu triggers are plain `<a>` links. The fix is wiring ARIA + keyboard, not replacing a checkbox.
- **Breakpoint is `1080px`** (this ticket's `600/900/1200` is stale, use the source ladder).
- Drawer: full-height `100dvh − 108px`, body scroll-lock while open, accordion sub-menus (`.open`, `.2s`).
- **Section switcher stays visible on mobile:** below `1080` the Stories | Media Room switcher reflows to a **full-width 50/50 tab bar** above the brand row (NOT inside the drawer); Subscribe + locales are what move into the drawer. Do not hide the topbar on mobile. Owned by SKODA-301 / [`header-megamenu.md`](../../ui-specs/header-megamenu.md) §3, flagged here because it shares the mobile chrome.

## Summary
Rebuild the mobile navigation toggle as a real `<button>` with correct `aria-expanded` state management, replacing the source's CSS checkbox-hack, a deliberate WCAG accessibility upgrade.

## Description
The source header uses a **CSS checkbox-hack** (`type="checkbox"` + `<label for>`) to open/close the mobile menu, and ships `aria-expanded`=0 that is **never wired to menu state**, a known WCAG defect flagged in `SKODA-HEADER-FOOTER-ANALYSIS.md`. The EDS rebuild replaces this with a real toggle button in `header.js`, with proper ARIA semantics, keyboard operability, and Escape-to-close. This is an upgrade over the source, not a port.

## Requirements / Spec
- Replace the checkbox-hack with a real `<button>` control (hamburger) in the Header block JS.
- Button carries `aria-expanded` reflecting actual open/closed state; toggles on click and on Enter/Space.
- Button has an accessible name (`aria-label` / visually-hidden text) and `aria-controls` referencing the menu container.
- Nested panels within the mobile drawer get their own accessible expand/collapse buttons with `aria-expanded`.
- Escape closes the open menu/panels; click-outside closes; focus returns to the toggle.
- Mobile-first CSS; the drawer engages **below `1080px`** (source ladder, not 600/900/1200).

## Acceptance Criteria
Measurable gates live in [`mobile-nav.md` §9](../../ui-specs/mobile-nav.md); summary:
- [x] Drawer engages below `1080px`; full-height (`100dvh − 108px`), body scroll-lock while open.
- [x] Hamburger `<button>` has a correct `aria-expanded` (reflects state), `aria-controls`, and accessible name.
- [x] Toggle keyboard-operable (Enter/Space); Escape closes + returns focus to the toggle; click-outside closes.
- [x] Accordion sub-menu triggers are real buttons with their own `aria-expanded` (source uses plain links, fix).
- [x] `npm run lint` passes.

## Build notes (2026-10-01, live DevTools on `/en`)
- **The source drawer changed after the 2026-09-15 capture.** It is now a right-anchored panel, half
  the viewport and at least 375px wide (375 / 375 / 384 / 512 / 540 at 375 / 500 / 768 / 1024 /
  1079), on a frosted full-screen header (`rgba(227, 227, 227, .8)` + `blur(10px)`), with no shadow.
  The source hamburger still has no `aria-expanded` (re-checked 2026-10-01).
- **Accessibility (`header.js`, drawer band only):**
  - The hamburger reports the drawer state with its own `aria-expanded` (and keeps `aria-controls="nav"`
    and the Open / Close navigation label); `nav[aria-expanded]` stays for the CSS.
  - Each dropdown parent's row link is an accordion button in the drawer: `role="button"`,
    `aria-expanded` and `aria-controls` (its sub-menu, `nav-sub-N`). Enter and Space toggle it (no
    scroll, no navigation); a tap toggles as before. The category page stays reachable as the
    sub-menu's first item, as on the source. From 1080 the attributes come off again, so the
    SKODA-301 desktop links are unchanged (a text-only parent keeps the `role="button"` it had).
  - Focus is trapped while the drawer is open: Tab / Shift+Tab cycle through the section switcher
    tabs and the drawer (the switcher sits outside `<nav>` but stays on screen).
  - Escape and a tap on the backdrop close it and return focus to the hamburger. Both are EDS
    upgrades: the source closes on neither.
  - A collapsed sub-menu is `visibility: hidden` after its .2s collapse, so its links leave the
    tab order and the accessibility tree (on `main` Tab walked 14 invisible links).
- **Measured parity (`header.css`, `@media (width < 1080px)` only):**
  - Hamburger: the source's 68 × 64 tap target, flush with the right edge (was 20 × 22, under the
    WCAG 2.5.8 minimum), with a visible `:focus-visible` ring (the source has `outline: 0`).
  - Panel `width: min(100%, max(375px, 50%))`, no shadow; backdrop `--nav-drawer-backdrop` + 10px blur.
  - Search row 64px: the 48px pill 24px from the left and 16px from the right (335 wide at 375).
  - Rows 18 / 28 / 300 with .02rem tracking, padding 16 16 16 24 and a full-width `#e4e4e4` rule = 61px.
  - Sub-menu: `#f1f1f1` rows, links 16 / 24 / 400 at 16px / 40px = 56px, opacity + max-height .2s
    ease-in-out (none under reduced motion); the caret sits in the source's 24px box 16px from the edge.
  - All matched at 375 / 500 / 768 / 1024 / 1079; no horizontal overflow at any width.
- **Out of scope here:** the drawer's language list is SKODA-303 (PR #232), which restyles it to
  the source. This branch sets the panel `min-width` to the same `min(375px, 100%)` as #232, so
  the two merge cleanly.
- **Regression-checked:** the desktop mega-menu on the Stories and Media Room navs at 1280 and 1080
  (geometry, hover panels, Enter / Escape) is identical to `main`; the Media Room drawer (text-only
  "Models" / "Company" parents, no mail shortcut) works.

## Dependencies
- Upstream: SKODA-301 (Header + nav fragment) / Downstream: SKODA-703 (accessibility audit, nav ARIA)

## Risks / Flags
- 🟢 Accessibility upgrade, low risk, clear WCAG win.
- `[RUNTIME-UNCONFIRMED]`: mobile drawer animation and focus behavior need browser verification; a11y-gap severity to be confirmed with a screen reader in SKODA-703.
