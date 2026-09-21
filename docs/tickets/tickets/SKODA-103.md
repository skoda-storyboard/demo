# SKODA-103 — Config sheets: placeholders, metadata, redirects (root)
- **Epic:** E01 — Foundation & Setup
- **Type:** setup
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

## Summary
Create the root config sheets — placeholders (UI strings), bulk metadata, and a redirects sheet — as DA/EW tabular data.

## Description
Externalizes UI strings, site-wide metadata defaults, and legacy URL redirects into Sheets, per `SKODA-EDS-DA-ARCHITECTURE.md` §4 (metadata + bulk-metadata), §9 (per-locale placeholders), and §11 (redirects sheet, Source/Destination). Placeholders back block UI strings (e.g. "Load more", "Search") that E04 listing/search consume; redirects carry the source's legacy + cross-locale rules and the known dead/loop URLs flagged in `SKODA-EN-BLOCK-INVENTORY.md` §5.

## Requirements / Spec
- **`placeholders` sheet** (`/docs/placeholders`): key/value UI strings; structured to extend per-locale later (E10). Seed pilot strings: `loadMore`, `search`, `noResults`, gallery/lightbox labels.
- **Bulk metadata** (`/docs/bulk-metadata`): path-pattern → default `title`/`description`/`image`/`robots`; site-wide defaults for the pilot section.
- **`redirects` sheet** at project root (`/docs/redirects`): columns `Source`, `Destination`. Migrate legacy + cross-locale redirects; add entries (or exclusions) for the 8 known dead/redirect-loop source URLs (2 redirect-loop PRs, 3 dead press-kits per inventory §5).
- All authored as DA Sheets (`/docs/authoring-tabular-data`) — **not** used for indexing (indexing is `helix-query.yaml`, SKODA-104).

## Acceptance Criteria
- [ ] `placeholders` sheet resolves and a block can read a placeholder string.
- [ ] Bulk-metadata defaults apply to a pilot page lacking explicit metadata.
- [ ] `redirects` sheet redirects a test Source path to its Destination on preview.
- [ ] The 8 known dead/loop URLs are triaged (redirected or documented as intentionally dropped).

## Dependencies
- Upstream: SKODA-102
- Downstream: SKODA-402/403 (placeholders), SKODA-603 (pilot metadata), SKODA-704 (visual/redirect checks)

## Risks / Flags
- Do not conflate sheets with indexing — spreadsheet indexing is unsupported in DA; these sheets are config only.
- Redirect-loop source URLs need content-owner input; flag rather than guess destinations.
