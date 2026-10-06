# SKODA-607a, Press-release page-level UI parity and final visual QA

- **Epic:** E08, Editorial at Scale (follow-up to SKODA-607)
- **Type:** template / QA
- **Milestone:** M1 (15 Oct demo)
- **Parent:** SKODA-607 (#47, closed 2026-09-30) · **GitHub issue:** [#224](https://github.com/skoda-storyboard/demo/issues/224)
- **Depends on:** SKODA-220 (#140, quotes, closed), SKODA-824 (#148, grey FAQ callout; runtime merged in #252)
- **Status (2026-10-06):** 🟡 IN PROGRESS: branch `skoda-607a-press-release-parity`. Geometry matches the source down to the first quote on the 5 M1 releases (re-imported as drafts); the rest is offset only by measured, ticketed causes. The ≤2% per-pixel gate is **not** passed; every remaining failure has a measured cause, listed in [Blockers](#blockers-for-the-2-gate) with its owner. QA sign-off pending.

## Scope
The remaining page-level alignment and the final visual gate on the five M1 press releases
(`docs/planning/skoda-m1-url-set.txt` rows 17–21). This is not a new template: SKODA-607 phase 1 built it. The quotes (#140) and the grey FAQ callout (#148) are used as implemented, not rebuilt.

## What changed

| File | Change | Why (source measurement, 2026-10-06) |
|---|---|---|
| `templates/press-release/press-release.css` | `main` is a one-column grid at every width (two columns from 768, as before) | The source columns are flex items; their bottom margins never collapse into the next section's. Below 768 the EDS blocks collapsed the sidebar's 54px end with the band's 22px (−22px) |
| ″ | The last body part ends with `--pr-column-end` (60px), the sidebar with `--pr-sidebar-end` (24px) + `--pr-side-banner-slot` (30px) | `.column-primary` mb 60, `.column-secondary` mb 24, the empty 15px side-banner slot + its 15px gap (banner out of scope, SKODA-903) |
| ″ | Media Box `margin-top: calc(32px − gutter)`; each dark band `margin-bottom: 16px` | `.columns` row margin −10px before the band's 32px; `.cover-box` 32/16 margins (the white strip between the bands and before the footer) |
| ″ | Podcast player 20px lower (padding, `press-release-lead` only) | `.entry-content` opens with an empty TinyMCE `<p>` (20px) before the Buzzsprout player, on all 5 |
| ″ | Media Box stats line 4px top padding, 20px to the tiles; +20px below the tiles unless collapsed | `.search-results-stats` padding-top 4px / mb 20; the tile grid keeps its last row's 20px margin; a collapsed box ends on its Show more pill |
| ″ | Sidebar tag rows: no row gap, no `li` margin | 24px rows on the source; EDS added the global `li` 8px margin and a 5px gap |
| ″ | Lead image: rounded (`--card-radius`) clipping frame, resting `scale: 1.02`; the rule only matches the lead part | The source `.article-teaser` frame (radius 8, `transform: … scale(1.02)`). A later body part (after a callout) may start with an image (SKODA-824 re-review R1) |
| `templates/press-release/press-release.js` | `decorateBody()` marks the first body part `press-release-lead` | Lead-only rules; the FAQ callout's bold questions are not a perex (R5) |
| `blocks/downloads/downloads.js` | The Show more disclosure is built from 3 tiles (was: more than 8); `syncVisibility()` already hides it while two rows fit | The source collapses a Media Box / Images group once it needs more than two rows: a 5-tile press release at 500 and 767 (1-up / 2-up), 3–7 tile press-kit boxes at 500 |
| `tools/importer/transformers/skoda-press-release-layout.js` (+ bundle) | The h1 keeps an authored `<br>` | Peaq's title breaks after "record" at every width (−32.5px at 1280 without it). Metadata Title still comes from `og:title` |
| Tests | `templates/press-release/press-release.test.mjs` (new, 3), `blocks/downloads` (+1 case set), `press-release.test.mjs` (title), `press-kit.test.mjs` (visible controls) | The new cases fail on `main` |

## Content
The 5 releases were re-imported with the current bundle (quotes from SKODA-220: National Theatre 2, Zellmer 2, Board 1, Superb 1; the Zellmer FAQ as `body-column, highlight-grey`; text identical to DA word for word). They are pushed to DA and previewed as **drafts only** at `/drafts/skoda-607a/<slug>` (a one-off local script running the `import:push` steps except the binary gate, never publishing; approved 2026-10-06, not committed), **not** over the real pages:
`import:push` blocks all 5 on the binary gate (5 PDFs + the Peaq MP4 have no DAM `delivery_url`; the ingest runs on a developer machine). **The real pages need that ingest before the re-import can be pushed.**

## Geometry, source → EDS (branch preview of the drafts), Δ in px
Anchors from [`docs/ui-specs/tools/press-release-anchors.mjs`](../../ui-specs/tools/press-release-anchors.mjs) (`getBoundingClientRect` after a full scroll and `document.fonts.ready`).

The header, lead image, bullets, perex and podcast player sit at the **same y (Δ 0)** on all 5 at every width. Everything below them is offset only by the causes in the last column. The band heights match within 0.9px.

| Release | Media Box top Δ 1280 / 1024 / 768 / 500 | Cause |
|---|---|---|
| Superb (1 quote, no Related) | −7 / −9 / −12 / −12 | the quote paragraph in the source's real italic face (blocker 1) |
| Board (1 quote) | −9 / −10 / −14 / −15 | quote (blocker 1) |
| National Theatre (2 quotes) | −8 / −10 / −14 / −14 | quotes (blocker 1) |
| Zellmer (2 quotes + FAQ) | −34 / −36 / −40 / −40 | quotes −10…−16 (blocker 1), then the FAQ panel 302 → 278px, −24 (blocker 3) |
| Peaq (no quotes) | −44 / −44 / −44 / −44 | article end −48, the video's media-cart bar (blocker 4) |

Measured before the source's italic face has loaded (it loads lazily), the quote rows match too, and National Theatre, Board and Superb sit within 1px everywhere. So the italic face accounts for the whole quote offset.
Breakpoint edges (519/520, 767, 991/992, 1079/1080) on Superb and Zellmer show no other offset.
Before this ticket (main, 2026-10-06), the Media Box top was −82…−168px off at 1280 and −130…−229px at 500, and the 500px footer was up to +1071px off (the Media Box didn't collapse).

**Regression:** the Media Box collapse matches the source on all 39 press-kit pages × 500/768/1280 and on every Images-chapter group (Epiq, Motorsport). The corpus Octavia release improves from −146 to −56px at 1280 (its content isn't re-imported yet).

## Per-pixel diff (≤2% gate), recorded
[`docs/ui-specs/tools/press-release-region-diff.mjs`](../../ui-specs/tools/press-release-region-diff.mjs): regions per template-press-release.md §10, each cropped by its own selector on each side. Each region is shot in viewport tiles while scrolling, because a full-page capture makes one side re-lay out. pixelmatch threshold 0.1, `includeAA: false` (as `docs/ui-specs/tools/visual-diff.mjs`). Consent accepted; fixed/sticky chrome (the source share buttons, the EDS float dock) hidden on both sides.

| Release | Width | Header | Article | Sidebar | Media Box | Related | Full page |
|---|---:|---:|---:|---:|---:|---:|---:|
| Peaq | 1280 | 0.09 | 0.49 | 1.48 | 1.49 | 4.34 ✗ | 13.45 ✗ |
| Peaq | 1024 | 0.11 | 0.47 | 0.41 | 1.45 | 3.70 ✗ | 12.40 ✗ |
| Peaq | 768 | 0.15 | 0.85 | 0.63 | 1.63 | 5.88 ✗ | 16.36 ✗ |
| Peaq | 500 | 0.18 | 0.64 | 1.49 | 3.19 ✗ | 14.45 ✗ | 28.87 ✗ |
| National Theatre | 1280 | 0.13 | 19.51 ✗ | 6.81 ✗ | 9.73 ✗ | 7.64 ✗ | 16.36 ✗ |
| National Theatre | 1024 | 0.16 | 16.52 ✗ | 8.47 ✗ | 6.19 ✗ | 6.45 ✗ | 15.07 ✗ |
| National Theatre | 768 | 0.17 | 13.85 ✗ | 5.32 ✗ | 5.17 ✗ | 8.76 ✗ | 15.35 ✗ |
| National Theatre | 500 | 0.26 | 13.55 ✗ | 16.57 ✗ | 21.26 ✗ | 11.59 ✗ | 27.40 ✗ |
| Board | 1280 | 0.11 | 9.05 ✗ | 1.66 | 1.74 | 4.13 ✗ | 10.66 ✗ |
| Board | 1024 | 0.14 | 8.96 ✗ | 4.31 ✗ | 1.61 | 3.70 ✗ | 10.28 ✗ |
| Board | 768 | 0.19 | 8.91 ✗ | 3.47 ✗ | 1.84 | 6.29 ✗ | 12.60 ✗ |
| Board | 500 | 0.22 | 8.57 ✗ | 6.33 ✗ | 5.51 ✗ | 13.34 ✗ | 19.28 ✗ |
| Zellmer | 1280 | 0.11 | 4.82 ✗ | 1.73 | 0.54 | 3.60 ✗ | 12.50 ✗ |
| Zellmer | 1024 | 0.14 | 5.94 ✗ | 0.51 | 0.70 | 3.75 ✗ | 12.10 ✗ |
| Zellmer | 768 | 0.19 | 7.10 ✗ | 0.51 | 0.67 | 4.55 ✗ | 14.71 ✗ |
| Zellmer | 500 | 0.23 | 7.19 ✗ | 1.11 | 1.25 | 6.68 ✗ | 19.19 ✗ |
| Superb | 1280 | 0.11 | 5.47 ✗ | 1.97 | 1.77 | — | 9.17 ✗ |
| Superb | 1024 | 0.14 | 6.70 ✗ | 2.63 ✗ | 1.57 | — | 9.35 ✗ |
| Superb | 768 | 0.15 | 7.14 ✗ | 1.13 | 1.59 | — | 11.15 ✗ |
| Superb | 500 | 0.23 | 7.29 ✗ | 1.79 | 4.07 ✗ | — | 20.28 ✗ |

**Gate result: FAIL.** 49 of 96 region measurements (the full-page column excluded) are ≤2%: every header, Peaq's article, most sidebars and Media Boxes at ≥768. Peaq, the only release without quotes, has an article at 0.47–0.85% at every width.

## Blockers for the 2% gate
Each is measured. None is press-release template CSS, so none is fixed here.

1. **SKODA Next italic face (global typography, new ticket):** the source loads `SKODA Next italic 400`; EDS ships only the upright 300/400/600/700 (`fonts/`). Quote text (and every `em`) is a synthesized italic, with other glyphs and a 7px taller box per quote paragraph once the source font has loaded. This drives the article % on every release with quotes (Zellmer, Superb, Board 4.8–9%; National Theatre's two long quotes 13.5–19.5%). It needs the font file under the same licence basis as the existing SKODA Next files.
2. **Teaser image presentation (SKODA-510 Media Box tiles, SKODA-223 Gallery preview, SKODA-224 Story Rail cards):** source `.article-teaser` images are bottom-aligned in their 16:9 frame (`bottom: 0`, `translateX(-50%) scale(1.02)`, frame radius 8px; e.g. National Theatre tile 1 at 500: 487.6×332 in 478×268.9, dy −59.9). EDS crops from the centre with `object-fit: cover`, radius 0, and scales 1.02 on hover only. The downloads spec chose centre-`cover` and radius 0 on the Octavia story; the press-release boxes measure otherwise. This drives the Media Box, sidebar and Related % (and the image-heavy National Theatre). The Story Rail also truncates titles earlier ("of the…" vs "of the new…") and inverts the arrow disc (white on the source).
3. **Zellmer FAQ blank line (#148):** the source panel's first paragraph is `<strong>Frequently Asked Questions: <br></strong><br><strong>Who is leaving…`. helix-importer's HTML→Markdown step drops the `<br>` inside `<strong>`, so the blank line is lost (panel 302 → 278px at 1280, −24px for everything below). Preserving the callout content is #148's.
4. **Peaq video action bar (new ticket):** the source inline Vimeo is a `.media-cart-item.attachment`: 456.8px player + 8px + a 40px add/download/link bar, margins 16/16. EDS has the bare embed: −48px for the article and −44px for everything below. This needs a working media-cart control, not a spacer.
5. **Sidebar "Additional info" icons (new ticket, SKODA-607 AC):** the green chevron on "Media contacts" (icon font `skoda-bnr-icons`, right 20px) and the round media-cart "+" beside "Download Media Box" (`a.media-cart-action.add`, add all to the cart).
6. **Lead image lightbox:** the source lead image links to the original (colorbox); the phase-1 importer emits the bare image. This is behaviour only; the image box is identical.
7. **Page chrome (not in the §10 regions):** the full-page % is also driven by the MR footer (SKODA-305: 161px taller at 1280, 382px shorter at 500) and the site header.

Systemic leak found on the way (not fixed): the global `li { margin-bottom: 8px }` reaches the Tags block's list items everywhere. This PR overrides it only in the press-release sidebar; the story tags likely need the same.

## Acceptance criteria (from #224)
- [x] Source vs EDS on all 5 releases at 1280/1024/768/500, measured geometry for the article, sidebar, Media Box, optional Related and footer anchors (tables above). The Zellmer drift (−168 → −34px at 1280) is resolved except the quotes' italic face (blocker 1) and the −24px FAQ line (blocker 3).
- [x] Content order and rhythm kept, no page-specific offsets; checked on releases without bullets (Zellmer), without Related (Superb) and with the FAQ.
- [x] Dark bands and the two-column/stacked layout correct with and without Related; Peaq's video/PDF tiles checked (collapse at 500/767, open from 768).
- [x] ≤2% per-pixel diff run and recorded (above): **FAIL**, blockers documented.
- [ ] QA independent verification + SKODA-603 tracker (the tracker notes carry this evidence; `qa` stays `pending`).

## Tests
- `templates/press-release/press-release.test.mjs` 3/3, `blocks/downloads/downloads.test.mjs` 17/17, `tools/importer/press-release.test.mjs` 16/16, `templates/press-kit/press-kit.test.mjs` 8/8.
- Full suite: the only failures also fail on `main`: `blocks/header/header-locales.test.mjs`, `scripts/media-cart-download.test.mjs` (`fflate` not installed here) and `tools/importer/media/media-lib.test.mjs` "truncated bodies".
- `npm run lint` clean.
