# SKODA-843, Generic pages: legal set, BGC, sustainability page, and the keep / drop list for the rest
- **Epic:** E08, Editorial at Scale
- **Type:** import / template · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#363](https://github.com/skoda-storyboard/demo/issues/363) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 2–3 SP *(planning estimate, not a quote)*
- **Status (2026-10-27):** 🟡 Built on branch `skoda-843-generic-pages`: the EN set (17 pages) imported with
  `import-page-base` and on preview; Sustainable Offices on its own importer and template. Locales follow #485 (PO,
  2026-10-26). See "Implementation (2026-10-27)"; DA steps waiting on an explicit request are under "Pending".

## Why
The census ([coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §2) found 41 EN `page-template-default` pages
and 1 `template-sustainability` page. None of them is imported or live. Some of them are linked from the footer on every
page: copyright and the consent document. Others are empty or obsolete.

## Scope
| Group | Pages | Proposal |
|---|---|---|
| Legal, footer-linked | `/en/copyright/`, `/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/` | **Must** at go-live: page base (813) |
| Legal, other | `/en/documents/`, `/en/documents/cookies/` (2,132 words), `/en/terms-and-conditions-2/`, `/en/newsletter-terms-and-conditions/`, `/en/botas-x-skoda-guess-where-are-we-competition-terms-conditions/` | Keep: page base. Confirm with the client's legal owner |
| Company | `/en/brand-group-core-bgc/` (MR nav Company menu; 380 words, 1 image, 1 embed) | **Must**: page base on the MR side (nav/footer metadata as 309) |
| Sustainability | `/en/sustainable-offices/` (`template-sustainability`, 2,193 words, 28 images) | Page base + Columns / images. Check one representative render |
| IIHF campaign legal | 7 pages under `/en/iihf/…` (`/en/iihf/` itself 302s) | Client decision: keep or redirect |
| Empty / obsolete | `/en/impressum/` (1 word), `/en/server-status/`, `/en/soon-also-in-german/` | Drop and redirect. Client to confirm |
| Event photo pages on this template | ~17 (`/en/scd2021/*`, `skoda-digilab-rebranding-event`, `ivet23`) | Go with SKODA-210 (event galleries) |

## Acceptance criteria
- [ ] Client-confirmed keep / drop list. Every dropped URL has a redirect row (609 pattern).
- [ ] Every kept page is imported with `import-page-base` and previews with valid metadata; the footer-linked legal pages
      and BGC are published before go-live.
- [ ] The footer links to copyright and consent resolve on `.aem.live` (no 404).

## Dependencies
813 (shell), 809/D15 (who owns legal copy), 609 (redirect sheet).

## Implementation (2026-10-27)
**Scope (PO, 2026-10-26):** the EN set now, the locales after #485. The near-empty pages are imported as on live, and
the IIHF index URLs redirect as on live ("apply as per live").

**Pages**
- `import-page-base` (17, `urls-page-base.txt`): `/en/brand-group-core-bgc`, `/en/documents`, the consent and
  cookies documents, `/en/terms-and-conditions-2`, `/en/newsletter-terms-and-conditions`, the Botas competition
  terms, `/en/impressum`, `/en/server-status`, `/en/soon-also-in-german`, and the 7 IIHF pages
  (`terms-and-conditions`, `picture-guidelines`, the `lv/` and `ru/` copies, `ru/gdpr`). All 17 are pushed and previewed.
- `import-sustainability` (`/en/sustainable-offices`, `urls-sustainability.txt`) with its own template
  (`templates/sustainability`, `theme: sustainability`) and chrome (`/sustainability/nav`, `/sustainability/footer`).

**Built (page base)**
- `transformers/skoda-page-tables.js` and a `Table` block (`Table`, `Table (header)`): the consent tables. A
  `colspan` cell takes its columns (a block has no spans); rowspan is not modelled.
- `transformers/skoda-page-offset.js`:
  - the spacer widget becomes `Spacer` (24px per em);
  - a blank editor line becomes `Spacer (line)` (44px; 24px when it ends a paragraph); one inside a table cell
    stays in the cell (a Table block can't hold a Spacer);
  - the editors' `&nbsp;` indent runs are kept (paragraphs, headings, list items), via the skoda-nbsp placeholder.
- `transformers/skoda-page-buttons.js`: the `ajax-loader-button` pill becomes a secondary button (centred, 20px above
  and below); one inside a sentence stays an inline emphasized link.
- `skoda-page-rows.js`: a body without rows is `page-body, plain` (no widget inset, 10px at each side). A one-cell
  row's further widgets are sections of their own only with `template.splitWidgets` (import-page-base): the company
  importer, which shares this transformer, is unchanged (its 4 pages import byte-identical).
- The media gate takes an explicit dead-source list (`media/dead-source-images.json`). `Blok.jpg` is 403 on the
  source: dropped from the consent body, and its share-image row removed.
- `styles.css` (page-body only; the lists, h4 and buttons in its default content, never in a block's):
  - lists: a 0.3em dash bullet, numbers outside;
  - h4 18/22.5 (`--heading-font-size-page-h4`);
  - table cells (the Table block), the button, and the bold "Learn more" link (the source's text link);
  - the spacer gap (none where the gap is authored as a line spacer after it, the company pages' pattern);
  - on a page with the generic title band (`Hero Image (page)`) only: no full-height `main` minimum, an empty
    section hidden. The media cart, search and listings keep the minimum.

**Built (Sustainable Offices)**
- `transformers/skoda-sustainability.js` turns the SiteOrigin rows into:
  - the header section (`Style: sustainability-header`: h1, the wide image, the phone crop);
  - the intro;
  - one section per theme: h2, `Columns (image-card)` rows, the `Columns (info-blocks)` band, the hire line;
  - the event section.
- It drops the phone copies of the zig-zag rows: the Columns block puts the image first below 720.
- `Columns (image-card, text-small)` marks a card whose source text sits outside a paragraph, so it shows at 16/24 as on live.
- "Find out more." points at `#event-space-rental` (the EDS heading id: punctuation dropped, spaces as hyphens).
- The film is `Embed (vimeo)` with its MP4 master: Vimeo refuses this clip on the demo domain. The MP4 is tracked in
  `media-manifest.json` (video, DAM pending).
- `templates/sustainability`:
  - the source's type scale (h1 56/33, h2 44/28, text 18/28 → 16/24 below 768, 0.02em);
  - its rhythm (desktop; up to 780 the stacked SiteOrigin rhythm; below 768 the phone type);
  - the grey cards (80px inset, 426px text) and the `#303132` band (`--skoda-grey-850`);
  - the phone header crop, made the eager (LCP) image on phones.
- Chrome (`locale-chrome.js` `buildSectionNav`, `import-sustainability-nav/-footer`):
  - the nav has three tabs (Sustainability active), the logo, search and EN/CZ, and no menu;
  - the footer has no sitemap;
  - `header.js` reads a 3-row nav whose first row is the tab list as topbar + brand + tools;
  - Escape closes that drawer (focus back on the hamburger);
  - `buildSectionNav` fails when the source topbar has no tabs (the header tells this nav by its tab list);
  - the desktop nav row keeps its 64px;
  - `footer-sections.js` reads a 2-section footer as social + legal;
  - page-level `nav`/`footer` metadata (`skoda-metadata.js` overrides). The bulk sheet is untouched.

**Link policy (`scripts/links.js`):** the migrated documents (the index, consent, cookies) stay on the demo, in the
tab, as Contacts and Copyright (#457), also as absolute live links (the newsletter forms' consent link, `DEMO_LISTINGS`).
Other `/en/documents/…` links stay live (`what-are-your-rights`: live 302s it to skoda-auto.com). **Merge order:** the
link change sends the footer's consent link to the demo page, so the documents pages must be published when this merges.

**Measured, ours vs live (page height; 390 / 768 / 992 / 1280; local code on previewed content; re-run 2026-10-27
after the review fixes, on current `main`)**
- Equal at all four widths:
  - documents, cookies, impressum, server-status, soon-also-in-german, newsletter T&C;
  - all 7 IIHF pages;
  - consent at 390 and 1280.
- Remaining, each a deviation below:
  - BGC −54 everywhere;
  - consent −45 at 768;
  - terms −169 / −91 / −90 / −89;
  - Botas −48 / −24 / 0 / 0.
- No horizontal overflow at 320 on any of the 18 pages.
- Sustainable Offices, every landmark paired: within 10px at 1280. The rest comes from the source's empty editor
  lines and the film toolbar (below).
- Heading outlines equal on all 18 pages (Copyright included) and on Sustainable Offices at 390 and 1280.
- Header and footer geometry unchanged on 6 other templates (home, Media Room, a story, News, Copyright, BGC) at 1280 / 1080 / 390.
- The company pages (#483, which share the page-body styles and `skoda-page-rows`): Contacts, Board of Management,
  Company logo and the app page equal `main` element by element at 390 / 768 / 1280; the media cart and search keep
  their full-height `main`.
- Clicks:
  - "Find out more." scrolls to the event heading (40px down, the site's heading scroll margin; live 0);
  - the phone drawer opens, and Escape closes it with focus back on the hamburger;
  - the active tab is Sustainability.
- axe (WCAG 2.1 AA, 390 / 1280, the 18 pages and Sustainable Offices): `color-contrast` only:
  - the source green #419468 on links (as on the generic pages, 813 PO decision);
  - the white title on the empty band (813);
  - the shared header's subscribe link (SKODA-703).
- Tests (all pass; `npm run lint` clean):
  - `skoda-page-rows` 7, `skoda-page-blocks` 8 (new), `condition-inline-media` 18, `skoda-sustainability` 9,
    `locale-chrome` 11, `table` 4 (new);
  - `links` 15, header (all files, incl. the new `header-no-menu`) 64, `footer` 14, `skoda-metadata*` 38;
  - unchanged neighbours: `skoda-company-*`, `story-import-validity`, `press-release`, stories, contact-directory,
    exec-bio, brand-asset, app-promo, columns, embed.

**Deviations from origin (for the PO; none accepted by an agent)**
- BGC: the cart toolbar under the film (+, download, link) is not migrated, as on stories and press releases (SKODA-824 note): 54px shorter.
- Terms (`terms-and-conditions-2`): 7 run-in titles set inline at 18pt (24px) on the source show at the body size; DA carries no inline size.
- Consent: the source's h2 holds the dead `Blok.jpg` (a broken 44×38 box that wraps the heading at 768); ours drops the image.
- Botas: the sub-items `i.`–`iii.` lose their 16–17 `&nbsp;` lead-in. DA keeps it, but the EDS preview trims a
  paragraph's leading spaces (−24 at 768, −48 at 390).
- Sustainable Offices:
  - The source's empty editor lines aren't migrated (EDS drops them): two band cards and the first "Variable spaces"
    card are a line shorter each (24–28px). The page runs about 100px shorter at 768, 45 at 992.
  - The film's cart toolbar is not migrated (−48).
  - The Sustainability tab and the logo link to this page; the source links both to `/en/?page_id=320705`, a 404 on live.
  - The CZ link shows once the page declares its Czech translation (with the locales, after #485); until then the switcher shows EN only.
- The bold "Learn more" link (BGC) has no focus ring, as the body's text links: the SKODA-813 "match live" exception
  (PO, 2026-10-21) extended to this one link, which the decoration makes a button. Needs the PO's confirmation.

**Code review (2026-10-27, an independent review of the diff, all findings fixed)**
- P1: the page-body list rules reached the Contact Directory and Exec Bio blocks of the company pages (#483): every
  card got a dash and 16px (Contacts +148px, Board +164px). Now scoped to default content; both pages equal `main`.
- P1: the footer-follows-content rule reached every `template: page` page: an empty media cart showed its footer at
  y689 of 1400. Now only the generic pages (their title band); the cart is back at y1400.
- The spacer gap doubled the company pages' authored gap (+20 per spacer): not applied before a line spacer.
- P2: tests for the three new transformers and the Table block (`skoda-page-blocks` 8, `table` 4); absolute live
  document links kept on the demo; the publish-before-merge order recorded above.
- P3: the page-rows split opt-in; a pill inside a sentence; table colspans; blank lines in table cells; the anchor
  slug (`škoda-autos-…`); the header's dead focus-out change reverted; the section nav's tab check; tokens for the
  h4 size, the pill inset and the band inset; the dead-source list hardened (a file without `images`, a dead file in
  a `srcset` / `<source>` only).
- Bundles: every import bundle rebuilt from the merged sources; parity on live pages, `main`'s bundle vs this branch's:
  the 4 company pages, the CS nav and footer, the DE footer, a story and a press release, all byte-identical. The 17
  generic pages re-imported with the fixes: unchanged in DA.

**Pending (needs an explicit request: DA writes and publishing)**
- The 6 IIHF redirect rows (`/en/iihf`, `/en/iihf/lv`, `/en/iihf/ru`, each with and without the slash) → the live
  hockey story. Prepared; the DA sheet is backed up.
- `/sustainability/nav` and `/sustainability/footer` (built locally, not in DA yet).
- `/en/sustainable-offices` re-push: blocked by the binary gate until the film MP4 is ingested on a developer
  machine (the PO's choice, 2026-10-26). Preview keeps the earlier version (Vimeo only, which Vimeo refuses here).
- Publishing the 17 pages, the fragments and the page (AC: the footer-linked legal pages and BGC before go-live).

**Notes (not in this ticket)**
- The cookies page's "manage your consent by clicking this link" opens the source's consent centre; on the demo it
  is `#` until a CMP exists (SKODA-804).
- `/privacy-statement` (linked from the source) is a 404 on live: kept as live, a client question (G-E-06).
