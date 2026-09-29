# SKODA-828, Hero parity across templates (sweep follow-ups, incl. ultrawide)
- **Epic:** E02, Core Blocks (QA follow-up to SKODA-202 / SKODA-816)
- **Type:** block CSS / import (hero UI owner for press kit, model and archive)
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** [#196](https://github.com/skoda-storyboard/demo/issues/196)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–5d *(planning estimate, not a quote; excludes the SKODA-826 gutter work)*
- **Status (2026-09-28):** 🔵 TODO

> **Ownership (2026-09-28).** This ticket is the single owner of the hero **UI** (rendered box, type, position,
> responsive and ultrawide behaviour) for press kits, model pages and category/tag archives. The hero acceptance
> criteria were moved here from SKODA-208 (model), SKODA-209 (archive term banner) and SKODA-805a (press-kit hub
> 375/768 amendment). Those tickets keep their importer and DA-shape contracts, the single-`h1` rule and their
> non-hero UI. Story heroes stay with SKODA-816 (done) and the global gutter with SKODA-826.

## Origin
A hero sweep on 2026-09-28 covered all 173 DA pages under `/en`. It pulled `.plain.html` for each, then measured the
rendered hero with Chrome DevTools, source vs `main--demo--skoda-storyboard.aem.page`.
- **All pages (150):** measured at 375×812, 1440×900 and 3440×1440.
- **One page per template:** also measured at 768, 1024, 1079, 1080, 1280, 1920, 2560×1080 and 3840×1600. The pages
  were the Epiq story, `series/130-years`, `series-2`, `press-kits/skoda-octavia-press-kit`, `skoda-model/octavia`,
  `category/emobility` and `tag/company/design`.
- **Method:** the rendered box and computed type of the hero image, the H1 and the caption, compared as pairs.

**Passes (no action):**
- Series hubs (15) and `series-2` match within 1px at every width, including ultrawide (61.8vh uncapped, e.g.
  3840×989).
- Stories (58) at ≥1079: the image is 970×546 at the same position at every width up to 3840. The title is
  40/44/600 ink, centred. The scrim and the `eager`/`high` LCP hints are in place.
- Press releases and home, images, videos and search have no hero on either side, as on the source.

**Coverage gap:** no ticket has an acceptance criterion above 1280px. The ultrawide checks below are new.

## Findings
Format: WHAT · WHERE · VIEWPORT · EXPECTED (source) · ACTUAL (EDS).

### F1 🟠 Press-kit overlay hero is boxed, not full-bleed (owned here)
**Pages:** 9 press kits in DA: `4x4-winter-experience-press-kit`, `lets-explore-albania-press-kit`,
`press-kit-skoda-at-the-iaa-2019`, `skoda-octavia-media-launch-press-kit`, `skoda-octavia-press-kit`,
`skoda-octavia-press-kit-2`, `skoda-octavia-rs-and-octavia-scout-press-kit`, `skoda-rs-driving-experience-press-kit`
and `skoda-rs-experience-press-kit`. None of them is in the SKODA-805a hub scope or in the M1 URL set.

| What | Viewport | Expected | Actual |
|---|---|---|---|
| Hero box | 1280 | 1280×494 @0 | 1200×494 @40 |
| Hero box | 1920 / 2560 / 3440 / 3840 | full width, 61.8vh (1920×667 / 2560×667 / 3440×890 / 3840×989) | 1248×640 centred (the `min(61.8vh, 640px)` cap plus the column cap) |
| Title size | 769–1079 | 48/52.8/300 white (the source steps at 769) | 28/30.8/300 (EDS steps at 1080) |
| Perex | all | 20/30/600 white | 16/24/600 |
| Content bottom inset | desktop | about 8px under the perex | 40px padding. The title sits 14–35px higher at 1440 and 335px higher at 3840 |
| Mobile layout | 375 | 16:9 image 375×211, then ink title and caption **below** it | portrait 327×502, white title overlaid |

**Cause:** the full-bleed, uncapped 61.8vh and image-first mobile rules live only in `templates/skoda-series`
(`body.skoda-series`). Press kits get the generic `.hero-image.overlay` from `blocks/hero-image/hero-image.css`,
which has the 640px cap and sits inside the content column.

**Also applies to the 3 SKODA-805a hubs** (Peaq-2, Epiq-2, Motorsport) once they're imported. **Moved from
SKODA-805a:** the amendment "at 375 a dark caption sits below the image; the h1 is 28px at 768", which matches the
source behaviour measured here.

**Fix direction:** PR #189 (SKODA-805a, draft) adds `templates/press-kit` to `TEMPLATES` and already un-boxes the
hub's first section. Build on that template after it merges: remove the 640px cap, and share the series hub's
61.8vh and image-first mobile rules with it (extract them into an overlay sub-variant of the block, or into a shared
rule both templates use). Don't duplicate the CSS.

### F2 🟠 Model hero shape (owned here, moved from SKODA-208)
**Pages:** all 22 `/en/skoda-model/**`. The source is a full-bleed carousel slide:
- Height is about vw/3: 1920×640, 2560×853, 3840×1280. At 1080–1280 it is about vw/2.5 (1280×512).
- The title is 36/45/700 white at the **top left** (hero top +51px). At ≤1079 it is 24/30/700.

EDS renders the generic overlay instead:
- 1248×640, boxed.
- Title 48/300 at the bottom.
- 327×502 at 375, where the source is 375×208.

**Moved from SKODA-208:** the "hero full-bleed (~510px) with chip + name 36px/700 white (→24px @500)" criterion and the
2026-09-25 amendment "hero height is about 480px". Both are superseded by the measured values above. The importer
already emits `Hero Image (overlay)` (picture, then the "Models" chip `<p>` and the H1), so this is CSS only.

### F3 🟠 Category / tag term banner (owned here, moved from SKODA-209)
**Pages:** 15 category and 26 tag pages.

**Source:**
- Full-bleed band, 240px at ≥768 and 160px at 375.
- No `<h1>`.
- Grey label chips at the bottom left: 11/11/600 uppercase, `#7c7d7e`, padding 5px 10px, radius 2px.

**EDS** has no hero block. The importer's `archive-hero` emits default content, a picture then an H1. So:
- The image sits inside the content column (1248 wide, inset below 1248).
- It keeps its natural ratio, so heights vary: 119 / 240 / 244 / 300 / 403px.
- It is `loading="lazy"` with no `fetchpriority`.
- A 44px H1 follows it.

**No banner image:** 16 pages have none. That's 15 tags plus `category/design-eng`, where the source shows an empty
240px band with chips. On EDS they render the H1, then the cards.

`Hero Image (archive)` exists in the block but is unused.

**Moved from SKODA-209:** the "hero banner ~240px desktop / 184px mobile" criterion, the hero half of its visual diff
and its open item "the styled 240px term hero and the label chips".

**Fix direction:**
- Change `tools/importer/parsers/archive-hero.js` to emit the pinned `Hero Image (archive)` shape
  ([`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md) `hero`) instead of default
  content. Keep the single H1 (SKODA-209 rule: term name, tag = parent + term) and present it as the label chips.
- Re-import and preview the 41 archive pages. Update `archive.test.mjs` and the push manifest.
- Resolve the mobile height conflict in `hero.md` §3B: SKODA-209 said 184px at 500, `hero.md` says 160px below 576,
  and the source measured 160px at 375.

**Milestone note:** SKODA-209 is M2 with an M1 slice already live. Moving the banner here pulls it into M1.

### F4 🟡 Story hero gutters below 1080 (tracked in SKODA-826, no change)
- Hero image at 375 / 768 / 1024: 327×184 @24, 720×405 @24, 944×531 @40. The source is 355×200 @10, 748×421 @10 and
  970×546 @27.
- The title and caption column is 1168 wide at ≥1280, where the source is 1228. That changes line wraps:
  - `lifestyle/an-epic-start-to-the-tour-de-france…` wraps to 2 lines at 1440, which pushes the image down 44px.
  - The perex takes an extra line on 7 stories.
  - About 15 titles wrap differently at 375.

SKODA-826's acceptance criteria already cover this. Re-measure the hero after 826 lands.

### F5 ⚪ Story meta row 3px too tall (owned here)
Every story hero block is 3px taller: 759 vs 756 at 1440.
- **EDS:** the 21px category chip sets the height of `.hero-image-meta`, and the date sits 1.5px low.
- **Source:** the chip has margin −3px / −7px, so the row stays at the date's 18px.

**Fix:** set the same negative block margins on `.hero-image .hero-image-meta a`. Keep the 8px bottom margin.

### F6 ⚪ Low-resolution hero masters in DA (owned here, re-import)
All six have a 1920px master on the source:
- 768×512: `emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging`,
  `emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq`, `emobility/whats-behind-epiq-design`.
- 1440×960: `simply-clever/park-your-skoda-using-your-mobile-phone-well-show-you-how-how`,
  `lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague`,
  `lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones`.

A 768px master shown at 970 CSS px (1940 device px at 2x) is upscaled.

**Fix:** re-import the largest source rendition, using the `srcset` up to 2560w.

### F7 ⚪ No-hero press kit uses the default H1 (owned here)
`press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps` has no hero on either
side, which is correct.
- **Title:** EDS is 44/55/600 ink. The source is 26/32.5/600 `#0a0a0a`, the press-release `h1.entry-title`.
- **Lead image:** EDS is 1248×832. The source is 828×552.

This page falls outside SKODA-805c's first-glimpse acceptance criteria. Apply the press-release title and lead-image
treatment to no-hero press kits. PR #189's `templates/press-kit` sets a no-hero H1 rule
(`--heading-font-size-l`, semibold); align it to the source values here rather than adding a second rule.

### Out of scope (note only)
At exactly 1080 the source header is 172px tall and EDS's is 108px, so every source hero sits 64px lower at that
width. This belongs to the header tickets, not the hero.

## Scope
- **F1:** press-kit overlay parity (the 9 DA press kits and the 3 SKODA-805a hubs): full-bleed, uncapped 61.8vh, 48px
  title from 769, perex 20/30, bottom inset, image-first 16:9 on mobile.
- **F2:** model hero (22 pages): full-bleed, about vw/3 height, top-left 36/700 title, 24px at ≤1079.
- **F3:** archive term banner (41 pages): `archive-hero` parser → `Hero Image (archive)`, re-import, full-bleed
  240/160 band, label chips, eager LCP, empty band when there is no image.
- **F5:** meta-row chip margins.
- **F6:** re-import 6 hero masters.
- **F7:** no-hero press-kit title and lead image.
- **Ultrawide:** every hero type here is checked at 1920, 2560×1080, 3440×1440 and 3840×1600.
- **Open decision:** whether the 9 other DA press kits join the M1 URL set or get their own import ticket. Record it
  in `docs/planning/skoda-m1-url-set.txt` or a new ticket.
- **Owner surface:**
  - `blocks/hero-image/*`, `templates/press-kit/*` (after #189) and shared rules extracted from
    `templates/skoda-series`.
  - `tools/importer/parsers/archive-hero.js`, its bundle, tests and push manifest.
  - DA content for F3 (41 archive pages) and F6 (6 stories).
  - `docs/ui-specs/hero.md` §3B.
- **Collision rules:**
  - Serialise with SKODA-826 (global gutter) and with PR #189 (`templates/press-kit`, `scripts/scripts.js`).
  - Don't change `templates/skoda-series`, which passes, except to extract shared rules. If you do extract them,
    regression-check all 15 series hubs.
  - SKODA-208 / 209 keep their importers. Change the archive DA shape only through the pinned contract, in the same
    PR.

## Acceptance Criteria
- [ ] **F1:** on the 9 press kits (and the 3 hubs once imported), the hero is full width at 1280 / 1920 / 2560×1080 /
      3440×1440 / 3840×1600, with height `61.8vh` (494 / 667 / 667 / 890 / 989). The title is 48/300 white from 769 up
      and 28px at ≤768. The perex is 20/30/600. The title and perex positions are within ±2px of the source at 1440
      and 3440.
- [ ] **F1 at 375 and 768:** the image is 16:9 and full width (375×211). The dark (ink) title and caption sit below
      it, as on the series hubs.
- [ ] **F1 regression:** the 15 series hubs and `series-2` still match the source within 1px at 375 / 1440 / 3440.
- [ ] **F2:** on the 5 M1 model pages (Peaq, Epiq, Octavia, New Superb, New Fabia) and a spot check of 3 others, the
      hero is full width and within ±2px of the source height at 375 (375×208), 1280 (1280×512), 1920 (1920×640),
      2560×1080 (2560×853) and 3840×1600 (3840×1280). The "Models" chip and the 36/45/700 white title sit top left
      (+51px) at ≥1080; the title is 24/30/700 at ≤1079. Contrast passes AA over the image.
- [ ] **F3:** the 41 archive pages carry `Hero Image (archive)` in DA. The band is full width, 240px at ≥768 and
      160px at 375, at every width up to 3840. The image covers the band, loads `eager` with
      `fetchpriority="high"`, and the 16 no-image pages show the empty band. The single H1 (term name) renders as the
      grey label chips (11/11/600 uppercase, `#7c7d7e`, padding 5px 10px, radius 2px) at the bottom left.
- [ ] **F3:** `hero.md` §3B and SKODA-209 agree on the mobile height (source: 160px at 375).
- [ ] **F5:** the story hero block height equals the source (756 at 1440 on the Epiq story), and the date baseline is
      within 0.5px.
- [ ] **F6:** the 6 listed stories serve a hero master of at least 1920px natural width.
- [ ] **F7:** the no-hero press kit's H1 is 26/32.5/600 `#0a0a0a`, and its lead image is within ±2px of 828×552 at
      1440.
- [ ] Visual diff of the hero only, source vs EDS, ≤2% per pixel at 1280 / 768 / 375 and at 2560×1080, for one page
      each of press kit, model and archive (replaces the hero half of the 208 / 209 / 805a visual diffs).
- [ ] `npm test` and `npm run lint` are clean, and the CSS guardrail self-check is noted in the PR.
- [ ] Preview links: `https://skoda-828-hero-parity--demo--skoda-storyboard.aem.page/en/press-kits/skoda-octavia-press-kit`,
      `/en/skoda-model/octavia` and `/en/category/emobility`.

## Dependencies
- **Upstream:**
  - SKODA-826 (global gutter) lands first; F4 and the story geometry are re-measured after it.
  - PR #189 / SKODA-805a (`templates/press-kit`) merges before F1 and F7.
  - SKODA-208 / 209 importers (done) supply the model and archive DOM. F3 changes the archive parser's output.
- **Moved here:** the hero UI criteria of SKODA-208 (#57), SKODA-209 (#58) and SKODA-805a (#128).
- **Related:** SKODA-202 (hero block, closed), 816 (story hero, done), 805c (press-kit children; its "hero or no
  hero, as on the source" import rule stays there).
