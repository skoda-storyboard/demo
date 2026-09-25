# Škoda Storyboard & Media Room, Requirement ↔ Ticket Traceability

*Single source of truth linking every client requirement ID to the ticket(s) that satisfy it, its milestone (M1 demo / M2 go-live), and any open gap. Built from the client requirements baseline (`../source/CMS-MediaRoomMigration-Requirements-110926-1118-1348.pdf`), the per-ID status in `SKODA-CLIENT-REQUIREMENTS-MAPPING.md`, the 63-ticket backlog in `../tickets/OVERVIEW.md`, and the decision log (`SKODA-DELIVERY-PLAN.md` §8, D1–D19).*

**Date:** 2026-09-14 · **Coverage:** all 97 functional requirement IDs (COM/STO/MR) + Editorial §6.1–6.9 + Migration MIG01–07 + NFR §8.1–8.6 + the §10 open questions.

**Legend**, Milestone: **M1** = 15 Oct demo · **M2** = 02 Jan go-live · **, ** = no ticket yet. Build: 🟩 built · 🟦 assembly · 🟧 net-new · ⬜ service/deferred. Gap: **✅ covered** (= has a ticket path, *ticketed, NOT built/verified*; several ✅ items carry "validate capability first" caveats in their ticket, e.g. SKODA-809/812) · **⚠️ closeable (resolved below)** · **🔴 GAP, needs client input**.

---

