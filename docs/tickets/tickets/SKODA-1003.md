# SKODA-1003 — Language-negotiated root routing + per-locale placeholders
- **Epic:** E10 — Localization
- **Type:** localization
- **Phase:** D  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*

## Summary
Reproduce the source's `Accept-Language`-negotiated root redirect and externalize UI strings per locale via placeholders.

## Description
The source root (`/`) 301-redirects to `/en/`, `/de/`, `/cs/`… based on the `Accept-Language` header (a behavior missed until the adversarial pass). This ticket reproduces it via a CDN/edge redirect or a small root-doc script, with a decision on whether to keep auto-detection or default to `/en/`.

It also externalizes UI strings ("Load more", "Search", etc.) into per-locale **placeholders** (`/docs/placeholders`) so blocks render localized chrome without code changes per locale.

## Requirements / Spec
- Root (`/`) routing negotiated by `Accept-Language` → correct locale prefix; documented fallback (default `/en/`).
- Implementation via CDN/edge redirect or a minimal root-doc script (decision recorded).
- Per-locale placeholders sheet(s) for all UI strings used by blocks; blocks read placeholders (no hardcoded strings).
- Graceful default when a negotiated locale is unavailable.

## Acceptance Criteria
- [ ] Root requests with `Accept-Language: de`/`cs`/… redirect to the matching locale; unknown/absent → documented default.
- [ ] UI strings render localized from placeholders in each locale (e.g., "Load more"/"Search").
- [ ] No hardcoded UI strings remain in block code.
- [ ] A decision record captures auto-detect vs. default-to-EN.

## Dependencies
- Upstream: SKODA-303 (language switcher in nav tools), SKODA-1001 (per-locale trees) / Downstream: none

## Risks / Flags
- **R13 (Low–Med):** language-negotiated root routing to reproduce or consciously drop — stakeholder decision on auto-detect vs. default.
- Edge/CDN redirect capability depends on the hosting config — confirm the mechanism available in EDS/CDN.

## Implementation (2026-10-23, branch `skoda-1003-placeholders`)

### Decision record: root routing (R13)
- **Decided (PO, 2026-10-23):** the demo defaults `/` to `/en` now, through the existing `redirects`
  sheet row (`/` → `/en`, slashless per L-X-01). EDS redirects can't vary on a request header,
  and a root-doc script would add a page load and a flash before the redirect, so neither
  reproduces the source on the demo.
