# SKODA-1006, Per-locale chrome: nav, footer and Media Room nav/footer for CS, DE, SK, SR, SL

- **Epic:** E10, Localization
- **Type:** content / config
- **Phase:** D · **Milestone:** M2. CS for go-live; the others with their 1004 run.
- **Estimate:** 2 SP · AI-assisted 1d / manual 2–3d *(planning estimate, not a quote)*
- **GitHub issue:** [#401](https://github.com/skoda-storyboard/demo/issues/401) (created 2026-10-20) (sub-issue of the E10 epic #96; moved from #83 on 2026-10-22)
- **Status (2026-10-28):** 🟡 The four acceptance criteria are met on live (see "Verified, 2026-10-28"). The
  fragments were built in #485 (SKODA-1001) and published with its merge; this ticket adds the cross-locale check
  and one importer fix (a heading's single real sub-item). Open: the SK Media Room nav re-push with that fix, and
  the CS contact anchors once `/cs/kontakty/` is migrated. (Was 🔵 TODO, 2026-10-20.) Source:
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
- [x] For each locale that goes live, the four fragments exist and are published together with the locale's pages
      (see "live needs published fragments").
- [x] Measured on the preview against the source at 768/992/1080 and mobile: menu entries and order match per locale.
- [x] The cross-locale link check passes for all five locales.
- [x] A CS Media Room page shows the CS MR nav, not the EN one.

## Dependencies
SKODA-1001, 1003 (placeholders), 302/304 (nav/footer blocks), 303a (switcher), Q-8 (DE Media Room). Needed by
SKODA-1004a–e.

## Verified, 2026-10-28
Built in #485 (SKODA-1001); its content was published with the merge (the 20 fragments, the metadata sheet and the
CS pages, 10:36 GMT).

- **AC1, fragments published with the pages:** `/{cs,de,sk,sr,sl}/nav`, `/footer`, `/media-room/nav` and
  `/media-room/footer` are live and equal preview; the CS, DE, SK and SR stories and the CS Media Room pages render
  them (before the publish, the live locale pages had an empty header and, in CS, no footer).
- **AC2, menu entries and order equal the source** (header menu, top level and sub-entries, in order) at 390 / 768
  / 992 / 1080 / 1280:
  - Storyboard menus on the live CS (8 entries), DE (5), SK (5) and SR (5) Epiq stories;
  - the CS Media Room menu on the live `/cs/tiskove-zpravy` (7);
  - the DE (4), SR (6) and SL (3) Media Room fragments vs the source Media Room pages (no migrated page uses them
    yet);
  - the SK Media Room fragment dropped the source's one model under the `#` "Modely" heading (Fabia, a search
    filter link): `menuList` kept a sub-list only with two items or more. Fixed, narrowly (#542 review): a nav `#`
    heading keeps its one sub-item when that item is not the heading again; every other single sub-item stays out,
    as before. Tests in `locale-chrome.test.mjs` for both sides. Re-imported, the other 19 fragments are unchanged:
    their links equal live's (the footers differ only in serialization, icons and `&amp;`). `/sl/media-room/footer`
    also loses an empty middle section DA kept from its 22 Oct push, the 2-section footer of #511, not from this fix.
  - Rendered by the header (local fragment, 1280 and 390): "Modely" opens a one-item dropdown / drawer list with
    "Fabia", the same markup, type and behaviour as the CS Media Room "Modely" (click, Enter, Tab into the list,
    Escape closes and keeps the focus, outside click closes, `aria-expanded` follows). The link is the source's
    search filter, in a new tab by link policy D-3 (b), as the CS models are. axe on the header: only the language
    row's contrast at desktop, known (#403) and on live too.
- **AC3, cross-locale check:** `npm run import:chrome-check` (`tools/importer/check-locale-chrome.mjs`, tests in
  `check-locale-chrome.test.mjs`) reads the 20 fragments and fails on a link into another locale's tree (English
  included) outside the language switcher, and on an in-site link that does not resolve after the runtime link
  policy (#542 review: the switcher is exempt by position, not by target; only the site's own hosts count; a
  redirect is followed one hop; errors and 429s are retried). On live: no findings. Without its exceptions it reports the 8 source links below (the check is not blind
  to them).
- **AC4:** the live CS Media Room page (`/cs/tiskove-zpravy`) shows the CS Media Room menu, equal to the source's.

**Decisions (PO, 2026-10-28): the source's cross-locale links stay as live** (accepted in the check, `ACCEPTED`):
- SR nav + footer "Modeli" → the Slovenian `/sl/category/modeli-si/` (Serbian has no models page);
- SL nav + footer Elroq / Enyaq → the Slovak tag pages (`/sk/tag/model/elroq-sk/`, `enyaq-sk`);
- SK Media Room "Logo spoločnosti" → a Czech press-release attachment page;
- SR Media Room "Logo Kompanije" → an English press-release attachment page (the same case as SK; confirmed by the PO).
These replace "Fixes on the way" above for SR and SL.

**Open:**
- Re-push `/sk/media-room/nav` (and `/sl/media-room/footer`) with the fixed importer: a DA write, on request.
- The CS contact anchors (`#podnik`, `#produkt`) link the source's `/cs/kontakty/` until the CS contacts page is
  migrated; the heading ids are needed then.
