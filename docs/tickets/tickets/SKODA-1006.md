# SKODA-1006, Per-locale chrome: nav, footer and Media Room nav/footer for CS, DE, SK, SR, SL

- **Epic:** E10, Localization
- **Type:** content / config
- **Phase:** D · **Milestone:** M2. CS for go-live; the others with their 1004 run.
- **Estimate:** 2 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **GitHub issue:** [#401](https://github.com/skoda-storyboard/demo/issues/401) (created 2026-10-20) (sub-issue of #83)
- **Status (2026-10-20):** 🔵 TODO (M2), no owner. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-X-05, L-CS-06, L-DE-07, L-SK-06/07,
  L-SR-05/06, L-SL-03/04.

## Why
The source has six different Media Room menus, with 26, 26, 4, 11, 9 and 3 links, on translated base paths. The
Storyboard menus differ per market too:
- local social accounts and local legal targets;
- no Series or Podcast in DE;
- cross-locale links: SR "Modeli" goes to the Slovenian `/sl/category/modeli-si/`, and SL Elroq/Enyaq go to Slovak tag
  pages.

EDS today has:
- one `/media-room/nav`;
- 22 MR bulk rows keyed by EN paths;
- `build-locale-alternates --chrome`, which builds only the Storyboard nav per locale. The demo `/sr/nav` already
  copied the SL link.

## Scope
- **Fragments per locale**, authored from the source menus, not copied from EN: `/{loc}/nav`, `/{loc}/footer`,
  `/{loc}/media-room/nav` and `/{loc}/media-room/footer`.
- **Fixes on the way:**
  - SR "Modeli" → the SR models page;
  - SL Elroq/Enyaq → SL model terms, or drop them;
  - the CS contact anchors (`#podnik`, `#produkt`) need explicit heading ids on `/cs/kontakty/`.
- **Media Room bulk rows** on the translated bases, so MR pages pick the MR chrome per locale. Extend `--chrome` to the
  MR chrome.
- **Section matrix per locale:** which MR sections exist. SL has home, images, videos and contacts only. DE has none,
  per Q-8.
- **Check:** a test that fails when a `/{loc}/` chrome fragment links another locale, except the switcher, or links a
  404.
- **Placeholders:** the chrome strings per locale (SKODA-1003 key list).

## Acceptance criteria
- [ ] For each locale that goes live, the four fragments exist and are published together with the locale's pages
      (see "live needs published fragments").
- [ ] Measured on the preview against the source at 768/992/1080 and mobile: menu entries and order match per locale.
- [ ] The cross-locale link check passes for all five locales.
- [ ] A CS Media Room page shows the CS MR nav, not the EN one.

## Dependencies
SKODA-1001, 1003 (placeholders), 302/304 (nav/footer blocks), 303a (switcher), Q-8 (DE Media Room). Needed by
SKODA-1004a–e.
