# SKODA-703a, Desktop mega-menu triggers as disclosure buttons (screen-reader semantics)
- **Epic:** E07, QA, Perf, A11y & Launch (follow-up to SKODA-703, #43)
- **Type:** a11y / header block
- **Phase:** A · **Milestone:** M2 (02 Jan go-live); after the 15 Oct demo
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-10-15):** 🔵 TODO (deferred from SKODA-703 by decision: no header refactor on demo day)

## Problem (measured 2026-10-15, SKODA-703 audit, `main` at `cf98249`)
The desktop (≥ 1080) dropdowns work by keyboard, but their focus stop has no role or state a screen reader can use.
- **The focus stop is the `<li class="nav-drop" tabindex="0">`** (SKODA-301), not a control. It has no role, so it is
  announced as the list item's whole text ("Models Models Fabia Scala Octavia …"), not as a toggle.
- **`aria-expanded` sits on the `li`** (a listitem doesn't support it), and on items with no sub-menu (eMobility, Series,
  Škodapedia, Podcast: `aria-expanded="false"`).
- **The open state isn't announced:** the panel opens on `:focus-within` while `aria-expanded` stays `false`; Enter then
  *closes* the panel focus opened, Space opens it.
- The `<nav>` carries `aria-expanded` (the drawer state), which isn't valid on the navigation landmark.
- Keyboard operation itself passes (SKODA-703): Tab reaches every link, Escape dismisses (WCAG 1.4.13) and focus
  returns to the row link. The drawer (< 1080) already uses the right pattern: `a[role=button][aria-expanded][aria-controls]`.

## Scope
- The disclosure navigation pattern (WAI-ARIA APG "Disclosure Navigation Menu"), as the drawer already does:
  - each parent's row link stays a link; a separate `button` (or the row element as `role="button"` when the parent is
    text-only) toggles its panel with `aria-expanded` / `aria-controls`;
  - remove `tabindex` and `aria-expanded` from the `li`s, and `aria-expanded` from items without a sub-menu;
  - `aria-expanded` reflects what is on screen (hover / focus-within shown panels included, or drop the
    focus-within opening so the state is always explicit);
  - the drawer state moves from `<nav aria-expanded>` to the hamburger button only (it already carries it).
- Keep every current behaviour: hover timing, Escape dismissal (1.4.13), focus return, the drawer focus trap.

## Acceptance Criteria
- [ ] axe: no `aria-allowed-attr` / role findings on the header at 1080 / 1280 / 1440; the accessibility tree shows each
      dropdown parent as a link plus a button with `expanded` true / false matching the visible panel.
- [ ] Keyboard (1280): Tab / Shift+Tab order unchanged apart from the new toggles; Enter / Space toggle; Escape closes and
      returns focus to the toggle; hover opens / closes as today.
- [ ] NVDA + Chrome and VoiceOver + Safari: each dropdown announced as "<name>, button, collapsed / expanded".
- [ ] No regression in the drawer (< 1080): `header-*.test.mjs` pass; SKODA-302 behaviours re-checked.

## Dependencies
- SKODA-703 (the audit), SKODA-301 (desktop header), SKODA-302 (drawer).
