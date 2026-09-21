# SKODA-102 — Boilerplate scaffold (scripts.js, styles, head.html, aem.js untouched)
- **Epic:** E01 — Foundation & Setup
- **Type:** setup
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–5d *(planning estimate, not a quote)*

## Summary
Lay down the aem-boilerplate code scaffold — three-phase `scripts.js`, `styles/`, `head.html`, `blocks/` conventions — with `scripts/aem.js` left untouched.

## Description
Provides the buildless code skeleton every block and fragment plugs into, per `SKODA-EDS-DA-ARCHITECTURE.md` §2 (Code layer) and §11 (three-phase load for performance). Sets the decoration entry point (`loadPage` → eager/lazy/delayed) and the file-layout contract (`blocks/{name}/{name}.{js,css}`) so E02/E03 blocks slot in without build tooling.

## Requirements / Spec
- Initialize from aem-boilerplate: `blocks/`, `styles/` (`styles.css`, `lazy-styles.css`, `fonts.css`), `scripts/` (`aem.js`, `scripts.js`, `delayed.js`), `head.html`, `404.html`, `icons/`, `fonts/`.
- **NEVER modify `scripts/aem.js`** (core decoration library).
- `scripts.js` entry point implements the three phases:
  - Eager — decorate main/sections/blocks/buttons + load first section (LCP path).
  - Lazy — remaining content, header + footer fragments, `lazy-styles.css`.
  - Delayed — `delayed.js` for third-party (consent/analytics) loaded late.
- Establish variant convention: compound classes authored `Block (variant)` (e.g. `Cards (overlay)`).
- Buildless: vanilla ES6+, LF endings, `.js` extensions on imports, Airbnb ESLint + Stylelint standard config in place.
- `npm run lint` and `npm run lint:fix` wired.

## Acceptance Criteria
- [ ] Repo builds/serves locally via `aem up` at `http://localhost:3000` with auto-reload.
- [ ] `scripts/aem.js` is unmodified vs boilerplate.
- [ ] `scripts.js` shows the three-phase structure (eager/lazy/delayed) with header/footer loaded in the lazy phase.
- [ ] `npm run lint` passes clean on the scaffold.
- [ ] A placeholder block decorates without console errors.

## Dependencies
- Upstream: SKODA-101
- Downstream: SKODA-103, SKODA-104, SKODA-106; SKODA-201, SKODA-202, SKODA-203, SKODA-204, SKODA-205, SKODA-206; SKODA-301, SKODA-304; SKODA-501, SKODA-502; SKODA-601 (all blocks/fragments/import depend on the scaffold)

## Risks / Flags
- Regressions from editing `aem.js` are hard to trace — enforce the no-touch rule in review.
- Three-phase discipline is load-bearing for the Lighthouse≈100 target (SKODA-702); deferring third-party to delayed phase is a consent/analytics-coupling requirement.
