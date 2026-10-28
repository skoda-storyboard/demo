# SKODA-852, Technical data from one sheet: linked values, a picker and Preflight checks against the official figures

- **Epic:** E08, Editorial at Scale
- **Type:** DA editor plugins (library + Preflight) + a shared rules script + a command-line audit + a DA sheet
- **Phase:** B · **Milestone:** stakeholder demo (date OPEN), then M2 if the client wants it. Not a go-live
  blocker.
- **Estimate:** 5 SP · AI-assisted 4–5d / manual 7–9d, excluding the client's data-owner answer *(planning
  estimate, not a quote)*. Demo cut (sheet, rules, Preflight, audit, page script; picker after): ≈3d AI-assisted.
- **GitHub issue:** [#544](https://github.com/skoda-storyboard/demo/issues/544) (created 2026-10-28)
- **Status (2026-10-28):** 🔵 TODO, ticket only (no code). No owner. Source: read-only audit of the 23 live model
  pages against their own technical-data PDFs (below).

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
  and date.
- [ ] On the Peaq draft, Preflight shows an Issue for the Range cell with "459 – 647 km" and the PDF date; "Update"
  rewrites it, and Preflight then passes.
- [ ] On the record-release draft, the linked 647 km passes, the 936 km record passes, and an added "936 km WLTP"
  is an Issue.
- [ ] The audit run over all 23 model pages reports exactly the three differences above (or explains any change),
  and no RS/Sportline/Epiq false positives.
- [ ] Linked values render as text on `.aem.page`; `.plain.html` keeps the link.
- [ ] Unit tests for every rule; `npm run lint` passes.
- [ ] The built-in Preflight's checks are listed, and the decision on the `prepare` row is recorded.

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
