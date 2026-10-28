# SKODA-1001 — Per-locale content trees + per-locale query-index
- **Epic:** E10 — Localization
- **Type:** localization
- **Phase:** D  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–6d *(planning estimate, not a quote)*

## Summary
Stand up the six per-locale content trees (`/en/ /de/ /cs/ /sk/ /sr/ /sl/`) and per-locale query-indexes via `helix-query.yaml`, mirroring the source's locale-prefix IA.

## Description
The source uses a region-first `/xx/` IA and everything is locale-scoped (banners, subscribers, mediaboxes, search). This ticket establishes the EDS equivalent: a content tree per locale and a **per-locale query-index** defined in `helix-query.yaml` using the docs' default-and-override pattern (each locale maps to `/en`, `/de`, …), output at `/{locale}/query-index.json`.

Translation coverage is **uneven per-item** — a story living in 4 of 6 languages is simply 4 docs, which the per-locale-docs model handles natively (no uniform 6× assumption). This ticket sets up the trees and indexes; the actual translation rollout is SKODA-1002.

## Requirements / Spec
- Six locale content-tree roots under `/en/ /de/ /cs/ /sk/ /sr/ /sl/`.
- `helix-query.yaml` per-locale index definitions (default + per-locale override), each emitting `/{locale}/query-index.json` with the 15-facet schema.
- `hreflang` metadata wired per locale; uneven coverage tolerated (missing locales simply absent).
- Faceted-listing and search blocks read the correct locale index from the URL prefix.

## Acceptance Criteria
- [ ] Each of the six locales resolves its own content tree and `/{locale}/query-index.json`.
- [ ] Listing/search blocks pick the locale index from the URL prefix.
- [ ] `hreflang` is correct per locale and tolerates items missing in some locales.
- [ ] Index facet schema matches the EN Phase A index across all locales.

## Dependencies
- Upstream: SKODA-401 (query-index schema + helix-query selectors), SKODA-603 (pilot content validated) / Downstream: SKODA-1002 (Translation rollout), SKODA-1003 (root routing + placeholders)

## Risks / Flags
- Per-language content totals were never enumerated for all 6 (adversarial C8 / downgrade) — scope per locale is an estimate until content-ops maps actual coverage.
- Which locales are actively maintained vs. stale is unconfirmed — confirm before full rollout.

