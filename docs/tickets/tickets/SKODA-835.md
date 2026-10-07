# SKODA-835, Press-kit hub: size a lone download banner like its origin tile

- **Epic:** E08, Editorial at Scale
- **Type:** styling (`templates/press-kit/press-kit.css`)
- **GitHub issue:** [#279](https://github.com/skoda-storyboard/demo/issues/279)
- **Phase:** A · **Milestone:** M1
- **Origin:** SKODA-832 QA (2026-10-07, defect D2), deferred by the user when PR for SKODA-832 was opened as is
- **Status (2026-10-07):** 🔵 TODO

## Problem
`.section.press-kit-banners` lays its banners out with `repeat(auto-fit, minmax(min(100%, 25rem), 1fr))`, so a hub
with a single download banner stretches it across the whole content width. Measured against origin (SKODA-832 QA,
evidence `.migration/qa-832/compare.txt`):

| Hub(s) | Viewport | Origin | EDS |
|---|---|---|---|
| skoda-octavia-rs-and-octavia-scout, 4x4-winter-experience, skoda-rs-experience | 1440 | 292×292 | 1228×1228 |
| same | 992 | 228×228 | 972×972 |
| skoda-octavia-press-kit-2, press-kit-skoda-at-the-iaa-2019 | 1440 | 307×307 | 1228×1228 |
| skoda-octavia-press-kit (4:1 banner) | 1440 | 634×159 | 1228×307 |

On origin the download banner is a tile of the hub grid: a square takes a quarter column, a 4:1 banner a half.

## Scope
- CSS only: size a lone banner like its origin tile (square → one tile column of the 4-up hub grid, 4:1 → half),
  keyed on the banner's aspect, not on the page. Two-banner hubs (Albania, RS Driving Experience, Media Launch)
  already match origin and must not change.
- Banner gap to the tile grid: origin 20px, EDS 40px (SKODA-832 QA D7).
- No re-import or re-push: the content is already in DA (SKODA-832).

## Acceptance Criteria
- [ ] The 6 single-banner hubs match origin banner geometry (±2px) at 1440 / 992 / 768 / 375.
- [ ] The 3 two-banner hubs and the 8 other hubs are unchanged (measured).
- [ ] `npm run lint:css` passes; the guardrail self-check is done.

## Dependencies
SKODA-832 (hub content in DA). SKODA-805 (hub template).
