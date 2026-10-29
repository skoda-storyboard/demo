# Technical data from one sheet (SKODA-852)

Official vehicle figures live in one DA sheet, `/data/tech-data.json`. Documents can link each figure to its
sheet row. The **Tech data check** compares the document with the sheet before publishing:
- the linked values;
- the Technical Data grid;
- every technical claim in the running text, including the metadata Title and Description.

| File | What it is |
|---|---|
| `tech-data.js` | Shared contract: link format, figure parsing, sheet reader (values, models, records), page metadata, page → model. Pure, no DOM. |
| `claims.js` | Technical claims in running text: number + unit, field, qualifier, measured or capability, model and version scope, verdict. Pure. |
| `checks.js` | The five checks and the two fixes (update, link), with the save guard. Used by the plugins and the audit. |
| `preflight/` | **Tech data check**: prepare-menu dialog (saved source, fixes) and Canvas side panel (live document, read-only). |
| `picker/` | **Tech data**, a DA library plugin that copies a linked value to paste into the text. |
| `da.js` | DA handshake, page source read/write, sheet loading for both plugins. |
| `audit.mjs` | `npm run tech-data:audit`: the same checks over published pages or DA documents (read-only). |
| `build-seed.mjs` | Writes `tech-data.seed.json` from the hand-checked official figures, with source, date, confidence and limitations per row. |
| `tech-data.seed.json` | The sheet's content as uploaded to DA (`/data/tech-data.json`, 2026-10-29). |
| `../../scripts/tech-values.js` | On the page, a linked value reads as text and keeps its key. |

## A linked value

```html
<a href="/data/tech-data.json#peaq-90.range">647 km</a>
```

- The link text is the formatted value, so HTML, `.plain.html`, Markdown and crawlers keep it without JavaScript.
- The href records where the value comes from.
- The key is:
  - `<model>.<field>` for the figures a model page shows;
  - `<model>-<version>.<field>` for one version;
  - `<model>-<configuration>.<field>` for one configuration (`peaq-7seat.boot`).

## The sheet

Three tabs.

- `values`: `key`, `model`, `version`, `configuration`, `field`, `value`, `unit`, `label` (vehicle name),
  `source` (URL), `sourceDate`, `confidence`, `limitations`, `note`.
  - `confidence`:
    - `official TD PDF`: the per-version figure as printed;
    - `derived from TD PDF`: the min–max of the versions a model page covers, which is what its grid shows;
    - `official story` / `official press release`: only where the TD PDF has no such figure (the Peaq display).
  - `limitations` says what the source does not settle. Examples: the PDF doesn't apply to Sportline; towing
    1800 / 2000 kg is printed without per-version columns.
- `models`: `code`, `name`, `pages`, `tags`, `excludeTags`, `pdf`, `pdfDate`.
  - A page's models are the ones listing its path. Otherwise its metadata decides (`model`, `derivative`, `tags`):
    every model tag must be present and no excluded tag. The most specific match wins.
  - So `elroq, rs` is the Elroq RS, and `elroq, sportline` is none.
- `records`: measured results that are **not** capability figures. Columns: `model`, `version`, `configuration`,
  `field`, `value`, `unit`, `label`, `conditions`, `source`, `sourceDate`, `confidence`.
  - Today: the Peaq 90 record drive, 936 km at 9.2 kWh/100 km (press release, 2. 9. 2026).

Fields:
- the grid: `power`, `torque`, `topSpeed`, `acceleration`, `boot`, `dcCharging` (time), `range`, `consumption`;
- Peaq only, so far: `batteryGross`, `batteryNet`, `dcChargingPower`, `acChargingPower`, `bootThirdRow`,
  `bootFolded`, `towing`, `seats`, `seatRows`, `display`, `co2`.

The other six models only have the grid fields, so their other claims come out as "needs review".

Nothing is inferred. Where the PDF prints fewer columns than versions and doesn't say which value is which, there is
no version row; the RS top speed and DC charging are examples. Claims about those figures need review.

## The checks

| Check | Issue | Review |
|---|---|---|
| Linked values | the text differs from the sheet; the key isn't in the sheet; the row is another model's and the paragraph doesn't name it | |
| Technical Data | a grid cell differs from the model's row; a linked cell links another row | a cell without a sheet row; a decimal comma |
| Technical claims in the text | a claim contradicts the official rows of the model and version it is about | see below |
| WLTP label | | a range or consumption cell, link or capability sentence without "WLTP" |
| Values that could be linked | | an official value typed as text (grid cells, WLTP sentences) |

**Technical claims in the text** (`claims.js`): every number with a vehicle unit, in every sentence and in the
metadata Title and Description.
- **Units:** km, kWh, kW, kWh/100 km, l/100 km, g/km, km/h, l, kg / t, inch, min, s and seats. It also reads
  number words ("seven-seat", "three rows of seats", "six trim levels") and platform names ("MEB+ platform").
  Hyphenated forms ("765-litre", "32-inch", "210-kW") and thousands separators ("1,690") count.
- **The field** comes from the unit and the nearest words:
  - kW next to DC/AC/wallbox is charging power, next to power/output/motor it's power;
  - litres near boot/luggage are the boot, and "folded" or "third row" in the clause picks the boot variant;
  - kg near "tow" is towing;
  - inches near display/screen are the display (wheels are not).
- **Not claims:** km without range words in its own clause is a distance ("280 kilometres away"). Percentages,
  the 0–100 km/h phrase, numbers in URLs and differences ("exceeded … by 289 km") are skipped.
