# Škoda PoC — URL × Component × Client-Requirement Coverage Matrix

*Three-way join: each of the 24 minimal PoC URLs → the components/blocks it exercises → the client requirement IDs (from the extracted `CMS-MediaRoomMigration-Requirements` PDF) it demonstrates. Proves the PoC URL set covers the client's requirement baseline, and shows which URL is the evidence for each requirement.*

**Date:** 2026-09-15 · **Sources joined:** `SKODA-POC-URL-SET.md` (URLs + per-URL coverage), `SKODA-MASTER.md` §4 + this repo's `blocks/` (components), `SKODA-REQUIREMENTS-TRACEABILITY.md` §7 reverse index + the client PDF (requirement IDs). Requirement→ticket→URL links are grounded in the traceability reverse index, not inferred.

**Legend — component build state:** 🟩 built · 🟦 assembly · 🟧 net-new · ⬜ external/non-native.

---

## 1. Matrix — per URL: components exercised → client requirement IDs demonstrated

| # | URL | Template | Components / blocks exercised | Client requirement IDs demonstrated |
|---|-----|----------|-------------------------------|--------------------------------------|
| 1 | `/en/` | Storyboard home | cards-overlay/media 🟩, carousel 🟩, stories 🟩, story-rail 🟩, hero-image 🟩, header/footer 🟩 | **STO-H01–H09**; COM01/02/03/08/09/10/11/15/18/19 |
| 2 | `/en/lifestyle/people/the-story-of-olive-oil…/` | Story detail (full-fidelity) | hero 🟩, gallery+lightbox 🟧, embed(YouTube) 🟦, media-box/cart 🟧⬜, story-rail 🟩, tags 🟩 | **STO-D01, D02, D03, D04, D06, D07, D09, D10**; COM12/13/14 |
| 3 | `/en/category/emobility/` | Category listing | query-index listing 🟦, cards 🟩, load-more 🟩 | **STO-C01–C05**; COM07/11 |
| 4 | `/en/tag/model/elroq/` | Tag/model listing | CTA hero 🟦, faceted/tag listing 🟦, cards 🟩, load-more 🟩 | **STO-C01–C05** (listing pattern); COM07/11 (model-tag facet) |
| 5 | `/en/series-2/` | Series directory | series-directory grid 🟦, hero 🟩, cards 🟩 | **STO-S02, S03**; COM08 |
| 6 | `/en/series/125-years-of-motorsport/` | Series hub | series-hub curated grid 🟦, hero 🟩, cards 🟩 | **STO-S01, S03** |
| 7 | `/en/skoda-model/peaq/` | Storyboard model page | hero 🟩, story-rail ×5 tag-driven 🟩, cards 🟩 | **STO-M01–M05** |
| 8 | `/en/category/podcast-en/` | Category page (podcast) | query-index listing 🟦, cards 🟩 | STO-C0x (podcast variant) — *§9 candidate-to-drop* |
| 9 | `/en/skodapedia/` | Škodapedia archive 🆕 | glossary A–Z index 🟧, letter/category filter 🟧 | **6.1** (template family); ticket SKODA-206/802 — *§9: reopen "external" assumption* |
| 10 | *(Škodapedia term detail — URL TBD)* | Škodapedia term 🆕 | glossary term-detail 🟧 | **6.1**; SKODA-206 — *item needs a concrete term URL* |
| 11 | `/en/media-room/` | Media Room home | 7 rails (cards/carousel/story-rail) 🟦, media-cart affordance ⬜, MR footer variant 🟦 | **MR-H01–H10**; COM01/02/03/18 (MR footer) |
| 12 | `/en/news/` | Shared faceted listing (baseline) | faceted-listing 🟧, cards 🟩, load-more 🟩, sort 🟦 | **MR-L01–L06**; COM06/07/11; MR-H02 |
| 13 | `/en/images/` | Images listing | advanced facets 🟧, gallery+lightbox 🟧, dual-rendition download ⬜, media-cart ⬜ | **MR-I01–I05**; MR-L03; COM12/13/14 |
| 14 | `/en/videos/` | Videos listing | Vimeo embed grid 🟦, MP4 download ⬜, media-cart ⬜ | **MR-V01–V04**; MR-H04; COM13/14 |
| 15 | `/en/press-kits/skoda-epiq-press-kit-2/` | Press-kit hub | press-kit TOC 🟧, resource-tab nav 🟧, whole-kit ZIP ⬜, FAQ/accordion 🟧 | **MR-PK01, PK04, PK05, PK07** |
| 16 | `/en/press-kits/…/exterior-…/` | Press-kit chapter | article body 🟦, chapter sub-nav 🟧, gallery 🟧, large media-box ⬜ | **MR-PK02, PK06**; MR-PR01/02 (structured body) |
| 17 | `/en/press-kits/…/infographics/` | Press-kit resource | infographics preview→PDF/JPG 🟦 | **MR-PK04**; MR-PR05 (infographic) |
| 18 | `/en/press-releases/skoda-superb-…/` | Press-release detail | AI-audio embed ⬜, article body 🟦, media-box ⬜, tags 🟩 | **MR-PR01, PR02, PR03, PR04, PR06, PR07** |
| 19 | `/en/board-of-management/` | Company: exec-bio | exec-bio accordion 🟧, gallery 🟧, downloads ⬜ | **6.1** (company/Page); SKODA-810 |
| 20 | `/en/annual-reports/` | Company: download-list | download-list 🟧, PDF links ⬜ | **6.1, 6.9** (DAM/downloads); SKODA-810 |
| 21 | `/en/company-logo/` | Company: brand-asset grid | brand-asset grid 🟧, dual PDF+PNG download ⬜ | **6.1, 6.9**; SKODA-810 |
| 22 | `/en/skoda-media-services-application/` | Company: app-promo | app-promo 🟧, QR, app-store badges 🟩 | **6.1**; **COM19** (app badge); SKODA-810 |
| 23 | `/en/contacts/` | Company: contact directory | contact-directory 🟧 | **MR-H10** (contacts/company); **6.1**; SKODA-810 |
| 24 | `/en/newsletter/` | Newsletter archive+signup 🆕 | newsletter archive 🟧, signup form (UI) 🟦 | **COM16**, **STO-D05**, **8.4** (subscription) |

