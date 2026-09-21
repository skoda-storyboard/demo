# Škoda Media Room & Storyboard — Client Requirements Mapping (Requirements Doc v110926)

*Maps every requirement in the client's "Media Room Migration – Requirements" doc (DRAFT baseline, 90% completeness claim, due 25.09.2026) against what we have already identified/analysed and, where relevant, already built in the EN test migration. Each row carries a **Status**.*

**Date:** 2026-09-11 · **Companion to:** `SKODA-MASTER.md` (canonical findings), `SKODA-DELIVERY-PLAN.md` (milestones/decisions), `docs/tickets/OVERVIEW.md` (backlog). **Source requirement doc:** `../source/CMS-MediaRoomMigration-Requirements-110926-1118-1348.pdf`.

> **Note on scope framing:** the client doc is a **full target-state requirements baseline** (everything the eventual solution must do). Our existing work is scoped to a **capability pilot / 15 Oct demo** (M1) plus a **02 Jan 2027 go-live** (M2), tracked as 63 tickets / 261 SP across 10 epics (updated 2026-09-11: Press Kit detail broken out into SKODA-805–808; updated 2026-09-14: SKODA-207/604/810 per D18 and gap tickets SKODA-305/809/811/812/906; updated 2026-09-15: ui-specs template-gap tickets SKODA-607/208/209/706/813; block-recount tickets SKODA-210 microsite + SKODA-814 SiteOrigin body-flatten). Many items the client lists as requirements we have deliberately deferred to a later phase — that is a *phase* status, not a gap in understanding. The doc's own Section 9 ("Out of Scope / Likely Deprecated") already aligns closely with our phasing.

> **Decision-log alignment (2026-09-10/11):** statuses below reflect the current `SKODA-DELIVERY-PLAN.md` §8 decision log (D1–D19), including the **media-cart reframe** (D2 — purpose is server-side file-size *reduction* for download, not just client-side zip bundling; WordPress is being switched off) and **consent/OneTrust now OUT of Adobe delivery scope** (D10 — stays with Škoda; analytics stays in). The QR-code restricted-article access is added here as **D17 (new)**.

---

## Status legend

| Status | Meaning |
|---|---|
| ✅ **Built** | Implemented & published on the EN test migration (`/en/`) |
| 🟢 **Solvable** | Clear EDS/DA path, analysed & ticketed; no blocker |
| 🔵 **Solvable-as-service** | Needs a rebuild-as-service or external integration (analysed, path known) |
| 🟠 **Open — decision** | Blocked on a client decision / TBD in our decision log (D1–D19) |
| 🟡 **Open — needs input** | Needs client walkthrough / a live example / spec before we can finalise |
| 🔴 **Deferred / out-of-scope (this phase)** | Real requirement, explicitly later-phase or candidate for removal |

---

## 1. Common — Stories & Media Room (§5.1, COM01–COM19)

| ID | Requirement | What we've identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| COM01 | Site Header | Header block + `nav` fragment built; topbar (Stories/Media Room/Subscribe + lang), brand SVG wordmark, mega-menu = nested link lists | SKODA-301/302 | ✅ Built (Stories nav); Media Room nav variant 🟢 |
| COM02 | Section Switcher (Stories ↔ Media Room) | Topbar Stories/Media Room links built; active-section state + Media Room destination pending | SKODA-301 | 🟢 Solvable |
| COM03 | Primary Navigation (materially different nav sets per section) | Stories nav built (Models/eMobility/Lifestyle/Škoda World/Series/Škodapedia/Podcast). Media Room nav (News/Press Kits/Models/Images/Videos/Company) not yet built | SKODA-301 | 🟢 Solvable |
| COM04 | Model / Secondary Navigation | Nested-list mechanism proven; exact structure TBD by client | SKODA-301 | 🟡 Open — structure to confirm |
| COM05 | Language / Country Selector (expose only authored variants) | Switcher built (EN/CS/DE/SK/SR/SL). "Show only existing languages per item" rule identified (hreflang/metadata signal) — pilot is EN. **Client walkthrough (2026-09-14, provisional pending transcript) confirms the rule: the header language list is dynamically populated per page — a locale (e.g. DE) is shown only if the article exists in that language, otherwise hidden.** | SKODA-303 / 1003 | 🟠 Open — D1 (locale scope); rule now client-confirmed |
| COM06 | Global Search | ElasticPress today; EDS path = query-index + client search (index-only). Ranking/searchable-types TBD | SKODA-403 / 901 | 🟠 Open — D6 (index-only vs hosted) |
| COM07 | Listing / Filtering (facets vary by type) | **15 taxonomy facets** enumerated; faceted listing + load-more is the hardest pilot block. Metadata needs a normalization layer | SKODA-401/402 | 🟢 Solvable (facet subset — D12) |
| COM08 | Content Card (Story/News/Series/Model/Media variants) | Card variants built: `cards-overlay`, `cards-media`(+social), `cards-toolbar`, carousel overlay/caption variants | SKODA-201 | ✅ Built (Story/Series/Model); News/Media card variants 🟢 |
| COM09 | Hero / Page Banner (multiple variants; full-width only Stories?) | `hero-image` block built; multiple variants identified | SKODA-202 | 🟢 Solvable |
| COM10 | Carousel / Slider (used extensively) | `carousel` block built (drag/arrows/scroll-snap, overlay+caption variants); reused via `buildBlock` for rails | SKODA-201 | ✅ Built |
| COM11 | Pagination / Load More (currently 6) | "Load more" built on Latest Stories; 6-per-click pattern identified for Media Room listing | SKODA-402 | ✅ Built (Stories); listing load-more 🟢 |
| COM12 | Media Preview — Actions (lightbox, a11y) | Gallery + lightbox modal ticketed; a11y focus-trap `[RUNTIME-UNCONFIRMED]` | SKODA-203 | 🟢 Solvable (a11y follow-up) |
| COM13 | Media Download (single/multi, renditions) | Static Downloads block (mediabox); masters-only ingest; DAM = AEM Assets | SKODA-501/502 | 🟢 Solvable |
| COM14 | Media Cart (add/retain across browsing) | **Mission-critical for demo.** Device-ID, no login. Demo cart state client-side; **download-size reduction is server-side (App Builder / AEM Assets renditions)** per D2 reframe — client-side zip demoted. **PoC fallback agreed on the 2026-09-14 call:** if the server-side packer isn't ready, the select-all UI **downloads files separately (unpacked)** for the demo (same fallback as the press-kit ZIP, MR-PK07) | SKODA-505 / 902 | 🔵 Solvable-as-service (D2; PoC fallback = unpacked multi-download) |
| COM15 | Social Share (configurable channels; page + footer) | Channels identified (X/Pinterest/LinkedIn/Facebook/WhatsApp); footer social icons built | SKODA-304 | 🟢 Solvable |
| COM16 | Subscription / Newsletter | 10-route subscriber account (mailguide.cz) today; `newsletter-stub` built; real ESP integration deferred. **Confirmed on the 2026-09-14 call: UI-only (box + free-text field) is sufficient for the PoC** — back-end wiring later | SKODA-904 | 🔴 Deferred — D4 (UI-only for PoC ✔); provider TBD |
| COM17 | Cookie / Consent | OneTrust today. **D10: consent is OUT of Adobe delivery scope** (stays with Škoda); pilot ships a delayed-script stub only | SKODA-804 | 🔴 Out of Adobe scope (D10); stub built |
| COM18 | Footer (standard Škoda pattern, app badges, 4 social, full sitemap) | **Built** — dark-green footer, 7-col nav grid, FB/IG/YT/WhatsApp icons, app-store badges, legal row (Storyboard footer). **Confirmed on the 2026-09-14 call: the Media Room footer differs from the Storyboard footer** — we built only the Storyboard variant, so a distinct MR footer is net-new scope (SKODA-304). Client is **open to unifying footer + nav across both sites** if it simplifies our build — propose it if worthwhile, else replicate as-is | SKODA-304 | ✅ Built (Storyboard); 🟢 MR footer variant net-new |
| COM19 | App download Badge (mobile download / desktop link) | App-store badges built in footer | SKODA-304 | ✅ Built |

