# Component Spec: in-column highlight panel (story dark box + press-release grey callout)

Status: **CAPTURED + BUILT** (2026-10-05, Playwright computed boxes on the live site and on the draft pages; SKODA-824).
Contract: `highlight` (section style, shape 2) in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../planning/SKODA-PENDING-BLOCK-CONTRACTS.md).

## 1. Identity
- **Component:** a coloured box inside the article text column.
  - **Stories:** a SiteOrigin row with a background (`.panel-row-style`, `#0e3a2f`) holding h3 + text + an optional
    image, or a 2-cell row.
  - **Press releases:** a `div[style*=background]` callout (`#f3f3f3`, padding 25px) in `.entry-content`.
- **EDS:** not a block. It is a section with Section Metadata `Style` = `body-column, highlight-dark` or
  `body-column, highlight-grey`. The body resumes after it in a new `body-column` section. Nested blocks (Columns,
  Gallery) stay inside the panel.
- **Source references:**
  - Epiq: `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/` (one panel, h3 + list + image);
  - charging: `/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones/` (two joined panels, the first a
    2-cell row);
  - Kylaq / paper Kodiaq: three panels each;
  - Zellmer: `/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company/` (grey FAQ callout).
- **Draft QA pages:** `/drafts/skoda-824-highlight` (charging + Epiq panels), `/drafts/skoda-824-highlight-press-release`
  (Zellmer).

## 2. Structure (source)
- **Story:**
  - `.panel-grid.panel-has-style > .panel-row-style` (background, `padding-top: 32px` from 768) `> .panel-grid-cell`
    (`padding: 10px`) `> .so-panel` (widget margin `15px` up to 780, `0 15px` from 781);
  - the rows before and after keep their own 10px cell padding, and the panel touches them;
  - consecutive panels: the second row has `margin-top: -40px`, over the first's empty bottom.
- **Press release:** the callout `div` is the text column's own width, `padding: 25px`, black paragraphs.

## 3. Measured visual spec (live)
| Width | Dark box (x, w) | Content x / w | Top inset | Bottom inset | h3 |
|---|---|---|---|---|---|
| 1440 | 96, 839 | 121 / 789 | 42 (32 + 10) | 10 + last margin (30 after a p) | 24 / 27.6, weight 300, white |
| 1080 | 0, 727 | 25 / 677 | 42 | 30 | 24 / 27.6 |
| 992 | 0, 668 | 25 / 618 | 42 | 30 | 24 / 27.6 |
| 781 | 0, 527 | 25 / 477 | 42 | 30 | 24 / 27.6 |
| 780 / 768 | 0, 527 / 519 | 25 / 477 · 469 | 57 (32 + 10 + 15) | 25 + last margin (45) | 20 / 23 (≤768), 24 / 27.6 (769+) |
| 390 | 0, 390 (full bleed) | 25 / 340 | 25 (10 + 15) | 45 | 20 / 23 |

- **Text and media:**
  - p 16/24 weight 400, white, margin-bottom 20;
  - images fill the content width (789×444 Epiq @1440, 340 @390);
  - links `rgb(65,148,104)`, no underline (paper Kodiaq).
- **Box width:** the body text track plus 10px, so it ends at the aside's edge (839 = 828.7 + 10 @1440; 519 @768).
- **Neighbours:** the panel touches the body. The source gap is the neighbouring cells' 10px padding plus the last
  child's margin, and author spacer widgets (`skoda-offset`, 24px) where they exist.
- **Joined panels (charging):** 839×397 + 839×1004, the second starting 40px inside the first. Their text is 32px apart.
- **Grey callout:**

  | Width | Box | Padding | Colours |
  |---|---|---|---|
  | 1440 | 106, 812 | 25 | `rgb(243,243,243)`; p 16/24 `#000`, strong 600 |
  | 768 | 10, 492 | 25 | same |
  | 390 | 10, 370 | 25 | same |

EDS (draft pages, 2026-10-05) matches every row of the box table: box, content x/w and top inset are
identical at 1440 / 1080 / 992 / 781 / 780 / 768 / 390, including the 780 → 781 inset step.

## 4. EDS implementation
- **Importer:**
  - `parsers/story-flatten.js` (`markHighlights()` in `import-story-detail.js` preprocess);
  - `transformers/skoda-press-release-layout.js`;
  - 16 dark sections on 11 M1 stories, plus the Zellmer grey section.
- **Colours** (`styles/styles.css`, global):
  - `--highlight-dark-bg` (`--dark-color`) / `--highlight-dark-color` (white);
  - `--highlight-grey-bg` (`--skoda-grey-75` `#f3f3f3`) / `--highlight-grey-color` (black);
  - headings inherit the panel colour, nested blocks included.
  - Dark-panel links use `--highlight-dark-link-color` `#55ad80`. That is the source green lightened in hue, for
    WCAG AA (4.6:1, against 3.4:1).
- **Story geometry** (`styles/styles.css`):
  - the panel padding is composed from tokens: `--highlight-row-top` (0 → 32px at 768), `--story-inset` (the 10px
    cell), `--highlight-widget-block` (15px → 0 at 781) and `--highlight-widget-inline` (15px);
  - from 768 the panel takes `margin-inline-end: -10px`, which is the body track plus the inset;
  - panel images (`picture`, `img`) are `display: block`, as on the source. Inline, they left a 7px baseline gap, which
    made the panel 6.5–7px taller (PR #252 review). The Epiq panel now measures 771.2 / 708.2 / 620.1 / 640.6 / 631.3
    at 1440 / 1080 / 781 / 768 / 390, against the source's 772.2 / 709.2 / 621.1 / 640.6 / 631.3;
  - body neighbours drop their 40px section margin on the panel side and keep 10px of padding;
  - joined panels: the first drops its bottom inset, and the second starts 10px down (text 30px apart, 32 on the
    source).
- **Press-release geometry** (`templates/press-release/press-release.css`): the section is inset by the 10px gutter
  and padded 25px.
- **Sidebar span** (`scripts/split-body.js`):
  - `spanSidebar(main)` runs from `decorateStorySections` / `decorateTemplateSections`;
  - it counts the `body-column` run that the sidebar closes, and sets `--body-row-start`, `--body-rows` and
    `--body-rows-before-last`;
  - both grids span the sidebar from the first part, and `grid-template-rows: repeat(n, auto) 1fr` gives the slack
    to the last part, so the parts stay flush when the aside is taller;
  - without a split nothing is set, and the layout is unchanged (verified identical to `main` on 7 non-panel pages
    at 1440 / 768 / 390).

## 5. Known differences
- **Columns inside a panel (charging row 1)** belongs to the Columns block, not the panel:
  - the cell h2 renders 34/42.5 weight 600 with a 27px top margin, against 40/45 weight 300 with none, so the first
    content is 79px down against 42;
  - the image cell lacks the source widget's own 15px inline margin: image 182 against 150 wide @1440, text cell
    586 against 594 wide.
  - See [`columns-split.md`](columns-split.md) §5.
- **Zellmer callout:** one line shorter (278 against 302 @1440). The importer folds the source's doubled `<br>` after
  "Frequently Asked Questions:".
- **Spacer widgets:** like every story (SKODA-801), the importer drops the `skoda-offset` spacers, so the body after a
  panel starts 24px higher at 781 and up.
