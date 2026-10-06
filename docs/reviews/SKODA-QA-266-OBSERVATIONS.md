# M1 manual QA intake - issue #266

**Imported 2026-10-06.** This register pulls in the attached QA sheet, not a new implementation or a QA sign-off.
It contains **129 observation records across seven pages and four worksheets**, plus **seven reported Lighthouse summaries**.
The source issue lists six tested pages; the workbook also includes **Videos**. Do not silently drop that row or claim that the remaining template variations were tested.

**Subsequent triage:** the [M1/M2 register and grouped local ticket drafts](SKODA-QA-266-TRIAGE.md) apply the user's rough-M1 cut line. They remain **unpublished**, preserve the intake records below and supersede the import's phase guidance; historical dataset notes remain intact.

## Source and fidelity

- Issue: [#266](https://github.com/skoda-storyboard/demo/issues/266); QA parent: [#247](https://github.com/skoda-storyboard/demo/issues/247).
- Workbook: [QA Observations.xlsx](https://github.com/user-attachments/files/33109693/QA.Observations.xlsx), attached by `jkondalu` at `2026-10-06T13:58:55Z` in the [source comment](https://github.com/skoda-storyboard/demo/issues/266#issuecomment-6017882539).
- Attachment: 17,155 bytes; SHA-256 `e576b07b5f024ba425cdf58e9f78bae4e109dbc91c72afe6da589bb8e487d01c`.
- Machine-readable companion: [`SKODA-QA-266-OBSERVATIONS.json`](SKODA-QA-266-OBSERVATIONS.json). It retains every nonempty source cell, hyperlink target, original observation string, source numbering/line references, normalized observation and ticket-state snapshot.
- Homepage and Superb release URL cells have display titles rather than URL text; their real hyperlinks were extracted, not guessed. The Peaq article inherits the press-kit grouping; its blank template cell remains blank in the raw data.

## Interpretation and scope

- **reported**: imported claim; not independently reproduced by this intake.
- **expectation-review**: ambiguous claim or conflict with a documented requirement/exception.
- **prior-measured**: supported by the preceding 2026-10-06 origin/live measurements in this session; not a fresh retest or acceptance.
- Ticket links are **coverage candidates**, with GitHub open/closed state checked at import time. A closed component ticket is not an open regression fix. An open parity ticket is not proof that every claim is already in its acceptance criteria.
- Coverage labels distinguish **explicit open scope**, **related open scope**, **partial open scope**, **closed references**, and **phase/variant review**. The paired dataset defines each label; none is a defect-confirmation or completion status.
- Counting preserves each flat numbered observation as one record, including its continuation/qualification lines; nested sections are split into their nonempty reported item lines. Compound source items remain compound. Lighthouse scores are separate, not defect records. These are not 129 deduplicated root causes.
- No severity, priority, assignee, new issue, ticket reopening, acceptance-criteria change or runtime fix is implied by this import.

### Expectations to resolve before implementation

- **Pause/resume:** `QA266-HOME-01` reports the controls that SKODA-213 explicitly requires. Do not remove an accessibility control solely for parity.
- **Fallback fonts:** `QA266-HOME-06` names a CSS fallback; that is not evidence of the actual painted font.
- **Mobile languages:** `QA266-HOME-39` says the drawer-bottom placement is by design. Confirm the intended placement/translation availability.
- **Add-menu sizes:** `QA266-IMAGES-04` reports Original/1920 choices without saying what should happen instead; source behavior needs comparison.
- **Caption backdrop:** `QA266-PK-HUB-02` requests `#0000008F`, whereas the user requests no extra caption background. SKODA-221/#203 document a 56% black contrast upgrade. Earlier measurements covered the Superb kit and Series, not a fresh Peaq-hub comparison; retain both expectations until they are reconciled.
- **Scope boundaries:** #248 owns the top collapsed toolbar/active Newest color, not bottom Load-more spacing. #224 owns the five M1 press releases, not automatic acceptance of the Peaq article. #68 currently has an M1 milestone despite its older M2 header; its FAQ/shared-accordion scope does not automatically cover the first-glimpse editorial variant. Closed #102 owns footer legal-link content, which #144 excludes.
- **Separate prior findings:** Series footer spacing and the all-new Superb kit Twitter fallback are not in this workbook. Do not attribute those preceding user findings to the tester or claim workbook coverage for them.

## Page coverage and reported Lighthouse scores

Scores are transcribed, **not rerun or judged against a pass threshold**. The sheet supplies no per-page audit timestamp, viewport, browser, throttling/cache conditions, Lighthouse version or deployment/content commit.
Existing performance/accessibility/sign-off gates are #42, #43 and #44; these reported scores do not close them.

| Page | Worksheet / cell | Observations | Performance | Accessibility | Best practices | SEO |
|---|---|---:|---:|---:|---:|---:|
| Storyboard home | Home Page Observations / D2 | 39 | 100 | 97 | 100 | 69 |
| Images | Media listings observations / D2 | 13 | 99 | 93 | 100 | 61 |
| Videos | Media listings observations / D3 | 10 | 99 | 93 | 100 | 61 |
| Klaus Zellmer press release | Press releases observations / D2 | 22 | 99 | 92 | 100 | 69 |
| Superb 25-years press release | Press releases observations / D3 | 18 | 100 | 92 | 100 | 69 |
| Peaq press-kit hub | Press kits observations / D2 | 9 | 100 | 93 | 100 | 69 |
| Peaq first-glimpse article | Press kits observations / D3 | 18 | 99 | 93 | 100 | 61 |

Intake states: **119 reported**, **5 expectation-review**, **5 prior-measured**.

## Shared triage groups

These group repeated reports by affected component, not by a proven common root cause. Validate before consolidating regression tickets.

| Component | Records | Related tickets at import |
|---|---:|---|
| `downloads-dates` | 3 | [#15][issue-15] (closed), [#31][issue-31] (closed), [#130][issue-130] (closed) |
| `downloads-file-tiles` | 6 | [#31][issue-31] (closed), [#130][issue-130] (closed), [#173][issue-173] (closed) |
| `downloads-headings` | 3 | [#15][issue-15] (closed), [#31][issue-31] (closed) |
| `downloads-toggle` | 1 | [#31][issue-31] (closed), [#130][issue-130] (closed), [#173][issue-173] (closed) |
| `footer` | 12 | [#25][issue-25] (closed), [#26][issue-26] (closed), [#102][issue-102] (closed), [#144][issue-144] (open) |
| `header-search` | 6 | [#22][issue-22] (closed), [#144][issue-144] (open) |
| `home-rails` | 27 | [#15][issue-15] (closed), [#98][issue-98] (closed) |
| `listing-filters` | 2 | [#28][issue-28] (closed), [#175][issue-175] (closed) |
| `listing-media-cards` | 1 | [#15][issue-15] (closed), [#176][issue-176] (closed) |
| `listing-pagination` | 4 | [#28][issue-28] (closed), [#175][issue-175] (closed) |
| `listing-sort` | 4 | [#28][issue-28] (closed), [#248][issue-248] (open) |
| `media-action-behavior` | 6 | [#31][issue-31] (closed), [#50][issue-50] (closed), [#51][issue-51] (closed), [#173][issue-173] (closed) |
| `media-action-colors` | 3 | [#31][issue-31] (closed), [#51][issue-51] (closed) |
| `media-action-icons` | 2 | [#51][issue-51] (closed), [#176][issue-176] (closed) |
| `mobile-languages` | 1 | [#24][issue-24] (closed), [#144][issue-144] (open), [#243][issue-243] (open) |
| `press-kit-accordions` | 5 | [#68][issue-68] (open), [#130][issue-130] (closed) |
| `press-kit-banners` | 1 | [#128][issue-128] (closed) |
| `press-kit-contact-links` | 1 | [#14][issue-14] (closed), [#130][issue-130] (closed) |
| `press-kit-gallery` | 1 | [#17][issue-17] (closed), [#130][issue-130] (closed) |
| `press-kit-hero` | 3 | [#128][issue-128] (closed), [#196][issue-196] (closed) |
| `press-kit-links` | 1 | [#118][issue-118] (closed), [#129][issue-129] (closed) |
| `press-kit-sidebar` | 4 | [#47][issue-47] (closed), [#51][issue-51] (closed), [#130][issue-130] (closed) |
| `press-kit-video` | 1 | [#18][issue-18] (closed), [#31][issue-31] (closed), [#51][issue-51] (closed), [#130][issue-130] (closed) |
| `press-related-rail` | 3 | [#15][issue-15] (closed), [#98][issue-98] (closed), [#172][issue-172] (closed), [#224][issue-224] (open) |
| `press-release-bands` | 5 | [#224][issue-224] (open) |
| `press-release-callout` | 1 | [#148][issue-148] (open), [#224][issue-224] (open) |
| `press-release-prose` | 1 | [#224][issue-224] (open) |
| `press-release-sidebar` | 8 | [#47][issue-47] (closed), [#51][issue-51] (closed), [#224][issue-224] (open) |
| `promo-box` | 3 | [#97][issue-97] (closed), [#99][issue-99] (closed), [#250][issue-250] (open) |
| `quotes` | 4 | [#140][issue-140] (closed), [#224][issue-224] (open) |
| `search-routing` | 3 | [#29][issue-29] (closed), [#118][issue-118] (closed) |
| `shared-card-headings` | 1 | [#15][issue-15] (closed), [#107][issue-107] (closed) |
| `shared-typography` | 1 | [#14][issue-14] (closed), [#107][issue-107] (closed) |
| `tile-caption-background` | 1 | [#128][issue-128] (closed), [#141][issue-141] (closed) |

## HOME - Storyboard home

Source: `Home Page Observations!D2`. [Origin](https://www.skoda-storyboard.com/en/) / [demo](https://main--demo--skoda-storyboard.aem.live/en).

Observation wording is preserved, including source typos. Source `n.m` denotes item `m` within section `n`.

| ID | Source # | Observation | Related tickets | Intake / coverage |
|---|---|---|---|---|
| `QA266-HOME-01` | 1 | Pause Rotation / Resume Rotation is displaying  in Hero banner | [#99][issue-99] (closed) | expectation-review<br>closed references |
| `QA266-HOME-02` | 2 | Hero Promos:  Left alignment issue for the 'Hero promso' section and 'Latest stories' section | [#250][issue-250] (open), [#99][issue-99] (closed), [#97][issue-97] (closed) | reported<br>partial open scope |
| `QA266-HOME-03` | 3 | Header: Logo image is not matching with live site | [#144][issue-144] (open), [#22][issue-22] (closed) | reported<br>related open scope |
| `QA266-HOME-04` | 4 | Hero article promo image width is 820 x 466 but as per live shouild be 812 x 466.75 | [#250][issue-250] (open), [#99][issue-99] (closed) | reported<br>explicit open scope |
| `QA266-HOME-05` | 5 | Social Media:  Title tag should be 'h3' tag | [#107][issue-107] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-06` | 6 | Social media: title fall back font "skoda-next-fallback" is aditionally displaying<br>note: fall back font issue for all the fields | [#14][issue-14] (closed), [#107][issue-107] (closed) | expectation-review<br>closed references |
| `QA266-HOME-07` | 7 | Models: Car cards order is not as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-08` | 8 | Models: underline is displaying if mouse hover on the card-teaser-title link | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-09` | 9 | Models: Arrow icon is not as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-10` | 10 | Models : title tag should be h3 as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-11` | 11 | eMobility: Font color should not chage and under line should not display if mouse hover on the card-teaser-title | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-12` | 12 | eMobility:  little more space displaying between the 'date' and 'card-teaser-title' | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-13` | 13 | eMobility:  Arrow icon is not as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-14` | 14 | eMobility : title tag should be h3 as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-15` | 15 | eMobility : date is overlapping with arrow icon if we use the arrow icon in forward and backword directions | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-16` | 16 | Lifestyle:  Font color should not chage and under line should not display if mouse hover on the card-teaser-title | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-17` | 17 | Lifestyle:  little more space displaying between the 'date' and 'card-teaser-title' | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-18` | 18 | Lifestyle:  Arrow icon is not as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-19` | 19 | Lifestyle : title tag should be h3 as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-20` | 20 | Lifestyle : date is overlapping with arrow icon if we use the arrow icon in forward and backword directions | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-21` | 21 | Skoda world :  Font color should not chage and under line should not display if mouse hover on the card-teaser-title | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-22` | 22 | Skoda world:  little more space displaying between the 'date' and 'card-teaser-title' | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-23` | 23 | Skoda world:  Arrow icon is not as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-24` | 24 | Skoda world : title tag should be h3 as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-25` | 25 | Skoda world: date is overlapping with arrow icon if we use the arrow icon in forward and backword directions | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-26` | 26 | Series: Arrow icon is not as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-27` | 27 | Series: title tag should be h3 as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-28` | 28 | Series: underline is displaying if mouse hover on the card-teaser-title link | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-29` | 29 | Latest News:  Font color should not chage and under line should not display if mouse hover on the card-teaser-title | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-30` | 30 | Latest News:  little more space displaying between the 'date' and 'card-teaser-title' | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-31` | 31 | Latest News:  Arrow icon is not as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-32` | 32 | Latest News : title tag should be h3 as per live site | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-33` | 33 | Latest News: date is overlapping with arrow icon if we use the arrow icon in forward and backword directions | [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-HOME-34` | 34 | Footer: "For more details see Data Protection, Copyright, Cookies policies and Whistleblower system." missing in the footer | [#102][issue-102] (closed), [#25][issue-25] (closed) | reported<br>closed references |
| `QA266-HOME-35` | 35 | Search bar: Search results page getting 404 error page | [#29][issue-29] (closed), [#118][issue-118] (closed) | reported<br>closed references |
| `QA266-HOME-36` | 36 | Search bar: Search bar is overlappig with navigatin menu | [#144][issue-144] (open), [#22][issue-22] (closed) | reported<br>related open scope |
| `QA266-HOME-37` | 37 | Search bar: enter a keyword in the search bar and perform click operaion out side the search bar, search bar should get close as per live but not working | [#144][issue-144] (open), [#22][issue-22] (closed) | reported<br>related open scope |
| `QA266-HOME-38` | 38 | Close (X) icon is displaying in the right side of the search bar but should not display as per live site | [#144][issue-144] (open), [#22][issue-22] (closed) | reported<br>related open scope |
| `QA266-HOME-39` | 39 | Mobile: Language ions "EN, CZ, DE, SK, SR, SL"are not displaying in the header - it is at the bottom of the burgger menu as per design | [#24][issue-24] (closed), [#144][issue-144] (open), [#243][issue-243] (open) | expectation-review<br>related open scope |

**Triage notes**

- `QA266-HOME-01`: SKODA-213 explicitly requires a pause/resume control in both layouts. Its presence alone is not a defect or authorization to remove it.
- `QA266-HOME-02`: #250 owns the promo lead-card inset, not a global shift of Latest Stories or the rails; check those separately.
- `QA266-HOME-06`: A declared fallback font in the CSS stack is not itself evidence that the fallback is painted. Check the rendered font, metrics and wrapping.
- `QA266-HOME-07`: Keep source ordering and feed/authoring ownership separate from carousel presentation; no targeted open ordering fix is established here.
- `QA266-HOME-34`: Legal-link content is owned by closed #102 and is explicitly excluded from #144. Reproduce before creating a regression follow-up.
- `QA266-HOME-39`: The observation itself says the languages are at the drawer bottom as designed. Establish the intended placement and available translations before treating this as missing content. #243 is the locale-link routing decision, not an existing header-placement fix.

## IMAGES - Images

Source: `Media listings observations!D2`. [Origin](https://www.skoda-storyboard.com/en/images/) / [demo](https://main--demo--skoda-storyboard.aem.live/en/images).

Observation wording is preserved, including source typos. Source `n.m` denotes item `m` within section `n`.

| ID | Source # | Observation | Related tickets | Intake / coverage |
|---|---|---|---|---|
| `QA266-IMAGES-01` | 1 | plus, download icons should be bold compare to live site | [#51][issue-51] (closed), [#176][issue-176] (closed) | reported<br>closed references |
| `QA266-IMAGES-02` | 2 | Plus button not working | [#51][issue-51] (closed), [#50][issue-50] (closed), [#31][issue-31] (closed) | reported<br>closed references |
| `QA266-IMAGES-03` | 3 | Download not working with pixels | [#51][issue-51] (closed), [#50][issue-50] (closed), [#31][issue-31] (closed) | reported<br>closed references |
| `QA266-IMAGES-04` | 4 | 'Orginal' and  '1920 px' displaying if click on the Plus button | [#51][issue-51] (closed), [#31][issue-31] (closed) | expectation-review<br>closed references |
| `QA266-IMAGES-05` | 5 | Filters and Filter options are not as per live site | [#28][issue-28] (closed), [#175][issue-175] (closed) | reported<br>closed references |
| `QA266-IMAGES-06` | 6 | 2nd article image (Novým vedoucím závodu Škoda Auto ve Vrchlabí se od 1. 12. 2025 stane Lars Bürger<br>) cropped | [#176][issue-176] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-IMAGES-07` | 7 | Less space displaying  below the "Load more" button | [#28][issue-28] (closed), [#175][issue-175] (closed) | reported<br>closed references |
| `QA266-IMAGES-08` | 8 | Less space displaying above the "12 / 1714" search-results-pagination-status | [#28][issue-28] (closed), [#175][issue-175] (closed) | reported<br>closed references |
| `QA266-IMAGES-09` | 9 | "Neweat" link font colour should be "#000000" as per live site | [#248][issue-248] (open), [#28][issue-28] (closed) | reported<br>explicit open scope |
| `QA266-IMAGES-10` | 10 | "Oldeat" link font colour should be "#CCCCCC" as per live site | [#248][issue-248] (open), [#28][issue-28] (closed) | reported<br>partial open scope |
| `QA266-IMAGES-11` | 11 | Search page getting 404 error page | [#29][issue-29] (closed), [#118][issue-118] (closed) | reported<br>closed references |
| `QA266-IMAGES-12` | 12 | Close (X) icon is displaying in the right side of the search bar but should not display as per live site | [#144][issue-144] (open), [#22][issue-22] (closed) | reported<br>related open scope |
| `QA266-IMAGES-13` | 13 | Footer: Contacts, Subscribe, Company titles tags should be h3 tags as per live | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |

**Triage notes**

- `QA266-IMAGES-02`, `QA266-IMAGES-03`: Record the failing asset, selected rendition and request/action result. Open #219 is a possible delivery dependency, not a proven cause of these failures.
- `QA266-IMAGES-04`: The source sentence reports the size choices but supplies no expected alternative. Verify the source add-menu behavior before changing it.
- `QA266-IMAGES-07`, `QA266-IMAGES-08`: #248 covers the top collapsed toolbar, not spacing below Load more or around the bottom pagination status.
- `QA266-IMAGES-10`: #248 explicitly owns active Newest color. The reported inactive Oldest color is an additional expectation to verify, not an already proven match to that scope.

## VIDEOS - Videos

Source: `Media listings observations!D3`. [Origin](https://www.skoda-storyboard.com/en/videos/) / [demo](https://main--demo--skoda-storyboard.aem.live/en/videos).

Observation wording is preserved, including source typos. Source `n.m` denotes item `m` within section `n`.

| ID | Source # | Observation | Related tickets | Intake / coverage |
|---|---|---|---|---|
| `QA266-VIDEOS-01` | 1 | plus, download icons should be bold compare to live site | [#51][issue-51] (closed), [#176][issue-176] (closed) | reported<br>closed references |
| `QA266-VIDEOS-02` | 2 | Plus button not working | [#51][issue-51] (closed), [#50][issue-50] (closed), [#31][issue-31] (closed) | reported<br>closed references |
| `QA266-VIDEOS-03` | 3 | Filters and Filter options are not as per live site | [#28][issue-28] (closed), [#175][issue-175] (closed) | reported<br>closed references |
| `QA266-VIDEOS-04` | 4 | Less space displaying  below the "Load more" button | [#28][issue-28] (closed), [#175][issue-175] (closed) | reported<br>closed references |
| `QA266-VIDEOS-05` | 5 | Less space displaying above the "12 / 1714" search-results-pagination-status | [#28][issue-28] (closed), [#175][issue-175] (closed) | reported<br>closed references |
| `QA266-VIDEOS-06` | 6 | "Neweat" link font colour should be "#000000" as per live site | [#248][issue-248] (open), [#28][issue-28] (closed) | reported<br>related open scope |
| `QA266-VIDEOS-07` | 7 | "Oldeat" link font colour should be "#CCCCCC" as per live site | [#248][issue-248] (open), [#28][issue-28] (closed) | reported<br>partial open scope |
| `QA266-VIDEOS-08` | 8 | Search page getting 404 error page | [#29][issue-29] (closed), [#118][issue-118] (closed) | reported<br>closed references |
| `QA266-VIDEOS-09` | 9 | Close (X) icon is displaying in the right side of the search bar but should not display as per live site | [#144][issue-144] (open), [#22][issue-22] (closed) | reported<br>related open scope |
| `QA266-VIDEOS-10` | 10 | Footer: Contacts, Subscribe, Company titles tags should be h3 tags as per live | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |

**Triage notes**

- `QA266-VIDEOS-02`: Record the failing asset, selected rendition and request/action result. Open #219 is a possible delivery dependency, not a proven cause of these failures.
- `QA266-VIDEOS-04`, `QA266-VIDEOS-05`: #248 covers the top collapsed toolbar, not spacing below Load more or around the bottom pagination status.
- `QA266-VIDEOS-06`: Videos is a related consumer of #248; the ticket measurements were on Images, not independent proof of the reported Videos color.
- `QA266-VIDEOS-07`: #248 explicitly owns active Newest color. The reported inactive Oldest color is an additional expectation to verify, not an already proven match to that scope.

## PR-ZELLMER - Klaus Zellmer press release

Source: `Press releases observations!D2`. [Origin](https://www.skoda-storyboard.com/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company/) / [demo](https://main--demo--skoda-storyboard.aem.live/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company).

Observation wording is preserved, including source typos. Source `n.m` denotes item `m` within section `n`.

| ID | Source # | Observation | Related tickets | Intake / coverage |
|---|---|---|---|---|
| `QA266-PR-ZELLMER-01-01` | 1.1 | Arrow icon(&gt;) missing from media contacts | [#224][issue-224] (open), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>related open scope |
| `QA266-PR-ZELLMER-01-02` | 1.2 | Plus (+) icon missing from Download Media Box | [#224][issue-224] (open), [#47][issue-47] (closed), [#51][issue-51] (closed) | prior-measured<br>related open scope |
| `QA266-PR-ZELLMER-01-03` | 1.3 | Tags should display in two lines | [#224][issue-224] (open), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>related open scope |
| `QA266-PR-ZELLMER-01-04` | 1.4 | 'media contacts' and 'Download Media Box' font color should be #363636 as per live site | [#224][issue-224] (open), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>related open scope |
| `QA266-PR-ZELLMER-02-01` | 2.1 | Content should be center aligne as per live | [#140][issue-140] (closed), [#224][issue-224] (open) | reported<br>related open scope |
| `QA266-PR-ZELLMER-02-02` | 2.2 | Missing  "________" below the content | [#140][issue-140] (closed), [#224][issue-224] (open) | reported<br>related open scope |
| `QA266-PR-ZELLMER-03` | 3 | FAQ background colour should be as per live site | [#148][issue-148] (open), [#224][issue-224] (open) | reported<br>explicit open scope |
| `QA266-PR-ZELLMER-04-01` | 4.1 | Media box - card title should be h3 tag as per live | [#31][issue-31] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-PR-ZELLMER-04-02` | 4.2 | Click on the 'Download' icon, 'Orginal' and '1920px'  font colour  should be #161718 as per live site | [#31][issue-31] (closed), [#51][issue-51] (closed) | reported<br>closed references |
| `QA266-PR-ZELLMER-04-03` | 4.3 | Plus (+) button disable for PDF file card | [#51][issue-51] (closed), [#173][issue-173] (closed) | reported<br>closed references |
| `QA266-PR-ZELLMER-04-04` | 4.4 | PDF file card UI, and icon on the PDF file is not as per live site | [#173][issue-173] (closed) | reported<br>closed references |
| `QA266-PR-ZELLMER-04-05` | 4.5 | PDF file should be clickable as per live site | [#173][issue-173] (closed), [#31][issue-31] (closed) | reported<br>closed references |
| `QA266-PR-ZELLMER-04-06` | 4.6 | More space displaying above the cards (below the 1 image, 1 PDF) | [#224][issue-224] (open) | reported<br>related open scope |
| `QA266-PR-ZELLMER-04-07` | 4.7 | Date should display for all cards above the card title | [#31][issue-31] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-PR-ZELLMER-04-08` | 4.8 | Should be separate with white space bar at the end of the media box section | [#224][issue-224] (open) | prior-measured<br>related open scope |
| `QA266-PR-ZELLMER-05-01` | 5.1 | Related Press Releases title tab should be h3 | [#172][issue-172] (closed), [#224][issue-224] (open) | reported<br>related open scope |
| `QA266-PR-ZELLMER-05-02` | 5.2 | Under line should not display if mouse hover on article title | [#172][issue-172] (closed), [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-PR-ZELLMER-05-03` | 5.3 | Arrow icon is not as per live site | [#172][issue-172] (closed), [#98][issue-98] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-PR-ZELLMER-05-04` | 5.4 | Should be separate with white space bar at the end of the Related Press Releases section | [#224][issue-224] (open) | prior-measured<br>related open scope |
| `QA266-PR-ZELLMER-06-01` | 6.1 | Contacts, Subscribe, Company titles tags should be h3 tags as per live | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |
| `QA266-PR-ZELLMER-06-02` | 6.2 | Under line should not display if mouse hover on the 'consent to the processing' link as per live site | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |
| `QA266-PR-ZELLMER-06-03` | 6.3 | 'Manage subscription' link font color should be  #419468 as per live site | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |

**Triage notes**

- `QA266-PR-ZELLMER-01-02`, `QA266-PR-ZELLMER-04-08`, `QA266-PR-ZELLMER-05-04`: Measured in the preceding 2026-10-06 origin/live check; not freshly retested or accepted by this spreadsheet import.
- `QA266-PR-ZELLMER-02-01`, `QA266-PR-ZELLMER-02-02`: #140 owns the quote implementation; #224 owns integration/retest after it lands, not a duplicate quote block.
- `QA266-PR-ZELLMER-04-07`: Verify source-visible per-asset dates and whether the authored Downloads contract carries them; do not invent dates from filenames.

## PR-SUPERB - Superb 25-years press release

Source: `Press releases observations!D3`. [Origin](https://www.skoda-storyboard.com/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/) / [demo](https://main--demo--skoda-storyboard.aem.live/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence).

Observation wording is preserved, including source typos. Source `n.m` denotes item `m` within section `n`.

| ID | Source # | Observation | Related tickets | Intake / coverage |
|---|---|---|---|---|
| `QA266-PR-SUPERB-01-01` | 1.1 | Arrow icon (&gt;) missing from 'media contacts' | [#224][issue-224] (open), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>related open scope |
| `QA266-PR-SUPERB-01-02` | 1.2 | Plus (+) icon missing from 'Download Media Box' | [#224][issue-224] (open), [#47][issue-47] (closed), [#51][issue-51] (closed) | prior-measured<br>related open scope |
| `QA266-PR-SUPERB-01-03` | 1.3 | Space should be little more between the first line tags and second line tags | [#224][issue-224] (open), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>related open scope |
| `QA266-PR-SUPERB-01-04` | 1.4 | 'media contacts' and 'Download Media Box' font color should be #363636 as per live site | [#224][issue-224] (open), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>related open scope |
| `QA266-PR-SUPERB-02-01` | 2.1 | Content should be center aligne as per live | [#140][issue-140] (closed), [#224][issue-224] (open) | reported<br>related open scope |
| `QA266-PR-SUPERB-02-02` | 2.2 | Missing  "________" below the content | [#140][issue-140] (closed), [#224][issue-224] (open) | reported<br>related open scope |
| `QA266-PR-SUPERB-03` | 3 | More space should display below the 'Millions of customers worldwide' paragraph as per live | [#224][issue-224] (open) | reported<br>explicit open scope |
| `QA266-PR-SUPERB-04-01` | 4.1 | Media box  - card titles should be h3 tags as per live | [#31][issue-31] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-PR-SUPERB-04-02` | 4.2 | Click on the 'Download' icon, 'Orginal' and '1920px'  font colour  should be #161718 as per live site | [#31][issue-31] (closed), [#51][issue-51] (closed) | reported<br>closed references |
| `QA266-PR-SUPERB-04-03` | 4.3 | Plus (+) button disabled for PDF file card | [#51][issue-51] (closed), [#173][issue-173] (closed) | reported<br>closed references |
| `QA266-PR-SUPERB-04-04` | 4.4 | PDF file card UI, and icon on the PDF file is not as per live site | [#173][issue-173] (closed) | reported<br>closed references |
| `QA266-PR-SUPERB-04-05` | 4.5 | PDF file should be clickable as per live site | [#173][issue-173] (closed), [#31][issue-31] (closed) | reported<br>closed references |
| `QA266-PR-SUPERB-04-06` | 4.6 | More space displaying above the cards (below the 4 images, 1 PDF) | [#224][issue-224] (open) | reported<br>related open scope |
| `QA266-PR-SUPERB-04-07` | 4.7 | Date should display for all cards above the card title | [#31][issue-31] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-PR-SUPERB-04-08` | 4.8 | Should be separate with white space bar at the end of the media box section | [#224][issue-224] (open) | prior-measured<br>related open scope |
| `QA266-PR-SUPERB-05-01` | 5.1 | Contacts, Subscribe, Company titles tags should be h3 tags as per live | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |
| `QA266-PR-SUPERB-05-02` | 5.2 | Under line should not display if mouse hover on the 'consent to the processing' link as per live site | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |
| `QA266-PR-SUPERB-05-03` | 5.3 | 'Manage subscription' link font color should be  #419468 as per live site | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |

**Triage notes**

- `QA266-PR-SUPERB-01-02`, `QA266-PR-SUPERB-04-08`: Measured in the preceding 2026-10-06 origin/live check; not freshly retested or accepted by this spreadsheet import.
- `QA266-PR-SUPERB-02-01`, `QA266-PR-SUPERB-02-02`: #140 owns the quote implementation; #224 owns integration/retest after it lands, not a duplicate quote block.
- `QA266-PR-SUPERB-04-07`: Verify source-visible per-asset dates and whether the authored Downloads contract carries them; do not invent dates from filenames.

## PK-HUB - Peaq press-kit hub

Source: `Press kits observations!D2`. [Origin](https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-press-kit-2/) / [demo](https://main--demo--skoda-storyboard.aem.live/en/press-kits/skoda-peaq-press-kit-2).

Observation wording is preserved, including source typos. Source `n.m` denotes item `m` within section `n`.

| ID | Source # | Observation | Related tickets | Intake / coverage |
|---|---|---|---|---|
| `QA266-PK-HUB-01-01` | 1.1 | Decription font size should be '20px' as per live site | [#128][issue-128] (closed), [#196][issue-196] (closed) | reported<br>closed references |
| `QA266-PK-HUB-02` | 2 | Cards: Card Titles background color should be '#0000008F' as per live site | [#141][issue-141] (closed), [#128][issue-128] (closed) | expectation-review<br>closed references |
| `QA266-PK-HUB-03` | 3 | Padding below the Hero Banner should be around 34px as per live site | [#128][issue-128] (closed), [#196][issue-196] (closed) | reported<br>closed references |
| `QA266-PK-HUB-04` | 4 | Images card getting  404 error page | [#129][issue-129] (closed), [#118][issue-118] (closed) | reported<br>closed references |
| `QA266-PK-HUB-05` | 5 | Padding below the 'whatsapp' and 'download' cards should be around 30px as per live site | [#128][issue-128] (closed) | reported<br>closed references |
| `QA266-PK-HUB-06` | 6 | Mobile: More white space displaying below the Hero banner | [#128][issue-128] (closed), [#196][issue-196] (closed) | reported<br>closed references |
| `QA266-PK-HUB-07-01` | 7.1 | Contacts, Subscribe, Company titles tags should be h3 tags as per live | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |
| `QA266-PK-HUB-07-02` | 7.2 | Under line should not display if mouse hover on the 'consent to the processing' link as per live site | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |
| `QA266-PK-HUB-07-03` | 7.3 | 'Manage subscription' link font color should be  #419468 as per live site | [#144][issue-144] (open), [#25][issue-25] (closed), [#26][issue-26] (closed) | reported<br>related open scope |

**Triage notes**

- `QA266-PK-HUB-02`: The sheet requests #0000008F, whereas the user requests no extra caption background. #141/#203 document a 56% black accessibility backdrop. Earlier measurements were on the Superb kit and Series, not a fresh Peaq-hub comparison; reconcile the expected behavior before changing it.

## PK-ARTICLE - Peaq first-glimpse article

Source: `Press kits observations!D3`. [Origin](https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/) / [demo](https://main--demo--skoda-storyboard.aem.live/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship).

Observation wording is preserved, including source typos. Source `n.m` denotes item `m` within section `n`.

| ID | Source # | Observation | Related tickets | Intake / coverage |
|---|---|---|---|---|
| `QA266-PK-ARTICLE-01-01` | 1.1 | Arrow icon(&gt;) missing from 'media contacts' | [#130][issue-130] (closed), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-01-02` | 1.2 | Plus (+) icon missing from 'Download Media Box' | [#130][issue-130] (closed), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-01-03` | 1.3 | Tags should display in two lines | [#130][issue-130] (closed), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-01-04` | 1.4 | 'media contacts' and 'Download Media Box' font color should be #363636 as per live site | [#130][issue-130] (closed), [#47][issue-47] (closed), [#51][issue-51] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-02` | 2 | Heoro Image should be clickable | [#130][issue-130] (closed), [#17][issue-17] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-03-01` | 3.1 | "+" icon is displaying small compare to live site, should be as per live site | [#130][issue-130] (closed), [#68][issue-68] (open) | reported<br>phase/variant review |
| `QA266-PK-ARTICLE-03-02` | 3.2 | From the accordion 1st point- "Škoda’s largest and most spacious model"  Images are displaying bigger and not aligned, should be as per live site | [#130][issue-130] (closed), [#68][issue-68] (open) | reported<br>phase/variant review |
| `QA266-PK-ARTICLE-03-03` | 3.3 | "PDF download " and "JPG download" links font color should be #419468 as per live site | [#130][issue-130] (closed), [#68][issue-68] (open) | reported<br>phase/variant review |
| `QA266-PK-ARTICLE-03-04` | 3.4 | From the accordion 2nd point and 3rd point-  Images are displaying bigger and not aligned, should be as per live site | [#130][issue-130] (closed), [#68][issue-68] (open) | reported<br>phase/variant review |
| `QA266-PK-ARTICLE-03-05` | 3.5 | From the accordion 4th, 5th, 6th  and 7th points-  Images are displaying bigger and not aligned, should be as per live site | [#130][issue-130] (closed), [#68][issue-68] (open) | reported<br>phase/variant review |
| `QA266-PK-ARTICLE-04` | 4 | Video: Videos controls ( play, volume, ...etc) alignment not as per live site<br>Plus icon, Download icon, Link to page icon are not displaying below the video | [#130][issue-130] (closed), [#18][issue-18] (closed), [#31][issue-31] (closed), [#51][issue-51] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-05` | 5 | Mail ids- "vitezslav.kodym@skoda-auto.cz", "zbynek.straskraba@skoda-auto.cz" font color should be # 419468 as per live site | [#130][issue-130] (closed), [#14][issue-14] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-06-01` | 6.1 | Media box - card title should be h3 tag as per live | [#31][issue-31] (closed), [#15][issue-15] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-06-02` | 6.2 | Click on the 'Download' icon, 'Orginal' and '1920px'  font colour  should be #161718 as per live site | [#31][issue-31] (closed), [#51][issue-51] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-06-03` | 6.3 | PDF file card and mp4 file card UI, and icon on the images are not as per live site | [#173][issue-173] (closed), [#130][issue-130] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-06-04` | 6.4 | PDF file card and mp4 file card should be clickable as per live site | [#173][issue-173] (closed), [#31][issue-31] (closed), [#130][issue-130] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-06-05` | 6.5 | Date should display for all cards above the card title | [#31][issue-31] (closed), [#15][issue-15] (closed), [#130][issue-130] (closed) | reported<br>closed references |
| `QA266-PK-ARTICLE-06-06` | 6.6 | Show more CTA button background color should be #78FAAE | [#31][issue-31] (closed), [#173][issue-173] (closed), [#130][issue-130] (closed) | reported<br>closed references |

**Triage notes**

- `QA266-PK-ARTICLE-01-01`, `QA266-PK-ARTICLE-01-02`, `QA266-PK-ARTICLE-01-03`, `QA266-PK-ARTICLE-01-04`: A shared PR-shell consumer, but #224 is scoped to five press releases; do not automatically treat the Peaq article as covered by its acceptance criteria.
- `QA266-PK-ARTICLE-03-01`, `QA266-PK-ARTICLE-03-02`, `QA266-PK-ARTICLE-03-03`, `QA266-PK-ARTICLE-03-04`, `QA266-PK-ARTICLE-03-05`: Peaq first-glimpse uses M1 editorial row toggles. Open #68 currently has an M1 milestone, but its FAQ chapter/shared-accordion scope still requires an explicit editorial-variant checklist. The later triage keeps material image layout in M1 and defers small icon/link styling to M2.
- `QA266-PK-ARTICLE-04`: The source item contains both player-control alignment and missing asset-toolbar claims. Preserve both; provider-native controls and page-owned media actions need separate verification.

## Earlier measured evidence carried forward

Only the matching press-release observations are annotated as prior-measured. Most imported observations still require origin-versus-current-preview/live reproduction.

| Evidence | Origin | Demo | Pages / viewport widths |
|---|---|---|---|
| Sidebar Media Box action | 40x40 round add/remove-to-cart control | Text link to `#media-box` only; no action control | Zellmer: 375/768/992/1080/1280; Superb: 1280 |
| Green-band separation | 16px white gaps between bands and before footer | 0px gaps; full-bleed itself matches origin | Zellmer: 375/768/992/1080/1280; Superb without Related: 1280 |

Captured with serial Chrome DevTools DOM/computed-style/box measurements on 2026-10-06 at height 900px. Selectors and page associations are retained in the JSON companion. This intake makes no fresh deployment or QA-pass claim.

## Ticket references

| Issue | Title | State at import |
|---|---|---|
| [#14][issue-14] | SKODA-106 — Design tokens + global CSS (re-derived, not ported) | closed |
| [#15][issue-15] | SKODA-201, Cards/Teaser block (overlay, media, toolbar variants) | closed |
| [#17][issue-17] | SKODA-203, Gallery block + lightbox modal (/modals/) | closed |
| [#18][issue-18] | SKODA-204, Embeds block (Vimeo/YouTube/Buzzsprout/Spotify, dnt=1, lazy) | closed |
| [#22][issue-22] | SKODA-301, Header + mega-menu (3 nested-list panels) fragment+block | closed |
| [#24][issue-24] | SKODA-303, Language switcher (6 locales) in nav tools | closed |
| [#25][issue-25] | SKODA-304, Footer fragment (nav repeat + social + app badges + legal + brand SVG) | closed |
| [#26][issue-26] | SKODA-305, Media Room footer variant | closed |
| [#28][issue-28] | SKODA-402, Faceted listing + load-more block (deep-link paging) | closed |
| [#29][issue-29] | SKODA-403 — Search block (Block Collection, index-only) | closed |
| [#31][issue-31] | SKODA-502, Static Downloads block (from mediakit/v1/mediabox) | closed |
| [#42][issue-42] | SKODA-702 — Performance (Lighthouse≈100, RUM, LCP/CLS, 3-phase load) | open |
| [#43][issue-43] | SKODA-703 — Accessibility audit (nav ARIA, modal focus-trap, contrast, keyboard) | open |
| [#44][issue-44] | SKODA-704 — Visual critique vs source + consent/analytics stubs + pilot sign-off | open |
| [#47][issue-47] | SKODA-607, Press Release detail template | closed |
| [#50][issue-50] | SKODA-505a, Media-cart download logic (device-ID state + originals + multi-select zip) | closed |
| [#51][issue-51] | SKODA-505b, Media-cart presentation + live AEM DAM delivery wiring | closed |
| [#68][issue-68] | SKODA-807, FAQ block (Press Kit) | open |
| [#97][issue-97] | SKODA-214, Stories feed block (Load-more pager, query-index) | closed |
| [#98][issue-98] | SKODA-212, Horizontal rails block (story-rail + carousel) | closed |
| [#99][issue-99] | SKODA-213, Promo-box block (featured mosaic / auto-rotate slider) | closed |
| [#102][issue-102] | SKODA-306, Footer outbound-link browsing-context parity | closed |
| [#107][issue-107] | SKODA-217, Homepage social-media icon cards | closed |
| [#118][issue-118] | SKODA-609, M1 link containment (demo set) + alias redirect | closed |
| [#128][issue-128] | SKODA-805a, Press-kit tiles hub, M1 demo slice + importer | closed |
| [#129][issue-129] | SKODA-805b, Press-kit chapter/resource child pages for the M1 hubs | closed |
| [#130][issue-130] | SKODA-805c, `press_kit-template-default` article (Peaq "first glimpse") | closed |
| [#140][issue-140] | SKODA-220, Quote block (centred pull-quote + short rule + attribution) | closed |
| [#141][issue-141] | SKODA-221, Cards `tiles` / mosaic variant (series hubs + press-kit hubs) | closed |
| [#144][issue-144] | SKODA-308, Chrome parity pass (header, search, mobile nav, footer, topbar newsletter) | open |
| [#148][issue-148] | SKODA-824, In-column highlight panel (story dark box + press-release grey callout) | open |
| [#172][issue-172] | SKODA-224, Story Rail `press` variant (Related Press Releases band) | closed |
| [#173][issue-173] | SKODA-510, Downloads file tiles (PDF / no-image rows) + mobile Show more | closed |
| [#175][issue-175] | SKODA-402a, Listing layout QA fix: 1/3/4/4 grid + facets collapsed behind "Advanced filter (n)" | closed |
| [#176][issue-176] | SKODA-406, Listing media-card cell (image / video items) | closed |
| [#196][issue-196] | SKODA-828, Hero parity across templates (sweep follow-ups, incl. ultrawide) | closed |
| [#224][issue-224] | SKODA-607a, Press-release page-level UI parity and final visual QA | open |
| [#243][issue-243] | SKODA-303a, Language switcher vs link containment (SKODA-609): decide the locale-link rule | open |
| [#247][issue-247] | SKODA-QA E2E Validation | open |
| [#248][issue-248] | SKODA-402b, Media-listing toolbar spacing and active-sort color parity | open |
| [#250][issue-250] | Homepage promo: restore source left inset on lead card | open |
| [#266][issue-266] | M1 template QA: observations from manual testing (6 of 12 template variations) | open |

Ticket state snapshot: `2026-10-06T19:54:01.034783+00:00`. All source observations remain recorded under #266; no GitHub issue was edited by this import.

[issue-14]: https://github.com/skoda-storyboard/demo/issues/14
[issue-15]: https://github.com/skoda-storyboard/demo/issues/15
[issue-17]: https://github.com/skoda-storyboard/demo/issues/17
[issue-18]: https://github.com/skoda-storyboard/demo/issues/18
[issue-22]: https://github.com/skoda-storyboard/demo/issues/22
[issue-24]: https://github.com/skoda-storyboard/demo/issues/24
[issue-25]: https://github.com/skoda-storyboard/demo/issues/25
[issue-26]: https://github.com/skoda-storyboard/demo/issues/26
[issue-28]: https://github.com/skoda-storyboard/demo/issues/28
[issue-29]: https://github.com/skoda-storyboard/demo/issues/29
[issue-31]: https://github.com/skoda-storyboard/demo/issues/31
[issue-42]: https://github.com/skoda-storyboard/demo/issues/42
[issue-43]: https://github.com/skoda-storyboard/demo/issues/43
[issue-44]: https://github.com/skoda-storyboard/demo/issues/44
[issue-47]: https://github.com/skoda-storyboard/demo/issues/47
[issue-50]: https://github.com/skoda-storyboard/demo/issues/50
[issue-51]: https://github.com/skoda-storyboard/demo/issues/51
[issue-68]: https://github.com/skoda-storyboard/demo/issues/68
[issue-97]: https://github.com/skoda-storyboard/demo/issues/97
[issue-98]: https://github.com/skoda-storyboard/demo/issues/98
[issue-99]: https://github.com/skoda-storyboard/demo/issues/99
[issue-102]: https://github.com/skoda-storyboard/demo/issues/102
[issue-107]: https://github.com/skoda-storyboard/demo/issues/107
[issue-118]: https://github.com/skoda-storyboard/demo/issues/118
[issue-128]: https://github.com/skoda-storyboard/demo/issues/128
[issue-129]: https://github.com/skoda-storyboard/demo/issues/129
[issue-130]: https://github.com/skoda-storyboard/demo/issues/130
[issue-140]: https://github.com/skoda-storyboard/demo/issues/140
[issue-141]: https://github.com/skoda-storyboard/demo/issues/141
[issue-144]: https://github.com/skoda-storyboard/demo/issues/144
[issue-148]: https://github.com/skoda-storyboard/demo/issues/148
[issue-172]: https://github.com/skoda-storyboard/demo/issues/172
[issue-173]: https://github.com/skoda-storyboard/demo/issues/173
[issue-175]: https://github.com/skoda-storyboard/demo/issues/175
[issue-176]: https://github.com/skoda-storyboard/demo/issues/176
[issue-196]: https://github.com/skoda-storyboard/demo/issues/196
[issue-224]: https://github.com/skoda-storyboard/demo/issues/224
[issue-243]: https://github.com/skoda-storyboard/demo/issues/243
[issue-247]: https://github.com/skoda-storyboard/demo/issues/247
[issue-248]: https://github.com/skoda-storyboard/demo/issues/248
[issue-250]: https://github.com/skoda-storyboard/demo/issues/250
[issue-266]: https://github.com/skoda-storyboard/demo/issues/266
