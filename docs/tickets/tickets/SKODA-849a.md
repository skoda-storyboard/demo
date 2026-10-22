# SKODA-849a, Škodapedia glossary spans: links to the term page per locale, and an optional accessible teaser

- **Epic:** E06, Import Pilot Content
- **Type:** import (story and release transformers) + a small `scripts/` enhancement
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Must land **before the SKODA-803 bulk run**; after it, about
  300 docs need a re-import.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d *(planning estimate, not a quote)*. The finding sizes it at 3–5
  SP (transformer, popover, tests); plain links only are about 2 SP.
- **GitHub issue:** [#444](https://github.com/skoda-storyboard/demo/issues/444) (created 2026-10-21, sub-issue of #426)
- Parent: SKODA-849 ([#426](https://github.com/skoda-storyboard/demo/issues/426))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-C-01 (High, CONFIRMED, browser-checked).

## Why
- Bodies mark terms as `span.term-explain` with inline JSON (`data-explain`). The source turns each into a Škodapedia
  teaser with a "Read More" link. html2md keeps the text and drops the attribute.
- 106 of 3,374 sampled docs carry 386 spans for 146 distinct terms. The corpus estimate is 250–400 docs (the CS and
  DE story windows were not sampled). Still in use: the 2026-01-27 4x4 story (EN, CS, SK).
- Locales cross: 10 of 11 SK spans point to CS term ids, and an SL post points to 3 EN terms.
- The browser check: the teaser can't take keyboard focus and Escape doesn't close it.
- `SKODA-EN-BLOCK-INVENTORY.md` concluded the glossary is "skodapedia-only", so the backlog believed it didn't exist.

## Scope
- **Client (in SKODA-849):** an accessible teaser like the source's, or plain links to the term page.
- **Transformers** (story and release): rewrite each span to a marked link to the term at the target locale's public
  path (`data-explain.id` → term path), with a written fallback when the locale has no term (SK → CS, SL → EN as
  found). Each rewrite and each fallback is counted in the run report (849 drop count).
- **Teaser, if the client wants it:** a `scripts/` popover with a focusable trigger, Escape to close and no
  hover-only behaviour.
- **Authoring:** add the glossary-link pattern to the DA library (SKODA-842).

## Not in scope
- Škodapedia term pages, their scope and URLs (SKODA-802 / 206, G-C-02) and the term authoring flow (G-C-07).

## Acceptance criteria
- [ ] Unit test: a `span.term-explain` becomes a link to the right locale's term, including the SK → CS fallback.
- [ ] Dry run on the Octavia Euro NCAP release, the 4x4 story and the SK Scala story: terms link to term pages and
      `import:validate-blocks` passes.
- [ ] If the teaser ships: Tab reaches the trigger, Enter opens it and Escape closes it.

## Dependencies
G-C-02 (term pages must exist: SKODA-802 / 206); SKODA-842 (library). Lands before SKODA-803. Parent: SKODA-849.
