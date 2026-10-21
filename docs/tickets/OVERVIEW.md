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
| **SKODA-805b** | press-kit child pages; D-1 = A, all 49 imported (was sized as option B, 3) | 5–8 | Could |
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
- **2026-09-27, SKODA-607 phase 1 (import + template):** the press release gets its own template
  (`templates/press-release/`, loaded via the `scripts.js` `TEMPLATES` allow-list). Block extensions are split out
  as **SKODA-223** (Gallery `preview`, 1.5), **SKODA-224** (Story Rail `press`, 1) and **SKODA-510** (Downloads
  file tiles, 1): +3.5 SP. **SKODA-612** is folded (importer → 607, block → 224). New contracts `gallery-preview`,
  `story-rail-press`, `downloads-file-rows`, `press-release-sections`.
- **2026-09-27, SKODA-608 phase 1 (media feed):** decision [`SKODA-MEDIA-ITEMS-OPTIONS.md`](../architecture/SKODA-MEDIA-ITEMS-OPTIONS.md),
  option B: AEM Assets is the source of truth; no page per image/video. `/en/media-feed.json` (74 images + 27 videos,
  contract `media-item` shape 3) is generated by `tools/importer/media-items/build-media-items.mjs`; `/en/images`,
  `/en/videos` and the model-page media rails read it. Block work: **SKODA-402a** (listing layout, 1 SP),
  **SKODA-406** (listing media card, 2 SP); **SKODA-208** amended. **M2:** **SKODA-511** (AEM Assets → feed sync,
  3–5 SP), **SKODA-512** (media taxonomy in AEM Assets, 2 SP).
