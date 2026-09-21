# SKODA-302, Mobile nav toggle with ARIA (fix checkbox-hack a11y gap)
- **Epic:** E03, Chrome Fragments
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d *(planning estimate, not a quote)*

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
- [ ] Drawer engages below `1080px`; full-height (`100dvh − 108px`), body scroll-lock while open.
- [ ] Hamburger `<button>` has a correct `aria-expanded` (reflects state), `aria-controls`, and accessible name.
- [ ] Toggle keyboard-operable (Enter/Space); Escape closes + returns focus to the toggle; click-outside closes.
- [ ] Accordion sub-menu triggers are real buttons with their own `aria-expanded` (source uses plain links, fix).
- [ ] `npm run lint` passes.

## Dependencies
- Upstream: SKODA-301 (Header + nav fragment) / Downstream: SKODA-703 (accessibility audit, nav ARIA)

## Risks / Flags
- 🟢 Accessibility upgrade, low risk, clear WCAG win.
- `[RUNTIME-UNCONFIRMED]`: mobile drawer animation and focus behavior need browser verification; a11y-gap severity to be confirmed with a screen reader in SKODA-703.
