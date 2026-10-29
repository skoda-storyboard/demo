# Technical data from one sheet (SKODA-852)

Official vehicle figures live in one DA sheet, `/data/tech-data.json`. Documents link each figure to its
sheet row, and a check in DA's prepare menu compares the document with the sheet before publishing.

| File | What it is |
|---|---|
| `tech-data.js` | Shared contract: link format, figure parsing and comparison, sheet reader. Pure, no DOM. |
| `checks.js` | The five checks and the two fixes (update, link). Used by the plugin and the audit. |
| `preflight/` | **Tech data check**, a DA prepare-menu plugin. |
| `picker/` | **Tech data**, a DA library plugin that copies a linked value to paste into the text. |
| `da.js` | DA handshake, page source read/write, sheet loading for both plugins. |
| `audit.mjs` | `npm run tech-data:audit`: the same checks over published pages (read-only). |
| `tech-data.seed.json` | The sheet's first content, typed in from the official PDFs. Upload it to DA as `/data/tech-data.json`. |
| `../../scripts/tech-values.js` | On the page, a linked value reads as text (`<span class="tech-value">`). |

## A linked value

```html
<a href="/data/tech-data.json#peaq-90.range">647 km</a>
```

- The link text is the formatted value, so HTML, `.plain.html`, Markdown and crawlers keep it without JavaScript.
- The href records where the value comes from.
- The key is `<model>.<field>` for the figures a model page shows, and `<model>-<version>.<field>` for one
  version.

## The sheet

Two tabs:

- `values`: `key`, `model`, `version`, `field`, `value`, `unit`, `label` (vehicle name), `source` (PDF URL),
  `sourceDate`, `note`.
- `models`: `code`, `name`, `pages`, `tags`, `excludeTags`, `pdf`, `pdfDate`.
  - `pages`: comma-separated paths the model's figures apply to.
  - `tags`: every tag a page needs to be this model.
  - `excludeTags`: tags that rule it out.
  - A page's models are the ones listing its path; otherwise its metadata decides (`model`, `derivative`, `tags`),
    and the most specific match wins.
  - So a draft copy keeps its model:
    - `elroq, rs` is the Elroq RS;
    - `elroq, sportline` is none (the PDFs don't apply to Sportline).
  - The audit reads the tags from the rendered page's head (`model`, `article:tag`), because `.plain.html` has
    no metadata.

Fields: `power`, `torque`, `topSpeed`, `acceleration`, `boot`, `dcCharging`, `range`, `consumption`.

The model rows are what the model page's Technical Data grid shows: the min–max of the versions that page
covers. Sportline pages are not listed, because the PDFs say "Technical specifications do not apply for
Sportline cars". A page that matches no model gets its WLTP sentences checked against every model, but its grid isn't
checked.

## The checks

| Check | Issue | Review |
|---|---|---|
| Linked values | the link text differs from the sheet; the key isn't in the sheet | |
| Technical Data | a grid cell differs from the model's row; a linked cell links another row | a cell without a sheet row; a decimal comma |
| WLTP figures in the text | a WLTP-labelled range/consumption that isn't official ("936 km WLTP") | a rounded one ("more than 560 km") |

"Up to 577 km" passes when 577 is the top of an official interval, and "from 408 km" when 408 is its bottom.
| WLTP label | | a range/consumption cell or sentence without "WLTP" (drive, test and record sentences are skipped) |
| Values that could be linked | | an official value typed as text |

Figures compare by their numbers and unit: `458 - 646 km`, `458–646 km` and `458 – 646 km` are the same figure.
Metadata is not checked.

**Fixes** (inside DA only):
- **Update** rewrites stale links, and turns differing grid cells into links with the official value.
- **Link** turns matching grid cells and official WLTP figures in the text into links.

Each fix re-reads the source first and saves it with the author's token. Nothing is published.

A save guard refuses any fix that would change a block or format tag, or any text outside the values. Then nothing
is saved.

The check advises; it can't stop a publish. A hard stop would belong to the request-to-publish step (SKODA-850a).

## Setup in DA

- **Sheet:** upload `tech-data.seed.json` as `/data/tech-data.json`, then preview and publish it. The plugins read
  the DA source; the page and the audit read the published copy.
- **Site config `library` row:** title `Tech data`, path
  `https://main--demo--skoda-storyboard.aem.page/tools/tech-data/picker/picker.html`.
- **Site config `prepare` row:** title `Tech data check`, path
  `https://main--demo--skoda-storyboard.aem.page/tools/tech-data/preflight/preflight.html`.
  - DA merges prepare rows by title, so this adds a menu item, and the built-in **Preflight** stays.
  - Only a row titled `Preflight` would replace it (`da-live` `blocks/edit/da-prepare/da-prepare.js`, `loadMenu`).

## Without DA

- **Check a published page:** `/tools/tech-data/preflight/preflight.html?path=/en/skoda-model/peaq`.
  - Add `&sheet=/tools/tech-data/tech-data.seed.json` until the DA sheet is published.
- **Picker:** `/tools/tech-data/picker/picker.html`. **Copy** puts the linked value on the clipboard as HTML.
  - Paste it where it belongs: the editor parses a paste inline, so the sentence stays one paragraph.
  - DA's library inserts `sendHTML` as a closed block (`da-library.js`: `new Slice(parsed.content, 0, 0)`), which
    split the sentence into three paragraphs. So the picker doesn't use it.
  - For Technical Data cells, the check's **Update** and **Link** are quicker.

```sh
npm run tech-data:audit -- --sheet tools/tech-data/tech-data.seed.json --sitemap /en/skoda-model/
node --test tools/tech-data/ scripts/tech-values.test.mjs
```

## Updating the sheet

When a PDF changes:
1. Edit its rows in DA, with the new `sourceDate`.
2. Preview and publish the sheet.
3. Run the audit, and open each listed page's **Tech data check** → **Update**.
