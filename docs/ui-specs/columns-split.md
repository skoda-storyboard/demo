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
- **Charging (inside the SKODA-824 highlight panel, landed 2026-10-05):**
  - The panel now gives the row its 32px top padding and the 25px panel inset. The text cell content sits at x121, matching
    the source; it is 586 wide against 594.
  - Still open, in this block's own CSS: the source adds the widget's 15px inline margin inside *each* cell, which the
    panel inset can't reproduce. The image is 182 wide against 149.7 at 1440.
  - The cell's h2 takes the global 34/42.5 weight 600 with a 27px top margin, not the story prose 40/45 weight 300 with
    no top margin. The story heading rules cover default content only.

## 6. `centered` (equal rows of centred images, 2026-10-15)
- **Source:** an equal SiteOrigin row (50 | 50) whose every editor image is centred (`aligncenter`, a
  `figure.wp-caption.aligncenter` or a centred paragraph). Two kinds:
  - rider / interviewee cards (`/en/lifestyle/sports/cycling/miss-peaches-on-the-road-enduro-in-barcelona/`, `pg-…-4`):
    a caption figure (384px portrait, its `.wp-caption-text` name 600 and role 300, centred), then an Instagram icon
    and a centred handle line;
  - text | portrait rows (Sportline, Coca-Cola): a 200px portrait of an 800–1000px file, centred in its cell.
- **Measured live** (enduro, 1440 / 768 / 390): the split row's geometry (10px cell padding, the row 10px past the
  column, stacked at 780). Portraits 384 at x114 / x533 (1440) and x67 (768). The name sits directly under the portrait
  (+384) and the role 20px lower (+428). The icon is 20px further down, and the handle 20px after it.
- **EDS:** `Columns (centered[, portrait-NNN][, captioned])`. Each image cell is centred, its images at their own size
  capped at the cell. `portrait-NNN` sizes each card's first image. `captioned` puts the caption paragraphs right
  under it at weight 300.
- **Verified** against live via local code with the re-imported content (2026-10-15):
  - Enduro: portraits, names and roles match at 1440 / 768.
  - Sportline, Coca-Cola ×3, Karoq ×2: the images match at 1440 / 768 / 390.
- **Known differences:**
  - DA keeps no per-image width, so a card's later images come out at their file size. The Miss Peaches Instagram
    icons are 150 against the source's 116 / 122 (no smaller file exists), so the handle line sits 32px lower.
  - A centred or unequal row's own padding is carried since the #380 review (2026-10-19): `pad-T-R-B-L` from 781px
    and `pad-m-T-R-B-L` up to 780px, from the layout's `#pg-…> .panel-row-style` rules plus the theme's 32px top
    on a styled row from 781px (none after a highlight panel, whose runtime gap is that space; a stretched row keeps
    only its top / bottom, as SiteOrigin sets its sides). The Miss Peaches profile rows match live at 390 / 768 /
    1440: Enduro 340 at x25 on a phone, Skatepark / Whitewater / Downhill 300 at x45; the Millionth SUV rows stay
    370 at x10, as live. The gap above the row is still 10px less than live at every width (Millionth SUV 12px
    more at 1440).
- **Body images:** a story whose narrower body images are all centred gets the body Section Metadata style
  `centered-images`, and `styles.css` centres them. Example: the enduro 800px photos at x115 in the 819px column at
  1440, matching live. A body image shown narrower than its file still comes out at its file size: the 4×4 story's
  200px caption figure (384) and 719px image (819).
