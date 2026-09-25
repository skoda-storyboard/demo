# SKODA M1 URL → Block Registry (DevTools-grounded)

**Sweep:** 2026-09-25 · **Pages:** 43 (42 unique M1 pages + the mixed-reality alias) · **Element rows:** 687 (659 fleet + 28 architect supplement) · **Viewports:** 375 / 768 / 992 / 1280
**Report:** [`../reviews/SKODA-M1-URL-BLOCK-SWEEP.md`](../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) · **Machine-readable:** [`SKODA-M1-URL-BLOCK-REGISTRY.json`](SKODA-M1-URL-BLOCK-REGISTRY.json) (generated; do not hand-edit)

This is the **source-of-truth UI inventory for the M1 demo URLs**: every visible UI element on every page, mapped to the component spec, the EDS block, the owning tickets and the measured EDS status. It supersedes the page→block rows of [`../ui-specs/_TEMPLATES.md`](../ui-specs/_TEMPLATES.md) for the M1 set wherever they disagree (see the drift register in the report).

## 1. Method and provenance

- **Evidence is DOM, not pixels.** Every row comes from a Chrome DevTools Protocol capture: ordered region tree, `getComputedStyle` of each region root and key parts, the matched CSS rules (Styles pane), widget config (`data-*`, Flickity/Colorbox), iframes, media and links. **No screenshots were used as evidence.**
- **Harness:** a dependency-free Node CDP client driving the system Chrome, one isolated profile per agent. OneTrust is accepted first. Pages are auto-scrolled to trigger lazy content before capture. Not committed (session artifact); re-runnable on request.
- **Fleet:** 7 gpt-6-sol agents (G1 emobility stories · G2 Škoda World + lifestyle stories · G3 press releases · G4 model pages · G5 series hubs · G6 press kits · G7 home, images, videos + all chrome states). The Architect merged, normalised and spot-verified.
- **EDS side:** `main--demo--skoda-storyboard.aem.page` for the 11 previewed pages (main @ `6af751e`); a local EDS render of the DA source (worktree code, head.html, page metadata; *bulk metadata not applied*) for the other DA pages; open PR branch previews for #109 (204), #110 (213), #111 (502) and #131 (403). Press kits are not in DA, so they have no EDS side.
- **Thresholds:** box ±2px or ±2%; font size/weight/line-height exact; colour exact token; gaps ±2px; column count exact. Each delta carries a demo severity: **blocking** (element missing or broken), **visible** (a reviewer would notice), **cosmetic**.
- **Main moved after the sweep** (now `752b919`): #109 embeds, #111 downloads (502), #131 search (403) and #135 media masters (501) merged, plus #115 docs, #132 DA push tool, #133 story flatten and the SKODA-820 index rail; PR #134 (305 MR footer) opened. Affected rows carry a `postSweep` note in the JSON; they were not re-measured.
- **Architect supplement (28 rows):** the fleet did not register the float dock on the model, series and press-kit pages, although their own captures contain it. The Architect re-read every capture: the same fixed `div.sticky-buttons` dock is on all 43 pages at 375 and 1280, so the missing rows were added (`origin: architect-supplement`, evidence path in `notes`).
- **Shared chrome** (header, mobile nav, language switcher, footer, cookie banner) is one fragment per side on both systems, so its element rows are measured once per side on the G7 pages (`/en/` = STO, `/en/images/` and `/en/videos/` = MR, plus the MR press-release check). §4.7 records the chrome **per URL**: the side detected from each page's own capture (topnav + footer text), its locale count and the resulting status.

**Status legend:** ✅ built + matches · 🟡 built, measured visual delta · 🔵 in an open PR · 📋 ticketed, not built or not imported · ⚠️ ticketed but the element/variant is missing from the ACs · ❌ no ticket, new ticket drafted · ⛔ ruled out for M1 (M2 ticket). Ticket numbers: `✓` = closed on the board, `(M2)` = M2 milestone.

## 2. Totals

| Status | Rows | | EDS status | Rows |
|---|--:|---|---|--:|
| ✅ built + matches | 6 | | NOT-BUILT | 185 |
| 🟡 built, measured visual delta | 157 | | DELTA | 176 |
| 🔵 in an open PR | 12 | | CONTENT-BLOCKED | 171 |
| 📋 ticketed, not built / not imported | 327 | | IMPORT-GAP | 137 |
| ⚠️ ticketed, element or variant missing from the ACs | 93 | | IN-PR | 12 |
| ❌ no ticket → new ticket drafted | 84 | | MATCH | 6 |
| ⛔ ruled out for M1 (M2 ticket) | 8 | |  |  |

EDS status: **MATCH** measured within thresholds · **DELTA** built, out of threshold · **IN-PR** measured on a PR branch · **NOT-BUILT** no EDS block/code · **IMPORT-GAP** block exists but the importer/DA content drops or distorts the element · **CONTENT-BLOCKED** cannot be measured because the page or its data (index rows, press kits) does not exist on EDS yet.

Measured deltas: **1051 blocking**, **1136 visible**, **212 cosmetic** across 441 rows (245 rows carry at least one blocking delta).

## 3. Element catalog (component → spec → EDS block → tickets → status)

