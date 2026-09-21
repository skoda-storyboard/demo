# SKODA-813, Generic Page base shell template
- **Epic:** E08, Editorial at Scale
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/template-page-base.md`](../../ui-specs/template-page-base.md)** (captured via Chrome DevTools on the live Copyright page + Contacts). Read it before implementing. Template map: [`docs/ui-specs/_TEMPLATES.md`](../../ui-specs/_TEMPLATES.md).

Key facts from capture (2026-09-15) that create this ticket:
- The base "Page" shell (`page`, SiteOrigin) has **two side variants**: `page-template-default` (STO, e.g. copyright/legal) and `page-template-template-media-room-page` (MR, e.g. contacts + the company pages). They differ only in chrome (header nav set + footer).
- Shell = **hero banner** (`240px`, title `h1 48px/52.8/300` white overlay) + **single-column** SiteOrigin content (`h2 40px/45/300`, body `16/24/400`, `p mb 20`); no sidebar, cap `1248`.
- Source keeps `48px`/`40px` headings on mobile (no scale-down), flag for a mobile step.
- The MR variant hosts the company sub-type blocks (see SKODA-810 / `company-pages.md`).

## Summary
Deliver the shared generic Page shell (hero banner + single-column SiteOrigin body) used by legal/utility pages and, on the MR side, by the company pages. This is the "🟢 native" base template; company-specific blocks stay in SKODA-810.

## Description
Confirmed live on Copyright (STO) and Contacts (MR). This ticket delivers:
- **Shell selection by side:** `template=page` → STO chrome; `template=media-room-page` → MR chrome.
- **Hero banner** with the page title (thin-weight overlay).
- **Single-column body** = SiteOrigin content flattened to default rich text + blocks.
- **Parser (with SKODA-802):** map hero + title + body; the MR variant additionally routes to the company sub-type blocks.

## Requirements / Spec
- Reuse `hero` banner + default rich-text decoration; no sidebar.
- STO vs MR chrome driven by the `template=` Metadata value.
- Company-page content blocks remain SKODA-810; this ticket is the shell + generic (legal) pages.

## Acceptance Criteria
Measurable gates live in [`template-page-base.md` §10](../../ui-specs/template-page-base.md); summary:
- [ ] Shell selected by side: `page-template-default`→STO chrome; `template-media-room-page`→MR chrome.
- [ ] Hero banner `240px` with page title `h1 48px/52.8/300` white overlay.
- [ ] Single-column `article` (no sidebar); cap `1248`, gutter `~16px`; `h2 40px/45/300`, body `16/24/400`, `p mb 20`.
- [ ] MR variant hosts the company sub-type blocks (SKODA-810); STO variant = plain rich text.
- [ ] Mobile: single column; heading scale per the confirmed decision.
- [ ] Visual diff vs source at 1280/500 ≤ 2% per-pixel (hero + body).

## Dependencies
- Upstream: SKODA-202 (hero), SKODA-802 (remaining-templates import), SKODA-304/305 (footers)
- Downstream: SKODA-810 (company sub-type blocks fill the MR variant), SKODA-1001 (per-locale trees)

## Risks / Flags
- **Mobile heading scale (🟡):** source keeps 48px/40px on mobile; default add a modest mobile step (confirm vs source-faithful).
- Confirm the STO vs MR shell selection + the two footers/nav sets (see `_TEMPLATES.md`).
