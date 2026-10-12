# SKODA-209a, Archive pager: the source's "6 / N" count row and Load more spacing
- **Epic:** E02, Core Blocks (follow-up to SKODA-209, #58)
- **Type:** block (Stories feed on category / tag archives) + source parity
- **Phase:** A · **Milestone:** M1 (15 Oct demo)
- **GitHub issue:** [#330](https://github.com/skoda-storyboard/demo/issues/330)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-10-12):** 🟡 Built on branch `skoda-209a-archive-pager`, PR open; awaiting QA (was 🔵 TODO 2026-10-11)

## Problem (manual review, 2026-10-11)
SKODA-209 removed the source pager at import and never rebuilt it. On every category and tag archive:
- no count row under the grid;
- last card → Load more was 36 (source 109);
- Load more → footer was 56 (source 32);
- a short archive (Fabia tag) left 63–142px of blank space above the footer: `main` `min-height` (SKODA-305)
  pushed it to the bottom of the window, while the source's footer follows the content.

## Source (measured 2026-10-12, Chrome DevTools, `/en/category/emobility/`, `/en/tag/model/octavia/`)
`div.search-results-pagination` between `.search-results-items` and `.ajax-loader-button-wrapper`:
- **Box:** padding `8px 0`, margin `16px 0`, 24px line, `1px solid #c9cdd3` bottom border → 41px. Full content width.
- **Text:** `span.current` + `span.total`, 16px / 500 / `#aeaeae`. `.total::before` is `"/"` with `padding-right: .3em`.
  The source ships no 500 face (SKODA Next 300/400/600/700), so it renders as 400.
- **Rhythm:** last card → count 36 (the grid's trailing 20px gutter + 16 margin), count → Load more wrapper 16,
  wrapper padding 16, wrapper → footer 16 (`.archive-results` margin-bottom). Last card → Load more 109, Load more → footer 32.
- Model tags start at "4 / N" (the featured model card takes two slots), then +6 per Load more.
- The home "Latest Stories" feed (the only other `stories` user) has **no** count row (`stories.md` §2).

## Decision (2026-10-12, user)
The archive pages carry `template: page`, the same as the home page, and the JS guardrail forbids page-type
guessing. So the switch is **authored**:
- The count row comes with the archive grid: an authored number of `columns` (all 41 archives author `columns 3`).
  The home featured feed has none.
- An authored `count` row (`true` / `false`) overrides the default.
- No re-import, no publish: code only.

Short pages: `main` `min-height` is dropped where the feed has a count row (archives). SKODA-305 keeps it everywhere else.

## Built
- **`blocks/stories/stories.js`**
  - `parseFeedConfig` adds `count`.
  - `renderCount(countEl, shown, total)` fills `div.stories-count` (`span.stories-count-current`, `span.stories-count-total`)
    and hides it once every story is shown.
  - The row sits between the grid and Load more. It is the polite live region, so a Load more reads out the new count.
    The visible "N stories shown" status line no longer appears under it. The home feed keeps that line.
  - The block gets `has-count`.
- **`blocks/stories/stories.css`**
  - The count row (tokens `--spacing-xs` / `--spacing-m`, `--weight-medium`, `--pagination-border`,
    new `--pagination-count-color: #aeaeae` in `brand.css`).
  - An empty `.stories-loadmore` is hidden.
  - The last section holding a `.stories.has-count` ends `--spacing-m` (16px) under Load more.
  - `main:has(.stories.has-count)` drops `min-height`.
- **Tests:** 5 new in `stories.test.mjs` (grid default, authored override, "6 / N" → "12 / N", hidden when everything
  fits, the count follows the paginated slice).

## Verified (2026-10-12)
Source vs branch preview, Playwright + Chrome DevTools (no screenshots), 1440 / 992 / 768 / 375:
- **`category/emobility`, `category/models`:** count box, typography, colour, border and width are equal at
  every viewport. Last card → count 36, count → wrapper 16, last card → Load more 109, Load more → footer 32.
  Footer page position and document height are identical.
- **`tag/model/octavia`:** the same at 768 / 375. At 1440 / 992 the footer top is identical and the document height is
  within 1px. The source's raw "last card" figure at 992 includes its taller featured-model card.
- **The count reads "6 / N" and changes to "12 / N" on Load more** (Octavia: 4 → 10). N is the scoped index count:
  34 eMobility and 32 Models stories are migrated (the source shows 205 / 585).
- **`tag/model/fabia`** (2 migrated stories): no count row, no Load more. The footer sits 36px under the last card
  (1440: footer top 873 in a 900px window).
- **Home `/en`:** unchanged vs `main`. Same geometry from the feed to the footer, no count row.
- **CLS (Lighthouse 12):**

  | Page | `main` | Branch |
  |---|---|---|
  | Fabia, mobile | 0.0001 | 0.0001 |
  | eMobility, mobile | 0 | 0 |
  | Fabia, desktop | 0.0031 | 0.0035 |

  Mobile performance scores are equal (93 / 87).
- `npm run test:blocks` 472/472. ESLint and Stylelint are clean on the changed files.

## Out of scope
Card styles, the term hero (SKODA-828).

## Dependencies
#58 (SKODA-209), #328 (listing count + Load more spacing), #308 (series hub footer gap), #42 (CLS).
Spec: `docs/ui-specs/template-category-archive.md` §4 / §5 / §6.
