# SKODA-206, Škodapedia glossary block (directory + A–Z/category filter + term modal)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** ~~M1 (15 Oct demo)~~ **M2 (go-live)**, aligned to the board (GitHub #20) on 2026-09-25; not in the 43-URL M1 set
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

## Amendment (2026-10-22, M2 gap review §7.2)
Source: [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2, row "802 / 206": G-C-02
(Medium, was High, CONFIRMED), G-C-03 (Medium, CONFIRMED, browser-checked), G-C-04 (Medium, CONFIRMED), G-C-05 (Low,
CONFIRMED). The import side is SKODA-802a (split from SKODA-802's amendment). The in-body glossary spans (G-C-01)
are SKODA-849a; they link to the term's public path, so the term URLs (SKODA-206a) are their target.

**Added scope:**
- **The scope caveat above is stale** (G-C-02). D8's default is "Škodapedia stays in Storyboard (pre-baked terms)
  unless the client moves it out", and 802 and 1004a–c follow it: the content is migrated, 724 terms (EN 189, CS 189,
  DE 188, SK 158). This ticket is M2 build work, not a pattern proof. The row in
  `SKODA-CLIENT-REQUIREMENTS-MAPPING.md` ("continues outside Storyboard", marked aligned) needs the same fix.
- **Input to D8 for the client** (G-C-02): 131 of 189 EN terms were last modified in 2019 and the newest is from
  2025-01-02; the model facets still feature Rapid (50 terms) and Citigo e (35), 1 term is tagged Elroq, none Epiq or
  Peaq. Options: (a) migrate as is, (b) prune discontinued-model terms first, (c) retire with redirects. Answer (c)
  drops this ticket and 802 (about 10 SP) and changes 849a's link target.
- **One directory data model** (G-C-04). Three disagree today: this ticket (rows with letter + category tokens), ui-spec
  §7 (an index sheet `title, slug, letter, models[], categories[]` over `/modals/` docs, which have no index config)
  and `tools/importer/parsers/skodapedia.js` (letter + absolute live link only). Use the finding's recommendation:
  term docs with models and categories metadata, plus a skodapedia index sheet per locale, both generated by 802a. The
  block reads the sheet and filters on the letter, the 12 model tokens (the shared model taxonomy) and the 7 category
  tokens.
- Moved to SKODA-206a.
- **Filter permalinks** (G-C-03). The source's copy-link button and `replaceState` write
  `/{loc}/skodapedia/f/{models,categories}/`, and these return 200. The redirects sheet matches exact paths, so it
  can't cover them. Proposed: the block keeps filter state in an archive-side `?f=` query; record whether the old
  `/f/` subpaths are lost or handled by a CDN rule.
- **LIVE_ONLY** (G-C-04). `scripts/links.js:31` still sends `/en/skodapedia` to the live site, so links open the
  source. Drop it (and any locale archive) when the block ships.
- **Counts** (G-C-05). The "212 terms" above are 189 terms + 23 letter headings (the `.sp__list-directory__item`
  count). SK has 158 terms, not 159. The same numbers in the ui-spec and 1004c need the fix; the empty `/sr/` and
  `/sl/skodapedia` archives are a redirect decision for 1004d/e.

**Added acceptance criteria:**
- [ ] The scope caveat and the requirements-mapping row match D8's answer (G-C-02).
- [ ] The EN directory renders 189 terms under 23 letter headings from the EN skodapedia sheet; letter, model and
      category filters make no network request, and a model filter matches the source count (octavia 138, kamiq 90)
      (G-C-04, G-C-05).
- Moved to SKODA-206a.
- [ ] A filtered view is shared as a `?f=` URL that restores the filter; the `/f/` decision is recorded (G-C-03).
- [ ] `/en/skodapedia` is no longer in `LIVE_ONLY` (G-C-04).

**Estimate after the amendment:** 6 SP in total (was 5 SP), split as proposed:
- **SKODA-206** (3 SP · AI-assisted 1–2d / manual 2.5–3.5d, half of the 6 SP *(planning estimate, not a quote)*):
  directory and filters from the index sheet, the `?f=` state, the `LIVE_ONLY` change;
- **[SKODA-206a](SKODA-206a.md)** (3 SP): the accessible term modal and the standalone term page at the public path
  (dialog role, focus trap, Escape, return focus, URL update, self-canonical). The term-modal acceptance criterion
  above (`role=dialog`, focus-trap, Escape, return-focus) is carried by 206a.

**Added dependencies:** D8 (scope answer); SKODA-802a (index sheet) upstream; SKODA-1004d/e (SR and SL archives).
The term-page dependencies (802a term docs, 849a) moved to SKODA-206a.
