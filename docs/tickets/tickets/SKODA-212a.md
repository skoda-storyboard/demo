# SKODA-212a, Rails: desktop mouse click navigates and drag scrolls (follow-up to SKODA-212)
- **Epic:** E02, Core Blocks
- **Type:** bug fix (block JS)
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** [#150](https://github.com/skoda-storyboard/demo/issues/150) · follow-up to [#98](https://github.com/skoda-storyboard/demo/issues/98) (SKODA-212, Done)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Priority:** P0: every rail on every page.
- **Status (2026-09-25):** 🔵 TODO

## Origin
- Parallel demo sweep [`SKODA-DEMO-SWEEP-REPORT.md`](../../reviews/SKODA-DEMO-SWEEP-REPORT.md) V1.
- Confirmed by the live CDP re-check in [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md)
  §11.1 on 2026-09-25, using trusted `Input.dispatchMouseEvent` / touch events.

## Problem (measured, main, 1440)
- **Click:** a mouse click on a card in home eMobility, Latest News or Epiq Related Stories focuses the link but
  **does not navigate**.
- **Drag:** a 300px mouse drag leaves the track's `scrollLeft` at **0**.
- **Why:** the track captures the pointer on `pointerdown` (`setPointerCapture`), so the click is retargeted to the
  track. The link's native `dragstart` then fires `pointercancel`.
- **What still works:** keyboard Enter navigates. At 390, a touch swipe moves the track 0 → 328px and a tap
  navigates.
- Code: `blocks/carousel/carousel.js:204–237`, `blocks/story-rail/story-rail.js:219–224`.

## Scope
- Capture the pointer only after the drag threshold is crossed, e.g. more than 5px of horizontal movement. A
  press-and-release below the threshold is a click and reaches the link.
- Suppress the native image/link drag (`dragstart` → `preventDefault` on the track's anchors and images) so a mouse
  drag scrolls the track.
- Swallow the click that follows a real drag, so dragging never navigates.
- Shared by `carousel` and `story-rail`. Change nothing in rail geometry here; that stays in the V2 parity items
  (212 QA fix / 820).

## Acceptance Criteria
- [ ] At 1440, a trusted mouse click on a card navigates on home eMobility, Latest News and the Epiq Related
      Stories rail.
- [ ] A trusted 300px mouse drag moves `scrollLeft` by ≥ 250px, and releasing after the drag does not navigate.
- [ ] 390 touch swipe/tap and keyboard (Tab / Enter / arrow keys) behave as before. The existing rail unit tests
      pass, and new tests cover click-below-threshold and drag-then-release.
- [ ] Preview link: `https://skoda-212a-rail-pointer--demo--skoda-storyboard.aem.page/en`

## Dependencies
Builds on 212 (#98). It does not block other tickets. Re-run both sweeps' rail probes with trusted input afterwards.
