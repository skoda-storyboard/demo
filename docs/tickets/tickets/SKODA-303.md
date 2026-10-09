# SKODA-303, Language switcher (6 locales) in nav tools
- **Epic:** E03, Chrome Fragments
- **Type:** fragment
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d *(planning estimate, not a quote)*
- **GitHub issue:** [#24](https://github.com/skoda-storyboard/demo/issues/24)
- **Status (2026-09-30):** 🟡 Ready for QA on branch `skoda-303-language-switcher`: matches the live switcher at every
  width (see "Implementation" below); QA pending.

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/language-switcher.md`](../../ui-specs/language-switcher.md)** (captured via Chrome DevTools, token-mapped, pixel-perfect AC). Read it before implementing.

Key facts from capture that resolve the open control-form question:
- Source uses **inline text links** (not a dropdown/disclosure): 6 locales, current = **bold ink `<span>`**, others grey `#7c7d7e` links. Placement: topbar right (`12px`) on desktop, drawer bottom (`16px`) on mobile.
- **Recommended EDS default (assumption to confirm):** reproduce the inline-links form (matches source, simplest, keyboard-friendly).
- **A11y:** inactive grey `#7c7d7e` fails AA contrast, darken toward `--skoda-ink`.
- Token: `--body-font-size-2xs: 12px`; define `--skoda-grey-500: #7c7d7e`.

## Summary
Author and decorate the 6-locale language switcher in the nav **tools** section, with per-locale link targets.

## Description
The source topbar exposes a language switcher (`lang-links`) with all **6 locales, en, cs, de, sk, sr, sl**, as links. In the EDS/DA model this lives in the **tools** section of the `nav` fragment and resolves to the per-locale content trees (`/en/`, `/cs/`, `/de/`, `/sk/`, `/sr/`, `/sl/`) defined in the i18n architecture. For the pilot the switcher renders and links across locales; full language-negotiated root routing is a later-phase concern (SKODA-1003).

## Requirements / Spec
- 6-locale switcher (en/cs/de/sk/sr/sl) authored in the nav fragment's tools section.
- Each locale entry links to the corresponding per-locale tree/target.
- Rendered as an accessible control (list of links or a labelled disclosure); keyboard-operable; current locale indicated.
- Locale labels/strings sourced consistently (placeholders where applicable per i18n architecture).
- Works within the Header block decoration alongside SKODA-301/302.

## Acceptance Criteria
Measurable gates live in [`language-switcher.md` §9](../../ui-specs/language-switcher.md); summary:
- [x] 6 locales (en/cs/de/sk/sr/sl) render as **inline text links** in the tools region (topbar-right desktop `12px`, drawer-bottom mobile `16px`).
- [x] Each locale links to its per-locale tree; current = bold ink, others links.
      *The trees `/cs` … `/sl` don't exist on EDS yet (404, only `/en`); links kept by decision (2026-09-30).*
- [x] Inactive-locale contrast ≥ 4.5:1 (darken source `#7c7d7e`): `--skoda-grey-700`, 5.45 / 6.03 / 6.81:1.
- [x] Keyboard-accessible with an accessible name; `npm run lint` passes.

## Implementation (2026-09-30, developer-verified; QA pending)
- `blocks/header/header-locales.js` (new, pure):
  - the locale table (code, visible label, endonym);
  - `currentLocale(pathname)`;
  - `localeEntries()` reads the authored bold text and links; the code comes from the href's first segment,
    else the label, so `#` and relative links never count;
  - `buildLocaleList()`.
- `header.js`: the authored locale `<p>` becomes `<div class="nav-topbar-utility nav-topbar-locales">` with
  `<ul class="nav-locales-list" aria-label="Language">`.
  - The **current locale comes from the URL** (the authored bold is ignored): a `<span aria-current="true" lang>`,
    in source order.
  - Other locales are `<a href hreflang lang aria-label="Čeština">CZ</a>`, and so on.
  - The same list is copied into the drawer footer.
  - A locale authored without a link (the bold one) links `/{code}`, e.g. `/en`, the EDS home.
- `header.css`: the measured topbar and drawer values; `--skoda-grey-700` links; a focus ring (the source has
  none); items as block line boxes (inline, the bold and light faces grow the row to 19px); no drawer border.
- Spec: [`language-switcher.md`](../../ui-specs/language-switcher.md), the re-capture note and §8 decisions.

**Live vs EDS (local preview, computed boxes):**

| Width | Live | EDS |
|---|---|---|
| 1440 / 1280 / 1080 topbar | 149×18 at y13; items +0/28/55/83/110/136; 12/18, 700 / 300 | identical |
| Topbar right edge | 1334 / 1254 / 1070 | 1320 / 1240 / 1056 (−14: header padding, SKODA-308) |
| 1079 / 1024 / 768 / 500 / 390 / 375 drawer | items x815.2 / 859.8 … (1079), 126.2 … (390); 16/24, 700, 0.32px; y852 | identical |
| Visual diff (switcher crop) | 1280 topbar / 500 drawer | 0% / 0% (colour tolerance covers the AA grey) |

- **Gate** (home, story, press release, Media Room × 1440 / 1080 / 1079 / 768 / 375): 212 of 212 switcher checks pass.
  - One visible switcher at each width (topbar ≥ 1080, drawer ≤ 1079); fixed order EN CZ DE SK SR SL.
  - `aria-current` span; labelled list; `hreflang` / `lang` / endonyms.
  - Contrast 5.45 / 6.03 / 6.81; a focus ring on each link; Tab order CZ → SL; Enter follows the link.
  - Subscribe and section tabs unchanged; no page errors.
  - The 1080 page overflow (104px, 31 on the Media Room) is **identical on `main`** (SKODA-308).
- **Tests:** `header-locales.test.mjs` (9 tests: the helper plus the real header on `/en` and `/cs` pages); `npm test`
  704 / 707, 0 failures, 3 skipped.

**Re-check 2026-09-30 (click behaviour, URL patterns, 19 breakpoints 320–2560):**
- **Click behaviour:** matches live apart from the per-article targets (SKODA-1003). See [`language-switcher.md` §8a](../../ui-specs/language-switcher.md).
  - Media Room: `/{locale}/media-room`, with DE on `skoda-media.de` in a new tab.
  - The unlinked EN follows its siblings' pattern.
  - Both nav documents now use the EDS URL form without a trailing slash; the DA edit was approved.
- **Fixed:**
  - the topbar inner padding onto `--page-gutter`, so the switcher ends on the live content edge (1254 @1280) and the
    section tabs start at 106 @1440;
  - Subscribe → EN is 30px (was 40);
  - the current locale keeps the arrow cursor;
  - the drawer is `min-width: min(375px, 100%)`, so it no longer runs 55px off a 320px screen and cuts off the locale row.
- **Result:** the switcher's values are identical to live at every width, and both visual diffs are 0% at the same
  absolute position.
- **Review follow-up (superseded by SKODA-303a, below):** switching language keeps the page path, as live. Each locale links the current path with only
  the locale segment swapped (`/en/emobility/x` → `/cs/emobility/x`); an authored external link still wins, and pages
  outside a locale tree use the authored target. The live site also translates the category and slug segments
  (`/cs/e-mobilita-cs/…`); EDS keeps them as they are, so a translated tree has to mirror the EN paths for these
  links to resolve (locale migration, SKODA-1003).
- **Left to SKODA-308 (decision):** on short phones the drawer's locale row sits lower than live because the menu
  above it is taller. Each row is 73px + an 8px margin vs 61px, and search is 80 vs 64px.

**Findings for other tickets:**
- **Per-page targets (SKODA-1003):** on articles the live list links each translated article and omits missing
  translations (Epiq story: EN / CZ / DE / SK; Peaq press release: EN / CZ / SK), following the page's hreflang set.
  On the Media Room, DE links `https://www.skoda-media.de/`. The pilot links the locale homes.
- **`/en/` is a 404 on EDS** (the home is `/en`), and so is the authored Stories tab link `/en/` in `/nav` (SKODA-301 / 308).
  When the locale trees are migrated, check that `/cs/` … resolve, or author them as `/cs` …

**SKODA-303a follow-up (#243, decided 2026-10-08, branch `skoda-303a-locale-links`):**
- **Conflict:** SKODA-609's link pass already sent the locale links to the live site in a new tab, so the "keep the
  page path" rule above never applied on `main`, and `header-locales.test.mjs` failed.
- **Rule (Lars on #243, adopted by the PO; supersedes the first "live locale home" pass):** the switcher is generated
  from the page's **hreflang alternates** (`alternates` metadata). Each locale links its declared translated URL;
  nothing is inferred from the locale prefix (`localizedPath` removed); locales without a translation are omitted;
  `x-default` is ignored; the current locale is plain text; desktop and the drawer share one list; there is no
  locale-home fallback. Links open in the same tab, as the source. Media Room DE keeps the visible source behaviour
  (`skoda-media.de`, new tab) through the nav row's authored link.
- **PO, 2026-10-08: the switch never navigates to the live site.** Only translations migrated to EDS are linked
  (Lars's caveat: hreflang proves availability on the source, not on EDS). For M1 one page family is migrated: the
  Epiq story in EN + CS / DE / SK / SR (live has no SL). Every other page shows only its own language.
- **Code:** `header-locales.js` (`parseAlternates`, `permittedTranslation`: same-site pages in their own locale
  tree only), the list is marked `data-link-policy="resolved"`, and `scripts/links.js` leaves such links alone;
  `scripts.js` sets `<html lang>` from the locale tree. The importer doesn't write `alternates` (it can't know what
  is migrated): `tools/importer/build-locale-alternates.mjs` derives them from the source hreflang for the pairs on
  EDS and writes `URL` + `alternates` rows into the bulk `/metadata` sheet (plus `/{locale}/**` → `/{locale}/nav`,
  `/{locale}/footer` with `--chrome`).
- **Content (DA preview, 2026-10-08):** the 4 translated stories (story importer, `urls-story-detail-locales.txt`;
  metadata + block gates pass, images on the media bus) and the translated chrome per locale (`/{locale}/nav`,
  `/{locale}/nav-newsletter`, `/{locale}/footer`, `import-locale-*.js`, `urls-locale-chrome.txt`). The DE / SK / SR
  pages keep the English `/footer` (PO, M1): their source footer links the cookie-policy PDF on
  `assets.cookies.skoda-auto.com`, which the binary gate holds (not in DAM).
  `/media-room/nav` was published (it still had the locale homes and `/de/`).
- **Known gaps:** the Subscribe panel's thank-you text stays English (no source text, the source shows its ESP
  response); the header's search scope labels are English strings (SKODA-1003); the app badges keep the English
  artwork; the translated menus' targets aren't migrated, so the link policy sends them to the live site.

## Dependencies
- Upstream: SKODA-301 (Header + nav fragment) / Downstream: SKODA-1003 (language-negotiated root routing + per-locale placeholders)

## Risks / Flags
- 🟢 Low risk for the pilot (link list).
- Full root-routing / `Accept-Language` negotiation is deferred to Phase D (SKODA-1003); pilot ships static per-locale links only.
- Per-locale nav structure differences (market-specific items) are unmapped beyond EN, flagged in the analysis as an open question.
