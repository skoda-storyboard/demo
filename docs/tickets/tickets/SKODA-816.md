# SKODA-816, Story hero: title above 16:9 image + caption (perex, date, category)
- **Epic:** E08, Editorial at Scale
- **Type:** import + block variant
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity, feeds SKODA-604)
- **GitHub issue:** [#119](https://github.com/skoda-storyboard/demo/issues/119)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🟡 In progress. PR #113 merged the first importer pass
  (Hero Image followed by separate perex, date and Tags). Those separate EDS
  wrappers cannot form the source's single caption. Importer/block changes and
  a re-import/QA remain; do not accept until rendered and published verification.

## Origin
Side-by-side QA of `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`
(source vs `main--demo--skoda-storyboard.aem.page`, 2026-09-24; refreshed
2026-09-25 using Chrome DOM/computed-CSS extraction, no screenshots). EDS
URLs without a trailing slash resolve; the slash-suffixed EDS URL returns 404.

## Problem (measured)
| | Source (`.hero`, 1440) | EDS |
|---|---|---|
| Title | `h1` 40px/44px/600 `#161718`, centred above the image | Typography/order fixed in #113; title y=124 at 1440, matching source |
| Image | 16:9, 970×546, centred, y=200 at 1440 | 970×546 but y=216 (extra 16px flex gap); at 1024/768/500 EDS width 944/720/452 vs source 970/748/480 due 40px/24px wrapper padding |
| Perex | 20px/30px/600 ink, below image, x=106 at 1440 | 16px/400 in a separate `.default-content-wrapper` |
| Date + category | `15. 9. 2026` (12px/18px/300) + linked `EMOBILITY` label (`#7c7d7e` bg, white, 11px uppercase, `5px 10px`) on the same row | date in a separate 16px paragraph; category in a separate Tags block |

## Cause
The original overlay `hero-banner` routing was fixed in PR #113: the
story-scoped `story-hero` parser emits `Hero Image`. It still emits the
caption outside the block, and `hero-image.js` puts all authored text in
one heading container. Neither CSS alone nor a separate Tags block can
place the perex and linked category beneath the image in the same caption.

## Scope
- Update story-scoped `story-hero.js` to emit **one Hero Image** block: image,
  `<h1>`, perex, then a metadata row with the source date and category anchor.
  Keep the anchor destination; do not alter the page/archive `hero-banner`.
- Reuse Tags **design tokens** (`--tag-*`, `--skoda-grey-500`) in scoped
  `.hero-image` CSS for the category link, not a second `Tags` block. The
  aside's independent Tags block remains unchanged.
- Split story heading/caption DOM in `hero-image.js`: desktop title → image
  → caption; ≤1079 image → title → caption. Set the perex to 20px/30px/600;
  align metadata inline. **SKODA-826** owns the shared page gutter; do not
  add a story-only gutter override here.

## Acceptance Criteria
- [ ] 1440: title centred above a 16:9 image of about 970×546; the caption (perex, then date + label) sits below the image, left-aligned.
- [ ] Date and linked category share the same metadata row inside the hero;
      no separate Tags block is emitted for the hero category.
- [ ] ≤1079: image first, then title, then caption (hero.md §4); 28px title at ≤768.
- [ ] Other templates' `hero-banner` output unchanged.
- [ ] Lint + importer/block tests green; re-imported Epiq story previewed,
      published and compared using Chrome computed CSS/DOM at 1440, 1024,
      768, 500 and breakpoint edges (no screenshots).
- [ ] **Amendment (2026-09-25, sweep reconciliation):** perex 20/600/30 **in the hero** (the Epiq perex is missing
      today). Date 12/300 **inline with the category pill**, not a 16px `<p>` on its own row. 0 flex gap under the H1.
      10px page gutter is a separate SKODA-826 dependency. Re-import the heroes
      that still use the older overlaid layout.

## Dependencies
SKODA-202 (hero-image block), SKODA-801 (story import path); SKODA-826
for site-wide gutter parity before visual sign-off.
