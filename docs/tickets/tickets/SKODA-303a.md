# SKODA-303a, Language switcher vs link containment (SKODA-609): decide the locale-link rule

- **Epic:** E03, Chrome Fragments (follow-up to SKODA-303, #24)
- **Type:** fragment / decision
- **Phase:** A · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **GitHub issue:** [#243](https://github.com/skoda-storyboard/demo/issues/243)
- **Status (2026-10-15, from GitHub):** ✅ Done (#243 closed 2026-10-14); rule decided 2026-10-08 (page `hreflang` alternates), shipped in PR #299.

## Origin
Found while testing SKODA-225 (PR #242): `npm test` fails on `main` in
`blocks/header/header-locales.test.mjs` ("header: the topbar group becomes a `<div>` list…", assertion "the path is kept").

## Problem
Two merged tickets now disagree about the language links.
- **SKODA-303 (PR #232):** each locale links **the current page in that locale**, in the same tab
  (`/en/emobility/x` → `/cs/emobility/x`), matching the live click behaviour. Only an authored link to another site
  (the Media Room DE → skoda-media.de) opens in a new tab.
- **SKODA-609 (link containment, `scripts/links.js`):** `LIVE_ONLY` sends any non-`/en` locale path to the **live site in a
  new tab** (`/^\/(?!en(?:\/|$))[a-z]{2}(?:\/|$)/`), so EDS never 404s. It rewrites the nav fragment's `/cs` … before the
  header decorates.

**Result on `main` today** (Epiq story, measured 2026-10-01): `CZ=https://www.skoda-storyboard.com/cs target=_blank`,
the same for DE / SK / SR / SL.
- Every language link opens the **live locale home in a new tab**.
- The page path is lost.
- The header test fails.

## Options (decide one)
1. **Containment wins, but keep the page.** The switcher localises the path first (`/cs/emobility/x`), then
   containment maps it to the live site in a new tab (`https://www.skoda-storyboard.com/cs/emobility/x`). The live site
   translates its slugs (`/cs/e-mobilita-cs/…`), so most of these targets 404 on live too. A rule mapping to the live
   locale home would be safer.
2. **The switcher opts out of containment** for its own links. They stay `/cs/emobility/x` in the same tab and 404 on EDS
   until the locale trees are migrated (the SKODA-303 decision, "keep `/{locale}/` links").
3. **The switcher links the live site's matching translation** (from the source page's `hreflang` alternates, imported as
   metadata) until the locale trees exist. That is closest to the live behaviour, but needs an importer change
   (SKODA-1003 territory).

## Acceptance Criteria
- [ ] The chosen rule is documented in `docs/ui-specs/language-switcher.md` §8 and in SKODA-609's policy comment.
- [ ] The language links follow it on the home page, a story, a press release and the Media Room (Media Room DE still
      opens skoda-media.de in a new tab).
- [ ] `blocks/header/header-locales.test.mjs` passes and covers the containment interaction; `npm test` is green.

## Dependencies
SKODA-303 (#24), SKODA-609, SKODA-1003 (option 3).
