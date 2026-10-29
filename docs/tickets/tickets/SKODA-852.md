# SKODA-852, Technical data from one sheet: linked values, a picker and Preflight checks against the official figures

- **Epic:** E08, Editorial at Scale
- **Type:** DA editor plugins (library + Preflight) + a shared rules script + a command-line audit + a DA sheet
- **Phase:** B · **Milestone:** stakeholder demo (date OPEN), then M2 if the client wants it. Not a go-live
  blocker.
- **Estimate:** 5 SP · AI-assisted 4–5d / manual 7–9d, excluding the client's data-owner answer *(planning
  estimate, not a quote)*. Demo cut (sheet, rules, Preflight, audit, page script; picker after): ≈3d AI-assisted.
- **GitHub issue:** [#544](https://github.com/skoda-storyboard/demo/issues/544) (created 2026-10-28)
- **Status (2026-10-29):** 🟡 PR #546 merged (`1c0652b`).
  - Round 2 is on branch `skoda-852-claims`, not pushed: prose claims and Canvas.
  - DA setup done 2026-10-29:
    - sheet `/data/tech-data.json` uploaded, previewed and published;
    - site config: `prepare` row `Tech data check`, and `library` rows `Tech data` and `Tech data check`.
  - Source of the findings: a read-only audit of the 23 live model pages against their own technical-data PDFs
    (below).
  - Developer notes: [Delivered](#delivered-2026-10-29) and [Round 2](#round-2-2026-10-29-prose-claims-and-canvas).

## Why
Model pages, press releases and stories repeat the same vehicle figures (range, power, speed, acceleration, boot,
charging) as typed text. Nothing ties them to the official figures, so they drift, and the migration copies the
drift. The audit (2026-10-28) compared each model page's Technical Data **Range** cell with the "Range (WLTP)" row
of the PDF the same page links (`TD-<model>-en_….pdf`). 9 of 23 model pages have a Range cell; 3 differ:

| Page | Range cell (demo) | Source page today | PDF "Range (WLTP)" [km] (PDF date) |
|---|---|---|---|
| `/en/skoda-model/peaq` | 458 - 646 km | 458 - 646 km | Peaq 60 / 90 / 90x: 459 / **647** / 613 (21. 9. 2026) |
| `/en/skoda-model/elroq` | **403** - 577 km | 408 – 577 km | 60 / 85 / 85x / RS: 408-453 / 524-577 / 524-577 / 516-554 (23. 4. 2026) |
| `/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv` | 439 – **572** km | 439 – 572 km | 60 / 85 / 85x / RS: 439-463 / 561-**593** / 561-593 / 528-572 (23. 4. 2026) |

- **Peaq:** the page states the range three ways: "more than 640 km" (intro), "458 - 646 km" (grid) and, via its
  PDF, 647 km. The record release (2026-09-02) says "The Škoda Peaq 90 has a homologated WLTP range of up to
  647 km".
- **Elroq:** the source was corrected after our import; our migrated copy is stale.
- **Enyaq Coupé:** inherited from the source. Which figure is right needs the owner.
- The other 6 EV pages match. A derivative page (RS, Sportline) shows its own version's column, so a check must
  compare by version, not the whole PDF's min–max (the first audit pass reported RS and Epiq as false positives).
- No Range cell carries a "WLTP" label.

The audit says only that the page and its PDF disagree. It doesn't say which is correct; that's Škoda's call
(open question 1).

The raw audit output and scripts are kept locally by the migration team (not committed).

## Design
The pattern: values in a sheet, linked from the text, checked before publishing.

1. **Sheet** `/data/tech-data.json` in DA, two tabs.
   - `values`: `key` (`peaq-90.range`), `model`, `version`, `field`, `value`, `unit`, `label`, `source` (the PDF
     asset path), `sourceDate`. Model-level ranges (`peaq.range` = `459 – 647 km`, the grid's min–max) are rows too,
     marked as derived from the PDF.
   - `models`: `code`, `name`, `path` (model and derivative pages), `versions`, `pdf`.
   - Demo: Peaq, Elroq and Enyaq Coupé values typed in from their PDFs. Later: whatever source the client names.
   - The sheet must be published, like every DA sheet the site reads.
2. **Linked values.** A value in a document is a link whose text is the formatted value and whose href is the row:
   `<a href="/data/tech-data.json#peaq-90.range">647 km</a>`. HTML, `.plain.html`, Markdown and crawlers keep the
   value without JavaScript, and the href records where it came from.
3. **Page script.** `scripts.js` (not `aem.js`) turns these links into `<span class="tech-value" data-key>` so they
   read as text, not links.
4. **Shared rules** `scripts/tech-data.js`, pure string functions with no DOM, used by the plugins, the page script,
   the audit and the tests: parse a link, build a link, read the sheet, find linked values, compare, rewrite stale
   links, find values typed as plain text.
5. **Preflight plugin** `tools/tech-data/preflight/`. It reads the current DA source and lists, per check, Pass /
   Review / Issue:

   | Check | Level | Example |
   |---|---|---|
   | A linked value differs from the sheet | Issue, with "Update N values" | link text `646 km`, sheet `647 km` |
   | A link points to a row the sheet doesn't have | Issue | `#peaq-95.range` |
   | A Technical Data cell differs from the model's row (label → field: Range, Maximum performance, Maximum speed, Acceleration, Boot capacity, Charging time, Maximum torque) | Issue, with the expected value and its PDF + date | Peaq "458 - 646 km" → "459 – 647 km (TD-Peaq-en, 21. 9. 2026)" |
   | A number labelled WLTP that isn't a sheet value for the page's model | Issue | "936 km WLTP" fails; the 936 km **record**, not labelled WLTP, passes |
   | Range or consumption shown without "WLTP" | Review (the rule itself is for Škoda legal to confirm) | the grid's "Range" |
   | A typed value that matches a sheet value | Review: "could be linked" | "647 km" in prose |

   The page's model comes from the `models` tab by path, or from the page's model tags. Comparisons ignore
   whitespace and hyphen/en-dash differences.
6. **Picker** `tools/tech-data/picker/`, a library plugin next to the existing Tag picker: choose a model and a
   version, click a value, and it is inserted as a linked value.
7. **Audit** `tools/tech-data/audit.mjs`. The same rules over the live `.plain.html` of every page, as a report (this
   ticket's table, made repeatable). It catches pages that go stale after import, like Elroq.

**Not a publish gate.** DA's Preflight advises; it doesn't stop a publish. A hard stop would belong to the
request-to-publish step (SKODA-850a).

## Scope
- The sheet with the three demo models, `scripts/tech-data.js` + unit tests, the Preflight plugin, the audit, the
  page script + its CSS, and the picker.
- DA changes, each only with the user's go-ahead: upload + publish the sheet; a picker row in the site config's
  `library` sheet; a `prepare` row for Preflight.
- **Preflight hook-up, tested on a branch first.** The `prepare` row replaces DA's built-in Preflight for the whole
  site, and the config is site-wide even when the row points at a branch build. Before the row stays: list what the
  built-in Preflight checks, register the branch build for a test window, then decide.
- **Demo on draft copies only:** copy the Peaq model page and the record release under `/drafts/tech-data/`; run
  Preflight, update with one click, preview; type "936 km WLTP" on the draft and show the Issue. The live pages stay as
  migrated until Škoda confirms the values.

## Not in scope
- Correcting the live model pages: that needs the owner's answer, then a content change per page.
- Other locales: one sheet per locale, with local number formatting (`647 km` vs a decimal comma), once the client
  says which locales carry technical data.
- Key Facts cards, PDFs and images: only text values are checked.
- A product-data feed or connector: open question 2.

## Acceptance criteria
- [ ] `/data/tech-data.json` holds every Technical Data value of Peaq, Elroq and Enyaq Coupé, each row with its PDF
  and date. *The seed (`tools/tech-data/tech-data.seed.json`, 7 models) has them; the DA upload waits for a go-ahead.*
- [ ] On the Peaq draft, Preflight shows an Issue for the Range cell with "459 – 647 km" and the PDF date; "Update"
  rewrites it, and Preflight then passes. *Unit-tested on the DA markup; the draft waits for a go-ahead.*
- [ ] On the record-release draft, the linked 647 km passes, the 936 km record passes, and an added "936 km WLTP"
  is an Issue. *Unit-tested; the draft waits for a go-ahead.*
- [x] The audit run over all 23 model pages reports exactly the three differences above (or explains any change),
  and no RS/Sportline/Epiq false positives.
- [ ] Linked values render as text on `.aem.page`; `.plain.html` keeps the link. *`scripts/tech-values.js` is unit-tested
  and loads cleanly on the branch; no page has a linked value until the drafts exist.*
- [x] Unit tests for every rule; `npm run lint` passes.
- [x] The built-in Preflight's checks are listed, and the decision on the `prepare` row is recorded. *No replacement is
  needed (see Delivered).*

## Delivered (2026-10-29)
Branch `skoda-852-tech-data`. Files and setup are in `tools/tech-data/README.md`.

- **The `prepare` row doesn't replace the built-in Preflight.**
  - DA builds the prepare menu from the built-in actions, then org rows, then site rows, merged **by title**
    (`da-live` `blocks/edit/da-prepare/da-prepare.js`, `loadMenu`).
  - A row titled **Tech data check** adds a menu item. Only a row titled `Preflight` would replace the built-in one.
  - So the branch test window is no longer needed to protect Preflight. The row is still site-wide.
- **Deviations from the design above:**
  - The rules live in `tools/tech-data/tech-data.js` and `checks.js`, not `scripts/tech-data.js`, so pages
    don't load them.
  - The page needs only `scripts/tech-values.js` (28 lines, no CSS: the span inherits the cell's style).
  - The seed covers 7 model pages, not 3: Peaq, Elroq, Elroq RS, Enyaq, Enyaq RS, Enyaq Coupé, Epiq. This makes the
    23-page audit meaningful. Sportline pages stay unlisted: the PDFs say "Technical specifications do not apply for
    Sportline cars".
  - No torque row: none of the PDFs has torque, so the Elroq torque cells are a Review ("no official value").
- **Two more checks than the design table:**
  - Range sentences without "WLTP", skipping drive, test and record sentences, so the 936 km record is never asked
    to say WLTP.
  - Decimal commas ("5,4 s" on the Elroq RS and Enyaq RS pages).
- **Audit, 2026-10-29:**
  - The run: `npm run tech-data:audit -- --sheet tools/tech-data/tech-data.seed.json --sitemap /en/skoda-model/`,
    over 25 pages.
  - **Issues:** exactly the three Range cells above.
  - **Reviews** (all on live model pages, inherited from the source):
    - Peaq: "more than 640 km" and "from 460 to over 600 kilometers" in the text.
    - Elroq: "more than 560 km in WLTP mode".
    - Elroq RS: "up to 550 kilometres" (official 516 – 554).
    - Enyaq RS: "up to 560 km for the SUV and 570 km for the Coupé" (official RS: 513 – 565 / 528 – 572).
    - Epiq: "over 430 kilometers".
    - Every Range and fuel-consumption cell lacks "WLTP".
- **Verified:**
  - 40 unit tests (`tools/tech-data/*.test.mjs`, `scripts/tech-values.test.mjs`), JS lint, and stylelint incl. the plugin CSS.
  - Both plugins standalone on the branch preview:
    - the check lists the Peaq Issue with the PDF and date;
    - the picker lists 7 models, the first preselected when it has no page.
  - The Peaq model page on the branch loads with no console errors.
- **Review round 1 (PR #546, 2026-10-29), every finding fixed:**
  - **P1:** Update could delete authored content. The cell pattern ran across paragraphs from a bold introduction.
    - Fix: the pattern stays inside one cell, and a save guard refuses any change to block or format tags or to text
      outside the values.
  - **P2 #2:** draft copies lost their model. Fix: models from the path, else the metadata (`model`, `derivative`,
    `tags`) against the sheet's model `tags`/`excludeTags`.
  - **P2 #3:** a cell linked to another model's row passed. Fix: it's an Issue, and Update relinks it.
  - **P2 #4:** linked stats lost the 32 px value / 24 px unit split.
    - Fix: a link that is all of its `<strong>` unwraps into it.
    - Measured on the branch: identical to the unlinked cell at 390, 768, 992 and 1080.
  - **P2 #5:** Insert split the sentence. Fix: the picker copies; a paste stays inline (checked in ProseMirror).
  - **P2 #6:** "up to 577 km" for the Elroq 85 failed. Fix: the top or bottom of an official interval passes.
  - **CSS:** the plugin CSS passes stylelint and is now in `lint:css`.
- **Not verified:**
  - Inside DA: the SDK handshake in a prepare dialog, the save (PUT to the source) while the editor is open, and the
    clipboard copy inside the library frame (`allow="clipboard-write"`).
  - These wait for the config rows and a draft.

## Round 2 (2026-10-29): prose claims and Canvas
Branch `skoda-852-claims`, from `1c0652b`. Target: the Canvas article
`/en/skoda-world/peaq-family-weekend-getaway-on-one-charge`, which exists only in DA (not previewed).

- **Gap closed:** the check covered linked values, the grid and WLTP-labelled sentences only.
  - New `claims.js` checks every technical claim in the text and in the metadata Title and Description.
  - It replaces the `wltp-figures` check.
  - Details are in `tools/tech-data/README.md`.
- **Reference data v2:**
  - New columns `configuration`, `confidence`, `limitations`, and a `records` tab.
  - Peaq fields from the TD PDF (21. 9. 2026): battery gross/net, DC and AC charging power, DC time per
    version, boot by configuration (5-seater, 7-seater, third row, folded), towing, seats, seat rows, CO₂.
  - The display (13.6-inch) comes from an official story (15. 10. 2026), marked as such.
  - The Peaq 90 record (936 km, 9.2 kWh/100 km) is a record, not a capability.
  - Two inferred values from round 1 (Elroq RS / Enyaq RS DC charging 29 min and top speed) were removed: the
    PDFs don't assign them, and the Enyaq RS page says 26 min / 185 kW.
- **The target article** (DA source, `npm run tech-data:audit -- --source da …`):
  - **10 Issues:**
    - "up to 936 km on a single charge", in the intro and in the Description (official WLTP 459 / 647 / 613 km;
      936 km is the record drive);
    - "WLTP range of up to 608 kilometres";
    - "765-litre" boot (935 / 890 l) and "1,690 litres" folded (2150 / 2075 l);
    - "32-inch" display (13.6);
    - DC "up to 200 kW" (160 / 199 kW; not the 220 kW motor);
    - "22 kW AC" (11 kW);
    - "up to 2,500 kg" towing (1800–2000 kg);
    - "14.8 – 18.6 kWh/100 km" (14.7 / 15.0 / 15.8).
  - **2 Reviews:** "six trim levels" and "MEB+ platform" have no reference data.
  - **6 match:** 91 kWh, net 86 kWh, about 28 min, CO₂ 0 g/km, seven-seat, three rows.
  - The article was not changed or published.
- **Model pages** (25):
  - The three Range Issues stand.
  - New prose Issues are real disagreements with the TD PDFs, from outdated source text:
    - Elroq RS "up to 550 km" (554);
    - Enyaq "from 150 kW" (140 / 210 / 220);
    - Enyaq Coupé "132 / 150 / 195 kW";
    - Epiq "up to 440 km" (441).
  - The record release and story: all figures pass; the only Review is "19-inch wheels".
- **Canvas:**
  - The built-in Preflight panel is a closed Adobe service; site code can't add checks to it.
  - Tech data check is in the Canvas prepare menu (dialog, saved source, fixes) and is a Canvas side panel (live
    document, read-only).
- **Verified:**
  - 57 unit tests and lint (JS + CSS).
  - The real DA SDK (`da.live/nx/utils/sdk.js`) against a host harness speaking Canvas's panel and
    prepare-dialog protocol, with the article's real DA source:
    - panel: subscribe, check, re-check after an edit;
    - dialog: DA source read, no fix offered for prose claims.
- **Not verified:** the real Canvas UI. It needs an Adobe sign-in this environment doesn't have.
- **Behaviour changes:**
  - A page without a model no longer compares claims with every model's figures; they are Reviews.
  - A prose link to another model's row is an Issue.

## Open questions (client)
1. **Who owns the technical figures, and is the PDF the authority?** The page and its PDF disagree on 3 of 9 EV
   pages; someone has to say which is right. Linked to SKODA-208 "Key Facts / Technical Data structured-data source to
   confirm".
2. **Long-term source:** the PDFs in AEM Assets, or a product-data system that can feed the sheet?
3. **Labelling rule:** must every range/consumption figure carry "WLTP" (or a footnote)? For Škoda legal; this
   ticket doesn't claim a legal requirement.

## Dependencies
SKODA-208 (model page, Technical Data grid), 842 (DA library), 850a (request publish), 801/805 (stories, press
releases). DA site config (library, `prepare`).
