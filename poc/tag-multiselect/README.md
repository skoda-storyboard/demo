# Multi-select tag picker for DA / Experience Workspace (no App Builder)

Productionized from the `skoda-storyboard` PoC for **SKODA-211 / issue #54**.

## What this is

A **DA library plugin**: a plain hosted static page (`index.html` + `tag-picker.js` +
`tag-picker.css`) registered in a `library` config sheet. It talks to the editor over the
`DA_SDK` postMessage bridge, renders an **authorable** tag vocabulary as a multi-select
(grouped by facet), and on Insert writes a `Tags` block into the document via
`actions.sendHTML()`. No App Builder, no Adobe Developer Console.

This is authoring only, not a rendered end-user block. See
`docs/architecture/SKODA-DA-EW-EXTENSIBILITY.md` for the extensibility rationale (this is
"rung 4" of that ladder) and the D13 (DA/EW vs Universal Editor) tie-in.

> **Note:** demo does not yet ship the `tags` render block (SKODA-205 / SKODA-401). The
> plugin inserts the correct block markup, but it won't visually render as pills in demo
> until that block lands. The emitted markup is pinned by `test.mjs`.

## The tags are authorable (governed DA Sheet)

The vocabulary is **not** hardcoded. The picker fetches it at runtime from a DA Sheet the
client governs, so tags can be added or renamed with **no code change**:

- **Sheet:** `https://da.live/sheet#/skoda-storyboard/demo/config/tags` (served as JSON at
  `/config/tags.json`). `TAGS_SHEET` in `tag-picker.js` points at it.
- **Columns:** `taxonomy`, `slug`, `label`. One row per tag.
  - `taxonomy` = one of the 15 facets (SKODA-401): `model, bodywork, derivative, motorsport,
    equipment, technology, years, view, company, concept, environment, happening, history,
    sponsorship, vip`.
  - `slug` = the value within that facet.
  - `label` = the display text (and the visible pill text).
- **Emitted href:** `/en/tag/<taxonomy>/<slug>/` (e.g. `model`/`epiq` → `/en/tag/model/epiq/`),
  the two-segment tag-archive pattern from `docs/ui-specs/tags.md` (SKODA-205, §3/§7).
- **Fallback:** if the sheet can't be fetched (offline / restricted / not yet published), the
  picker uses the small built-in list in `fallback-tags.js` so it always works.

The sheet is seeded with a representative starter set (a few models, bodywork, years, etc.).
The client owns and extends it from there. To restrict the sheet (author-only), the picker
sends the SDK `token` as a bearer header; a restricted sheet needs the render-after-connect
variant (load the vocabulary after the DA handshake) instead of the current render-first path.

## Files

- `index.html`, the plugin page the `library` sheet points at.
- `tag-picker.js`, connects to `DA_SDK`, fetches the governed sheet, renders the grouped
  multi-select, writes back a `Tags` block.
- `tags-block.js`, `buildTagsBlockHTML(tags)`, the emitted-markup contract (extracted so it
  is unit-testable in node).
- `fallback-tags.js`, the offline fallback vocabulary (`{ taxonomy, slug, label }`).
- `tag-picker.css`, palette styling (self-contained, no repo tokens).
- `test.mjs`, node smoke test for the emitted markup (`npm test`).

## Wire it up in the DA/EW tenant

Two tenant steps remain (both need the client's DA auth, so they aren't done from the repo):

1. **Publish the vocabulary sheet.** Open `https://da.live/sheet#/skoda-storyboard/demo/config/tags`
   and Preview + Publish it (sidekick), so it's served at
   `https://main--demo--skoda-storyboard.aem.page/config/tags.json`. Until then the picker uses
   `fallback-tags.js`. (The sheet source is already created in DA.)
2. **Register the plugin.** Host the plugin (merge/push so it serves at the demo preview URL),
   then in the site's DA config (`da.live/config#/skoda-storyboard/demo/`) add a sheet named
   `library` with a row:

   | title | path | experience |
   |---|---|---|
   | Tag picker | `https://main--demo--skoda-storyboard.aem.page/poc/tag-multiselect/index.html` | dialog |

   Get the `path` header name exactly right: DA's loader runs `row.path.split(',')`, so a
   missing/misnamed `path` column throws and breaks the entire Library.
3. **Use it.** Open a document, launch **Tag picker** from the Library palette (classic DA
   editor) or the right-hand canvas panel (Experience Workspace), tick tags across facets, and
   hit **Insert**. A `Tags` block lands in the doc.

## Smoke tests

- `npm test` (from the demo repo root) runs `test.mjs` and pins the emitted Tags-block markup.
- Opening `index.html` directly (or via `npx -y @adobe/aem-cli up` then
  `/poc/tag-multiselect/index.html`) renders the multi-select standalone with the fallback
  vocabulary. The `DA_SDK` import fails gracefully outside DA, so Insert is disabled and the
  help text says "Preview only".
