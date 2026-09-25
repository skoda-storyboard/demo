# SKODA-215, Floating action bar: share cluster + scroll-to-top
- **Epic:** E02, Core Blocks
- **Type:** site-wide component
- **Phase:** A · **Milestone:** M1 (demo-visible; the gap review rates share C-6 as Must)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO. The ID was referenced in the backlog and in 216/217/801a, but no ticket file existed until now.

## Origin
Demo URL/block sweep, 2026-09-25 (report §5). Chrome + story groups; the follow-up check said to create this file rather than
mint a new ID. **Scope clarification:** 216 (l.57/80) and 217 (l.34) use "215" for *gallery share links*, while 801a and
the gap review mean the *page-level floating share*. This ticket is the page-level bar. Gallery share stays with 216.

## Problem (measured)
- Source `.sticky-buttons`, `position: fixed`, right 16px / bottom 8px, z-index 1000. At 1440 [1102,822,322,70]; at 390
  [321,840,53,52].
- **Share toggle** 58×58 (40×40 ≤768), `#fff`, radius 4, shadow `0 3px 8px rgba(0,0,0,.15)`. It expands to X `#000`,
  Pinterest `#cb2027`, LinkedIn `#0a66c2` and Facebook `#3b5998`, at a 61px pitch on desktop and 44px upward on mobile. WhatsApp is mobile-only.
- **Scroll-to-top** 58×58 / 40×40, fades in after scrolling.
- Present on all stories, the 5 series hubs, and the Epiq and Motorsport press kits. **EDS:** no fixed element at scroll 0 or 1600
  on `/en`, the stories or the press releases.

## Scope
- A delayed-phase component (`delayed.js` or a block) rendering the bar. The share menu uses real links and the Web Share API
  where available. Leave room for the media-cart badge (SKODA-505a).
- Accessibility: `<button aria-expanded aria-controls>`, labelled network links, focus-visible, Esc closes.

## Acceptance Criteria
- [ ] 1440/390: bar position and button sizes as measured (±2px); share expands to the 4 networks (+ WhatsApp at ≤768).
- [ ] Scroll-to-top appears after scrolling and returns to the top.
- [ ] Keyboard operable; no layout shift; loads in the delayed phase.

## Dependencies
docs/ui-specs/social-share.md, SKODA-505a (cart badge space), SKODA-216 (gallery share, separate).

## Import contract (SKODA-603)
Contract(s) `floating-action-bar` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Code-only: the importers emit nothing. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
