# SKODA-205, Tags block / metadata rendering
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/tags.md`](../../ui-specs/tags.md)** (captured via Chrome DevTools, token-mapped, pixel-perfect AC). Read it before implementing.

Key facts from capture that change this ticket:
- Per-article tags render as **`a.label`, NOT `.tag`** (the ticket's assumption). Grey `#7c7d7e` rectangle, radius `2px`, padding `5px 10px`, `11px`/600 **uppercase**, white text, letter-spacing `0.1em`, `float:left` items in `ol.entry-tags.tag-list`, `5px` gaps.
- Tags **do link**: story → `/en/tag/<taxonomy>/<slug>/`; press release → facet URL `/en/news/?filter[…][]=…` (so tag markup must align with SKODA-401 facet taxonomy).
- The green pill `.tag` (radius `2em`, `#78faae`, hover/active `#a8ffcc`) is a **facet / media-cart chip context**, not the article tag, documented as a separate `chips` variant.
- **A11y:** grey `#7c7d7e` on white at 11px is borderline (~3.9:1, fails AA), recommend darkening to `--skoda-ink`.
- Token gaps: define `--skoda-grey-500: #7c7d7e`; add `--tag-radius/padding/font-size/letter-spacing/gap`.
- Note: this ticket's Risks still reference the retired `helix-query.yaml`; index config is now `query.yaml` PUT to the admin config service (see architecture doc). Coordinate facet alignment with SKODA-401 accordingly.

## Summary
Build the Tags block (or default-content rendering) that displays a page's taxonomy tag pills and feeds page metadata.

## Description
Tags appear on 83% of pages (story 1,276, press_release 1,628, `SKODA-EN-BLOCK-INVENTORY.md` §2A). Low effort, a tag/metadata block or default content (`SKODA-EDS-DA-ARCHITECTURE.md` §3 "Tags → default content / small block"). The tag values also correspond to the taxonomy facets that the query index (SKODA-104/401) extracts, so consistent tag markup supports listings.

## Requirements / Spec
**DA content model (table):**
```
| Tags                          |
| ---                           |
| Kamiq, Technology, Motorsport |
```
- Single cell of comma-separated tags, or default-content list. Also surfaced in the page **Metadata** table (category/model taxonomy) for index extraction.

**`decorate(block)` outline:**
1. Parse tag values (comma-split or list items).
2. Render accessible pill list (`<ul>`/`<a>` linking to the relevant listing/facet where applicable).
3. Add semantic classes (`tags-item`) for styling, no positional selectors.
- CSS: pill styling via SKODA-106 tokens; CSS-only responsive (inventory §8, trivial).

## Acceptance Criteria
Measurable gates live in [`tags.md` §9](../../ui-specs/tags.md); summary:
- [ ] Tags render as `a.label`-style grey chips: radius `2px`, padding `5px 10px`, `11px`/600 uppercase, letter-spacing `0.1em`, `5px` gaps, wrapping list.
- [ ] Tags link out: story → `/en/tag/<taxonomy>/<slug>/`; listing/press → facet URL; values align with SKODA-401 facet taxonomy.
- [ ] Contrast ≥ 4.5:1 (darken source `#7c7d7e`→`--skoda-ink` to pass AA at 11px).
- [ ] Hover = underline (source `a.label`); provide visible `:focus-visible` ring.
- [ ] Optional `chips` variant (green `.tag`, radius `2em`) reserved for facet/cart contexts.
- [ ] Keyboard-focusable; semantic list markup; tokens-only CSS; `npm run lint` clean.

## Dependencies
- Upstream: SKODA-102
- Downstream: SKODA-401 (facet taxonomy alignment), SKODA-603 (pilot pages)

## Risks / Flags
- Tag markup must be consistent enough for `helix-query.yaml` selectors to extract facet columns reliably (R-A1), coordinate with SKODA-401.
- CSS `:only-child` pitfall: don't use it to detect "only content" (matches ignoring text nodes), use JS `textContent` checks per repo conventions.