---

## 2. Storyboard Functional Requirements (§5.2)

### A. Storyboard Homepage (STO-H01–H09)

| ID | Requirement | What we've identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| STO-H01 | Promotional / Featured Carousel | **Built** — index-driven `stories` block, `variant: promo` (1 big + 2 small ≥900px; JS timed carousel on mobile). Manual-curation-vs-auto still open | SKODA-201 | ✅ Built (curation 🟠 §10 Q11) |
| STO-H02 | Latest Stories | **Built** — `stories` block, query-index driven, newest 5, press-releases excluded, Load more | SKODA-402 | ✅ Built |
| STO-H03 | Models Slider | **Built** — static carousel-caption rail (links to taxonomy pages). Source/order TBD | SKODA-201 | ✅ Built (source 🟡) |
| STO-H04 | eMobility Stories Slider | **Built** — `story-rail`, tag-filtered (category=emobility), auto-populated via carousel | SKODA-402 | ✅ Built |
| STO-H05 | Lifestyle Stories Slider | **Built** — `story-rail` (category=lifestyle) | SKODA-402 | ✅ Built |
| STO-H06 | Škoda World Stories Slider | **Built** — `story-rail` (category=skoda-world) | SKODA-402 | ✅ Built |
| STO-H07 | Series Slider (image-only clickable; different style; no date; sort TBD) | **Built** — static carousel-caption (undated, 16px/600 below image). Text-clickability + sort logic open | SKODA-201 | ✅ Built (sort/clickability 🟡) |
| STO-H08 | Latest News | **Built** — `story-rail` (category=press-releases). Source/continued-requirement is a new open Q (§10 Q12) | SKODA-402 | ✅ Built (scope 🟡) |
| STO-H09 | Social Media (approved channels) | **Built** — `cards-media` social variant (static, dark). `ys-social-feed` confirmed *not* live today | SKODA-201 | ✅ Built (static); live feed 🔴 |

### B. Story Category / Subcategory Pages (STO-C01–C05)

| ID | Requirement | What we've identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| STO-C01 | Category Hero | Hero block variants; category hero not yet assembled as a page template | SKODA-202 | 🟢 Solvable |
| STO-C02 | Story Results Grid | query-index + listing pattern; retrieval by category proven (rails use it) | SKODA-402 | 🟢 Solvable |
| STO-C03 | Story Card | Card variants built | SKODA-201 | ✅ Built (component) |
| STO-C04 | Pagination Status (current/total) | Load-more built; total-count display is a listing detail | SKODA-402 | 🟢 Solvable |
| STO-C05 | Load More | Built on homepage; reusable on category pages | SKODA-402 | ✅ Built (component) |

*Category page **template** itself is not yet assembled — deferred (§9 "not every template rebuilt this phase").* 🔴 later-phase template

### C. Series Page (STO-S01–S03) · D. Storyboard Model Page (STO-M01–M05)

| ID | Requirement | Identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| STO-S01–S03 | Series hero / grid / card | **Series confirmed a real 2-level template** (verified live 2026-09-14, 22-URL analysis): a series *directory* (`/series-2/`, ~20 series cards) → a series *hub* (`/series/<slug>/`, curated story-card grid). Reuses `cards-*` + hero + grid; grouping/hub layout is the only net-new bit. **Pulled into M1** (D18) — cheap, adds demo breadth | SKODA-207 | 🟢 Solvable — **M1 target** (D18) |
| STO-M01–M05 | Model hero / featured model / model-related stories grid / card / load-more | Components exist; **model page is a named M1 demo target** ("Media Room home + one Model page"); association is metadata-tag-driven (recommendation logic in scope, personalization out). **Measured 2026-09-15 (`../ui-specs/template-model-page.md`): it's a real `skoda_model` CPT — full-bleed hero + 8-item icon section-nav + "Model Description" + 5 related-content rails** (news/press filtered by model tag), not a listing. Template ticket **SKODA-208** | SKODA-208/201/402 | 🟢 Solvable (M1 target) |

