# SKODA-813, Generic Page base shell template
- **Epic:** E08, Editorial at Scale
- **Type:** template / import
- **Phase:** B  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-10-21):** 🟡 Built on branch `skoda-813-page-shell`, measured equal to the source on Copyright
  (STO) and the Contacts band (MR). See "Implementation (2026-10-21)".

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
- Upstream: SKODA-202 (hero), SKODA-304/305 (footers), SKODA-309 (MR side chrome), SKODA-814 (SiteOrigin body contract)
- Downstream: SKODA-810 (company sub-type blocks fill the MR variant), SKODA-802 (remaining-templates import), SKODA-843 / 844 / 845 (generic, featured-image and newsletter pages), SKODA-1001 (per-locale trees)
- *(2026-10-15: 802 moved from upstream to downstream. The shell doesn't need the remaining-templates import; that import needs the shell. OVERVIEW listed 202, 801.)*

## Risks / Flags
- **Mobile heading scale (🟡):** source keeps 48px/40px on mobile; default add a modest mobile step (confirm vs source-faithful).
- Confirm the STO vs MR shell selection + the two footers/nav sets (see `_TEMPLATES.md`).

## Implementation (2026-10-21)
**What was there:** `import-page-base.js` (SKODA-601 pilot) emitted `Hero Image (overlay)` and one flat body. No
generic page had been imported. Without an image the overlay hero drew no band (0px from 768), and the body
used the site's default type (h2 34/42.5/600). The committed bundle no longer matched its sources (rebuilt).

**Built**
- `Hero Image (page)` (blocks/hero-image): the 240px band at every width; the image covering it under the
  shared scrim, else 5% ink under it (the source's empty band); the white 48/52.8 wt300 title, 16px up.
  `parsers/hero-banner.js` (page-base and company pages) emits it.
- `transformers/skoda-page-rows.js`: one section per SiteOrigin row, `Style: page-body`; a row set in the left
  half of a 50/50 row is `page-body, half` (+ `empty-cell` when its right cell holds an empty widget, 10px on
  phones). The cell widths are read in `preprocess`, before the importer drops `<style>`.
- `styles.css` `page-body` sections: 10px per row, 20px text inset (30px from 781), h2 40/45 and h3 24/27.6
  wt300, p 20px apart, half rows (W − 60 − 40) / 2 from 781, green links (ink on hover), 20px to the footer.
- Side: the bulk metadata sheet already gives `/en/contacts` the Media Room nav, footer and section. Nothing
  to add.
- Contract (`hero-image` `page`, `page-body`), library entries, spec §8–10, tests (hero page variant, the
  transformer on a trimmed copyright fixture).

**Measured, the source vs the import** (local code, the import rendered as delivered; no screenshots)

| | 390 | 768 | 780 / 781 | 992 | 1080 | 1440 |
|---|---|---|---|---|---|---|
| Copyright body: every h2 / h3 / p (type, margins, x, y, width) | equal | equal | equal | equal | equal (from the band) | equal |
| Band 240px, title 48/52.8/300 white at x10 (x106 at 1440), 16px up | equal | equal | equal | equal | equal | equal |
| Empty band pixels (4 samples) | – | – | – | – | – | equal |
| Contacts band image (4 samples) | ±1–3 | – | – | – | – | ±1–3 |
| Footer gap | 20 / 20 | 20 / 20 | 20 / 20 | 20 / 20 | 20 / 20 | 20 / 20 |

`import:validate-blocks`: both pages pass. Heading outline equal (H1, H2, 3 × H3).

**Deviations from origin (need PO approval)**
- The body link's keyboard focus keeps the site's 2px ring; the source shows none (css-guidelines §8).

**Kept as the source (PO decisions 2026-10-21, "same as live")**
- The 48px title and 40px h2 on phones (no mobile step).
- The white title on the empty band: about 2.3:1 behind its first letters, below AA's 3:1 for large text.
- The body links' green #419468: 3.71:1 on white, below AA's 4.5:1 (the site's AA green #3a835c was offered).
- A long title in the fixed 240px band: at 320px the consent page's title rises out of the band and its first
  lines go under the header, on the source too (a band that grows with the title was offered).

**Accessibility (axe-core, WCAG 2.1 A/AA, 390 and 1440)**
- The source: 3 rule types at 390, 5 at 1440 (contrast, link-in-text-block, link-name, button-name, an unnamed
  input). Ours: only `color-contrast`, on the two colours above (the title, the green link) and the shared
  header's subscribe link (SKODA-703 scope).
- Heading outline equal to the source (H1 → H2 → H3); the band title is the page's single h1. Link focus keeps
  the 2px ring (the one deviation).

**Found, not in this ticket**
- At exactly 1080–1128 the source header wraps to 172px; ours keeps one row (decided in SKODA-308).
- The Media Room footer's social row (Facebook, Instagram, …) starts the source footer; ours doesn't. This is
  the same on `main`'s /en/news (SKODA-305 scope).
- `/en/contacts` body (the contact directory) is SKODA-810; the flattened body is unstyled until then.
- `/en/newsletter-settings` uses its own subscription-settings template, not this shell.
- The source copyright text has the typo "maximum pon of your privacy" and a site-relative `/privacy-statement`
  link; both kept as the source.
- **For SKODA-843 (legal set), measured on the consent document** (`/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/`,
  imported locally with this importer, not pushed):
  - the band, the long title's wrapping and the first row are equal to the source at 320 / 768 / 1440;
  - its 20-row label / value `<table>` becomes an unknown block (`purpose-of-the-processing`); the block gate
    holds the page (`import:validate-blocks`: "hold publish"). The story importer's `tablesToColumns`
    (skoda-story-cleanup.js) does this conversion for stories; the page importer needs it plus the table's
    look;
  - the 44 × 38 icon floated left inside its second h2 moves to its own paragraph under the heading (43px lower
    text from there); the icon is on `skoda-ms.s3.amazonaws.com`, not the CDN.
