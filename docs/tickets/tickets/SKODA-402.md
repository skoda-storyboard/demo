# SKODA-402, Faceted listing + load-more block (deep-link paging)
- **Epic:** E04, Listings & Search
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–9d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/faceted-listing.md`](../../ui-specs/faceted-listing.md)** (captured via Chrome DevTools incl. facet-open + mobile-drawer states). Read it before implementing. This fills the facet **visual design** the ticket omitted. Page-type context ([`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md)): one `template-search-results` engine backs Search, Images, Videos, and News.

Key facts from capture:
- Facet UI is a **top full-width pill bar** (NOT a sidebar), 15 pills in order (Model, Derivative, Concept, Bodywork, Equipment, Year, Company, Event, History, Motorsport, Sponsorship, People, Interior/Exterior, Technology, Environment).
- Pills: `35px` tall, radius `5px`, bg `#f6f6f6`, hover `#e4e4e4`; **selected = bg `#419468` + white + ✓ + green count badge**. Clicking a pill opens a `column-width:160px` checkbox panel.
- Results grid: **1 col (<768) / 2 (≥768) / 3 (≥992)**; image listings 4-col @≥992; cells padding `0 10px`, margin-bottom `20px`, capped `1248px`.
- Load-more = ghost pill (radius `50px`, `2px` ink border); count renders `"6 / 1651"` (`.total:before "/"`).
- **Mobile:** the inline bar is `display:none`, revealed by an **"Advanced filter (N)"** toggle in the sort row (a drawer).
- New tokens: `--facet-radius:5px`, `--facet-pill-bg:#f6f6f6`, `--facet-active:#419468`, `--pagination-border:#c9cdd3`, `--grid-gutter:20px`.

## Summary
Build the custom faceted-listing block that reads the per-locale query-index JSON, filters/sorts/paginates entirely client-side, and reproduces the source's `posts_per_page:6` + `history.pushState` deep-link paging.

## Description
The source listings use ElasticPress + an `admin-ajax` load-more (`query_vars` incl. `posts_per_page:6, offset:6`, `ep_integrate:true`, `orderby:post_date`), pushing the offset to the URL via `history.pushState`. The EDS target reproduces this **with no server round-trip**: fetch `/{locale}/query-index.json`, read facet state from URL query params (deep-link), filter across the 15 facet columns + `template`, sort, render the first page as cards, and append the next slice on "Load more". This is the #1 pilot prototype for the static model (High effort / 🟠). Cards rendering reuses the Cards/Teaser block (SKODA-201).

## Requirements / Spec
- **Listing page content model:** a DA doc with a `Listing` block table, first row `Listing`; option rows for `template` filter, default sort, and page size (**6**, matching source).
- `decorate()` flow:
  1. Read current locale from URL prefix → fetch `/{locale}/query-index.json` (chunked if large).
  2. Read facet state from URL query params (deep-link) → filter rows client-side across the 15 facet columns + `template`.
  3. Sort (date/title); render first `pageSize` (6) as cards (via SKODA-201).
  4. Wire **"Load more"** → append next slice; `history.pushState` the offset (reproduces source deep-linking).
  5. Render facet UI from distinct column values; on change, re-filter + update URL.
- Facet checkboxes need labels + keyboard support; listing page still exposes canonical content for crawlers.
- Uses placeholders for UI strings ("Load more") per i18n architecture.

## Acceptance Criteria
Measurable gates live in [`faceted-listing.md` §9](../../ui-specs/faceted-listing.md); summary:
- [ ] Block fetches `/{locale}/query-index.json` and renders results as cards; grid 1/2/3 cols at <768/≥768/≥992 (4 for image listings), gutter `20px`, capped `1248px`.
- [ ] Facet bar = top full-width pills (15, in source order; **News / Press Kits: the 13 the source shows, SKODA-402d**); selected pill = green `#419468` + white + ✓ + count badge; pill opens a `160px` checkbox column panel.
- [ ] Default page size 6; ghost-pill "Load more" appends next 6 with no server round-trip; count renders `"N / total"`.
- [ ] Changing facets re-filters client-side + updates URL params; `history.pushState` offset; deep-linked URL restores state.
- [ ] Mobile: facet bar hidden, opened via "Advanced filter (N)" drawer in the sort row.
- [ ] Loading + no-results states rendered (spinner + empty copy).
- [ ] Facet controls labelled + keyboard-operable; `npm run lint` passes.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel (bar closed + open, mobile drawer).

## SKODA-402d follow-up (#333, 2026-10-14, branch `skoda-402d-listing-facets`)
- **Problem:** News and Press Kits listed only 6 facets (`model, derivative, years, company, happening, technology`,
  the importer default), and `decodeState` reads only configured facets, so a deep link such as
  `/en/news?filter[sponsorship][]=icehockey` was dropped.
