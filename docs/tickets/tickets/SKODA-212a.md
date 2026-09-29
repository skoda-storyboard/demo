# SKODA-212a, Rails: desktop mouse click navigates and drag scrolls (follow-up to SKODA-212)
- **Epic:** E02, Core Blocks
- **Type:** bug fix (block JS)
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** [#150](https://github.com/skoda-storyboard/demo/issues/150) · follow-up to [#98](https://github.com/skoda-storyboard/demo/issues/98) (SKODA-212, Done)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Priority:** P0: every rail on every page.
- **Status (2026-09-29):** 🟡 In review, [PR #198](https://github.com/skoda-storyboard/demo/pull/198) (branch
  `skoda-212a-rail-pointer`). The review comments (title-clamp breakpoint, ticket hygiene) are addressed.

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
- [x] At 1440, a trusted mouse click on a card navigates on home eMobility, Latest News and the Epiq Related
      Stories rail.
- [x] A trusted 300px mouse drag moves `scrollLeft` by ≥ 250px, and releasing after the drag does not navigate.
- [x] 390 touch swipe/tap and keyboard (Tab / Enter, plus Enter/Space on the prev/next buttons) behave as before.
      The existing rail unit tests pass, and new tests cover click-below-threshold and drag-then-release.
      No arrow-key handling is expected: the carousel had none before, and none was added.
- [x] Preview link: `https://skoda-212a-rail-pointer--demo--skoda-storyboard.aem.page/en`

## Dependencies
Builds on 212 (#98). It does not block other tickets. Re-run both sweeps' rail probes with trusted input afterwards.

## Amendment (2026-09-25, from SKODA-610 QA): one-line rail titles
- **Measured on the source (Epiq story Related Stories, 1440):** each card title is cut to **one line with "…"**:
  18px / 21.6 line height, 22px high, `overflow: hidden`, in 354px cards (e.g. "An Epic Start to the Tour de France:…").
- **EDS (branch `skoda-610-clean-titles`, titles already suffix-free):** 2–3 lines (43–65px), no clamp.
- [x] Rail card titles (`carousel` / `story-rail` overlay cards) end in an ellipsis, **per band as on the source**
  (re-measured 2026-09-28, corrected 2026-09-29 after the PR #198 review; the user chose "match live" over
  "1 line everywhere"):
  - home and Media Room rails: 2 lines, 43px high;
  - Related Stories (story): 1 line, 18px (21.6px high) **from 769px** (`width > 768px`); 2 lines at 20px up to 768;
  - Related Press Releases: 1 line, 18px, at **every** width (375–1440);
  - Models / Series caption cards: unclamped.

  **Measuring note:** the source trims titles with `dotdotdot({watch:true})`, which re-runs on resize. A resized
  source page can show 2 lines at 1440 or 1 line at 375, so measure each width on a **fresh load**.

  Other card-teaser consumers (stories feed, listing) are unchanged.

## Implementation notes (2026-09-28)
- **Pointer:** `dragStep()` in `blocks/carousel/carousel.js` is a pure gesture step and `swallowClick()` the
  click rule. `bindDrag(track)` wires them to the track, with one cleanup path. All three are exported for the tests.
  `pointerdown` only records the start. The pointer is captured, and `is-dragging` set, on the first move past
  `DRAG_THRESHOLD` (6px). `dragstart` is prevented on the track. The click after a real drag is swallowed; a new press
  resets it. `story-rail.js` needed no change (it builds a `carousel`).
- **Edge cases (tightened after the 2026-09-28 code review):**
  - A press is dropped when the pointer leaves the track before capture, or on a move with no button held.
    Coming back with a button held (e.g. a text selection) can't make the rail jump; checked in the browser, no
    stray scroll.
  - Only the pointer that pressed first drives the gesture, so a second finger is ignored.
  - `lostpointercapture` ends a drag only when the track itself lost capture. The bubbled event from a card losing
    touch's implicit capture is ignored.
  - A `pointercancel` (native touch pan) clears the swallow flag, so a later keyboard Enter still navigates.
  - Keyboard-activated clicks (`detail` 0) are never swallowed.
  - Tests: 28 carousel tests. `bindDrag` is driven on a fake `EventTarget` track. Each of the 7 fixes was
    removed in turn, and every removal fails a test.
- **Mobile / tablet (touch context):**
  - At 320, 390 and 768, a tap navigates and a swipe scrolls (265 / 328 / 236px, snapped) without navigating.
  - Enter right after a swipe navigates. A vertical pan over a rail scrolls the page (768: 140px, track unmoved).
- **Keyboard (1440):** the Next button works with Enter and Space, and Tab walks the cards with `:focus-visible`.
- **Geometry unchanged:** built rail heights are the same as main (home 166 / 174px at 1440 / 375, Epiq 199 / 179px).
  The home rails' reserve is 8px short of the built height on main (158 → 166 at 1440). That shift predates this
  ticket and belongs to the SKODA-212 CLS reserve.
- **Checked with trusted input on the main preview, new code routed in:**

  | Check | Result |
  |---|---|
  | 1440 click: home eMobility, Latest News, Epiq Related Stories | navigates on all three |
  | 1440 300px drag: same three rails | `scrollLeft` 301 / 301 / 374 (Epiq snaps to the next card), no navigation |
  | 390 touch | tap navigates; swipe 0 → 328px, no navigation |
  | 390 keyboard | link has `:focus-visible`; Enter navigates |
- **Title clamp: matches the source per band, not 1 line everywhere.** Live measurements (fresh load per width,
  re-measured 2026-09-29):
  - home and Media Room rails: 2 lines, `max-height` 43.2px;
  - Related Stories (story): 2 lines at 20px (48px) at 375 and 768; 1 line at 18px (21.6px) at 769, 800, 991, 992
    and 1440;
  - Related Press Releases: 1 line at 18px (21.6px) at 375, 500, 767, 768, 769, 991 and 1440;
  - Models / Series caption rails: no clamp.

  How it's built:
  - `.carousel-overlay .card-teaser-title` clamps to `var(--carousel-title-lines, 2)`; caption cards are not
    clamped.
  - `story-rail.css` sets `--carousel-title-lines: 1` for `body.press-release .section.related` at every width.
  - For the story related band it sets 1 line together with the 20 → 18px title size in one `(width > 768px)`
    query: one transition, one breakpoint (css-guidelines §3). Previously the size switched at 992 and the clamp
    at 992. The card-width step stays at 992, where the source's column count changes.

  Result (fresh loads): story band 20px/2-line clamp at 375/768, 18px/1 line at 769/800/991/992/1440; press band
  18px/1 line at 375–1440; home 43px unchanged.