## 1. Common, Stories & Media Room (COM01–19)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status / gap |
|---|---|---|---|:--:|:--:|---|
| COM01 | Site Header | SKODA-301/302 | E03 | M1 | 🟩 | ✅ built (Stories); MR nav variant assembly |
| COM02 | Section Switcher (Stories ↔ MR) | SKODA-301/309 | E03 | M1 | 🟦 | ✅ links built; MR active-state → 309 (sweep 2026-09-25; draft 825 is a duplicate) |
| COM03 | Primary Navigation (per-section sets) | SKODA-301/309 | E03 | M1 | 🟦 | ✅ Stories nav built; MR nav fragment + per-path routing → 309 (sweep 2026-09-25: 16 MR URLs render STO chrome; draft 825 is a duplicate) |
| COM04 | Model / Secondary Navigation | SKODA-301 | E03 | M1 | 🟦 | 🔴 GAP, exact structure TBD (client) |
| COM05 | Language / Country Selector | SKODA-303 / 1003 | E03/E10 | M1 (+M2 locales) | 🟦 | ⚠️ per-page dynamic rule client-confirmed; D1 locale scope open |
| COM06 | Global Search | SKODA-403 / 901 | E04/E09 | M1 (index) / M2 (hosted) | 🟦 | 🔴 GAP, ranking + searchable types (§10 Q9, D6) |
| COM07 | Listing / Filtering | SKODA-401/402 | E04 | M1 | 🟦 | ✅ facet subset (D12); normalization layer |
| COM08 | Content Card (variants) | SKODA-201 | E02 | M1 | 🟩 | ✅ built; News/Media variants to add |
| COM09 | Hero / Page Banner | SKODA-202 | E02 | M1 | 🟩 | ✅ block built; variants identified |
| COM10 | Carousel / Slider | SKODA-201 | E02 | M1 | 🟩 | ✅ built (reused via buildBlock) |
| COM11 | Pagination / Load More | SKODA-402 | E04 | M1 | 🟩 | ✅ built (Stories); listing reuse |
| COM12 | Media Preview, Actions (lightbox) | SKODA-203 | E02 | M1 | 🟦 | ✅ ticketed; a11y focus-trap to verify |
| COM13 | Media Download (single/multi) | SKODA-501/502 | E05 | M1 | 🟦 | ✅ downloads block; masters-only ingest |
| COM14 | Media Cart (retain across browsing) | SKODA-505 (demo) / 902 (prod) | E05/E09 | M1 (happy-path) / M2 (harden) | ⬜ | ✅ D2 = server-side reduction; PoC fallback = unpacked multi-download |
| COM15 | Social Share | SKODA-304/215 | E03/E02 | M1 | 🟦 | ✅ footer follow links built (304); page share float → 215 (sweep 2026-09-25; was unticketed; draft 827 is a duplicate) |
| COM16 | Subscription / Newsletter | SKODA-904 | E09 | M1 (UI only) / M2 (ESP) | ⬜ | ✅ UI-only for PoC confirmed; provider TBD (D4) |
| COM17 | Cookie / Consent | SKODA-804 | E08 | M1 (stub) | ⬜ | ✅ consent OUT of Adobe scope (D10); stub only |
| COM18 | Footer | SKODA-304 / 305 / 309 | E03 | M1 | 🟩 | ✅ Storyboard built; MR footer variant SKODA-305 (PR #134); per-path MR routing → 309 (draft 825 is a duplicate) |
| COM19 | App download Badge | SKODA-304 | E03 | M1 | 🟩 | ✅ built |

---

## 2. Storyboard (§5.2)

### A. Homepage (STO-H01–09), all built on `/en`

| Req | Requirement | Ticket(s) | Epic | M | Build | Status / gap |
|---|---|---|---|:--:|:--:|---|
| STO-H01 | Promotional / Featured Carousel | SKODA-201 | E02 | M1 | 🟩 | ✅ built; 🔴 curation manual-vs-auto (§10 Q11) |
| STO-H02 | Latest Stories | SKODA-402 | E04 | M1 | 🟩 | ✅ built |
| STO-H03 | Models Slider | SKODA-201 | E02 | M1 | 🟩 | ✅ built; source/order 🟡 |
| STO-H04 | eMobility Stories Slider | SKODA-402 | E04 | M1 | 🟩 | ✅ built |
| STO-H05 | Lifestyle Stories Slider | SKODA-402 | E04 | M1 | 🟩 | ✅ built |
| STO-H06 | Škoda World Stories Slider | SKODA-402 | E04 | M1 | 🟩 | ✅ built |
| STO-H07 | Series Slider | SKODA-201 | E02 | M1 | 🟩 | ✅ built; text-clickability + sort 🟡 |
| STO-H08 | Latest News | SKODA-402 | E04 | M1 | 🟩 | ✅ built; 🔴 source + in-scope? (§10 Q12) |
| STO-H09 | Social Media | SKODA-201 | E02 | M1 | 🟩 | ✅ static built; live feed 🔴 (not live at source) |

### B. Category / Subcategory (STO-C01–05)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| STO-C01 | Category Hero | SKODA-202 | E02 | M2 | 🟦 | ✅ components exist; template assembly M2 |
| STO-C02 | Story Results Grid | SKODA-402 | E04 | M2 | 🟦 | ✅ retrieval-by-category proven |
| STO-C03 | Story Card | SKODA-201 | E02 | M1 | 🟩 | ✅ built (component) |
| STO-C04 | Pagination Status | SKODA-402 | E04 | M2 | 🟦 | ✅ load-more built; total-count detail |
| STO-C05 | Load More | SKODA-402 | E04 | M1 | 🟩 | ✅ built (component) |

### C. Series Page (STO-S01–03), pulled into M1 (D18)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| STO-S01 | Series Hero | SKODA-207 | E02 | M1 | 🟦 | ✅ 2-level template (D18) |
| STO-S02 | Series Grid | SKODA-207 | E02 | M1 | 🟦 | ✅ directory grid; ordering 🟡 |
| STO-S03 | Series Card | SKODA-207 | E02 | M1 | 🟦 | ✅ reuses cards |

### D. Model Page (STO-M01–05), M1 demo target

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| STO-M01 | Model Hero | SKODA-202 | E02 | M1 | 🟦 | ✅ hero reused |
| STO-M02 | Featured Model | SKODA-201 | E02 | M1 | 🟦 | 🔴 editorial purpose/config to confirm |
| STO-M03 | Model-related Stories Grid | SKODA-402 | E04 | M1 | 🟦 | ✅ tag-driven; retrieval rules 🟡 |
| STO-M04 | Story Card | SKODA-201 | E02 | M1 | 🟩 | ✅ built |
| STO-M05 | Pagination / Load More | SKODA-402 | E04 | M1 | 🟩 | ✅ built |

### E. Story Detail (STO-D01–10)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| STO-D01 | Story Hero | SKODA-202/603/816 | E02/E06/E08 | M1 | 🟩 | ✅ 48 imported; story hero (title above 16:9) importer in #113, caption styling via 816 |
| STO-D02 | Rich Text | SKODA-801/604/821 | E08/E06 | M1 | 🟦 | ✅ flatten proven (801 merged, #113); 1–2 full-fidelity (604); body inset 821 |
| STO-D03 | Embedded Video | SKODA-204/604/818 | E02/E06/E08 | M1 | 🟦 | ✅ embed autoblock; story importer → bare URL (818, #113) |
| STO-D04 | Image Carousel / Gallery | SKODA-203/604/819 | E02/E06/E08 | M1 | 🟦 | ✅ gallery+lightbox; auto-play a11y 🟡; in-body carousel → Gallery `slider` (819, supersedes 219) |
| STO-D05 | Newsletter Widget | SKODA-904/823 | E09/E08 | M1 (UI) / M2 | ⬜ | ✅ UI-only for PoC; sidebar UI stub 823 = M1 Could |
| STO-D06 | Related Stories (tag+manual) | SKODA-402/212/820 | E04/E02/E08 | M1 | 🟩 | ✅ two mechanisms (auto strip + manual explore-more); the "not-OOTB" fn; bottom dark band 820 |
| STO-D07 | Article Sidebar | SKODA-201/801/817 | E02/E08 | M1 | 🟦 | ✅ two-column aside built in 801 (#113); parity 817 (was M2; review §15) |
| STO-D08 | Side Banner | SKODA-903 | E09 | M2 | ⬜ | 🔴 deferred, bespoke ad server (D3) |
| STO-D09 | Media Box / Gallery | SKODA-502/505/604/801a | E05/E06/E08 | M1 | ⬜ | ✅ manual today; tag-autopopulate+delete = target improvement; 21 in-set stories mapped by 801a |
| STO-D10 | Social Share | SKODA-215 | E02 | M1 | 🟦 | ✅ channels identified; page float dock (share + scroll-top) → 215 (sweep 2026-09-25; 304 ACs cover footer follow links only; draft 827 is a duplicate) |

---

## 3. Media Room (§5.3)

### A. Homepage (MR-H01–10), key M1 assembly

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| MR-H01 | Featured / Promotional | SKODA-201/603 | E02/E06 | M1 | 🟦 | ✅ M1 target |
| MR-H02 | News | SKODA-402 | E04 | M1 | 🟦 | ✅ story-rail reusable |
| MR-H03 | Images | SKODA-203/501/502 | E02/E05 | M1 | 🟦 | ✅ downloads + lightbox |
| MR-H04 | Videos | SKODA-204/503 | E02/E05 | M1 | 🟦 | ✅ embeds + downloadable |
| MR-H05 | Models | SKODA-201 | E02 | M1 | 🟩 | ✅ rail/card reusable |
| MR-H06 | Press Kits | SKODA-402/802 | E04/E08 | M1 (rail) / M2 (detail) | 🟦 | ✅ card + shared listing; fields 🟡 |
| MR-H07 | Latest Stories | SKODA-402 | E04 | M1 | 🟩 | ✅ reusable |
| MR-H08 | Media Cart | SKODA-505 | E05 | M1 | ⬜ | ✅ device-ID; reduction server-side (D2) |
| MR-H09 | Media Lightbox | SKODA-203 | E02 | M1 | 🟦 | ✅ lightbox |
| MR-H10 | Contacts / Company Content | SKODA-201 | E02 | M2 | 🟦 | 🔴 GAP, homepage placement TBD |

### B. Shared Listing (MR-L01–06), one engine

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| MR-L01 | Listing Search | SKODA-403 | E04 | M1 (index) | 🟦 | 🔴 GAP, relationship w/ global search (§10 Q9, D6) |
| MR-L02 | Content-Type Filter | SKODA-402 | E04 | M1 | 🟦 | ✅ one shared engine confirmed live (§11.6) |
| MR-L03 | Faceted Filters | SKODA-401 | E04 | M1 | 🟦 | ✅ D12 subset; 🔴 advanced-filter deep-dive + per-section scoping (§10 Q4) |
| MR-L04 | Result Grid/List | SKODA-201/402 | E02/E04 | M1 | 🟦 | ✅ card + grid |
| MR-L05 | Result Card (per type) | SKODA-201 | E02 | M1 | 🟦 | 🔴 GAP, per-type card definitions to finalise |
| MR-L06 | Pagination / Load More | SKODA-402 | E04 | M1 | 🟩 | ✅ 6-per-click + total + sort confirmed |

### C. Press Release / News (MR-PR01–07)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| MR-PR01 | Press Release Header | SKODA-607 | E08 | M1 | 🟦 | ✅ own two-column shell (MR side, no hero), SKODA-607, **not** the story shell (corrected 2026-09-15) |
| MR-PR02 | Structured Article Content | SKODA-802 | E08 | M2 | 🟦 | 🔴 authoring model (DA vs UE, D13) |
| MR-PR03 | AI-Generated Audio Reading | SKODA-204 | E02 | M1 (embed) | 🟦 | ✅ drop-in vendor JS; must stay (podcast excluded). NB: it's an *arbitrary third-party widget*, not one of 204's 4 named oEmbed providers, 204 now explicitly carries it via the `widget` autoblock / generic-embed branch (F7) |
| MR-PR04 | PDF Download | SKODA-503 | E05 | M2 | 🟦 | 🔴 GAP, authored vs generated (§11.3) |
| MR-PR05 | Infographic (preview→PDF) | SKODA-502 | E05 | M2 | 🟦 | ✅ pattern identified |
| MR-PR06 | Video (playback + download) | SKODA-204/503 | E02/E05 | M2 | 🟦 | ✅ dual path |
| MR-PR07 | Media Downloads | SKODA-502 | E05 | M2 | 🟦 | ✅ downloads block |

### D. Press Kit (MR-PK01–07)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| MR-PK01 | Press Kit Header | SKODA-805 | E08 | M2 (Stretch demo) | 🟧 | ✅ hub type; walkthrough 🟡 (§10 Q6) |
| MR-PK02 | Structured Narrative | SKODA-805 | E08 | M2 | 🟧 | ✅ conditional sections (resolved 2026-09-14) |
| MR-PK03 | Variant / Bodywork Selector | SKODA-808 | E08 | M2 | 🟧 | 🔴 GAP, interaction TBD (§11.9) |
| MR-PK04 | Grouped Content (5 areas) | SKODA-806 | E08 | M2 | 🟧 | ✅ 5 areas confirmed (+PDF/infographics); conditional |
| MR-PK05 | FAQ | SKODA-807 | E08 | M2 | 🟧 | 🔴 GAP, per-kit vs shared pool (§11.10) |
| MR-PK06 | Individual Asset Download | SKODA-502/806 | E05/E08 | M2 | 🟦 | ✅ downloads block |
| MR-PK07 | Complete Press Kit ZIP | SKODA-806/902 | E08/E09 | M2 | ⬜ | ✅ PoC fallback = unpacked multi-download (D2) |

### E. Model Page, MR (MR-M01–07)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| MR-M01 | Model Hero / Header | SKODA-202 | E02 | M1 | 🟦 | ✅ hero reused |
| MR-M02 | Model / Bodywork Selector | SKODA-808 | E08 | M2 | 🟧 | 🔴 GAP, selector interaction (shared w/ PK03) |
| MR-M03 | Model-related News | SKODA-402 | E04 | M1 | 🟦 | ✅ tag-driven; retrieval 🟡 |
| MR-M04 | Model-related Press Kits | SKODA-402 | E04 | M1 | 🟦 | ✅ tag-driven |
| MR-M05 | Model-related Stories | SKODA-402 | E04 | M1 | 🟦 | ✅ tag-driven |
| MR-M06 | Model-related Images | SKODA-402/505 | E04/E05 | M1 | 🟦 | ✅ + download |
| MR-M07 | Model-related Videos | SKODA-402/204 | E04/E02 | M1 | 🟦 | ✅ tag-driven |

### F. Images (MR-I01–05), full listing pulled into M1 (D18)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| MR-I01 | Image Listing | SKODA-402 | E04 | M1 | 🟦 | ✅ D18 |
| MR-I02 | Image Filters | SKODA-401 | E04 | M1 | 🟦 | ✅ facet subset |
| MR-I03 | Image Preview (lightbox) | SKODA-203 | E02 | M1 | 🟦 | ✅ lightbox |
| MR-I04 | Download Rendition | SKODA-503/505 | E05 | M1 | ⬜ | ✅ Original/1920px dual-rendition; D2 |
| MR-I05 | Add to Cart | SKODA-505 | E05 | M1 | ⬜ | ✅ per-item cart |

### G. Videos (MR-V01–04), full listing pulled into M1 (D18)

| Req | Requirement | Ticket(s) | Epic | M | Build | Status |
|---|---|---|---|:--:|:--:|---|
| MR-V01 | Video Listing | SKODA-402 | E04 | M1 | 🟦 | ✅ D18 |
| MR-V02 | Video Filters | SKODA-401 | E04 | M1 | 🟦 | ✅ facet subset |
| MR-V03 | Video Preview / Playback | SKODA-204 | E02 | M1 | 🟦 | ✅ Vimeo/YouTube embed |
| MR-V04 | Video Download | SKODA-503 | E05 | M2 | 🟦 | 🔴 GAP, DAM/source-file model TBD |

---

## 4. Editorial / Authoring / DAM (§6)

| Req | Requirement | Ticket(s) | Epic | M | Status / gap |
|---|---|---|---|:--:|---|
| 6.1 | Reusable page structures / templates | SKODA-801/802 | E08 | M1/M2 | 🔴 DA vs UE (D13, architecture-critical) |
| 6.1a | Company/Page family (5 sub-types) | SKODA-810 | E08 | M2 | ✅ deferred to M2 (D18) |
| 6.2 | Content creation & config (variants) | SKODA-201 | E02 | M1 | ✅ editability fix shipped; model choice D13 |
| 6.3 | Preview & publishing lifecycle | SKODA-602 | E06 | M1 (core) / M2 (schedule/review) | ✅ core proven; scheduled/review not native |
| 6.4 | Roles & permissions (7 groups) | SKODA-809 | E08 | M2 | ✅ ticketed (was G2); blocked on RACI (D15) |
| 6.5 | Restricted pre-publication (embargo) | SKODA-811 | E08 | M2 | ✅ ticketed (was G3); approach agreed (group access + staged-publish, D9). M1-Stretch only in *ungated* form, group-gate depends on SKODA-809 (M2, blocked on D15), so the full §6.5 embargo is M2 (F4) |
| 6.6 | Restricted article access (QR) | SKODA-906 | E09 | M2+ | ✅ ticketed (was G4); investigation, model undefined (D17) |
| 6.7 | Auditability (change history) | SKODA-812 | E08 | M2 | ✅ ticketed (was G5); validate EDS/DA capability first |
| 6.8 | Language & market setup | SKODA-1001/1002/1003 | E10 | M2 | ✅ per-page selector confirmed; manual copy-to-translate; D1 |
| 6.9 | DAM (renditions/rights/reuse) | SKODA-501/504/506 | E05 | M1/M2 | ✅ AEM Assets (D5); pre-conditioning; Dynamic Media 🟠 |

---

## 5. Content Migration (§7, MIG01–07)

All MIG IDs map to the import infra (SKODA-601/602) for the demo sample and SKODA-803 for bulk at scale. Bulk automated migration is **out of the PoC (§9)**, demo uses a representative hand-carried set.

| Req | Requirement | Ticket(s) | Epic | M | Status |
|---|---|---|---|:--:|---|
| MIG01 | Establish migration inventory | SKODA-601 | E06 | M2 | ✅ scale measured |
| MIG02 | Migrate historical content + media | SKODA-803 | E08 | M2 | ✅ bulk deferred (§9); demo sample only |
| MIG03 | Map structures → AEM/EDS | SKODA-601/801 | E06/E08 | M1/M2 | ✅ parsers/transformers |
| MIG04 | Preserve metadata/categorisation/locale | SKODA-601/1001 | E06/E10 | M1/M2 | ✅ metadata-normalization layer |
| MIG05 | Preserve content↔asset relationships | SKODA-502/504 | E05 | M1/M2 | ✅ downloads + asset manifest |
| MIG06 | Preserve URLs + redirects | SKODA-103 | E01 | M1 (sheet) / M2 (execution) | ⚠️ redirect *execution* pre-go-live (§9); sheet planned |
| MIG07 | Validate + document exceptions | SKODA-603/803 | E06/E08 | M1/M2 | ✅ pilot validation proven |

---

## 6. Non-Functional (§8)

| Req | Requirement | Ticket(s) | Epic | M | Status / gap |
|---|---|---|---|:--:|---|
| 8.1 | URL & SEO | SKODA-103 | E01 | M1 / M2 | ✅ canonical HTML; 🔴 full redirect map deferred; SEO config to validate |
| 8.2 | Analytics & tracking | SKODA-804/905 | E08/E09 | M2 | ✅ analytics IN scope (D10); bespoke-layer need to confirm |
| 8.3 | Cookie consent | **, ** |, |, | ✅ OUT of Adobe scope (D10), stays with Škoda |
| 8.4 | Newsletter / subscription | SKODA-904 | E09 | M2 | ✅ UI-only PoC; ESP M2 (D4) |
| 8.5 | Performance (CWV) | SKODA-702 | E07 | M1 | ✅ partial fixes shipped; 🔴 target thresholds TBD (client) |
| 8.6 | Accessibility | SKODA-302/703 | E03/E07 | M1 | ✅ audit ticketed; 🔴 WCAG level TBD (client) |

---

## 7. Reverse index, ticket → requirements it satisfies

| Ticket | Milestone | Satisfies (req IDs) |
|---|:--:|---|
| SKODA-101–106 | M1 | Foundation (enables all), 103→MIG06/8.1; 104→COM06/07 |
| SKODA-201 | M1 | COM08, COM10, STO-H01/03/07/09, STO-C03, STO-M02/04, STO-D07, MR-H01/05, MR-L04, 6.2 |
| SKODA-202 | M1 | COM09, STO-C01, STO-D01, STO-M01, MR-M01 |
| SKODA-203 | M1 | COM12, MR-H03/H09, MR-I03, STO-D04 |
| SKODA-204 | M1 | STO-D03, MR-H04, MR-PR03/PR06, MR-V03 |
| SKODA-205 | M1 | (tags/metadata, supports STO-D01, listings) |
| SKODA-206 | M1 | Škodapedia glossary (§9, likely-excluded; kept per controlled-simplification) |
| SKODA-207 | M1 | STO-S01/S02/S03 |
| SKODA-208 | M2 | STO-M (model page template, `skoda_model` CPT) |
| SKODA-209 | M2 | STO-C (category/tag archive template) |
| SKODA-210 | M2 | STO custom microsite (`template-custom-full-width`, event-gallery/campaign, 201 pages; block recount) |
| SKODA-301/302 | M1 | COM01/02/03/04, 8.6 (mobile ARIA) |
| SKODA-303 | M1 | COM05 |
| SKODA-304 | M1 | COM15/18/19 (footer follow links) |
| SKODA-305 | M1 | COM18 (MR footer variant) |
| SKODA-215 | M1 | COM15, STO-D10 (page float dock: share + scroll-top; parallel sweep 88c1b48) |
| SKODA-309 | M1 | COM02/03/18 (MR nav, active tab, per-path nav/footer metadata; parallel sweep 88c1b48) |
| SKODA-827 | — (draft folded into 215 and removed, 2026-09-25) | COM15, STO-D10 → see SKODA-215 |
| SKODA-825 | — (draft folded into 309 and removed, 2026-09-25) | COM02/03/18 → see SKODA-309 |
| SKODA-826 | M1 (draft) | no requirement ID; visual-parity fix feeding the 704 sign-off (global page gutter; follow-up to 106) |
| SKODA-212a | M1 | rail interaction (desktop click/drag; follow-up to 212, sweep §11.1 V1) |
| SKODA-204a | M1 | STO-D03, MR-PR03/PR06, MR-V03 (consent click-to-load hook; follow-up to 204) |
| SKODA-611a / 611b | M1 (Must / Should) | STO home composition (`template-home.md` 9-section stack; slices of 611) |
| SKODA-401 | M1 | COM07, MR-L03, MR-I02, MR-V02 |
| SKODA-402 | M1 | COM07/11, STO-H02/04/05/06/08, STO-C02/04/05, STO-D06, MR-H02/06/07, MR-L02/04/06, MR-M03–07, MR-I01, MR-V01 |
| SKODA-403 | M1 | COM06, MR-L01 |
| SKODA-501/502 | M1 | COM13, MR-H03, MR-PR05/07, MR-PK06, STO-D09, MIG05, 6.9 |
| SKODA-503 | M1/M2 | MR-PR04/06, MR-V04, MR-I04 |
| SKODA-504/506 | M1 | 6.9, MIG04/05 (asset mapping + pre-conditioning) |
| SKODA-505 | M1 | COM14, MR-H08, MR-I05, STO-D09 (cart) |
| SKODA-601/602 | M1 | MIG01/03/04/07, 6.3 |
| SKODA-603 | M1 | STO-D01, MR-H01, MR-PR01, MIG07 |
| SKODA-604 | M1 | STO-D02/03/04/09 (full-fidelity restore) |
| SKODA-607 | M1 | MR-PR (press-release detail template, own two-column shell, MR side) |
| SKODA-701–704 | M1 | 8.5, 8.6, consent/analytics stubs (8.2/8.3) |
| SKODA-706 | M2 | branded 404 template (keeps STO chrome, real HTTP 404) |
| SKODA-801 | M1 | STO-D02, MR-PR01, 6.1, MIG03 |
| SKODA-802 | M2 | 6.1 (Škodapedia + pages), MR-H06/PR02 |
| SKODA-803 | M2 | MIG02, MIG07 |
| SKODA-804 | M2 | COM17, 8.2, 8.3 |
| SKODA-805/806/807/808 | M2 | MR-PK01–07, MR-M02 (selector) |
| SKODA-809 | M2 | 6.4 (roles & permissions) |
| SKODA-810 | M2 | 6.1a (company/Page family) |
| SKODA-811 | M2 | 6.5 (content embargo) |
| SKODA-812 | M2 | 6.7 (auditability) |
| SKODA-813 | M2 | generic Page base shell (`page-template-default`, copyright/legal/misc STO pages) |
| SKODA-814 | M2 | SiteOrigin body flatten contract (1,614 pages, feeds 801/208/813; block recount) |
| SKODA-816 | M1 | STO-D01 (story hero: title above 16:9 image, perex, date, Tags) |
| SKODA-817 | M1 | STO-D07 (sidebar dedupe + parity), STO-D06 (explore-more teasers) |
| SKODA-818 | M1 | STO-D03 (story embeds → 204 autoblock) |
| SKODA-819 | M1 | STO-D04 (in-body carousel → Gallery `slider`; supersedes SKODA-219) |
| SKODA-820 | M1 | STO-D06 (tag-based "Related Stories" dark band) |
| SKODA-821 | M1 | STO-D02 (body-column text inset) |
| SKODA-822 | M1 | release of 801 layout (done, PR #113) |
| SKODA-823 | M1 Could | STO-D05 (newsletter UI stub, no ESP) |
| SKODA-901 | M2 | COM06 (hosted search) |
| SKODA-902 | M2 | COM14/MR-PK07 (prod cart + ZIP hardening) |
| SKODA-903 | M2 | STO-D08 (banner) |
| SKODA-904 | M2 | COM16, STO-D05, 8.4 |
| SKODA-905 | M2 | 8.2 (analytics dataLayer) |
| SKODA-906 | M2+ | 6.6 (QR restricted end-user access) |
| SKODA-1001/1002/1003 | M2 | COM05, 6.8, MIG04 |

*Every ticket SKODA-101…1003 + the 2026-09-14 gap tickets (305, 809, 811, 812, 906) + the 2026-09-15 ui-specs template-gap tickets (607, 208, 209, 706, 813) appears above. Tickets with no direct requirement (101,102,104,105,106,205,206,701–704) are foundation/quality enablers noted in-line.*

---

## 8. Milestone paths

### M1, Demo (15 Oct 2026)
**Foundation →** 101 → 102 → {103, 104, 105, 106}
**Blocks & chrome (parallel) →** 201, 202, 203, 204, 205, 206, **207**, 301, 302, 303, 304, **305** (MR footer)
**Listings/search + media + import →** 401, 402, 403, 501, 502, 503, 504, **505**, 506, 601, 602
**Content →** 603 (pilot pages), **604** (full-fidelity stories), **607** (press-release detail template, ~47.5% of MR pages), **801** (story flatten, M1 slice)
**Integrate & QA →** 701, 702, 703, 704
*Delivers: Storyboard home + stories (incl. 1–2 full-fidelity) + Model + Series; Media Room home + Images/Videos listings + cart; EN+CS; the not-OOTB trio.*

> **Update (2026-09-24, M1 gap review, [`SKODA-M1-GAP-REVIEW.md`](../reviews/SKODA-M1-GAP-REVIEW.md)).**
>
> **Scope.** The M1 scope is now the canonical **43-URL set**, [`skoda-m1-url-set.txt`](./skoda-m1-url-set.txt), plus
> the rail-feed corpus. The MR home and news listing are **not** in the set.
>
> **Pulled into M1 by the set:**
> - **208** (model page: STO-M / MR-M)
> - **805a** (press-kit hub, MR-PK01/04/06) and **805c** (default press-kit article, MR-PK02); **805b** children
>   are Could. §14 of the review proposes adding MR-PK07 (whole-kit ZIP link) to 805a
> - **819** (supersedes 219) + **801a** (story in-body carousel, Media Box, embeds: STO-D); story fidelity **816/817/818/820/821** (review §15)
> - **608** (image/video item rows: MR-I/MR-V listings + model media rails)
> - **609** (link containment + alias redirect: COM, MIG06)
>
> **Paused or moved to M2:** 403 (search), 207's directory half (`/en/series-2/`), 216, 405, 507.
>
> The review's §9 holds the Must/Should/Could cut line, and §10 the collision-safe waves (freeze 8 Oct, dry run
> 9–14 Oct).

### M2, Go-live (02 Jan 2027)
**Editorial at scale (E08) →** 802 (remaining templates), 803 (bulk import), 804 (consent+analytics), 805/806/807/808 (press-kit), 810 (company/Page family), **813 (generic Page base shell)**, **814 (SiteOrigin body flatten contract)**, **809 (roles), 811 (embargo), 812 (audit)**
**Templates (E02) →** ~~**208** (model page)~~ → M1 (2026-09-24 gap review), **209** (category/tag archive), **210** (custom microsite family), measured template specs, deferred behind the M1 core
**Dynamic services (E09) →** 901 (hosted search), 902 (cart hardening), 903 (banners), 904 (newsletter), 905 (analytics rebuild), **906 (QR restricted access)**
**Integration/QA (E07) →** **706** (branded 404)
**Localization (E10) →** 1001 (per-locale index), 1002 (translation rollout), 1003 (routing)
**Governance layer (now ticketed):** roles → SKODA-809, embargo → SKODA-811, audit → SKODA-812 (all E08); QR access → SKODA-906 (E09). All gated on their decisions (D15/D9/D16/D17); none block M1.

---

## 9. Gap register, what's not fully closed

**Closed this pass (⚠️ → resolved with rationale):**
- **COM05 / 6.8**, per-page language selector + manual copy-to-translate model confirmed on the 2026-09-14 call; ticket path SKODA-303 (M1) + 1001–1003 (M2). Remaining open = D1 definitive locale list (client).
- **MR-PK02**, narrative sections confirmed *conditional* (not fixed); SKODA-805 field model resolved.
- **COM14 / MR-PK07**, download packaging: server-side reduction (D2) with an agreed **unpacked multi-download PoC fallback**; SKODA-505 (demo) / 902 (prod).
- **MIG06**, redirect *sheet* in SKODA-103 (M1); *execution* correctly deferred to pre-go-live (§9).

**✅ G1–G5 closed with tickets (2026-09-14), every requirement now has a ticket path:**

| # | Gap | Where | Ticket created | M |
|---|---|---|---|:--:|
| G1 | Media Room footer variant (differs from Storyboard footer) | COM18 | **SKODA-305** (E03) | M1 |
| G2 | Roles & permissions (7 editorial groups) | §6.4 | **SKODA-809** (E08) | M2 |
| G3 | Content embargo (staged-publish, group access) | §6.5 | **SKODA-811** (E08) | M2 |
| G4 | QR restricted end-user access | §6.6/D17 | **SKODA-906** (E09) | M2+ |
| G5 | Auditability (author change-history) | §6.7 | **SKODA-812** (E08) | M2 |

Backlog **51 → 56 tickets, 220 → 237 SP** (E03 +2, E08 +10, E09 +5). G1 (SKODA-305) is M1; the rest are the M2 governance layer, each gated on its decision (D15 roles, D9 embargo, D16 audit, D17 QR), **none blocks the M1 demo**.

**Template-gap tickets (2026-09-15, ui-specs measured-spec initiative):** the live-DevTools template census (`../ui-specs/_TEMPLATES.md`) confirmed five page types lacking a dedicated ticket, **SKODA-607** press-release detail template (own two-column shell, *not* the story shell → M1, E08, +5), **SKODA-208** model page (`skoda_model` CPT: hero + icon nav + 5 rails → M2, E02, +5), **SKODA-209** category/tag archive (hero + card grid, no facets → M2, E02, +3), **SKODA-706** branded 404 (→ M2, E07, +1), **SKODA-813** generic Page base shell (`page-template-default` → M2, E08, +2). Backlog **56 → 61 tickets, 237 → 253 SP**. Only SKODA-607 is M1 (press releases are ~47.5% of MR pages); the rest are M2. See `../ui-specs/README.md` for the per-component coverage matrix these tickets trace to.

**Block-recount cross-check tickets (2026-09-15):** the full-site block recount (`../analysis/SKODA-BLOCK-RECOUNT.md`, 3,499 EN URLs, both sides) surfaced two high-frequency unspecced regions, now ticketed: **SKODA-210** custom microsite (`template-custom-full-width` event-gallery/campaign, **201 pages**, carries a migrate/fold/drop decision → M2, E02, +3) and **SKODA-814** SiteOrigin body-flatten contract (**1,614 pages**, the flatten machinery SKODA-801 depends on → M2, E08, +5). Backlog **61 → 63 tickets, 253 → 261 SP**. The recount also reconciled (no new ticket) that SKODA-808's variant *selector* has no live source precedent (net-new EDS affordance pending MR-PK03) and SKODA-807's FAQ shares the generic `row_toggle` accordion primitive.

**🔴 Remaining open gaps, needs client input (not build blockers; resolve at design / Wed 2026-09-16):**

| # | Gap | Where | Recommendation |
|---|---|---|---|
| G6 | **§10 open questions (12)**, cart page structure, advanced-filter deep-dive, 2-col/6-card spec, press-kit walkthrough, subscription registration/wording, search ranking, definitive locales, featured curation, Latest-News source, share level, sorting | client §10 | Drive to owner+date on Wed 2026-09-16; several sharpen specs on existing tickets (401/402/505/805/904), none add a new ticket by itself |
| G7 | **Per-type Result Card definitions (MR-L05)** + **Contacts placement (MR-H10)** + **Featured Model config (STO-M02)** | listing/MR | Spec-level detail on existing tickets (201/402); confirm during design |
| G8 | **NFR thresholds**, WCAG level (8.6), CWV targets (8.5), analytics event schema (8.2) | §8 | Client/architecture to set; tickets exist (702/703/804/905) |

G6–G8 are **spec/decision clarifications on existing tickets**, not missing tickets.

**QA-discovered follow-up tickets (2026-09-14, agent-team cycle 1, independent QA pass on the live `localhost:3000/en/` homepage):** the homepage was verified **at demo-grade fidelity** (all query-index rails populate; typography / brand-green #0e3a2f / spacing / responsive all measured as matching source). Three findings became follow-up tickets:

| # | Ticket | Finding | Status |
|---|--------|---------|--------|
| QA-F1 | **SKODA-605** (E06, M1) | Models/Series rail + "All" links are absolute `skoda-storyboard.com` URLs (leave the demo) → transformer link-rewrite | **Implemented (transformer); QA-blocked** on a clean re-import + publish |
| QA-F2 | **SKODA-606** (E06, M1) | Stray "Manage Cookies" consent text node in Latest News → transformer strip | **Implemented (transformer); QA-blocked** on re-import |
| QA-F3 | **SKODA-705** (E07, M1) | "Load more" button = bordered pill vs source white-fill (cosmetic) | **Held, needs design/client confirm** (don't alter brand styling on assumption) |

**Cycle-1 convergence note:** no ticket reached `DONE` this cycle. Every actionable homepage QA finding routes to either **content-regeneration** (605/606, codeable now, but end-to-end QA is blocked on DA publish credentials + reindex, which aren't available) or a **design decision** (705). This is the honest state: the built `/en` slice is demo-grade, the transformer fixes are written and lint-clean, but they cannot be QA-verified to `DONE` without a live re-import/publish cycle. Per the operating model, tickets stay open until QA verifies the rendered result, they are **not** marked done on an unverified change.

**M1 gap review (2026-09-24, 43-URL set).** Full register: [`SKODA-M1-GAP-REVIEW.md`](../reviews/SKODA-M1-GAP-REVIEW.md) §8. The new ticketed gaps are:

| # | Gap | Requirement IDs | Ticket | M |
|---|---|---|---|:--:|
| G-02 | `skoda-carousel-widget` (in-body image carousel) unspecced and dropped by import on 21/21 in-set stories | STO-D (body media), COM (gallery) | ~~SKODA-219~~ **SKODA-819** (Gallery `slider`), **SKODA-801a** | M1 |
| G-03 | Story Media Box and Vimeo dropped by the story importer | STO-D, COM14 | **SKODA-801a** (Media Box); Vimeo fixed by SKODA-818 (#113) | M1 |
| G-04 | No image/video item index rows: empty listings and model media rails | MR-I01–05, MR-V01–04, MR-M rails | **SKODA-608** | M1 |
| G-05/06/07 | Press-kit hub, children and default template have no M1 path | MR-PK01/02/04/06 (PK07 per review §14) | **SKODA-805a** (Must), **805c** (Should), **805b** (Could) | M1 |
| G-08 | Model page runtime blocks missing (in-page-nav, key-facts, spec-table) | STO-M, MR-M | SKODA-208 → **M1** | M1 |
| G-10/11 | Out-of-set links → in-site 404s; mixed-reality alias | COM (nav), MIG06 | **SKODA-609** | M1 |
| G-12 | PR importer drops Buzzsprout AI-audio (MR-PR03) and the related rail | MR-PR03, MR-PR01 | SKODA-607 (AC extended) | M1 |
| C-1…C-9 | Client scope doc (16 Sep) promises vs the 43-URL set: MR home, series directory, CS pages, press kit end to end + ZIP, share, embargo, search sample, sidebar | MR-H01–10, STO-S01–03, COM05, MR-PK01/02/04/07, COM15, STO-D10, 6.5, COM06, STO-D07 | review **§14** (decisions D-7…D-9) | M1 |

This review also records the 2026-09-21 media-cart correction: the M1 path is **AEM DAM originals + client-side
`fflate` ZIP** (`SKODA-DEMO-FALLBACK-CONFIRM.md`). It supersedes the "server-side reduction (D2)" wording in the
"Closed this pass" list above for M1.

---

## 10. Cross-references
- `SKODA-POC-URL-SET.md` + `skoda-poc-urls.json`/`.txt`, the minimal set of live source URLs (24) that exercises every template/variant/functionality across both sites; importer-ready.
- `SKODA-POC-COVERAGE-MATRIX.md`, three-way join of those 24 URLs × components/blocks × client requirement IDs (this matrix's §7 reverse index is the source for its requirement→URL column); proves the PoC URL set covers the PDF baseline. The 2026-09-15 nav/footer sweep behind it surfaced 6 previously-uncatalogued page types (Škodapedia archive+term, newsletter archive/settings, media-cart page, BGC landing, `/en/documents/`) and corrected two assumptions (Podcast is a live category page, not a 301; Škodapedia is internal, reopening the §9 "external" assumption).
- `../source/CMS-MediaRoomMigration-Requirements-110926-1118-1348.pdf`, the authoritative requirement baseline (97 IDs + §6/§7/§8/§9/§10/§11).
- `SKODA-CLIENT-REQUIREMENTS-MAPPING.md`, per-ID build status + narrative (the source for this matrix's ticket links).
- `../tickets/OVERVIEW.md`, the 63-ticket / 261-SP backlog register.
- `../ui-specs/README.md` + `../ui-specs/_TEMPLATES.md`, measured component/template spec library (live-DevTools DOM+CSS at 768/992/1080); the source for the 2026-09-15 template-gap tickets (607/208/209/706/813) and the UI-build companion to this requirement→ticket map.
- `SKODA-DELIVERY-PLAN.md` §8, decision log D1–D19; §2/§3, M1/M2 scope.
- `SKODA-SOLUTION-DESIGN.html`, the Minimum/Target/Stretch PoC tiering that overlays these milestones.
- `SKODA-M1-DEMO-TARGET.md`, the demo definition-of-done.
