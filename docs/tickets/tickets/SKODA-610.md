# SKODA-610, Clean index titles (drop " - Škoda Storyboard")
- **Epic:** E06, Import Pilot Content
- **Type:** import / metadata
- **Phase:** A · **Milestone:** M1 (demo-visible on every card and rail)
- **Estimate:** 1 SP · AI-assisted 0.25–0.5d / manual 0.5–1d *(planning estimate, not a quote)*
- **Status (2026-09-25):** 🟡 **Code done (branch `skoda-610-clean-titles`); 7 of 28 pages re-pushed + previewed, publish awaiting approval.** The other 21 are held (see below).

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
- Optional defensive trim in `scripts/card-teaser.js` / `story-rail rowToCells`.

## Acceptance Criteria
- [ ] No `query-index.json` title ends in " - Škoda Storyboard".
- [ ] Related Stories / home rail titles fit the 1-line clamp as on the source.
- [ ] Unit test in `skoda-metadata-extract.test.mjs`.

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
| ✅ **Pushed + previewed, clean `og:title` (7)** | practical-fun-stylish-5-reasons-to-choose-the-epiq · an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving · a-true-czech-from-spain · modelling-clay-yoga-simply-epiq-skoda-returns-to-milan · come-and-play-skoda-is-heading-to-milan · a-record-year-for-skoda-electrified-models-also-contribute · big-possibilities-in-a-small-package-the-new-skoda-epiq |
| ⏸ **DA conflict (1)** | skoda-epiq-will-win-you-over-in-just-a-few-seconds: DA holds a newer `Gallery (slider)` version (SKODA-819) that isn't in any push record; a re-push would revert it. Not forced. |
| ⏸ **Stale story output (6)** | what-was-racing-like…, the-skoda-peaq-will-win-you-over-fast, the-versatile-octavia…, skoda-classic-tour…, an-electric-car-approaching…, peaq-sets-a-record…: the live version predates 816 (`hero`). The re-import changes the whole page, so it belongs to SKODA-603 W1 / 801a, not a title fix |
| ⏸ **SKODA-508 caption regression (7)** | 5 press releases (zellmer, national-theatre, superb-25-years, board-of-management, uci) and 2 stories (whats-behind-epiq-design, this-is-epiq…): `skoda-images` adds excerpt paragraphs |
| ⏸ **Media apply blocked (6)** | even-opening-the-door… (4 unresolved 768px renditions) and 5 press releases with Vimeo poster thumbnails (`i.vimeocdn.com`): unresolved images block `media:apply` |
| ⏸ **SKODA-208 (1)** | skoda-model/elroq: `Hero` + `subheading` + no push record |

The 25 pages whose DA matched the local output were recorded in `push-manifest.json` first (no DA writes), so
future re-pushes take the safe `update` path. `media:build` moved 4 already-ingested Epiq masters from `partial` to
`done` in the AEM DAM (`media-manifest.json`).

**AC status:**
- **Not met yet:** "no suffixed index row". It's met for 7 rows once they're published; the other 21 are held,
  as listed above.
- **Met on the branch:** "rails fit the 1-line clamp", through the runtime trim (to be verified on the branch
  preview).
- **Met:** the unit test.

**Next:**
1. Your approval to publish the 7 pages.
2. SKODA-508, then re-push the 7 caption pages.
3. The remaining pages ride along with SKODA-603 W1 / 801a / 208.
