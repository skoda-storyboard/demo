# SKODA-610, Clean index titles (drop " - Škoda Storyboard")
- **Epic:** E06, Import Pilot Content
- **Type:** import / metadata
- **Phase:** A · **Milestone:** M1 (demo-visible on every card and rail)
- **GitHub issue:** [#146](https://github.com/skoda-storyboard/demo/issues/146)
- **Estimate:** 1 SP · AI-assisted 0.25–0.5d / manual 0.5–1d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🟡 **Code done (PR #138, branch `skoda-610-clean-titles`); 7 of 28 pages republished**
  (live index 29 → 22 suffixed rows). The other 21 pages are held (see "Republish status").
  - **On `main` before this PR** (re-verified after #110, CDP 1440): `scripts/card-teaser.js:186` trimmed only in
    `buildCardTeaser()`, which covers the stories feed and the promo box. `/en` still had 25 suffixed rail titles
    (and 25 suffixed `img alt`), the index 28 of 31, and search 4 hits.
  - **On the PR branch preview** (2026-09-25, 1440): **0 suffixed card titles and 0 suffixed `img alt`** on `/en`
    (34 cards), the Epiq story (23), search `?q=epiq` (12) and the listing demo (6). Every index consumer gets clean
    rows from `loadQueryIndex()`, and `card-teaser.js` uses the same helper.

## Origin
Demo URL/block sweep, 2026-09-25 (report §5; raised by 4 groups). It was noted before only under SKODA-602 "Follow-ups found".

## Problem (measured)
- Index rows carry the page `<title>`: "The Škoda Peaq Will Win You Over Fast - Škoda Storyboard", "Elroq - Škoda
  Storyboard", "Škoda Auto: Klaus Zellmer to leave the company - Škoda Storyboard".
- On the Epiq Related Stories rail, the card title link wraps to **3 lines (65px)** and is still cut off. The source shows the bare
  title on 1 line (~22px).

## Scope
- `skoda-metadata.js` (+ the mirrored `skoda-metadata-extract.mjs`): write the Metadata `Title` without the site-name
  suffix (source `og:title` / `h1`). Keep the page `<title>` suffix only via the site's head template, if wanted.
- Re-import + republish the imported pages (`npm run import:push`) so the index rebuilds.
- Defensive trim in `story-rail rowToCells` / `carousel` (the path #110 didn't cover), and in the `listing` / `search` result cards, reusing one helper from `scripts/`.

## Acceptance Criteria
- [ ] No `query-index.json` title ends in " - Škoda Storyboard".
- [ ] Related Stories / home rail titles fit the 1-line clamp as on the source; 0 suffixed card titles or `img alt`
      on `/en`, the Epiq story, the listing pages and search.
      *The "0 suffixed" half is met on the branch preview (see Status). The 1-line clamp is rail CSS and is tracked in SKODA-212a.*
- [x] Unit test in `skoda-metadata-extract.test.mjs` (+ `scripts/query-index.test.mjs`).

## Dependencies
SKODA-401 (metadata), SKODA-602 (push tool), SKODA-603 (re-import).

## Implementation (2026-09-25)
**Decisions (stakeholder):** drop the suffix everywhere (the tab, `og:title` and the index all show the clean
title), and add a defensive trim at render time through one shared helper.

- **Importer:** `skoda-metadata-extract.mjs` exports `SITE_SUFFIX` + `cleanTitle()`, and `buildMetaFields` writes a
  clean `Title`. `skoda-metadata.js` mirrors the rule inline, applied to `overrides.title || og:title || <title> || h1`.
  A title that is only the site name (`/en` = "Škoda Storyboard") is kept.
- **Runtime:** `scripts/query-index.js` exports the same `SITE_SUFFIX` / `cleanTitle` / `normalizeRow`, and
  `loadQueryIndex()` cleans every row once. As a result the stories, story-rail, listing, search, search
  suggestions and promo-box rails all show clean titles now, whether or not a page has been republished.
  `card-teaser.js` uses the shared helper instead of its own regex; `search-suggest.js` drops its duplicate.
- **Tests:** 4 new tests in `skoda-metadata-extract.test.mjs`, including one asserting that `skoda-metadata.js` and
  `scripts/query-index.js` declare the identical regex; 4 in the new `scripts/query-index.test.mjs`. `npm test`
  now includes `scripts/**/*.test.mjs`.
- **Bundles:** all 16 `import-*.bundle.js` were rebuilt with `aem-import-helper`. The three M1 bundles used here
  (story-detail, press-release, model-page) differ only in the title rule plus down-levelled syntax. Nine non-M1
  bundles (404, category-archive, company-page, home-mr, page-base, pr-listing, search-listing,
  series-directory, skodapedia) were stale and now also pick up source fixes already on `main` (`%25` link
  decoding, the model facet from the canonical URL).

## Republish status (28 suffixed live rows; `/en` excluded)
QA rule: a 610 re-import may change **only the Title**. Any other difference means the page is held.

| Result | Pages |
|---|---|
| ✅ **Published, clean `<title>` / `og:title` / index row (7)** | practical-fun-stylish-5-reasons-to-choose-the-epiq · an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving · a-true-czech-from-spain · modelling-clay-yoga-simply-epiq-skoda-returns-to-milan · come-and-play-skoda-is-heading-to-milan · a-record-year-for-skoda-electrified-models-also-contribute · big-possibilities-in-a-small-package-the-new-skoda-epiq |
| ⏸ **DA conflict (1)** | skoda-epiq-will-win-you-over-in-just-a-few-seconds: DA holds a newer `Gallery (slider)` version (SKODA-819) that isn't in any push record; a re-push would revert it. Not forced.. **2026-09-25 (816): resolved.** Only the hero was swapped in and the Title cleaned; the slider edits were kept and the page published (clean title). |
| ⏸ **Stale story output (6)** | what-was-racing-like…, the-skoda-peaq-will-win-you-over-fast, the-versatile-octavia…, skoda-classic-tour…, an-electric-car-approaching…, peaq-sets-a-record…: the live version predates 816 (`hero`). The re-import changes the whole page, so it belongs to SKODA-603 W1 / 801a, not a title fix. **2026-09-25 (816): re-imported and published** with the Hero Image, together with the 2 Epiq stories from the 508 row. |
| ⏸ **SKODA-508 caption regression (7)** | 5 press releases (zellmer, national-theatre, superb-25-years, board-of-management, uci) and 2 stories (whats-behind-epiq-design, this-is-epiq…): `skoda-images` adds excerpt paragraphs. **2026-09-25: 508 fixed on branch `skoda-508-card-captions`.** The 5 press releases were republished the same day (approved), and the live index went from 21 to 16 suffixed rows. The 2 stories were never a caption problem: their re-import carries the 816 hero reshape, so they move to "Stale story output" (603 W1 / 801a) |
| ⏸ **Media apply blocked (6)** | even-opening-the-door… (4 unresolved 768px renditions) and 5 press releases with Vimeo poster thumbnails (`i.vimeocdn.com`): unresolved images block `media:apply` |
| ⏸ **SKODA-208 (1)** | skoda-model/elroq: `Hero` + `subheading` + no push record |

The 25 pages whose DA matched the local output were recorded in `push-manifest.json` first (no DA writes), so
future re-pushes take the safe `update` path. `media:build` moved 4 already-ingested Epiq masters from `partial` to
`done` in the AEM DAM (`media-manifest.json`).

**AC status:**
- **Not met yet:** "no suffixed index row". It's met for 7 rows once they're published; the other 21 are held,
  as listed above.
- **Suffix part met on the branch; the one-line clamp is handed to SKODA-212.** On the branch preview
  (Epiq story, 1440), all 10 Related Stories titles are suffix-free. They still wrap to 2–3 lines (43–65px),
  because EDS has **no truncation**: the source cuts each rail title to **one line with "…"**
  (18px/21.6, 22px high, `overflow: hidden`, in 354px cards), and the EDS cells are narrower (the 4-up geometry,
  sweep V2). That's rail visual work in `carousel` / `card-teaser`, so it went to SKODA-212 as an AC
  amendment to avoid colliding with its reopen (now tracked on the rail follow-up **SKODA-212a**).
- **Met:** the unit test.

**Next:**
1. Your approval to publish the 7 pages.
2. SKODA-508, then re-push the 7 caption pages.
3. The remaining pages ride along with SKODA-603 W1 / 801a / 208.

### Publish (2026-09-25, approved)
- A bulk publish of the 7 pages returned live 200 and indexed for all of them.
- The live index went from 29 suffixed rows (of 31) to **22**. `/en` is still "Škoda Storyboard".
- On `.aem.live`, `a-true-czech-from-spain` has `<title>` and `og:title` "A True Czech from Spain", the footer
  renders (908 chars), and the nav has 39 links. Its Related Stories rail still showed suffixed titles in the
  browser: that's a cached index response, and `main`'s code doesn't have the runtime trim until this PR merges.