## M2 readiness review (2026-10-15)
- **Items with no English version** (REST, Polylang `translations`): stories CS 162 / DE 527 / SK 286 / SR 45 / SL 157; press releases CS **894** / DE 1 / SK 354 / SR 50 / SL 2. That is **2,478** in total, 1,056 of them in CS. They never come out of an EN import, so the per-locale trees need their own enumeration.
- Census: [coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §4.

## Implementation (2026-10-22)
`helix-query.yaml` is retired; the indexes are site config at tools.aem.live. `/{cs,de,sk,sr}/query-index.json` already exist with the same facet columns as `/en/` (EN also has the 5 media-item columns `mp4, original, poster, rendition-1920, vimeo-id`, which belong to the per-locale media feeds, SKODA-1002). **Slovenian has no index**: `/sl/query-index.json` 404s, and reading the index config returned 403, so whether one is configured is unknown. An index is built on publish, so until the locale pages are published each locale index lists only what is live.

**Runtime: the locale comes from the URL prefix.**
- `scripts/locale-paths.js` is the one map of each locale's section paths (`LOCALE_PATHS`: home, Media Room, news, press kits, images, videos, search, media cart, series, contacts, newsletter; the source slugs differ per locale, `_` becomes `-` in EDS), content prefixes (`CONTENT_PREFIXES` per template) and what is built per locale so far (`BUILT`: the media feed and the 404 fragments are English only). `localePath(key, pathname)` falls back to English for a section a locale lacks.
- The media cart link, the model page's news link, the 404 variants and the lightbox's media feed use it, instead of `/en/…` constants.
- `scripts/links.js` no longer sends every non-English path to live (the old LIVE_ONLY locale rule). Which links stay on EDS is decided at import (below), so a migrated `/cs/` page links to migrated `/cs/` pages.

**Import: every importer takes the source page's locale.**
- `tools/importer/locale.js`: `sourceLocale(url)`, `indexUrl`, `mediaFeedUrl`, `contentPath`, `homePath`.
- Listings pick their variant from the page path (a Czech body class token is the slug, e.g. `tiskove-zpravy`) and write the locale index plus the locale content prefix: `/cs/tiskove-zpravy` gets `index /cs/query-index.json`, `path /cs/tiskove-zpravy-archiv/`. Story Rail, home rails, home stories and promo box are locale aware.
- `transformers/skoda-links.js`: tag filter links are locale generic; the allowlist is regenerated from every locale's published index (`build-link-allowlist.mjs --refresh-published`, 414 pages). An unmigrated target stays an absolute live URL.

**Chrome per locale** (`locale-chrome.js`, `import-locale-{nav,footer,newsletter}.js`):
- Storyboard: `/{l}/nav`, `/{l}/footer`, `/{l}/nav-newsletter` for cs, de, sk, sr, sl.
- Media Room: `/{l}/media-room/nav` and `/footer`. The source body class `media-room` selects them: brand "Škoda Media Room", a `#` menu parent becomes a heading, the footer widgets become h2 sections (Contacts, Subscribe, Company).
- The language row uses the source's own language links, so Media Room links point at each locale's Media Room and German at skoda-media.de.
- The cookie-policy PDFs on `assets.cookies.skoda-auto.com` (de, sk, sr footers) are external documents, so the binary gate lets them pass (`EXTERNAL_DOCUMENT_HOSTS`).

**Metadata sheet** (`build-locale-alternates.mjs`):
- `chromeRows` writes `/{l}/**` → `/{l}/nav`, `/{l}/footer`.
- `mediaRoomRows` writes each of the locale's Media Room sections and content prefixes, and its `/**`, → `/{l}/media-room/nav`, `/footer`, section `media-room`. Only the locale's own paths are written (a section that falls back to English gets no row), and these rows come after `/{l}/**` so they win.
- Re-runs replace the tool's rows in place (`isChromeRow`). The English curated rows are untouched.

**On preview** (2026-10-22, nothing published):
- 15 Storyboard and 10 Media Room chrome fragments.
- The sheet, 551 rows (+100 Media Room rows; no row changed or removed).
- Czech proof: three Czech stories and `/cs/category/e-mobilita-cs`. Its card reads `/cs/query-index.json`, which lists only the published Epiq story until the others are published.
- `/cs/tiskove-zpravy`: Czech Media Room nav and footer at 1280 and 375, `lang="cs-CZ"` (as live, since 2026-10-26), no horizontal overflow. 0 cards, because no Czech press release is published.

**Not done / notes:**
- **3 Czech press releases** (the newest, 19–22 Oct) are imported locally but held by the binary gate: their 3 PDFs and 3 MP4s are tracked in `media-manifest.json` as pending; push them after the developer-machine DAM ingest (`tools/importer/media/README.md`).
- Listing and search UI labels are English on locale pages (live `/cs/tiskove-zpravy/`: "Nejnovější / Nejstarší"): placeholders, SKODA-1003.
- The per-locale media feeds (`BUILT.mediaFeed`) and the translated 404 fragments: SKODA-1002.
- Live's Slovak newsletter page is in English; imported as is.
- `/en/contacts` is still a LIVE_ONLY entry in `scripts/links.js`; #409 migrates the page and owns the entry.
- **Review (2026-10-23):** the locale chrome was measured against live at 390, 768, 992 and 1280 on the
  translated Epiq stories (CS, DE, SK, SR) and `/cs/tiskove-zpravy`. Header and footer heights, the menu type
  and the footer headings (h3) are equal on all of them after these fixes:
  - **German nav and footer** (and Slovenian): the preview copies predated the `#` parent fix, so "Modelle" and
    "Lifestyle" were Subscribe links with no sub-items (14 of live's 25 header links). Re-imported. In the
    footer, a `#` parent's label links to its first link, as the source's phone footer; from 992px
    `footer-sections.js` hides a label that repeats its column's first link (same page and name; the Slovak
    "Škoda svet" shares a page with its first link under another name, and keeps its label, as live).
  - **The nav's language row** used the source page's own language links, so a nav built from a story linked
    "EN" to that story's English translation. Only a locale or Media Room home, or another site
    (skoda-media.de), is kept now (`siteWideLocaleHref`).
  - **The footer's social row**: TikTok and LinkedIn (the German footer) were not known icons, so they stayed
    an unnamed paragraph (30px, two unnamed links). They join the row, named; `icons/tiktok.svg` added.
  - **The media cart badge** linked a Czech page to the source's `/cs/kontakty/kosik`, not a demo page (404).
    The cart page is built for English only (`BUILT.mediaCart`), and it keeps every locale's cart.
  - **The story newsletter card** was added to every locale's story sidebar; live has it in EN and CS only, and
    only those fragments exist, so DE / SK / SR stories showed an empty, unnamed link (axe `link-name`). Only
    EN and CS get it now, and the placeholder link is hidden from the tab order and the accessibility tree.
  - **The listing's status text** ("No results…", shown by an empty locale listing) was 4.1:1; grey-600 now.
  - Header interactions (desktop dropdown by hover and keyboard, Escape, the mobile drawer and its language
    list, resize after closing) behave as on the English pages.
  - **Links to previewed pages:** the allow-list counted only published pages, so the Czech chrome and stories
    linked the previewed `/cs/tiskove-zpravy`, `/cs/category/e-mobilita-cs` and the Sportline story on live.
    `--refresh-published` now also reads the push manifest's previewed pages (PO decision 2026-10-23; they
    publish together with the chrome). A link audit of the 6 test pages finds no live link to a demo page;
    the remaining live links name pages not migrated yet (SKODA-1002) and the source's `/direct-download/` files.