- **Measured or capability:** the clause decides.
  - A completed-drive verb ("covered", "averaging") or a record sentence, with no capability word ("up to", "can",
    "offers", "WLTP", "maximum") in the clause, is a measured result. It's checked against `records`.
  - "Trip" or "record" elsewhere never turns "offers up to 936 km" into a measurement.
- **Scope:** the model and version the sentence names ("Peaq 60", "the 90 variant"), else the page's models.
  - A page without a model is never compared with other models' figures.
  - These need review: a sentence that names two models, a Sportline sentence, or one about another variant
    ("the Coupé version" on the RS page).
- **Units:** a claim is only compared with rows in the same unit. "15.0 l/100 km" is never checked against
  15.0 kWh/100 km: it needs review. A record must match the unit too.
- **Seat configuration:** "five-seater", "7-seat" and the like in the sentence limit configuration-specific rows
  (the Peaq boot: 5-seater 935 l, 7-seater 890 l).
  - A figure that matches only one configuration's row, in a sentence that names no configuration, needs review.
  - Notes and limitations are never read as configurations.
- **Counts:** "6 trim levels" and "3 rows of seats" are read like "six" and "three".
- **Compartments:** a storage compartment, glovebox, tray or front storage is not the boot; it needs review. A
  "luggage compartment" is the boot.
- **Linked values in prose** are claims too, checked in their sentence. The link must be one of the rows the
  figure matches there (model, version, configuration, field, unit), and a measured result must not link to an
  official figure. A link never makes a figure pass that the text alone wouldn't.
- **Qualifiers:**
  - "up to N": N must be the top of an official figure;
  - "from N": the bottom;
  - "around N": a match, or a Review if rounded;
  - "more than N": a Review if true, an Issue if it overstates.
- **Verdict:**
  - **ok:** it matches an official row, or a record.
  - **Issue:** it differs. The official figures are listed with source and date, plus a note when the number
    is a record ("936 km is the Peaq 90 record drive, a measured result, not the car's WLTP range").
  - **Review:** rounded; measured but not in the records; no reference data for that field; no model; ambiguous;
    Sportline; another variant; inside a model-level min–max with no per-version figure to confirm it.

**Fixes** (prepare-menu dialog only):
- **Update** rewrites stale links, and turns differing grid cells into links with the official value.
- **Link** turns matching grid cells into links. In the text it links only figures the claims check verified:
  status ok, an official figure of the sentence's model, version and configuration in the same unit, and a row
  that is exactly that figure. Issues, Reviews, rounded figures and "up to" a min–max are never linked.
- Prose claims are never corrected automatically.
- Each fix re-reads the source first and saves it with the author's token. Nothing is published.
- A save guard refuses any fix that would change a block or format tag, or any text outside the values.

The check advises; it can't stop a publish. A hard stop would belong to the request-to-publish step (SKODA-850a).

## In DA and Canvas

Set up on 2026-10-29. Backups of the site config before and after are kept locally (`.migration/852/da/`), not in
the repo.

- **Sheet:** `/data/tech-data.json`, uploaded from `tech-data.seed.json`, previewed and published. The plugins read
  the DA source; pages and the audit read the published copy.
- **Site config `prepare` row:** `Tech data check` → `…/tools/tech-data/preflight/preflight.html`.
  - It shows in the prepare menu of the classic editor and of Canvas. Canvas needs a code branch for path-based
    items.
  - It opens as a dialog that checks the **saved** source and offers the fixes.
  - DA merges prepare rows by title. Canvas also drops any row titled `Preflight`, so this one has its own title.
- **Site config `library` rows:**
  - `Tech data` → `…/picker/picker.html`.
  - `Tech data check` → `…/preflight/preflight.html`. In Canvas a library row is a side panel, and the host
    offers the live document (`capabilities.liveDocument`). The panel re-checks as the author types, unsaved
    edits included, read-only.
- **Canvas's built-in Preflight panel** can't run this check.
  - It posts the preview URL to Adobe's Experience Governance service (`experience-context.adobe.io`,
    `da-live` `blocks/canvas/ew-preflight/api.js`) and shows the built-in, text, image and "site-code" checks
    that service returns.
  - There is no public contract for a site to add a check there, so Tech data check runs next to it, not inside
    it.

The rows point at `main`, so they run the code merged there. A change takes effect in DA once it is merged.

## Without DA

- **Check a published page:** `/tools/tech-data/preflight/preflight.html?path=/en/skoda-model/peaq`.
- **Picker:** `/tools/tech-data/picker/picker.html`. **Copy** puts the linked value on the clipboard as HTML.
  - Paste it where it belongs: the editor parses a paste inline, so the sentence stays one paragraph.
  - DA's library inserts `sendHTML` as a closed block (`da-library.js`: `new Slice(parsed.content, 0, 0)`), which
    split the sentence into three paragraphs. So the picker doesn't use it.
  - For Technical Data cells, the check's **Update** and **Link** are quicker.

```sh
npm run tech-data:audit -- --sitemap /en/skoda-model/            # published pages
npm run tech-data:audit -- --source da /en/skoda-world/<slug>    # a DA document, unpublished too
node --test tools/tech-data/ scripts/tech-values.test.mjs
```

## Updating the sheet

When a source changes:
1. Edit `build-seed.mjs`, with the new date and source.
2. Run `node tools/tech-data/build-seed.mjs`.
3. Replace the DA sheet's rows (DA keeps versions).
4. Preview and publish the sheet.
5. Run the audit.

Adding a model or field means adding rows, plus a `models` row for a new model; the code needs no change unless
a new unit appears.
