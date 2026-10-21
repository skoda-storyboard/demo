# Component Spec: story timeline (`ys-milestones`)

Status: **CAPTURED + BUILT** (2026-10-16, Playwright computed boxes on the live site and on the branch draft pages;
SKODA-815).
Contract: `timeline` (baseline block, variants `black`, `large`, `xl`; shape v2 with the optional space cell) in
[`SKODA-PENDING-BLOCK-CONTRACTS.md`](../planning/SKODA-PENDING-BLOCK-CONTRACTS.md).

## 1. Identity
- **Component:** a dated vertical timeline inside the story body: per milestone a year pill, a title, an image and a
  description, on a white line across a grey panel.
- **Source:** the SiteOrigin `ys-milestones` widget. It appears on 9 EN stories and their 9 CS counterparts (census
  `ys-milestones`, 36 instances).
- **EDS:** the `Timeline` block, one row per milestone: `year | title | image | description [| space]`.
- **Source references:**
  - steering wheel: `/en/skoda-world/steering-wheel-decades-of-changes/` (11 entries, green, 14pt titles);
  - iconic cars: `/en/125-let-skode/125-years-of-skoda-iconic-cars/` (16 entries, black pills, 18pt titles, 4:3
    images, one entry with two stacked images);
  - wheels: `/en/skoda-world/wheels-decades-of-transformation/` and gear stick:
    `/en/skoda-world/innovation-and-technology/gear-stick-decades-of-transformation/` (an 18pt maker, a 24pt model
    line and a 16px note as separate paragraphs).
- **Draft QA pages:** `/drafts/skoda-815-steering-wheel` (`Timeline`), `/drafts/skoda-815-iconic-cars`
  (`Timeline (black, large)`), `/drafts/skoda-815-wheels` and `/drafts/skoda-815-gear-stick` (`Timeline (xl)`).

## 2. Structure (source)
- `section.milestones > ul > li`, each holding:
  - `.line > .year`: the pill, its colour an inline `background` (`#99cc00`, or `#000000` on iconic cars);
  - `.flex > .title > p`: the title, inline `font-size` spans (14pt, 18pt, or 18pt with a 24pt model line), the model
    in `<strong>`;
  - `.thumbnail > img`: one image, or two stacked (iconic cars, 1970);
  - `.description > .dot + p`: the text with links and Škodapedia `term-explain` spans.
- **Census:** all 9 EN stories share this shape.
  - **Title sizes:** 14pt on steering-wheel, headlamps and audio; 18pt on iconic cars, hands-free, engine-starting and
    watch-out; 18pt with a 24pt model line on wheels and gear-stick.
  - **Images and pills:** the images are square everywhere except iconic cars, and the pills green except iconic cars.

## 3. Measured visual spec (live)
- **Panel:** background `rgb(228,228,228)` (`#e4e4e4`), padding 64 top/bottom; inline 30 two-sided, 120 left / 30
  right one-sided. It sits 40px below the paragraph before it and 42px above the next heading. The block's
  `margin-top` collapses with that paragraph's 20px margin, so it is 40px itself.
- **Line:** 12px white. One-sided, its centre is 70px left of the content; two-sided, it is centred
  (`calc(50% - 6px)`).
- **Year pill:** 32px / 48px, weight 600, white, padding 15/10, its top 45px above the entry. It is centred on the line
  (90×78 for 4 digits on steering wheel, 79×78 on iconic cars).
- **Dot:** a 24px `border-box` circle in the pill colour with a 6px `rgb(228,228,228)` (panel grey) border, so a 12px
  dot in a grey ring that cuts it out of the line. It is level with the description top and centred on the line.
- **Title:** one or more paragraphs, each with a 20px bottom margin.
  - **14pt and 18pt widgets:** one `p` (lines split by `<br>`), 16/24 with 18.6667px (14pt) or 24px (18pt) spans: a
    28px or 36px line box.
  - **Wheels and gear stick:** separate paragraphs. The maker (18pt spans) is 24 / 36, the all-bold model (24pt spans)
    32 / 48 weight 600, and the "(vehicle on display: …)" note is plain 16 / 24.
  - **Extra space above:** an inline `margin-top: 15px` on the first title paragraph (steering wheel, entries 1, 4, 7,
    10) or a leading spacer `<p>&nbsp;</p>` (24px line + 20px margin = 44px; iconic cars, 1970).
  - **One-sided:** padding-bottom 30.
  - **Two-sided:** the title keeps to the left 45% (padding-right 55%) with padding-bottom 60.
