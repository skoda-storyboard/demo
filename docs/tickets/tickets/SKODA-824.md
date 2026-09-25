# SKODA-824, Page-level floating action dock: share expander + scroll-to-top
- **Epic:** E02, Core Blocks
- **Type:** block (page-level, auto-loaded; no authoring)
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** — (drafted on disk 2026-09-25; create at sign-off)
- **Estimate:** 1.5 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO, **draft**

## Origin
The 2026-09-25 DevTools URL→block sweep ([`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §3–§4)
registered the floating dock on **all 42 M1 pages**:
- all 20 stories
- all 5 press releases
- all 5 model pages
- all 5 series hubs
- all 4 press kits
- home, Images and Videos

That is 84 registry rows, all `NOT-BUILT`. The fleet registered 56 of them; the Architect added the model, series and
press-kit rows from the same captures. No ticket builds the dock:
- `docs/ui-specs/social-share.md` is a measured, build-ready spec, but it points at "COM-15 / STO-D10".
- The traceability matrix maps STO-D10 to **SKODA-304**, and 304's ACs cover only the footer *follow* links (brand
  profiles). 304 is closed.
- SKODA-215 covers only the **gallery** share dropdown. SKODA-505a/b cover only the cart button.

## Problem
The source renders one fixed dock of global page actions at the bottom right on every template (STO and MR alike).
It is `div.sticky-buttons`: `position: fixed`, 322×70 at 1280, 8 anchors, present at 375 and 1280. It contains:
- `.btn-group.social`, the share expander. Clicking the trigger adds `.expanded`, and the group opens into X,
  Pinterest, LinkedIn, Facebook and WhatsApp share-intent links for the current URL.
- `.media-cart-icon`, the media-cart button with its count.
- `.round-icon`, the scroll-top button, which appears after the page scrolls.

On EDS none of this exists, so every demo page is missing a visible, always-on control.

## Scope
- One page-level dock, loaded lazily from `scripts/scripts.js` (`loadLazy`/`loadDelayed`) on all templates. Follow the
  single inline-bar model recommended in `social-share.md` §2:
  - share trigger
  - five intent links: `target=_blank`, `rel="noopener noreferrer"`, URL and title encoded, and `navigator.share`
    first where it is available
  - scroll-to-top, shown after one viewport of scroll
  - a **slot** for the SKODA-505a/b cart button. The dock owns the position; 505b owns the cart button.
- Use inline SVG icons (`:name:` → `decorateIcons`), not the icon font. Scope the CSS to the dock block and use the
  `social-share.md` §3 tokens.
- Keep the dock clear of the cookie banner (SKODA-704 stub) and the mobile nav drawer (z-index order documented).
- Share intent-URL building is shared with SKODA-215 (gallery share) in `/scripts/`, not duplicated.
- Out of scope: analytics `data-ctatype` wiring (SKODA-905), and the facebook `app_id` (use the `sharer.php`
  fallback).

## Acceptance Criteria
- [ ] Present on every page template: story, press release, model page, series hub, press kit, home, Images and
      Videos. Verified on the 42 M1 URLs wherever the page exists on EDS; press kits are verified once 805a/c
      import them. Absent on fragments (`/nav`, `/footer`).
- [ ] 375 / 768 / 1280: position, size and pill styling match `social-share.md` §3 within the sweep thresholds
      (±2px; exact colour token).
- [ ] The trigger is a real `<button aria-expanded>` that toggles the list. Esc closes it and returns focus. Each
      link has an accessible name ("Share on LinkedIn").
- [ ] Intent URLs contain the canonical page URL and title, URL-encoded, verified for all five networks. WhatsApp
      is shown only on touch/mobile.
- [ ] Scroll-to-top: hidden at the top of the page, shown after 1 viewport. It moves focus to the top of `main`
      and honours `prefers-reduced-motion`.
- [ ] No CLS (fixed position, reserved size) and no main-thread work before LCP (loaded lazily).
- [ ] Preview link: `https://skoda-824-float-dock--demo--skoda-storyboard.aem.page/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds`

## Dependencies
- 505b: the cart button is placed in the dock slot.
- 704: stacking against the consent banner.
- 215: reuses the share-intent helper that 824 creates in `/scripts/`.

It does not block any other M1 ticket.

**Lane:** AI-agent ticket (isolated new block, build-ready spec, objective oracle); saran reviews. Plan A: Should.
Plan B (§14 accepted): **Must**, and it delivers C-6 social share in place of SKODA-215, which goes back to Could.
