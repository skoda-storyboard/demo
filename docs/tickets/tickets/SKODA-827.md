# SKODA-827: Homepage promo and Latest News regression

- **Issue:** [#191](https://github.com/skoda-storyboard/demo/issues/191)
- **Type:** Bug
- **Scope:** Storyboard home import, promo-box authoring, landing-page news rail
- **Reference:** `https://www.skoda-storyboard.com/en/`
- **Preview:** `https://main--demo--skoda-storyboard.aem.page/en`

## Failure

The old Storyboard home importer emits both a promo article and its `.item` wrapper,
yielding six `Cards (promo)` rows rather than three `Promo Box` cards. It also
leaves the Latest Stories feed as unstructured markup and loses the `cover-box`
section boundaries. Latest News loads, but its standard rail cells are too narrow:
at 1280px EDS renders 270px cards in a 1200px rail, whereas the source uses
374px cells in a 1248px rail.

## Acceptance

- Import an indexed Promo Box configuration (newest three `/en/` stories), a Stories feed, and separate
  `cover-box` bands with the news rail in its own band; regenerate the runnable
  `import-home-sto.bundle.js`.
- Scope both blocks to `/en/` stories and skip the same first three eligible,
  newest-first index rows in Latest Stories, even as index ordering changes.
- Match the source Stories card inset (10px at mobile, 26px at 1280px)
  without changing the global section spacing or other blocks.
- Render promo images, published dates, links, titles, and full summaries from
  query-index rows, without importing duplicate teaser content.
- Only landing-page `press_release` rails use the 90% / 45% / 30% news-cell
  ladder across the <768 / 768–991 / >=992 layout states. Model, story, and
  press-detail related rails keep their existing geometry.
- Browser-compare the origin and migrated output at 500, 767/768, 991/992 and
  1280px; ensure no horizontal overflow and no deferred-build layout jump.
- Guarded re-import and preview of `/en` must not overwrite concurrent DA
  authoring or publish the old malformed content.
