# Škoda Storyboard & Media Room — Minimal PoC URL Coverage Set

*The smallest set of **live, verified** source URLs that still exercises **every** template, block/variant, and functionality across both sites — a minimal UI-PoC coverage set. Each URL was confirmed HTTP-real (200, not a redirect/404) by a research fan-out on 2026-09-15, and the set was greedy-minimized against a coverage matrix. A full nav + footer sweep verified nothing was missed (see §4). Machine-readable companion: `skoda-poc-urls.json` / `.txt`.*

**Date:** 2026-09-15 · **Method:** 4 parallel research subagents (Storyboard core / Media Room+listings+press-kit / company+special / nav-footer completeness gate) → coverage matrix → greedy minimization. Companion to `SKODA-REQUIREMENTS-TRACEABILITY.md`, `../architecture/SKODA-DIAGRAMS.md`, `SKODA-MASTER.md` §3–§4.

---

## 1. The minimal set (24 URLs)

Legend — **Site:** SB Storyboard · MR Media Room · ◆ shared. **New?** = surfaced by the 2026-09-15 sweep, not in the prior inventory.

| # | URL (relative to `https://www.skoda-storyboard.com`) | Site | Template | Primary coverage (blocks / functionalities it uniquely or best exercises) |
|---|---|:--:|---|---|
| 1 | `/en/` | SB | Storyboard homepage | featured promo, query-index story rails, models grid, series carousel, load-more, social block, language selector |
| 2 | `/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic/` | SB | Story detail (full-fidelity) | hero + body + **in-body gallery + YouTube embed + foot Media Box (14 imgs)** + related rail + tags — the single best full-fidelity story |
| 3 | `/en/category/emobility/` | SB | Category listing | category-tag query-index listing + load-more ("6 / 208") |
| 4 | `/en/tag/model/elroq/` | SB | Tag/model listing | **model-tag listing with CTA hero** (Discover/Configure/Images/Videos) + filtered grid + load-more |
| 5 | `/en/series-2/` | SB | Series **directory** | grid of ~21 series cards (2-level template, level 1) |
| 6 | `/en/series/125-years-of-motorsport/` | SB | Series **hub** | curated fixed 8-card story grid, no load-more (level 2) |
| 7 | `/en/skoda-model/peaq/` | SB | Storyboard model page | hero + description + **5 tag-driven rails** (news/press-kits/stories/images/videos) |
| 8 | `/en/category/podcast-en/` | SB | Category page (podcast) | **CORRECTED: not a redirect** — a standard category listing of podcast episodes |
| 9 | `/en/skodapedia/` | SB | **Škodapedia archive** 🆕 | A–Z glossary index + letter/category/model filters — internal, NOT external |
| 10 | *(a Škodapedia term-detail page, e.g. linked from #9)* | SB | **Škodapedia term detail** 🆕 | single glossary-term entry page (distinct template) |
| 11 | `/en/media-room/` | MR | Media Room homepage | 7 rails (featured/news/images/videos/models/press-kits/latest-stories), media-cart affordance, **distinct MR footer** |
| 12 | `/en/news/` | MR | Shared faceted listing (baseline) | faceted filter bar (15 groups) + 6-per load-more + newest/oldest sort ("6 / 1651") |
| 13 | `/en/images/` | MR | Images listing | advanced facets + image grid + **dual-rendition download (Original/1920px)** + add-to-cart + **lightbox** ("~33,331") |
| 14 | `/en/videos/` | MR | Videos listing | **Vimeo-thumb grid + embed** + MP4 download + add-to-cart ("913") |
| 15 | `/en/press-kits/skoda-epiq-press-kit-2/` | MR | Press-kit **hub** | 8-chapter TOC + 5 resource tabs + **whole-kit ZIP** + FAQ chapter |
| 16 | `/en/press-kits/skoda-epiq-press-kit-2/exterior-the-first-skoda-production-model-to-fully-incorporatethe-modern-solid-design-language/` | MR | Press-kit **chapter** | article body + **persistent chapter sub-nav** + in-body gallery + **large Media Box (84 img / 1 video / 6 PDF)** |
| 17 | `/en/press-kits/skoda-epiq-press-kit-2/infographics/` | MR | Press-kit **resource** (infographics) | **preview→PDF/JPG dual-format** infographic grid |
| 18 | `/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/` | MR | Press release detail | **AI-audio (Buzzsprout) embed** + article + Media Box (confirmed via Playwright) |
| 19 | `/en/board-of-management/` | ◆ | Company/Page: exec-bio | **exec-bio accordion** — expandable galleries + CV/photo-ZIP/press/LinkedIn |
| 20 | `/en/annual-reports/` | ◆ | Company/Page: download-list | reverse-chron **PDF-cover download list** (2025→2000) |
| 21 | `/en/company-logo/` | ◆ | Company/Page: brand-asset grid | 36-asset grid, **dual PDF+PNG** download per variant |
| 22 | `/en/skoda-media-services-application/` | ◆ | Company/Page: app-promo | hero + screenshots + **QR + app-store badges** |
| 23 | `/en/contacts/` | ◆ | Company/Page: contact directory | dept-grouped contact cards (photo/title/email/phone/LinkedIn) |
| 24 | `/en/newsletter/` | ◆ | Newsletter archive + signup 🆕 | date-listed newsletter archive + **GDPR-consent signup form** |

---

## 2. Coverage the set guarantees (matrix summary)

**Templates (all covered):** Storyboard home, story detail, category listing, tag/model listing, Series directory, Series hub, Storyboard model page, podcast category page, Škodapedia archive, Škodapedia term detail, MR home, shared faceted listing, News, Images, Videos, press-kit hub, press-kit chapter, press-kit resource, press-release detail, + the 5 company/Page templates + newsletter archive/signup. **25 templates.**

**Block variants (all covered):** cards-overlay/media/toolbar + carousel (#1,#11), story-rail (#1,#7,#11), hero-image (#1,#4,#7), gallery+lightbox (#2,#13,#16), embeds — YouTube (#2), Vimeo (#14), AI-audio/Buzzsprout (#18), faceted-listing (#12,#13,#14), media-cart toolbar (#11,#13,#14,#16,#18), press-kit TOC (#15), chapter sub-nav (#16), infographics preview→PDF (#17), FAQ/accordion (#15), exec-bio accordion (#19), download-list (#20), brand-asset grid (#21), app-promo (#22), contact-directory (#23), series-directory/hub grids (#5,#6), Škodapedia archive+term (#9,#10), signup form (#24).

**Functionalities (all covered):** query-index rails, load-more, advanced faceted filter + sort, per-page language selector (#8/legal pages demonstrate existence-aware hiding), media-cart add + dual-rendition download, lightbox, whole-kit ZIP, social share, newsletter UI, search, QR/app-badges.

---

## 3. Optional appendix (not in the minimal 24 — add only if a cell needs proving)

| URL | Why it's optional |
|---|---|
| `/en/brand-group-core-bgc/` 🆕 | corporate info-landing "Page" variant — overlaps the generic Page family; add if a plain editorial landing must be shown |
| `/en/newsletter-settings/` 🆕 | subscription-management form — overlaps #24's form model |
| `/en/media-cart/` 🆕 | the cart/downloads page itself (empty-state) — add to demo the cart *destination* (ties to COM14) |
| `/en/copyright/` | legal/text page — a plain content page; `/cs/copyright/` (+ `de/impressum`) demonstrates the language selector's localized slugs |
| `/en/documents/<consent-slug>/` | `/en/documents/` legal doc-page path variant |
| `/en/?filter%5Bsearch%5D=octavia` | search-results page (pattern is `filter[search]=`, not `?s=`) — add if search UI is in the PoC (index-only per D6) |

---

## 4. Completeness — nav + footer sweep result

A dedicated agent enumerated **every** header mega-menu + footer sitemap link on both sites and visited the unusual ones. Outcome:

- **Both sites' full nav + footer were walked.** The Media Room footer is confirmed **different** from the Storyboard footer (drops the category-tree columns; adds Corporate/Product Comms, Manage Subscription, Media Cart, Annual Report PDF).
- **6 page types surfaced that were NOT in the prior inventory** and are now included/appendixed: Škodapedia archive + term-detail (#9/#10), newsletter archive+signup (#24), newsletter-settings + media-cart + BGC + `/en/documents/` (appendix).
- **Two prior assumptions corrected:** (a) **Podcast does not 301-redirect** — `/en/category/podcast-en/` is a live category page (#8); (b) **Škodapedia is internal, not external** — this reopens the client §9 "Škodapedia continues outside Storyboard" assumption (flag for confirmation).

## 5. Known gaps (no live URL covers these)

- **HTML technical-spec table** — the press-kit `/technical-data/` resource ships specs as a **downloadable PDF**, not a rendered HTML table/accordion. **No live URL exercises a spec-table block.** If the PoC requires one, treat it as a net-new block to design (no source reference exists) or confirm it's out of scope.
- **Media-cart real download / whole-kit ZIP** are present in the UI (#13/#15) but are **non-native to EDS** (server-side reduction, D2) — the URLs exercise the *UI*, not a reproducible download backend.
- **Broken/EN-absent legal URLs:** `/en/privacy-policy/`, `/en/data-protection/`, `/en/whistleblower/` 404; `/en/privacy-statement` redirect-loops; imprint exists only under `de/impressum`. Legal pages mostly live off-site on `skoda-auto.com`.

## 6. Notes for the importer
- All 24 are **live production WordPress URLs** — feed them to the scrape/import pipeline (`skoda-poc-urls.json` → `urls-<name>.txt`). `.plain.html` does NOT exist on the source (that's an EDS artifact).
- Guard against **scraper client-redirect drift** (the Peaq trap): verify each capture against raw SSR if a headless fetch redirects.
- Bulk migration remains out of the PoC (§9) — this set is the *representative* sample, hand-carried.

## 7. Cross-references
- `SKODA-POC-COVERAGE-MATRIX.md` — the three-way join: these URLs × components/blocks × client requirement IDs (proves the set covers the PDF baseline; reverse view per requirement).
- `skoda-poc-urls.json` / `skoda-poc-urls.txt` — machine-readable, importer-ready.
- `SKODA-REQUIREMENTS-TRACEABILITY.md` — template → ticket → milestone.
- `../architecture/SKODA-DIAGRAMS.md` — how these templates map to shared engines.
- `SKODA-MASTER.md` §3 (templates) / §4 (blocks); `SKODA-CLIENT-REQUIREMENTS-MAPPING.md` (per-ID status).
