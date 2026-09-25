# SKODA-816, Story hero: title above 16:9 image + caption (perex, date, category)
- **Epic:** E08, Editorial at Scale
- **Type:** import + block variant
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity, feeds SKODA-604)
- **GitHub issue:** [#119](https://github.com/skoda-storyboard/demo/issues/119)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-25):** ✅ **Done.** The code landed in PR #113 (first pass) and PR #155 (a single Hero Image
  with the caption inside). The re-import and publish of all 18 stories in DA plus the live rendered QA were done
  on 2026-09-25 (see "Re-import + QA"). The narrow-width hero width delta is SKODA-826's page gutter.

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
- [x] 1440: title centred above a 16:9 image of about 970×546; the caption (perex, then date + label) sits below the image, left-aligned.
- [x] Date and linked category share the same metadata row inside the hero;
      no separate Tags block is emitted for the hero category.
- [x] ≤1079: image first, then title, then caption (hero.md §4); 28px title at ≤768.
- [x] Other templates' `hero-banner` output unchanged.
- [x] Lint + importer/block tests green; re-imported Epiq story previewed,
      published and compared using Chrome computed CSS/DOM at 1440, 1024,
      768, 500 and breakpoint edges (no screenshots).
- [x] **Amendment (2026-09-25, sweep reconciliation):** perex 20/600/30 **in the hero** (the Epiq perex is missing
      today). Date 12/300 **inline with the category pill**, not a 16px `<p>` on its own row. 0 flex gap under the H1.
      10px page gutter is a separate SKODA-826 dependency. Re-import the heroes
      that still use the older overlaid layout.

## Dependencies
SKODA-202 (hero-image block), SKODA-801 (story import path); SKODA-826
for site-wide gutter parity before visual sign-off.

## Re-import + QA (2026-09-25)
**DA before:** none of the 18 stories in DA had the final hero. 7 still used the overlay `Hero`
(an-electric-car…, even-opening-the-door…, peaq-sets-a-record…, the-skoda-peaq-will-win-you-over-fast,
skoda-classic-tour…, the-versatile-octavia…, what-was-racing-like…). The other 11 (Epiq included) had the #113 interim shape: a
2-row Hero Image, then perex, date and a separate Tags block.

**Re-import:** the current story-detail bundle (a fresh build from `main` is byte-identical to the committed one)
ran for all 18. Each page was checked against its DA version:
- 0 content lost: every DA text block, image and link is kept. Two exceptions, both intended: the old YouTube
  poster/"Play"/nocookie markup becomes one YouTube link that `scripts.js` embeds (818), and the duplicated sidebar
  teaser links go (817).
- The 10 interim pages (Epiq aside) change only in the hero (plus the accepted 501 caption split on some). The 7 overlay pages
  also pick up the other importer fixes on `main`: clean Title (610), YouTube embed (818), de-duplicated sidebar
  (817), and a Related Stories rail.

**Publish:** `media:apply`, then `import:push --stage push,preview,publish`, gave `update` ×17 (DA/preview/live 200,
indexed).
- A first batch went live with source renditions, because `media:apply` rejects the whole batch when one page has an
  unresolved image and the push wasn't gated on its exit code. The 16 resolvable pages were re-published the same
  hour, with all 305 image `src`s checked against manifest delivery URLs.
- `even-opening-the-door…` keeps source renditions: 2 masters (50/40 MB) have no delivery rendition under the 10 MB
  limit (SKODA-506).
- **Epiq** (stakeholder decision: swap the hero only): DA held hand edits, `Gallery (slider)` ×3 (SKODA-819; the
  importer doesn't emit it yet) and a `Cards (overlay)` sidebar. Only the first section was replaced with the
  importer's new Hero Image section, and the Title cleaned. The diff against DA is exactly the hero and the Title.
  It was force-pushed (`overwrite`); the prior DA doc is kept in the scratch run.

**Rendered QA (live `.aem.live`, Chrome computed CSS/DOM, no screenshots):**

| Width | Order | H1 | Image | Perex | Date + pill |
|---|---|---|---|---|---|
| 1440 | title → image → caption | 40/44/600, centred, y=124 (source 124) | 970×546 at y=200 (source 200); H1→image 32px = source | 20/30/600 | 12/300 + `#7c7d7e`/white 11px uppercase `5px 10px`, same row |
| 1080 | title → image → caption | same | 970×546 | 20/30/600 | same row |
| 1079 / 1024 | image → title → caption | 40px, left | 970×546 / 944×531 | 20/30/600 | same row |
| 768 / 767 / 500 | image → title → caption | **28px**/30.8 | 720 / 719 / 452 wide, 16:9 | 20/30/600 | same row |

- All 18 live stories at 1440 and 767 have the Hero Image with the image loaded, the perex and category row inside
  it, no separate hero Tags block, the footer rendered, and the expected order.
- **Not 816:**
  - Widths at 1024/768/500 are 944/720/452 against the source's 970/748/480: the 40/24px page gutter (SKODA-826, #149).
  - Horizontal overflow from 1080–~1180px comes from the **header** nav row (`nav-sections` + `nav-tools` run
    101px past the viewport). Logged on SKODA-308.
  - `big-possibilities-in-a-small-package…` loads an unknown `version` block (404): a source spec table passes through
    as a raw table and is read as a block named after its first cell. It was already in DA, so it's not a regression.
    It's already covered by SKODA-801a's pending `spec-table-versions` contract.
