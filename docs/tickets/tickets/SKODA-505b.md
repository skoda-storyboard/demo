# SKODA-505b, Media-cart presentation + live AEM DAM delivery wiring
- **Epic:** E05, Media Pipeline
- **Type:** block (presentation layer) · **Phase:** A · **Pilot:** Yes · **Milestone:** M1
- **Estimate:** ~3 SP (presentation half of the former SKODA-505)
- **Split from:** SKODA-505 (paired with SKODA-505a, the download logic).
- **Flag:** 🔴 human-gate

## Summary
The visual and live-delivery half of the media cart: pixel design per `docs/ui-specs/media-cart.md` and the live CORS / AEM DAM delivery-URL wiring that feeds SKODA-505a.

## Requirements / Spec (from ui-specs/media-cart.md)
- Add affordance = round 40x40 `+` button; added state = `.in-cart` scrim + centered glyph.
- Header cart badge = red #ff6666 24px circle showing count, hidden at 0.
- Cart surface = "Your downloads" review page (confirm page vs drawer for EDS).
- New tokens: `--cart-badge-bg:#ff6666`, `--cart-added-scrim`, `--cart-dropdown-shadow`.
- Add a visible item/size-cap indicator (source has none).
- Wire cart items to CORS-enabled AEM DAM delivery URLs (dep 501/504).

## Acceptance Criteria
- [ ] Matches the measured spec at the captured breakpoints (visual review, human gate).
- [x] Live cart fetches DAM originals via CORS; single + multi-select downloads work end to end (verified 2026-09-30 from `localhost` against the live DAM: 2 originals → a 2.8 MB `application/zip`; recheck on the preview is part of the human gate).
- [x] Controls keyboard-operable and screen-reader labelled; block not in the eager phase.

## Dependencies
- Upstream: SKODA-505a (download logic), SKODA-501 + SKODA-504 (CORS-enabled DAM delivery).
- Downstream: SKODA-603.