- **Image:** the full column width at its own ratio.
  - **One-sided:** padding-bottom 30.
  - **Two-sided:** left half, padding-right 26, padding-bottom 100.
  - **Stacked images:** the second has a 16px top padding.
- **Description:** `p` 16/24, `rgb(22,23,24)`, margin-bottom 20; padding-bottom 100. Two-sided, it takes the right
  half with padding-left 26.
- **Description links:** `rgb(65,148,104)` (`--skoda-green-accent`) at rest, `rgb(22,23,24)` on hover, no
  underline. They are styled in the block until the body-link fix (#386) lands globally.
- **Last entry:** the image and the description pad 50 instead of 100. The title keeps its own padding.
- **Switch:** one-sided up to 1079px viewport, two-sided from 1080, a viewport switch on the source.

Entry 2 of each story, measured boxes relative to the panel (x) and the entry (y). Source and EDS are identical at
every width:

| Story @ width | Panel w | Pill x,y w×h | Image x,y w×h | Description x,y w | Dot x |
|---|---|---|---|---|---|
| steering wheel @1440 | 819 | 364,−45 90×78 | 30,164 353×353 | 435,164 353 | 397 |
| steering wheel @1080 | 707 | 308,−45 90×78 | 30,164 297×297 | 379,164 297 | 341 |
| steering wheel @1079 | 706 | 5,−45 90×78 | 120,134 556×556 | 120,720 556 | 38 |
| steering wheel @992 | 648 | 5,−45 90×78 | 120,134 498×498 | 120,662 498 | 38 |
| steering wheel @768 | 499 | 5,−45 90×78 | 120,134 349×349 | 120,513 349 | 38 |
| steering wheel @375 | 355 | 5,−45 90×78 | 120,134 205×205 | 120,369 205 | 38 |
| iconic cars @1440 | 819 | 370,−45 79×78 | 30,116 353×265 | 435,116 353 | 397 |
| iconic cars @1080 | 707 | 314,−45 79×78 | 30,116 297×223 | 379,116 297 | 341 |
| iconic cars @1079 | 706 | 10,−45 79×78 | 120,86 556×417 | 120,533 556 | 38 |
| iconic cars @992 | 648 | 10,−45 79×78 | 120,86 498×373 (EDS 374) | 120,489 (EDS 490) 498 | 38 |
| iconic cars @768 | 499 | 10,−45 79×78 | 120,86 349×261 | 120,377 349 | 38 |
| iconic cars @375 | 355 | 10,−45 79×78 | 120,122 205×154 | 120,306 205 | 38 |

Entry heights, source minus EDS: 0 for every entry at every width, except the deviations in §7.

Between blocks and the dot's border (PR #373 review), source and EDS at 1440 / 1080 / 992 / 768 / 375, both stories:

| Measure | Source | EDS |
|---|---|---|
| last `p` before the widget → panel top | 40 | 40 |
| dot | 24×24 `border-box`, 6px solid `rgb(228,228,228)` | same |
| description link at rest / hover | `rgb(65,148,104)` / `rgb(22,23,24)`, no underline | same |

## 4. EDS implementation
- **Block:** `blocks/timeline`.
  - `timeline.js` renders an `ol.timeline-list` of `li.timeline-entry`. Each entry has a `p.timeline-year`, a
    `div.timeline-title` (the title's paragraphs, as the source's: an all-bold one is `.timeline-title-model`, one
    starting with "(" `.timeline-title-note`), a `div.timeline-media` (every picture, lazy) and a `div.timeline-text`.
  - The optional fifth cell, a pixel count, becomes the entry's `--timeline-title-space` (clamped to 200px), the
    title's top padding.
  - The line (`li::before`) and the dot (`.timeline-text::before`) are CSS.
- **CSS:** `timeline.css`; every measured value is a `--timeline-*` token on `.timeline`. The colours come from
  `styles/brand.css`: `--skoda-grey-225` (`#e4e4e4`) and `--skoda-lime` (`#9c0`), both added for this block.
- **Layers:**
  - **L1:** the left rail.
  - **L2:** the block is its own `inline-size` container.
  - **L3:** `@media (width >= 1080px)` (the source's viewport switch), held back by `@container timeline (width >=
    600px)`, so a timeline inside a narrow Columns cell keeps the rail (checked on the draft at 1440: a 400 or 599px
    wide block stays one-sided, 600px turns two-sided).
- **Variants:**
  - `Timeline (black)`: the black pill and dot.
  - `Timeline (large)`: 24px / 36px titles.
  - `Timeline (xl)`: the maker 24 / 36, the model 32 / 48, the note 16 / 24.
  - They combine (`Timeline (black, large)`).
- **Importer:** `tools/importer/parsers/story-flatten.js` `milestonesCells`.
  - **Variants:** `black` comes from the first pill's inline background; `large` from a dominant inline title size of
    18pt, `xl` of 24pt.
  - **Space:** the fifth cell comes only from the two source patterns above, marked in `import-story-detail.js`
    preprocess (`markMilestoneSpaces`), because helix-importer's preProcess drops the empty spacer paragraph. The rows
    keep four cells when no entry has space.
  - **Title:** keeps `p`, `br`, `strong`/`em` and links (href only). The font-size spans and the `term-explain`
    markup are unwrapped, and a `<br>` that closes the bold model is moved after the `<strong>`.

## 5. Authoring
| Year | Title | Image | Description | Space (optional) |
|---|---|---|---|---|
| 1905 | Laurin & Klement / **VOITURETTE A** / (vehicle on display: 1905) | (image) | The first car produced by … | 15 |

- **Space:** a plain pixel count above the title (`15`, `44`); anything else is ignored.

- **A full four-cell row keeps its columns:** a blank year cell means no pill, a blank image cell no image, and the
  title and description stay in their columns (the importer always writes four cells). The image may sit in any cell.
- **A shorter row** (an author removed cells) is read by content.
  - **Image:** found by its picture.
  - **No year:** a first text cell longer than a 12-character label is the title, and the entry has no pill.
- **Empty rows:** dropped.
- **Links:** every timeline link opens in a new tab (`target="_blank"`, `rel` + `noopener`), as the source widget's.
  DA keeps only the `href`, so the block sets it.

## 6. Accessibility
- **Order:** an ordered list in source order.
- **No headings:** the titles are paragraphs, as the source's. The page outline is the source's: the timeline adds no
  headings, and Lighthouse's `heading-order` no longer points at the timeline (PR #373 review).
- **Decoration:** the line and the dots are decorative pseudo-elements. The year is real text.

## 7. Deviations from origin
None of these is accepted until a human reviewer approves it (AGENTS.md code review, step 8).

**Fixed at the human reviewer's request (PR #373, 2026-10-21), no longer deviations:**
- **Title spacing:** steering-wheel entries 1, 4, 7 and 10 (inline `margin-top: 15px`) and iconic cars 1970 (spacer
  paragraph, 44px). They now carry the row's fifth cell (§5); entry heights match at every width.
- **24pt model line (wheels, gear stick):** `Timeline (xl)` sizes the model line 32 / 48, the maker 24 / 36 and the note
  16 / 24.
- **Title semantics:** the titles are paragraphs, as the source's. The timeline adds no headings.

**Open:**
3. **Text wrap:** at 992 (iconic cars, 2019) and 768 (iconic cars, 1936) one description wraps one line differently
   (±24px). The text and width are identical; the likely cause is the font stack (`SKODA Next` vs the EDS fallback
   chain). The 375 steering-wheel and gear-stick wraps came from the QA drafts losing the source's non-breaking spaces,
   and are gone.
6. **Link `rel`:** every timeline link opens in a new tab, as origin's. Its `rel` is `noopener`, as origin's, except
   links to the live host, which `scripts/links.js` gives `noopener noreferrer`.
