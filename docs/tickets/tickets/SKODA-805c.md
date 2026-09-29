# SKODA-805c, `press_kit-template-default` article (Peaq "first glimpse")

- **Epic:** E08, Editorial at Scale (M1 slice of SKODA-805/807)
- **Type:** template / import
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 **Should** tier (P1, 15 Oct demo) · fallback = the SKODA-607 PR shell without accordions
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3d *(planning estimate, not a quote)*
- **Parent:** SKODA-805 (#66) · **GitHub issue:** [#130](https://github.com/skoda-storyboard/demo/issues/130)

## UI Specification
Two-column article per [`story-detail.md`](../../ui-specs/story-detail.md) / [`template-press-release.md`](../../ui-specs/template-press-release.md);
accordion per [`faq-accordion.md`](../../ui-specs/faq-accordion.md). Reference:
`https://www.skoda-storyboard.com/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/`.

## Summary
`skoda-peaq-first-glimpse-…` is **not a tiles hub**. It is a `single-press_kit` page using
`press_kit-template-default`, which is the same shell that press-kit child/chapter pages use. The live source has:
- an article body with **8 row-toggle accordions**
- tags
- a Vimeo embed (no Buzzsprout player on this page)
- a **Media Box of 60 assets** (55 images, one video, four file rows)

Treating it as a hub loses the content, and treating it as a press release loses the press-kit metadata and the
accordions.

## Requirements / Spec
- **Importer.** `import-press-kit-default.js` plus a `page-templates.json` entry. It is built on the SKODA-607
  press-release shell and emits:
  - a hero or no hero, as on the source
  - article default content
  - an **Accordion** for row toggles; this is the minimal SKODA-807 behaviour, using native
    `<details>/<summary>` unless the spec requires otherwise
  - `embed` (SKODA-204)
  - `tags` (SKODA-205)
  - `downloads` (SKODA-502)
  - Metadata `template=press_kit`
- **Accordion.** Add `blocks/accordion`, which does not exist on main:
  - keyboard accessible
  - the heading level is preserved
  - collapsed by default, matching the source
- **Media Box.** Large media sets must pass the SKODA-506 pre-conditioning gate. The downloads block paginates or
  lazy-loads, and does not render 60 eager images.
- **Reuse.** SKODA-805b child pages reuse this importer. It now also handles pages without a Media Box
  (FAQ, Texts, Infographics, Technical data, Images), grouped Images galleries and layout tables.

## Acceptance Criteria
- [ ] The first-glimpse page renders all 8 accordions (with correct open/close and ARIA), the embeds, the tags and
      the Media Box (60 assets, Original/1920 per SKODA-502).
- [ ] LCP and CLS are unaffected by the Media Box (lazy-loaded). The Lighthouse mobile score is ≥90 on the page.
- [ ] Visual diff against the source is ≤2% at 1280/768, or deviations are documented. Lint and the accordion block
      test pass.
- [ ] **Amendment (2026-09-25, sweep reconciliation):**
  - 6 intro PDF/JPG downloads, 2 PDF/share banners, 2 contact cards, the 3-link sidebar menu and the Images +51
    preview.
  - The first glimpse is **Vimeo** (not Buzzsprout).
  - The accordions are multi-open, with keyboard/ARIA support.
  - The Media Box collapses behind "Show more" above 8 assets (708px collapsed, 139×44 pill; routed here from the
    closed 502).

## Dependencies
- Upstream: SKODA-607 (PR shell), SKODA-204, SKODA-205, SKODA-502, SKODA-506, SKODA-305 (MR footer).
- Downstream: SKODA-805b (children), SKODA-807 (full FAQ, M2).

## Import contract (SKODA-603)
Contract(s) `accordion`, `quote` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Pinned shape: `Accordion`, one row per toggle `[summary, body]`, all closed by default. Quotes use the `quote` contract. If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.

## Implementation (2026-09-29, branch `skoda-805c-first-glimpse`, ready for QA)

The importer, `blocks/accordion` and the Media Box disclosure landed with SKODA-805a (#189) and 805b
(#202). First-glimpse was never pushed, though: the SKODA-506 gate blocked it. This branch unblocks
and finishes it.

- **Media gate (SKODA-506).** The rendition ladder only knew WordPress's 3:2 names, so the 18.6 MB
  16:9 `Skoda_all-electric_family` master had "no safe rendition". The gate now reads the master's
  real size (streamed past a 640 KB ICC profile) and tries its own-ratio copies (`-2560x1440`). The
  same fix unblocks the two Epiq children (`Skoda_Epiq_Battery_versions`).
- **Two-cell rows.** The source sets two-cell SiteOrigin rows side by side above 780px. They are now
  `Columns` (photo pairs, contact cards) and `Columns (banners)` (the 240×150 PDF/share buttons),
  and the press-kit template lays them out as the source does. Before, first-glimpse was 1683px
  too tall at 1280. The corpus has 36 banner rows, 16 contact rows and 4 photo pairs over 51 pages.
- **Quote block (SKODA-220).** `blocks/quote` renders the Zellmer and Stefani quotes. Pages that
  carry `Quote` no longer 404 its script.
- **Media Box pill** sits 34px below the last row, giving a 708px collapsed box at 1280.
- **CLS.** The press-kit lead image now reserves its box: CLS 0.24 → 0.063 on every press-kit page.
- **Header (review P2).** The date, title and lead are measured to the source's press-release shell:
  - The date is 11/11, weight 600, `#808080`, 32px below the bar above it and 16px above the title.
  - The title is `#0a0a0a`, 28/35 up to 768 and 26/32.5 above, with a margin of 1em less 10px.
  - The lead is a 16:9 crop, 30px above the first paragraph.
  - On chapter pages the Chapters bar is the page's top bar, as on the source (`press-kit.js` moves it).
- **Video (review decision, 2026-09-29).** The source's Vimeo account is domain-locked, so its
  player showed "cannot be played here". A Vimeo clip that carries its MP4 master now imports as an
  `Embed` of that master: a native `<video preload="metadata">`, named from its Media Box item or
  its source caption.
  - First-glimpse plays the 947 MB DAM master (368 s).
  - The Peaq, Epiq and Motorsport Videos pages convert 11, 9 and 11 clips; Motorsport's 6 YouTube
    clips stay players.
  - Clips in accordion answers stay links, because blocks can't nest.
- **Re-import.** All 51 `press_kit-template-default` pages were re-imported and pushed to DA with
  preview only: 35 updates, 16 unchanged. Every word, link and image is unchanged; only the new rows
  differ.

### QA evidence (measured, origin vs branch preview; no screenshots)
- Accordion: 8 buttons in `h2`, all `aria-expanded=false` with `region` panels labelled by their
  button. Click, Enter and Space open independently (multi-open); Tab moves to the next header.
- Rows at 1280: photos 396×264 at x26/x442, banners 240×150 at x26/x442, contacts w396, the same as
  the origin. They stay 2-up at 781 and stack at 780 (origin 780/781 identical). Gaps: stacked 40,
  row 40, quote → photos 43, all equal to the origin.
- Quote rule: x471.4 w81.2 at 1440 and x176.5 w37 at 390, as on the origin. Rule → attribution 10px.
- Media Box: 1 video, 55 images, 4 PDFs. Collapsed 708.3px at 1280 (origin 708.25), Show more 44px
  high and 34px below the last row.
- Lighthouse mobile (branch preview): performance 99 / 99 on two runs, LCP 1.2–1.4 s, CLS 0.063,
  TBT 0.
- Vertical parity (review P2), first accordion, origin/branch: 1962/1962 at 1280, 1934/1934 at
  1080, 1953/1953 at 992, 2603/2601 at 768, 2869/2867 at 375. Date, title and lead positions are
  identical at 1280, 1080 and 992.
- Video: `readyState 4`, duration 368 s, playing (`currentTime` 3.7 s after 4 s), 812×457.
- **Whole page (review round 2).** First-glimpse, origin/branch, landmarks from the video to the
  footer (video, WhatsApp callout, banners, contacts, sidebar, band, first tile): **equal at 992 and
  768**.
  - At 1280 and 375 there is a constant +24 from the footnote's small print (see Deviations).
  - Sidebar at 1280/768: headings, the menu (now with "Download Media Box"), Images, the "+51" pill
    (x1196, 52×40) and Tags equal the source.
  - Media Box: title 72px into the band, first tile 96px below the title.
  - Changes: the WhatsApp row is `Columns (callout)` with its 50px icon, the sidebar and band follow the
    source shell, the column end is 90/112px, accordion rows are 20px apart, and the clip starts 56px
    after the text before it.

### Deviations (documented; the AC allows them)
- **Video:** the native player streams the DAM master (947 MB for first-glimpse) until a web
  rendition exists. Only metadata loads until play.
- **Footnote small print:** the source sets the "¹ … ²" footnote in `10pt` (`<span style="font-size:
  10pt">`). DA carries no inline font size, so it renders at 16px: one line (24px) taller at 1280 and
  375, which shifts everything below it by 24px (equal at 992/768, where both wrap alike).
- **Show more pill:** 133px wide vs 138px, because the demo has no Škoda Next Medium (500) face.
- **Media Box below 992:** 24px shorter (645 vs 669 at 768), because the source's tile captions
  switch to 20/24 there. This is downloads tile typography (SKODA-510), not changed here.
- **Font swap:** the remaining CLS 0.063 is the H1 re-wrapping when Škoda Next replaces the fallback
  (global fallback metrics).
- **Lead crop:** the source also scales its lead image 1.02 inside the crop, a 2% tighter framing;
  not reproduced.
- **Chapter quotes:** on chapter pages the `blockquote > em` quotes aren't `Quote` rows yet
  (SKODA-220 follow-up). Because of this, from the quote down the Peaq Exterior chapter sits 29px
  above the source at 1280 and 4px above at 768/375 (the sidebar is unaffected). Its footer is 28px
  higher at 1280, 768 and 375.
- **Peaq Images child:** its preview still fails in html2md (200-image page, unchanged in DA; 805a
  follow-up).