## Handoff from SKODA-505a (#50)
505a ships the behaviour. 505b renders the pixels and the new surfaces, and calls the API; it builds no second store.
- **API** (`/scripts/media-cart.js`): `getCart`, `add`, `addMany`, `remove`, `has`, `clear`, `onChange`, `download({ onProgress, signal })`, `downloadItems`, `trackView`, `bindCartControl`. See [SKODA-505a](SKODA-505a.md#implementation-2026-09-30-developer-verified-qa-pending).
- **State to style:** bound controls carry `data-in-cart`, plus `aria-pressed` (buttons) or `aria-checked` (size-menu rows); unavailable controls get `aria-disabled="true"`. The `.in-cart` scrim/glyph hangs off these; no class is set.
- **New buttons** (Downloads tiles, media-box group add, press-release sidebar, dock badge): call `bindCartControl(el, { href, title })` for a single asset, or `addMany(entries)` for a group. Refusals return `skipped[{ href, reason }]`, which feeds the "added X / skipped Y" popup and the cap indicator. The reason `network` means "try again"; every other reason is final. Bound controls also fire a bubbling `media-cart:refused` event.
- **Badge:** `onChange((cart) => cart.count)`, or listen for `media-cart:change` on `window`.
- **Review surface:** `getCart().items` (`title`, `filename`, `bytes`, `kind`, `url`), `remove(id)`, and `download()` for single or zip; call `trackView()` on open. Show `download()`'s `failed[]` (fetch errors, or items past the caps).
- **Still open for 505b:**
  - Prove live CORS zipping from the preview (the DAM answers `Access-Control-Allow-Origin: *`).
  - Pick the Original/1920px menu visuals. The 1920px row stays inert (originals only, D5).
  - Design the gallery-lightbox add, which is disabled until content carries the original.

## Implementation (2026-09-30, developer-verified; QA pending)
Stacked on 505a. The approach is presentation only: the store stays in `/scripts/media-cart.js`, and every surface below reads it.
- **Shared UI, `scripts/media-cart-ui.js`** (loaded on use; styles in `styles/media-cart.css`):
  - English defaults for every string, overridable per locale from the placeholders sheet as `mediaCart{Key}` (e.g. `mediaCartBadgeCount`, `mediaCartLimitBanner`, `mediaCartSkippedUnresolved`). `{n}`, `{max}`, `{size}`, `{title}`, `{added}` and `{total}` are filled in; a `…One` key is the singular. When a sheet translates only the base key, its translation is used for one as well, not the English singular.
  - `limitBanner()` is the source's package-limit notice (grey bar, 4px green start rule, "i" disc).
  - `showNotice()` is one reused, non-modal alert (the source's limit popup), which closes with Escape, its close button, or after 8 s. With a lightbox open it goes inside the lightbox, so it shows above it and joins its focus trap. Its Escape listener runs first, so one Escape closes the notice and the next closes the lightbox.
  - `refusalMessage(reason, labels, limits, count)` gives one text per refusal reason; a group add counts per-file reasons ("2 files can't be added to the media cart.").
  - `scripts.js` (`loadLazy`) shows the notice for any bubbling `media-cart:refused` event. Duplicates are silent.
- **Added state**: CSS only, off the 505a attributes (`:has([data-in-cart])`). It is the source's `.in-cart` look: a 40% scrim, and a white cart glyph that shrinks from 64 to 48px with the source's spring (0.3s, delayed 0.3s; none under reduced motion). The add button swaps to the remove glyph, a disabled control is dimmed, and a busy one shows `progress`.
  - Covered: the listing media card (plus a trailing trash icon on the *Original* row), media carousels and story rails, the lightbox add, and the downloads tiles.
  - The lightbox add stores the listing image (the poster, for a video) as the cart thumbnail, not the 1920px slide.
- **Badge**: the float-dock `media-cart` slot links to `/{lang}/media-cart`. It is 58px (40px below 992), with a red `--cart-badge-bg` bubble (24px, 2px white ring). With an empty cart there is no badge (`data-empty`): on the source the empty slot collapses and the badge sits under the scroll-top button; the first add brings it out beside it (x938 scrolled / x1000 at the top, at 1080, as the source). `aria-label` "Media cart, N items"; a polite status announces changes.
- **Cart page, `blocks/media-cart`**:
  - The action row has *Download package* (it becomes *Cancel* while zipping) and *Empty package* as emerald pills, and a count "n / 80 files · size". The pills are icon-only below the 992px viewport and labelled from 992, as on the source (measured at 390/768/991/992/1080/1440).
  - Below it: the limit banner, a progress region (status, `<progress>`, list of failed files), then groups per kind ("Images", "Videos", "Documents", "Other files"). Each group is a `<ul>` of cards: 16:9 thumbnail (or a type tile), "JPG · 2 MB", title (2 lines), and a remove pill *Original* with a visually hidden "Remove {title} from the media cart".
  - Removing moves focus to the next remove button, else the previous one, else the empty message. The empty message is readable text "No downloads".
  - Focus stays where it was when the page re-renders (a store change) and when a download starts or ends.
  - `download()` runs with an `AbortController`: progress is announced per file, and the result is ready, cancelled or failed (with the failed files listed). `trackView()` runs on open.
- **Downloads block** (press-release Media Box): every tile gets a 40px add toggle (the original, D5) left of its download button, as on the source. The section's stats line ("1 video, 4 images, 1 PDF") gets a group toggle: it adds whatever is missing (`addMany`) and, once every addable file is in, removes them all. Its name stays "Add all files to the media cart"; only `aria-pressed` changes. A partial add says what happened ("Added 4 of 6 files to the media cart. 2 files can't be added …").
- **Store additions (505a API, compatible)**:
  - Items keep an optional `thumb` (a root-relative or https URL, sanitised); bound controls pass `data-thumb`.
  - `addMany` now disables the controls of links that don't resolve, as a refused click already did, so a group toggle can reach its "all in" state.
- **Listings** (`/en/images`, `/en/videos`): the limit banner sits between the sort row and the grid (24px each way), rendered with the skeleton so nothing shifts.
- **Tokens**: `--cart-badge-bg` (new brand `--skoda-coral` `#f66`), `--cart-added-scrim`, `--cart-added-glyph(-from)`, `--cart-added-motion`, `--cart-limit-accent`, `--cart-popup-shadow`, `--z-cart-notice`. Icons: `media-cart`, `media-cart-added`, `media-remove`.
- **Deviations from the source (deliberate):**
  - A card shows type · size, not the date.
  - Group headings are `h2`, styled like the source's 26px `h3`.
  - The empty message is `--grey-500`, not `#ccc`, for contrast.
  - The count replaces "Your packages" (package history is out of scope, as is the 1920px row). The gallery-lightbox add stays disabled (no original in content).
- **Measured (localhost, 2026-09-30)**, against the source values in the [spec](../../ui-specs/media-cart.md#3-measured-visual-spec):
  - Cart page at 1200: 4 cards of 280px, 20px apart; pills 53px tall.
  - 992: 3 columns; 768: 2 columns; 390: 1 column, 53×53 icon pills, no overflow.
  - Badge: 58px at ≥992, 40px below; bubble 24px.
  - Press release at 1080: tile add at the tile's left, 231px down, 40×40, 2px ink ring, download 8px right; the group add on the stats line at the right edge. Both identical to the source.
  - Behaviour, re-checked after review:
    - On `/en/images` the notice sits inside the open lightbox and is the topmost element at its centre. Real Escape presses close the notice, then the lightbox, and focus returns to the thumbnail.
    - Live CORS zip of 4 press-release files: per-file progress, then "Your package is ready.", with focus still on *Download package*.
- **Tests:** `scripts/media-cart-ui.test.mjs`, `blocks/media-cart/media-cart.test.mjs`, `blocks/float-dock/float-dock.test.mjs`, plus additions to the store, downloads, story-rail, media-card and lightbox-cart tests.
- **Review fixes (2026-10-01, PR #244 review):**
  - The banner and notice wait for `/styles/media-cart.css` (`loadCartStyles()`, one shared promise, capped at 3 s), so neither renders unstyled and then grows. Measured on the preview: CLS 0.0001 on `/en/images`, 0.0014 on the cart page (the source: 0.0062).
  - A page notice covered by a lightbox opened later leaves Escape to the lightbox (one press closes it).
  - The group toggle takes only the plain-text paragraph right before its block (`statsLine()`); otherwise it gets the toolbar.
  - The cart page title is the source's band: Section Metadata `Style: page-header` (min 240px `#ccc`, white 300 48px/1.1 title centred both ways, 40px above the pills), exact origin by decision, including its 1.6:1 white-on-`#ccc` contrast. Measured equal to the source at 390/768/991/992/1080/1440.
- **Needs a human (content, not code):**
  - ~~Author the DA page `/en/media-cart`~~ **Done 2026-10-01:** imported with `tools/importer/import-media-cart.js` (`Style: dark` section with the h1 "Your downloads", then an empty `Media Cart` block; metadata `template: page`), pushed, previewed and published with `import:push`. Media Room nav/footer/section come from a new `/en/media-cart` bulk metadata row. `media-cart` is registered on `main` in `tools/importer/push/block-contracts.json` (without it the block gate holds the page). Until this PR merges, `main--…aem.live/en/media-cart` shows the band with an empty block (the block code 404s on main).
  - Optional `mediaCart*` rows in the placeholders sheet for other locales.

## Human gate
Visual fidelity + live CORS/DAM delivery are not agent-handoffable (pixel judgment + live endpoint).
