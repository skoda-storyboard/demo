# SKODA-816, Story hero: title above 16:9 image + caption (perex, date, category)
- **Epic:** E08, Editorial at Scale
- **Type:** import + block variant
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity, feeds SKODA-604)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO · **Update (late 2026-09-24):** 🟡 importer half merged in PR #113 (commit
  `e763378`: the new `story-hero` parser emits Hero Image story + perex + date + Tags). Open (≈ 0.5 SP): the hero
  caption's 20px/600 styling and a render check.

## Origin
Side-by-side QA of `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`
(source vs `main--demo--skoda-storyboard.aem.page`, 1440px, 2026-09-24).

## Problem (measured)
| | Source (`.hero`, 1440) | EDS |
|---|---|---|
| Title | `h1` 40px/44px/600 `#161718`, centred **above** the image | 44px/55px/600 **white, overlaid** on the image |
| Image | 16:9, 970×546, centred in a 990px container | cropped to a 380px strip (1440×380 on main, 1248×380 on the branch), `object-fit: cover` |
| Perex | 20px/30px/600 ink, **below** the image, left-aligned to the 1228px container | 16px/400 dark text over the photo, unreadable |
| Date + category | `15. 9. 2026` (0.75em/300) + `EMOBILITY` label (`#7c7d7e` bg, white, 11px uppercase, `5px 10px`) | missing |

## Cause
`tools/importer/import-story-detail.js` routes the story `.hero` through the shared
`hero-banner` parser, which emits the **Hero** (overlay/banner) block and keeps only the perex. The
spec (`docs/ui-specs/hero.md` Variant A, SKODA-202) calls for the `hero-image` story variant, and
that block already renders "title above a 16:9 image" (`blocks/hero-image`).

## Scope
- New story-scoped parser (`tools/importer/parsers/story-hero.js`) emitting **Hero Image**
  (default = story variant): image row + title row + caption row (perex, then a meta paragraph
  holding the date + category link). `hero-banner` stays unchanged for the page/archive templates.
- **Reuse the existing Tags block (SKODA-205) for the category label.** Do not add new label CSS.
  The importer emits the category link as a `Tags` block (same shape the aside already uses) next
  to the date, so the chip styling (`#7c7d7e`, white, 11px uppercase, `5px 10px`) comes from
  `blocks/tags`.
- `blocks/hero-image` (small follow-up, separate from the importer change): story variant renders
  **title → image → caption** on desktop (image → title → caption at ≤1079), with the perex at
  20px/600.

## Acceptance Criteria
- [ ] 1440: title centred above a 16:9 image of about 970×546; the caption (perex, then date + label) sits below the image, left-aligned.
- [ ] ≤1079: image first, then title, then caption (hero.md §4); 28px title at ≤768.
- [ ] Other templates' `hero-banner` output unchanged.
- [ ] Lint + tests green; re-imported Epiq story verified in the browser.

## Dependencies
SKODA-202 (hero-image block), SKODA-801 (story import path).