---

## 2. Reverse view — client requirement → the PoC URL(s) that demonstrate it

Confirms **every requirement group has ≥1 covering URL** in the set (or an explicit gap).

| Requirement group (client PDF) | Demonstrated by URL(s) |
|---|---|
| **COM01–19** Common (header/nav/switcher/cards/hero/carousel/pagination/media-preview/download/**cart**/share/subscription/consent/footer/app-badge) | #1 + #11 (chrome + switcher + MR footer), #2/#13/#14 (media preview/download/cart), #24 (subscription), #22 (app badge). *Consent COM17 = out of Adobe scope (D10) — no build URL needed.* |
| **STO-H01–H09** Storyboard homepage | #1 |
| **STO-C01–C05** Category pages | #3 (+ #4 model-tag variant) |
| **STO-S01–S03** Series | #5 (directory) + #6 (hub) |
| **STO-M01–M05** Storyboard model | #7 |
| **STO-D01–D10** Story detail | #2 (full-fidelity: hero/rich-text/embed/gallery/related/sidebar/media-box/share); D05 newsletter also #24; D08 side-banner is deferred (D3) |
| **MR-H01–H10** MR homepage | #11 (+ #23 for MR-H10 contacts) |
| **MR-L01–L06** Shared listing | #12 (baseline) + #13/#14 (per-type renderers) |
| **MR-PR01–PR07** Press release/news | #18 (all incl. AI-audio) + #17 (infographic PR05) |
| **MR-PK01–PK07** Press kit | #15 (hub/FAQ/ZIP) + #16 (narrative/asset dl) + #17 (grouped content) |
| **MR-M01–M07** MR model page | covered by #7 (SB model) as the representative; a dedicated MR model URL is in the nav (e.g. `/en/skoda-model/new-fabia/`) if MR-specific rails must be shown separately |
| **MR-I01–I05** Images | #13 |
| **MR-V01–V04** Videos | #14 |
| **§6.1 templates / §6.9 DAM** Editorial/DAM | #19–#23 (company/Page family), #9/#10 (Škodapedia) — authoring surface; DAM downloads on #13/#20/#21 |
| **§6.5 embargo / §6.6 QR / §6.7 audit / §6.4 roles** | ⬜ **No public URL** — author-side/governance (SKODA-809/811/812/906), not a rendered page |
| **§8.1 SEO / §8.2 analytics / §8.5 perf / §8.6 a11y** | cross-cutting on every URL (measured, not a page); §8.3 consent out of scope; **§8.4 subscription** → #24 |
| **§7 MIG01–07** Migration | process, not a page — the 24 URLs *are* the representative import sample |

---

## 3. Gaps this join exposes

- **HTML technical-spec table** — no URL renders one (`/technical-data/` ships a PDF). MR-PK "Technical data" grouped-content is demonstrable only as a download, not a table block. Net-new if the PoC needs the rendered table.
- **Governance requirements (§6.4/6.5/6.6/6.7)** have **no public URL** — they're author-side/end-user-gated (tickets SKODA-809/811/812/906); can't be shown by a source URL, only by the authoring/preview environment.
- **Media-cart real download, whole-kit ZIP** (COM14/MR-PK07) — URLs #13/#14/#15 show the *UI*; the download backend is non-native to EDS (D2).
- **Škodapedia term-detail (#10)** — placeholder URL; pick a concrete term from #9 before import.
- **MR model page (MR-M)** — represented by the Storyboard model page (#7); add a `/en/skoda-model/<x>/` MR-context URL only if the MR-specific rail set must be shown distinctly.
- **Podcast (#8)** and **Škodapedia (#9/#10)** are §9 candidates-to-drop / reopened-assumption — included for completeness, flagged for the client scope call.

---

## 4. Cross-references
- `SKODA-POC-URL-SET.md` / `skoda-poc-urls.json` — the URL set + per-URL coverage (column 4 source).
- `SKODA-REQUIREMENTS-TRACEABILITY.md` §7 — the ticket→requirement reverse index (column 5 source) + full 97-ID matrix.
- `SKODA-CLIENT-REQUIREMENTS-MAPPING.md` — per-ID build status/narrative.
- `../architecture/SKODA-DIAGRAMS.md` — components → shared engines.
- `../source/CMS-MediaRoomMigration-Requirements-110926-1118-1348.pdf` — the requirement baseline.