### E. Story Detail Page (STO-D01–D10)

| ID | Requirement | Identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| STO-D01 | Story Hero (title/image/perex/date/category) | 48 story pages imported with this metadata; hero on detail page | SKODA-202/603 | ✅ Built (content imported) |
| STO-D02 | Rich Text (flexible composition) | Story = SiteOrigin Page Builder → **flatten** (de-risked: 17 widget types, 98.7% simple). Pilot's 48 imported stories are flattened (hero+title+body). **Note (2026-09-14):** the flatten deliberately drops in-body galleries, embeds, and the Media Box — fine for the demo's fidelity scope; **1–2 hero demo stories will be restored to full fidelity in M1** (SKODA-604) | SKODA-801/604 | 🟢 Solvable (flatten proven) |
| STO-D03 | Embedded Video (+ consent) | Embed autoblock (Vimeo/YouTube/Buzzsprout/Spotify), `dnt=1`, lazy. Confirmed live in story bodies (2026-09-14). Currently dropped by flatten; **restored on the 1–2 full-fidelity demo stories** (SKODA-604). Consent relationship TBD (D10 — consent w/ Škoda) | SKODA-204/604 | 🟢 Solvable |
| STO-D04 | Image Carousel / Gallery (auto-play) | Gallery + lightbox; auto-play a11y (pause control) flagged. Confirmed present in-body on live stories (2026-09-14, incl. lightbox galleries); dropped by flatten, **restored on the 1–2 full-fidelity demo stories** (SKODA-604) | SKODA-203/604 | 🟢 Solvable (a11y) |
| STO-D05 | Newsletter Widget | `newsletter-stub`; real provider deferred. **Confirmed on the 2026-09-14 walkthrough call: UI-only (box + free-text field) is acceptable for the PoC** — back-end wiring is later | SKODA-904 | 🔴 Deferred — D4 (UI-only for PoC ✔) |
| STO-D06 | Related Stories (tag-matched) | Tag-based aggregation **in scope** (personalization out); story-rail proves the pattern. **Confirmed on the 2026-09-14 call: two mechanisms** — (a) a bottom strip auto-pulled from the article's tags/categories, and (b) a right-side "explore more" box of **up to 3 manually-chosen** articles that **falls back to same-tag** when unset. This is exactly the "manual+tag recommendations" not-OOTB function — already built on `/en` | SKODA-402 | 🟢 Solvable (manual+tag ✔ built) |
| STO-D07 | Article Sidebar | Identified (related/promo/subscription); responsive treatment needed | SKODA-201 | 🟢 Solvable |
| STO-D08 | Side Banner | Bespoke per-market ad server today; **drop/challenge for pilot** | SKODA-903 | 🔴 Deferred — D3 |
| STO-D09 | Media Box / Gallery (download, add-to-cart single+group, default 8) | Downloads block + media-cart; mediabox source known. Confirmed live at the foot of story bodies (2026-09-14, 7–14 images per story); dropped by flatten, **restored on the 1–2 full-fidelity demo stories** (SKODA-604). **Corrected from the 2026-09-14 call:** authors **add media-box assets MANUALLY today** — the box is not auto-populated. The **proposed improvement** (client-endorsed) is *auto-add-all-by-tag with an author delete option* (client feedback: "we need an option to delete some"), since some assets — e.g. PDF diagrams — are sometimes excluded. So: manual is the as-is; tag-autopopulate+delete is the target authoring nicety | SKODA-502/505/604 | 🔵 Solvable-as-service |
| STO-D10 | Social Share | Share channels identified | SKODA-304 | 🟢 Solvable |

---

## 3. Media Room Functional Requirements (§5.3 — marked WIP)

### A. Media Room Homepage (MR-H01–H10)

| ID | Requirement | Identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| MR-H01 | Featured / Promotional Content | Promo pattern proven on Stories homepage (index-driven); Media Room home is a **named M1 demo target** | SKODA-201/603 | 🟢 Solvable (M1 target) |
| MR-H02 | News | query-index news card/slider; story-rail pattern reusable | SKODA-402 | 🟢 Solvable |
| MR-H03 | Images (preview/download) | Downloads + lightbox + masters-only ingest; DAM = AEM Assets | SKODA-203/501/502 | 🟢 Solvable |
| MR-H04 | Videos | Vimeo/YouTube embeds + separate downloadable file (dual path §11.5) | SKODA-204/503 | 🟢 Solvable |
| MR-H05 | Models | Model rail/card built (Stories); reuse for Media Room | SKODA-201 | ✅ component / 🟢 |
| MR-H06 | Press Kits | Press Kit card; listing shares search template (§11.6) | SKODA-402/802 | 🟢 Solvable (fields 🟡) |
| MR-H07 | Latest Stories | `stories` block reusable | SKODA-402 | ✅ component |
| MR-H08 | Media Cart | Demo cart (device-ID); reduction server-side (D2) | SKODA-505 | 🔵 Solvable-as-service |
| MR-H09 | Media Lightbox | Lightbox | SKODA-203 | 🟢 Solvable |
| MR-H10 | Contacts / Company Content | Sidebar/contacts block; placement TBD | SKODA-201 | 🟡 Open — placement |

### B. Shared Listing Pattern (MR-L01–L06)

