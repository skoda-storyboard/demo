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

## Human gate
Visual fidelity + live CORS/DAM delivery are not agent-handoffable (pixel judgment + live endpoint).