**Update (2026-10-15, M2 readiness review):** [`SKODA-M2-READINESS-REVIEW-2026-10-15.md`](../reviews/SKODA-M2-READINESS-REVIEW-2026-10-15.md).
- **GitHub sync:** 45 rows marked done; 13 rows added; 8 ticket files mirrored from the issues.
- **New planning docs:** a page census in [`SKODA-PAGE-COVERAGE-MATRIX.md`](../planning/SKODA-PAGE-COVERAGE-MATRIX.md): 313 of ≈ 4,620 EN pages live, and the sitemaps miss 193 stories, 72 releases and ≥ 95 press-kit pages. A decision register in [`SKODA-DECISION-REGISTER.md`](../planning/SKODA-DECISION-REGISTER.md) (D1–D19 + Q-1–Q-6).
- **Follow-ups created as M2 issues:** 843 (#363), 844 (#364), 845 (#365), 847 (#366), 848 (#367), 801b (#368), 806a (#369), 808a (#370), 504a (#371). #342 → M2; #334 → M2.
- **Census amendments:** 209, 210, 405, 803, 810, 1001.
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
| SKODA-101 | DA/EW site + repo + Code Sync | E01 | 3 | 1–2 | 2–4 |, | ✅ Done (#2 closed 2026-09-21). Was: 🟢 |
| SKODA-102 | Boilerplate scaffold | E01 | 3 | 1–2 | 3–5 | 101 | ✅ Done (#10 closed 2026-09-21). Was: 🟢 |
| SKODA-103 | Config sheets (placeholders/metadata/redirects) | E01 | 2 | 0.5–1 | 1–2 | 102 | ✅ Done (#11 closed 2026-09-21). Was: 🟢 |
| [SKODA-101a](tickets/SKODA-101a.md) | Author identity: Škoda IdP federation, DA permissions, Edge Delivery roles, preview protection (#407) | E01 | 3.5 | 1–2 | 2–3 | client IdP/Admin Console, D15, Q-15 | 🔵 M2; **blocks 809, 812, 811 group gate**; preview is public today · amended 2026-10-21 (gap review) |
| SKODA-104 | helix-query.yaml skeleton (per-locale) | E01 | 3 | 1–2 | 2–3 | 102 | ✅ Done (#12 closed 2026-09-21). Was: 🟡 index critical path |
| SKODA-105 | Sidekick v7 + preview/publish | E01 | 1 | 0.5 | 1 | 101 | ✅ Done (#13 closed 2026-09-21). Was: 🟢 |
| SKODA-106 | Design tokens + global CSS (re-derived) | E01 | 3 | 1–2 | 3–5 | 102 | ✅ Done (#14 closed 2026-09-22). Was: 🟢 |
| [SKODA-826](tickets/SKODA-826.md) | Global page gutter parity (10px at every width, not 24/40px) | E01 | 0.5 | 0.25 | 0.5 | 106 | ✅ Done (#149 closed 2026-09-29). Was: M1 Must; from the 2026-09-25 URL→block sweep (#149) |
| [SKODA-827](tickets/SKODA-827.md) | Homepage promo, Latest Stories and Latest News regress after re-import | E06 | – | – | – | – | 611a | ✅ Done (#191 closed 2026-09-29). The ID was reused: the float-dock draft 827 was folded into 215 on 2026-09-25 |
| SKODA-201 | Cards/Teaser (overlay/media/toolbar) | E02 | 5 | 2–3 | 5–7 | 102,106 | ✅ Done (#15 closed 2026-09-23). Was: 🟢 |
| SKODA-202 | Hero (image, LCP) | E02 | 2 | 1 | 2–3 | 102,106 | ✅ Done (#16 closed 2026-09-23). Was: 🟢 |
| [SKODA-828](tickets/SKODA-828.md) | Hero parity across templates: press kit, model, archive + ultrawide (sweep follow-ups) | E02 | 5 | 2–3 | 4–5 | 826,805a,208,209 | ✅ Done (#196 closed 2026-10-06). Was: M1; in review 2026-10-05 ([PR #253](https://github.com/skoda-storyboard/demo/pull/253), branch `skoda-828-hero-parity`): press kit, model, archive and story hero match the source 375–3840; 41 archive pages in DA, 6-story push after merge. From the 2026-09-28 hero sweep (#196); owns the hero UI moved out of 208/209/805a |
| SKODA-203 | Gallery + lightbox modal | E02 | 5 | 2–3 | 4–6 | 102,106 | ✅ Done (#17 closed 2026-09-24). Was: 🟡 a11y modal `[RUNTIME-UNCONFIRMED]` |
| SKODA-204 | Embeds (4 providers, dnt=1, lazy) | E02 | 3 | 1–2 | 2–4 | 102 | ✅ Done (#152 closed 2026-09-29). Was: 🟢 |
| [SKODA-204a](tickets/SKODA-204a.md) | Embeds consent placeholder + click-to-load hook (follow-up to #18) | E02 | 0.5 | 0.25 | 0.5 | 204,606 | ✅ Done (#152 closed 2026-09-29). Was: M1 Must; sweep §11.1 (204 AC l.47/49 gap); D1 follow-up, not a reopen |
| [SKODA-834](tickets/SKODA-834.md) | Widget autoblock: same-origin `/widgets/` links only, never insert a failed response | E02 | 1 | 0.25–0.5 | 0.5–1 | 828,805c | ✅ Done (#256 closed 2026-10-12). Was: 🔵 M1, **ready to pick up** (M1 review 2026-10-11); #256, specified, assigned, no PR yet |
| [SKODA-831](tickets/SKODA-831.md) | Category archives scope stories by WordPress category membership (`categories` index column) | E02 | – | – | – | 209,214,830 | ✅ Done (#260 closed 2026-10-07). Was: M1; #260, audit F2; rollout steps 1–2 done 2026-10-06 (index column + 57 stories), archives wait for the code on main |
| SKODA-205 | Tags / metadata | E02 | 1 | 0.5 | 1 | 102 | ✅ Done (#19 closed 2026-09-23). Was: 🟢 |
| SKODA-206 | Škodapedia glossary block (directory + A–Z filter + modal) | E02 | 5 | 2–3 | 4–6 | 102,106 | 🟡 modal a11y `[RUNTIME-UNCONFIRMED]`; **M2** on the board (aligned 2026-09-25) |
| SKODA-207 | Series template (2-level: directory + hub) | E02 | 3 | 1–2 | 2–4 | 201,202,402,601 | ✅ Done (#21 closed 2026-09-28). Was: M1 (D18); reuses cards/hero/grid |
| SKODA-211 | DA tag-management library plugin (DA_SDK multi-select) | E02 | 3 | 1–2 | 2–3 | 102,205,401 | ✅ Done (#54 closed 2026-09-22). Was: M1; CLOSED (done); build-confirmed 2026-09-16 (PR #60, issue #54) |
| SKODA-212 | Horizontal rails block (story-rail + carousel) | E02 | 3 | 1–2 | 3–5 | 201,402,401,106 | ✅ Done (#98); watchCSS + a11y; spec `ui-specs/carousel-rails.md` |
| [SKODA-212a](tickets/SKODA-212a.md) | Rails desktop pointer fix: click navigates, drag scrolls (follow-up to #98) | E02 | 1 | 0.5 | 1 | 212 | ✅ Done (#150 closed 2026-09-29). Was: M1 Must **P0**; sweep §11.1 V1 (live-confirmed P1 defect); D1 follow-up, not a reopen |
| SKODA-213 | Promo-box block (featured mosaic / auto-rotate slider) | E02 | 2 | 0.5–1 | 2–3 | 201,106,202 | ✅ Done (PR #110, issue #99); mosaic≥768 / 1-up auto-rotate<768; stories feed `offset`; spec `ui-specs/carousel-rails.md` §3/§5 |
| SKODA-214 | Stories feed block (Load-more pager, query-index) | E02 | 2 | 0.5–1 | 1–2 | 201,402,401,106 | ✅ Done (#97 closed 2026-09-24). Was: M1; `blocks/stories` unbuilt; facet-less reuse of 402 loader/paginate; spec `ui-specs/stories.md` (was SKODA-211, renumbered 2026-09-23) |
| SKODA-216 | Story gallery variant (`sb-gallery`) + lightbox | E02 | 3 | 1–2 | 2–4 | 203,106 | ✅ Done (#106 closed 2026-10-01). Was: M1; story-variant of Gallery (lead image + 4-across strip, green lightbox); issue #106 (2026-09-24) |
| SKODA-217 | Homepage social-media icon cards | E02 | 1 | 0.5 | 1–2 | 201,106 | ✅ Done (#107 closed 2026-09-28). Was: M1; block variant; issue #107 (2026-09-24) |
| SKODA-218 | Metadata-driven dark section styling | E02 | 1 | 0.5 | 1–2 | 106 | ✅ Done (#108 closed 2026-09-28). Was: M1; Section Metadata Style→class; issue #108 (2026-09-24) |
| [SKODA-219](tickets/SKODA-219.md) | In-body story image carousel (`skoda-carousel-widget`) | E02 | 3 | 1–1.5 | 2–3 | 212,501,106 | ⛔ Closed, not planned (#116, 2026-09-24). Was: M1 Must; 21/21 in-set stories; unspecced before 2026-09-24 (gap review G-02). **⛔ Superseded by SKODA-819** (review §15) |
| [SKODA-215](tickets/SKODA-215.md) | Floating action bar: share cluster + scroll-to-top | E02 | 2 | 0.5–1 | 1–2 | 106,505a | ✅ Done (#139 closed 2026-09-29). Was: M1; Demo sweep 2026-09-25; ID existed, file created. The DevTools census puts the dock on **all 42 URLs** (every template), not only stories/series/2 kits; draft 827 folded in (8 anchors, cart slot, intent URLs, a11y) |
| [SKODA-220](tickets/SKODA-220.md) | Quote block (centred pull-quote + rule + attribution) | E02 | 2 | 0.5–1 | 1–2 | 607,805c,801 | ✅ Done (#140 closed 2026-10-05). Was: M1; Demo sweep 2026-09-25; 4 PRs + 1 PK; block + importer on main; press-kit chapter quotes (`Quote (left)`, 5 chapters) + Elroq accordion quote built 2026-10-01 (branch `skoda-220-press-kit-quotes`); press releases held by the 503 gate |
| [SKODA-221](tickets/SKODA-221.md) | Cards `tiles`/mosaic variant (series + press-kit hubs) | E02 | 3 | 1 | 2–3 | 201,207,805a | ✅ Done (#141 closed 2026-09-28). Was: M1; Demo sweep 2026-09-25; 5 series + 3 PK hubs |
| [SKODA-222](tickets/SKODA-222.md) | Stories: featured model card on model tag archives (UI) | E02 | 2 | 0.5–1 | 1–2 | 209,214 | ✅ Done (#167 closed 2026-10-01). Was: M1 Should; in review 2026-09-30 (branch `skoda-222-featured-model`, pushed; no PR yet); content imported (contract `stories-feature`, now on main) |
| [SKODA-223](tickets/SKODA-223.md) | Gallery `preview` variant (press-release sidebar media-kit preview, "+N" pill) (#171) | E02 | 1.5 | 0.5 | 1–1.5 | 203,607,819 | ✅ Done (#171 closed 2026-09-28). Was: In review ([PR #201](https://github.com/skoda-storyboard/demo/pull/201)), M1; from the 607 phase split (contract `gallery-preview`, readable fallback). Branch `skoda-223-gallery-preview` matches the source rects on all 5 releases |
| [SKODA-224](tickets/SKODA-224.md) | Story Rail `press` variant (Related Press Releases band cards) (#172) | E02 | 1 | 0.5 | 1 | 212,212a,820,607 | ✅ Done (#172 closed 2026-09-30). Was: M1; from the 607 phase split + 612 block half (contract `story-rail-press`) |
| [SKODA-225](tickets/SKODA-225.md) | Columns unequal split + intrinsic portrait (story 2-cell rows) | E02 | 1 | 0.5 | 1 | 801,824 | ✅ Done (#142 closed 2026-10-05). Was: 🟡 ready for QA 2026-10-01: `Columns (split-NN[, portrait-NNN])`, contract v2; 4 stories match live (±2px) on drafts copies; re-import after merge |
| [SKODA-228](tickets/SKODA-228.md) | Card titles keep their colour on hover in every rail and card grid | E02 | 0.5 | 0.25 | 0.5 | 201,224 | ✅ Done (#323 closed 2026-10-13). Was: 🟡 M1, in review 2026-10-12 on `fix-296-stories-qa` (the #296 PR); #323; one shared fix for the hover rows of #274/#284/#296 |
| [SKODA-226](tickets/SKODA-226.md) | Charging profile heading and portrait sizing parity (#292) | E02 | – | – | – | 225,824 | 🔵 M2, ready to pick up; GitHub-only until 2026-10-15 (file mirrored) |
| [SKODA-227](tickets/SKODA-227.md) | Related Stories heading-to-card spacing parity (#293) | E02 | – | – | – | 820,212 | 🔵 M2, ready to pick up; GitHub-only until 2026-10-15 (file mirrored) |
| SKODA-229 | Series directory cards: no image zoom on hover | E02 | – | – | – | 207,221 | ✅ Done (#331 closed 2026-10-14, PR #347) |
| SKODA-230 | Media Room home rails: card parity with the source | E02 | – | – | – | 212,224 | ✅ Done (#332 closed 2026-10-15, PRs #343/#351) |
| SKODA-301 | Header + mega-menu (3 panels) | E03 | 5 | 2–3 | 4–6 | 102,106 | ✅ Done (#22 closed 2026-09-22). Was: 🟡 |
| SKODA-302 | Mobile nav toggle + ARIA (a11y fix) | E03 | 2 | 1 | 1–2 | 301 | ✅ Done (#23 closed 2026-10-07). Was: 🟡 fixes source gap |
| [SKODA-303](tickets/SKODA-303.md) | Language switcher (6 locales) (#24) | E03 | 2 | 1 | 1–2 | 301 | ✅ Done (#24 closed 2026-10-01). Was: 🟡 ready for QA 2026-09-30: matches live at every width, AA links, current from the URL; locale trees not on EDS yet |
| [SKODA-303a](tickets/SKODA-303a.md) | Language switcher vs link containment: the locale-link rule | E03 | 0.5 | 0.25 | 0.5 | 303,609 | ✅ Done (#243 closed 2026-10-14). Was: 🟡 M1, in review: #243, [PR #299](https://github.com/skoda-storyboard/demo/pull/299); rule decided 2026-10-08 (page `hreflang` alternates); ticket text on the issue (its file was in PR #270, closed unmerged) |
| SKODA-304 | Footer fragment | E03 | 3 | 1–2 | 2–4 | 102,106 | ✅ Done (#25 closed 2026-09-24). Was: 🟢 · amended 2026-10-21 (gap review) |
| SKODA-305 | Media Room footer variant | E03 | 2 | 1 | 1–2 | 304,301 | ✅ Done (PR #134, issue #26); closes gap G1 (COM18); unify-vs-distinct 🟡 |
| [SKODA-306](tickets/SKODA-306.md) | Footer outbound-link browsing-context parity (`target=_blank`) | E03 | 1 | 0.5 | 1 | 304 | ✅ Done (#102 closed 2026-10-06). Was: M1; issue #102; file added 2026-09-24 |
| [SKODA-307](tickets/SKODA-307.md) | Header/footer survive a missing nav/footer fragment (null guard) | E03 | 0.5 | 0.25 | 0.5 | 301,304 | ✅ Done (#143 closed 2026-09-28). Was: M1; from the 2026-09-25 live-footer incident |
| [SKODA-308](tickets/SKODA-308.md) | Chrome parity pass (header, search, mobile nav, footer legal links, topbar newsletter) | E03 | 3 | 1 | 2–3 | 301,302,303,304,307,403,823 | ✅ Done (#144 closed 2026-10-07). Was: M1; Demo sweep 2026-09-25; every page |
| [SKODA-309](tickets/SKODA-309.md) | Media Room side chrome (MR nav, active tab, nav/footer metadata) | E03 | 2 | 0.5–1 | 1–2 | 301,305,307,607,805a,602 | ✅ Done (#145 closed 2026-09-28). Was: M1; Demo sweep 2026-09-25; **16** MR URLs incl. 5 model pages; draft 825 folded in; unblocked (#134 merged); MR nav fragment still 404 |
| SKODA-401 | Query-index schema + selectors + metadata-normalization (15 facets) | E04 | 8 | 3–5 | 5–8 | 104 | ✅ Done (#27 closed 2026-09-22). Was: 🟠 build-confirmed: admin-service `query.yaml` (not repo); fields need normalization layer, not clean selectors |
| SKODA-402 | Faceted listing + load-more (deep-link) | E04 | 8 | 3–5 | 6–9 | 401,201 | ✅ Done (#28 closed 2026-09-23). Was: 🟠 hardest pilot block |
| [SKODA-402a](tickets/SKODA-402a.md) | Listing layout QA fix: 1/3/4/4 grid + facets collapsed behind "Advanced filter (n)" (follow-up to 402) (#175) | E04 | 1 | 0.5 | 1 | 402,608 | ✅ Done (#175 closed 2026-09-30). Was: M1; from the 608 phase split (sweep V10) |
| SKODA-402b | Media-listing toolbar spacing and active-sort color parity | E04 | – | – | – | 402a | ✅ Done (#248 closed 2026-10-07) |
| [SKODA-402d](tickets/SKODA-402d.md) | News and Press Kits listings: every source facet, so deep links like `filter[sponsorship][]` work (#333) | E04 | 1 | 0.5 | 1 | 402,808 | 🟡 M1, in QA: PR #355 merged 2026-10-15 |
| SKODA-403 | Search block (index-only) | E04 | 3 | 1–2 | 2–4 | 401 | ✅ Done (#29 closed 2026-09-25). Was: 🟡 body-search deferred |
| SKODA-405 | RSS feed generation (query-index → RSS 2.0) | E04 | 4 | 0.5–1 | 1–2 | 401 | 🟢 **M2** (aligned to board 2026-09-25; was M1 stretch); agent-fit · amended 2026-10-21 (gap review) |
| [SKODA-406](tickets/SKODA-406.md) | Listing media-card cell (image/video: date, filename, download toolbar, video badge, lightbox) (#176) | E04 | 2 | 1 | 1.5–2 | 402,608,203,216,502,505a | ✅ Done (#176 closed 2026-09-29). Was: M1; ready for QA 2026-09-29 (matches the source on DA test pages; 768 columns wait on 402a); from the 608 phase split |
| SKODA-501 | Masters-only image ingest (img-out-of-`<p>`, alt/caption) | E05 | 3 | 1–2 | 2–3 | 102 | ✅ Done (#30 closed 2026-09-25). Was: 🟢 |
| SKODA-502 | Static Downloads block (mediabox) | E05 | 3 | 1–2 | 2–3 | 102 | ✅ Done (#31 closed 2026-09-25). Was: 🟢 |
| SKODA-503 | PDF/MP4 handling (link/DAM) | E05 | 2 | 0.5–1 | 1–2 | 501 | ✅ Done (#32 closed 2026-09-28). Was: 🟡 MP4 signed-flow (cart now SKODA-505) |
| SKODA-504 | Map S3 images → AEM Assets (manifest) | E05 | 3 | 1–2 | 2–3 | 501,601 | ✅ Done (#49 closed 2026-09-22). **M2 review 2026-10-15:** M2 scale-out (rights, dedup, unmatched, approval filter) → proposed follow-up **SKODA-504a** (M2). Was: 🟠 A/B unconfirmed; M2 scale = rights+dedup |
| [SKODA-504a](tickets/SKODA-504a.md) | AEM Assets scale-out: full media set, rights, dedup, approval (#371) | E05 | 3–5 | 1.5–2.5 | 3–5 | 504,506,518,#219 | 🔵 M2 (#371, created 2026-10-15); gated on D5 / D7. 2026-10-16: + DA source on DAM URLs, sha256 dedup ([review](../architecture/SKODA-ASSET-INGESTION-M2.md)) |
| SKODA-505 | Demo media-cart + client-side zip (device-ID, no login) | E05 | 8 | 3–5 | 6–10 | 502,501,504,601 | ✅ Done (#33 closed 2026-09-21). Was: 🟠 mission-critical demo; CORS/AEM-Assets linchpin |
| SKODA-506 | Media pre-conditioning: strip/replace oversized masters before publish | E05 | 2 | 0.5–1 | 1–2 | 501 | ✅ Done (#34 closed 2026-09-27). Was: 🟠 build-confirmed: 25–40 MB masters 409 the content bus; gates publish |
| SKODA-505a | Media-cart download logic (device-ID + originals + multi-select zip) (#50) | E05 | 5 | 2–3 | 4–6 | 501,504,502,601 | ✅ Done (#50 closed 2026-10-05). Was: M1; ready for QA 2026-09-30 (headless store + resolver index + fflate zip; binds the listing, story-rail and lightbox adds; 505b builds the visuals on its API) |
| SKODA-505b | Media-cart presentation + live AEM DAM delivery wiring (#51) | E05 | 3 | 1–2 | 2–3 | 505a,501,504 | ✅ Done (#51 closed 2026-10-01). Was: M1; ready for QA 2026-09-30 (badge, added states, limit banner/notice, `/en/media-cart` page block, downloads tile + group adds; live CORS zip verified); human gate: visual sign-off + author the DA cart page |
| SKODA-507 | Native AEM Assets picker in DA/EW (Media Bus delivery) | E05 | 2 | 0.5–1 | 1–2 | 504,505b | ✅ Done (#62 closed 2026-10-12). **M2 review 2026-10-15:** Picker live 2026-10-12 (DA config `key`/`value` fix); D13 is answered for the media picker. Was: 🔴 BLOCKED (client AEM env + DA site config, creds) |
| SKODA-601 | Import infra: parsers + transformers | E06 | 5 | 2–3 | 4–6 | 102 | ✅ Done (#35 closed 2026-09-24). Was: 🟡 content-driven only |
| [SKODA-602](tickets/SKODA-602.md) | DA source-API push + bulk-op publish | E06 | 3 | 1–2 | 2–3 | 601 | ✅ Done (#36 closed 2026-09-25). Was: 🟢 **built + piloted 2026-09-25** (`push-to-da.mjs`, branch `skoda-602-da-push`); credential gate resolved |
| SKODA-603 | Pilot page set imported + validated, **re-scoped 2026-09-24 to the 43-URL set + rail corpus + tracker** | E06 | 5 | 2–3 | 3–5 | 601,602,201,202,203,204,205,501,502 | ✅ Done (#37 closed 2026-09-30). Was: M1 content critical path. **W0 done 2026-09-25:** tracker `planning/skoda-m1-url-status.md` (16/136 pages live + indexed) + pending-block contract `planning/SKODA-PENDING-BLOCK-CONTRACTS.md`; gated waves W1–W4 |
| SKODA-604 | Full-fidelity restore on 1–2 hero demo stories | E06 | 2 | 0.5–1 | 1–2 | 203,204,502,505,601,602,801 | ✅ Done (#38 closed 2026-10-12). Was: 🟡 M1 (D18), in review: #38, [PR #315](https://github.com/skoda-storyboard/demo/pull/315); media restored (#113/#156/#269); Media Box lightbox on `skoda-604-media-box-lightbox` (after merged #307); human gate: ≤2% visual sign-off |
| [SKODA-606](tickets/SKODA-606.md) | Strip stray consent/UI text nodes from imported content | E06 | 1 | 0.5 | 0.5–1 | 601,602 | ✅ Done (#40 closed 2026-10-11): "Manage Cookies" on 0 / 285 published pages and not on live `/en` |
| [SKODA-605](tickets/SKODA-605.md) | Rewrite absolute source URLs to site-relative in import (#39) | E06 | 2 | 0.5–1 | 1–2 | 601,602 | ✅ Done (#39 closed 2026-09-25). Was: M1; code done 2026-09-25 (`skoda-links.js` in all 16 importers, demo-page allow-list, D-3 (b) for the rest); 2 pages published, the rest ride with 508/603/607/801a/208 |
| SKODA-607 | Press Release detail template (split from story) | E08 | 5 | 2–3 | 4–6 | 601,602,502 | ✅ Done (#47 closed 2026-09-30). Was: M1; phase 1 (import + own template `templates/press-release/`) on branch `skoda-607-press-release` 2026-09-27; closes after 223/224/510 + final visual diff; spec `ui-specs/template-press-release.md` |
| [SKODA-607a](tickets/SKODA-607a.md) | Press-release page-level UI parity + final visual QA (#224) | E08 | — | — | — | 607,220,824 | ✅ Done (#224 closed 2026-10-09). Was: M1; branch `skoda-607a-press-release-parity` 2026-10-06: geometry = source down to the first quote on the 5 releases (drafts); rest = italic face, FAQ `<br>` (#148), Peaq video bar; ≤2% gate recorded, **FAIL** (also teaser crop 510/223/224); real pages wait for the DAM ingest |
| [SKODA-608](tickets/SKODA-608.md) | Image & video item index rows (listings + model media rails) | E06 | 3 | 1–1.5 | 2–3 | 601,602,401,501,503 | ✅ Done (#117 closed 2026-09-27). Was: M1; phase 1 2026-09-27: media feed /en/media-feed.json (74 images + 27 videos, option B: AEM Assets is the source of truth, no item pages); listings + model rails read it; UI → 402a / 406; M2 sync → 511 |
| [SKODA-608a](tickets/SKODA-608a.md) | Media feed refresh: Images / Videos rails stop at 25 Sep / 2 Sep; 14 file-name titles (follow-up to 608) (#342) | E06 | 1 | 0.5 | 1 | 608,511,505 | 🔵 M2 (#342; milestone set 2026-10-15, with 511); found on the Media Room home rails, 2026-10-12 |
| [SKODA-609](tickets/SKODA-609.md) | M1 link containment + mixed-reality alias redirect | E06 | 2 | 1 | 1–2 | 605,103,603 | ✅ Done (#243 closed 2026-10-14). Was: 🟡 M1 Must; decision D-3. Code done 2026-09-30 (`scripts/links.js`, dead links 61 → 9); redirect row + 603 imports pending |
| [SKODA-610](tickets/SKODA-610.md) | Clean index titles (drop " - Škoda Storyboard") | E06 | 1 | 0.25–0.5 | 0.5–1 | 401,602,603 | ✅ #146 closed 2026-09-26 (PR #138); 5/125 index rows still suffixed → re-push in 603 W4; rail clamp → 212a |
| [SKODA-508](tickets/SKODA-508.md) | `skoda-images` turns card-image `data-caption` excerpts into body paragraphs | E05 | 1 | 0.25–0.5 | 0.5–1 | 501 | ✅ #158 closed 2026-09-25 (PR #161); 10/10 PR re-imports Title-only vs DA; 5 caption PRs republished; follow-ups 509, 612 |
| [SKODA-509](tickets/SKODA-509.md) | `skoda-images.js` doesn't use the transformer hook signature (validator fails on every edit) | E05 | 0.5 | 0.25 | 0.25–0.5 | 508 | 🔵 M2; tooling, from 508 |
| [SKODA-510](tickets/SKODA-510.md) | Downloads file tiles (PDF / no-image rows, video badge) + mobile Show more (#173) | E05 | 1 | 0.5 | 1 | 502,503,607 | ✅ Done (#173 closed 2026-09-28). Was: M1; from the 607 phase split (contract `downloads-file-rows`) |
| [SKODA-514](tickets/SKODA-514.md) | Mask clipped Media Box thumbnails behind Show more | E05 | – | – | – | 502,510 | 🟡 M1, in QA: PR #335 merged 2026-10-15; QA (jkondalu) posted 6 new observations the same day (title crop at 768, h3 headings, Media Box dates) |
| [SKODA-511](tickets/SKODA-511.md) | AEM Assets → media feed: the row builder (sync core; runtime-independent module + CLI) (#178) | E05 | 3 | 1–2 | 2–4 | 504,512,517,518,608 | 🔵 M2; split 2026-10-16 into 511 / 511a / 511b (App Builder review) |
| [SKODA-511a](tickets/SKODA-511a.md) | App Builder orchestration for the media feed sync: events, 15-min sweep, nightly reconcile (#382) | E05 | 3 | 1–2 | 2–4 | 521,511,517 | 🔵 M2; **blocked by 521** |
| [SKODA-511b](tickets/SKODA-511b.md) | Media feed sync operations: monitoring, credential lifecycle, runbook, handover (#383) | E05 | 1.5 | 0.5–1 | 1–2 | 511a,511,521 | 🔵 M2 |
| [SKODA-512](tickets/SKODA-512.md) | Media taxonomy in AEM Assets (15 facet tag namespaces + source-term mapping at ingest) (#179) | E05 | 2 | 0.5–1 | 1.5–2 | 504,401 | 🔵 M2; from the 608 decision (facets aren't AEM tags yet) |
| [SKODA-513](tickets/SKODA-513.md) | Native delivery for Images lightbox previews and fallback links (#289) | E05 | – | – | – | 511,406,219 | 🔵 M2; coordinate with 511 and #219 (native sources) before starting |
| [SKODA-515](tickets/SKODA-515.md) | Media Box bulk-add fly-to-cart feedback (#294) | E05 | – | – | – | 514,505b | 🔵 M2; starts after 514 (#295) closes |
| [SKODA-516](tickets/SKODA-516.md) | Model-page Images / Videos rails come out empty: media feed lacks bodywork / derivative facets (#334) | E05 | 2 | 1 | 2 | 608,511 | 🔵 M2 (#334; moved from M1 2026-10-15): data gap, the full fix needs a DAM ingest; with 608a / 511 |
| [SKODA-517](tickets/SKODA-517.md) | Media feed shaped for scale: rail slices, listing head, facet index, keyed shards + shared loader (#375) | E05 | 3 | 1.5–2 | 3–4 | 608,406,702 | 🔵 M2 (proposed 2026-10-16, [asset-ingestion review](../architecture/SKODA-ASSET-INGESTION-M2.md)) · #375 |
| [SKODA-518](tickets/SKODA-518.md) | Media manifest as a sharded ledger; AEM Assets metadata (sha256, logicalId) as the record of identity (#376) | E05 | 2 | 1–1.5 | 2–3 | 504,503 | 🔵 M2 (proposed 2026-10-16); prerequisite for 504a bulk ingest · #376 |
| [SKODA-519](tickets/SKODA-519.md) | Retire the code-bus media cart index: resolve from DAM URLs, legacy keys in content shards (#377) | E05 | 1.5 | 0.5–1 | 1–2 | 505a,517,511,504a | 🔵 M2 (proposed 2026-10-16) · #377 |
| [SKODA-520](tickets/SKODA-520.md) | Source CDN cutover: no page, fragment, feed or code path depends on skoda-storyboard.com files (#378) | E05 | 5 | 2–3 | 4–6 | 504,503,506,518,#219 | 🔵 M2 **P1, start now** (decided 2026-10-16); census: 5,222 of 8,179 page images + 4,581 of 7,369 links already rewritable · #378 |
| [SKODA-521](tickets/SKODA-521.md) | App Builder platform set-up: entitlement, project, credentials, connection checks (#381) | E05 | 2 | 1 | 2 | client org admins | 🔵 M2; **blocks 511a** (511 needs its AEM credential); client asks C1–C7 first (entitlement is the long pole); review in `SKODA-APP-BUILDER-INTEGRATION.md` |
| [SKODA-522](tickets/SKODA-522.md) | Asset changes reach pages: re-publish on update, report on unpublish and expiry (#389) | E05 | 3 | 1–2 | 2–4 | D20,520,521,511a,511b,518 | 🔵 M2; approach depends on **D20** |
| [SKODA-523](tickets/SKODA-523.md) | Media beyond images: MP4 library, annual reports and PDFs, non-EN CDN refs, captions, Vimeo allow-list (#425) | E05 | 1 | 2–3 | 4–6 | 520,504,608,Q-18 | 🔵 M2; MP4 library ≈ 0.4–0.6 TB · split 2026-10-21: 3 sub-tickets, 11 SP in total |
| [SKODA-523a](tickets/SKODA-523a.md) | MP4 library: per-file list, sizing, batch plan and delivery of files over 1 GB | E05 | 4 | 2 | 4–5 | SKODA-523 | 🔵 M2; sub-ticket of SKODA-523 |
| [SKODA-523b](tickets/SKODA-523b.md) | Source references in every locale: census, rewrite and a zero-reference gate that sees drops | E05 | 3 | 1–2 | 3–4 | SKODA-523 | 🔵 M2; sub-ticket of SKODA-523 |
| [SKODA-523c](tickets/SKODA-523c.md) | Documents: Word, ZIP, PowerPoint and audio kinds, the REST-sourced PDF link census, orphan documents | E05 | 3 | 1–2 | 3 | SKODA-523 | 🔵 M2; sub-ticket of SKODA-523 |
| [SKODA-611](tickets/SKODA-611.md) | Storyboard home composition (/en cover-box stack, promo exclusion) | E06 | 2.5 | 1 | 2–2.5 | 212,213,214,217,218,603 | ✅ Done (#153, #151, #147 closed 2026-10-05). Was: M1; Demo sweep 2026-09-25; **parent** of 611a/611b (D2); 611a ✅ (#205), 611b in review (PR #238); closes with 611b |
| [SKODA-611a](tickets/SKODA-611a.md) | Home section structure: 9 cover-box sections, dark bands, social strip (Must slice) | E06 | 1 | 0.5 | 1 | 213,214,217,218,603 | ✅ Done: merged (#205, 2026-09-29), `/en` re-imported and pushed with SKODA-827; issue #151 closed |
| [SKODA-611b](tickets/SKODA-611b.md) | Home band spacing: light-band padding + gaps to live, + home rails (Should slice) | E06 | 1.5 | 0.5 | 1–1.5 | 611a,218,212,224,827 | ✅ Done (#153 closed 2026-10-05). Was: M1 Should; in review (PR #238, branch `skoda-611b-home-spacing`): band spacing + home rails (card ladder, caption cards, "All" pill + end card); every band within 1px of live after merging main (2026-10-01); /en re-import pending DA push |
| [SKODA-612](tickets/SKODA-612.md) | Press-release Related Press Releases band imported as default content (empty-`href` card images) | E06 | 1.5 | 0.5 | 1–1.5 | 508,212,603 | ⤵ folded 2026-09-27: importer half → 607, block half → 224 |
| [SKODA-801a](tickets/SKODA-801a.md) | M1 story import fidelity slice (Media Box + 21-story run; carousel → 819, Vimeo → 818) | E08 | 1.5 | 0.5–1 | 1.5–2 | 601,801,819,818,502,204 | ✅ Done (#127 closed 2026-10-10). Was: M1 Must; delivered via 830; link allow-list fix PR #312 merged, 50 pages published 2026-10-10; #127 closed |
| [SKODA-805a](tickets/SKODA-805a.md) | Press-kit tiles hub, M1 slice + importer (3 hubs) | E08 | 3 | 1–2 | 3–4 | 601,602,202,201,305,609 | ✅ Done (#128 closed 2026-09-29). Was: M1 Must; slice of 805 |
| [SKODA-805b](tickets/SKODA-805b.md) | Press-kit child pages for M1 hubs (D-1 = A: import all 49) | E08 | 5–8 | 1–2 | 3–5 | 805a,805c,502,609 | ✅ Done (#129 closed 2026-09-29). Was: M1 Could; 49 child pages in the URL-set addendum |
| [SKODA-805c](tickets/SKODA-805c.md) | `press_kit-template-default` article + accordion (first-glimpse) | E08 | 3 | 1–2 | 3 | 607,204,205,502,506 | ✅ Done (#225, #130 closed 2026-10-06). Was: M1 Should; slice of 805/807; ready for QA 2026-09-29 (DA previewed, not published) |
| SKODA-701 | Lint + unit tests | E07 | 2 | 1 | 1–2 | E02,E03,E04 | 🟢 |
| [SKODA-702](tickets/SKODA-702.md) | Performance (Lighthouse≈100/RUM) | E07 | 3 | 1–2 | 2–3 | 603 | 🟡 M1; branch `skoda-702-performance` 2026-10-07: every AC measured; 2 CLS fixes (press-kit grid rows while loading, per-platform/weight fallback fonts): CLS ≤ 0.007 on the A/B pages (was up to 0.212); RUM beacons verified, field data needs the RUM explorer key; follow-ups: category LCP (831/209), fast-start MP4 (503/506) |
| [SKODA-702a](tickets/SKODA-702a.md) | Epiq story performance: YouTube click-to-load facade (desktop TBT) | E07 | 2 | 0.5–1 | 1–2 | 702,204a,818 | 🔵 M1; from the PR #232 PSI failure (desktop 74, TBT 570ms; `main` 64–69 locally); live uses `lite-youtube`, EDS boots the full player on load |
| [SKODA-703](tickets/SKODA-703.md) | Accessibility audit | E07 | 3 | 1–2 | 2–4 | 603 | 🟡 M1; audit + fixes 2026-10-15 (branch `skoda-703-a11y`): axe on the 134 M1 pages, keyboard / modal pass on 9 templates, contrast to AA (PO-accepted greys kept), skip link, slider pause, size-menu keys, linked-image alts; [audit](../reviews/SKODA-703-A11Y-AUDIT-2026-10-15.md) |
| [SKODA-703a](tickets/SKODA-703a.md) | Desktop mega-menu triggers as disclosure buttons (screen-reader semantics) | E07 | 2 | 0.5–1 | 1–2 | 703,301,302 | 🔵 M2; deferred from SKODA-703 (no header refactor on demo day) |
| SKODA-704 | Visual critique + consent/analytics stubs + sign-off | E07 | 3 | 1–2 | 2–3 | 702,703 | 🟡 |
| SKODA-805d | Preserve press-kit footnote typography (follow-up to 805c) | E08 | – | – | – | 805c | ✅ Done (#225 closed 2026-10-06) |
| SKODA-701 | Lint + unit tests | E07 | 2 | 1 | 1–2 | E02,E03,E04 | ✅ Done (#41 closed 2026-10-08). Was: 🟢 |
| [SKODA-702](tickets/SKODA-702.md) | Performance (Lighthouse≈100/RUM) | E07 | 3 | 1–2 | 2–3 | 603 | ✅ Done (#42 closed 2026-10-12). Was: 🟡 M1; branch `skoda-702-performance` 2026-10-07: every AC measured; 2 CLS fixes (press-kit grid rows while loading, per-platform/weight fallback fonts): CLS ≤ 0.007 on the A/B pages (was up to 0.212); RUM beacons verified, field data needs the RUM explorer key; follow-ups: category LCP (831/209), fast-start MP4 (503/506) |
| [SKODA-702a](tickets/SKODA-702a.md) | Epiq story performance: YouTube click-to-load facade (desktop TBT) | E07 | 2 | 0.5–1 | 1–2 | 702,204a,818 | ✅ Done (#239 closed 2026-10-06). Was: 🔵 M1; from the PR #232 PSI failure (desktop 74, TBT 570ms; `main` 64–69 locally); live uses `lite-youtube`, EDS boots the full player on load |
| SKODA-703 | Accessibility audit | E07 | 3 | 1–2 | 2–4 | 603 | 🟡 M1, in review: #43, PR #360 (audit report + fixes, 2026-10-15) |
| SKODA-704 | Visual critique + consent/analytics stubs + sign-off | E07 | 3 | 1–2 | 2–3 | 702,703 | 🟡 M1, human gate: #44 (jkondalu); criterion = coherent visual resemblance (2026-10-05), findings under #247 |
| [SKODA-705](tickets/SKODA-705.md) | Confirm "Load more" button variant vs source | E07 | – | – | – | 402,214 | ✅ Done (#46 closed 2026-10-11) |
| [SKODA-707](tickets/SKODA-707.md) | Demo assembly + dry-run + script (15 Oct) | E07 | 2 | – | – | 603,704 | ✅ Done (#53 closed 2026-10-14) |
| [SKODA-708](tickets/SKODA-708.md) | Review protocol: click, heading-outline, side-effect, deviation checks (from M1 manual-QA gap analysis) | E07 | 1 | <1 | 1–2 | 704 | 🟢 M2, #384 |
| [SKODA-709](tickets/SKODA-709.md) | Production launch: CDN, DNS (www, bare domain, 11 alias hosts), TLS, production host (#416) | E07 | 3 | 1–2 | 2–3 | D14,Q-20,Škoda IT | 🔵 M2; **Critical**: no owner today; TLS cert expires 2026-11-30 · split 2026-10-21: 2 sub-tickets, 6 SP in total |
| [SKODA-709a](tickets/SKODA-709a.md) | Alias hosts: which follow the switch, certificates, redirect rules per family, keep or retire | E07 | 2 | 1 | 2 | SKODA-709 | 🔵 M2; sub-ticket of SKODA-709 |
| [SKODA-709b](tickets/SKODA-709b.md) | Document host: deliver PDFs, MP4s and originals from a Škoda host, not the raw AEM publish host (Q-21) | E07 | 1 | 0.5 | 1 | SKODA-709 | 🔵 M2; sub-ticket of SKODA-709 |
| [SKODA-710](tickets/SKODA-710.md) | Cutover runbook and calendar: freeze, delta import, go/no-go, rollback, links.js switch (#417) | E07 | 3 | 1–2 | 2–3 | 709,803,1004,Q-20 | 🔵 M2; go-live is a Saturday after the holidays · split 2026-10-21: 2 sub-tickets, 7 SP in total |
| [SKODA-710a](tickets/SKODA-710a.md) | Link release at the switch: scripts/links.js on the own host, and the DA relink | E07 | 3 | 1–2 | 2–3 | SKODA-710 | 🔵 M2; sub-ticket of SKODA-710 |
| [SKODA-710b](tickets/SKODA-710b.md) | Publish side-effect register and one EN and one CS test release on the production host | E07 | 1 | 0.5–1 | 1–2 | SKODA-710 | 🔵 M2; sub-ticket of SKODA-710 |
| [SKODA-711](tickets/SKODA-711.md) | WordPress decommission and archive: personal data, licences, hosting, shared motorsport site (#418) | E07 | 3 | 1 | 2–3 | 710,D15 | 🔵 M2; skoda-motorsport.com shares the hosting |
| [SKODA-712](tickets/SKODA-712.md) | Operating model and year-one run calendar: hypercare, hand-over, renewals, monitoring (#419) | E07 | 4 | 1–2 | 2–3 | 709,D15,101a | 🔵 M2 |
| [SKODA-713](tickets/SKODA-713.md) | SEO migration: sitemap/robots per locale, JSON-LD, noindex fragments, SEO owner, monitoring (#420) | E07 | 2 | 2–3 | 4–6 | 709,103b,1001 | 🔵 M2; Google News indexes the site · split 2026-10-21: 4 sub-tickets, 13 SP in total |
| [SKODA-713a](tickets/SKODA-713a.md) | Per-locale sitemaps, production robots.txt, noindex for chrome, document index policy | E07 | 3 | 1–2 | 2–4 | SKODA-713 | 🔵 M2; sub-ticket of SKODA-713 |
| [SKODA-713b](tickets/SKODA-713b.md) | Structured data and article meta: JSON-LD helper, og and article tags, image preview | E07 | 3 | 1–2 | 2–4 | SKODA-713 | 🔵 M2; sub-ticket of SKODA-713 |
| [SKODA-713c](tickets/SKODA-713c.md) | Legacy URL inventory and pre-DNS redirect harness | E07 | 3 | 1–2 | 3–4 | SKODA-713 | 🔵 M2; sub-ticket of SKODA-713 |
| [SKODA-713d](tickets/SKODA-713d.md) | Analytics continuity across the cutover: baseline, path mapping, download KPI | E07 | 2 | 1 | 2–3 | SKODA-713 | 🔵 M2; sub-ticket of SKODA-713 |
| [SKODA-714](tickets/SKODA-714.md) | Security headers and CSP on the production CDN (#421) | E07 | 2.5 | 1 | 1–2 | 709,907 | 🔵 M2; headers drop at the switch today |

**Phases B–D (Pilot: No)**

| ID | Title | Epic | Phase | SP | AI-d | Man-d | Deps | Risk |
|---|---|---|---|--:|--:|--:|---|---|
| SKODA-208 | Model page template (skoda_model: hero + icon nav + 5 rails) | E02 | B | 5 | 2–3 | 4–6 | 202,402,201 | ✅ Done (#57 closed 2026-09-29). Was: **M1** (re-milestoned 2026-09-24: 5 model URLs in the M1 set; 3 blocks missing); spec `ui-specs/template-model-page.md` |
| SKODA-208a | Model introduction typography and spacing parity | E02 | B | – | – | – | 208 | ✅ Done (#249 closed 2026-10-08) |
| SKODA-209 | Category / Tag archive template (hero + card grid, no facets) | E02 | B | 3 | 1–2 | 2–4 | 202,201,402 | 🟢 M2; spec `ui-specs/template-category-archive.md` |
| [SKODA-209a](tickets/SKODA-209a.md) | Archive pager: the source's "6 / N" count row and Load more spacing (follow-up to 209) (#330) | E02 | 1 | 0.5 | 1 | 209,214,402c | ✅ Done (#330 closed 2026-10-13). Was: 🟡 M1; built on `skoda-209a-archive-pager`, PR #339 open; code only (count row keyed to the authored archive grid). Known M1 deviation: 13 non-model tag archives 32px short of the source's 48px bottom margin |
| SKODA-210 | Custom microsite (full-width event-gallery/campaign) scope + template | E02 | B | 3 | 1–2 | 2–4 | 203,813,814,601 | 🟡 M2; 201 pages, migrate/fold/drop decision; spec `ui-specs/custom-microsite.md` (recount §2/§8) |
| SKODA-706 | Branded 404 (keeps chrome, real HTTP 404) | E07 | B | 3 | 0.5 | 0.5–1 | 301,304 | 🟢 M2; spec `ui-specs/template-404.md` · amended 2026-10-21 (gap review) |
| SKODA-801 | Story template, SiteOrigin Page-Builder flatten | E08 | B | 8 | 3–5 | 6–10 | 601,603 | ✅ Done (#48 closed 2026-09-24). **M2 review 2026-10-15:** Full-corpus run + the rare-layout stories → proposed follow-up **SKODA-801b** (M2). Was: 🟢 built (2026-09-24): `story-flatten.js` 17-widget map + two-column body+aside (grid-on-main); carousel routed by content (Gallery/Cards); linear + large-tree paths verified. M2: full-corpus run. Blocks it emits: 203 (Gallery), 201 (Cards) · amended 2026-10-21 (gap review) |
| [SKODA-801b](tickets/SKODA-801b.md) | Story corpus run: every EN story through the flatten, REST-enumerated (#368) | E08 | B | 3–5 | 1.5–2.5 | 3–5 | 801,814,803 | 🔵 M2 (#368, created 2026-10-15); 1,303 EN stories, 69 live; the sitemaps miss 193 |
| SKODA-802 | Remaining templates (Škodapedia pre-baked, pages) | E08 | B | 5 | 2–3 | 4–7 | 801 | 🟡 (press-kits split to 805–808) |
| SKODA-803 | Bulk import automation (at scale) | E08 | B | 8 | 3–5 | 6–10 | 602,801 | 🟠 scale |
| SKODA-804 | Consent + analytics wiring (OneTrust, GTM, skoda-analytics) | E08 | B | 5 | 2–3 | 4–6 | 603 | 🟠 consent OUT of Adobe scope (D10) |
| SKODA-805 | Press Kit template + structured narrative sections | E08 | B | 5 | 2–3 | 4–6 | 801,202,402 | 🟡 fixed-vs-conditional sections (§11.8) |
| SKODA-806 | Press Kit grouped media/download areas + whole-kit ZIP | E08 | B | 5 | 2–3 | 4–6 | 805,502,505 | ✅ Done (#67 closed 2026-10-12). **M2 review 2026-10-15:** Whole-kit ZIP as a DAM-hosted package → proposed follow-up **SKODA-806a** (M2). Was: 🟡 in review 2026-10-08: `Downloads (gallery)` + Peaq Images fragment split; ZIP = a pre-built CDN package → DAM-hosting follow-up |
| [SKODA-806a](tickets/SKODA-806a.md) | Press kit: whole-kit ZIP as a DAM-hosted package (#369) | E08 | B | 2 | 0.5–1 | 1–2 | 806,503 | 🔵 M2 (#369, created 2026-10-15) |
| SKODA-807 | FAQ block (Press Kit) | E08 | B | 2 | 0.5–1 | 1–2 | 805,106 | ✅ Done (#68 closed 2026-10-08). Was: 🟡 in review 2026-10-06: `Accordion (faq)` + FAQPage JSON-LD, source-parity inset/icon; per-kit authored |
| SKODA-808 | Press Kit variant subsections + selector + categorization | E08 | B | 3 | 1–2 | 2–3 | 805,806,401 | ✅ Done (#69 closed 2026-10-12). **M2 review 2026-10-15:** Variant selector, pending MR-PK03 → proposed follow-up **SKODA-808a** (M2, decision-gated). Was: 🟡 in review 2026-10-09: hub facets (all 15, `years` id → year); variant tile/nav/chapter already at parity; selector pending MR-PK03 |
| [SKODA-808a](tickets/SKODA-808a.md) | Press kit: model-variant selector (#370) | E08 | B | 1–2 | 0.5 | 1–2 | 808,401 | 🔵 M2 (#370, created 2026-10-15); blocked on MR-PK03 |
| SKODA-810 | Company/Page family (board/annual-reports/logo/app/contacts) | E08 | B | 8 | 3–5 | 6–10 | 202,304,502,601,602,803,813 | 🟢 M2 (D18); 5 net-new blocks on the 813 shell |
| SKODA-813 | Generic Page base shell (STO page + MR media-room-page) | E08 | B | 2 | 0.5–1 | 1–2 | 202,304,305,309,814 | 🟢 M2; shared shell under 810; spec `ui-specs/template-page-base.md` |
| SKODA-814 | SiteOrigin body flatten contract (1,614 pages) | E08 | B | 5 | 2–3 | 4–6 | 601,203,204 | 🟢 M2; feeds 801/208/813; spec `ui-specs/siteorigin-body.md` (recount §3/§6) |
| SKODA-815 | Story flatten: `ys-milestones` timeline (content-loss fix) | E08 | B | 3 | 1–2 | 3–5 | 801 | 🟢 flatten-to-content SHIPPED in 801 (0→11 entries recovered); optional timeline block remains M2 |
| SKODA-816 | Story hero: title above 16:9 image + caption (perex, date, linked category) | E08 | A/B | 2 | 0.5–1 | 1–2 | 202,205,801,826 | ✅ Done 2026-09-25: #113 + #155 code; all 18 DA stories re-imported with the Hero Image and published; live QA 1440–500 (width delta → 826) |
| SKODA-817 | Story aside: duplicated "Explore more" teasers + sidebar visual parity | E08 | A/B | 2 | 0.5–1 | 1–2 | 201,205,801 | ✅ #120 closed; dedupe + Tags heading in #113, sidebar parity CSS in #160 |
| SKODA-818 | Story flatten: `lite-youtube` → bare YouTube URL (embed autoblock) | E08 | A/B | 1 | 0.25–0.5 | 0.5–1 | 204 (PR #109),801 | ✅ #121 closed; importer #113 + block #109, Epiq player verified |
| SKODA-819 | Story in-body carousel → Gallery `slider` variant | E08 | A/B | 3 | 1 | 2–3 | 203,212,801 | ✅ Done (#122 closed 2026-09-28). Was: 🟡 stakeholder decision: slider like source; **supersedes SKODA-219**; spec `ui-specs/story-image-carousel.md` |
| SKODA-820 | Story bottom "Related Stories" band restored (tag-based rail) | E08 | A/B | 2 | 0.5–1 | 1–2 | 212,218,801,603 | ✅ Done (#123 closed 2026-09-28). Was: 🟡 #133 Epiq index rail live (10 cards); scoped CSS parity in PR #157. Curated bands remain (sweep amendment); desktop pointer → 212a; Media Box → 801a |
| [SKODA-821](tickets/SKODA-821.md) | Story body text inset vs intentionally bleeding image slider | E08 | A/B | 1 | 0.25 | 0.5 | 801 | ✅ Done (#124 closed 2026-09-29). Was: 🟢 story CSS only; 10px media bleed retained. Re-check 2026-09-29: horizontal ACs met on `main` |
| [SKODA-829](tickets/SKODA-829.md) | Story intro → body / aside vertical spacing parity | E08 | A | 1 | 0.25 | 0.5 | 801,821,828 | ✅ Done (#214 closed 2026-09-29). Was: 🟡 #214; PR #207 review follow-up (2026-09-29); body +32 / aside +0 at ≥768, body +0 below; text 10px in |
| [SKODA-830](tickets/SKODA-830.md) | Story importer validity fixes + Media Box → Downloads (801a) + newsletter card (823) + Media Box parity | E08 | A | – | – | – | 801a,604,819,823 | ✅ Done (#259 closed 2026-10-07). Was: M1; #259, PR #269; audit F3+F4; QA PASS run 3; 57 stories published 2026-10-06 |
| [SKODA-832](tickets/SKODA-832.md) | Re-import the Octavia-rail press-kit hubs with press-kit-hub (was page-base) | E08 | A | – | – | – | 208,805 | ✅ Done (#261 closed 2026-10-07). Was: M1; #261; 9 hubs pushed + previewed 2026-10-07 (QA content PASS); banners → 835, RS 245 → 836 |
| [SKODA-835](tickets/SKODA-835.md) | Press-kit hub: size a lone download banner like its origin tile (1228×1228 vs 292×292) | E08 | A | – | – | – | 832,805 | ✅ Done (#279 closed 2026-10-08). Was: M1; #279, from SKODA-832 QA D2 (2026-10-07) |
| [SKODA-836](tickets/SKODA-836.md) | Press-kit article importer for the `template-press-release` variant (Octavia RS 245) | E08 | A | – | – | – | 805,503,832 | 🔵 M2; #280, from SKODA-832 QA D1 (2026-10-07); survey 2026-10-10: 22 `template-press-release` kits (RS 245 live, flattened), 12 `layout-article` not analysed |
| [SKODA-837](tickets/SKODA-837.md) | Press-kit import validity fixes (audit F6): Images-child stray lead, `.pdff` links, regulatory gallery notes | E08 | A | – | – | – | 805,830 | ✅ Done (#297 closed 2026-10-08). Was: M1; #297; 6 pages pushed (5 previewed, Peaq Images DA-only) 2026-10-08 |
| [SKODA-842](tickets/SKODA-842.md) | DA block library + page templates for authors (authoring review AR-02/03) | E08 | A | – | – | – | 211,841,840 | 🟡 M2; #320; PR #322 (library + templates live, noindex; editor checks open) |
| [SKODA-843](tickets/SKODA-843.md) | Generic pages: legal set, BGC, sustainability page, keep / drop list (#363) | E08 | A | – | – | – | 813,609 | 🔵 M2 (#363, created 2026-10-15); 41 default + 1 sustainability page, none live |
| [SKODA-844](tickets/SKODA-844.md) | Featured-image mini-pages: Road to Christmas + classic-car pages (29) (#364) | E08 | A | – | – | – | 813,220 | 🔵 M2 (#364, created 2026-10-15); keep / drop first (Q-3) |
| [SKODA-845](tickets/SKODA-845.md) | Media Room Newsletter page: press-release carousels by plant (#365) | E08 | A | 2 | – | – | 813,224 | 🔵 M2 (#365, created 2026-10-15); MR nav Company menu · amended 2026-10-21 (gap review) |
| [SKODA-847](tickets/SKODA-847.md) | Press-kit corpus: enumerate every EN kit and run the three importers (#366) | E08 | A | – | – | – | 805,836,803 | 🔵 M2 (#366, created 2026-10-15); ≥ 790 EN pages, 104 live; 12 `layout-article` hubs have no importer |
| [SKODA-848](tickets/SKODA-848.md) | Taxonomy archives at scale: keep / redirect rule for 378 EN archives (#367) | E02 | A | – | – | – | 209,402d,841 | 🔵 M2 (#367, created 2026-10-15); 41 live (Q-4) |
| [SKODA-849](tickets/SKODA-849.md) | In-body widget census: Škodapedia glossary, ys-embed-share HTML, social embeds, skoda_iframe, quizzes (#426) | E06 | B | 2 | 2–3 | 4–6 | 801b,803,802,Q-19 | 🔵 M2; importer drops them silently today · split 2026-10-21: 3 sub-tickets, 12 SP in total |
| [SKODA-849a](tickets/SKODA-849a.md) | Škodapedia glossary spans: links to the term page per locale, and an optional accessible teaser | E06 | B | 3 | 1–2 | 3–4 | SKODA-849 | 🔵 M2; sub-ticket of SKODA-849 |
| [SKODA-849b](tickets/SKODA-849b.md) | Interactive HTML packages (ys-embed-share): inventory, a separate origin, resize contract, audit | E06 | B | 3 | 1–2 | 3–4 | SKODA-849 | 🔵 M2; sub-ticket of SKODA-849 |
| [SKODA-849c](tickets/SKODA-849c.md) | Third-party embeds and unmapped widgets: a verdict per host, new widget kinds, image maps, charge map | E06 | B | 4 | 2 | 4–5 | SKODA-849 | 🔵 M2; sub-ticket of SKODA-849 |
| [SKODA-850](tickets/SKODA-850.md) | Day-2 authoring: scheduling, downloadable originals, embargo asset gate, path-limited publish, takedown (#427) | E08 | B | 1 | 2–3 | 4–6 | 809,811,842,101a | 🔵 M2; half of HQ releases go live on a quarter hour · split 2026-10-21: 5 sub-tickets, 17 SP in total |
| [SKODA-850a](tickets/SKODA-850a.md) | Timed releases: Schedule Publish, Snapshots, Request Publish, listing freshness, AI-audio step | E08 | B | 3.5 | 1.5–2 | 3–4 | SKODA-850 | 🔵 M2; sub-ticket of SKODA-850 |
| [SKODA-850b](tickets/SKODA-850b.md) | Downloadable originals after go-live: AEM Assets editor group, folders, picker renditions, kit ZIPs | E08 | B | 3 | 1–2 | 2–3 | SKODA-850 | 🔵 M2; sub-ticket of SKODA-850 |
| [SKODA-850c](tickets/SKODA-850c.md) | Embargo asset gate: a marker, a feed-sync skip and a launch preview without published URLs | E08 | B | 3 | 1–2 | 2–3 | SKODA-850 | 🔵 M2; sub-ticket of SKODA-850 |
| [SKODA-850d](tickets/SKODA-850d.md) | Publish rights per path, shared root documents, takedown and rename runbooks | E08 | B | 3.5 | 1.5–2 | 3–4 | SKODA-850 | 🔵 M2; sub-ticket of SKODA-850 |
| [SKODA-850e](tickets/SKODA-850e.md) | New press kits and locale-aware DA templates after go-live | E08 | B | 3 | 1–2 | 2–3 | SKODA-850 | 🔵 M2; sub-ticket of SKODA-850 |
| [SKODA-851](tickets/SKODA-851.md) | Source-generated data after the freeze: facets, category parents, allow-list to DA sheets or the index (#428) | E04 | B | 4 | 1–2 | 2–3 | 402d,605,609 | 🔵 M2; no 2027 year in listing filters |
| [SKODA-841](tickets/SKODA-841.md) | Tags entered once: facet pick lists (EW options), derived visible tags, archive matching on facets (AR-04/15) | E08 | A | – | – | – | 205,211,401,842 | 🔵 M2; #319 |
| [SKODA-840](tickets/SKODA-840.md) | Story newsletter card as one shared fragment, auto-inserted in the story sidebar (AR-05) | E08 | A | – | – | – | 823,904 | 🔵 M2; #318 |
| [SKODA-839](tickets/SKODA-839.md) | Home Models rail: model tag pages carry the source home card image (featured header banner) as page image | E08 | A | – | – | – | – | ✅ Done (#310 closed 2026-10-11). Was: M1; #310, PR #311; 11 tag pages published 2026-10-10; card frame aspect open on #306 |
| [SKODA-838](tickets/SKODA-838.md) | Origin-drift re-imports (audit F7): Enyaq RS Race, Epiq City SUV, Media Room; 3 × 125-years chapters wait for new PDFs | E08 | A | – | – | – | 837,503 | ✅ Done (#300 closed 2026-10-11). Was: M1; #300; 3 pushed + previewed 2026-10-08; DAM ingest pending for 3 PDFs |
| [SKODA-833](tickets/SKODA-833.md) | Press-release importer validity fixes + DAM originals for 28 releases | E08 | A | – | – | – | 607,502,503 | ✅ Done (#262 closed 2026-10-06). Was: M1; #262, PR #265 merged; 28 releases published 2026-10-06 |
| SKODA-822 | Ship SKODA-801 two-column story layout to `main` | E08 | A | 1 | — | — | 801 | ✅ merged as PR #113 (2026-09-24 21:35) |
| SKODA-823 | Story sidebar newsletter sign-up widget (UI stub) | E08 | A | 2 | 0.5–1 | 1–2 | 904,801 | ✅ Done (#126 closed 2026-09-29). Was: extend footer `newsletter-stub` for the sidebar; no ESP, no false success; side banner → 903; **M1 Could** (review §15) |
| [SKODA-824](tickets/SKODA-824.md) | In-column highlight panel (story dark box + PR grey callout) | E08 | A | 3 | 1 | 2–3 | 801,814,218,819,225 | ✅ Done (#148 closed 2026-10-07). Was: M1; Demo sweep 2026-09-25; 12 stories + 1 PR; importer done 2026-09-28 (contract shape 2); runtime in review 2026-10-05 |
| SKODA-809 | Roles & permissions (7 editorial groups) | E08 | B | 5 | 2–3 | 4–8 | 101,602 | 🟠 gap G2 (§6.4); blocked on D15 RACI · amended 2026-10-21 (gap review) |
| SKODA-811 | Content embargo (staged-publish, group access) | E08 | B | 3 | 1–2 | 2–4 | 602,809 | 🔵 M2 (#72; GitHub milestone M2): gap G3 (§6.5/D9) approach agreed; ungated version can start, the group gate needs 809/D15 |
| SKODA-812 | Auditability (author change-history) | E08 | B | 2 | 0.5–1 | 1–3 | 101,602,809 | 🟡 gap G5 (§6.7); validate DA/EW capability |
| SKODA-901 | Hosted body-relevance search (decision-gated) | E09 | C | 8 | 3–5 | 6–10 | 401 | 🟠 |
| SKODA-902 | Media-cart **prod hardening** (serverless zip + signed access + cross-device) | E09 | C | 8 | 3–5 | 6–12 | 505,502 | 🟠 re-scoped (demo cart = SKODA-505) |
| SKODA-903 | Banner ad platform (per-market feed + client) | E09 | C | 8 | 3–5 | 6–12 | 106 | 🔴 bespoke ad server |
| SKODA-904 | Newsletter/subscriber (ESP + consent + opt-in) | E09 | C | 8 | 3–5 | 6–10 | 304 | 🔴 10-route account |
| SKODA-905 | skoda-analytics rebuild (dataLayer + per-block wiring) | E09 | C | 8 | 3–5 | 6–10 | 804,E02,E04 | 🔴 hidden cross-cutting |
| SKODA-906 | Restricted end-user access (QR-code journey) | E09 | C | 5 | 2–3 | 4–8 | 101 | 🔴 gap G4 (§6.6); blocked on D17; SP provisional |
| [SKODA-907](tickets/SKODA-907.md) | Škoda consent and group tracking: sDrive/CCM, legal-entity-id, OneTrust per locale, embed consent (#423) | E09 | C | 4.5 | 1–2 | 2–4 | 804,905,D10,Q-16 | 🔵 M2; pings before consent on every page |
| [SKODA-908](tickets/SKODA-908.md) | External consumers at cutover: mobile app, newsletter manage pages, RSS delivery, podcasts (#424) | E09 | C | 1 | 2 | 3–5 | 904,405,iComVision,mailguide | 🔵 M2; 356 feed subscribers; app source undocumented · split 2026-10-21: 3 sub-tickets, 12 SP in total |
| [SKODA-908a](tickets/SKODA-908a.md) | Mobile app at cutover: content contract and new-article notification with de-duplication | E09 | C | 4 | 2 | 3–4 | SKODA-908 | 🔵 M2; sub-ticket of SKODA-908 |
| [SKODA-908b](tickets/SKODA-908b.md) | RSS delivery at cutover: mechanism, content type, refresh on publish, slash rule, feed decisions | E09 | C | 3 | 1–2 | 2–3 | SKODA-908 | 🔵 M2; sub-ticket of SKODA-908 |
| [SKODA-908c](tickets/SKODA-908c.md) | Newsletter at cutover: manage and landing pages, consent renewal, mailguide send triggers | E09 | C | 4 | 2 | 3–4 | SKODA-908 | 🔵 M2; sub-ticket of SKODA-908 |
| SKODA-1001 | Per-locale trees + per-locale query-index | E10 | D | 5 | 2–3 | 4–6 | 401,603 | 🟡 |
| SKODA-1002 | EW Translation rollout (DE/CS/SK/SR/SL) | E10 | D | 8 | 3–5 | content-ops | 1001 | 🟠 volume |
| SKODA-1003 | Language-negotiated routing + placeholders | E10 | D | 3 | 1–2 | 2–3 | 303,1001 | 🟡 |
| [SKODA-1004](tickets/SKODA-1004.md) | Non-EN corpus import: shared tooling + per-locale runs (#394) | E10 | D | 3 | 1–2 | 3–4 | 803,1001,1006,103a,843 | 🔵 M2; **Q-7**; ≈ 12,000 non-EN docs have no other import path |
| [SKODA-1004a](tickets/SKODA-1004a.md) | CS corpus import (≈ 5,100 docs) (#395) | E10 | D | 5 | 2–3 | 5–8 | 1004,1006,843,904 | 🔵 M2 **go-live gate** (D1 partner) |
| [SKODA-1004b](tickets/SKODA-1004b.md) | DE corpus import (Škoda Auto Deutschland) (#396) | E10 | D | 3 | 1–2 | 3–5 | 1004,Q-7,Q-8,Q-9 | 🔵 M2; timing per Q-7; DE releases per Q-8 |
| [SKODA-1004c](tickets/SKODA-1004c.md) | SK corpus import (own Media Room) (#397) | E10 | D | 3 | 1–2 | 3–5 | 1004,Q-7,Q-11 | 🔵 M2; timing per Q-7 |
| [SKODA-1004d](tickets/SKODA-1004d.md) | SR corpus import (Serbian Latin) (#398) | E10 | D | 3 | 1–2 | 3–4 | 1004,Q-7,Q-14 | 🔵 M2; timing per Q-7 |
| [SKODA-1004e](tickets/SKODA-1004e.md) | SL corpus import (Media Room shell) (#399) | E10 | D | 1 | 0.5 | 1–2 | 1004,Q-7 | 🔵 M2; timing per Q-7 |
| [SKODA-1005](tickets/SKODA-1005.md) | Translation pairs after go-live: group id, author "link a translation", reciprocity check (#400) | E10 | D | 3 | 1–2 | 3–4 | Q-10,1001,303a,1004 | 🔵 M2; approach per **Q-10** |
| [SKODA-1006](tickets/SKODA-1006.md) | Per-locale chrome: nav, footer, Media Room nav/footer (#401) | E10 | D | 2 | 1 | 2–3 | 1001,1003,302,304 | 🔵 M2; CS for go-live |
| [SKODA-103a](tickets/SKODA-103a.md) | Inbound trailing-slash rule (301 `/{path}/` → `/{path}`, all locales) (#402) | E01 | D | 2.5 | 1 | 1–2 | D14,103,1003 | 🔵 M2; **before DNS**; ≈ 15,000 slashed legacy URLs · amended 2026-10-21 (gap review) |
| [SKODA-103b](tickets/SKODA-103b.md) | Legacy URL resolution beyond the sheet: attachments, query routes, old slugs, inbound CDN/download links (#422) | E01 | D | 2 | 2–3 | 4–6 | 103a,709,Q-17 | 🔵 M2; 42,275 indexed attachment pages · split 2026-10-21: 3 sub-tickets, 12 SP in total |
| [SKODA-103c](tickets/SKODA-103c.md) | Attachment pages and WordPress archive routes: pattern rules and rows | E01 | D | 3 | 1–2 | 3–4 | SKODA-103b | 🔵 M2; sub-ticket of SKODA-103b |
| [SKODA-103d](tickets/SKODA-103d.md) | Query routes, old slugs and the slim slug map for near-miss URLs | E01 | D | 4 | 2 | 3–5 | SKODA-103b | 🔵 M2; sub-ticket of SKODA-103b |
| [SKODA-103e](tickets/SKODA-103e.md) | Inbound file links: /direct-download/, a permanent redirect-only CDN host, wp-json | E01 | D | 3 | 1–2 | 3–4 | SKODA-103b | 🔵 M2; sub-ticket of SKODA-103b |

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
