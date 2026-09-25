# SKODA-307, Header/footer: survive a missing nav/footer fragment
- **Epic:** E03, Chrome Fragments
- **Type:** block hardening
- **Phase:** A · **Milestone:** M1
- **GitHub issue:** [#143](https://github.com/skoda-storyboard/demo/issues/143)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🔵 TODO

## Origin
2026-09-25 incident, found during the SKODA-602 review: `/footer` was previewed but never published,
so `/footer.plain.html` returned 404 on `.aem.live` and **every live page rendered an empty footer**
(`.aem.page` was fine). The content fix (publishing `/footer`) is done. This ticket covers the code side.

## Problem
`loadFragment()` (`blocks/fragment/fragment.js`) returns `null` when the fragment 404s. Both chrome
blocks then dereference it without a check:
- `blocks/footer/footer.js:110`: `while (fragment.firstElementChild)` throws
  `TypeError: Cannot read properties of null (reading 'firstElementChild')`. The block is marked
  "loaded" but stays empty.
- `blocks/header/header.js:126`: same pattern for `/nav`, so a missing nav would break the header.

## Scope
- In both blocks: if `loadFragment()` returns `null`, log a clear warning naming the fragment path
  (`console.warn('[footer] fragment /footer not found — is it published?')`), leave the block empty, and
  don't throw. No layout change.
- Unit test (or a browser check) with a fragment path that 404s: no uncaught error, other blocks still load.

## Acceptance Criteria
- [ ] Missing `/footer` or `/nav` gives a warning in the console, no `TypeError`, and the page otherwise renders.
- [ ] Existing footer/header rendering unchanged when the fragment exists (checked on `.aem.page` and `.aem.live`, 1440 + 390).
- [ ] `npm run lint` clean.

## Dependencies
SKODA-301 (header), SKODA-304 (footer). Prevention at publish time is in SKODA-602 (shared-fragment check).
