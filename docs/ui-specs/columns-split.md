# Component Spec: Columns `split-NN` (unequal 2-cell story rows)

Status: **CAPTURED** (2026-10-01, Playwright computed boxes on the live site; SKODA-225, issue #142).
Contract: `columns-split` v2 in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../planning/SKODA-PENDING-BLOCK-CONTRACTS.md).

## 1. Identity
- **Component:** a SiteOrigin row with two unequal cells in a story body: quote text | a portrait card (picture, name,
  role), or text | an image.
- **EDS:** `Columns (split-NN)` / `Columns (split-NN, portrait-NNN)`, a variant of `blocks/columns`.
- **Source references:**
  - `/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling/` (`pg-449201-2`);
  - `/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague/` (`pg-448566-2`);
  - `/en/emobility/meet-the-peaq-comfort-just-like-at-home/` (`pg-448531-1`);
  - `/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones/` (`pg-447920-1`, inside a highlight panel).

## 2. Source anatomy
- `.panel-grid` (flex row, `align-items: flex-start`) › two `.panel-grid-cell`s, each `padding: 10px`.
- The cell widths sit in the page head CSS: `#pgc-449201-2-0 { width:61.8% }` / `38.2%`; charging `75%` / `25%`.
- **Portrait cell** (graffiti, Kylaq, Peaq):
  - a `skoda-offset` spacer widget (`padding-top: 1em`; 0px tall on phones), then a `sow-editor`;
  - the editor holds `<p style="text-align:center"><img width="235" height="235">` (the file is 500×500),
    `<strong><span font-size:small>Name<br></span></strong><span font-size:10pt>Role</span></p>`.
- **Charging image cell:** a `sow-image` (`width="1366"` = the file, `srcset` up to 1366w) inside a 15px
  `panel-cell-style`, with the widget margin `0 10px 0 0`.

## 3. Measured visual spec (live)
| Width | Row | Cell 1 / cell 2 | Portrait (graffiti-type) | Charging image |
|---|---|---|---|---|
| 1440 / 1280 | 838.7 (10px past the 819 text column each side) | 518.3 / 320.4 | 235×235, centred (+42.7 in its cell) | 149.7×224.4 (cell − 60) |
| 1080 | 726.7 | 449.1 / 277.6 | 235, +21.3 | 121.7 |
| 1024 / 992 | 689.3 / 668 | 426 / 263.3 · 412.8 / 255.2 | 235, +14.2 / +10.1 | 112.3 / 107 |
| 800 / 781 | 540 / 527.3 | 333.7 / 206.3 · 325.9 / 201.4 | 186.3 / 181.4 (capped at the cell) | 75 / 71.8 |
| **780** and below | stacked (`flex-direction: column`), text first | full width | 235, centred (+70 @375) | fills the cell (330×495 @390) |

- **Caption:** name 13px / 19.5 weight 600 (`#0a0a0a`) and role 13.33px weight 400. Each sits on a 24px line (the paragraph's
  16/24 strut); the card ends with the paragraph's 20px margin. Portrait cell height: 323px at every width.
- **Charging:** the row is inside the dark highlight panel (`#0e3a2f`, 32px top padding); both cells' content is inset
  25px (the panel's 15px + the cell's 10px).

## 4. EDS implementation
- **Importer** (`parsers/story-flatten.js`, `import-story-detail.js` `preprocess`):
  - `markCellWidths()` tags the cells from the head CSS;
  - two unequal cells emit `Columns (split-NN)`, NN = the first cell's share, rounded;
  - `portrait-NNN` is added when the row's single image has an authored `width` below its file width.
- **Block** (`blocks/columns`):
  - `decorateSplit()` sets `--columns-split` / `--columns-portrait` and tags the image cell `columns-portrait`;
  - `.columns.split`: 10px cell padding and −10px inline margin, top alignment, side by side from 781, source order
    when stacked;
  - the image `min(--columns-portrait, 100%)` centred, or the full cell;
  - name 13 / 19.5 600, role 10pt, 24px lines, 20px after the card.

## 5. Known differences (not part of the variant)
- **Spacing the importer removes on every story (SKODA-801):**
  - the desktop spacer widgets (`skoda-offset`): the portrait sits 24px higher (y10 vs y34) at ≥781;
  - whitespace-only lines (graffiti's leading `&nbsp;&nbsp;<br>`, Peaq's empty `<p>&nbsp; &nbsp;</p>`): stacked, the
    second cell starts 24 / 44px earlier.
- **Charging:** the panel's 32px top and 15px inner padding are SKODA-824's runtime half (still TODO). Until then the
  image fills the cell (189.7 vs 149.7 @1440).
