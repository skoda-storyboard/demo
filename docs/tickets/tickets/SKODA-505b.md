# SKODA-505b, Media-cart presentation + live AEM DAM delivery wiring
- **Epic:** E05, Media Pipeline
- **Type:** block (presentation layer) · **Phase:** A · **Pilot:** Yes · **Milestone:** M1
- **Estimate:** ~3 SP (presentation half of the former SKODA-505)
- **Split from:** SKODA-505 (paired with SKODA-505a, the download logic).
- **Flag:** 🔴 human-gate

## Summary
The visual and live-delivery half of the media cart: pixel design per `docs/ui-specs/media-cart.md` and the live CORS / AEM DAM delivery-URL wiring that feeds SKODA-505a.

## Requirements / Spec (from ui-specs/media-cart.md)
- Add affordance = round 40x40 `+` button; added state = `.in-cart` scrim + centered glyph.
- Header cart badge = red #ff6666 24px circle showing count, hidden at 0.
- Cart surface = "Your downloads" review page (confirm page vs drawer for EDS).
- New tokens: `--cart-badge-bg:#ff6666`, `--cart-added-scrim`, `--cart-dropdown-shadow`.
- Add a visible item/size-cap indicator (source has none).
- Wire cart items to CORS-enabled AEM DAM delivery URLs (dep 501/504).

## Acceptance Criteria
- [ ] Matches the measured spec at the captured breakpoints (visual review, human gate).
- [ ] Live cart fetches DAM originals via CORS; single + multi-select downloads work end to end.
- [ ] Controls keyboard-operable and screen-reader labelled; block not in the eager phase.

## Dependencies
- Upstream: SKODA-505a (download logic), SKODA-501 + SKODA-504 (CORS-enabled DAM delivery).
- Downstream: SKODA-603.

## Handoff from SKODA-505a (#50)
505a ships the behaviour. 505b renders the pixels and the new surfaces, and calls the API; it builds no second store.
- **API** (`/scripts/media-cart.js`): `getCart`, `add`, `addMany`, `remove`, `has`, `clear`, `onChange`, `download({ onProgress, signal })`, `downloadItems`, `trackView`, `bindCartControl`. See [SKODA-505a](SKODA-505a.md#implementation-2026-09-30-developer-verified-qa-pending).
- **State to style:** bound controls carry `data-in-cart`, plus `aria-pressed` (buttons) or `aria-checked` (size-menu rows); unavailable controls get `aria-disabled="true"`. The `.in-cart` scrim/glyph hangs off these; no class is set.
- **New buttons** (Downloads tiles, media-box group add, press-release sidebar, dock badge): call `bindCartControl(el, { href, title })` for a single asset, or `addMany(entries)` for a group. Refusals return `skipped[{ href, reason }]`, which feeds the "added X / skipped Y" popup and the cap indicator. Bound controls also fire a bubbling `media-cart:refused` event.
- **Badge:** `onChange((cart) => cart.count)`, or listen for `media-cart:change` on `window`.
- **Review surface:** `getCart().items` (`title`, `filename`, `bytes`, `kind`, `url`), `remove(id)`, and `download()` for single or zip; call `trackView()` on open.
- **Still open for 505b:**
  - Prove live CORS zipping from the preview (the DAM answers `Access-Control-Allow-Origin: *`).
  - Pick the Original/1920px menu visuals. The 1920px row stays inert (originals only, D5).
  - Design the gallery-lightbox add, which is disabled until content carries the original.

## Human gate
Visual fidelity + live CORS/DAM delivery are not agent-handoffable (pixel judgment + live endpoint).
