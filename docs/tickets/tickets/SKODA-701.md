# SKODA-701 — Lint + unit tests for block logic
- **Epic:** E07 — QA, Perf, A11y & Launch
- **Type:** QA
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d *(planning estimate, not a quote)*

## Summary
Enforce a clean `npm run lint` and add unit tests for the pure logic inside the pilot blocks.

## Description
The pilot blocks (E02) and chrome fragments (E03) plus listings/search (E04) contain testable pure logic — facet filtering, sort, client-side paging/offset, provider-URL parsing for embeds. This ticket locks in lint cleanliness and adds focused unit tests for that logic so regressions are caught before perf/a11y validation.

## Requirements / Spec
- `npm run lint` passes with zero errors across changed blocks/scripts/styles (ESLint + Stylelint).
- Unit tests for pure block logic: faceted-listing filter/sort/paging (offset + deep-link state), embed provider-URL detection (preserve `dnt=1`), any glossary A–Z/category class-matching logic.
- Tests run headless (no browser needed for pure logic); browser-only behavior is covered in SKODA-703, not here.
- Follow repo conventions (Airbnb ESLint, Stylelint standard, unquoted font names).

## Acceptance Criteria
- [ ] `npm run lint` is clean.
- [ ] Unit tests exist and pass for facet filter/sort/paging logic.
- [ ] Unit tests exist and pass for embed provider-URL parsing (incl. `dnt=1` preservation).
- [ ] Tests are runnable in CI headless.

## Dependencies
- Upstream: E02 (Core Blocks), E03 (Chrome Fragments), E04 (Listings & Search). / Downstream: SKODA-704 (pilot sign-off).

## Risks / Flags
- Some interactive behavior (focus-trap, lazy-load timing) is not unit-testable — explicitly deferred to the browser-based a11y/perf tickets.
