# SKODA-810, Company/Page template family (5 sub-types)
- **Epic:** E08, Editorial at Scale
- **Type:** template / block / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–10d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/company-pages.md`](../../ui-specs/company-pages.md)** (all 5 sub-types captured live via Chrome DevTools; shared foundations + 5 delimited sub-specs A-E). Read it before implementing. These sub-types sit inside the shared [`template-page-base.md`](../../ui-specs/template-page-base.md) MR shell (SKODA-813); page-type map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Live URLs + key measured facts:
- **board-of-management** (`/en/board-of-management/`) → exec-bio: 2-up card rows (stack <768), 16:9 portrait `574×322`, name `24px`/600, "show more" = the same `row-toggle` accordion as FAQ, expands to a `159px` 16:9 photo grid.
- **annual-reports** (`/en/annual-reports/`) → download-list: flex grid 2/3/4/5 cols (base/576/768/992), A4 covers `padding-bottom:141.42%` radius 8px, round `40×40` save button (demo-stub).
- **company-logo** (`/en/company-logo/`) → brand-asset grid: 3 tiles/row, dual "PDF / PNG" emerald links (~18-20 live assets, not 36).
- **skoda-media-services-application** (`/en/skoda-media-services-application/`) → app-promo: hero + QR (`168/198px`) + `305×87` raster store badges (vs footer SVG `135×40`).
- **contacts** (`/en/contacts/`) → contact-directory: 2-up 16:9 portrait cards, 2 dept groups; email `mailto:` emerald, **phone is plain text (no `tel:`, a11y gap to fix)**.
- Effort order (per this ticket's split note): lowest = contacts, board; medium = annual-reports; highest = company-logo, app-promo.
- New tokens: `--heading-font-size-person:24px`, `--ratio-a4:141.42%`, `--app-badge-img-w/h:305/87`; reuse `--gallery-accent:#419468`, `--grid-gutter:20px`, `--pill-radius:50px`.

## Summary
Build the five distinct **"company/Page" template sub-types** surfaced by the 22-URL analysis (2026-09-14) that were previously subsumed in the generic "Page" family (334 pages / 9.6%) and are absent from the M1 plan. Each needs a net-new block; all share only hero + chrome. Deferred to M2 (decision D18).

## Description
Verified live (`.migration/plans/url-analysis-comparison.md`, Bucket H):

1. **board-of-management**, 2 groups (Board / Chief Officers) of exec cards; each card = name/title/appointment-date/portrait + an **expandable "show more" photo gallery** + CV / photo-set / press-release / LinkedIn links. → **exec-bio accordion** block.
2. **annual-reports**, reverse-chronological list (2025→2000); each item = title/year, PDF-cover thumbnail, PDF link, save-heart. → **download-list** block.
3. **company-logo**, 3 groups × 6 colour variants = 36 downloadable assets, each with dual **PDF + PNG** download. → **brand-asset grid** block.
4. **skoda-media-services-application**, app-promo marketing page: hero + intro + screenshots + feature list + QR code + app-store badges. → **app-promo** block.
5. **contacts**, department-grouped directory (Corporate Comms / Product Comms); each entry = name/title/email/phone/photo/LinkedIn. → **contact-directory** block.

Each is content-driven and static (no runtime services). The download/asset pages share the downloads/media-cart infrastructure (SKODA-502/505); the app-promo reuses hero + app-store badge patterns already in the footer chrome.

## Requirements / Spec
- One reusable block per sub-type (exec-bio accordion, download-list, brand-asset grid, app-promo, contact-directory), each authored from DA content with no page-specific code.
- Parsers detect each source layout and map to DA sections + a canonical Metadata block (template per sub-type).
- Accordion / expandable galleries use the shared a11y accordion approach (ARIA `button` + `aria-expanded`, keyboard operable), reuse from SKODA-806/807.
- Download items reuse the downloads block (SKODA-502); dual-format (PDF+PNG) rendered as grouped download actions.
- Media pre-conditioning applies to any image-heavy page (board portraits, logo assets).

## Acceptance Criteria
- [ ] Each of the 5 pages renders from its reusable block with no page-specific development.
- [ ] board-of-management: exec cards expand to reveal galleries; CV/photo/press/LinkedIn links resolve.
- [ ] annual-reports: reverse-chron list with PDF-cover thumbs + working PDF links.
- [ ] company-logo: 36 assets, each with PDF + PNG downloads.
- [ ] media-services-application: hero + screenshots + QR + app-store badges.
- [ ] contacts: department-grouped entries with email/phone/photo/LinkedIn.
- [ ] All five pass lint and match source in local preview; accordions keyboard/SR accessible.
- [ ] Measurable per-sub-type gates met per [`company-pages.md`](../../ui-specs/company-pages.md) (grids, portrait ratios, A4 covers, badge sizes); phone numbers use `tel:` (fix source a11y gap); visual diff vs source ≤ 2% per-pixel.

## Dependencies
- Upstream: SKODA-202 (hero), SKODA-304 (app-store badges / social, reused by app-promo + contacts), SKODA-502 (downloads block), SKODA-601/602/803 (import infra + bulk push), SKODA-106 (design tokens)
- Downstream: SKODA-1001 (per-locale trees)

## Risks / Flags
- Five net-new blocks in one ticket, if effort runs hot, split per sub-type (contacts + board are the lowest-effort static pairs; downloads/logo/app can follow).
- Exec-bio expandable galleries + accordion focus/ARIA is `[RUNTIME-UNCONFIRMED]`, verify in a browser.
- Source pages carry dynamic bits (save-heart / newsletter) that are demo-stubbed elsewhere; render static per the as-is-fidelity scope.
