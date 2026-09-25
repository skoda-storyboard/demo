# Škoda Storyboard → Edge Delivery (DA/Experience Workspace), Delivery Backlog Overview

**What this is:** the master index for the migration backlog, 10 epics, 72 tickets, grounded in the `SKODA-*` analysis set. Pilot epics (E01–E07) are ticket-level; later phases (E08–E10) are epic + high-level tickets so the whole program is visible.
**Date:** 2026-09-05 (updated 2026-09-07: media-cart re-point, SKODA-505 added to M1, SKODA-902 re-scoped; updated 2026-09-10: build-confirmed, SKODA-506 added, SKODA-401 re-scoped to +3 SP for metadata-normalization, SKODA-801 trending low & browser-confirmed; updated 2026-09-11: Press Kit detail broken out of SKODA-802 into SKODA-805–808 per requirements doc §11; updated 2026-09-14: 22-URL analysis added SKODA-207 (Series→M1), SKODA-604 (full-fidelity story restore→M1), SKODA-810 (company/Page family→M2) per decision D18; updated 2026-09-14: traceability gaps closed, added SKODA-305 (MR footer→M1), SKODA-809 (roles), SKODA-811 (embargo), SKODA-812 (audit), SKODA-906 (QR access) → M2 governance layer, 51→56 tickets / 220→237 SP; updated 2026-09-15: ui-specs template-gap tickets added, SKODA-607 (press-release detail→M1), SKODA-208 (model page), SKODA-209 (category/tag archive), SKODA-706 (404), SKODA-813 (Page base shell)→M2, 56→61 tickets / 237→253 SP; updated 2026-09-15: block-recount cross-check added SKODA-210 (custom microsite, 201 pages) + SKODA-814 (SiteOrigin body flatten, 1,614 pages), 61→63 tickets / 253→261 SP, and reconciled SKODA-808 (no source variant selector, net-new pending MR-PK03); updated 2026-09-23: resolved a SKODA-211 ID collision, the **Stories feed block moved to SKODA-214** (GitHub issue #97 retitled) and **SKODA-211 registered as the completed DA tag-management plugin** (merged PR #60 / closed issue #54); E02 gains the tag-plugin row (net +1 vs the a73c810 stories/rails/promo scoping); updated 2026-09-24: disk↔GitHub ticket sync — mirrored 4 GitHub-only issues to disk (**SKODA-216** story-gallery variant / **SKODA-217** social icon cards / **SKODA-218** metadata dark-section styling in E02, **SKODA-306** footer link-target parity in E03) and added **SKODA-815** (ys-milestones timeline, from the 801 coverage review) with a matching GitHub issue)
**Update (2026-09-24, M1 gap review):** The [`SKODA-M1-GAP-REVIEW.md`](../reviews/SKODA-M1-GAP-REVIEW.md) revalidated M1 against the canonical 43-URL set in [`skoda-m1-url-set.txt`](../planning/skoda-m1-url-set.txt).

New M1 tickets:

| Ticket | Scope | SP | Tier |
|---|---|--:|---|
| ~~**SKODA-219**~~ | in-body story image carousel `skoda-carousel-widget`; on 21/21 story URLs. **Superseded by SKODA-819** (review §15) | ~~3~~ | – |
| **SKODA-801a** | M1 story import fidelity: Media Box + 21-story run (carousel → 819, Vimeo → 818 since §15) | 1.5 (was 3) | Must |
| **SKODA-608** | image/video item index rows | 3 | Must |
| **SKODA-609** | link containment + alias redirect | 2 | Must |
| **SKODA-805a** | press-kit tiles hub | 3 | Must |
| **SKODA-805b** | press-kit child pages; sized as option B | 3 | Could |
| **SKODA-805c** | `press_kit-template-default` | 3 | Should |

- Ticket file created for the existing issue SKODA-306 (#102): 1 SP.
- Re-scoped:
  - SKODA-603: 3→5 SP (43 URLs + corpus + tracker)
  - SKODA-207: hubs only
  - SKODA-208: M2→**M1**
  - SKODA-604: in-set stories
  - SKODA-607: Buzzsprout, related rail
  - SKODA-801: `skoda-carousel-widget` correction
  - SKODA-805: M1 slices split out
- Totals: **+8 tickets, +23 SP** relative to the running totals. Together with the SKODA-215–218 docs on
  `docs/skoda-216-story-gallery`, that gives 76→84 tickets and 267→290 SP. The slice SP (801a, 805a–c) are added on
  top of their parents as planning SP.
- The headline count and the §2/§5 epic roll-ups are **not yet re-summed** for this update. They are re-summed once
  both docs branches have merged.
- The cut line and wave plan are in the review, §9–§10.
- **Late 2026-09-24 (review §15):** SKODA-816–823 fold into M1. 819 supersedes 219 (−1 ticket, −3 SP), and 801a
  goes 3 → 1.5 SP. PR #113 shipped 822 and the importer halves of 816/817/818/820. 823 is Could. Net M1 Must is
  +2 SP. SKODA-216–218 and 306 are now mirrored on `main` (commit `55d8949`).
- **2026-09-25, disk↔GitHub sync:**
  - Created issues: 219 → #116 (closed as not planned, superseded by 819), 608 → #117, 609 → #118,
    816 → #119, 817 → #120, 818 → #121, 819 → #122, 820 → #123, 821 → #124, 822 → #125 (closed as completed,
    PR #113), 823 → #126, 801a → #127 (sub-issue of #48), 805a/b/c → #128/#129/#130 (sub-issues of #66).
    All are milestone M1 and on Project #1 with Status/Priority/Estimate set, except 219.
  - Milestones aligned: SKODA-206 and SKODA-405 are M2 on disk (matching the board), and #114 (SKODA-815) is set
    to M2.
  - Bodies: the disk ticket files were pushed to 21 issues whose bodies had drifted. The GitHub-only "Relations"
    footers of #97/#98/#99 were pulled to disk first.
  - Assignees are **not** set. The review §11 owner split is still a proposal.
- **2026-09-25, DevTools URL→block sweep** ([`SKODA-M1-URL-BLOCK-SWEEP.md`](../reviews/SKODA-M1-URL-BLOCK-SWEEP.md),
  registry [`SKODA-M1-URL-BLOCK-REGISTRY.md`](../analysis/SKODA-M1-URL-BLOCK-REGISTRY.md)):
  - 687 UI element rows on the 43 URLs are registered: 659 from the fleet plus 28 float-dock rows added by the
    Architect. The shared chrome is recorded per URL. Every row is ticketed or ruled out.
  - Three **draft** tickets were added on disk only, with no GitHub issues yet: **SKODA-827** float dock (1.5,
    Should/agent; first drafted as 824), **SKODA-825** MR side resolution (1.5, Must) and **SKODA-826** global
    gutter (0.5, Must).
    *(827 and 825 were later folded into 215 / 309 and removed; see the GitHub-sync bullet below.)*
  - AC amendments for 20+ tickets are listed in sweep §6 and are applied at sign-off.
  - Net M1 Must change: +2 human SP, plus +2.5 SP in the agent lane (827, 607 importer, 216 listing-lightbox
    slice), per sweep §9.
- **2026-09-25, parallel demo sweep reconciled** (main `88c1b48`,
  [`SKODA-DEMO-SWEEP-REPORT.md`](../reviews/SKODA-DEMO-SWEEP-REPORT.md); validated in
  [`SKODA-M1-URL-BLOCK-SWEEP.md`](../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §11):
  - **Duplicates to merge at sign-off.** 827 duplicates 215 and 825 duplicates 309. The main-first IDs (215, 309)
    are kept. 827 and 825 are closed once their extra evidence and ACs have been folded in. The capacity counts
    only 215 and 309.
  - **Number collision.** 824 now means the in-column highlight panel (main). The float-dock draft was renumbered
    to 827, and no content was dropped.
  - **826 is kept.** It is the section-gutter token; 308 (topbar padding) and 821 (story body inset) are
    neighbours that rebase onto it.
  - **Live re-check:** 9 of the parallel sweep's findings confirmed, 3 partial, 0 refuted.
    - It found a missed **P1**: rail cards don't navigate on a desktop click and don't drag. **Reopen 212**
      (proposal).
    - 204 AC gap: the consent click-to-load hook is missing. The host is fine.
    - Four referenced blocks don't exist (`in-page-nav`, `spec-table`, `version`, `promo-box`).
  - **Combined cut line** (sweep §11.2):
    - Must: +3 human SP net (212 fix, 309, 204 hook, 208 block names, 611a), with 208 Key Facts / Tech Data
      demoted to Should. That leaves ≈ 0.2 d of margin.
    - Agent lane: 610 + 215.
    - Should: 308, 824, 611b, 220, 225.
    - 221: D-4 fallback.
- **2026-09-25, GitHub sync of the reconciliation** (sweep §11.4; decisions D1–D5):
  - **Folded + removed:** draft 827 → **SKODA-215**, draft 825 → **SKODA-309**. No issues are created for the drafts.
  - **Merged on main since:** SKODA-213 promo-box (#110 → issue #99 Done) and SKODA-305 MR footer (#134 → #26 Done).
  - **New follow-ups (D1), linked to the Done issues rather than reopening them:** **SKODA-212a** desktop pointer
    fix (1 SP, Must, → #98) and **SKODA-204a** consent click-to-load hook (0.5 SP, Must, → #18).
  - **611 split (D2):** **SKODA-611a** section structure (Must, **1 SP**, down from 1.5 because #110 already fixed
    the promo exclusion) and **SKODA-611b** band spacing (Should, 1.5 SP). 611 stays as the parent.
  - **610** stays at 1 SP: #110 only cleaned the `stories` / promo path; rails, index, listing and search still
    carry the suffix.
  - **Footer legal links (D3)** are owned by 306; they were removed from 308.
  - AC amendments from sweep §6 + §11 were applied to 208, 218, 306, 308, 607, 608, 801a, 805a, 805c, 816, 817,
    819 and 820.
  - **Cut line:** Must (human) net is now **+2.5 SP** (611a is 1 SP), leaving ≈ 0.45 d of margin (sweep §11.4).
  - **Issues created** (milestone M1, Project #1 with Status/Priority/Estimate, no assignees): 215 → #139, 220 → #140, 221 → #141, 225 → #142, 307 → #143, 308 → #144, 309 → #145, 610 → #146, 611 → #147, 824 → #148, 826 → #149, 212a → #150, 611a → #151, 204a → #152, 611b → #153. 611a/611b are sub-issues of #147. #98 / #18 / #31 got follow-up comments. Amended bodies were pushed to #57, #108, #102, #47, #117, #119, #120, #122, #123, #127, #128 and #130. Board fields: #57 P0 / 6 SP, #108 P1, #47 P0.
**Target:** DA / Experience Workspace + EDS (no AEM Author / UE / JCR), per `SKODA-EDS-DA-ARCHITECTURE.md`.
**Estimates:** story points (SP) + AI-assisted / manual day ranges, **planning estimates, not a quote**. "AI-assisted" reflects this environment's import/styling/QA tooling.
**Files:** `docs/tickets/epics/E##-*.md` · `docs/tickets/tickets/SKODA-<id>.md`.
**UI specs (2026-09-15):** every UI/block ticket now links to a **build-ready, measured component spec** under [`../ui-specs/`](../ui-specs/README.md), source values captured via Chrome DevTools at 375/768/1024/1280, mapped to design tokens, with pixel-perfect acceptance criteria, so a component can be handed to an autonomous build agent. See [`../ui-specs/README.md`](../ui-specs/README.md) for the component↔client-ID↔ticket coverage matrix and [`../ui-specs/_FOUNDATIONS.md`](../ui-specs/_FOUNDATIONS.md) for the token + verified-breakpoint (768/992/1080) set.
**Template specs (2026-09-15):** a page-type layer sits above the components, [`../ui-specs/_TEMPLATES.md`](../ui-specs/_TEMPLATES.md) maps every live WordPress template (body-class + CPT, STO/MR side, shell, composed components) to a spec + ticket. A live walk found six gaps, now closed with new tickets: **SKODA-607** (press-release detail, split from the story template, 47.5% of pages), **SKODA-208** (model page), **SKODA-209** (category/tag archive), **SKODA-813** (generic Page base shell), **SKODA-706** (branded 404), plus home-composition (`template-home.md`, folded into SKODA-604). Each has a measured `template-*.md` spec (layout/spacing/typography/responsiveness) + screenshots. Correction baked in: the **press release is not the story shell** (no hero, media-kit secondary column, MR side).
**Requirement coverage:** every ticket below maps to one or more client requirement IDs (COM/STO/MR/§6/§7/§8) in `../planning/SKODA-REQUIREMENTS-TRACEABILITY.md`, the bidirectional requirement↔ticket matrix with M1/M2 milestone paths and the open-gap register (2026-09-14). The five previously un-ticketed gaps (G1–G5) are now **closed with tickets**: SKODA-305 (MR footer, M1), SKODA-809 (roles), SKODA-811 (embargo), SKODA-812 (audit), SKODA-906 (QR access), the last four M2 governance layer. **Every client requirement ID now has a ticket path.**

---

## 1. Program Summary

Four phases, mapped from `SKODA-EDS-DA-ARCHITECTURE.md` §12:

| Phase | Epic(s) | Goal |
|---|---|---|
| **A, Capability pilot** | E01–E07 | Stand up the **reusable EN capability** (blocks + chrome + query-index listing + index search + media + import + QA), validated on a press-release article + its listing. **Story/Page-Builder and 3 of the 4 backend services (banners, newsletter, hosted search) are OUT.** The **media cart is IN** (client scope: mission-critical for the 15 Oct demo), built client-side (device-ID, no login) as SKODA-505. |
| **B, Editorial at scale** | E08 | Story template (SiteOrigin Page-Builder flattening), remaining templates, bulk import, consent/analytics wiring. |
| **C, Dynamic services** | E09 | Media-cart **production hardening**, banner platform, newsletter, hosted search, `skoda-analytics` rebuild, each behind an API boundary. |
| **D, Localization** | E10 | 6 locales, per-locale query-index, EW Translation, language-negotiated routing. |

**Pilot = capability pilot** (settled). It is *not* a one-page throwaway, it builds the reusable machinery. Effort below prices the capability.

---

## 2. Epic Index

| Epic | Goal | Phase | Tickets | Effort (SP) | AI-days | Manual-days |
|---|---|---|---|--:|--:|--:|
| **E01 Foundation & Setup** | DA/EW site, repo, Code Sync, config, tokens | A | 6 | 15 | 5–9 | 12–20 |
| **E02 Core Blocks** | teaser/cards, hero, gallery+lightbox, embeds, tags, Škodapedia glossary, Series template, **model-page (208)**, **category/tag archive (209)**, **custom microsite (210)**, **DA tag plugin (211)**, **home blocks: stories feed / rails / promo-box (214/212/213)** | A | 14 | 35 | 13.5–22 | 29–46 |
| **E03 Chrome Fragments** | header/mega-menu, mobile ARIA, lang switcher, footer, MR footer variant | A | 5 | 14 | 6–8 | 9–16 |
| **E04 Listings & Search** | query-index (15 facets) + metadata-normalization, listing/load-more, search, **RSS (405)** | A | 4 | 19 | 7–12 | 13–21 |
| **E05 Media Pipeline** | masters-only ingest, downloads block, PDF/MP4, **AEM Assets mapping**, **demo cart + client-side zip (505/505a/505b)**, **media pre-conditioning**, **AEM Assets picker (507)** | A | 9 | 21 | 7–13 | 14–23 |
| **E06 Import Pilot Content** | parsers/transformers, DA push, pilot pages, full-fidelity story restore | A | 4 | 13 | 4.5–8 | 9–14 |
| **E07 QA / Perf / A11y / Launch** | lint, Lighthouse/RUM, a11y, visual QA, sign-off, **branded 404 (706)**, **demo assembly (707)** | A | 6 | 12 | 4.5–7.5 | 7.5–13 |
| **E08 Editorial at Scale** | story flatten, remaining templates, **press-release detail (607)**, **press-kit (805–808)**, **company/Page family (810)**, **Page base shell (813)**, **SiteOrigin body flatten (814)**, **governance: roles/embargo/audit (809/811/812)**, bulk import | B | 15 | 71 | 26.5–46 | 53–91 |
| **E09 Dynamic Services** | media-cart **prod hardening**, banners, newsletter, hosted search, analytics, **QR access (906)** | C | 6 | 45 | 17–28 | 34–62 |
| **E10 Localization** | 6 locales, per-locale index, translation, routing | D | 3 | 16 | 6–10 | 10–15+ |
| **Total** | | | **72** | **261** | **97–164** | **191–321** |

*(SP roll-ups are indicative; day ranges are the sum of per-ticket planning ranges, treat as order-of-magnitude, not a commitment.)*

---

## 3. Full Ticket Register

**Phase A, Pilot (all Pilot: Yes)**

| ID | Title | Epic | SP | AI-d | Man-d | Deps | Risk |
|---|---|---|--:|--:|--:|---|---|
| SKODA-101 | DA/EW site + repo + Code Sync | E01 | 3 | 1–2 | 2–4 |, | 🟢 |
| SKODA-102 | Boilerplate scaffold | E01 | 3 | 1–2 | 3–5 | 101 | 🟢 |
| SKODA-103 | Config sheets (placeholders/metadata/redirects) | E01 | 2 | 0.5–1 | 1–2 | 102 | 🟢 |
| SKODA-104 | helix-query.yaml skeleton (per-locale) | E01 | 3 | 1–2 | 2–3 | 102 | 🟡 index critical path |
| SKODA-105 | Sidekick v7 + preview/publish | E01 | 1 | 0.5 | 1 | 101 | 🟢 |
| SKODA-106 | Design tokens + global CSS (re-derived) | E01 | 3 | 1–2 | 3–5 | 102 | 🟢 |
| [SKODA-826](tickets/SKODA-826.md) | Global page gutter parity (10px at every width, not 24/40px) | E01 | 0.5 | 0.25 | 0.5 | 106 | 🟢 M1 Must; from the 2026-09-25 URL→block sweep (#149) |
| SKODA-201 | Cards/Teaser (overlay/media/toolbar) | E02 | 5 | 2–3 | 5–7 | 102,106 | 🟢 |
| SKODA-202 | Hero (image, LCP) | E02 | 2 | 1 | 2–3 | 102,106 | 🟢 |
| SKODA-203 | Gallery + lightbox modal | E02 | 5 | 2–3 | 4–6 | 102,106 | 🟡 a11y modal `[RUNTIME-UNCONFIRMED]` |
| SKODA-204 | Embeds (4 providers, dnt=1, lazy) | E02 | 3 | 1–2 | 2–4 | 102 | 🟢 |
| [SKODA-204a](tickets/SKODA-204a.md) | Embeds consent placeholder + click-to-load hook (follow-up to #18) | E02 | 0.5 | 0.25 | 0.5 | 204,606 | 🟡 M1 Must; sweep §11.1 (204 AC l.47/49 gap); D1 follow-up, not a reopen |
| SKODA-205 | Tags / metadata | E02 | 1 | 0.5 | 1 | 102 | 🟢 |
| SKODA-206 | Škodapedia glossary block (directory + A–Z filter + modal) | E02 | 5 | 2–3 | 4–6 | 102,106 | 🟡 modal a11y `[RUNTIME-UNCONFIRMED]`; **M2** on the board (aligned 2026-09-25) |
| SKODA-207 | Series template (2-level: directory + hub) | E02 | 3 | 1–2 | 2–4 | 201,202,402,601 | 🟢 M1 (D18); reuses cards/hero/grid |
| SKODA-211 | DA tag-management library plugin (DA_SDK multi-select) | E02 | 3 | 1–2 | 2–3 | 102,205,401 | 🟢 M1; CLOSED (done); build-confirmed 2026-09-16 (PR #60, issue #54) |
| SKODA-212 | Horizontal rails block (story-rail + carousel) | E02 | 3 | 1–2 | 3–5 | 201,402,401,106 | ✅ Done (#98); watchCSS + a11y; spec `ui-specs/carousel-rails.md` |
| [SKODA-212a](tickets/SKODA-212a.md) | Rails desktop pointer fix: click navigates, drag scrolls (follow-up to #98) | E02 | 1 | 0.5 | 1 | 212 | 🔴 M1 Must **P0**; sweep §11.1 V1 (live-confirmed P1 defect); D1 follow-up, not a reopen |
| SKODA-213 | Promo-box block (featured mosaic / auto-rotate slider) | E02 | 2 | 0.5–1 | 2–3 | 201,106,202 | ✅ Done (PR #110, issue #99); mosaic≥768 / 1-up auto-rotate<768; stories feed `offset`; spec `ui-specs/carousel-rails.md` §3/§5 |
| SKODA-214 | Stories feed block (Load-more pager, query-index) | E02 | 2 | 0.5–1 | 1–2 | 201,402,401,106 | 🟢 M1; `blocks/stories` unbuilt; facet-less reuse of 402 loader/paginate; spec `ui-specs/stories.md` (was SKODA-211, renumbered 2026-09-23) |
| SKODA-216 | Story gallery variant (`sb-gallery`) + lightbox | E02 | 3 | 1–2 | 2–4 | 203,106 | 🟡 M1; story-variant of Gallery (lead image + 4-across strip, green lightbox); issue #106 (2026-09-24) |
| SKODA-217 | Homepage social-media icon cards | E02 | 1 | 0.5 | 1–2 | 201,106 | 🟡 M1; block variant; issue #107 (2026-09-24) |
| SKODA-218 | Metadata-driven dark section styling | E02 | 1 | 0.5 | 1–2 | 106 | 🟡 M1; Section Metadata Style→class; issue #108 (2026-09-24) |
| [SKODA-219](tickets/SKODA-219.md) | In-body story image carousel (`skoda-carousel-widget`) | E02 | 3 | 1–1.5 | 2–3 | 212,501,106 | 🟠 M1 Must; 21/21 in-set stories; unspecced before 2026-09-24 (gap review G-02). **⛔ Superseded by SKODA-819** (review §15) |
| [SKODA-215](tickets/SKODA-215.md) | Floating action bar: share cluster + scroll-to-top | E02 | 2 | 0.5–1 | 1–2 | 106,505a | 🟡 M1; Demo sweep 2026-09-25; ID existed, file created. The DevTools census puts the dock on **all 42 URLs** (every template), not only stories/series/2 kits; draft 827 folded in (8 anchors, cart slot, intent URLs, a11y) |
| [SKODA-220](tickets/SKODA-220.md) | Quote block (centred pull-quote + rule + attribution) | E02 | 2 | 0.5–1 | 1–2 | 607,805c,801 | 🟡 M1; Demo sweep 2026-09-25; 4 PRs + 1 PK |
| [SKODA-221](tickets/SKODA-221.md) | Cards `tiles`/mosaic variant (series + press-kit hubs) | E02 | 3 | 1 | 2–3 | 201,207,805a | 🟡 M1; Demo sweep 2026-09-25; 5 series + 3 PK hubs |
| [SKODA-225](tickets/SKODA-225.md) | Columns unequal split + intrinsic portrait (story 2-cell rows) | E02 | 1 | 0.5 | 1 | 801,824 | 🟢 cosmetic; Demo sweep 2026-09-25 |
| SKODA-301 | Header + mega-menu (3 panels) | E03 | 5 | 2–3 | 4–6 | 102,106 | 🟡 |
| SKODA-302 | Mobile nav toggle + ARIA (a11y fix) | E03 | 2 | 1 | 1–2 | 301 | 🟡 fixes source gap |
| SKODA-303 | Language switcher (6 locales) | E03 | 2 | 1 | 1–2 | 301 | 🟢 |
| SKODA-304 | Footer fragment | E03 | 3 | 1–2 | 2–4 | 102,106 | 🟢 |
| SKODA-305 | Media Room footer variant | E03 | 2 | 1 | 1–2 | 304,301 | ✅ Done (PR #134, issue #26); closes gap G1 (COM18); unify-vs-distinct 🟡 |
| [SKODA-306](tickets/SKODA-306.md) | Footer outbound-link browsing-context parity (`target=_blank`) | E03 | 1 | 0.5 | 1 | 304 | 🟢 M1; issue #102; file added 2026-09-24 |
| [SKODA-307](tickets/SKODA-307.md) | Header/footer survive a missing nav/footer fragment (null guard) | E03 | 0.5 | 0.25 | 0.5 | 301,304 | 🟢 M1; from the 2026-09-25 live-footer incident |
| [SKODA-308](tickets/SKODA-308.md) | Chrome parity pass (header, search, mobile nav, footer legal links, topbar newsletter) | E03 | 3 | 1 | 2–3 | 301,302,303,304,307,403,823 | 🟡 M1; Demo sweep 2026-09-25; every page |
| [SKODA-309](tickets/SKODA-309.md) | Media Room side chrome (MR nav, active tab, nav/footer metadata) | E03 | 2 | 0.5–1 | 1–2 | 301,305,307,607,805a,602 | 🟡 M1; Demo sweep 2026-09-25; **16** MR URLs incl. 5 model pages; draft 825 folded in; unblocked (#134 merged); MR nav fragment still 404 |
| SKODA-401 | Query-index schema + selectors + metadata-normalization (15 facets) | E04 | 8 | 3–5 | 5–8 | 104 | 🟠 build-confirmed: admin-service `query.yaml` (not repo); fields need normalization layer, not clean selectors |
| SKODA-402 | Faceted listing + load-more (deep-link) | E04 | 8 | 3–5 | 6–9 | 401,201 | 🟠 hardest pilot block |
| SKODA-403 | Search block (index-only) | E04 | 3 | 1–2 | 2–4 | 401 | 🟡 body-search deferred |
| SKODA-405 | RSS feed generation (query-index → RSS 2.0) | E04 | 2 | 0.5–1 | 1–2 | 401 | 🟢 **M2** (aligned to board 2026-09-25; was M1 stretch); agent-fit |
| SKODA-501 | Masters-only image ingest (img-out-of-`<p>`, alt/caption) | E05 | 3 | 1–2 | 2–3 | 102 | 🟢 |
| SKODA-502 | Static Downloads block (mediabox) | E05 | 3 | 1–2 | 2–3 | 102 | 🟢 |
| SKODA-503 | PDF/MP4 handling (link/DAM) | E05 | 2 | 0.5–1 | 1–2 | 501 | 🟡 MP4 signed-flow (cart now SKODA-505) |
| SKODA-504 | Map S3 images → AEM Assets (manifest) | E05 | 3 | 1–2 | 2–3 | 501,601 | 🟠 A/B unconfirmed; M2 scale = rights+dedup |
| SKODA-505 | Demo media-cart + client-side zip (device-ID, no login) | E05 | 8 | 3–5 | 6–10 | 502,501,504,601 | 🟠 mission-critical demo; CORS/AEM-Assets linchpin |
| SKODA-506 | Media pre-conditioning: strip/replace oversized masters before publish | E05 | 2 | 0.5–1 | 1–2 | 501 | 🟠 build-confirmed: 25–40 MB masters 409 the content bus; gates publish |
| SKODA-505a | Media-cart download logic (device-ID + originals + multi-select zip) | E05 | 5 | 2–3 | 4–6 | 501,504,502,601 | 🟠 split from 505 (logic half); agent-fit |
| SKODA-505b | Media-cart presentation + live AEM DAM delivery wiring | E05 | 3 | 1–2 | 2–3 | 505a,501,504 | 🔴 split from 505 (presentation half); human-gate |
| SKODA-507 | Native AEM Assets picker in DA/EW (Media Bus delivery) | E05 | 2 | 0.5–1 | 1–2 | 504,505b | 🔴 BLOCKED (client AEM env + DA site config, creds) |
| SKODA-601 | Import infra: parsers + transformers | E06 | 5 | 2–3 | 4–6 | 102 | 🟡 content-driven only |
| [SKODA-602](tickets/SKODA-602.md) | DA source-API push + bulk-op publish | E06 | 3 | 1–2 | 2–3 | 601 | 🟢 **built + piloted 2026-09-25** (`push-to-da.mjs`, branch `skoda-602-da-push`); credential gate resolved |
| SKODA-603 | Pilot page set imported + validated, **re-scoped 2026-09-24 to the 43-URL set + rail corpus + tracker** | E06 | 5 | 2–3 | 3–5 | 601,602,201,202,203,204,205,501,502 | 🔴 M1 content critical path. **W0 done 2026-09-25:** tracker `planning/skoda-m1-url-status.md` (16/136 pages live + indexed) + pending-block contract `planning/SKODA-PENDING-BLOCK-CONTRACTS.md`; gated waves W1–W4 |
| SKODA-604 | Full-fidelity restore on 1–2 hero demo stories | E06 | 2 | 0.5–1 | 1–2 | 203,204,502,505,601,602,801 | 🟢 M1 (D18); bounded un-flatten |
| [SKODA-605](tickets/SKODA-605.md) | Rewrite absolute source URLs to site-relative in import (#39) | E06 | 2 | 0.5–1 | 1–2 | 601,602 | 🟡 M1; code done 2026-09-25 (`skoda-links.js` in all 16 importers, demo-page allow-list, D-3 (b) for the rest); 2 pages published, the rest ride with 508/603/607/801a/208 |
| SKODA-607 | Press Release detail template (split from story) | E08 | 5 | 2–3 | 4–6 | 601,602,502 | 🟢 M1; PR ≠ story (no hero, MR side, 47.5% of pages); spec `ui-specs/template-press-release.md` |
| [SKODA-608](tickets/SKODA-608.md) | Image & video item index rows (listings + model media rails) | E06 | 3 | 1–1.5 | 2–3 | 601,602,401,501,503 | 🟠 M1 Must; `/en/images/`, `/en/videos/` empty without it |
| [SKODA-609](tickets/SKODA-609.md) | M1 link containment + mixed-reality alias redirect | E06 | 2 | 1 | 1–2 | 605,103,603 | 🟠 M1 Must; decision D-3 |
| [SKODA-610](tickets/SKODA-610.md) | Clean index titles (drop " - Škoda Storyboard") | E06 | 1 | 0.25–0.5 | 0.5–1 | 401,602,603 | 🟡 M1; code done 2026-09-25 (importer + shared runtime trim); 7/28 republished (index 29→22 suffixed), 21 held (508/603/208/819); 0 suffixed card titles/alt on branch preview |
| [SKODA-508](tickets/SKODA-508.md) | `skoda-images` turns card-image `data-caption` excerpts into body paragraphs | E05 | 1 | 0.25–0.5 | 0.5–1 | 501 | 🟠 M1; found in 610; blocks the PR re-import |
| [SKODA-611](tickets/SKODA-611.md) | Storyboard home composition (/en cover-box stack, promo exclusion) | E06 | 2.5 | 1 | 2–2.5 | 212,213,214,217,218,603 | 🟡 M1; Demo sweep 2026-09-25; no owner since 604 re-point; **parent** of 611a/611b (D2); promo exclusion already fixed by #110 |
| [SKODA-611a](tickets/SKODA-611a.md) | Home section structure: 9 cover-box sections, dark bands, social strip (Must slice) | E06 | 1 | 0.5 | 1 | 213,214,217,218,603 | 🟡 M1 Must |
| [SKODA-611b](tickets/SKODA-611b.md) | Home band spacing: 67px gap, 320px rail pitch (Should slice) | E06 | 1.5 | 0.5 | 1–1.5 | 611a,218 | 🟡 M1 Should |
| [SKODA-801a](tickets/SKODA-801a.md) | M1 story import fidelity slice (Media Box + 21-story run; carousel → 819, Vimeo → 818) | E08 | 1.5 | 0.5–1 | 1.5–2 | 601,801,819,818,502,204 | 🟠 M1 Must; slice of 801; re-scoped 3 → 1.5 SP (review §15) |
| [SKODA-805a](tickets/SKODA-805a.md) | Press-kit tiles hub, M1 slice + importer (3 hubs) | E08 | 3 | 1–2 | 3–4 | 601,602,202,201,305,609 | 🟠 M1 Must; slice of 805 |
| [SKODA-805b](tickets/SKODA-805b.md) | Press-kit child pages for M1 hubs (import vs link-out, D-1) | E08 | 3 | 1–2 | 3–5 | 805a,805c,502,609 | 🟡 M1 Could; 50 child pages outside the set |
| [SKODA-805c](tickets/SKODA-805c.md) | `press_kit-template-default` article + accordion (first-glimpse) | E08 | 3 | 1–2 | 3 | 607,204,205,502,506 | 🟡 M1 Should; slice of 805/807 |
| SKODA-701 | Lint + unit tests | E07 | 2 | 1 | 1–2 | E02,E03,E04 | 🟢 |
| SKODA-702 | Performance (Lighthouse≈100/RUM) | E07 | 3 | 1–2 | 2–3 | 603 | 🟡 |
| SKODA-703 | Accessibility audit | E07 | 3 | 1–2 | 2–4 | 603 | 🟠 several `[RUNTIME-UNCONFIRMED]` |
| SKODA-704 | Visual critique + consent/analytics stubs + sign-off | E07 | 3 | 1–2 | 2–3 | 702,703 | 🟡 |

**Phases B–D (Pilot: No)**

| ID | Title | Epic | Phase | SP | AI-d | Man-d | Deps | Risk |
|---|---|---|---|--:|--:|--:|---|---|
| SKODA-208 | Model page template (skoda_model: hero + icon nav + 5 rails) | E02 | B | 5 | 2–3 | 4–6 | 202,402,201 | 🟠 **M1** (re-milestoned 2026-09-24: 5 model URLs in the M1 set; 3 blocks missing); spec `ui-specs/template-model-page.md` |
| SKODA-209 | Category / Tag archive template (hero + card grid, no facets) | E02 | B | 3 | 1–2 | 2–4 | 202,201,402 | 🟢 M2; spec `ui-specs/template-category-archive.md` |
| SKODA-210 | Custom microsite (full-width event-gallery/campaign) scope + template | E02 | B | 3 | 1–2 | 2–4 | 203,813,814,601 | 🟡 M2; 201 pages, migrate/fold/drop decision; spec `ui-specs/custom-microsite.md` (recount §2/§8) |
| SKODA-706 | Branded 404 (keeps chrome, real HTTP 404) | E07 | B | 1 | 0.5 | 0.5–1 | 301,304 | 🟢 M2; spec `ui-specs/template-404.md` |
| SKODA-801 | Story template, SiteOrigin Page-Builder flatten | E08 | B | 8 | 3–5 | 6–10 | 601,603 | 🟢 built (2026-09-24): `story-flatten.js` 17-widget map + two-column body+aside (grid-on-main); carousel routed by content (Gallery/Cards); linear + large-tree paths verified. M2: full-corpus run. Blocks it emits: 203 (Gallery), 201 (Cards) |
| SKODA-802 | Remaining templates (Škodapedia pre-baked, pages) | E08 | B | 5 | 2–3 | 4–7 | 801 | 🟡 (press-kits split to 805–808) |
| SKODA-803 | Bulk import automation (at scale) | E08 | B | 8 | 3–5 | 6–10 | 602,801 | 🟠 scale |
| SKODA-804 | Consent + analytics wiring (OneTrust, GTM, skoda-analytics) | E08 | B | 5 | 2–3 | 4–6 | 603 | 🟠 consent OUT of Adobe scope (D10) |
| SKODA-805 | Press Kit template + structured narrative sections | E08 | B | 5 | 2–3 | 4–6 | 801,202,402 | 🟡 fixed-vs-conditional sections (§11.8) |
| SKODA-806 | Press Kit grouped media/download areas + whole-kit ZIP | E08 | B | 5 | 2–3 | 4–6 | 805,502,505 | 🟠 ZIP = D2 reduction service |
| SKODA-807 | FAQ block (Press Kit) | E08 | B | 2 | 0.5–1 | 1–2 | 805,106 | 🟡 per-kit vs shared pool (§11.10) |
| SKODA-808 | Press Kit variant subsections + selector + categorization | E08 | B | 3 | 1–2 | 2–3 | 805,806,401 | 🟡 selector interaction (§11.7/11.9) |
| SKODA-810 | Company/Page family (board/annual-reports/logo/app/contacts) | E08 | B | 8 | 3–5 | 6–10 | 202,304,502,601,602,803,813 | 🟢 M2 (D18); 5 net-new blocks on the 813 shell |
| SKODA-813 | Generic Page base shell (STO page + MR media-room-page) | E08 | B | 2 | 0.5–1 | 1–2 | 202,801 | 🟢 M2; shared shell under 810; spec `ui-specs/template-page-base.md` |
| SKODA-814 | SiteOrigin body flatten contract (1,614 pages) | E08 | B | 5 | 2–3 | 4–6 | 601,203,204 | 🟢 M2; feeds 801/208/813; spec `ui-specs/siteorigin-body.md` (recount §3/§6) |
| SKODA-815 | Story flatten: `ys-milestones` timeline (content-loss fix) | E08 | B | 3 | 1–2 | 3–5 | 801 | 🟢 flatten-to-content SHIPPED in 801 (0→11 entries recovered); optional timeline block remains M2 |
| SKODA-816 | Story hero: title above 16:9 image + caption (perex, date, linked category) | E08 | A/B | 2 | 0.5–1 | 1–2 | 202,205,801,826 | 🟡 #113 importer half merged; single Hero Image caption + same-row metadata; page gutter owned by 826, published QA open |
| SKODA-817 | Story aside: duplicated "Explore more" teasers + sidebar visual parity | E08 | A/B | 2 | 0.5–1 | 1–2 | 201,205,801 | 🟡 dedupe (6→3 cards) + Tags heading merged in #113; sidebar parity CSS open (≈ 1 SP) |
| SKODA-818 | Story flatten: `lite-youtube` → bare YouTube URL (embed autoblock) | E08 | A/B | 1 | 0.25–0.5 | 0.5–1 | 204 (PR #109),801 | 🟢 importer merged in #113; render check once PR #109 merges |
| SKODA-819 | Story in-body carousel → Gallery `slider` variant | E08 | A/B | 3 | 1 | 2–3 | 203,212,801 | 🟡 stakeholder decision: slider like source; **supersedes SKODA-219** |
| SKODA-820 | Story bottom "Related Stories" band restored (tag-based rail) | E08 | A/B | 2 | 0.5–1 | 1–2 | 212,218,801 | 🟡 importer half merged in #113 (dark band + curated rail); story-rail curated fix + band grid open (≈ 1 SP); Media Box → 801a |
| SKODA-821 | Story body column text inset (34px extra per side) | E08 | A/B | 1 | 0.25 | 0.5 | 801 | 🟢 CSS only |
| SKODA-822 | Ship SKODA-801 two-column story layout to `main` | E08 | A | 1 | — | — | 801 | ✅ merged as PR #113 (2026-09-24 21:35) |
| SKODA-823 | Story sidebar newsletter sign-up widget (UI stub) | E08 | A | 2 | 0.5–1 | 1–2 | 904,801 | 🟡 `newsletter-stub` in spec but never built; side banner → 903; **M1 Could** (review §15) |
| [SKODA-824](tickets/SKODA-824.md) | In-column highlight panel (story dark box + PR grey callout) | E08 | A | 3 | 1 | 2–3 | 801,814,218,819,225 | 🟡 M1; Demo sweep 2026-09-25; 12 stories + 1 PR |
| SKODA-809 | Roles & permissions (7 editorial groups) | E08 | B | 5 | 2–3 | 4–8 | 101,602 | 🟠 gap G2 (§6.4); blocked on D15 RACI |
| SKODA-811 | Content embargo (staged-publish, group access) | E08 | B | 3 | 1–2 | 2–4 | 602,809 | 🟢 gap G3 (§6.5/D9) approach agreed; M1-Stretch only *ungated* (group-gate needs 809/M2/D15, F4) |
| SKODA-812 | Auditability (author change-history) | E08 | B | 2 | 0.5–1 | 1–3 | 101,602,809 | 🟡 gap G5 (§6.7); validate DA/EW capability |
| SKODA-901 | Hosted body-relevance search (decision-gated) | E09 | C | 8 | 3–5 | 6–10 | 401 | 🟠 |
| SKODA-902 | Media-cart **prod hardening** (serverless zip + signed access + cross-device) | E09 | C | 8 | 3–5 | 6–12 | 505,502 | 🟠 re-scoped (demo cart = SKODA-505) |
| SKODA-903 | Banner ad platform (per-market feed + client) | E09 | C | 8 | 3–5 | 6–12 | 106 | 🔴 bespoke ad server |
| SKODA-904 | Newsletter/subscriber (ESP + consent + opt-in) | E09 | C | 8 | 3–5 | 6–10 | 304 | 🔴 10-route account |
| SKODA-905 | skoda-analytics rebuild (dataLayer + per-block wiring) | E09 | C | 8 | 3–5 | 6–10 | 804,E02,E04 | 🔴 hidden cross-cutting |
| SKODA-906 | Restricted end-user access (QR-code journey) | E09 | C | 5 | 2–3 | 4–8 | 101 | 🔴 gap G4 (§6.6); blocked on D17; SP provisional |
| SKODA-1001 | Per-locale trees + per-locale query-index | E10 | D | 5 | 2–3 | 4–6 | 401,603 | 🟡 |
| SKODA-1002 | EW Translation rollout (DE/CS/SK/SR/SL) | E10 | D | 8 | 3–5 | content-ops | 1001 | 🟠 volume |
| SKODA-1003 | Language-negotiated routing + placeholders | E10 | D | 3 | 1–2 | 2–3 | 303,1001 | 🟡 |

---

## 4. Dependency Map & Critical Path

**Foundation gates everything:** `101 → 102 → {103,104,105,106}`.

```
101 ─ 102 ─┬─ 103 (config sheets)
           ├─ 104 ── 401 ──┬─ 402 (listing)  ← needs 201
           │               └─ 403 (search)
           ├─ 105 (sidekick)
           └─ 106 (tokens) ─┬─ 201 ─┐
                            ├─ 202  │
                            ├─ 203  │
                            ├─ 301 ─┼─ 302, 303
                            └─ 304  │
102 ─ 204, 205, 501, 502 ───────────┤
                                    ▼
601 ─ 602 ───────────────────────► 603 (pilot pages; fan-in of all blocks+media+import)
                                    ▼
                              702, 703 ─► 704 (sign-off)
Phase B: 601,603 ─ 801 ─ 802 ; 602,801 ─ 803 ; 603 ─ 804
Phase A media-cart: 502 + (501/504 CORS AEM Assets) ─ 505 (demo cart + client-side zip) ─► 603
Phase C: 401─901 ; 505,502─902 (prod hardening) ; 106─903 ; 304─904 ; 804+E02+E04─905
Phase D: 401,603─1001 ─ 1002 ; 303,1001─1003
```

**Pilot critical path (longest chain):** `101 → 102 → 106 → 201 → 402` (listing depends on both index and cards) **and** `…→ 601 → 602 → 603 → 703 → 704`. The two converge at **603** (pilot page set), the integration bottleneck. **402 (faceted listing, 8 SP)** and **603 (fan-in)** are the schedule-drivers within the pilot.

---

## 5. Effort Roll-Up

| Scope | SP | AI-assisted days | Manual days |
|---|--:|--:|--:|
| **Pilot (Phase A, E01–E07)** | **129** | **~48–79** | **~94–134** |
| Phase B (E08) | 71 | 26.5–46 | 53–91 |
| Phase C (E09) | 45 | 17–28 | 34–62 |
| Phase D (E10) | 16 | 6–10 | 10–15+ |
| **Full program** | **261** | **~97–164** | **~191–321** |

*(Reconciled 2026-09-15: adds the ui-specs template-gap tickets. Note SKODA-607 is Pilot:Yes/M1 but sits in epic E08, the §5 "Pilot (E01–E07)" bucket groups by *epic* (E08 → Phase B), so 607's 5 SP counts under Phase B here while it delivers at M1; see the register for the true M1/M2 tag.)*

*(Reconciled 2026-09-15: this §5 table sums to the §2 epic-index total. Pilot (E01–E07) = 15+35+14+19+21+13+12 = **129 SP**; full program **261 SP** across 63 tickets. Earlier versions understated the roll-up; now corrected. Note the §5 bucketing is by *epic* (E08 → Phase B), so SKODA-607, Pilot:Yes/M1 but in E08, counts under Phase B here even though it ships at M1; likewise SKODA-210 is M2 but sits in E02, so it counts under the Pilot/E01–E07 bucket.)*

- **Pilot ≈ 35–60 AI-assisted engineer-days** (vs ~71–106 manual), **this ticket-derived total is the canonical pilot figure.** It grew from 81→89 SP when the mission-critical **demo media-cart + client-side zip (SKODA-505, +8 SP)** was pulled into M1 per client scope, then **+5 SP (2026-09-10, build-confirmed)** for **SKODA-506 media pre-conditioning (+2)** and **SKODA-401 metadata-normalization (+3)**, offset by **SKODA-801 trending to the low end** of its 8 SP, then **+5 SP (2026-09-14, D18)** for **SKODA-207 Series template (+3)** and **SKODA-604 full-fidelity story restore (+2)**, and **+2 SP** for **SKODA-305 MR-footer variant**, all pulled into M1 from the 22-URL analysis + gap pass. The **canonical pilot total is 129 SP** (E01–E07, per the §5 table above; the earlier 117 predated the 2026-09-15 additions to the pilot epics, SKODA-208/209 in E02 and SKODA-706 in E07 from the template-gap pass, plus SKODA-210 in E02 from the block-recount cross-check, +12 SP total). The "81→89→94" figures above track only the incremental *additions* discussed on those dates, not the full E01–E07 sum. The `SKODA-STORYBOARD-SITE-FACTS.html` deck's earlier ~13–25-day headline covered only the *core build* chunks; this backlog is fuller (explicit foundation + import + QA tickets + the Škodapedia block + the demo cart + pre-conditioning). **The deck should be aligned to this figure** (adversarial-review finding F2).
- **Full program is a multi-month programme** dominated by Phase C (the 4 bespoke services + analytics) and Phase B story-flattening + Phase D content-ops.
- *Planning estimates, not a quote; AI-assisted assumes the migration tooling and experienced engineers steering it.*

---

## 6. Suggested Pilot Sequencing (sprints)

- **Sprint 1, Foundation:** 101, 102, 105, 106, 103, 104 (unblocks everything; stand up site + tokens + index skeleton).
- **Sprint 2, Blocks & chrome:** 201, 202, 203, 204, 205, 206, **207** (Series template), 301, 302, 303, 304 (parallelizable once 102/106 land).
- **Sprint 3, Listings/search + media + import infra:** 401, 402, 403, 501, 502, 503, 504, **505** (demo cart + client-side zip), 601, 602.
- **Sprint 4, Integrate & harden:** 603 (pilot pages), **604** (full-fidelity restore on 1–2 stories), 701, 702, 703, 704 (QA + sign-off).

---

## 7. Cross-Cutting Concerns

- **Consent + `skoda-analytics` coupling:** every interactive block (cards toolbar, gallery, embeds, listing load-more, downloads) emits analytics events today. Pilot uses **stubs** (SKODA-704); the full **dataLayer rebuild is SKODA-905** (Phase C), but block tickets should leave hooks so re-wiring is cheap. Consent (OneTrust) gates third-party embeds + analytics; load in the delayed phase.
- **Per-locale from day one:** index (104/401), fragments (301/304), and placeholders are built locale-aware even though the pilot is EN, avoids rework in Phase D.
- **`[RUNTIME-UNCONFIRMED]` follow-ups (need a browser):** gallery/glossary modal focus-trap, mega-menu hover/mobile-drawer behavior, real LCP/CLS, embed lazy timing, contrast. Concentrated in SKODA-203, 302, 702, 703.
- **Import discipline:** content-driven detection only (no URL/template coupling); DA push via `admin.da.live` source API with injected credentials (never a pasted token).

---

## 8. Open Decisions Gating Work (D1–D8 → tickets)

| Decision | Blocks | Note |
|---|---|---|
| **D1 Language scope** (EN vs 6) | E10 (1001–1003) | Pilot is EN; full rollout waits on this |
| **D2 Media-cart** (demo + prod approach) | SKODA-505, SKODA-902 | **Cart is IN for the 15 Oct demo** (device-ID, no login), built client-side in SKODA-505; static downloads (502) also ship. Open: CORS-enabled AEM Assets delivery for the demo set; reuse-legacy-vs-rebuild + serverless zip for prod (SKODA-902). See `SKODA-MEDIA-CART-DOWNLOAD.md`. |
| **D3 Banners** keep/rebuild/drop | SKODA-903 | Bespoke ad server; challenge scope |
| **D4 Newsletter** service | SKODA-904 | 10-route ESP account; pilot stubs |
| **D5 Media/DAM ownership** | SKODA-501, 503, 902 | Where masters + binaries live |
| **D6 Search** index-only vs hosted | SKODA-901 | Pilot = index-only (403) |
| **D7 Content cutoff** (archive scope) | SKODA-803 | Affects bulk-import volume |
| **D8 Scope check** (commerce ruled out; owners for Škodapedia/press-kits) | SKODA-802 | Commerce sub-question CLOSED |

> **Drive these to owner + date live:** `SKODA-DISCOVERY-SESSION-OCT15.md` is the 60-minute discovery agenda that resolves the open decisions above plus the client-side access/data/environment risks. Run it before demo-build start.

> **Client requirements traceability:** `../planning/SKODA-CLIENT-REQUIREMENTS-MAPPING.md` maps every ID in the client's `CMS-MediaRoomMigration-Requirements-*.pdf` (COM/STO/MR/MIG) to a built/solvable/open status **and to the SKODA-* tickets in this register**, use it as the two-way requirement↔ticket index. It also surfaces new decision **D17** (QR-code restricted end-user article access) and flags the §11 Press-Kit detail as candidate E08 tickets.

---

## 9. Doc Traceability

| Epic | Primary source `SKODA-*` doc(s) |
|---|---|
| E01 Foundation | `-EDS-DA-ARCHITECTURE` (§2, §6) |
| E02 Core Blocks | `-EN-BLOCK-INVENTORY`, `-BLOCK-IMPLEMENTATION-REVIEW`, `-SYSTEM-BUILD-SPECS` (§6) |
| E03 Chrome | `-HEADER-FOOTER-ANALYSIS` |
| E04 Listings/Search | `-SYSTEM-BUILD-SPECS` (§2), `-EDS-DA-ARCHITECTURE` (§6), `-DRILLDOWN` (§1) |
| E05 Media | `-MEDIA-DEEP-DIVE`, `-MEDIA-INTEGRATION-REVIEW`, `-SYSTEM-BUILD-SPECS` (§3) |
| E06 Import | `-EDS-DA-ARCHITECTURE` (§10) |
| E07 QA | `-BLOCK-IMPLEMENTATION-REVIEW`, `-ADVERSARIAL-REVIEW-2` (a11y/RUNTIME items) |
| E08 Editorial scale | `-ADVERSARIAL-REVIEW` (Page Builder), `-EN-BLOCK-INVENTORY` |
| E09 Dynamic services | `-COMPLEX-SYSTEMS-DEEP-DIVE`, `-SYSTEM-BUILD-SPECS` |
| E10 Localization | `-EDS-DA-ARCHITECTURE` (§9), `-DRILLDOWN` (§2) |

---

## 10. Notes & Corrections Baked In

- **15 taxonomy facets** (not 14), SKODA-401.
- **Škodapedia glossary:** the **block** (directory + A–Z/category filter + term modal) is a **pilot** ticket (**SKODA-206**, E02); the **bulk term-content pre-bake** as `/modals/` docs (→ fully static, no runtime API) is **SKODA-802** (Phase B). Directory + filter are client-side static; term detail is a thin fetch, eliminated by pre-baking.
- **Media footprint** figures are **order-of-magnitude** (variable derivative multiplier).
- **Banner platform** is a **bespoke per-market ad server** (SKODA-903), not a content block.
- **`skoda-analytics`** is a **hidden cross-cutting dependency** (SKODA-905).
- **Header/footer** simpler than feared (E03), mega-menu = plain nested lists; mobile nav needs an ARIA fix (SKODA-302).
- **Pilot = capability pilot** (not one page); story/Page-Builder + 3 backend services (banners/newsletter/hosted-search) deferred to B/C. **Exception:** the **media cart is IN for M1** (client scope, mission-critical demo), **SKODA-505** (device-ID, no login, client-side zip); **SKODA-902 re-scoped** to production hardening (serverless zip endpoint / signed access / cross-device). Demo cart hinges on **CORS-enabled AEM Assets delivery** (501/504). See `SKODA-MEDIA-CART-DOWNLOAD.md`.
- All estimates are **planning-level, not a quote**. Analysis/planning artifacts only, no code, import, or Git performed.