- **Known, not changed here:** the language row's contrast at desktop (#403, EN too); the listing's "oldest" sort
  button and the footer's "Manage subscription" link contrast (EN too); the header shows only a page's migrated
  translations (SKODA-303a), where live always lists every locale; the footer's App Store / Google Play badges
  are the English artwork in every locale, where live has each language's (`#app-store-de`, `#google-play-cs`,
  …): **accepted** by the PO (2026-10-26); their accessible names stay localized work (SKODA-1003).
- **#485 review (2026-10-25), follow-up 2026-10-26:**
  - The Media Room footers do have the social row: Facebook, Instagram and YouTube on `/cs/tiskove-zpravy` and
    `/en/news`, as live. The earlier "no social row" note was stale and is removed.
  - The badge gap above was missing from the deviation list.
  - `/sl/query-index.json` is still 404 (no SL page is on preview yet). D1 makes SL on demand, so the
    six-index criterion stays open until an SL page is imported; the five others respond with the same columns
    and the 15 facets.
- **PO decisions on #485 (2026-10-26):**
  - **Document language: the source's regional tags.** `scripts/scripts.js` sets `<html lang>` from the
    page's locale tree to live's own tags: `en-GB`, `cs-CZ`, `de-DE`, `sk-SK`, `sr-RS`, `sl-SI` (measured on
    live, Storyboard and Media Room pages alike). The URL prefixes (`/cs/`), the placeholders sheets and the
    language links' `hreflang` / `lang` stay the two-letter codes. The skip link's text is looked up by the
    URL locale, not the html lang, so it keeps its language (checked: `Přeskočit na obsah`, `Zum Inhalt
    springen`, … on the CS / DE / SK / SR pages; axe: no `lang` violation). Since the merge with `main`
    (2026-10-28, after #496) both come from #496's code: the tags from `scripts/locale-tags.js` (the same
    six), the skip link from the locale's placeholders sheet (`skipToContent`).
  - **English store-badge artwork: accepted** (above).
  - **UI labels must be DA-managed:** the remaining English listing / search / header labels are #492
    (SKODA-1003a, a child of #85 / SKODA-1003), not a permanent deviation.
- **Merge note:** merging this code removes the runtime locale rule, so the chrome fragments and the sheet above must be published together with it. Otherwise the relative `/cs/…` links in the published chrome, which the rule sent to live, become unmigrated EDS paths (404).
- **Merge with `main` after #496 (2026-10-28):** conflicts in `scripts/scripts.js` (`main`'s: the same regional
  `<html lang>` and the sheet's skip link), `blocks/footer/footer-sections.js` (both: this branch's German / Slovak
  label columns and TikTok / LinkedIn, #496's localized nav name), and the imports of `scripts/media-lightbox.js`
  and `templates/skoda-model/skoda-model.js`. `import-carousel-listing.bundle.js` (#497) rebuilt from the merged
  transformers: the newsletter import is byte-identical. #496's image-link test now serves the English feed a
  Czech page reads (`BUILT.mediaFeed`). Checked on the merged code: CS story `cs-CZ`, `Přeskočit na obsah`,
  footer `Zápatí`, Media Box caption `Typ souboru` / `Zavřít galerii`; DE story `de-DE`, `Fußzeile`, the
  Modelle / Lifestyle label columns, TikTok and LinkedIn; the Octavia drawing lightbox.
- **Note (out of scope, already on `main`):** `tools/i18n/ui-text.test.mjs` "the registry names every label
  object" fails on `main` since #483 + #496: `blocks/exec-bio/exec-bio.js` `LABELS` (Board of Management) is not
  in `REGISTRY`. Its fix needs the sheet keys and the 5 translations.
