# SKODA-206, Škodapedia glossary block (directory + A–Z/category filter + term modal)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

> ⚠️ **Scope caveat (adversarial finding F6, 2026-09-14):** the client **§9** states Škodapedia *"continues **outside** Storyboard, so Storyboard should not be designed around its current inclusion."* This ticket is therefore scoped as **"prove the encyclopedia/glossary block pattern only"**, the actual Škodapedia *content* lives outside Storyboard and is not migrated here. **Candidate to drop from M1** if the pilot needs the 5 SP; keep only if the glossary pattern is wanted as a demo showcase. Confirm with the client before building.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/skodapedia.md`](../../ui-specs/skodapedia.md)** (captured via Chrome DevTools, term-detail opened live). Read it before implementing.

Key facts from capture:
- Directory = filter bar + A-Z jump nav (`.sp__list-nav`, circular links, `.is-deactivated` for empty letters) + a single-column term list (212 terms, JS absolute-positioned masonry, green `#419468` underlined links carrying `data-term-id` + model/category filter classes).
- Filter is **confirmed 100% client-side** (class/text match, zero XHR).
- Term detail today: `GET /wp-json/skodapedia/v1/term/{id}?lang=en_GB` → `{content:"<html>"}` injected into `.sp__term-detail` (right-hand ~`43.75%` side panel desktop / near-full-width sheet mobile), pushState to slug. **A11y gaps:** close is a non-focusable `<span>`, no `role=dialog`/`aria-modal`/focus-trap.
- Recommended EDS: pre-bake term details to static `/modals/` + accessible modal rebuild (confirms this ticket's approach).
- New tokens: `--az-nav-size:24px`, `--modal-shadow`, reuse `--gallery-accent:#419468`.

## Description
Škodapedia is a self-contained encyclopedia template (189 EN pages). Per `SKODA-SYSTEM-BUILD-SPECS.md` §5 and `SKODA-COMPLEX-SYSTEMS-DEEP-DIVE.md`: the source renders **all term titles inline** (212 `sp__list-directory__item`) with **27 A–Z nav links**, and the letter/category filter is **100% client-side CSS-class matching (no fetch)**. Only the **term detail** is a thin fetch today (`skodapedia/v1/term/{id}` → ready-rendered HTML). In EDS this is **eliminable**: pre-bake each term as a `/modals/` doc → the glossary becomes **fully static, no runtime API** (`SKODA-EDS-DA-ARCHITECTURE.md` §3/§5).

This ticket builds the **block** (directory + filter + modal wiring). The bulk **term-content authoring/pre-bake** at scale (all ~189 EN terms as `/modals/` docs) is **SKODA-802 (Phase B)**; the pilot proves the pattern on a representative subset.

## Requirements / Spec
**DA content model (table):**
```
| Glossary            |
| ---                 |
| /skodapedia-index   |   (or authored inline term rows: term title | letter | category tags)
```
- Directory rows carry each term's **letter** + **category** as tokens (mirrors the source `sp-a kamiq technology` class model) so filtering is pure client-side.
- **Term detail** via the EDS `/modals/` convention (`/developer/block-collection/modal`): each term links to `/modals/skodapedia/{slug}` (a pre-baked DA doc), opened as an overlay, `autoLinkModals()` pattern. Pilot pre-bakes a representative subset of terms.

**`decorate(block)` outline:**
1. Render the inline A–Z directory (all terms present in HTML → SEO-friendly, no fetch).
2. Build the A–Z + category filter UI; on change, toggle item visibility by matching the letter/category tokens (reproduce source's client-side filter).
3. Wire term links to `/modals/…` docs; ensure the modal traps focus, closes on Escape, and returns focus to the trigger.

## Acceptance Criteria
Measurable gates live in [`skodapedia.md` §9](../../ui-specs/skodapedia.md); summary:
- [ ] Full term directory renders inline (crawlable) with the A-Z jump nav (empty letters `.is-deactivated`); term links green `#419468`.
- [ ] Letter and category filters work **client-side only** (no network request).
- [ ] Term detail opens as an accessible modal via `/modals/` (source uses a right-hand side panel + non-focusable span close + no dialog role, **fix**): `role=dialog`, focus-trap, Escape, return-focus.
- [ ] No runtime API dependency once terms are pre-baked (pilot proves on a subset).
- [ ] Tokens-only CSS; `npm run lint` clean.

## Dependencies
- Upstream: SKODA-102, SKODA-106
- Downstream: SKODA-603 (pilot pages), SKODA-703 (a11y audit, glossary modal), SKODA-802 (Phase B: pre-bake all terms as `/modals/` docs at scale)

## Risks / Flags
- **Modal focus behavior is `[RUNTIME-UNCONFIRMED]`**, verify in a browser under SKODA-703.
- Pre-bake vs thin-fetch decision: pilot should demonstrate the **pre-baked `/modals/`** path (fully static). If a live term fetch is retained instead, it becomes a small service dependency, avoid for the pilot.
- Directory must stay inline for SEO; do not lazy-load the term list.
