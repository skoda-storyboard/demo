# SKODA-605 — Rewrite absolute source URLs to site-relative in import
- **Epic:** E06 — Import Pilot Content
- **Type:** import / transformer
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **GitHub issue:** [#39](https://github.com/skoda-storyboard/demo/issues/39)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

## Summary
Card links in the Models rail, the Series rail, and the "All"/heading links on the tag rails render as **absolute `https://www.skoda-storyboard.com/...` URLs**, so clicking them during the demo navigates off `localhost`/the EDS site to the live source. Rewrite absolute source-host hrefs to **site-relative** paths during import. Surfaced by QA finding **F1** (2026-09-14 homepage QA pass, this-cycle wave 1).

## Description
Confirmed in `content/en/index.plain.html` (4 absolute `skoda-storyboard.com` hrefs). No importer transformer rewrites links today (see Status). The footer model links are already relative (`/en/tag/model/fabia`), so the fix is to normalize the rail/heading links to match. **Content-layer fix:** must be done in the transformer + re-import, NOT by hand-editing `content/` (project rule: content is produced only by the bundled import script).

## Requirements / Spec
- In the import transformer, rewrite an `href` whose host is `www.skoda-storyboard.com` (or `skoda-storyboard.com`) to a site-relative path (strip scheme+host, keep path+query+hash) **when the target is a demo page** (amended 2026-09-25, see below).
- Leave already-relative and genuinely-external (non-Škoda) links untouched.
- Applies to every page-type importer (rails appear on the STO home, MR home, Model and Series pages too).
- Re-run the affected importer; preview; validate no absolute source-host links to demo pages remain in the output.

### Amendment (2026-09-25, stakeholder decision)
About half of the source-host links point outside the demo: news filters, `/en/tag/` (M2, SKODA-209), `/en/category/`, and stories that aren't imported. Rewriting them would turn a working jump to the live site into an in-site 404 until SKODA-609 lands. Decisions:
- **Allow-list only.** A link becomes site-relative only when its target is in `skoda-m1-url-set.txt` or `skoda-rail-feed-corpus.txt`. Every other source-host link stays absolute to the live site: link policy D-3 default (b). SKODA-609 adds the new tab, the card swaps, the redirect and the crawl.
- **`/direct-download/…`:** the press releases carry root-relative source download links, which 404 on EDS. They point at the live source (`https://www.skoda-storyboard.com/direct-download/…`) until the media or cart work repoints them to the DAM.

## Acceptance Criteria
- [x] No absolute `skoda-storyboard.com` hrefs to **demo pages** remain in the imported content, and links to targets outside the demo stay absolute to the live site *(amended 2026-09-25; was "no `skoda-storyboard.com` absolute hrefs remain")*. On the 30 re-imported pages there are 0 left, down from 45 on the live versions.
- [x] Models rail, Series rail, and tag-rail "All" links resolve to local/site-relative paths when they target demo pages, and a demo click-through stays on the EDS site. Rails are index-driven now (cards come from `query-index` paths), and the tag "All" links go to `/en/tag/…` (M2), so they stay absolute by policy.
- [x] Genuinely-external links are preserved.
- [x] The transformer change is reusable across page-type importers: one shared transformer in all 16.
- [x] *(new)* Root-relative `/direct-download/…` links point at the live source. On the 10 press releases, 56 links went from 56 relative to 0.

## Dependencies
- Upstream: SKODA-601 (transformer layer), SKODA-602 (re-import + publish)
- Downstream: SKODA-609 (link policy for the links that stay absolute; reuses the allow-list)
- Blocked-by (to fully verify on the published site): re-import + publish per page. Most live pages are held by other tickets (see Republish status).

## Risks / Flags
- 🟢 Low-risk transformer change; the collision scope is the import layer only (no block/CSS impact). It touches **all 16 importers and bundles**, so serialize with other importer tickets. #155 (SKODA-816) is merged into this branch and `import-story-detail.bundle.js` was rebuilt from the merged source. #156 (SKODA-819) also touches `import-story-detail`; whichever of #156 and this PR merges second rebuilds that bundle.
- A link to a demo page that isn't published yet 404s until SKODA-603 publishes it. Pages with such links are held (see Republish status).

## Status (2026-09-25): code done, 1 page republished
The 2026-09-14 "IMPLEMENTED in `skoda-cleanup.js`" note was wrong: that file never existed in git, nor did `import-en-landing`. On `main`, no transformer rewrote source-host links. The work below replaces that note.

### Implementation
- **`tools/importer/transformers/skoda-links.js`**, registered **last** in afterTransform in all 16 `import-*.js`, so it also sees links the parsers and `skoda-story-aside` build. It has three rules:
  1. Rewrite `http(s)://`, `//` and apex/`www` source-host links whose EDS path is on the allow-list to that path. The path is lowercased, with `[^a-z0-9-]` → `-` like the importer, and **no trailing slash** (EDS 404s on `/en/` and `/…/slug/`; `/en` is the homepage). Query and hash are kept byte-for-byte. The mixed-reality ALIAS maps straight to its canonical.
  2. Point `/direct-download/…` at the live source.
  3. Strip `#s_aid` / `#s_cid`. This covers the 6 importers that don't run `skoda-page-cleanup`; the Elroq PDF link kept one.

  Untouched: `cdn.` assets, external hosts, `mailto:`/`tel:`, `#…`, relative links. A second run changes nothing.
- **Allow-list:** 119 EDS paths + 1 alias, generated between the `BEGIN/END GENERATED ALLOWLIST` markers by `npm run import:allowlist` (`tools/importer/build-link-allowlist.mjs`, which reuses the tracker's `parseSectionedList`). `?attachment_id=` corpus items have no EDS path yet (SKODA-608), so links to them stay absolute. The list is inlined because transformers must be standalone scripts: the transformer validator and the bundles load them without imports.
- **Tests:** `skoda-links.test.mjs`, 13 tests: rewrite + trailing slash, query/hash, host variants, alias, out-of-demo kept, cdn/external/mailto/anchors kept, direct-download, `#s_aid`, block tables, beforeTransform no-op, idempotency, every set/corpus URL rewrites, and a drift guard against the two `.txt` lists. `npm test`: 305/305 pass.
- **Bundles:** all 16 were rebuilt. A rebuild on unchanged `main` first was byte-identical, so each diff is only `skoda-links` + its registration.

### Evidence (30 live index pages re-imported, 2026-09-25)
| Measure | Live before | Re-import |
|---|--:|--:|
| Absolute source-host links to demo pages | 45 | **0** |
| Site-relative demo links (23 targets) | 0 | 35 |
| Relative `/direct-download/` (404 on EDS) | 56 | **0** (56 → live source) |
| `#s_aid` / `#s_cid` | 0 | 0 |
| Absolute links outside the demo (news filters 59, tags 35, categories 18, other stories/PRs) | kept | kept |

- `import:validate-blocks`: 3 errors on the re-import, all pre-existing contracts unrelated to links (`/en` `cards (promo)` → 603 W1, `version` → 801a, Elroq → 208). The live versions have 9.
- Browser check on `.aem.page` (modelling-clay-yoga…): all on-site links return 200. The two rewritten "Explore more" cards stay on the EDS host when clicked. Tags, the category and the non-demo card still open the live site, and the external `epiqdesignweek.com` link is unchanged.
- Nav and footer fragments: 0 absolute source-host links. They already use relative links to non-demo pages (`/en/tag/…`, `/en/category/…`, `/en/skodapedia/`, `/en/media-room/`, and `/en/` with a trailing slash), which 404 on EDS. That's SKODA-609's scope, not changed here.
- 14 live index pages aren't in the set or corpus (earlier Epiq/story slices, e.g. `whats-behind-epiq-design`). Links to them stay absolute. Adding them means extending the lists, not this code.

### Republish status
QA rule: a 605 re-import may change **only links**. The DA copy is compared with the new output after running the DA copy's links through the same transformer.

| Result | Pages |
|---|---|
| ✅ **Published, links only (2)** | modelling-clay-yoga-simply-epiq-skoda-returns-to-milan: 2 cards → `/en/emobility/even-opening-the-door…`, `/en/emobility/skoda-epiq-will-win-you-over…` (both live) · an-epic-start-to-the-tour-de-france…: 2 cards → `a-custom-made-sunroof…`, `how-the-versatile-skoda-peaq…`. These two targets **aren't published yet** (603); publishing anyway, with 2 temporary in-site 404s, was approved on 2026-09-25 |
| ➖ **No link change needed (5)** | a-true-czech-from-spain · big-possibilities-in-a-small-package… · come-and-play-skoda-is-heading-to-milan · practical-fun-stylish-5-reasons… · a-record-year-for-skoda… |
| ⏸ **Other diffs held (23)** | the same blockers as SKODA-610: 508 caption/paragraph diffs (5 PRs: zellmer, national-theatre, superb-25-years, board-of-management, uci; 3 stories: this-is-epiq, whats-behind-epiq-design, watch-the-world-premiere) · stale pre-816 story output, `hero` in DA vs `hero-image` (7; even-opening-the-door is also media-blocked) · media apply blocked by Vimeo posters, 607 (5 PRs: 936-km, simply-clever, updated-slavia, octavia-turns-30, red-dot) · 819 slider conflict (Epiq story) · 208 (Elroq) · `/en` promo-box header (603 W1) |

**Publish (2026-09-25, approved):** a bulk publish of the 2 pages returned live 200 and indexed for both. Live QA on `.aem.live`:
- 0 absolute demo links; 4 site-relative links; 0 relative `/direct-download/`; 0 `#s_aid`;
- the footer (3,045 characters) and the nav (42 links) render;
- the index has 31 rows (both pages were already indexed);
- `import:status` is unchanged at 16/136, because neither page is in the set or the corpus.

**Open on the live site:** `/en/emobility/a-custom-made-sunroof…` and `/en/emobility/how-the-versatile-skoda-peaq…` 404 until SKODA-603 publishes them.

Of the 23 rewrite targets, 13 aren't published yet (603). The held pages pick up 605 automatically when their blocker clears and they're re-imported with the new bundles.