| Component | What it covers | Spec | EDS block | Owner tickets | Pages | Rows | Status | Blocking / visible deltas |
|---|---|---|---|---|--:|--:|---|--:|
| **header-megamenu** | Topbar, section switcher, wordmark, desktop nav + mega-menu, search trigger | header-megamenu.md | header | 301, 403 (search), 825 (MR nav) | 3 | 12 | 🟡5 🔵3 ⚠️4 | 4 / 7 |
| **mobile-nav** | Hamburger drawer <1080 | mobile-nav.md | header | 302 | 3 | 3 | 🟡3 | 3 / 0 |
| **language-switcher** | Locale list in the topbar | language-switcher.md | header | 303 | 3 | 3 | ⚠️3 | 0 / 3 |
| **footer** | STO footer: sitemap, badges, socials, legal/RSS strip | footer.md | footer | 304, 306, 307 | 1 | 3 | 🟡3 | 0 / 3 |
| **footer-mediaroom** | MR footer: Contacts/Subscribe/Company, MR legal | footer-mediaroom.md | footer (+ newsletter-stub, PR #134) | 305, 825 (routing) | 2 | 8 | 🟡2 📋4 ⚠️2 | 3 / 1 |
| **mr-side-chrome** | Media Room side resolution (nav/footer fragments per path) | _TEMPLATES.md (MR shell) | header + footer via metadata | 825 (new) | 5 | 5 | 🟡5 | 5 / 10 |
| **cookie-consent** | OneTrust banner + Manage cookies button | — (SKODA-704 stub) | — | 704 (stub), 804 | 3 | 3 | 📋3 | 0 / 0 |
| **page-float-dock** | Floating share expander + scroll-to-top (cart button → 505a) | social-share.md | — (not built) | 824 (new) | 42 | 84 | ❌84 | 84 / 0 |
| **media-cart** | Floating cart count, add-to-cart toolbars, size menus | media-cart.md | — (not built) | 505a, 505b | 24 | 31 | 📋31 | 34 / 0 |
| **hero** | Story/series/model/press-kit hero variants | hero.md | hero, hero-image | 202, 816 | 33 | 105 | 🟡32 📋58 ⚠️15 | 48 / 429 |
| **story-detail** | Two-column story shell | story-detail.md | story template (sections) | 801, 821, 822 | 20 | 20 | 🟡7 📋13 | 8 / 11 |
| **siteorigin-body** | Prose, inline images, dark panel rows, spacers | siteorigin-body.md | default content + section metadata | 814, 218, 801a | 25 | 63 | ✅6 🟡20 📋29 ⚠️8 | 58 / 82 |
| **in-body-slider** | 3:2 in-body image sliders (skoda-carousel-widget) | gallery-lightbox.md (slider) | gallery (slider variant) | 819 (supersedes 219) | 20 | 20 | 🟡5 📋15 | 16 / 40 |
| **gallery-lightbox** | Sidebar images preview, Colorbox lightbox | gallery-lightbox.md | gallery | 203, 216 | 13 | 13 | 🟡5 📋5 ⚠️3 | 20 / 38 |
| **embeds** | Vimeo / YouTube / Buzzsprout players | embeds.md | embed | 204, 803, 818 | 18 | 19 | 🔵2 📋17 | 44 / 16 |
| **tags** | Hero category/date, sidebar tag chips | tags.md | tags | 205 | 26 | 34 | 🟡14 📋20 | 32 / 61 |
| **newsletter** | Sidebar / topbar / MR-footer subscribe UI stub | newsletter.md | newsletter-stub (PR #134) | 823 (sidebar, Could), 305 (MR footer) | 23 | 23 | 🟡1 📋22 | 36 / 0 |
| **side-banner** | Sidebar ad creative | promo-banner.md | — | 903 (M2) | 8 | 8 | ⛔8 | 32 / 0 |
| **card-teaser** | Explore-more teasers, lead images, media cards | card-teaser.md | cards | 201, 817 | 31 | 39 | 🟡10 📋29 | 18 / 149 |
| **carousel-rails** | Home rails, Related Stories, model rails, related press | carousel-rails.md | story-rail, carousel | 212, 820, 208, 607 | 29 | 54 | 🟡6 📋23 ⚠️25 | 182 / 30 |
| **promo-box** | Home featured three-story promo | carousel-rails.md / template-home.md | promo-box (PR #110) | 213 | 1 | 1 | 🔵1 | 0 / 1 |
| **home-social** | Home social profile cards on dark band | template-home.md | cards variant | 217, 218 | 1 | 2 | 📋2 | 1 / 0 |
| **stories** | Home latest-stories feed + Load more | stories.md | stories | 214 | 1 | 2 | 🟡2 | 0 / 2 |
| **downloads** | Media Box band: asset cards, download controls, Show more | downloads.md | downloads (#111, merged after the sweep) | 502, 604, 801a | 26 | 55 | 🟡5 🔵6 📋32 ⚠️12 | 124 / 51 |
| **faceted-listing** | Images/Videos grids, facets, sort, count, Load more | faceted-listing.md | listing | 402, 401, 608 | 2 | 10 | 🟡2 📋2 ⚠️6 | 8 / 2 |
| **template-press-release** | PR two-column shell, title, date, perex, bullets, body | template-press-release.md | press-release template | 607 | 5 | 29 | 🟡24 📋5 | 5 / 133 |
| **press-kit-template** | Press-kit article shell, contacts, sidebar menu | press-kit-template.md | — (no importer) | 805a, 805c | 1 | 7 | 📋7 | 2 / 20 |
| **press-kit-media** | Media Box stats, ZIP/WhatsApp promos, intro figures | press-kit-media.md | downloads / cards | 805a, 805c, 806 | 8 | 11 | 📋6 ⚠️5 | 12 / 17 |
| **series-mosaic** | Curated 2/3-up series tile mosaic | series.md, card-teaser.md | cards (curated) — currently listing | 207 | 5 | 5 | ⚠️5 | 239 / 0 |
| **faq-accordion** | Topical row-toggle disclosures | faq-accordion.md | — (not built) | 807, 805c | 1 | 1 | 📋1 | 1 / 0 |
| **model-nav** | Icon section navigation, sticky affix on desktop | template-model-page.md | — (not built) | 208 | 5 | 5 | ⚠️5 | 20 / 0 |
| **model-keyfacts** | Highlights / Key Facts illustrated rows | — (no spec) | — (columns candidate) | 208 (AC amendment) | 3 | 3 | 🟡3 | 0 / 12 |
| **model-techdata** | Technical Data spec table + PDF | — (no spec) | — (table/columns + 218 dark) | 208 (AC amendment) | 3 | 6 | 🟡3 📋3 | 12 / 18 |

Variants per component (element names as registered, × occurrences):

- **header-megamenu:** MR topbar and section switcher ×2 · MR wordmark ×2 · Header topbar and section switcher ×1 · Škoda Storyboard wordmark ×1 · Desktop primary navigation and Models mega-menu ×1 · Header search trigger and live suggestions ×1 · MR desktop navigation/Models and Company menus ×1 · MR header search/suggestions ×1 · MR desktop navigation / dropdowns ×1 · MR header search / suggestions ×1
- **mobile-nav:** MR mobile hamburger/drawer ×2 · Mobile hamburger and submenu drawer ×1
- **language-switcher:** Locale links ×1 · MR locale links ×1 · MR language switcher ×1
- **footer:** STO footer app badges and social profiles ×1 · STO footer navigation sitemap ×1 · STO copyright / legal / RSS strip ×1
- **footer-mediaroom:** MR footer Company/annual report ×2 · MR footer badges and social links ×1 · MR footer Contacts links ×1 · MR-specific copyright/legal/feed bar ×1 · MR footer badges/social ×1 · MR footer Contacts ×1 · MR copyright/legal/RSS ×1
- **mr-side-chrome:** Media Room chrome (header and footer) ×5
- **cookie-consent:** OneTrust banner and Manage cookies ×1 · OneTrust consent and Manage cookies ×1 · OneTrust and Manage cookies ×1
- **page-float-dock:** Floating share expander (architect census) ×14 · Floating scroll-to-top (architect census) ×14 · Sticky share ×12 · Scroll to top ×12 · Sticky social-share menu ×8 · Sticky scroll-to-top ×8 · Floating share / social-intent controls ×5 · Floating media-cart badge / scroll-top ×5 · Floating scroll-top ×2 · Floating social-share expander ×1 · Floating scroll-to-top button ×1 · Floating share expander ×1 · Sticky share expander ×1
- **media-cart:** Sticky cart ×12 · Sticky cart shortcut ×8 · 80-photo package-limit notice ×2 · Inline video cart/download/permalink toolbar ×1 · Media Box add-to-cart size menus ×1 · Floating media-cart badge/count ×1 · Image add-to-cart tile toolbar ×1 · Image original / 1920px JPG download menu ×1 · Floating media-cart count ×1 · Video add-to-cart button ×1 · Original MP4 direct download ×1 · Sticky media-cart count ×1
- **hero:** Hero heading ×15 · Story hero ×12 · Hero image ×12 · Hero perex/category ×12 · Hero title ×8 · Hero 16:9 image ×8 · Hero perex ×8 · Model hero, image, Models chip and h1 ×5 · Full-bleed series hero image and scrim ×5 · Series name (H1) ×5 · SERIES category badge ×5 · Series standfirst / intro in hero caption ×5 · Overlay hero image ×3 · Hero standfirst / perex ×2
- **story-detail:** Story shell ×12 · Story article shell ×8
- **siteorigin-body:** SiteOrigin prose ×12 · SiteOrigin grid rows ×8 · Rich-text editor widgets ×8 · SiteOrigin offset spacers ×8 · Dark SiteOrigin row ×8 · Inline editorial images ×7 · Model Description rich text ×5 · Dark SiteOrigin editorial row ×4 · Liftback and Combi technical drawings ×2 · SiteOrigin image widget ×1
- **in-body-slider:** In-body carousel ×12 · In-body image sliders ×8
- **gallery-lightbox:** Sidebar Images preview / lightbox ×5 · Image thumbnail lightbox and media-cart toolbar ×5 · Sidebar Images teaser with +51 ×1 · Colorbox image lightbox ×1 · Colorbox video lightbox ×1
- **embeds:** Buzzsprout AI-audio ×5 · Video thumbnail, Vimeo player and media toolbar ×5 · Lite YouTube poster/play ×2 · In-body embed / consent shell ×1 · In-body Vimeo video ×1 · Graffiti YouTube ×1 · Inline Vimeo ×1 · Inline Vimeo video ×1 · Inline Vimeo player ×1 · Vimeo iframe/poster and play ×1
- **tags:** Sidebar tags ×12 · Sidebar tag chips ×9 · Hero category/date ×8 · Taxonomy tag chips ×5
- **newsletter:** Newsletter sidebar ×12 · Sidebar newsletter ×8 · Topbar Subscribe to our stories ×1 · MR footer Subscribe/consent form ×1 · MR footer subscription/consent ×1
- **side-banner:** Sidebar promo creative ×8
- **card-teaser:** Explore more teasers ×12 · Sidebar Explore more ×8 · Lead inline photo ×5 · Media resource cards ×3 · Core narrative chapter cards ×2 · Model-variant chapter card ×2 · FAQ chapter card ×2 · Historical chapter cards ×1 · Cross-kit card ×1 · Lead article image ×1 · Image card image/date/title/toolbar ×1 · Video card poster/date/title/toolbar ×1
- **carousel-rails:** Bottom Related Stories ×11 · Related Stories dark rail ×8 · Press Kits related-content rail ×5 · Images related-content rail ×5 · Videos related-content rail ×5 · Related press-release rail ×4 · News related-content rail ×4 · Stories related-content rail ×4 · Bodywork / Derivatives related-content rail ×2 · Models horizontal rail ×1 · eMobility rail ×1 · Lifestyle rail ×1 · Škoda World rail ×1 · Series dark horizontal rail ×1 · Latest News rail ×1
- **promo-box:** Featured promo-box: three stories ×1
- **home-social:** Social media dark section ×1 · Three social profile cards ×1
- **stories:** Latest Stories five-card feed ×1 · Latest Stories Load more ×1
- **downloads:** Media Box downloads ×12 · Media Box dark download band ×8 · Media Box cart/download controls ×8 · Media Box show-more ×8 · Additional info / media contacts / Download Media Box ×5 · Media Box asset cards ×5 · Per-asset direct-download button ×5 · Three PDF/JPG paired file downloads ×1 · Dark Media Box heading and asset stats ×1 · Media Box asset thumbnails and downloads ×1 · Media Box Show more / Show less ×1
- **faceted-listing:** Advanced filter facet groups ×2 · Advanced filter trigger and Newest/Oldest sort ×1 · Image listing result grid ×1 · Result count ×1 · Load more image assets ×1 · Advanced filter and newest/oldest sort ×1 · Video listing result grid ×1 · Video result count ×1 · Video Load more button ×1
- **template-press-release:** Published date ×5 · Press release text title ×5 · Two-column article shell ×5 · Perex / lead summary ×5 · Rich text body, inline subheadings and links ×5 · Key-point bullets ×4
- **press-kit-template:** Published date ×1 · Article h1, no overlay hero ×1 · Opening prose and bullet list ×1 · Footnotes and external charging link ×1 · WhatsApp editorial text callout ×1 · Media contact cards ×1 · Additional-info sidebar menu ×1
- **press-kit-media:** Per-asset cart add and Original/1920px menu ×5 · WhatsApp linked image promo ×2 · Whole-kit direct ZIP image CTA ×2 · Two-up illustrated introductory figures ×1 · PDF-download and mail-share image banners ×1
- **series-mosaic:** Curated story/press-kit mosaic tiles ×5
- **faq-accordion:** Eight topical row-toggle disclosures ×1
- **model-nav:** Icon model section navigation ×5
- **model-keyfacts:** Highlights / Key Facts illustrated rows ×3
- **model-techdata:** Technical Data specification table ×3 · Download PDF from Technical Data ×3

## 4. URL × component matrix

Cell = the worst status of that component's rows on the page (❌ > ⚠️ > 🟡 > 📋 > 🔵 > ✅ > ⛔). Empty = the element is not on the source page.

### 4.1 Stories (emobility, Škoda World, lifestyle)

| Page | EDS | page-float-dock | media-cart | hero | story-detail | siteorigin-body | in-body-slider | embeds | tags | newsletter | side-banner | card-teaser | carousel-rails | downloads |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `skoda-epiq-will-win-you-over-in-just-a` | PREVIEW | ❌ | 📋 | 🟡 | 🟡 | 🟡 | 🟡 | 🔵 | 🟡 | 📋 | ⛔ | 🟡 | 🟡 | 📋 |
| `an-electric-car-approaching-says-the-l` | PREVIEW | ❌ | 📋 | 🟡 | 🟡 | 🟡 | 🟡 |  | 🟡 | 📋 | ⛔ | 🟡 | 📋 | 📋 |
| `peaq-sets-a-record-from-the-heart-of-e` | PREVIEW | ❌ | 📋 | 🟡 | 🟡 | 🟡 | 🟡 | 📋 | 🟡 | 📋 | ⛔ | 🟡 | 📋 | 📋 |
| `spacious-comfortable-and-striking-five` | EDS-LOCAL | ❌ | 📋 | 🟡 | 🟡 | 🟡 | 📋 |  | 📋 | 📋 | ⛔ | 📋 | 📋 | 📋 |
| `practical-fun-stylish-5-reasons-to-cho` | PREVIEW | ❌ | 📋 | 🟡 | 🟡 | 🟡 | 🟡 |  | 🟡 | 📋 | ⛔ | 🟡 | 🟡 | 📋 |
| `peaq-enters-production-sharing-the-lin` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | 📋 | 📋 | 📋 | 📋 | 📋 | ⛔ | 📋 | 📋 | 📋 |
| `meet-the-peaq-comfort-just-like-at-hom` | EDS-LOCAL | ❌ | 📋 | 🟡 | 🟡 | 🟡 | 📋 | 📋 | 📋 | 📋 | ⛔ | 📋 | 📋 | 📋 |
| `a-custom-made-sunroof-walkie-talkies-a` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | 📋 | 📋 |  | 📋 | 📋 | ⛔ | 📋 | 📋 | 📋 |
| `13-countries-over-19000-kilometers-the` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | ⚠️ | 📋 |  | 📋 | 📋 |  | 📋 |  | ⚠️ |
| `chainsaws-and-sparklers-discover-the-t` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | 📋 | 📋 |  | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `from-unwanted-graffiti-to-bold-support` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | ⚠️ | 📋 | 📋 | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `la-dolce-vita-explore-the-surroundings` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | 📋 | 📋 |  | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `ouninpohja-finlands-roller-coaster-sta` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | 📋 | 📋 |  | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `skodas-smarter-wireless-charging-goes-` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | ⚠️ | 📋 |  | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `a-kodiaq-made-of-paper-the-modeler-spe` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | ⚠️ | 📋 |  | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `explore-the-new-skoda-models-in-mixed-` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | ⚠️ | 📋 | 📋 | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `how-the-skoda-octavia-reached-365-km-h` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | 📋 | 📋 |  | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `innovation-and-technology/explore-the-` | alias → HTTP 200 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| `legend-chris-froome-takes-you-behind-t` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | ⚠️ | 📋 |  | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `the-new-skoda-slavia-features-a-refres` | EDS-LOCAL | ❌ | 📋 | 📋 | 📋 | ⚠️ | 📋 |  | 📋 | 📋 |  | 📋 | 📋 | ⚠️ |
| `the-versatile-octavia-do-you-know-thes` | PREVIEW | ❌ | 📋 | 🟡 | 🟡 | ⚠️ | 🟡 |  | 🟡 | 📋 |  | 🟡 | 📋 | ⚠️ |

### 4.2 Press releases

| Page | EDS | mr-side-chrome | page-float-dock | gallery-lightbox | embeds | tags | card-teaser | carousel-rails | downloads | template-press-release | press-kit-media |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `skoda-auto-klaus-zellmer-to-leave-the-` | PREVIEW | 🟡 | ❌ | 🟡 | 📋 | 🟡 | 🟡 | 📋 | 🟡 | 🟡 | 📋 |
| `skoda-auto-and-national-theatre-extend` | PREVIEW | 🟡 | ❌ | 🟡 | 📋 | 🟡 | 🟡 | 📋 | 🟡 | 🟡 | 📋 |
| `skoda-superb-25-years-of-comfort-space` | PREVIEW | 🟡 | ❌ | 🟡 | 📋 | 🟡 | 🟡 |  | 🟡 | 🟡 | 📋 |
| `skoda-auto-announces-changes-to-its-bo` | PREVIEW | 🟡 | ❌ | 🟡 | 📋 | 🟡 | 🟡 | 📋 | 🟡 | 🟡 | 📋 |
| `936-km-without-recharging-skoda-peaq-s` | PREVIEW | 🟡 | ❌ | 🟡 | 📋 | 🟡 | 🟡 | 📋 | 🟡 | 🟡 | 📋 |

### 4.3 Model pages

| Page | EDS | page-float-dock | hero | siteorigin-body | gallery-lightbox | embeds | carousel-rails | model-nav | model-keyfacts | model-techdata |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `new-superb` | EDS-LOCAL | ❌ | 🟡 | 🟡 | 📋 | 📋 | ⚠️ | ⚠️ | 🟡 | 🟡 |
| `octavia` | EDS-LOCAL | ❌ | 🟡 | 🟡 | 📋 | 📋 | ⚠️ | ⚠️ | 🟡 | 🟡 |
| `epiq` | EDS-LOCAL | ❌ | 🟡 | 📋 | 📋 | 📋 | ⚠️ | ⚠️ |  |  |
| `peaq` | EDS-LOCAL | ❌ | 🟡 | 📋 | 📋 | 📋 | ⚠️ | ⚠️ |  |  |
| `new-fabia` | EDS-LOCAL | ❌ | 🟡 | 🟡 | 📋 | 📋 | ⚠️ | ⚠️ | 🟡 | 🟡 |

### 4.4 Series hubs

| Page | EDS | page-float-dock | hero | series-mosaic |
|---|---|:-:|:-:|:-:|
| `125-years-of-motorsport` | EDS-LOCAL | ❌ | ⚠️ | ⚠️ |
| `130-years` | EDS-LOCAL | ❌ | ⚠️ | ⚠️ |
| `roads-places` | EDS-LOCAL | ❌ | ⚠️ | ⚠️ |
| `unexpected-jobs` | EDS-LOCAL | ❌ | ⚠️ | ⚠️ |
| `minutes-from-car-production` | EDS-LOCAL | ❌ | ⚠️ | ⚠️ |

### 4.5 Press kits

| Page | EDS | page-float-dock | media-cart | hero | gallery-lightbox | embeds | tags | card-teaser | downloads | press-kit-template | press-kit-media | faq-accordion |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `skoda-peaq-press-kit-2` | NOT-IMPORTED | ❌ |  | 📋 |  |  |  | 📋 |  |  | ⚠️ |  |
| `skoda-epiq-press-kit-2` | NOT-IMPORTED | ❌ |  | 📋 |  |  |  | 📋 |  |  | ⚠️ |  |
| `125-years-of-skoda-motorsport-press-ki` | NOT-IMPORTED | ❌ |  | 📋 |  |  |  | 📋 |  |  |  |  |
| `skoda-peaq-first-glimpse-of-skodas-new` | NOT-IMPORTED | ❌ | 📋 |  | ⚠️ | 🔵 | 📋 | 📋 | 📋 | 📋 | ⚠️ | 📋 |

### 4.6 Home, Images, Videos (+ chrome states)

| Page | EDS | header-megamenu | mobile-nav | language-switcher | footer | footer-mediaroom | cookie-consent | page-float-dock | media-cart | gallery-lightbox | embeds | newsletter | card-teaser | carousel-rails | promo-box | home-social | stories | faceted-listing |
|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `en (home)` | PREVIEW | 🟡 | 🟡 | ⚠️ | 🟡 |  | 📋 | ❌ | 📋 |  |  | 🟡 |  | 🟡 | 🔵 | 📋 | 🟡 |  |
| `images` | EDS-LOCAL | ⚠️ | 🟡 | ⚠️ |  | ⚠️ | 📋 | ❌ | 📋 | ⚠️ |  | 📋 | 📋 |  |  |  |  | ⚠️ |
| `videos` | EDS-LOCAL | ⚠️ | 🟡 | ⚠️ |  | ⚠️ | 📋 | ❌ | 📋 | ⚠️ | 📋 | 📋 | 📋 |  |  |  |  | ⚠️ |

### 4.7 Chrome per URL

Source side detected from each page's own capture: MR = topnav starts "News · Press Kits", footer has "Contacts … Corporate Communications"; STO = topbar has "Subscribe to our stories", footer starts with the Models sitemap. Result: STO/STO ×27, MR/MR ×16; captured side = template side on every page. Header/footer status: measured on the G7 pages; STO pages inherit the `/en/` measurement (same fragments); MR pages get the SKODA-825 status (EDS has no MR nav/footer routing, so it renders or would render the STO chrome: 🟡 where rendered, ❌ where the page is not on EDS yet). Locales: EDS renders six static locales on every page (303), so pages whose source lists fewer are ⚠️. Cookie: 📋 (704 stub / 804) on every page. Dock: ❌ 824 on every page.

| Page | Side (hdr/ftr) | EDS | Header | Footer | Locales (src) | Cookie | Dock | Basis |
|---|---|---|:-:|:-:|:-:|:-:|:-:|---|
| `skoda-epiq-will-win-you-over-in-just-a` | STO/STO | PREVIEW | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `an-electric-car-approaching-says-the-l` | STO/STO | PREVIEW | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `peaq-sets-a-record-from-the-heart-of-e` | STO/STO | PREVIEW | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `spacious-comfortable-and-striking-five` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `practical-fun-stylish-5-reasons-to-cho` | STO/STO | PREVIEW | 🟡 | 🟡 | ⚠️ 5 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `peaq-enters-production-sharing-the-lin` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 5 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `meet-the-peaq-comfort-just-like-at-hom` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | 📋 6 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `a-custom-made-sunroof-walkie-talkies-a` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `13-countries-over-19000-kilometers-the` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 2 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `chainsaws-and-sparklers-discover-the-t` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `from-unwanted-graffiti-to-bold-support` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `la-dolce-vita-explore-the-surroundings` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `ouninpohja-finlands-roller-coaster-sta` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `skodas-smarter-wireless-charging-goes-` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 5 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `a-kodiaq-made-of-paper-the-modeler-spe` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `explore-the-new-skoda-models-in-mixed-` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 5 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `how-the-skoda-octavia-reached-365-km-h` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `innovation-and-technology/explore-the-` | STO/STO | alias | — | — | ⚠️ 5 | 📋 | — | redirect-only check (609) |
| `legend-chris-froome-takes-you-behind-t` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `the-new-skoda-slavia-features-a-refres` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 2 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `the-versatile-octavia-do-you-know-thes` | STO/STO | PREVIEW | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `skoda-auto-klaus-zellmer-to-leave-the-` | MR/MR | PREVIEW | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `skoda-auto-and-national-theatre-extend` | MR/MR | PREVIEW | 🟡 | 🟡 | ⚠️ 2 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `skoda-superb-25-years-of-comfort-space` | MR/MR | PREVIEW | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `skoda-auto-announces-changes-to-its-bo` | MR/MR | PREVIEW | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `936-km-without-recharging-skoda-peaq-s` | MR/MR | PREVIEW | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `new-superb` | MR/MR | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `octavia` | MR/MR | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `epiq` | MR/MR | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 2 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `peaq` | MR/MR | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 2 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `new-fabia` | MR/MR | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; EDS renders the STO /nav + /footer (no MR fragments, n… |
| `125-years-of-motorsport` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 2 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `130-years` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 2 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `roads-places` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 3 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `unexpected-jobs` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 2 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `minutes-from-car-production` | STO/STO | EDS-LOCAL | 🟡 | 🟡 | ⚠️ 4 | 📋 | ❌ | side detected; inherits the /en/ G7 measurement (same /nav + /footer … |
| `skoda-peaq-press-kit-2` | MR/MR | NOT-IMPORTED | ❌ | ❌ | ⚠️ 3 | 📋 | ❌ | side detected; EDS would render the STO /nav + /footer (no MR fragmen… |
| `skoda-epiq-press-kit-2` | MR/MR | NOT-IMPORTED | ❌ | ❌ | ⚠️ 3 | 📋 | ❌ | side detected; EDS would render the STO /nav + /footer (no MR fragmen… |
| `125-years-of-skoda-motorsport-press-ki` | MR/MR | NOT-IMPORTED | ❌ | ❌ | ⚠️ 3 | 📋 | ❌ | side detected; EDS would render the STO /nav + /footer (no MR fragmen… |
| `skoda-peaq-first-glimpse-of-skodas-new` | MR/MR | NOT-IMPORTED | ❌ | ❌ | ⚠️ 3 | 📋 | ❌ | side detected; EDS would render the STO /nav + /footer (no MR fragmen… |
| `en (home)` | STO/STO | PREVIEW | 🟡 | 🟡 | ⚠️ 6 | 📋 | ❌ | measured (G7 rows) |
| `images` | MR/MR | EDS-LOCAL | ⚠️ | ⚠️ | ⚠️ 6 | 📋 | ❌ | measured (G7 rows) |
| `videos` | MR/MR | EDS-LOCAL | ⚠️ | ⚠️ | ⚠️ 6 | 📋 | ❌ | measured (G7 rows) |

## 5. Per-page element registry

Ordered top to bottom as rendered on the source. `Top delta` is the first blocking (else visible) measured delta; all deltas, key measures and functional checks are in the JSON.

<details><summary><b>/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/</b> · story detail / single-post / SiteOrigin · STO · EDS PREVIEW · 23 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story article shell | story-detail | `main.main article.post` | 1 | 🟡 | DELTA | 801✓, 814(M2), 604, 822✓ | reading column width @375: 355px → 375px |
| 2 | Hero title | hero | `.hero .hero-heading h1` | 1 | 🟡 | DELTA | 202✓, 816 | hero heading width @375: 355px → 327px |
| 3 | Hero 16:9 image | hero | `.hero .hero-image.ratio-16x9` | 1 | 🟡 | DELTA | 202✓, 816, 501 | hero image width @375: 355px → 327px |
| 4 | Hero perex | hero | `.hero-caption .perex` | 1 | 🟡 | DELTA | 816 | hero perex width @375: 355px → 327px |
| 5 | Hero category/date | tags | `.hero .hero-caption` | 1 | 🟡 | DELTA | 816, 205✓ | Hero category/date width @375: 375px → 327px |
| 6 | SiteOrigin grid rows | siteorigin-body | `article .content .panel-grid` | 3 | 🟡 | DELTA | 801✓, 814(M2), 821 | reading column width @375: 355px → 375px |
| 7 | Rich-text editor widgets | siteorigin-body | `.content .widget_sow-editor` | 6 | ✅ | MATCH | 801✓, 814(M2) |  |
| 8 | Inline editorial images | siteorigin-body | `.content .textwidget img` | 1 | 🟡 | DELTA | 801✓, 501, 814(M2) | Inline editorial images width @768: 469px → 448px |
| 9 | In-body image sliders | in-body-slider | `.content .widget_skoda-carousel-widget` | 3 | 🟡 | DELTA | 219✓, 819, 801a | image carousel width @375: 355px → 327px |
| 10 | In-body embed / consent shell | embeds | `.content .page-embed` | 1 | 🔵 | IN-PR | 204, 818, 604 | YouTube consent/player width @375: 355px → 327px |
| 11 | Dark SiteOrigin editorial row | siteorigin-body | `.content .panel-row-style` | 1 | 📋 | IMPORT-GAP | 801✓, 814(M2), 218 | Dark SiteOrigin editorial row @375: present on source → MISSING on EDS |
| 12 | Sidebar newsletter | newsletter | `.sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823, 904(M2) | sidebar newsletter @375: present x1 → MISSING on EDS |
| 13 | Sidebar Explore more | card-teaser | `.sidebar section.related` | 1 | 🟡 | DELTA | 817, 201✓ | sidebar related cards width @375: 355px → 327px |
| 14 | Sidebar tag chips | tags | `.sidebar section.tags` | 1 | 🟡 | DELTA | 205✓, 817 |  |
| 15 | Sidebar promo creative | side-banner | `.sidebar .side-banner` | 1 | ⛔ | NOT-BUILT | 903(M2), COM-09 | Sidebar promo creative @375: present on source → MISSING on EDS |
| 16 | Media Box dark download band | downloads | `.cover-box .media-box` | 1 | 📋 | CONTENT-BLOCKED | 502, 604, 801a | media box @375: present x1 → MISSING on EDS |
| 17 | Media Box cart/download controls | downloads | `.media-box .media-cart-action` | 3 | 📋 | CONTENT-BLOCKED | 502, 505✓, 604 | media box @375: present x1 → MISSING on EDS |
| 18 | Media Box show-more | downloads | `.media-box .btn.open` | 1 | 📋 | NOT-BUILT | 502, 604 | media box @375: present x1 → MISSING on EDS |
| 19 | Related Stories dark rail | carousel-rails | `.cover-box .related-stories` | 1 | 🟡 | DELTA | 820, 212✓, 218 | related rail width @375: 375px → 327px |
| 20 | Sticky social-share menu | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | COM-15, STO-D10, 824 | Sticky social-share menu @375: present on source → MISSING on EDS |
| 21 | Sticky cart shortcut | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505✓, 604 | Sticky cart shortcut @375: present on source → MISSING on EDS |
| 22 | Sticky scroll-to-top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌ | NOT-BUILT | 604, 824 | Sticky scroll-to-top @375: present on source → MISSING on EDS |
| 23 | SiteOrigin offset spacers | siteorigin-body | `.content .widget_skoda-offset` | 4 | 🟡 | DELTA | 801✓, 814(M2) | desktop 24px authored spacer @1280: 24px for each spacer → widget omitted; equivalent spacing not verified |

</details>

<details><summary><b>/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries/</b> · story detail / single-post / SiteOrigin · STO · EDS PREVIEW · 22 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story article shell | story-detail | `main.main article.post` | 1 | 🟡 | DELTA | 801✓, 814(M2), 604, 822✓ | reading column width @375: 355px → 375px |
| 2 | Hero title | hero | `.hero .hero-heading h1` | 1 | 🟡 | DELTA | 202✓, 816 | hero heading width @375: 355px → 327px |
| 3 | Hero 16:9 image | hero | `.hero .hero-image.ratio-16x9` | 1 | 🟡 | DELTA | 202✓, 816, 501 | hero image width @375: 355px → 375px |
| 4 | Hero perex | hero | `.hero-caption .perex` | 1 | 🟡 | DELTA | 816 | hero perex width @375: 355px → 327px |
| 5 | Hero category/date | tags | `.hero .hero-caption` | 1 | 🟡 | DELTA | 816, 205✓ | Hero category/date width @375: 375px → 327px |
| 6 | SiteOrigin grid rows | siteorigin-body | `article .content .panel-grid` | 2 | 🟡 | DELTA | 801✓, 814(M2), 821 | reading column width @375: 355px → 375px |
| 7 | Rich-text editor widgets | siteorigin-body | `.content .widget_sow-editor` | 6 | ✅ | MATCH | 801✓, 814(M2) |  |
| 8 | Inline editorial images | siteorigin-body | `.content .textwidget img` | 3 | 🟡 | DELTA | 801✓, 501, 814(M2) | Inline editorial images width @375: 355px → 327px |
| 9 | In-body image sliders | in-body-slider | `.content .widget_skoda-carousel-widget` | 1 | 🟡 | DELTA | 219✓, 819, 801a | image carousel width @375: 355px → 327px |
| 10 | Dark SiteOrigin editorial row | siteorigin-body | `.content .panel-row-style` | 1 | 📋 | IMPORT-GAP | 801✓, 814(M2), 218 | Dark SiteOrigin editorial row @375: present on source → MISSING on EDS |
| 11 | Sidebar newsletter | newsletter | `.sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823, 904(M2) | sidebar newsletter @375: present x1 → MISSING on EDS |
| 12 | Sidebar Explore more | card-teaser | `.sidebar section.related` | 1 | 🟡 | DELTA | 817, 201✓ | sidebar related cards width @375: 355px → 327px |
| 13 | Sidebar tag chips | tags | `.sidebar section.tags` | 1 | 🟡 | DELTA | 205✓, 817 |  |
| 14 | Sidebar promo creative | side-banner | `.sidebar .side-banner` | 1 | ⛔ | NOT-BUILT | 903(M2), COM-09 | Sidebar promo creative @375: present on source → MISSING on EDS |
| 15 | Media Box dark download band | downloads | `.cover-box .media-box` | 1 | 📋 | CONTENT-BLOCKED | 502, 604, 801a | media box @375: present x1 → MISSING on EDS |
| 16 | Media Box cart/download controls | downloads | `.media-box .media-cart-action` | 5 | 📋 | CONTENT-BLOCKED | 502, 505✓, 604 | media box @375: present x1 → MISSING on EDS |
| 17 | Media Box show-more | downloads | `.media-box .btn.open` | 1 | 📋 | NOT-BUILT | 502, 604 | media box @375: present x1 → MISSING on EDS |
| 18 | Related Stories dark rail | carousel-rails | `.cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓, 218 | related rail @375: present x1 → MISSING on EDS |
| 19 | Sticky social-share menu | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | COM-15, STO-D10, 824 | Sticky social-share menu @375: present on source → MISSING on EDS |
| 20 | Sticky cart shortcut | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505✓, 604 | Sticky cart shortcut @375: present on source → MISSING on EDS |
| 21 | Sticky scroll-to-top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌ | NOT-BUILT | 604, 824 | Sticky scroll-to-top @375: present on source → MISSING on EDS |
| 22 | SiteOrigin offset spacers | siteorigin-body | `.content .widget_skoda-offset` | 5 | 🟡 | DELTA | 801✓, 814(M2) | desktop 24px authored spacer @1280: 24px for each spacer → widget omitted; equivalent spacing not verified |

</details>

<details><summary><b>/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging/</b> · story detail / single-post / SiteOrigin · STO · EDS PREVIEW · 22 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story article shell | story-detail | `main.main article.post` | 1 | 🟡 | DELTA | 801✓, 814(M2), 604, 822✓ | reading column width @375: 355px → 375px |
| 2 | Hero title | hero | `.hero .hero-heading h1` | 1 | 🟡 | DELTA | 202✓, 816 | hero heading width @375: 355px → 327px |
| 3 | Hero 16:9 image | hero | `.hero .hero-image.ratio-16x9` | 1 | 🟡 | DELTA | 202✓, 816, 501 | hero image width @375: 355px → 375px |
| 4 | Hero perex | hero | `.hero-caption .perex` | 1 | 🟡 | DELTA | 816 | hero perex width @375: 355px → 327px |
| 5 | Hero category/date | tags | `.hero .hero-caption` | 1 | 🟡 | DELTA | 816, 205✓ | Hero category/date width @375: 375px → 327px |
| 6 | SiteOrigin grid rows | siteorigin-body | `article .content .panel-grid` | 1 | 🟡 | DELTA | 801✓, 814(M2), 821 | reading column width @375: 355px → 375px |
| 7 | Rich-text editor widgets | siteorigin-body | `.content .widget_sow-editor` | 9 | ✅ | MATCH | 801✓, 814(M2) |  |
| 8 | Inline editorial images | siteorigin-body | `.content .textwidget img` | 3 | 🟡 | DELTA | 801✓, 501, 814(M2) | Inline editorial images width @375: 355px → 327px |
| 9 | In-body image sliders | in-body-slider | `.content .widget_skoda-carousel-widget` | 4 | 🟡 | DELTA | 219✓, 819, 801a | image carousel width @375: 355px → 327px |
| 10 | Lite YouTube poster/play | embeds | `.content lite-youtube > button.lty-playbtn` | 1 | 📋 | IMPORT-GAP | 204, 818, 604 | Lite YouTube poster/play @375: present on source → MISSING on EDS |
| 11 | Sidebar newsletter | newsletter | `.sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823, 904(M2) | sidebar newsletter @375: present x1 → MISSING on EDS |
| 12 | Sidebar Explore more | card-teaser | `.sidebar section.related` | 1 | 🟡 | DELTA | 817, 201✓ | sidebar related cards width @375: 355px → 327px |
| 13 | Sidebar tag chips | tags | `.sidebar section.tags` | 1 | 🟡 | DELTA | 205✓, 817 |  |
| 14 | Sidebar promo creative | side-banner | `.sidebar .side-banner` | 1 | ⛔ | NOT-BUILT | 903(M2), COM-09 | Sidebar promo creative @375: present on source → MISSING on EDS |
| 15 | Media Box dark download band | downloads | `.cover-box .media-box` | 1 | 📋 | CONTENT-BLOCKED | 502, 604, 801a | media box @375: present x1 → MISSING on EDS |
| 16 | Media Box cart/download controls | downloads | `.media-box .media-cart-action` | 1 | 📋 | CONTENT-BLOCKED | 502, 505✓, 604 | media box @375: present x1 → MISSING on EDS |
| 17 | Media Box show-more | downloads | `.media-box .btn.open` | 1 | 📋 | NOT-BUILT | 502, 604 | media box @375: present x1 → MISSING on EDS |
| 18 | Related Stories dark rail | carousel-rails | `.cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓, 218 | related rail @375: present x1 → MISSING on EDS |
| 19 | Sticky social-share menu | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | COM-15, STO-D10, 824 | Sticky social-share menu @375: present on source → MISSING on EDS |
| 20 | Sticky cart shortcut | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505✓, 604 | Sticky cart shortcut @375: present on source → MISSING on EDS |
| 21 | Sticky scroll-to-top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌ | NOT-BUILT | 604, 824 | Sticky scroll-to-top @375: present on source → MISSING on EDS |
| 22 | SiteOrigin offset spacers | siteorigin-body | `.content .widget_skoda-offset` | 5 | 🟡 | DELTA | 801✓, 814(M2) | desktop 24px authored spacer @1280: 24px for each spacer → widget omitted; equivalent spacing not verified |

</details>

<details><summary><b>/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq/</b> · story detail / single-post / SiteOrigin · STO · EDS EDS-LOCAL · 21 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story article shell | story-detail | `main.main article.post` | 1 | 🟡 | DELTA | 801✓, 814(M2), 604, 822✓ | reading column width @375: 355px → 375px |
| 2 | Hero title | hero | `.hero .hero-heading h1` | 1 | 🟡 | DELTA | 202✓, 816 | hero heading width @375: 355px → 327px |
| 3 | Hero 16:9 image | hero | `.hero .hero-image.ratio-16x9` | 1 | 🟡 | DELTA | 202✓, 816, 501 | hero image width @375: 355px → 375px |
| 4 | Hero perex | hero | `.hero-caption .perex` | 1 | 🟡 | DELTA | 816 | hero perex width @375: 355px → 327px |
| 5 | Hero category/date | tags | `.hero .hero-caption` | 1 | 📋 | IMPORT-GAP | 816, 205✓ | story category/date label @375: category/date label → MISSING on EDS; DA metadata contains category and date |
| 6 | SiteOrigin grid rows | siteorigin-body | `article .content .panel-grid` | 1 | 📋 | IMPORT-GAP | 801✓, 814(M2), 821 | SiteOrigin row/column structure @375: authored rows and columns → single linear default-content section |
| 7 | Rich-text editor widgets | siteorigin-body | `.content .widget_sow-editor` | 7 | ✅ | MATCH | 801✓, 814(M2) |  |
| 8 | Inline editorial images | siteorigin-body | `.content .textwidget img` | 3 | 🟡 | DELTA | 801✓, 501, 814(M2) | inline image layout @375: images within SiteOrigin grid/gallery → 12 main image(s), flattened into paragraphs |
| 9 | In-body image sliders | in-body-slider | `.content .widget_skoda-carousel-widget` | 3 | 📋 | IMPORT-GAP | 219✓, 819, 801a | image carousel @375: present x3 → MISSING on EDS |
| 10 | Sidebar newsletter | newsletter | `.sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823, 904(M2) | sidebar newsletter @375: present x1 → MISSING on EDS |
| 11 | Sidebar Explore more | card-teaser | `.sidebar section.related` | 1 | 📋 | IMPORT-GAP | 817, 201✓ | sidebar related cards @375: present x3 → MISSING on EDS |
| 12 | Sidebar tag chips | tags | `.sidebar section.tags` | 1 | 📋 | CONTENT-BLOCKED | 205✓, 817 | sidebar tag chips @375: present x2 → MISSING on EDS |
| 13 | Sidebar promo creative | side-banner | `.sidebar .side-banner` | 1 | ⛔ | NOT-BUILT | 903(M2), COM-09 | Sidebar promo creative @375: present on source → MISSING on EDS |
| 14 | Media Box dark download band | downloads | `.cover-box .media-box` | 1 | 📋 | CONTENT-BLOCKED | 502, 604, 801a | media box @375: present x1 → MISSING on EDS |
| 15 | Media Box cart/download controls | downloads | `.media-box .media-cart-action` | 3 | 📋 | CONTENT-BLOCKED | 502, 505✓, 604 | media box @375: present x1 → MISSING on EDS |
| 16 | Media Box show-more | downloads | `.media-box .btn.open` | 1 | 📋 | NOT-BUILT | 502, 604 | media box @375: present x1 → MISSING on EDS |
| 17 | Related Stories dark rail | carousel-rails | `.cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓, 218 | related rail @375: present x1 → MISSING on EDS |
| 18 | Sticky social-share menu | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | COM-15, STO-D10, 824 | Sticky social-share menu @375: present on source → MISSING on EDS |
| 19 | Sticky cart shortcut | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505✓, 604 | Sticky cart shortcut @375: present on source → MISSING on EDS |
| 20 | Sticky scroll-to-top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌ | NOT-BUILT | 604, 824 | Sticky scroll-to-top @375: present on source → MISSING on EDS |
| 21 | SiteOrigin offset spacers | siteorigin-body | `.content .widget_skoda-offset` | 5 | 📋 | IMPORT-GAP | 801✓, 814(M2) | authored offset widgets @375: author-controlled vertical spacing → widget structure MISSING; default content … |

</details>

<details><summary><b>/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq/</b> · story detail / single-post / SiteOrigin · STO · EDS PREVIEW · 21 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story article shell | story-detail | `main.main article.post` | 1 | 🟡 | DELTA | 801✓, 814(M2), 604, 822✓ | reading column width @375: 355px → 375px |
| 2 | Hero title | hero | `.hero .hero-heading h1` | 1 | 🟡 | DELTA | 202✓, 816 | hero heading width @375: 355px → 327px |
| 3 | Hero 16:9 image | hero | `.hero .hero-image.ratio-16x9` | 1 | 🟡 | DELTA | 202✓, 816, 501 | hero image width @375: 355px → 327px |
| 4 | Hero perex | hero | `.hero-caption .perex` | 1 | 🟡 | DELTA | 816 | hero perex width @375: 355px → 327px |
| 5 | Hero category/date | tags | `.hero .hero-caption` | 1 | 🟡 | DELTA | 816, 205✓ | Hero category/date width @375: 375px → 327px |
| 6 | SiteOrigin grid rows | siteorigin-body | `article .content .panel-grid` | 1 | 🟡 | DELTA | 801✓, 814(M2), 821 | reading column width @375: 355px → 375px |
| 7 | Rich-text editor widgets | siteorigin-body | `.content .widget_sow-editor` | 7 | ✅ | MATCH | 801✓, 814(M2) |  |
| 8 | Inline editorial images | siteorigin-body | `.content .textwidget img` | 2 | 🟡 | DELTA | 801✓, 501, 814(M2) | Inline editorial images width @375: 355px → 327px |
| 9 | In-body image sliders | in-body-slider | `.content .widget_skoda-carousel-widget` | 2 | 🟡 | DELTA | 219✓, 819, 801a | image carousel width @375: 355px → 327px |
| 10 | Sidebar newsletter | newsletter | `.sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823, 904(M2) | sidebar newsletter @375: present x1 → MISSING on EDS |
| 11 | Sidebar Explore more | card-teaser | `.sidebar section.related` | 1 | 🟡 | DELTA | 817, 201✓ | sidebar related cards width @375: 355px → 327px |
| 12 | Sidebar tag chips | tags | `.sidebar section.tags` | 1 | 🟡 | DELTA | 205✓, 817 |  |
| 13 | Sidebar promo creative | side-banner | `.sidebar .side-banner` | 1 | ⛔ | NOT-BUILT | 903(M2), COM-09 | Sidebar promo creative @375: present on source → MISSING on EDS |
| 14 | Media Box dark download band | downloads | `.cover-box .media-box` | 1 | 📋 | CONTENT-BLOCKED | 502, 604, 801a | media box @375: present x1 → MISSING on EDS |
| 15 | Media Box cart/download controls | downloads | `.media-box .media-cart-action` | 1 | 📋 | CONTENT-BLOCKED | 502, 505✓, 604 | media box @375: present x1 → MISSING on EDS |
| 16 | Media Box show-more | downloads | `.media-box .btn.open` | 1 | 📋 | NOT-BUILT | 502, 604 | media box @375: present x1 → MISSING on EDS |
| 17 | Related Stories dark rail | carousel-rails | `.cover-box .related-stories` | 1 | 🟡 | DELTA | 820, 212✓, 218 | related rail width @375: 375px → 327px |
| 18 | Sticky social-share menu | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | COM-15, STO-D10, 824 | Sticky social-share menu @375: present on source → MISSING on EDS |
| 19 | Sticky cart shortcut | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505✓, 604 | Sticky cart shortcut @375: present on source → MISSING on EDS |
| 20 | Sticky scroll-to-top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌ | NOT-BUILT | 604, 824 | Sticky scroll-to-top @375: present on source → MISSING on EDS |
| 21 | SiteOrigin offset spacers | siteorigin-body | `.content .widget_skoda-offset` | 5 | 🟡 | DELTA | 801✓, 814(M2) | desktop 24px authored spacer @1280: 24px for each spacer → widget omitted; equivalent spacing not verified |

</details>

<details><summary><b>/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia/</b> · story detail / single-post / SiteOrigin · STO · EDS EDS-LOCAL · 22 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story article shell | story-detail | `main.main article.post` | 1 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2), 604, 822✓ | Story article shell @375: present on source → MISSING on EDS |
| 2 | Hero title | hero | `.hero .hero-heading h1` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 816 | Hero title @375: present on source → MISSING on EDS |
| 3 | Hero 16:9 image | hero | `.hero .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 816, 501 | Hero 16:9 image @375: present on source → MISSING on EDS |
| 4 | Hero perex | hero | `.hero-caption .perex` | 1 | 📋 | CONTENT-BLOCKED | 816 | Hero perex @375: present on source → MISSING on EDS |
| 5 | Hero category/date | tags | `.hero .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ | Hero category/date @375: present on source → MISSING on EDS |
| 6 | SiteOrigin grid rows | siteorigin-body | `article .content .panel-grid` | 3 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2), 821 | SiteOrigin grid rows @375: present on source → MISSING on EDS |
| 7 | Rich-text editor widgets | siteorigin-body | `.content .widget_sow-editor` | 5 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2) | Rich-text editor widgets @375: present on source → MISSING on EDS |
| 8 | In-body image sliders | in-body-slider | `.content .widget_skoda-carousel-widget` | 3 | 📋 | CONTENT-BLOCKED | 219✓, 819, 801a | In-body image sliders @375: present on source → MISSING on EDS |
| 9 | In-body Vimeo video | embeds | `.content .video-container` | 1 | 📋 | CONTENT-BLOCKED | 204, 818, 604 | In-body Vimeo video @375: present on source → MISSING on EDS |
| 10 | Dark SiteOrigin editorial row | siteorigin-body | `.content .panel-row-style` | 1 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2), 218 | Dark SiteOrigin editorial row @375: present on source → MISSING on EDS |
| 11 | Sidebar newsletter | newsletter | `.sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823, 904(M2) | Sidebar newsletter @375: present on source → MISSING on EDS |
| 12 | Sidebar Explore more | card-teaser | `.sidebar section.related` | 1 | 📋 | CONTENT-BLOCKED | 817, 201✓ | Sidebar Explore more @375: present on source → MISSING on EDS |
| 13 | Sidebar tag chips | tags | `.sidebar section.tags` | 1 | 📋 | CONTENT-BLOCKED | 205✓, 817 | Sidebar tag chips @375: present on source → MISSING on EDS |
| 14 | Sidebar promo creative | side-banner | `.sidebar .side-banner` | 1 | ⛔ | NOT-BUILT | 903(M2), COM-09 | Sidebar promo creative @375: present on source → MISSING on EDS |
| 15 | Media Box dark download band | downloads | `.cover-box .media-box` | 1 | 📋 | CONTENT-BLOCKED | 502, 604, 801a | Media Box dark download band @375: present on source → MISSING on EDS |
| 16 | Media Box cart/download controls | downloads | `.media-box .media-cart-action` | 1 | 📋 | CONTENT-BLOCKED | 502, 505✓, 604 | Media Box cart/download controls @375: present on source → MISSING on EDS |
| 17 | Media Box show-more | downloads | `.media-box .btn.open` | 1 | 📋 | NOT-BUILT | 502, 604 | Media Box show-more @375: present on source → MISSING on EDS |
| 18 | Related Stories dark rail | carousel-rails | `.cover-box .related-stories` | 1 | 📋 | CONTENT-BLOCKED | 820, 212✓, 218 | Related Stories dark rail @375: present on source → MISSING on EDS |
| 19 | Sticky social-share menu | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | COM-15, STO-D10, 824 | Sticky social-share menu @375: present on source → MISSING on EDS |
| 20 | Sticky cart shortcut | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505✓, 604 | Sticky cart shortcut @375: present on source → MISSING on EDS |
| 21 | Sticky scroll-to-top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌ | NOT-BUILT | 604, 824 | Sticky scroll-to-top @375: present on source → MISSING on EDS |
| 22 | SiteOrigin offset spacers | siteorigin-body | `.content .widget_skoda-offset` | 4 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2) | SiteOrigin offset spacers @768: present on source → MISSING on EDS |

</details>

<details><summary><b>/en/emobility/meet-the-peaq-comfort-just-like-at-home/</b> · story detail / single-post / SiteOrigin · STO · EDS EDS-LOCAL · 22 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story article shell | story-detail | `main.main article.post` | 1 | 🟡 | DELTA | 801✓, 814(M2), 604, 822✓ | reading column width @375: 355px → 375px |
| 2 | Hero title | hero | `.hero .hero-heading h1` | 1 | 🟡 | DELTA | 202✓, 816 | hero heading width @375: 355px → 327px |
| 3 | Hero 16:9 image | hero | `.hero .hero-image.ratio-16x9` | 1 | 🟡 | DELTA | 202✓, 816, 501 | hero image width @375: 355px → 375px |
| 4 | Hero perex | hero | `.hero-caption .perex` | 1 | 🟡 | DELTA | 816 | hero perex width @375: 355px → 327px |
| 5 | Hero category/date | tags | `.hero .hero-caption` | 1 | 📋 | IMPORT-GAP | 816, 205✓ | story category/date label @375: category/date label → MISSING on EDS; DA metadata contains category and date |
| 6 | SiteOrigin grid rows | siteorigin-body | `article .content .panel-grid` | 3 | 📋 | IMPORT-GAP | 801✓, 814(M2), 821 | SiteOrigin row/column structure @375: authored rows and columns → single linear default-content section |
| 7 | Rich-text editor widgets | siteorigin-body | `.content .widget_sow-editor` | 5 | ✅ | MATCH | 801✓, 814(M2) |  |
| 8 | Inline editorial images | siteorigin-body | `.content .textwidget img` | 1 | 🟡 | DELTA | 801✓, 501, 814(M2) | inline image layout @375: images within SiteOrigin grid/gallery → 10 main image(s), flattened into paragraphs |
| 9 | In-body image sliders | in-body-slider | `.content .widget_skoda-carousel-widget` | 2 | 📋 | IMPORT-GAP | 219✓, 819, 801a | image carousel @375: present x2 → MISSING on EDS |
| 10 | Lite YouTube poster/play | embeds | `.content lite-youtube > button.lty-playbtn` | 1 | 📋 | IMPORT-GAP | 204, 818, 604 | Lite YouTube poster/play @375: present on source → MISSING on EDS |
| 11 | Sidebar newsletter | newsletter | `.sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823, 904(M2) | sidebar newsletter @375: present x1 → MISSING on EDS |
| 12 | Sidebar Explore more | card-teaser | `.sidebar section.related` | 1 | 📋 | IMPORT-GAP | 817, 201✓ | sidebar related cards @375: present x3 → MISSING on EDS |
| 13 | Sidebar tag chips | tags | `.sidebar section.tags` | 1 | 📋 | CONTENT-BLOCKED | 205✓, 817 | sidebar tag chips @375: present x2 → MISSING on EDS |
| 14 | Sidebar promo creative | side-banner | `.sidebar .side-banner` | 1 | ⛔ | NOT-BUILT | 903(M2), COM-09 | Sidebar promo creative @375: present on source → MISSING on EDS |
| 15 | Media Box dark download band | downloads | `.cover-box .media-box` | 1 | 📋 | CONTENT-BLOCKED | 502, 604, 801a | media box @375: present x1 → MISSING on EDS |
| 16 | Media Box cart/download controls | downloads | `.media-box .media-cart-action` | 5 | 📋 | CONTENT-BLOCKED | 502, 505✓, 604 | media box @375: present x1 → MISSING on EDS |
| 17 | Media Box show-more | downloads | `.media-box .btn.open` | 1 | 📋 | NOT-BUILT | 502, 604 | media box @375: present x1 → MISSING on EDS |
| 18 | Related Stories dark rail | carousel-rails | `.cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓, 218 | related rail @375: present x1 → MISSING on EDS |
| 19 | Sticky social-share menu | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | COM-15, STO-D10, 824 | Sticky social-share menu @375: present on source → MISSING on EDS |
| 20 | Sticky cart shortcut | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505✓, 604 | Sticky cart shortcut @375: present on source → MISSING on EDS |
| 21 | Sticky scroll-to-top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌ | NOT-BUILT | 604, 824 | Sticky scroll-to-top @375: present on source → MISSING on EDS |
| 22 | SiteOrigin offset spacers | siteorigin-body | `.content .widget_skoda-offset` | 2 | 📋 | IMPORT-GAP | 801✓, 814(M2) | authored offset widgets @375: author-controlled vertical spacing → widget structure MISSING; default content … |

</details>

<details><summary><b>/en/emobility/a-custom-made-sunroof-walkie-talkies-and-champagne-the-skoda-peaq-at-the-tour-de-france/</b> · story detail / single-post / SiteOrigin · STO · EDS EDS-LOCAL · 22 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story article shell | story-detail | `main.main article.post` | 1 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2), 604, 822✓ | Story article shell @375: present on source → MISSING on EDS |
| 2 | Hero title | hero | `.hero .hero-heading h1` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 816 | Hero title @375: present on source → MISSING on EDS |
| 3 | Hero 16:9 image | hero | `.hero .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 816, 501 | Hero 16:9 image @375: present on source → MISSING on EDS |
| 4 | Hero perex | hero | `.hero-caption .perex` | 1 | 📋 | CONTENT-BLOCKED | 816 | Hero perex @375: present on source → MISSING on EDS |
| 5 | Hero category/date | tags | `.hero .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ | Hero category/date @375: present on source → MISSING on EDS |
| 6 | SiteOrigin grid rows | siteorigin-body | `article .content .panel-grid` | 2 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2), 821 | SiteOrigin grid rows @375: present on source → MISSING on EDS |
| 7 | Rich-text editor widgets | siteorigin-body | `.content .widget_sow-editor` | 5 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2) | Rich-text editor widgets @375: present on source → MISSING on EDS |
| 8 | Inline editorial images | siteorigin-body | `.content .textwidget img` | 3 | 📋 | CONTENT-BLOCKED | 801✓, 501, 814(M2) | Inline editorial images @375: present on source → MISSING on EDS |
| 9 | In-body image sliders | in-body-slider | `.content .widget_skoda-carousel-widget` | 1 | 📋 | CONTENT-BLOCKED | 219✓, 819, 801a | In-body image sliders @375: present on source → MISSING on EDS |
| 10 | Dark SiteOrigin editorial row | siteorigin-body | `.content .panel-row-style` | 1 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2), 218 | Dark SiteOrigin editorial row @375: present on source → MISSING on EDS |
| 11 | Sidebar newsletter | newsletter | `.sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823, 904(M2) | Sidebar newsletter @375: present on source → MISSING on EDS |
| 12 | Sidebar Explore more | card-teaser | `.sidebar section.related` | 1 | 📋 | CONTENT-BLOCKED | 817, 201✓ | Sidebar Explore more @375: present on source → MISSING on EDS |
| 13 | Sidebar tag chips | tags | `.sidebar section.tags` | 1 | 📋 | CONTENT-BLOCKED | 205✓, 817 | Sidebar tag chips @375: present on source → MISSING on EDS |
| 14 | Sidebar promo creative | side-banner | `.sidebar .side-banner` | 1 | ⛔ | NOT-BUILT | 903(M2), COM-09 | Sidebar promo creative @375: present on source → MISSING on EDS |
| 15 | Media Box dark download band | downloads | `.cover-box .media-box` | 1 | 📋 | CONTENT-BLOCKED | 502, 604, 801a | Media Box dark download band @375: present on source → MISSING on EDS |
| 16 | Media Box cart/download controls | downloads | `.media-box .media-cart-action` | 1 | 📋 | CONTENT-BLOCKED | 502, 505✓, 604 | Media Box cart/download controls @375: present on source → MISSING on EDS |
| 17 | Media Box show-more | downloads | `.media-box .btn.open` | 1 | 📋 | NOT-BUILT | 502, 604 | Media Box show-more @375: present on source → MISSING on EDS |
| 18 | Related Stories dark rail | carousel-rails | `.cover-box .related-stories` | 1 | 📋 | CONTENT-BLOCKED | 820, 212✓, 218 | Related Stories dark rail @375: present on source → MISSING on EDS |
| 19 | Sticky social-share menu | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | COM-15, STO-D10, 824 | Sticky social-share menu @375: present on source → MISSING on EDS |
| 20 | Sticky cart shortcut | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505✓, 604 | Sticky cart shortcut @375: present on source → MISSING on EDS |
| 21 | Sticky scroll-to-top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌ | NOT-BUILT | 604, 824 | Sticky scroll-to-top @375: present on source → MISSING on EDS |
| 22 | SiteOrigin offset spacers | siteorigin-body | `.content .widget_skoda-offset` | 3 | 📋 | CONTENT-BLOCKED | 801✓, 814(M2) | SiteOrigin offset spacers @768: present on source → MISSING on EDS |

</details>

<details><summary><b>/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague/</b> · story-detail · STO · EDS EDS-LOCAL · 15 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 14 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | Dark SiteOrigin row | siteorigin-body | `article .content .panel-row-style` | 3 | ⚠️ | IMPORT-GAP | 801✓, 814(M2) |  |
| 8 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 4 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 9 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 10 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 11 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 12 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 13 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 14 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 15 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans/</b> · story-detail · STO · EDS EDS-LOCAL · 15 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 5 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 4 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 8 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 9 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 10 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 11 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 12 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 13 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 14 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 15 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling/</b> · story-detail · STO · EDS EDS-LOCAL · 17 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 6 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | Dark SiteOrigin row | siteorigin-body | `article .content .panel-row-style` | 1 | ⚠️ | IMPORT-GAP | 801✓, 814(M2) |  |
| 8 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 1 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 9 | Graffiti YouTube | embeds | `article .content lite-youtube` | 1 | 📋 | IMPORT-GAP | 818, 204 |  |
| 10 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 11 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 12 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 13 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 14 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 15 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 16 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 17 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como/</b> · story-detail · STO · EDS EDS-LOCAL · 15 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 6 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 2 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 8 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 9 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 10 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 11 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 12 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 13 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 14 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 15 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/lifestyle/ouninpohja-finlands-roller-coaster-stage/</b> · story-detail · STO · EDS EDS-LOCAL · 15 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 5 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 4 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 8 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 9 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 10 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 11 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 12 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 13 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 14 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 15 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones/</b> · story-detail · STO · EDS EDS-LOCAL · 17 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 6 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | Dark SiteOrigin row | siteorigin-body | `article .content .panel-row-style` | 1 | ⚠️ | IMPORT-GAP | 801✓, 814(M2) |  |
| 8 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 1 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 9 | SiteOrigin image widget | siteorigin-body | `article .content .widget_sow-image` | 1 | 📋 | IMPORT-GAP | 801✓, 814(M2) |  |
| 10 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 11 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 12 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 13 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 14 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 15 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 16 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 17 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-world/a-kodiaq-made-of-paper-the-modeler-spent-700-hours-developing-and-building-it/</b> · story-detail · STO · EDS EDS-LOCAL · 16 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 9 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | Dark SiteOrigin row | siteorigin-body | `article .content .panel-row-style` | 3 | ⚠️ | IMPORT-GAP | 801✓, 814(M2) |  |
| 8 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 1 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 9 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 10 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 11 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 12 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 13 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 14 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 15 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 16 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality/</b> · story-detail · STO · EDS EDS-LOCAL · 17 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 9 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | Dark SiteOrigin row | siteorigin-body | `article .content .panel-row-style` | 2 | ⚠️ | IMPORT-GAP | 801✓, 814(M2) |  |
| 8 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 1 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 9 | Inline Vimeo | embeds | `article .content .video-container` | 1 | 📋 | IMPORT-GAP | 204, 801a |  |
| 10 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 11 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 12 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 13 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 14 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 15 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 16 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 17 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-world/how-the-skoda-octavia-reached-365-km-h/</b> · story-detail · STO · EDS EDS-LOCAL · 15 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 5 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 5 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 8 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 9 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 10 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 11 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 12 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 13 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 14 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 15 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality/</b> · story-alias · STO · EDS EDS-LOCAL · 0 elements</summary>

Alias URL, checked as a redirect only. Source: HTTP 200 with a canonical to the primary URL. EDS: 404, needs the SKODA-609 301.

</details>

<details><summary><b>/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france/</b> · story-detail · STO · EDS EDS-LOCAL · 16 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 7 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | Dark SiteOrigin row | siteorigin-body | `article .content .panel-row-style` | 1 | ⚠️ | IMPORT-GAP | 801✓, 814(M2) |  |
| 8 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 1 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 9 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 10 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 11 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 12 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 13 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 14 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 15 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 16 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour/</b> · story-detail · STO · EDS EDS-LOCAL · 16 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 📋 | CONTENT-BLOCKED | 816, 604 |  |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 📋 | CONTENT-BLOCKED | 816 |  |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 📋 | CONTENT-BLOCKED | 816 |  |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 📋 | CONTENT-BLOCKED | 816, 205✓ |  |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 📋 | CONTENT-BLOCKED | 822✓, 604 |  |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 6 | 📋 | CONTENT-BLOCKED | 801✓, 801a, 814(M2), 821 |  |
| 7 | Dark SiteOrigin row | siteorigin-body | `article .content .panel-row-style` | 1 | ⚠️ | IMPORT-GAP | 801✓, 814(M2) |  |
| 8 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 4 | 📋 | IMPORT-GAP | 819, 203✓, 801a |  |
| 9 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 |  |
| 10 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 📋 | IMPORT-GAP | 817 |  |
| 11 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 📋 | IMPORT-GAP | 205✓ |  |
| 12 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a |  |
| 13 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ |  |
| 14 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 15 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 16 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-world/the-versatile-octavia-do-you-know-these-ones-too/</b> · story-detail · STO · EDS PREVIEW · 16 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Story hero | hero | `article .hero` | 1 | 🟡 | DELTA | 816, 604 | height @375: 605px → 558px |
| 2 | Hero heading | hero | `article .hero h1.heading` | 3 | 🟡 | DELTA | 816 | width @375: 355px → 327px |
| 3 | Hero image | hero | `article .hero-image.ratio-16x9` | 1 | 🟡 | DELTA | 816 | width @375: 362px → 375px |
| 4 | Hero perex/category | hero | `article .hero-caption` | 1 | 🟡 | DELTA | 816, 205✓ | (element) @375: present x1 → MISSING on EDS |
| 5 | Story shell | story-detail | `article .columns > .content` | 1 | 🟡 | DELTA | 822✓, 604 | width @375: 355px → 375px |
| 6 | SiteOrigin prose | siteorigin-body | `article .content .widget_sow-editor` | 10 | 🟡 | DELTA | 801✓, 801a, 814(M2), 821 | width @375: 355px → 327px |
| 7 | Dark SiteOrigin row | siteorigin-body | `article .content .panel-row-style` | 1 | ⚠️ | IMPORT-GAP | 801✓, 814(M2) |  |
| 8 | In-body carousel | in-body-slider | `article .content .widget_skoda-carousel-widget` | 5 | 🟡 | DELTA | 819, 203✓, 801a | width @375: 355px → 327px |
| 9 | Newsletter sidebar | newsletter | `article .sidebar .newsletter-subscribe-widget` | 1 | 📋 | NOT-BUILT | 823 | (element) @375: present x1 → MISSING on EDS |
| 10 | Explore more teasers | card-teaser | `article .sidebar section.related` | 3 | 🟡 | DELTA | 817 | width @375: 355px → 327px |
| 11 | Sidebar tags | tags | `article .sidebar section.tags` | 1 | 🟡 | DELTA | 205✓ | width @375: 355px → 327px |
| 12 | Media Box downloads | downloads | `article .cover-box .media-box` | 1 | ⚠️ | IMPORT-GAP | 502, 801a | (element) @375: present x1 → MISSING on EDS |
| 13 | Bottom Related Stories | carousel-rails | `article .cover-box .related-stories` | 1 | 📋 | IMPORT-GAP | 820, 212✓ | (element) @375: present x1 → MISSING on EDS |
| 14 | Sticky share | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |
| 15 | Sticky cart | media-cart | `.sticky-buttons .media-cart-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 16 | Scroll to top | page-float-dock | `.sticky-buttons .scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company/</b> · press_release · MR · EDS PREVIEW · 17 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Media Room chrome (header and footer) | mr-side-chrome | `header.header, footer.footer` | 1 | 🟡 | DELTA | 305, 607, 825 | nav/footer variant @1280: News/Press Kits/Models/Images/Videos/Company/Škodapedia + Contacts/Subscribe/Compan… |
| 2 | Published date | template-press-release | `article.press_release .entry-published` | 1 | 🟡 | DELTA | 607 | date fontSize @375: 11px → 16px |
| 3 | Press release text title | template-press-release | `article.press_release h1.entry-title` | 1 | 🟡 | DELTA | 607 | width @375: 355px → 327px |
| 4 | Two-column article shell | template-press-release | `article.press_release .columns` | 1 | 📋 | NOT-BUILT | 607, 821 | height @375: 2454px → 2935px |
| 5 | Lead inline photo | card-teaser | `article.press_release .column-primary .article-te…` | 1 | 🟡 | DELTA | 607, 201✓ | width @375: 355px → 375px |
| 6 | Perex / lead summary | template-press-release | `article.press_release .column-primary .entry-summ…` | 1 | 🟡 | DELTA | 607, 803(M2) | perex width @375: 355px → 327px |
| 7 | Rich text body, inline subheadings and links | template-press-release | `article.press_release .column-primary .entry-cont…` | 1 | 🟡 | DELTA | 607, 803(M2), 821 | width @375: 355px → 375px |
| 8 | Buzzsprout AI-audio | embeds | `article.press_release .entry-content .embed-contr…` | 1 | 📋 | IMPORT-GAP | 204, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 9 | Additional info / media contacts / Download Media Box | downloads | `article.press_release .column-secondary > section…` | 1 | 📋 | IMPORT-GAP | 502, 505✓, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 10 | Sidebar Images preview / lightbox | gallery-lightbox | `article.press_release .column-secondary .images.s…` | 1 | 🟡 | DELTA | 203✓, 607, 803(M2) | width @375: 355px → 327px |
| 11 | Taxonomy tag chips | tags | `article.press_release .column-secondary ol.entry-…` | 1 | 🟡 | DELTA | 205✓, 607 | width @375: 355px → 327px |
| 12 | Media Box asset cards | downloads | `article.press_release .cover-box.dark .search-res…` | 1 | 🟡 | DELTA | 502, 503, 505✓, 607, 803(M2) | width @375: 375px → 327px |
| 13 | Per-asset direct-download button | downloads | `article.press_release .search-results.media-box .…` | 1 | 🔵 | IN-PR | 502, 503, 607 | element absent @375: visible on source → missing on EDS main |
| 14 | Per-asset cart add and Original/1920px menu | press-kit-media | `article.press_release .search-results.media-box .…` | 1 | 📋 | NOT-BUILT | 502, 505✓, 505a, 505b, 607 | element absent @375: visible on source → missing on EDS main |
| 15 | Related press-release rail | carousel-rails | `article.press_release .cover-box.dark .search-res…` | 1 | 📋 | IMPORT-GAP | 201✓, 607, 803(M2) | height @375: 352px → 3905px |
| 16 | Floating share / social-intent controls | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | 607, 505✓, 824 | element absent @375: visible on source → missing on EDS main |
| 17 | Floating media-cart badge / scroll-top | page-float-dock | `a.media-cart-icon.media-cart-count, a.round-icon.…` | 1 | ❌ | NOT-BUILT | 505✓, 505b, 607, 824 | element absent @375: visible on source → missing on EDS main |

</details>

<details><summary><b>/en/press-releases/skoda-auto-and-national-theatre-extend-partnership-until-at-least-2029/</b> · press_release · MR · EDS PREVIEW · 18 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Media Room chrome (header and footer) | mr-side-chrome | `header.header, footer.footer` | 1 | 🟡 | DELTA | 305, 607, 825 | nav/footer variant @1280: News/Press Kits/Models/Images/Videos/Company/Škodapedia + Contacts/Subscribe/Compan… |
| 2 | Published date | template-press-release | `article.press_release .entry-published` | 1 | 🟡 | DELTA | 607 | date fontSize @375: 11px → 16px |
| 3 | Press release text title | template-press-release | `article.press_release h1.entry-title` | 1 | 🟡 | DELTA | 607 | width @375: 355px → 327px |
| 4 | Two-column article shell | template-press-release | `article.press_release .columns` | 1 | 📋 | NOT-BUILT | 607, 821 | height @375: 3124px → 3915px |
| 5 | Lead inline photo | card-teaser | `article.press_release .column-primary .article-te…` | 1 | 🟡 | DELTA | 607, 201✓ | width @375: 355px → 375px |
| 6 | Key-point bullets | template-press-release | `article.press_release .column-primary .bullet-poi…` | 1 | 🟡 | DELTA | 607, 803(M2) | width @375: 355px → 375px |
| 7 | Perex / lead summary | template-press-release | `article.press_release .column-primary .entry-summ…` | 1 | 🟡 | DELTA | 607, 803(M2) | perex width @375: 355px → 327px |
| 8 | Rich text body, inline subheadings and links | template-press-release | `article.press_release .column-primary .entry-cont…` | 1 | 🟡 | DELTA | 607, 803(M2), 821 | width @375: 355px → 375px |
| 9 | Buzzsprout AI-audio | embeds | `article.press_release .entry-content .embed-contr…` | 1 | 📋 | IMPORT-GAP | 204, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 10 | Additional info / media contacts / Download Media Box | downloads | `article.press_release .column-secondary > section…` | 1 | 📋 | IMPORT-GAP | 502, 505✓, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 11 | Sidebar Images preview / lightbox | gallery-lightbox | `article.press_release .column-secondary .images.s…` | 1 | 🟡 | DELTA | 203✓, 607, 803(M2) | width @375: 355px → 327px |
| 12 | Taxonomy tag chips | tags | `article.press_release .column-secondary ol.entry-…` | 1 | 🟡 | DELTA | 205✓, 607 | width @375: 355px → 327px |
| 13 | Media Box asset cards | downloads | `article.press_release .cover-box.dark .search-res…` | 1 | 🟡 | DELTA | 502, 503, 505✓, 607, 803(M2) | width @375: 375px → 327px |
| 14 | Per-asset direct-download button | downloads | `article.press_release .search-results.media-box .…` | 1 | 🔵 | IN-PR | 502, 503, 607 | element absent @375: visible on source → missing on EDS main |
| 15 | Per-asset cart add and Original/1920px menu | press-kit-media | `article.press_release .search-results.media-box .…` | 1 | 📋 | NOT-BUILT | 502, 505✓, 505a, 505b, 607 | element absent @375: visible on source → missing on EDS main |
| 16 | Related press-release rail | carousel-rails | `article.press_release .cover-box.dark .search-res…` | 1 | 📋 | IMPORT-GAP | 201✓, 607, 803(M2) | height @375: 320px → 1893px |
| 17 | Floating share / social-intent controls | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | 607, 505✓, 824 | element absent @375: visible on source → missing on EDS main |
| 18 | Floating media-cart badge / scroll-top | page-float-dock | `a.media-cart-icon.media-cart-count, a.round-icon.…` | 1 | ❌ | NOT-BUILT | 505✓, 505b, 607, 824 | element absent @375: visible on source → missing on EDS main |

</details>

<details><summary><b>/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence/</b> · press_release · MR · EDS PREVIEW · 17 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Media Room chrome (header and footer) | mr-side-chrome | `header.header, footer.footer` | 1 | 🟡 | DELTA | 305, 607, 825 | nav/footer variant @1280: News/Press Kits/Models/Images/Videos/Company/Škodapedia + Contacts/Subscribe/Compan… |
| 2 | Published date | template-press-release | `article.press_release .entry-published` | 1 | 🟡 | DELTA | 607 | date fontSize @375: 11px → 16px |
| 3 | Press release text title | template-press-release | `article.press_release h1.entry-title` | 1 | 🟡 | DELTA | 607 | width @375: 355px → 327px |
| 4 | Two-column article shell | template-press-release | `article.press_release .columns` | 1 | 📋 | NOT-BUILT | 607, 821 | height @375: 2748px → 3568px |
| 5 | Lead inline photo | card-teaser | `article.press_release .column-primary .article-te…` | 1 | 🟡 | DELTA | 607, 201✓ | width @375: 355px → 375px |
| 6 | Key-point bullets | template-press-release | `article.press_release .column-primary .bullet-poi…` | 1 | 🟡 | DELTA | 607, 803(M2) | width @375: 355px → 375px |
| 7 | Perex / lead summary | template-press-release | `article.press_release .column-primary .entry-summ…` | 1 | 🟡 | DELTA | 607, 803(M2) | perex width @375: 355px → 327px |
| 8 | Rich text body, inline subheadings and links | template-press-release | `article.press_release .column-primary .entry-cont…` | 1 | 🟡 | DELTA | 607, 803(M2), 821 | width @375: 355px → 375px |
| 9 | Buzzsprout AI-audio | embeds | `article.press_release .entry-content .embed-contr…` | 1 | 📋 | IMPORT-GAP | 204, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 10 | Additional info / media contacts / Download Media Box | downloads | `article.press_release .column-secondary > section…` | 1 | 📋 | IMPORT-GAP | 502, 505✓, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 11 | Sidebar Images preview / lightbox | gallery-lightbox | `article.press_release .column-secondary .images.s…` | 1 | 🟡 | DELTA | 203✓, 607, 803(M2) | width @375: 355px → 327px |
| 12 | Taxonomy tag chips | tags | `article.press_release .column-secondary ol.entry-…` | 1 | 🟡 | DELTA | 205✓, 607 | width @375: 355px → 327px |
| 13 | Media Box asset cards | downloads | `article.press_release .cover-box.dark .search-res…` | 1 | 🟡 | DELTA | 502, 503, 505✓, 607, 803(M2) | width @375: 375px → 327px |
| 14 | Per-asset direct-download button | downloads | `article.press_release .search-results.media-box .…` | 1 | 🔵 | IN-PR | 502, 503, 607 | element absent @375: visible on source → missing on EDS main |
| 15 | Per-asset cart add and Original/1920px menu | press-kit-media | `article.press_release .search-results.media-box .…` | 1 | 📋 | NOT-BUILT | 502, 505✓, 505a, 505b, 607 | element absent @375: visible on source → missing on EDS main |
| 16 | Floating share / social-intent controls | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | 607, 505✓, 824 | element absent @375: visible on source → missing on EDS main |
| 17 | Floating media-cart badge / scroll-top | page-float-dock | `a.media-cart-icon.media-cart-count, a.round-icon.…` | 1 | ❌ | NOT-BUILT | 505✓, 505b, 607, 824 | element absent @375: visible on source → missing on EDS main |

</details>

<details><summary><b>/en/press-releases/skoda-auto-announces-changes-to-its-board-of-management/</b> · press_release · MR · EDS PREVIEW · 18 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Media Room chrome (header and footer) | mr-side-chrome | `header.header, footer.footer` | 1 | 🟡 | DELTA | 305, 607, 825 | nav/footer variant @1280: News/Press Kits/Models/Images/Videos/Company/Škodapedia + Contacts/Subscribe/Compan… |
| 2 | Published date | template-press-release | `article.press_release .entry-published` | 1 | 🟡 | DELTA | 607 | date fontSize @375: 11px → 16px |
| 3 | Press release text title | template-press-release | `article.press_release h1.entry-title` | 1 | 🟡 | DELTA | 607 | width @375: 355px → 327px |
| 4 | Two-column article shell | template-press-release | `article.press_release .columns` | 1 | 📋 | NOT-BUILT | 607, 821 | height @375: 2368px → 3092px |
| 5 | Lead inline photo | card-teaser | `article.press_release .column-primary .article-te…` | 1 | 🟡 | DELTA | 607, 201✓ | width @375: 355px → 375px |
| 6 | Key-point bullets | template-press-release | `article.press_release .column-primary .bullet-poi…` | 1 | 🟡 | DELTA | 607, 803(M2) | width @375: 355px → 375px |
| 7 | Perex / lead summary | template-press-release | `article.press_release .column-primary .entry-summ…` | 1 | 🟡 | DELTA | 607, 803(M2) | perex width @375: 355px → 327px |
| 8 | Rich text body, inline subheadings and links | template-press-release | `article.press_release .column-primary .entry-cont…` | 1 | 🟡 | DELTA | 607, 803(M2), 821 | width @375: 355px → 375px |
| 9 | Buzzsprout AI-audio | embeds | `article.press_release .entry-content .embed-contr…` | 1 | 📋 | IMPORT-GAP | 204, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 10 | Additional info / media contacts / Download Media Box | downloads | `article.press_release .column-secondary > section…` | 1 | 📋 | IMPORT-GAP | 502, 505✓, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 11 | Sidebar Images preview / lightbox | gallery-lightbox | `article.press_release .column-secondary .images.s…` | 1 | 🟡 | DELTA | 203✓, 607, 803(M2) | width @375: 355px → 327px |
| 12 | Taxonomy tag chips | tags | `article.press_release .column-secondary ol.entry-…` | 1 | 🟡 | DELTA | 205✓, 607 | width @375: 355px → 327px |
| 13 | Media Box asset cards | downloads | `article.press_release .cover-box.dark .search-res…` | 1 | 🟡 | DELTA | 502, 503, 505✓, 607, 803(M2) | width @375: 375px → 327px |
| 14 | Per-asset direct-download button | downloads | `article.press_release .search-results.media-box .…` | 1 | 🔵 | IN-PR | 502, 503, 607 | element absent @375: visible on source → missing on EDS main |
| 15 | Per-asset cart add and Original/1920px menu | press-kit-media | `article.press_release .search-results.media-box .…` | 1 | 📋 | NOT-BUILT | 502, 505✓, 505a, 505b, 607 | element absent @375: visible on source → missing on EDS main |
| 16 | Related press-release rail | carousel-rails | `article.press_release .cover-box.dark .search-res…` | 1 | 📋 | IMPORT-GAP | 201✓, 607, 803(M2) | height @1280: 308px → 1310px |
| 17 | Floating share / social-intent controls | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | 607, 505✓, 824 | element absent @375: visible on source → missing on EDS main |
| 18 | Floating media-cart badge / scroll-top | page-float-dock | `a.media-cart-icon.media-cart-count, a.round-icon.…` | 1 | ❌ | NOT-BUILT | 505✓, 505b, 607, 824 | element absent @375: visible on source → missing on EDS main |

</details>

<details><summary><b>/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs/</b> · press_release · MR · EDS PREVIEW · 19 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Media Room chrome (header and footer) | mr-side-chrome | `header.header, footer.footer` | 1 | 🟡 | DELTA | 305, 607, 825 | nav/footer variant @1280: News/Press Kits/Models/Images/Videos/Company/Škodapedia + Contacts/Subscribe/Compan… |
| 2 | Published date | template-press-release | `article.press_release .entry-published` | 1 | 🟡 | DELTA | 607 | date fontSize @375: 11px → 16px |
| 3 | Press release text title | template-press-release | `article.press_release h1.entry-title` | 1 | 🟡 | DELTA | 607 | width @375: 355px → 327px |
| 4 | Two-column article shell | template-press-release | `article.press_release .columns` | 1 | 📋 | NOT-BUILT | 607, 821 | height @375: 2479px → 3194px |
| 5 | Lead inline photo | card-teaser | `article.press_release .column-primary .article-te…` | 1 | 🟡 | DELTA | 607, 201✓ | width @375: 355px → 375px |
| 6 | Key-point bullets | template-press-release | `article.press_release .column-primary .bullet-poi…` | 1 | 🟡 | DELTA | 607, 803(M2) | width @375: 355px → 375px |
| 7 | Perex / lead summary | template-press-release | `article.press_release .column-primary .entry-summ…` | 1 | 🟡 | DELTA | 607, 803(M2) | perex width @375: 355px → 327px |
| 8 | Rich text body, inline subheadings and links | template-press-release | `article.press_release .column-primary .entry-cont…` | 1 | 🟡 | DELTA | 607, 803(M2), 821 | width @375: 355px → 375px |
| 9 | Buzzsprout AI-audio | embeds | `article.press_release .entry-content .embed-contr…` | 1 | 📋 | IMPORT-GAP | 204, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 10 | Inline Vimeo video | embeds | `article.press_release .entry-content .video-conta…` | 1 | 📋 | IMPORT-GAP | 204, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 11 | Additional info / media contacts / Download Media Box | downloads | `article.press_release .column-secondary > section…` | 1 | 📋 | IMPORT-GAP | 502, 505✓, 607, 803(M2) | element absent @375: visible on source → missing on EDS main |
| 12 | Sidebar Images preview / lightbox | gallery-lightbox | `article.press_release .column-secondary .images.s…` | 1 | 🟡 | DELTA | 203✓, 607, 803(M2) | width @375: 355px → 327px |
| 13 | Taxonomy tag chips | tags | `article.press_release .column-secondary ol.entry-…` | 1 | 🟡 | DELTA | 205✓, 607 | width @375: 355px → 327px |
| 14 | Media Box asset cards | downloads | `article.press_release .cover-box.dark .search-res…` | 1 | 🟡 | DELTA | 502, 503, 505✓, 607, 803(M2) | width @375: 375px → 327px |
| 15 | Per-asset direct-download button | downloads | `article.press_release .search-results.media-box .…` | 1 | 🔵 | IN-PR | 502, 503, 607 | element absent @375: visible on source → missing on EDS main |
| 16 | Per-asset cart add and Original/1920px menu | press-kit-media | `article.press_release .search-results.media-box .…` | 1 | 📋 | NOT-BUILT | 502, 505✓, 505a, 505b, 607 | element absent @375: visible on source → missing on EDS main |
| 17 | Related press-release rail | carousel-rails | `article.press_release .cover-box.dark .search-res…` | 1 | 📋 | IMPORT-GAP | 201✓, 607, 803(M2) | height @375: 384px → 2264px |
| 18 | Floating share / social-intent controls | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | 607, 505✓, 824 | element absent @375: visible on source → missing on EDS main |
| 19 | Floating media-cart badge / scroll-top | page-float-dock | `a.media-cart-icon.media-cart-count, a.round-icon.…` | 1 | ❌ | NOT-BUILT | 505✓, 505b, 607, 824 | element absent @375: visible on source → missing on EDS main |

</details>

<details><summary><b>/en/skoda-model/new-superb/</b> · skoda_model · MR · EDS EDS-LOCAL · 17 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Model hero, image, Models chip and h1 | hero | `article.skoda_model > .carousel` | 1 | 🟡 | DELTA | 208, 202✓ | hero image: height @375: 272px → 380px |
| 2 | Icon model section navigation | model-nav | `.model-nav` | 1 | ⚠️ | NOT-BUILT | 208 | icon model nav: height @375: 0px → 376px |
| 3 | Model Description rich text | siteorigin-body | `#intro` | 1 | 🟡 | DELTA | 208, 814(M2) | model description: height @375: 519px → 459px |
| 4 | Highlights / Key Facts illustrated rows | model-keyfacts | `#keyfacts .so-widget-ys-so-widget-highlights` | 6 | 🟡 | DELTA | 208, 201✓ | key-facts body: height @375: 3987px → 2502px |
| 5 | Liftback and Combi technical drawings | siteorigin-body | `#keyfacts h3#liftback, #keyfacts h3#combi` | 2 | 🟡 | DELTA | 208, 203✓ | bodywork drawings heading: fontSize @375: 24px → 26px |
| 6 | Technical Data specification table | model-techdata | `#techdata .so-widget-ys-so-widget-techdata` | 1 | 📋 | NOT-BUILT | 208 | technical data: height @375: 817px → 552px |
| 7 | Download PDF from Technical Data | model-techdata | `#techdata a[href*=".pdf"]` | 1 | 🟡 | DELTA | 208 | technical data: height @375: 817px → 552px |
| 8 | Bodywork / Derivatives related-content rail | carousel-rails | `#derivatives .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | derivatives rail: height @375: 300px → 33px |
| 9 | News related-content rail | carousel-rails | `#news .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | news rail: height @375: 287px → 167px |
| 10 | Press Kits related-content rail | carousel-rails | `#press-kits .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | press-kits rail: height @375: 287px → 167px |
| 11 | Stories related-content rail | carousel-rails | `#stories .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | stories rail: height @375: 287px → 167px |
| 12 | Images related-content rail | carousel-rails | `#images .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | images rail: height @375: 427px → 167px |
| 13 | Image thumbnail lightbox and media-cart toolbar | gallery-lightbox | `#images .search-results-item a.file-type.colorbox` | 20 | 📋 | CONTENT-BLOCKED | 203✓, 201✓, 208, 505✓, 608 | images rail: height @375: 427px → 167px |
| 14 | Videos related-content rail | carousel-rails | `#videos .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | videos rail: height @375: 427px → 167px |
| 15 | Video thumbnail, Vimeo player and media toolbar | embeds | `#videos .search-results-item a.file-type.colorbox` | 20 | 📋 | CONTENT-BLOCKED | 204, 208, 505✓, 608 | videos rail: height @375: 427px → 167px |
| 16 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 17 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-model/octavia/</b> · skoda_model · MR · EDS EDS-LOCAL · 17 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Model hero, image, Models chip and h1 | hero | `article.skoda_model > .carousel` | 1 | 🟡 | DELTA | 208, 202✓ | hero image: height @375: 272px → 380px |
| 2 | Icon model section navigation | model-nav | `.model-nav` | 1 | ⚠️ | NOT-BUILT | 208 | icon model nav: height @375: 0px → 376px |
| 3 | Model Description rich text | siteorigin-body | `#intro` | 1 | 🟡 | DELTA | 208, 814(M2) | model description: height @375: 495px → 435px |
| 4 | Highlights / Key Facts illustrated rows | model-keyfacts | `#keyfacts .so-widget-ys-so-widget-highlights` | 5 | 🟡 | DELTA | 208, 201✓ | key-facts body: height @375: 3398px → 2183px |
| 5 | Liftback and Combi technical drawings | siteorigin-body | `#keyfacts h3#liftback, #keyfacts h3#combi` | 2 | 🟡 | DELTA | 208, 203✓ | bodywork drawings heading: fontSize @375: 24px → 26px |
| 6 | Technical Data specification table | model-techdata | `#techdata .so-widget-ys-so-widget-techdata` | 1 | 📋 | NOT-BUILT | 208 | technical data: height @375: 817px → 552px |
| 7 | Download PDF from Technical Data | model-techdata | `#techdata a[href*=".pdf"]` | 1 | 🟡 | DELTA | 208 | technical data: height @375: 817px → 552px |
| 8 | Bodywork / Derivatives related-content rail | carousel-rails | `#derivatives .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | derivatives rail: height @375: 300px → 33px |
| 9 | News related-content rail | carousel-rails | `#news .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | news rail: height @375: 287px → 167px |
| 10 | Press Kits related-content rail | carousel-rails | `#press-kits .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | press-kits rail: height @375: 287px → 167px |
| 11 | Stories related-content rail | carousel-rails | `#stories .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | stories rail: height @375: 287px → 167px |
| 12 | Images related-content rail | carousel-rails | `#images .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | images rail: height @375: 427px → 167px |
| 13 | Image thumbnail lightbox and media-cart toolbar | gallery-lightbox | `#images .search-results-item a.file-type.colorbox` | 20 | 📋 | CONTENT-BLOCKED | 203✓, 201✓, 208, 505✓, 608 | images rail: height @375: 427px → 167px |
| 14 | Videos related-content rail | carousel-rails | `#videos .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | videos rail: height @375: 427px → 167px |
| 15 | Video thumbnail, Vimeo player and media toolbar | embeds | `#videos .search-results-item a.file-type.colorbox` | 20 | 📋 | CONTENT-BLOCKED | 204, 208, 505✓, 608 | videos rail: height @375: 427px → 167px |
| 16 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 17 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-model/epiq/</b> · skoda_model · MR · EDS EDS-LOCAL · 12 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Model hero, image, Models chip and h1 | hero | `article.skoda_model > .carousel` | 1 | 🟡 | DELTA | 208, 202✓ | hero image: height @375: 272px → 380px |
| 2 | Icon model section navigation | model-nav | `.model-nav` | 1 | ⚠️ | NOT-BUILT | 208 | icon model nav: height @375: 0px → 332px |
| 3 | Model Description rich text | siteorigin-body | `.entry-content .panel-grid` | 1 | 📋 | IMPORT-GAP | 208, 814(M2) | model description: height @375: 469px → 691px |
| 4 | News related-content rail | carousel-rails | `#news .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | news rail: height @375: 287px → 167px |
| 5 | Press Kits related-content rail | carousel-rails | `#press-kits .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | press-kits rail: height @375: 287px → 167px |
| 6 | Stories related-content rail | carousel-rails | `#stories .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | stories rail: height @375: 287px → 167px |
| 7 | Images related-content rail | carousel-rails | `#images .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | images rail: height @375: 427px → 167px |
| 8 | Image thumbnail lightbox and media-cart toolbar | gallery-lightbox | `#images .search-results-item a.file-type.colorbox` | 20 | 📋 | CONTENT-BLOCKED | 203✓, 201✓, 208, 505✓, 608 | images rail: height @375: 427px → 167px |
| 9 | Videos related-content rail | carousel-rails | `#videos .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | videos rail: height @375: 427px → 167px |
| 10 | Video thumbnail, Vimeo player and media toolbar | embeds | `#videos .search-results-item a.file-type.colorbox` | 9 | 📋 | CONTENT-BLOCKED | 204, 208, 505✓, 608 | videos rail: height @375: 427px → 167px |
| 11 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 12 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-model/peaq/</b> · skoda_model · MR · EDS EDS-LOCAL · 12 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Model hero, image, Models chip and h1 | hero | `article.skoda_model > .carousel` | 1 | 🟡 | DELTA | 208, 202✓ | hero image: height @375: 272px → 380px |
| 2 | Icon model section navigation | model-nav | `.model-nav` | 1 | ⚠️ | NOT-BUILT | 208 | icon model nav: height @375: 0px → 332px |
| 3 | Model Description rich text | siteorigin-body | `.entry-content .panel-grid` | 1 | 📋 | IMPORT-GAP | 208, 814(M2) | model description: height @375: 637px → 883px |
| 4 | News related-content rail | carousel-rails | `#news .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | news rail: height @375: 287px → 167px |
| 5 | Press Kits related-content rail | carousel-rails | `#press-kits .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | press-kits rail: height @375: 287px → 167px |
| 6 | Stories related-content rail | carousel-rails | `#stories .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | stories rail: height @375: 287px → 167px |
| 7 | Images related-content rail | carousel-rails | `#images .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | images rail: height @375: 427px → 167px |
| 8 | Image thumbnail lightbox and media-cart toolbar | gallery-lightbox | `#images .search-results-item a.file-type.colorbox` | 20 | 📋 | CONTENT-BLOCKED | 203✓, 201✓, 208, 505✓, 608 | images rail: height @375: 427px → 167px |
| 9 | Videos related-content rail | carousel-rails | `#videos .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | videos rail: height @375: 427px → 167px |
| 10 | Video thumbnail, Vimeo player and media toolbar | embeds | `#videos .search-results-item a.file-type.colorbox` | 13 | 📋 | CONTENT-BLOCKED | 204, 208, 505✓, 608 | videos rail: height @375: 427px → 167px |
| 11 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 12 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/skoda-model/new-fabia/</b> · skoda_model · MR · EDS EDS-LOCAL · 13 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Model hero, image, Models chip and h1 | hero | `article.skoda_model > .carousel` | 1 | 🟡 | DELTA | 208, 202✓ | hero image: height @375: 272px → 380px |
| 2 | Icon model section navigation | model-nav | `.model-nav` | 1 | ⚠️ | NOT-BUILT | 208 | icon model nav: height @375: 0px → 332px |
| 3 | Model Description rich text | siteorigin-body | `#intro` | 1 | 🟡 | DELTA | 208, 814(M2) | model description: height @375: 423px → 363px |
| 4 | Highlights / Key Facts illustrated rows | model-keyfacts | `#keyfacts .so-widget-ys-so-widget-highlights` | 5 | 🟡 | DELTA | 208, 201✓ | key-facts body: height @375: 3446px → 2246px |
| 5 | Technical Data specification table | model-techdata | `#techdata .so-widget-ys-so-widget-techdata` | 1 | 📋 | NOT-BUILT | 208 | technical data: height @375: 1026px → 552px |
| 6 | Download PDF from Technical Data | model-techdata | `#techdata a[href*=".pdf"]` | 1 | 🟡 | DELTA | 208 | technical data: height @375: 1026px → 552px |
| 7 | Press Kits related-content rail | carousel-rails | `#press-kits .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603 | press-kits rail: height @375: 287px → 167px |
| 8 | Images related-content rail | carousel-rails | `#images .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | images rail: height @375: 427px → 167px |
| 9 | Image thumbnail lightbox and media-cart toolbar | gallery-lightbox | `#images .search-results-item a.file-type.colorbox` | 20 | 📋 | CONTENT-BLOCKED | 203✓, 201✓, 208, 505✓, 608 | images rail: height @375: 427px → 167px |
| 10 | Videos related-content rail | carousel-rails | `#videos .search-results-container` | 1 | ⚠️ | IMPORT-GAP | 208, 212✓, 201✓, 603, 608 | videos rail: height @375: 427px → 167px |
| 11 | Video thumbnail, Vimeo player and media toolbar | embeds | `#videos .search-results-item a.file-type.colorbox` | 20 | 📋 | CONTENT-BLOCKED | 204, 208, 505✓, 608 | videos rail: height @375: 427px → 167px |
| 12 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 13 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/series/125-years-of-motorsport/</b> · single-skoda_series · STO · EDS EDS-LOCAL · 7 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Full-bleed series hero image and scrim | hero | `article.skoda_series > .hero .hero-image` | 1 | ⚠️ | DELTA | 202✓, 207 | hero: height @375: 577px → 380px |
| 2 | Series name (H1) | hero | `article.skoda_series > .hero .hero-caption h1.hea…` | 1 | ⚠️ | DELTA | 202✓, 207 | hero title: width @375: 355px → 327px |
| 3 | SERIES category badge | hero | `article.skoda_series > .hero .hero-caption .label` | 1 | ⚠️ | IMPORT-GAP | 207, 202✓ | SERIES badge: (element) @375: present x1 → MISSING on EDS |
| 4 | Series standfirst / intro in hero caption | hero | `article.skoda_series > .hero .hero-caption p.perex` | 1 | 🟡 | DELTA | 202✓, 207 | hero standfirst: fontSize @375: 20px → 16px |
| 5 | Curated story/press-kit mosaic tiles | series-mosaic | `article.skoda_series > .content .panel-grid > .pa…` | 8 | ⚠️ | IMPORT-GAP | 207, 201✓, 402✓, 603 | story tile: width @375: 355px → 327px |
| 6 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 7 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/series/130-years/</b> · single-skoda_series · STO · EDS EDS-LOCAL · 7 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Full-bleed series hero image and scrim | hero | `article.skoda_series > .hero .hero-image` | 1 | ⚠️ | DELTA | 202✓, 207 | hero: height @375: 494px → 380px |
| 2 | Series name (H1) | hero | `article.skoda_series > .hero .hero-caption h1.hea…` | 1 | ⚠️ | DELTA | 202✓, 207 | hero title: width @375: 355px → 327px |
| 3 | SERIES category badge | hero | `article.skoda_series > .hero .hero-caption .label` | 1 | ⚠️ | IMPORT-GAP | 207, 202✓ | SERIES badge: (element) @375: present x1 → MISSING on EDS |
| 4 | Series standfirst / intro in hero caption | hero | `article.skoda_series > .hero .hero-caption p.perex` | 1 | 🟡 | DELTA | 202✓, 207 | hero standfirst: fontSize @375: 20px → 16px |
| 5 | Curated story/press-kit mosaic tiles | series-mosaic | `article.skoda_series > .content .panel-grid > .pa…` | 14 | ⚠️ | IMPORT-GAP | 207, 201✓, 402✓, 603 | story tile: width @375: 355px → 327px |
| 6 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 7 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/series/roads-places/</b> · single-skoda_series · STO · EDS EDS-LOCAL · 7 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Full-bleed series hero image and scrim | hero | `article.skoda_series > .hero .hero-image` | 1 | ⚠️ | DELTA | 202✓, 207 | hero: height @375: 494px → 380px |
| 2 | Series name (H1) | hero | `article.skoda_series > .hero .hero-caption h1.hea…` | 1 | ⚠️ | DELTA | 202✓, 207 | hero title: width @375: 355px → 327px |
| 3 | SERIES category badge | hero | `article.skoda_series > .hero .hero-caption .label` | 1 | ⚠️ | IMPORT-GAP | 207, 202✓ | SERIES badge: (element) @375: present x1 → MISSING on EDS |
| 4 | Series standfirst / intro in hero caption | hero | `article.skoda_series > .hero .hero-caption p.perex` | 1 | 🟡 | DELTA | 202✓, 207 | hero standfirst: fontSize @375: 20px → 16px |
| 5 | Curated story/press-kit mosaic tiles | series-mosaic | `article.skoda_series > .content .panel-grid > .pa…` | 10 | ⚠️ | IMPORT-GAP | 207, 201✓, 402✓, 603 | story tile: width @375: 355px → 327px |
| 6 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 7 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/series/unexpected-jobs/</b> · single-skoda_series · STO · EDS EDS-LOCAL · 7 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Full-bleed series hero image and scrim | hero | `article.skoda_series > .hero .hero-image` | 1 | ⚠️ | DELTA | 202✓, 207 | hero: height @375: 584px → 400px |
| 2 | Series name (H1) | hero | `article.skoda_series > .hero .hero-caption h1.hea…` | 1 | ⚠️ | DELTA | 202✓, 207 | hero title: width @375: 355px → 327px |
| 3 | SERIES category badge | hero | `article.skoda_series > .hero .hero-caption .label` | 1 | ⚠️ | IMPORT-GAP | 207, 202✓ | SERIES badge: (element) @375: present x1 → MISSING on EDS |
| 4 | Series standfirst / intro in hero caption | hero | `article.skoda_series > .hero .hero-caption p.perex` | 1 | 🟡 | DELTA | 202✓, 207 | hero standfirst: fontSize @375: 20px → 16px |
| 5 | Curated story/press-kit mosaic tiles | series-mosaic | `article.skoda_series > .content .panel-grid > .pa…` | 5 | ⚠️ | IMPORT-GAP | 207, 201✓, 402✓, 603 | story tile: width @375: 355px → 327px |
| 6 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 7 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/series/minutes-from-car-production/</b> · single-skoda_series · STO · EDS EDS-LOCAL · 7 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Full-bleed series hero image and scrim | hero | `article.skoda_series > .hero .hero-image` | 1 | ⚠️ | DELTA | 202✓, 207 | hero: height @375: 637px → 400px |
| 2 | Series name (H1) | hero | `article.skoda_series > .hero .hero-caption h1.hea…` | 1 | ⚠️ | DELTA | 202✓, 207 | hero title: width @375: 355px → 327px |
| 3 | SERIES category badge | hero | `article.skoda_series > .hero .hero-caption .label` | 1 | ⚠️ | IMPORT-GAP | 207, 202✓ | SERIES badge: (element) @375: present x1 → MISSING on EDS |
| 4 | Series standfirst / intro in hero caption | hero | `article.skoda_series > .hero .hero-caption p.perex` | 1 | 🟡 | DELTA | 202✓, 207 | hero standfirst: fontSize @375: 20px → 16px |
| 5 | Curated story/press-kit mosaic tiles | series-mosaic | `article.skoda_series > .content .panel-grid > .pa…` | 12 | ⚠️ | IMPORT-GAP | 207, 201✓, 402✓, 603 | story tile: width @375: 355px → 327px |
| 6 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 7 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/press-kits/skoda-peaq-press-kit-2/</b> · press_kit-template-template-tiles · MR · EDS NOT-IMPORTED · 11 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Overlay hero image | hero | `article.press_kit > .hero > .hero-image` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 805a | hero image box.w @375: 375 → 327 |
| 2 | Hero heading | hero | `.hero-caption h1.heading` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 805a | hero title style.color @375: rgb(22, 23, 24) → rgb(255, 255, 255) |
| 3 | Hero standfirst / perex | hero | `.hero-caption p.perex` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 805a | hero image box.w @375: 375 → 327 |
| 4 | Core narrative chapter cards | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 6 | 📋 | CONTENT-BLOCKED | 805a, 805b, 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 5 | Model-variant chapter card | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 1 | 📋 | CONTENT-BLOCKED | 805a, 808(M2), 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 6 | FAQ chapter card | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 1 | 📋 | CONTENT-BLOCKED | 805a, 807(M2), 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 7 | Media resource cards | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 5 | 📋 | CONTENT-BLOCKED | 805a, 805b, 806(M2), 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 8 | WhatsApp linked image promo | press-kit-media | `.content .so-widget-sow-editor a[href*=whatsapp]` | 1 | ⚠️ | CONTENT-BLOCKED | 805a, 609 | source region width vs nearest EDS fixture (proxy only) @768: 748×374px → 348×360px |
| 9 | Whole-kit direct ZIP image CTA | press-kit-media | `.content .so-widget-sow-editor a[href*=".zip"]` | 1 | ⚠️ | CONTENT-BLOCKED | 805a, 806(M2) | missing imported press-kit content @1280: source graphical CTA/files/sidebar list visible → press-kit EDS URL… |
| 10 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 11 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/press-kits/skoda-epiq-press-kit-2/</b> · press_kit-template-template-tiles · MR · EDS NOT-IMPORTED · 11 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Overlay hero image | hero | `article.press_kit > .hero > .hero-image` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 805a | hero image box.w @375: 375 → 327 |
| 2 | Hero heading | hero | `.hero-caption h1.heading` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 805a | hero title style.color @375: rgb(22, 23, 24) → rgb(255, 255, 255) |
| 3 | Hero standfirst / perex | hero | `.hero-caption p.perex` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 805a | hero image box.w @375: 375 → 327 |
| 4 | Core narrative chapter cards | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 6 | 📋 | CONTENT-BLOCKED | 805a, 805b, 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 5 | Model-variant chapter card | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 1 | 📋 | CONTENT-BLOCKED | 805a, 808(M2), 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 6 | FAQ chapter card | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 1 | 📋 | CONTENT-BLOCKED | 805a, 807(M2), 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 7 | Media resource cards | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 5 | 📋 | CONTENT-BLOCKED | 805a, 805b, 806(M2), 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 8 | WhatsApp linked image promo | press-kit-media | `.content .so-widget-sow-editor a[href*=whatsapp]` | 1 | ⚠️ | CONTENT-BLOCKED | 805a, 609 | source region width vs nearest EDS fixture (proxy only) @768: 748×374px → 348×360px |
| 9 | Whole-kit direct ZIP image CTA | press-kit-media | `.content .so-widget-sow-editor a[href*=".zip"]` | 1 | ⚠️ | CONTENT-BLOCKED | 805a, 806(M2) | missing imported press-kit content @1280: source graphical CTA/files/sidebar list visible → press-kit EDS URL… |
| 10 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 11 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/press-kits/125-years-of-skoda-motorsport-press-kit/</b> · press_kit-template-template-tiles · MR · EDS NOT-IMPORTED · 7 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Overlay hero image | hero | `article.press_kit > .hero > .hero-image` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 805a | hero image box.w @375: 375 → 327 |
| 2 | Hero heading | hero | `.hero-caption h1.heading` | 1 | 📋 | CONTENT-BLOCKED | 202✓, 805a | hero title style.color @375: rgb(22, 23, 24) → rgb(255, 255, 255) |
| 3 | Historical chapter cards | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 20 | 📋 | CONTENT-BLOCKED | 805a, 805b, 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 4 | Cross-kit card | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 1 | 📋 | CONTENT-BLOCKED | 805a, 609, 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 5 | Media resource cards | card-teaser | `.content .panel-grid .so-widget-ys-so-widget-post…` | 3 | 📋 | CONTENT-BLOCKED | 805a, 805b, 806(M2), 201✓ | chapter tile 1 box.w @375: 355 → 327 |
| 6 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 7 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship/</b> · press_kit-template-default · MR · EDS NOT-IMPORTED · 22 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Published date | press-kit-template | `article.press_kit > header .entry-published` | 1 | 📋 | CONTENT-BLOCKED | 805c | missing imported press-kit content @1280: rendered at source URL → EDS press-kit URL HTTP 404; only fixture p… |
| 2 | Article h1, no overlay hero | press-kit-template | `article.press_kit > header h1.entry-title` | 1 | 📋 | CONTENT-BLOCKED | 805c, 607 | article title style.fontSize @375: 28px → 44px |
| 3 | Lead article image | card-teaser | `.column-primary > .article-teaser.promo-box-item` | 1 | 📋 | CONTENT-BLOCKED | 805c, 201✓ | source region width vs nearest EDS fixture (proxy only) @768: 492×277px → 720×364px |
| 4 | Opening prose and bullet list | press-kit-template | `.column-primary .entry-content #pg-436389-0` | 1 | 📋 | CONTENT-BLOCKED | 805c, 607 | article reading column vs PR proxy box.w @768: 512 → 768 |
| 5 | Two-up illustrated introductory figures | press-kit-media | `#pg-436389-1 .panel-grid-cell` | 2 | 📋 | CONTENT-BLOCKED | 805c, 502 | sidebar images vs gallery proxy box.w @375: 355 → 327 |
| 6 | Three PDF/JPG paired file downloads | downloads | `.entry-content a[href*="/direct-download/"]` | 6 | 📋 | CONTENT-BLOCKED | 805c, 502 | missing imported press-kit content @1280: source graphical CTA/files/sidebar list visible → press-kit EDS URL… |
| 7 | Eight topical row-toggle disclosures | faq-accordion | `.entry-content .so-panel.widget_ys-row-toggle` | 8 | 📋 | NOT-BUILT | 805c, 807(M2) | missing feature @1280: 8 source instances → no equivalent rendered on main |
| 8 | Footnotes and external charging link | press-kit-template | `#pg-436389-10` | 1 | 📋 | CONTENT-BLOCKED | 805c | source region width vs nearest EDS fixture (proxy only) @768: 492×4193px → 768×1964px |
| 9 | Inline Vimeo player | embeds | `#pg-436389-11 iframe[src*="vimeo"]` | 1 | 🔵 | IN-PR | 204, 805c | Vimeo vs PR embed proxy box.w @375: 355 → 327 |
| 10 | Inline video cart/download/permalink toolbar | media-cart | `#pg-436389-11 .media-cart-actions` | 1 | 📋 | NOT-BUILT | 505a, 505b, 805c | missing feature @1280: 1 source instances → no equivalent rendered on main |
| 11 | WhatsApp editorial text callout | press-kit-template | `#pg-436389-12` | 1 | 📋 | CONTENT-BLOCKED | 805c | source region width vs nearest EDS fixture (proxy only) @768: 492×4193px → 768×1964px |
| 12 | PDF-download and mail-share image banners | press-kit-media | `#pg-436389-13 .panel-grid-cell` | 2 | ⚠️ | CONTENT-BLOCKED | 805c, 609 | source region width vs nearest EDS fixture (proxy only) @768: 512×190px → 768×1964px |
| 13 | Media contact cards | press-kit-template | `#pg-436389-14 .panel-grid-cell` | 2 | 📋 | CONTENT-BLOCKED | 805c, 607 | source region width vs nearest EDS fixture (proxy only) @768: 512×136px → 768×1964px |
| 14 | Additional-info sidebar menu | press-kit-template | `.column-secondary > section:first-child` | 1 | 📋 | CONTENT-BLOCKED | 805c, 607 | missing imported press-kit content @1280: source graphical CTA/files/sidebar list visible → press-kit EDS URL… |
| 15 | Sidebar Images teaser with +51 | gallery-lightbox | `.column-secondary .sa-media-kit-preview` | 1 | ⚠️ | CONTENT-BLOCKED | 805c, 502, 216 | sidebar images vs gallery proxy box.w @375: 355 → 327 |
| 16 | Sidebar tag chips | tags | `.column-secondary section.tags ol.entry-tags.tag-…` | 10 | 📋 | CONTENT-BLOCKED | 205✓, 805c | tag list vs PR proxy box.w @375: 355 → 327 |
| 17 | Dark Media Box heading and asset stats | downloads | `.cover-box.dark .search-results.media-box` | 1 | 📋 | CONTENT-BLOCKED | 805c, 502, 506 | media box vs listing proxy box.w @375: 375 → 327 |
| 18 | Media Box asset thumbnails and downloads | downloads | `.media-box .search-results-item` | 60 | 🔵 | IN-PR | 502, 506, 805c | media box vs PR downloads proxy box.w @375: 375 → 327 |
| 19 | Media Box add-to-cart size menus | media-cart | `.media-box .search-results-item .media-cart-actio…` | 60 | 📋 | NOT-BUILT | 505a, 505b, 805c | missing feature @1280: 60 source instances → no equivalent rendered on main |
| 20 | Media Box Show more / Show less | downloads | `.media-box .togglebox-opener` | 1 | 📋 | NOT-BUILT | 805c, 506 | missing feature @1280: 1 source instances → no equivalent rendered on main |
| 21 | Floating share expander (architect census) | page-float-dock | `div.sticky-buttons > div.sticky-button` | 1 | ❌ | NOT-BUILT | 824 |  |
| 22 | Floating scroll-to-top (architect census) | page-float-dock | `div.sticky-buttons > .round-icon` | 1 | ❌ | NOT-BUILT | 824 |  |

</details>

<details><summary><b>/en/</b> · template-homepage · STO · EDS PREVIEW · 25 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | Header topbar and section switcher | header-megamenu | `header.header > .topbar` | 1 | 🟡 | DELTA | 301✓ | switcher font-size @375: 16px → 14px |
| 2 | Topbar Subscribe to our stories | newsletter | `.topbar__newsletter` | 1 | 🟡 | DELTA | 301✓, 704 |  |
| 3 | Škoda Storyboard wordmark | header-megamenu | `header.header a.logo` | 1 | 🟡 | DELTA | 301✓ | anchor width @1280: 256px → 194px |
| 4 | Desktop primary navigation and Models mega-menu | header-megamenu | `header.header nav.topnav` | 1 | 🟡 | DELTA | 301✓ |  |
| 5 | Mobile hamburger and submenu drawer | mobile-nav | `header.header button.menu-toggle` | 1 | 🟡 | DELTA | 302 | button aria-expanded / document scroll-lock @375: EDS target button aria-expanded=true; overflow:hidden → but… |
| 6 | Locale links | language-switcher | `header.header .lang-links` | 2 | ⚠️ | DELTA | 303 | per-document language availability @1280: six on home; four on MR press article → six on both; no EDS alterna… |
| 7 | Header search trigger and live suggestions | header-megamenu | `header.header .search-bar` | 1 | 🔵⚠️ | IN-PR | 403 | search trigger width @1280: 48px → 24px |
| 8 | Featured promo-box: three stories | promo-box | `main.main section.promo-box` | 1 | 🔵 | IN-PR | 213 | mosaic outer width @1280: 1280px → 1248px |
| 9 | Latest Stories five-card feed | stories | `.cover-box .latest-articles` | 1 | 🟡 | DELTA | 214✓, 201✓ | feed height @1280: 779px → 718px |
| 10 | Latest Stories Load more | stories | `.latest-articles .ajax-loader-button` | 1 | 🟡 | DELTA | 214✓ |  |
| 11 | Social media dark section | home-social | `.cover-box.dark.socials-static` | 1 | 📋 | NOT-BUILT | 218 | entire social section @1280: 1280×373 dark band → missing |
| 12 | Three social profile cards | home-social | `.socials-static .search-results-item` | 3 | 📋 | NOT-BUILT | 217 |  |
| 13 | Models horizontal rail | carousel-rails | `.cover-box .search-results.type-skoda_model` | 1 | 📋 | CONTENT-BLOCKED | 212✓, 401✓ | rail height @1280: 308px → 212px; one card |
| 14 | eMobility rail | carousel-rails | `.cover-box .search-results.type-post` | 1 | 🟡 | DELTA | 212✓, 401✓ | rail height @1280: 319px → 212px |
| 15 | Lifestyle rail | carousel-rails | `.cover-box .search-results.type-post` | 1 | 🟡 | DELTA | 212✓, 401✓ | rail height @1280: 319px → 212px |
| 16 | Škoda World rail | carousel-rails | `.cover-box .search-results.type-post` | 1 | 🟡 | DELTA | 212✓, 401✓ | rail height @1280: 319px → 212px |
| 17 | Series dark horizontal rail | carousel-rails | `.cover-box.dark .search-results.type-skoda_series` | 1 | 📋 | CONTENT-BLOCKED | 212✓, 218, 207 | Series section height @1280: 424px dark rail → 33px empty heading, no band |
| 18 | Latest News rail | carousel-rails | `.cover-box .search-results.type-press_release` | 1 | 🟡 | DELTA | 212✓, 401✓ | rail height @1280: 319px → 212px |
| 19 | STO footer app badges and social profiles | footer | `footer.footer .footer-widgets` | 1 | 🟡 | DELTA | 304✓, 306 | footer height @1280: 830px → 842px |
| 20 | STO footer navigation sitemap | footer | `footer.footer .footer-nav` | 1 | 🟡 | DELTA | 304✓, 306 |  |
| 21 | STO copyright / legal / RSS strip | footer | `footer .copyright-text` | 1 | 🟡 | DELTA | 304✓, 306 | usage font-size @375: 16px → 12px |
| 22 | Floating social-share expander | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | 304✓, 824 |  |
| 23 | Floating media-cart badge/count | media-cart | `a.media-cart-icon.media-cart-count.round-icon` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 24 | Floating scroll-to-top button | page-float-dock | `a.round-icon.scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 304✓, 824 |  |
| 25 | OneTrust banner and Manage cookies | cookie-consent | `#ot-sdk-btn` | 1 | 📋 | NOT-BUILT | 704, 804(M2) |  |

</details>

<details><summary><b>/en/images/</b> · template-search-results · MR · EDS EDS-LOCAL · 25 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | MR topbar and section switcher | header-megamenu | `header.header > .topbar` | 1 | ⚠️ | DELTA | 301✓, 305, 825 | MR nav fragment @1280: News / Press Kits / Models / Images / Videos / Company / Škodapedia → STO nav fragment |
| 2 | MR desktop navigation/Models and Company menus | header-megamenu | `nav.topnav` | 1 | ⚠️ | DELTA | 301✓, 305, 825 | menu content @1280: News, Press Kits, Models, Images, Videos, Company, Škodapedia → Models, eMobility, Lifest… |
| 3 | MR wordmark | header-megamenu | `a.logo` | 1 | 🟡 | DELTA | 301✓, 825 | logo anchor width @1280: 256px → 194px |
| 4 | MR mobile hamburger/drawer | mobile-nav | `button.menu-toggle` | 1 | 🟡 | DELTA | 302, 825 | button aria-expanded and scroll-lock @992: button reflects open state, lock html → aria-expanded absent; html… |
| 5 | MR locale links | language-switcher | `.lang-links` | 2 | ⚠️ | DELTA | 303, 825 | translation-aware link availability @1280: six on Images but four on MR press release → six on every page |
| 6 | MR header search/suggestions | header-megamenu | `.search-bar` | 1 | 🔵⚠️ | IN-PR | 403, 825 | trigger width @1280: 48px → 24px |
| 7 | Advanced filter facet groups | faceted-listing | `form.search-filter` | 1 | ⚠️ | CONTENT-BLOCKED | 401✓, 402✓, 608 | available facet options @1280: 15 pill groups (source source DOM, initially collapsed) → zero options with em… |
| 8 | Advanced filter trigger and Newest/Oldest sort | faceted-listing | `ul.sort-options-list` | 1 | 🟡 | DELTA | 402✓ | sort row height @1280: 35px → 21px |
| 9 | 80-photo package-limit notice | media-cart | `.media-cart-limit-banner` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 10 | Image listing result grid | faceted-listing | `.search-results-items` | 1 | ⚠️ | CONTENT-BLOCKED | 402✓, 608 | result grid @1280: 12 cards, four columns → No results — clear filters to see all items |
| 11 | Image card image/date/title/toolbar | card-teaser | `.search-results-item > article.article-teaser.ima…` | 12 | 📋 | CONTENT-BLOCKED | 201✓, 402✓, 608 | first card @1280: 12 JPG teaser cards → zero |
| 12 | Colorbox image lightbox | gallery-lightbox | `.search-results-item .file-type.colorbox` | 12 | ⚠️ | NOT-BUILT | 203✓, 608 |  |
| 13 | Image add-to-cart tile toolbar | media-cart | `.search-results-item .media-cart-action-multi:not…` | 12 | 📋 | NOT-BUILT | 505a, 505b |  |
| 14 | Image original / 1920px JPG download menu | media-cart | `.search-results-item .media-cart-action-multi.dow…` | 12 | 📋 | NOT-BUILT | 503, 505a, 505b |  |
| 15 | Result count | faceted-listing | `.search-results-pagination` | 1 | 📋 | CONTENT-BLOCKED | 402✓, 608 | result count @1280: 12 / 33448 → 0 / 0 |
| 16 | Load more image assets | faceted-listing | `button.ajax-loader-button` | 1 | ⚠️ | CONTENT-BLOCKED | 402✓, 608 | load-more control @1280: visible, 12 cards → missing, zero cards |
| 17 | MR footer badges and social links | footer-mediaroom | `footer.footer .footer-widgets` | 2 | ⚠️ | DELTA | 305, 306, 825 | footer height/content @1280: 706px MR variant → 842px STO variant |
| 18 | MR footer Contacts links | footer-mediaroom | `footer .widget_nav_menu` | 1 | 📋 | NOT-BUILT | 305, 825 |  |
| 19 | MR footer Subscribe/consent form | newsletter | `footer .skoda-mailguide` | 1 | 📋 | NOT-BUILT | 305, 704 |  |
| 20 | MR footer Company/annual report | footer-mediaroom | `footer .widget_text` | 1 | 📋 | NOT-BUILT | 305, 503, 825 |  |
| 21 | MR-specific copyright/legal/feed bar | footer-mediaroom | `footer .copyright-text` | 1 | 🟡 | DELTA | 305, 306, 825 | footer variant @1280: MR usage wording + RSS target=_blank → STO usage text; RSS target empty |
| 22 | Floating share expander | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | 304✓, 824 |  |
| 23 | Floating media-cart count | media-cart | `a.media-cart-icon.media-cart-count` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 24 | Floating scroll-top | page-float-dock | `a.round-icon.scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 304✓, 824 |  |
| 25 | OneTrust consent and Manage cookies | cookie-consent | `#ot-sdk-btn` | 1 | 📋 | NOT-BUILT | 704, 804(M2) |  |

</details>

<details><summary><b>/en/videos/</b> · template-search-results · MR · EDS EDS-LOCAL · 26 elements</summary>

| # | Element | Component | Source selector | × | Status | EDS | Tickets | Top delta |
|--:|---|---|---|--:|:-:|---|---|---|
| 1 | MR topbar and section switcher | header-megamenu | `header.header > .topbar` | 1 | ⚠️ | DELTA | 301✓, 305, 825 | MR nav fragment @1280: News/Press Kits/Models/Images/Videos/Company/Škodapedia → STO navigation |
| 2 | MR desktop navigation / dropdowns | header-megamenu | `nav.topnav` | 1 | ⚠️ | DELTA | 301✓, 305, 825 | menu labels @1280: News, Press Kits, Models, Images, Videos, Company, Škodapedia → STO navigation set |
| 3 | MR wordmark | header-megamenu | `a.logo` | 1 | 🟡 | DELTA | 301✓, 825 | logo box @1280: 256×48 → 194×19 |
| 4 | MR mobile hamburger/drawer | mobile-nav | `button.menu-toggle` | 1 | 🟡 | DELTA | 302, 825 | toggle ARIA / scroll-lock @375: expanded reflected on button; scroll locked → button aria-expanded absent; ov… |
| 5 | MR language switcher | language-switcher | `.lang-links` | 2 | ⚠️ | DELTA | 303, 825 | locale existence rule @1280: six on Videos, four on MR press article → six static on both |
| 6 | MR header search / suggestions | header-megamenu | `.search-bar` | 1 | 🔵⚠️ | IN-PR | 403, 825 | trigger width @1280: 48px → 24px |
| 7 | Advanced filter facet groups | faceted-listing | `form.search-filter` | 1 | ⚠️ | CONTENT-BLOCKED | 401✓, 402✓, 608 | facet set @1280: 15 groups once expanded → zero option values |
| 8 | Advanced filter and newest/oldest sort | faceted-listing | `ul.sort-options-list` | 1 | 🟡 | DELTA | 402✓ | sort row height @1280: 35px → 21px |
| 9 | 80-photo package-limit notice | media-cart | `.media-cart-limit-banner` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 10 | Video listing result grid | faceted-listing | `.search-results-items` | 1 | ⚠️ | CONTENT-BLOCKED | 402✓, 608 | result grid @1280: 12 cards, four columns → No results — clear filters to see all items; authored 3 cols |
| 11 | Video card poster/date/title/toolbar | card-teaser | `.search-results-item > article.article-teaser.vid…` | 12 | 📋 | CONTENT-BLOCKED | 201✓, 402✓, 608 | first video card @1280: 12 Vimeo poster cards → zero |
| 12 | Vimeo iframe/poster and play | embeds | `.search-results-item .image-holder.has-play-button` | 12 | 📋 | NOT-BUILT | 204, 503, 608 |  |
| 13 | Colorbox video lightbox | gallery-lightbox | `.search-results-item .file-type.colorbox` | 12 | ⚠️ | NOT-BUILT | 203✓, 608 |  |
| 14 | Video add-to-cart button | media-cart | `.search-results-item .media-cart-action.add` | 12 | 📋 | NOT-BUILT | 505a, 505b |  |
| 15 | Original MP4 direct download | media-cart | `.search-results-item .media-cart-action.download` | 12 | 📋 | NOT-BUILT | 503, 505a, 505b |  |
| 16 | Video result count | faceted-listing | `.search-results-pagination` | 1 | 📋 | CONTENT-BLOCKED | 402✓, 608 | count @1280: 12 / 904 → 0 / 0 |
| 17 | Video Load more button | faceted-listing | `button.ajax-loader-button` | 1 | ⚠️ | CONTENT-BLOCKED | 402✓, 608 | button availability @1280: visible for 904 videos → missing; zero EDS items |
| 18 | MR footer badges/social | footer-mediaroom | `footer.footer .footer-widgets` | 2 | ⚠️ | DELTA | 305, 306, 825 | MR footer variant/height @1280: 706px, three MR columns → 842px STO sitemap |
| 19 | MR footer Contacts | footer-mediaroom | `footer .widget_nav_menu` | 1 | 📋 | NOT-BUILT | 305, 825 |  |
| 20 | MR footer subscription/consent | newsletter | `footer .skoda-mailguide` | 1 | 📋 | NOT-BUILT | 305, 704 |  |
| 21 | MR footer Company/annual report | footer-mediaroom | `footer .widget_text` | 1 | 📋 | NOT-BUILT | 305, 503, 825 |  |
| 22 | MR copyright/legal/RSS | footer-mediaroom | `footer .copyright-text` | 1 | 🟡 | DELTA | 305, 306, 825 | legal text/RSS browsing context @1280: MR press/Internet/film rights + RSS target=_blank → STO Internet-news … |
| 23 | Sticky share expander | page-float-dock | `.sticky-buttons .btn-group.social` | 1 | ❌ | NOT-BUILT | 304✓, 824 |  |
| 24 | Sticky media-cart count | media-cart | `a.media-cart-icon.media-cart-count` | 1 | 📋 | NOT-BUILT | 505a, 505b |  |
| 25 | Floating scroll-top | page-float-dock | `a.round-icon.scroll-top` | 1 | ❌⚠️ | NOT-BUILT | 304✓, 824 |  |
| 26 | OneTrust and Manage cookies | cookie-consent | `#ot-sdk-btn` | 1 | 📋 | NOT-BUILT | 704, 804(M2) |  |

</details>
