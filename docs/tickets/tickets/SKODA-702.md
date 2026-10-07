# SKODA-702 — Performance (Lighthouse≈100, RUM, LCP/CLS, 3-phase load)
- **Epic:** E07 — QA, Perf, A11y & Launch
- **Type:** QA
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*
- **GitHub issue:** [#42](https://github.com/skoda-storyboard/demo/issues/42) · child: SKODA-702a (#239, YouTube poster, merged #258)
- **Status (2026-10-07):** 🟡 branch `skoda-702-performance`: 2 CLS fixes; every AC measured (below); QA + the PR's PSI check pending

## Status (2026-10-07)
**Method.**
- **Lighthouse 12.8.2** (local, serial, 3 runs, median; 5 runs where noisy), on 17 M1 pages across every template, mobile and desktop presets.
- **Real PageSpeed Insights** results come from the AEM Code Sync bot's PR comments: the PSI API is over its anonymous daily quota (429).
- **Traces:** layout-shift sources, long animation frames, and the request timeline, with 4× CPU throttling on mobile.
- **A/B:** `main` vs branch, both served by the AEM CLI (`main` worktree on :3001, branch on :3000) over the same previewed content, interleaved.
- **Caveat:** this machine has no Arial/Helvetica (only DejaVu Sans) and a slow, noisy CPU. Local mobile TBT swings 5–10× between identical runs (e.g. 58 / 1835 / 239ms), so it's only used A/B; PSI on the PR is the deciding gate.

**Baseline (`main--…aem.live`, medians):** every desktop page scores ≥ 98 except one, and LCP is the hero / lead / first-card image everywhere (0.5–1.0s desktop). Below the ≥ 95 mobile / ≥ 98 desktop bar:

| Page | Preset | Score | Cause |
|---|---|---:|---|
| Press-kit chapter | desktop | 90 | CLS 0.212 |
| First-glimpse kit | mobile | 77 | CLS 0.070, TBT* |
| Press-kit chapter | mobile | 83 | CLS 0.046, TBT* |
| Press release (Peaq) | mobile | 97 | CLS 0.071 |
| Story (Epiq) | mobile | 92 | CLS 0.051, TBT* |
| Category emobility | mobile | 93 | LCP 3.2s (simulated) |
| Press-kit hub / Images, Zellmer, Videos | mobile | 91–92 | TBT* |

\*Local TBT. On PSI these page types show TBT ≈ 0 (PR #251, #263, #267).

**Fixes (one commit each).**
1. **`templates/press-kit/press-kit.css`, `align-content: start` on the ≥ 768 grid.**
   - **Cause:** `main` has a min-height, so while the later sections were still `display: none` the visible rows (Chapters bar + header) stretched to fill it. The header painted 340px low and then jumped up.
   - **Also on short chapters:** on the Texts chapter `main` kept the gap even after load (h1 at y285 at 1280×900, y786 at ×2400). The branch puts it at **y211, as the source**.
   - **CLS (desktop):** chapter 0.212 → 0.005, Images 0.059 → 0.005 (Lighthouse A/B); the traced shift goes 0.0535 → 0.
2. **`styles/brand.css` + `styles/styles.css`, fallback fonts per platform and weight.**
   - **Cause:** SKODA Next loads lazily on mobile, so text first paints in the fallback and re-wraps at the swap. In the fallback the headers were 30–91px taller.
   - **The old face was wrong three ways:**
     - its 87.32% was DejaVu's ratio, not Arial's;
     - it had no bold face, so 600/700 text was faux-bold;
     - its `local('Helvetica'/'Arial')` never matched on Linux/Android.
   - **Now:** one family per local font (Arial-metric, Roboto, DejaVu), each with a regular and a bold face, calibrated on the M1 pages.
   - **Section jump at the swap**, 11 pages (6 calibration + 5 holdout), in test font sets that emulate each platform:

     | Font set | 412px | 1350px |
     |---|---:|---:|
     | DejaVu | 342 → 1 | 92 → 0 |
     | Roboto | 342 → 0 | 92 → 0 |
     | Arimo (Arial metrics) | 60 → 30 | 30 → 30 |

   - **CLS (mobile):** first-glimpse 0.070 → 0.007, Peaq 0.071 → 0.001, Epiq 0.051 → 0, Como 0.054 → 0, news 0.022 → 0.

**Lighthouse A/B (local, medians), score `main` → branch.**

| Page | Mobile | Desktop |
|---|---|---|
| Press-kit chapter | 87 → 79 † | 88 → 98 |
| First-glimpse | 70 → 91 | 98 → 97 |
| Peaq | 87 → 94 | 96 → 99 |
| Zellmer | 84 → 75 † | 97 → 95 |
| Images | 83 → 78 † | 96 → 94 |
| Epiq | 97 → 98 | 99 → 98 |
| Como | 98 → 99 | 99 → 99 |
| Home | 92 → 95 | 100 → 99 |
| News | 95 → 95 | 99 → 100 |
| Model | 93 → 93 | 99 → 99 |

- **CLS:** lower or equal on every page.
- **† Score drops are TBT noise:** over 5 runs the TBT medians are Zellmer 410 → 388, Images 403 → 404, chapter 310 → 355, with spreads of 183–2946ms on both sides. The change is CSS-only, and summed main-thread Style & Layout is 7203 → 6954ms, so the new `local()` fallbacks add no measurable cost.

**No regressions.**
- **Steady-state geometry** (fonts loaded; every section, h1, first 6 images, header, footer): identical within 1px, `main` vs branch, on 17 pages × 375/768/1280, plus the press kits at 2400px tall. The only difference is the short Texts chapter, which now matches the source (above).
- **`npm run lint` is clean.** Tests: 1,080 pass. The two failures aren't from this branch, which changes no JS:
  - `header-locales`: fails on `main` too; fixed in PR #264;
  - `media-lib` "truncated bodies": `ENOTEMPTY` deleting its temp dir on this repo's NFS mount; it passes in a `/tmp` checkout.

**Acceptance criteria.**
1. **Lighthouse ≈ 100:** CLS, the main lever, is fixed. The bar is met locally except the noisy mobile TBT pages and the category LCP (follow-up 1). The 234 Lighthouse JSON reports are kept locally (`.migration/skoda-702/lh/`, not committed) and summarised here. The PR's PSI check decides.
2. **RUM:** `?rum=on` sends `top`, `enter`, `language`, `viewblock`, `viewmedia`, `loadresource`, `click` and `cwv` beacons to `/.rum/1`, and the RUM enhancer loads from `ot.aem.live` with the `cwv`, `a11y`, `martech` and `form` plugins. Default sampling is 1 in 100. **Field data in the aem.live RUM explorer is not verified** (needs the domain key).
3. **LCP / CLS:**
   - **LCP** is the hero, lead or first-card image, `eager` with `fetchpriority=high`.
   - **Image dimensions:** no image shifts in the traces.
   - **CLS** is ≤ 0.007 on every A/B page after the fixes.
4. **Three phases:**
   - **eager:** `aem.js`, `scripts.js`, `brand.css`, `styles.css`, `links.js` + `split-body.js` (needed by `decorateMain`), the template, the first section;
   - **lazy:** header, the remaining blocks, footer, then `lazy-styles.css` + `fonts.css`;
   - **delayed:** `consent-check.js` + the float dock, right after lazy (well after LCP; two small modules, so no 3s timeout added).
   - Nothing deferrable runs eager. There's no OneTrust/GTM in EDS yet: the consent stub stays, and the real CMP is SKODA-704/804, which **must keep it in the delayed phase**.
5. **Embeds:** each keeps its box from first render, so no CLS.

   | Embed | `loading` | Box |
   |---|---|---|
   | Buzzsprout | `lazy` | 200 = 200px |
   | Vimeo | `lazy` | 16:9, 457 = 457px |
   | YouTube poster | `lazy` | 16:9 (702a) |
   | MP4 | `preload="metadata"` | 16:9 |

**Risk "lightbox fetches originals" is closed.** The press-release Gallery (preview) lightbox loads the 2000px WebP rendition (66KB) and shows it at 1062×709. The story Gallery (slider) has no lightbox, as on the source.

**Follow-ups (not fixed here).**
1. **Category archive mobile LCP** (simulated 3.2s): the LCP card image is built by JS from the query index, so it's not discoverable in the HTML (observed load delay 371ms). SKODA-831 / 209.
2. **First-glimpse MP4:** a 947MB master with its `moov` atom at the end (not fast-start), so `preload=metadata` needs extra range requests (≈ 400KB). It needs a fast-start delivery rendition (SKODA-503/506).
3. **The Buzzsprout player** boots at load on press releases, because it's within the lazy margin; it's lazy on the source too. PSI TBT is 0, so this is a watch item only.
4. **`/` returns a 301 to a draft branch page** (`skoda-603-migration-status--…/drafts/migration-status`, PSI mobile CLS 0.205). It's not a pilot page, but the root redirect looks like a configuration leftover.
5. **Arial-metric fallback:** a 30px swap jump remains on one page per width in the Arimo set (series at 412, Octavia at 1350). Re-calibrate if SKODA Next changes (`docs/ui-specs/tools/fallback-sweep.mjs`).

## Summary
Validate the pilot pages hit Lighthouse ≈100 with RUM enabled, healthy LCP/CLS, and a correct three-phase (eager/lazy/delayed) load.

## Description
The static architecture should deliver near-perfect performance: buildless, three-phase load, masters-only + webp + `<picture>` with intrinsic dimensions (source already has width/height → low CLS). This ticket measures the imported pilot pages, tunes to target, and confirms all 🟠 integrations and third-party scripts load in the delayed phase so they never block the static delivery.

## Requirements / Spec
- Lighthouse ≈100 on the pilot pages (press-release article, PR listing, representative pages).
- RUM enabled and reporting field data.
- LCP within budget (hero/master image is LCP-friendly — SKODA-202); CLS near-zero using intrinsic `width`/`height`.
- Three-phase load verified: eager (LCP content), lazy (header/footer/rest), delayed (consent/analytics/embeds).
- All 🟠 services and third-party scripts (OneTrust, GTM, embeds) confined to the delayed phase.

## Acceptance Criteria
- [ ] Lighthouse ≈100 achieved on pilot pages (report attached).
- [ ] RUM is active and collecting field data.
- [ ] LCP/CLS within budget; CLS driven near-zero via image dimensions.
- [ ] Three-phase load confirmed; nothing deferred-able runs eager.
- [ ] Embeds lazy-load (native `loading="lazy"`, aspect-ratio box, no CLS).

## Dependencies
- Upstream: SKODA-603 (imported pilot). / Downstream: SKODA-704 (visual critique + sign-off).

## Risks / Flags
- Real LCP/CLS and lightbox/embed lazy-load timing are `[RUNTIME-UNCONFIRMED]` — require a browser to confirm. (`SKODA-MEDIA-DEEP-DIVE.md` §10, `SKODA-EDS-DA-ARCHITECTURE.md` §13)
- Whether the gallery lightbox fetches larger originals on click (adds delivered weight) is unconfirmed — check during measurement.