- **Go-live:** language negotiation moves to the production CDN in front of EDS, as one rule
  for the path `/` only (every other path passes through):
  - read `Accept-Language`, order the ranges by q-value, match on the primary subtag
    (`cs-CZ` → `cs`, `sr-Latn-RS` → `sr`), first match among `en cs de sk sr sl` wins;
  - no header, `*`, or no match (`fr`, `hr`) → `/en`;
  - answer **302** with `Vary: Accept-Language` and `Cache-Control: private` (the source sends a
    cacheable 301 without `Vary`, so a shared cache can serve one visitor's language to the next);
  - slashless targets (`/cs`, not `/cs/`, L-X-01); then remove the `/` row from `redirects`.
- **Source behaviour, measured 2026-10-23:** `cs-CZ` → `/cs/`, `sk-SK,sk;q=0.9` → `/sk/`,
  `sr-Latn-RS` → `/sr/`, `en;q=0.5,cs;q=0.9` → `/cs/`, `fr,de;q=0.4` → `/de/`, `fr-FR`, `hr` and
  no header → `/en/`; always 301, no `Vary`.
- The first two ACs (negotiated redirect, documented default) close when the CDN rule ships;
  the CDN is owned by the hosting set-up, not this repo.

### UI text per locale
- Every UI string lives in an exported `*_LABELS` object of English defaults next to its code,
  read from the page locale's `/{locale}/placeholders` sheet under a key prefix
  (`scripts/placeholders.js`: `localize`, `applyLocalized`, `placeholdersNow`; the sheet key is
  the prefix plus the camelCased key: `listing` + `newest` → `listingNewest`). A missing or empty
  key shows the English. The sheet starts loading with the page (not awaited); a block waits
  for it at most `SHEET_WAIT_MS` (3 s), then builds in English, so a stalled request never holds
  a section (and every section after it). The late sheet still fills the memo for later readers.
- Counted texts use `Intl.PluralRules`: `…One` plus the locale's own `…Two`/`…Few`/`…Many` rows
  (CS/SK `Few`, SL `Two` + `Few`). A translated base without its singular never shows English,
  and plural rows without their translated base are ignored (no mixed languages).
- Per-language card and suggestion dates (`dateFormat`, `suggestDateFormat`: `{d}. {m}. {yyyy}`,
  the source's format in every language), search-suggest type labels, and accent folding (NFD,
  combining marks stripped, `đ` → `d`, `ł` → `l`, `ß` → `ss`) on both the query and the index
  text, for search and search-suggest (one shared matcher; each row folded once).
- `html lang` is the source's own tag per locale tree (`scripts/locale-tags.js`): `en-GB`, `cs-CZ`,
  `de-DE`, `sk-SK`, `sr-RS`, `sl-SI` (PO decision on #485, 2026-10-26: the regional tag, as live; it
  replaces this branch's earlier `sr-Latn`, L-SR-04). The URL prefixes, the placeholders sheets and
  the language links' `lang` / `hreflang` stay two-letter. The plural rules read the URL locale.
- The footer's copyright year is the current year (the first year after the ©, or the end of a
  range right after it; an open range and later years stay); footer, header, embed, clip player,
  gallery, lightbox, media panel, downloads, dock, newsletter, promo box, carousel, story rail,
  social cards, model, press kit and press release names and tooltips all come from the sheet;
  the skip link too (L-SL-12).

### The key list and the sheets
- `tools/i18n/ui-text.mjs`: the master key list is built from the code's own `*_LABELS` exports
  (`REGISTRY`, 245 keys); `--list`, `--check [--origin]` (each locale's previewed sheet: missing
  keys, keys no code reads, `{token}` mismatches), `--sheets <dir>`, `--push [--locales]` (DA
  upload + preview, never publish).
- `tools/i18n/ui-text/{cs,de,sk,sr,sl}.json`: each text with `source: live` (copied from the
  source UI) or `draft` (written for the migration: the source has no counterpart, or shows
  English there). The sheet's `Source` column carries it, for the native reviewer.
- `tools/i18n/ui-text.test.mjs`: every `*_LABELS` object (exported or not) is registered, keys
  are unique, the EN sheet is the master list, each locale has every key, no unknown keys, the
  English tokens, its integer plural forms, and each plural row right after its `…One` row.

### Deviations from origin (for PO approval)
- The source shows English on some locale pages (CS "Scroll to top", SK cart tooltips
  "Add/remove this"); the sheets carry translations (drafts).
- Media panel "Audio codec" (source) has no counterpart: our feed doesn't carry the codec.
- The root redirect is `/` → `/en` on the demo until the CDN rule (above).

### Notes
- Drafts need a native review per locale before go-live: CS 191, DE 192, SK 224, SR 202,
  SL 211 rows (`Source = draft`).
- Facet *option* names (model names, years) still come from the EN `facet-labels.json`
  (L-X-09, SKODA-1001/402d); only the facet group names are in the sheets.
- Previewing the new sheets before this branch merges changes one string on `main`: its stories
  block reads `listingNoResults` for its own empty state, so it would show the listing's
  "No results — clear filters to see more." until the merge.
- English changes on purpose: the stories block's Load more announcement for one story reads
  "1 story shown" (was "1 stories shown"); EN pages' `html lang` is `en-GB` (was `en`), as the
  source (the PO decision above); everything else reads as on `main`.
- #492 (SKODA-1003a, a child of #85 / SKODA-1003, created by the PO on 2026-10-26) asks to complete
  the DA-managed UI labels: the key inventory, the translated sheets, the remaining consumers and the
  DA preview / publish workflow. This branch delivers that scope.
- Search suggestions drop an unparseable index date from the meta line (`main` printed it as
  written, e.g. `30. 02. 2026`).

### Code review round (2026-10-26)
Three parallel reviews (shared scripts; header/footer/listing/embed blocks; downloads, gallery,
templates, the tool and the translations), each finding reproduced before it was fixed:
- **A stalled sheet held whole sections** (downloads, gallery, header awaited it with no limit):
  `fetchPlaceholders` waits at most 3 s.
- **Search summary**: `%q` / `%d` filled in one pass (a translation may put the query first; a
  `%d` or `$&` in the query stays as typed).
- **Embed**: an authored title with `$` was garbled in the play button's name (English too); a
  poster shown after consent kept the English name; the MP4 and Vimeo-master paths never got
  the locale's fallback name. All fixed.
- **Missed UI text**: the story rail's cart / download buttons and "View all", the social cards'
  "opens in a new tab", the header logo's fallback name. Registered; the test now also flags a
  label object that isn't exported.
- **English left after interaction**: the media-rail lightbox panels (built before the sheet),
  the press-kit video add button, an open lightbox's counter and player names, the newsletter's
  sent message. Fixed.
- **Stories "N shown"** is a counted text (`{n}`, plural rows).
- **Footer ©**: the first year after the ©, not the last year in the notice.
- **Tool**: `--push --locales` rejects an unknown locale before uploading anything; the import
  guard is removed in a `finally`; plural rows sit after their `…One` row.
- **Translations**: the source's own size tooltips for CS / DE / SR ("Přidat/odebrat Original
  verzi", "Hinzufügen/Löschen Original Version", "Dodaj/ukloni Original verzija"), marked live;
  "file" in lower case mid-sentence (SK / SR / SL, SL in the accusative); the slider's name
  distinct from the lightbox dialog's (DE / SK / SR / SL); SK / SL size pills "Original", as the
  tiles' authored sizes.
- Verified after the fixes: no English left on the CS listing and the CS / DE / SK / SR stories;
  English names and texts equal to `main` on 8 EN pages; axe equal to `main` on load and with the
  mobile menu, search and lightbox open (390, 1280); label-in-name (WCAG 2.5.3) on every named
  control; no overflow and unchanged page heights at 390 / 768 / 992, also with the DE, SL and SK
  sheets forced onto the CS pages.

**QA on live after #485 (2026-10-28, #85)**
- **The SK topbar's "Odber noviniek"** was missing from `/sk/nav` and `/sk/media-room/nav`: the source's Slovak
  topbar links its newsletter page (`a.topbar__newsletter-override` → `/sk/odber-noviniek/`), where the Czech one is
  the form control (`a.topbar__newsletter` → `#nl-form`), and the chrome importer knew only the latter. Fixed in
  `locale-chrome.js` `buildNav` (the link kept as the source's; the page is not migrated, so it opens the source);
  re-imported, only the two SK navs change. Their re-push is a DA write, on request.
- **The CS press-release listing shows 0 results:** no CS release is imported yet. SKODA-1004a (the CS corpus); the
  3 newest are held for their PDF / MP4 DAM ingest.
- **The language homes (`/cs`, `/de`, `/sk`, `/sr`, `/sl`) are 404:** not imported. They come with the per-locale
  corpus runs (SKODA-1004a–e), not with #485 (an earlier comment said otherwise).