- **Source (measured):** both pages show 13 groups, in the order Model, Derivative, Concept, Bodywork, Year, Company,
  Event, History, Sponsorship, People, Interior/Exterior, Technology, Environment. `equipment` and `motorsport` are
  in the form but hidden, and a deep link to them is ignored. So the 15-pill AC above holds for Images / Videos only.
- **Fix (config + importer):** `FACETS_NEWS` in `tools/importer/parsers/listing.js` is those 13
  keys in source order (the 4 listing bundles rebuilt). `/en/news` and `/en/press-kits` were re-imported. The diff
  against DA is the `facets` row only (the Metadata block matches the delivered head). Both pushed to DA preview.
  `urls-pr-listing.txt` now also lists `/en/press-kits/`.
- **Decision (ticket's recommendation):** a URL facet the listing doesn't show doesn't filter, as on the source
  (`filter[equipment][]=rs` stays unfiltered on both).
- **Measured on `main` with the new content (1440 / 768 / 375):** News shows 10 pills and Press Kits 11, in source
  order. The rest have no option in the migrated rows (News: History, Interior/Exterior, Environment; Press Kits:
  Sponsorship, Interior/Exterior) and stay hidden. Deep links: sponsorship=icehockey → "Advanced filter (1)",
  Sponsorship (1), 1 / 1 (the source has 21; the other 20 aren't migrated, out of scope). bodywork=suv → 6 / 7
  (News), 6 / 11 (Press Kits); vip=jahn → 6 / 11. The first result matches the source in each case.
- **Review fix (runtime, `blocks/listing/listing.js`):** a deep-linked value that no row in scope carries keeps its
  option (checked) and so its pill, e.g. `/en/press-kits?filter[sponsorship][]=icehockey` (no migrated kit has a
  sponsorship). The visitor sees the filter that empties the list and can clear it there; before, the list emptied
  with no pill for it (every listing).
- **Review fix (per-page options, `facet-labels.json` `_pages`):** the source orders and offers a group's options per
  page. News lists Bodywork `saloon` before `spaceback`; Press Kits list Event `other` between `motorshow` and
  `premiere`, and offer no Company `other`, though two kits carry it. `tools/importer/build-facet-labels.mjs` now also
  writes each listing page's own option lists (`_pages`; the shared names are unchanged). On a page with a list for a
  group, the listing ranks by it and offers only those options; a deep-linked value keeps its option. Measured
  against the source: every shown group on News, Press Kits, Images and Videos has the source's names and order,
  and no option the source lacks on that page.
- **Review checks (2026-10-14, 1440 / 768 / 375):** pill 100.9 × 35, radius 5, padding 21, 14 / 600, gaps 14 / 7,
  and the open active pill 141px green with its badge hidden: all equal to the source. Wrapping differs only
  where the shown pills differ. axe: `color-contrast` only, ≤ live `main` (#273's source greys). Keyboard: toggle
  → first pill → option (Space) → collapse to the toggle, with a ring at every step.
- **PO re-test (2026-10-14), fixed as live on all four listings at 1440 / 768 / 375:**
  - A filtered deep link keeps the panel **closed**, as the source (it opened since the 2026-09-29 decision). Opening
    it shows the filtered pill's options, as the source.
  - "Advanced filter (n)" stays **regular (400) in every state** (PO decision, 2026-10-14). The source sets it 700
    while a filter is on; that is the one recorded deviation here.
  - The open panel's first pills sit **28px** under the header (was 32).
  - The chip's remove cross is the source's icon-font glyph (skoda-bnr-icons `\e010`, 21px box, no gap; was a 14px
    "×" + 4px gap): chip 205 × 35 with its text 37px in, equal to the source.
  - Measured equal to the source in every case: toggle position on load (y120; y155 at 375), header to first pill
    28, first card position, and the chip box and glyph (the toggle weight aside, above).
- **Noted, not changed:** after a selection the source also hides groups with no option left in the filtered
  results; every EDS listing keeps the scoped set.

## Dependencies
- Upstream: SKODA-401 (query-index schema), SKODA-201 (Cards/Teaser block) / Downstream: SKODA-603 (pilot page set, PR listing), SKODA-702 (performance)

## Risks / Flags
- 🟠 Highest-effort pilot block; the #1 prototype for proving the static architecture.
- Index-only recall: this block filters on indexed columns/facets, not full-text body, reduced recall accepted for pilot.
- `[RUNTIME-UNCONFIRMED]`: load-more scroll/render behavior and deep-link restoration need browser verification.
