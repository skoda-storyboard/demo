# SKODA-801a, M1 story import fidelity slice (21 in-scope stories)

- **Epic:** E08, Phase B migration (M1 slice of SKODA-801)
- **Type:** import / transformer
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 1.5 SP (was 3 SP; re-scoped 2026-09-24, see below) · AI-assisted 0.5–1d / manual 1.5–2d *(planning estimate, not a quote)*
- **Parent:** SKODA-801 (#48) · **GitHub issue:** [#127](https://github.com/skoda-storyboard/demo/issues/127)
- **Discovered in:** M1 gap review, 2026-09-24
- **Status (2026-10-10):** 🟡 Delivered by [SKODA-830](SKODA-830.md) (PR #269; 57 stories published 2026-10-06) and
  verified live today, see "Close-out check". The stale link allow-list fix (branch `skoda-801a-link-allowlist`) is
  pushed + previewed on 49 pages; publish needs a go-ahead, then close #127.

> **Re-scoped (2026-09-24, review §15): 3 → 1.5 SP.** PR #113 merged SKODA-801 and parts of 816–818/820, so:
> - carousel → **SKODA-819** (Gallery `slider`; the importer already emits `Gallery`)
> - embeds → **SKODA-818** (done in #113)
> - sidebar and tags → 801 / **SKODA-817** (done in #113; the sidebar is now kept, not dropped)
>
> **What remains here:** the Media Box → `downloads` mapping on 21/21 stories (after #111), plus the 21-story batch
> run with the per-URL coverage report. The 801 code comments and SKODA-820 still say "Media Box deferred to 604".
> This ticket overrides that for the 21 in-set stories.

## Summary
The origin/main story importer flattens a story to default content only. `import-story-detail.js` +
`transformers/skoda-story-cleanup.js` deliberately **drop** the following, and log the loss as "deferred to
SKODA-801/814/604":
- the Media Box (`.search-results.media-box`)
- `.sb-gallery` / `a.colorbox`
- embeds (`.embed-controller-wrapper`, `.page-embed`)

It also never maps the `skoda-carousel-widget`. *(Historical: since #113, `story-flatten.js` routes it to Gallery
or Cards, and embeds become bare URLs via 818.)*

The 21 story URLs in the 43-URL M1 set (20 unique pages; one is the mixed-reality alias, see SKODA-609), checked
live on 2026-09-24, all contain:
- **21/21** an in-body `skoda-carousel-widget` image carousel (→ SKODA-819, formerly SKODA-219)
- **21/21** a Media Box with downloadable originals (→ SKODA-502 `downloads`, cart seam 505a)
- **2/21** Vimeo embeds (`peaq-enters-production-…`, `explore-the-new-skoda-models-in-mixed-reality`) (→ SKODA-204)
- **21/21** sidebar tags plus a CS `hreflang` alternate

If nothing changes, the demo shows 21 text-only stories. This ticket is the **M1 reduced-fidelity-plus** slice:
reconstruct the media that exists in all 21 stories, and keep the rest of SKODA-801/814 (long tail, rare widgets,
1,614-page corpus) in M2.

## Requirements / Spec
- **Carousel.** ~~Map each `widget_skoda-carousel-widget` to the SKODA-219 carousel variant, in body order.~~ Moved
  to SKODA-819: the importer emits `Gallery (slider)`.
- **Media Box.** Map `.search-results.media-box` to the `downloads` block, using the SKODA-502 contract:
  - Original + 1920px renditions per image
  - asset count taken from the mediabox API, not the DOM count, which is roughly 2× because it includes rendition
    rows
- **Embeds.** ~~Map `.embed-controller-wrapper` / `.page-embed` (Vimeo) to the `embed` block (SKODA-204).~~ Done by
  SKODA-818 in #113 (bare URL → 204 autoblock).
- **Tags.** Keep the visible tags block. The tags must be derived before the sidebar is stripped, as today.
- **Sidebar.** ~~For M1, drop the sidebar, share cluster and newsletter.~~ Superseded: 801 (#113) keeps the
  two-column aside, and SKODA-817 handles its parity. Share is 215 and the newsletter stub is 823 (Could). The
  side banner (SKODA-903) and the production newsletter service (SKODA-904) remain deferred.
- **Media prep.** Masters-only images and the pre-conditioning gate follow SKODA-501 and SKODA-506.
- **Cleanup changes.** Update `skoda-story-cleanup.js` so the Media Box selectors are no longer in the drop list.
  Log only what stays deferred.

## Close-out check (2026-10-10, live, the 20 unique in-scope stories + the mixed-reality alias)
- **Media Box:**
  - 20/20 stories have a Downloads block.
  - The rendered tile count equals the origin Media Box count on 20/20 (6–30 assets per story).
- **Spot-check (one per category):**
  - Stories: Peaq comfort (eMobility), Lake Como (Lifestyle), Chris Froome (Škoda World).
  - Asset order identical by file name (8/13/9). Alt text present and equal to the origin.
- **Rendering:** every block `loaded`, 0 block-file 404s, no horizontal overflow on all 20.
- **Consent residue:** 0.
- **Links (SKODA-605):** 19 in-body links on 11 stories still pointed at the origin although the target page is live
  on the demo.
  - **Cause:** the allow-list (228 paths) was generated before the later imports. The live index has 280 pages.
  - **Fix:**
    - `build-link-allowlist.mjs` adds `docs/planning/skoda-published-url-set.txt` (279 live pages, from the live index;
      `--refresh-published`). The allow-list is now 281 paths.
    - Pages known only from the live index take plain links. A listing-filter link (`?filter[<taxonomy>]…`) to them
      stays live, because each demo listing reads only its own authored facets: News has no `vip`, `bodywork` or
      `history` facet, measured.
    - The 18 importer bundles were rebuilt; each diff holds only the list and the rule.
  - **Scope:**
    - 52 live pages carry 97 rewritable links.
    - Re-imported: 50 pages (30 stories, 19 press releases, 1 series hub). `/en` and `/en/media-room` are left for
      the #306 home re-push.
    - DA diff:
      - 44 pages: links only.
      - 2 stories: an origin related-story update.
      - 3 releases: the #267 title `<br>`.
      - 1 page: serialization only.
  - **Push:** 49 updates, 0 conflicts. Preview 49/49 200, and 86/88 link targets are relative.
    - The other 2 links are gone from the origin's related list.
    - Held: `a-true-czech-from-spain`. DA was saved after our last push (2026-10-08 09:15); its text, images and blocks
      equal ours. It needs a go-ahead to overwrite.
  - **Media:** the origin's newsletter card image moved from `dist/26.9.2` to `dist/26.10.3` (byte-identical,
    51,012 bytes). It now has one delivery-only manifest row (`ac2f7973__newsletter_subscribe.webp`).
- **By design, not changed:**
  - The Media Box "Original / 1920px" image downloads link the source `/direct-download/` files (SKODA-605 rule 2).
  - The newsletter-settings and consent pages aren't migrated, so their links stay absolute.

## Acceptance Criteria
- [x] All 21 in-scope stories import with Media Box → downloads in source order. The #113 output (Gallery, embeds,
      aside, related band) is unchanged. A per-URL checklist in the SKODA-603 tracker shows 0 unexpected drops.
      *(SKODA-830; live check 2026-10-10: 20/20 + alias, counts = origin)*
- [x] Spot-check 3 stories (one per category) against the source: component presence and order, captions and alt
      text, download link counts. *(2026-10-10, see "Close-out check")*
- [ ] No `skoda-storyboard.com` absolute links remain (SKODA-605) and no consent residue remains (SKODA-606).
      *(Consent 0. Links to demo pages: fixed on preview for 49 pages; publish + the held page pending. Links to
      non-demo pages and file downloads stay absolute by policy.)*
- [x] Importer unit or fixture tests cover the Media Box mapping. `npm run lint` is clean.
      *(`story-import-validity.test.mjs`; link rules `skoda-links.test.mjs` 17/17)*
- [x] **Amendment (2026-09-25, sweep reconciliation):** *(SKODA-830: 57 stories re-imported 2026-10-06; 0 block 404s
      on the 20 today; collapse matched in D2)*
  - Re-import every stale DA story with the #113/#133 importer, first the 3 flagged ones (plates, Peaq record,
    Octavia), and assert the slider count per page.
  - **0 block JS 404s:** the older Epiq import references a `version` block that doesn't exist.
  - The story Media Box collapses behind "Show more" above 8 assets (708px collapsed, 139×44 pill; routed here from
    the closed 502). *Reconciled in SKODA-830 D2 (2026-10-06):* the source rule is "more than two rows at the current
    column count", which is "above 8" only at 4 columns; 708.25px (1440) and the 137.6×44 pill are matched, see
    `docs/ui-specs/downloads.md`.

## Dependencies
- Upstream: SKODA-601 (importer), SKODA-801 (#113), SKODA-819 (was 219), SKODA-818, SKODA-502 (#111), SKODA-204 (#109), SKODA-501/506.
- Downstream: SKODA-603 (43-URL import), SKODA-604 (full-fidelity hero stories), SKODA-704 visual sign-off.

## Found in SKODA-603 W2a (2026-09-26)
Two story-importer leaks hold 2 pages at preview. See SKODA-603 "W2a results".
- **WordPress MediaElement video** (`enyaq-and-elroq-now-double-as-gaming-consoles…`): the player chrome is
  flattened into content: 2 `mejs-controls.svg` images, `00:00`/`00:53` timecode paragraphs, and a
  `javascript:void(0)` "Use Up/Down Arrow keys…" link. Strip `.mejs-*` / `.wp-video` chrome and keep the `.mp4`
  source as one video link (or an Embed row).
  **✅ Fixed 2026-09-26 (PR #164).** `.wp-video` now imports as an Embed table (`url` + `poster`), and the embed
  block plays `.mp4` / `.webm` / `.mov` / `.m4v` natively (`<video controls preload=metadata>`). The page is
  re-imported and **published 2026-09-26** after #163/#164 merged. Live check at 1440/767: native video (53s,
  1920×1080) with the poster, 0 player-chrome leaks, hero OK, footer OK, no overflow. Indexed. Embed regression
  check: 54/54 real-page renders + 13/13 fixture cases identical to the previous code (see #164).
- **Quiz widget** (`quiz-can-you-recognise-skoda-models-by-their-details`): the quiz's config JSON is rendered as a
  paragraph, answers become `[ ]` list items, and quiz controls ("Go to next question", "Finish quiz",
  "correct answers: 0") become text. Needs a decision: static Q&A content (drop the JSON and controls), or a
  quiz block (new contract).
  **Decision 2026-09-26 (stakeholder): keep the page held.** The quiz is graded server-side
  (`/wp-json/skt/result`); the answer inputs have obfuscated classes and there's no answer key in the page. An
  interactive rebuild needs the answer key from the client, so the page stays preview-only until that's scoped.

## Import contract (SKODA-603)
Contract(s) `gallery-slider`, `quote`, `columns-split`, `spec-table-versions` (proposed) in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). The story importer emits these pinned shapes. The raw `version` spec table (Epiq) must become `Spec Table (versions)` or text; the check fails `version`. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
