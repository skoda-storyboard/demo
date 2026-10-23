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
  key shows the English. The sheet starts loading with the page (not awaited).
- Counted texts use `Intl.PluralRules`: `…One` plus the locale's own `…Two`/`…Few`/`…Many` rows
  (CS/SK `Few`, SL `Two` + `Few`). A translated base without its singular never shows English.
- Per-language card and suggestion dates (`dateFormat`, `suggestDateFormat`: `{d}. {m}. {yyyy}`,
  the source's format in every language), search-suggest type labels, and accent folding (NFD,
  combining marks stripped, `đ` → `d`) on both the query and the index text, for search and
  search-suggest.
- `sr` pages: `html lang="sr-Latn"` (`scripts/locale-tags.js`; the source's `sr-RS` carries no
  script, and CLDR reads bare `sr` as Cyrillic, L-SR-04). hreflang stays `sr`.
- The footer's copyright year is the current year; footer, header, embed, clip player, gallery,
  lightbox, media panel, downloads, dock, newsletter, promo box, carousel, model, press kit and
  press release names and tooltips all come from the sheet; the skip link too (L-SL-12).

### The key list and the sheets
- `tools/i18n/ui-text.mjs`: the master key list is built from the code's own `*_LABELS` exports
  (`REGISTRY`, 239 keys); `--list`, `--check [--origin]` (each locale's previewed sheet: missing
  keys, keys no code reads, `{token}` mismatches), `--sheets <dir>`, `--push [--locales]` (DA
  upload + preview, never publish).
- `tools/i18n/ui-text/{cs,de,sk,sr,sl}.json`: each text with `source: live` (copied from the
  source UI) or `draft` (written for the migration: the source has no counterpart, or shows
  English there). The sheet's `Source` column carries it, for the native reviewer.
- `tools/i18n/ui-text.test.mjs`: every exported `*_LABELS` is registered, keys are unique, the
  EN sheet is the master list, each locale has every key, no unknown keys, the English tokens,
  and its integer plural forms.

### Deviations from origin (for PO approval)
- The source shows English on some locale pages (CS "Scroll to top", SK cart tooltips
  "Add/remove this"); the sheets carry translations (drafts).
- `html lang` on SR pages is `sr-Latn`, not the source's `sr-RS`.
- Media panel "Audio codec" (source) has no counterpart: our feed doesn't carry the codec.
- The root redirect is `/` → `/en` on the demo until the CDN rule (above).

### Notes
- Drafts need a native review per locale before go-live: CS 194, DE 196, SK 217, SR 201,
  SL 203 rows (`Source = draft`).
- Facet *option* names (model names, years) still come from the EN `facet-labels.json`
  (L-X-09, SKODA-1001/402d); only the facet group names are in the sheets.
- Previewing the new sheets before this branch merges changes one string on `main`: its stories
  block reads `listingNoResults` for its own empty state, so it would show the listing's
  "No results — clear filters to see more." until the merge.