| ID | Requirement | Identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| MR-L01 | Listing Search | query-index search; relationship w/ global search TBD | SKODA-403 | 🟠 Open — D6 / §10 Q9 |
| MR-L02 | Content-Type Filter (All/Stories/News/Press Kits/Images/Videos) | **Definitive taxonomy confirmed** from live markup (§11.6) — one shared listing component parameterized by type. **22-URL analysis (2026-09-14) verified this is one single faceted-listing engine live** across tag listings, category listings, News, Images, and Videos (identical filter bar + "Load more") — build once, reuse everywhere | SKODA-402 | 🟢 Solvable |
| MR-L03 | Faceted Filters (model, bodywork, category…) | 15 facets enumerated; needs metadata-normalization layer (build-confirmed not clean in markup). Two-level (type + year/event/history). Images/Videos listings expose the **advanced facet set** (Model/Derivative/Concept/Bodywork/Year/Topic…) — far richer than the demo subset. **Call (2026-09-14): advanced filter currently defaults to ALL selections across MR; open whether it should scope to the selected section** | SKODA-401 | 🟢 Solvable — normalization effort (D12 subset; per-section scoping 🟡) |
| MR-L04 | Result Grid/List | Card + grid components | SKODA-201/402 | 🟢 Solvable |
| MR-L05 | Result Card (per type) | Card variants; per-type definitions to finalise | SKODA-201 | 🟡 Open — finalise per type |
| MR-L06 | Pagination / Load More (6-per-click, total count, sort asc/desc) | Load-more built. **Confirmed on the 2026-09-14 call:** 6 per "load more" across MR, total count shown, sort newest/oldest — matches the built pattern | SKODA-402 | 🟢 Solvable (mechanics confirmed) |

### C. Press Release / News (MR-PR01–07) — see also §11

