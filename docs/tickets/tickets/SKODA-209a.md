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
  wrapper padding 16, wrapper → footer 16 (`.search-results` margin-bottom). Last card → Load more 109, Load more → footer 32.
- **When every story fits, the source keeps the count row** ("3 / 3" on `category/design-eng`, "6 / 6" on
  `tag/environment/greenfuture`) and has no button wrapper. Last card → footer is 93 (36 + 41 + 16).
- **The bottom margin depends on the archive type** (all 41 measured at 1440):
  - categories and model tags: `.search-results` margin-bottom 16 (Load more → footer 32);
  - company, crew, derivative, environment, people and years tags (13 pages): 48 (Load more → footer 64).
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

**Regression review (2026-10-12, user decisions):**
- **The source wins over the issue's "no count row when every story fits":** the row stays ("3 / 3") and hides only
  with no stories. This also restores the screen-reader announcement on the last Load more. Before the change it
  was silent: the row hid, and the status line is not used on archives.
- **Known deviation, accepted for M1 (fixed 2026-10-22 by SKODA-209):** the 13 non-model tag archives end 16px
  under the pager, where the source has 48 (32px short; `main` had 40). *They are Media Room pages on the source;
  they now get the Media Room chrome from bulk metadata, and the Stories grid ends 48px on a Media Room page.* The block settings can't tell them apart from model tags (Kylaq and Slavia
  have no featured card either). Matching the source needs an authored setting and a re-push of those 13 pages,
  which is planned after the demo.
- **Not changed (reviewed):**
  - On page load the count row, a live region, reads "6 / N". The listing does the same.
  - The Stories entry in the DA library (`tools/library`) doesn't mention `count`.

## Built
- **`blocks/stories/stories.js`**
  - `parseFeedConfig` adds `count`.
  - `renderCount(countEl, shown, total)` fills `div.stories-count` (`span.stories-count-current`, `span.stories-count-total`)
    It stays when every story is shown ("3 / 3") and hides only with no stories.
  - The row sits between the grid and Load more. It is the polite live region, so a Load more reads out the new count.
    The visible "N stories shown" status line no longer appears under it. The home feed keeps that line.
  - The block gets `has-count`.
- **`blocks/stories/stories.css`**
  - The count row (tokens `--spacing-xs` / `--spacing-m`, `--weight-medium`, `--pagination-border`,
    new `--pagination-count-color: #aeaeae` in `brand.css`).
  - An empty `.stories-loadmore` is hidden.
  - The last section holding a `.stories.has-count` ends `--spacing-m` (16px) under Load more.
  - `main:has(.stories.has-count)` drops `min-height`.
- **Tests:** 5 new in `stories.test.mjs`:
  - the grid default;
  - the authored override;
  - "6 / N" → "12 / N";
  - "N / N" kept when everything fits, hidden with 0 stories;
  - the count follows the paginated slice.

## Verified (2026-10-12)
Source vs branch preview, Playwright + Chrome DevTools (no screenshots), 1440 / 992 / 768 / 375:
- **`category/emobility`, `category/models`:** count box, typography, colour, border and width are equal at
  every viewport. Last card → count 36, count → wrapper 16, last card → Load more 109, Load more → footer 32.
  Footer page position and document height are identical.
- **`tag/model/octavia`:** the same at 768 / 375. At 1440 / 992 the footer top is identical and the document height is
  within 1px. The source's raw "last card" figure at 992 includes its taller featured-model card.
- **The count reads "6 / N" and changes to "12 / N" on Load more** (Octavia: 4 → 10). N is the scoped index count:
  34 eMobility and 32 Models stories are migrated (the source shows 205 / 585).
- **`tag/model/fabia`** (2 migrated stories): "2 / 2", no Load more, and the footer follows the content.
  It was pushed to the fold by `min-height`.
- **All 41 archives, `main` vs branch, at 1440 and 375** (`.migration/skoda-209a/review/`):
  - Nothing above the count row moves: the cards, the grid position, the first card box and Load more presence are identical.
  - There are no console errors.
  - The count total equals the cards you get by using every Load more.
  - Against the source:
    - **24 archives match.** Last card → footer is 93 when everything fits and 185 with Load more.
    - **13 non-model tags** are the deviation above.
    - **4 categories** have no migrated stories (classic-cars, concepts, corporate-life, lifestyle/people). They show "Nothing to show yet." This is content, not code.
- **Deep link and history:** `?offset=12` gives "12 / 34", Load more → "18 / 34", and back / forward restore both.
- **Screen readers:** each Load more reads the new count, up to "34 / 34" on the last one. Focus moves to the first new card.
- **Tall windows:**
  - At 1440×2000 a full archive leaves 148px of white below the footer, the same as the source.
    With `min-height`, `main` left none.
  - At 1920×1200 and 2560×1440 nothing is left over.
- **Home, all stories loaded** (`?offset=9999`): the empty Load more band is gone, so the feed's last card →
  next band is 68 instead of 100. On the source archives, an exhausted pager also has no button wrapper.
- **Home `/en`:** unchanged vs `main`. Same geometry from the feed to the footer, no count row.
- **CLS (Lighthouse 12):**

  | Page | `main` | Branch |
  |---|---|---|
  | Fabia, mobile | 0.0001 | 0.0001 |
  | eMobility, mobile | 0 | 0 |
  | Fabia, desktop | 0.0031 | 0.0035 |

  Mobile performance scores are equal (93 / 87).
- `npm run test:blocks` 472/472. Scripts, templates, library and poc tests: 194/195. The one failure is
  `scripts/media-cart-download.test.mjs`: the `fflate` package is missing in this environment (unrelated).
  ESLint and Stylelint are clean on the changed files.

## Out of scope
Card styles, the term hero (SKODA-828).

## Dependencies
#58 (SKODA-209), #328 (listing count + Load more spacing), #308 (series hub footer gap), #42 (CLS).
Spec: `docs/ui-specs/template-category-archive.md` §4 / §5 / §6.
