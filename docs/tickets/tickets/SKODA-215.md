# SKODA-215, Floating action bar: share cluster + scroll-to-top
- **Epic:** E02, Core Blocks
- **Type:** site-wide component
- **Phase:** A · **Milestone:** M1 (demo-visible; the gap review rates share C-6 as Must)
- **GitHub issue:** [#139](https://github.com/skoda-storyboard/demo/issues/139)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO. The ID was referenced in the backlog and in 216/217/801a, but no ticket file existed until now.
  The M1 sweep's duplicate draft SKODA-827 was folded in on 2026-09-25 and removed.

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
- **Scope correction (M1 URL→block sweep §11, folded in from the duplicate draft SKODA-827):**
  - **Coverage:** the DevTools census found the same fixed `div.sticky-buttons` on **all 43 captures** at 375 and
    1280. That is every template: story, press release, model page, series hub, press kit, home, Images and Videos.
    The live re-check on 2026-09-25 confirmed it on home, the press release, Images and Videos.
  - **Contents:** 8 anchors. `.btn-group.social` expands (`.expanded`) into X, Pinterest, LinkedIn, Facebook and
    WhatsApp intent links. There is also `.media-cart-icon` (the cart count) and `.round-icon` (scroll-top).
  - **Size:** 322×70 at 1280.

## Scope
- A delayed-phase component (`delayed.js` or a block) rendering the bar. The share menu uses real links and the Web Share API
  where available. Leave room for the media-cart badge (SKODA-505a).
- Accessibility: `<button aria-expanded aria-controls>`, labelled network links, focus-visible, Esc closes.
- The dock owns the position, and it leaves a **slot** for the media-cart button. 505a/b own the cart button itself.
- Share intent-URL building lives in `/scripts/`, so the gallery share (SKODA-216) reuses it. Use inline SVG icons
  (`decorateIcons`) rather than the icon font.
- Stack it below the cookie banner (704 stub) and the mobile nav drawer, and document the z-index order.
- Out of scope: analytics `data-ctatype` (905) and the Facebook `app_id` (use the `sharer.php` fallback).

**Lane:** AI-agent ticket (isolated, build-ready spec, objective oracle); saran reviews. Plan A: Should (P1).
Plan B (§14 accepted): **Must**, since it delivers C-6 social share.

## Acceptance Criteria
- [ ] Present on **every template** (story, press release, model page, series hub, press kit, home, Images, Videos).
      Verify on each M1 URL that exists on EDS; press kits are verified once 805a/c import them. Absent on the
      `/nav` and `/footer` fragments.
- [ ] 1440/390: bar position and button sizes as measured (±2px); share expands to the 4 networks (+ WhatsApp at ≤768).
- [ ] Intent URLs carry the canonical page URL and title, URL-encoded, verified for all 5 networks. They use
      `target=_blank` and `rel="noopener noreferrer"`, and prefer `navigator.share` where it is available.
- [ ] The trigger is a real `<button aria-expanded>`. Esc closes the list and returns focus to the trigger. Every
      link has an accessible name ("Share on LinkedIn").
- [ ] Scroll-to-top: hidden at the top of the page and shown after 1 viewport of scroll. It moves focus to the top
      of `main` and honours `prefers-reduced-motion`.
- [ ] No layout shift (fixed position, reserved size), and nothing runs on the main thread before LCP (loads in the delayed phase).
- [ ] Preview link: `https://skoda-215-float-dock--demo--skoda-storyboard.aem.page/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds`

## Implementation notes (2026-09-29, branch `skoda-215-float-dock`, ready for QA)
- **Where:** `blocks/float-dock/` (code-only block, built by `loadFloatDock()` in `scripts/scripts.js` in the delayed
  phase, skipped on `/nav` + `/footer` paths); intent URLs in `scripts/share.js` (+ `share.test.mjs`) for 216 to reuse.
- **Measured corrections (source re-measured at 390 / 767–769 / 991–992 / 1440):** the button size flips at **992**
  (40px below, 58px from 992), not 768; the share list direction flips at **768** (stacked upward below, leftward
  from 768). Pitches: share→scroll-top = button + 4px; leftward list 9px off the trigger then 3.2px gaps (61px pitch
  at 58px); stacked list 10px off the trigger then 4px gaps (44px pitch). EDS positions match the source to the pixel
  at all six widths.
- **Decisions:** WhatsApp shows below 768px only, per this ticket's spec (product decision 2026-09-29, confirmed after
  code review). This is a deliberate exception to css-guidelines §8 (width-based rather than input-capability-based);
  the source hides it by UA. It has no `target=_blank`, since `whatsapp://` hands off to the app. It uses an ink glyph (`icons/whatsapp-ink.svg`), since white on `#43d854` fails contrast. **No `navigator.share`:** the trigger always
  expands the intent list, as on the source (product decision 2026-09-29 after the branch-preview review). This
  supersedes the "prefer `navigator.share`" wording in the acceptance criteria. Facebook uses `sharer.php`.
- **Live click behaviour (re-checked 2026-09-29 on https://www.skoda-storyboard.com/en/ and its source JS):**
  - Scroll-top appears past **300px** of scroll (source `main.js`/`media-room.js`: `300 < scrollTop`) and hides
    again below that. The bar follows the source, which supersedes the "after 1 viewport" acceptance criterion.
  - The reveal uses the source spring `0.3s cubic-bezier(.68,-.55,.27,1.55)`.
  - The list opens and closes like the source: it fades in over 0.2s after a 0.2s delay, and out over 0.4s. It
    starts 15% back along its axis: sideways on desktop, upward on mobile.
  - Clicking outside leaves the list open, as on the source. Esc closes it from anywhere on the page (an a11y
    addition per the ACs; the source has none).
- **Code review (2 passes, 2026-09-29):**
  - Fixed: test files unserved (`.hlxignore`), CSS-load failure handled, reduced motion covers open and close,
    focus kept when scroll-top hides, `main` focus target cleaned up, eager icons, hover only on hover devices,
    RTL-safe slides, share fallback URL strips the query.
  - Kept, for source parity: the bar also shows on the 404 page, as on the live site.
  - Kept, per spec: WhatsApp is shown by width (below 768), not by touch capability.
- **404 page:** `404.html` now loads `styles/brand.css` before `styles.css`, as `head.html` does. Before this, none of
  the brand tokens resolved on the 404 page, so the bar there had no white fill or shadow.
- **Layout shift:** the scroll-top keeps its slot, and the share cluster slides over it with a transform. The block's
  CSS loads before insertion, and the bar stays `display:none` until decorated. Dock CLS is 0.
- **Stacking:** `--z-float-dock: 18` (order documented in `styles/styles.css`): above in-page layers, below the header
  and mobile drawer (20), the gallery lightbox and the consent banner.
- **Cart slot:** `.float-dock [data-slot="media-cart"]`, empty (`display:none`) until SKODA-505a/b appends its
  button. It sits between share and scroll-top, as on the source.

## Dependencies
docs/ui-specs/social-share.md, SKODA-505a/b (cart slot), SKODA-704 (stacking against the consent banner), SKODA-216
(gallery share, separate; reuses the `/scripts/` helper).

## Import contract (SKODA-603)
Contract `floating-action-bar` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Code-only on every template: the importers emit nothing. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