| ID | Requirement | Identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| MR-PR01 | Press Release Header | Press-release = 47.5% of pages. **Corrected 2026-09-15 (live DevTools, `../ui-specs/template-press-release.md`): it is NOT the story template** — it has *no top hero* (text title only), uses `.column-primary`/`.column-secondary` (not the story's `.content`/`.sidebar`), puts media-kit downloads + tags + newsletter in the secondary column, adds a full-bleed dark related band, and sits on the MR side. Build one shared two-column CSS shell, swap content + side. Own ticket now: **SKODA-607** (M1) | SKODA-607 (603/801 = content+flatten) | 🟢 Solvable (measured) |
| MR-PR02 | Structured Article Content | Controlled structure; final authoring model TBD (DA vs UE — D13) | SKODA-802 | 🟠 Open — D13 |
| MR-PR03 | AI-Generated Audio Reading | External embed today; reproduce as-is, don't rebuild vendor (§11.2, §9). **Confirmed on the 2026-09-14 call: even though the podcast section is excluded, the per-language AI-audio box MUST still be supported** — it's a third-party JS embed dropped into the press-release page (no vendor rebuild). So it's *in scope as an embed*, not deferred | SKODA-204 | 🟢 Solvable (drop-in vendor JS; content not migrated) |
| MR-PR04 | PDF Download (citation-ready) | Link/DAM handling; authored-vs-generated TBD | SKODA-503 | 🟡 Open — generation approach |
| MR-PR05 | Infographic (preview→PDF) | Preview-image-to-PDF pattern identified (also §11.4/11.11) | SKODA-502 | 🟢 Solvable |
| MR-PR06 | Video (playback + source download) | Dual path (embed + downloadable) identified | SKODA-204/503 | 🟢 Solvable |
| MR-PR07 | Media Downloads | Downloads block; DAM = AEM Assets | SKODA-502 | 🟢 Solvable |

### D. Press Kit (MR-PK01–07) — expanded in §11.8–11.14

| ID | Requirement | Identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| MR-PK01 | Press Kit Header | Press-kits = filtered view of press_release **in the REST API only** (`wp/v2/press_kit` → 404); the **rendered pages are a real `press_kit` post type** (`single-press_kit`, `press_kit-template-*` — corrected 2026-09-15, `../ui-specs/_TEMPLATES.md`), so the **page composition is a distinct type** (verified live 2026-09-14): a hub landing (TOC of 8 chapters + resource tabs Texts/Infographics/Tech data/Images/Videos + WhatsApp/ZIP download) plus chaptered sub-pages that each carry a **persistent chapter sub-nav**, technical-spec tables, and a large Media Box (84 images / 6 PDFs on the Epiq exterior sub-page). Article sub-pages are `en-stories`-adjacent but exceed it | SKODA-805 | 🟡 Open — needs walkthrough (§10 Q6) |
| MR-PK02 | Structured Narrative (fixed sections) | Fixed sequence confirmed (Intro/Exterior/Interior/Battery/Safety/Connectivity). **Resolved on the 2026-09-14 call: sections are CONDITIONAL, not fixed** — content varies by model/topic (e.g. some kits lack technical data); the UI must degrade gracefully when a section is absent. Need to check content for how the UI shifts. Confirms the optional/conditional model on SKODA-805 (§11.8) | SKODA-805 | 🟢 Solvable — conditional sections (was 🟡) |
| MR-PK03 | Variant / Bodywork Selector | Variant subsection confirmed (§11.9); interaction TBD | SKODA-808 | 🟡 Open |
| MR-PK04 | Grouped Content (Texts/Infographics/Tech data/Images/Videos) | 5 grouped areas confirmed (§11.11); tabs/accordion/stacked = design detail. **Call (2026-09-14):** the MR media box additionally supports **PDF + infographics** (Storyboard media box is images/videos only), and grouped areas are **conditional per kit** (an area is hidden if that kit has no content of that type) | SKODA-806 | 🟢 Solvable (presentation TBD) |
| MR-PK05 | FAQ | First FAQ pattern in the doc (§11.10); per-kit vs shared pool TBD | SKODA-807 | 🟡 Open |
| MR-PK06 | Individual Asset Download | Downloads block | SKODA-502/806 | 🟢 Solvable |
| MR-PK07 | Complete Press Kit ZIP | Whole-kit zip (§11.12). **Refined 2026-09-14 (deep pass):** the live whole-kit ZIP is a **pre-built static `.zip` on the CDN** (e.g. `…/Skoda_Epiq_c5a5f2fe.zip`), NOT on-demand packing — so the low-risk EDS pattern is **host a pre-generated asset + author-managed link** (no server runtime needed for the *whole-kit* case). This is easier than the media-cart's arbitrary-selection ZIP (COM14), which is the genuinely non-native one. PoC fallback still available (unpacked multi-download) | SKODA-806/902 | 🔵 Solvable-as-service (PoC fallback = unpacked multi-download) |

### E–G. Model / Images / Videos (MR-M01–07, MR-I01–05, MR-V01–04)

| Group | Requirement summary | Identified / built | Ticket(s) | Status |
|---|---|---|---|---|
| MR-M01–07 | Media Room model page + 5 related-content strips (news/press-kits/stories/images/videos) | Tag-driven aggregation in scope; model page is M1 target; retrieval rules TBD | SKODA-402 | 🟢 Solvable (retrieval rules 🟡) |
| MR-I01–05 | Image listing / filters / preview / rendition download / add-to-cart | Listing + lightbox + downloads + cart; **Original/1920px dual-rendition** confirmed live (2026-09-14 deep pass: **exactly 33,313** images, 12/page load-more, 80-item cart cap, `/direct-download/` origin); rendition strategy ties to D2. **Full Images listing page pulled into M1** (D18) — depends on gallery-lightbox + per-item media-cart. **⚠️ Capability caveat (F2):** the source faceting is **server-side Elasticsearch aggregation over 33k rows** — the EDS query-index + client-side filter (SKODA-402) cannot carry that at production scale; M1 must be a **representative sample** (§9), and the full 33k listing likely needs hosted search (SKODA-901). D2/D5 M1-blocking | SKODA-203/402/505 | 🟢 Solvable at *sample* scale — **M1** (D18); 🔵 cart / D2·D5; full-scale faceting 🟠 (F2) |
| MR-V01–04 | Video listing / filters / playback / download | Vimeo-`iframe` grid + colorbox lightbox player + direct `.mp4` download + add-to-cart confirmed live (2026-09-14 deep pass: **exactly 913** videos, same Search & Filter Pro engine; the third per-tile control is **add-to-cart**, not a favorites-heart); DAM/source-file model TBD. **Full Videos listing pulled into M1** (D18). **Gotchas:** don't mount 913 live iframes (lazy posters from `i.vimeocdn.com`, instantiate player on play); Vimeo `dnt=1` still fires on interaction → **consent-gate** (OneTrust); duration badge is runtime-only (not in markup) | SKODA-204/503 | 🟢 Solvable — **M1** (D18); consent/perf 🟡 |

---

## 4. Editorial / Authoring / DAM (§6 — WIP)

| § | Requirement | Identified | Ticket(s) | Status |
|---|---|---|---|---|
| 6.1 | Reusable page structures / templates (10 families) | Template families mapped to EDS fit-scale (press-release 🔵, story 🟠-flatten, page 🟢, Škodapedia 🔵, listing 🔵). "New page w/o dev" = DA/EW authoring | SKODA-801/802 | 🟠 Open — DA vs UE (D13) |
| 6.1a | **"Company/Page" template family** (5 distinct sub-types surfaced by the 22-URL analysis, 2026-09-14, previously subsumed in the generic "page" family): **board-of-management** (exec-bio accordion — expandable galleries + CV/photo-set/press/LinkedIn), **annual-reports** (reverse-chron download list w/ PDF-cover thumbs), **company-logo** (36-asset brand grid, dual PDF+PNG), **media-services-application** (app-promo: QR + app-store badges + screenshots), **contacts** (department-grouped directory: name/title/email/phone/photo/LinkedIn). Each needs a net-new block; all share only hero + chrome | SKODA-810 | 🔴 Deferred to M2 (D18) |
| 6.2 | Content creation & config (blocks, variants, sources, metadata) | Controlled component variants built. **Layout-mode editability fix shipped** — `scripts/optimized-picture.js` optimizes images *in place* so featured/carousel/social images stay editable; index-driven blocks (`stories`/`story-rail`) edited via config rows in Content mode (inherently not layout-editable) | SKODA-201 | ✅ editability fix built; model choice 🟠 D13 |
| 6.3 | Preview & publishing lifecycle (+ update/unpublish/schedule/review/pre-pub) | Preview/publish proven (DA source-API + bulk-op). Scheduled/review/embargo not native → **staged-publish** recommended | SKODA-602 | 🟢 (core) / 🟠 (embargo D9) |
| 6.4 | Roles & permissions (7 user groups) | Governance layer explicitly **later-phase** (§9); role mapping TBD (RACI = D15) | — | 🔴 Deferred — role mapping open |
| 6.5 | Restricted pre-publication content (secured folder) | = **content embargo** (D9). Confirmed real 2026-09-10 ("restricted folders for new-car launches"). **Approach validated on the 2026-09-14 call:** Lars proposed the native EDS pattern — **group-restricted** access to a folder/area + **preview-not-live**, then publish at a time; client confirmed it's **group-based (not per-individual)** and that an **article-level preview-share is acceptable** — a separate folder is NOT strictly required. Mainly car-launch assets | — | 🟢 Solvable — D9 approach agreed (group access + staged publish) |
| 6.6 | Restricted article access — end users (QR-code journey) | Access model fully open (auth? unique QR? expiry? entitlement?). No end-user auth today. **Added as new decision D17** | — | 🟡 Open — D17 (model undefined) |
| 6.7 | Auditability (change history) | Assumed via AEM/EDS authoring setup; needs technical validation (relates to D16 NFRs). **Confirmed a firm requirement on the 2026-09-14 call** (hoped to be OOTB): a historical log of authoring changes per user. Driver = **many agencies author content** (separate Media Room agency, Storyboard agency, sub-agencies, per-country agencies), so change attribution matters on a public brand site | — | 🟡 Open — validate EDS/DA capability (firm requirement) |
| 6.8 | Language & market setup (locale list, HQ vs local, fallback) | Per-locale trees + EW Translation; "selector shows only existing languages" confirmed as **per-page dynamic** (COM05). **Confirmed on the 2026-09-14 call:** current translation workflow = author picks a language from a WordPress menu → gets a **copy** of the article → pastes the translated text (fully **manual**, no auto-translation; phrase/auto-translation is a nice-to-have we may offer, not required). Country versions are **80–90% identical, ~20% country-specific**; countries **choose** whether to adapt an article (unadapted → not shown in that locale's nav) and **can publish country-only articles**. HQ authors EN+CZ. Not full cross-locale parity | SKODA-1001/1002/1003 | 🟠 Open — D1 (locale scope); model confirmed |
| 6.9 | DAM (images/videos/PDFs/infographics; rendition/rights/reuse) | **AEM Assets = approved source (D5 resolved).** Masters-only ingest; asset-mapping manifest. Source masters ~40 MB → **media pre-conditioning required** (content-bus 409). Dynamic Media TBD. Rights not machine-readable (no EXIF) | SKODA-501/504/506 | 🔵 Solvable (Dynamic Media 🟠) |

---

## 5. Content Migration (§7 — TBD) & Non-Functional (§8 — TBD)

| ID / § | Requirement | Identified | Ticket(s) | Status |
|---|---|---|---|---|
| MIG01–07 | Inventory, migrate historical content+media, map structures, preserve metadata/URLs/asset-links, validate | Scale measured (~13.3k editorial / ~28.3k media). Import infra built (parsers/transformers, DA push). **Bulk automated migration explicitly out-of-scope this phase (§9)** — sample content by hand; **full migration = WordPress switched off** (D7) | SKODA-601/602/803 | 🟢 Solvable / 🔴 bulk deferred |
| 8.1 | URL & SEO (preserve URLs, redirects, canonical, sitemap) | Redirects sheet planned; cross-locale redirects unstable + 8 dead EN URLs flagged; EDS ships canonical HTML (SEO gain). Redirect *execution* = pre-go-live task (§9) | SKODA-103 | 🟢 Solvable / 🔴 full redirect map deferred |
| 8.2 | Analytics & tracking (12 event types) | `skoda-analytics` = bespoke ~140 KB dataLayer over GTM. **D10: analytics IN Adobe scope** (GA+FB+Yoast baseline; confirm bespoke-layer need). Pilot = block hooks + stubs | SKODA-804/905 | 🟠 Open — D10 |
| 8.3 | Cookie consent (accept/reject/manage; respect state) | OneTrust. **D10: consent OUT of Adobe delivery scope** — stays with Škoda (complex integration) | — | 🔴 Out of Adobe scope — D10 |
| 8.4 | Newsletter / subscription (secure, consent) | 10-route account today; ESP integration deferred | SKODA-904 | 🔴 Deferred — D4 |
| 8.5 | Performance (Core Web Vitals) | Mobile Lighthouse **48** measured on `/en/`; root-cause + fix plan drafted. **Shared index-fetch shipped** (`scripts/query-index.js` memoizes the query-index across `stories`+`story-rail`, 5 fetches → 1). Remaining CLS/LCP/reflow items ticketed. Target ≥90 | SKODA-702 | 🟢 Solvable (partial fixes shipped) |
| 8.6 | Accessibility (nav/forms/filters/carousels/modals/media/cards) | Mobile-nav ARIA gap + carousel/modal focus-trap flagged `[RUNTIME-UNCONFIRMED]`; a11y audit ticketed. WCAG level TBD | SKODA-302/703 | 🟢 Solvable (target level 🟡) |

---

## 6. Out of Scope / Deprecated (§9) & Open Questions (§10) — alignment check

**§9 — Client's own scope cuts largely match our phasing:**

| Client statement (§9) | Our position | Status |
|---|---|---|
| Podcast no longer used — candidate for removal | Podcast is not a template (301s into story/PR); safe to drop | 🔴 Agreed drop |
| Some homepage category stripes not retained | Aligns with controlled-simplification | 🟠 confirm which |
| App integration may be obsolete; RSS continuity desirable | RSS feed deferred (needs feed generator + migrated articles) | 🔴 Deferred |
| Škodapedia continues *outside* Storyboard | Matches our finding; glossary block still ticketed (SKODA-206) if needed | 🟢 aligned |
| Full site page coverage NOT this phase (subset: MR home + 1 Model, extendable) | Exactly our capability-pilot framing | ✅ aligned |
| Backend depth (roles/embargo/audit/market editing) later phase | Matches our M2/Phase C deferrals | ✅ aligned |
| Bulk/automated migration out (sample only) | Matches (SKODA-803 deferred) | ✅ aligned |
| Visual redesign out (as-is fidelity) | Matches — our build is pixel-matched to source | ✅ aligned |
| Recommendation: tag-based aggregation IN, personalization OUT | Matches (story-rail is tag-driven; no ML). The 3 functions the client flagged "not OOTB" (exclude-from-listings, multi-category placement, manual+tag recs) are **already built** on `/en` | ✅ aligned |
| Full localization tooling later; one locale for PoC | Matches (EN built; CS for demo) | ✅ aligned |
| Third-party rebuilds out (audio/newsletter/app-RSS reproduced as-is) | Matches | ✅ aligned |
| Search + redirect *execution* pre-go-live (stub acceptable) | Matches (index-only pilot) | ✅ aligned |

**§10 — Client's 12 open questions vs our decision log:**

| §10 Q | Our mapped decision / answer | Status |
|---|---|---|
| Q1/Q2 Cart (cross-section, persistent icon, downloads page, CTAs per type) | D2 (device-ID, no login; **download reduction server-side**); cart-page structure needs design | 🟡 Open — UX detail |
| Q3 Share at site vs page level | Both identified (COM15) | 🟡 confirm |
| Q4 Advanced filter deep-dive | 15 facets enumerated; needs display-logic walkthrough (facet subset = D12) | 🟡 Open |
| Q5 Media Room 2-col/6-card, total count, +6 on view-more, sort | Listing pattern known; sort/count are listing details | 🟢 Solvable |
| Q6 Press kits walkthrough | Need live walkthrough (also MR-PK) | 🟡 Open |
| Q7 Subscription in scope? Registration steps? Stories vs Newsletter wording | D4 open; provider TBD | 🟠 Open |
| Q8 Footer app links (Škoda Media Room iOS/Android) | Badges built | ✅ Built |
| Q9 Search ranking + whether MR home search is narrower | D6; ranking TBD | 🟠 Open |
| Q10 Definitive locale list + missing-translation fallback | D1; "show only existing" rule identified | 🟠 Open |
| Q11 Featured curated vs most-recent + count | STO-H01 built as most-recent index-driven; curation is the open call | 🟠 Open |
| Q12 "Latest News" source + in scope? | Built as press-release rail; **flagged same open Q by us** | 🟡 Open — confirm |

---

## 7. New / expanded decisions surfaced by this requirements doc

| # | Decision | Origin | Recommendation | Status |
|---|---|---|---|---|
| **D17 (new)** | **Restricted article access for end users via QR-code journey** (§6.6) — model fully undefined: auth required? unique vs shared QR? expiry? subscriber/entitlement validation? access duration? forwarding behaviour? | This doc, §6.6 | Distinct from author-side embargo (D9). No end-user auth exists today; EDS has no native gated delivery. Treat as an M2+ investigation; scope only once the business clarifies the access model. Add to `SKODA-DELIVERY-PLAN.md` §8. | 🟡 Open — needs client input |
| **D18 (new)** | **Page-type scope split from the 22-URL analysis** (2026-09-14): where do the newly-surfaced/re-classified page types land? (a) **Series** confirmed a real 2-level template; (b) **Images/Videos** are full faceted-listing pages needing gallery/embed/cart; (c) story detail flatten drops in-body galleries/embeds/Media Box; (d) the **5 "company/Page" sub-types**. | `.migration/plans/url-analysis-comparison.md` | **Resolved 2026-09-14:** Series → **M1** (SKODA-207); Images/Videos full listing pages → **M1** (raises D2/D5 to M1-blocking); story full-fidelity → **restore on 1–2 hero demo stories in M1** (SKODA-604); 5 company/Page types → **deferred to M2** (SKODA-810). | 🟢 Resolved (split agreed) |
| **D19 (new)** | **AI-tool usage reporting / governance** (Škoda + EU AI Act) — Škoda is mandated to monitor and report which AI tools are used, and may restrict the toolset. Surfaced on the 2026-09-14 call. | Client call 2026-09-14 | **Action on us:** Lars to formally notify Škoda that AI is used in the build/migration and share the internal legal-clearance summary (confirmed on the call: no data leaves our realm / no data sent to model providers). Not urgent, but a **compliance obligation** before/at engagement setup — track alongside D16 NFRs. | 🟡 Open — compliance notification owed |

*(D1–D16 were already tracked in `SKODA-DELIVERY-PLAN.md` §8; this doc originated D17–D19. All of D1–D19 now live in the delivery plan §8.)*

**Press-Kit detail (§11.8–11.14) — broken out into E08 tickets (2026-09-11):** previously rolled into SKODA-802 "remaining templates" as a reuse-only import, the §11 detail confirmed it is a *structured* template. Now split into four dedicated tickets:

| Ticket | Covers | Requirements | SP |
|---|---|---|---|
| **SKODA-805** | Press Kit template + fixed narrative sections (Intro/Exterior/Interior/Battery/Safety/Connectivity) + header + parser | §11.8, MR-PK01/02 | 5 |
| **SKODA-806** | Five grouped media/download areas (Texts/Infographics/Tech data/Images/Videos) + per-item downloads + whole-kit ZIP | §11.11/§11.12, MR-PK04/06/07 | 5 |
| **SKODA-807** | FAQ block (accessible Q/A accordion + FAQPage structured data) | §11.10, MR-PK05 | 2 |
| **SKODA-808** | Variant/bodywork subsections + selector + internal categorization (facet metadata) | §11.7/§11.9/§11.14, MR-PK03 | 3 |

SKODA-802 slimmed 8→5 SP (Škodapedia + generic pages only); E08 grew 29→41 SP; program 190→207 SP (that was the 2026-09-11 state; the program has since grown to **261 SP / 63 tickets** — E08 now 71 SP — via D18, the 2026-09-14 gap tickets, the 2026-09-15 ui-specs template-gap tickets, and the block-recount tickets SKODA-210/814). The **fixed-vs-conditional-sections question (§11.8)** is the key modelling decision carried on SKODA-805 (required fields vs optional/conditional) and needs a live press-kit example (§10 Q6 / §11.1) before the template is locked.

**Backlog update (2026-09-14, D18 — 22-URL analysis):** three tickets added — **SKODA-207** (Series 2-level template → M1, E02, +3 SP), **SKODA-604** (full-fidelity restore on 1–2 hero stories → M1, E06, +2 SP), **SKODA-810** (company/Page family of 5 sub-types → M2, E08, +8 SP). That took the program to 207→220 SP across 48→51 tickets. **Then (2026-09-14, gap pass)** five more tickets closed the traceability gaps — **SKODA-305** (MR footer → M1, E03, +2), **SKODA-809** (roles), **SKODA-811** (embargo), **SKODA-812** (audit) → E08/M2, **SKODA-906** (QR access) → E09/M2 — bringing the program to **237 SP across 56 tickets**. **Then (2026-09-15, ui-specs measured-spec initiative)** the live-DevTools template census (`../ui-specs/_TEMPLATES.md`) added five template-gap tickets — **SKODA-607** (press-release detail template → M1, E08, +5), **SKODA-208** (model page → M2, E02, +5), **SKODA-209** (category/tag archive → M2, E02, +3), **SKODA-706** (branded 404 → M2, E07, +1), **SKODA-813** (generic Page base shell → M2, E08, +2) — bringing the program to **253 SP across 61 tickets**. **Then (2026-09-15, block recount)** the full-site recount (`../analysis/SKODA-BLOCK-RECOUNT.md`) added two cross-check tickets — **SKODA-210** (custom microsite, 201 pages → M2, E02, +3) and **SKODA-814** (SiteOrigin body-flatten contract, 1,614 pages → M2, E08, +5) — bringing the program to **261 SP across 63 tickets** (current canonical total; `docs/tickets/OVERVIEW.md` §2 and §5 both reconciled to 261).

---

## 8. Client "90% complete" cross-check — where the remaining ~10% sits

The client marks the doc a DRAFT baseline at ~90% completeness. The sections **they themselves** flag as WIP/TBD/unverified — i.e. the genuine remainder — are:

- **§5.3 Media Room Functional Requirements — "WIP"** (the entire Media Room functional set is provisional).
- **§6 Editorial / Authoring / DAM — "WIP"** (roles, embargo, QR access, audit, locale model, DAM/Dynamic Media all open).
- **§7 Content Migration — "TBD"** (volumes, retention/exclusion, automation, transformation, reconciliation deferred to the migration team).
- **§8 Non-Functional — "TBD"** (analytics platform, CMP, subscription provider, performance thresholds, WCAG level all unconfirmed).
- **§11.1** — press-release detail requirements are **reported business behaviour, not yet verified against a live page** (a live example is requested as a next step).
- **§10** — 12 explicitly-open questions (cart structure, filters, press-kit walkthrough, subscription, search ranking, locales, curation, Latest News source).

**Net:** the ~90% that is solid is the *functional-frontend* surface (Common + Storyboard, §5.1–5.2), which is exactly where our build is strongest (largely ✅/🟢). The remaining ~10% is concentrated in **authoring/governance, DAM depth, migration mechanics, NFRs, and the un-walked Press-Kit/Press-Release detail** — matching our own 🟠/🟡/🔴 clusters. No contradictions between their draft and our analysis.

---

## 9. Headline read for the client

- **The doc is well-aligned with our analysis.** Its §9 scope cuts and §10 open questions map almost one-to-one onto our decision log (D1–D19) and phase split — no surprises, no contradictions.
- **A large share of the *common* + *Storyboard homepage* surface is already built and published** on the EN test migration (header, footer, nav, hero, cards, carousel, featured promo, latest stories, 4 tag-rails, social, app badges, 48 imported stories) — plus the Layout-editability fix and the shared-index-fetch perf fix.
- **The genuinely hard items are the same three we already flagged:** (1) faceted listing/search over a normalized 15-facet index, (2) the media-cart / whole-kit-ZIP **download-size reduction** (non-EDS-native, now server-side per D2 — covers both COM14 and PK07), and (3) the backend-as-service rebuilds (newsletter, banners, analytics) which the client themselves defer.
- **New/expanded in this doc vs our prior corpus:** the Press-Kit detail structure (§11.8–11.14), the **QR-code restricted-article end-user access** (§6.6 → new **D17**), and the explicit "Latest News on Stories side" question — all captured as 🟡 needs-input above.

---

## 10. Cross-references

- `SKODA-MASTER.md` — canonical findings (block inventory, complex systems, media, architecture).
- `SKODA-M1-DEMO-TARGET.md` — tiered M1 demo scope + signable definition-of-done, built on the statuses in this doc.
- `SKODA-AGENT-HANDOFF-CANDIDATES.md` — which parts can be handed to an autonomous agentic team.
- `SKODA-DELIVERY-PLAN.md` §8 — decision log D1–D19 (D17 QR-access, D18 page-type split, D19 AI-tool reporting now folded into the plan).
- `docs/tickets/OVERVIEW.md` — 63-ticket / 261-SP backlog referenced in the Ticket(s) columns (SKODA-207/604/810 added per D18; SKODA-305/809/811/812/906 added in the 2026-09-14 gap pass; SKODA-607/208/209/706/813 added in the 2026-09-15 ui-specs pass; SKODA-210/814 added in the 2026-09-15 block recount).
- `../ui-specs/README.md` + `../ui-specs/_TEMPLATES.md` — measured component/template spec library (live-DevTools DOM+CSS at 768/992/1080); the UI-build companion to this per-ID mapping and the source for the 2026-09-15 template-gap tickets.
- `SKODA-REQUIREMENTS-TRACEABILITY.md` — the bidirectional requirement↔ticket matrix (every ID → ticket → M1/M2 milestone path) + the open-gap register, built from this doc's ticket refs.
- `.migration/plans/url-analysis-comparison.md` + `url-analysis-matrix.json` — the 22-URL block-by-block gap analysis (2026-09-14) that surfaced D18.
- `SKODA-MEDIA-CART-DOWNLOAD.md` — media-cart / download-reduction options (D2).
- `SKODA-EDS-DA-ARCHITECTURE.md` §6 — DA/EW Layout-editability (relevant to §6.1/6.2, D13).
- Source: `../source/CMS-MediaRoomMigration-Requirements-110926-1118-1348.pdf`.
