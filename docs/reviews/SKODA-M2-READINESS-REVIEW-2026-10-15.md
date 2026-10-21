# M2 readiness review (2026-10-15)

M1 (the 15 Oct demo) is done. This review covers three questions:

- what is still ahead before go-live on **02 Jan 2027**;
- which M2 tickets the team can start before the requirements are final;
- which pages nobody has checked yet.

**Sources:**

- GitHub, through the API on 15 Oct: all 359 issues and PRs.
- The ticket files.
- A read-only census of the source site: every sitemap, the REST lists for all 6 locales, and the body class of
  1,647 EN pages.

The census is in [`SKODA-PAGE-COVERAGE-MATRIX.md`](../planning/SKODA-PAGE-COVERAGE-MATRIX.md), and the open decisions
are in [`SKODA-DECISION-REGISTER.md`](../planning/SKODA-DECISION-REGISTER.md). Working files are in `.migration/m2-review/`.

I couldn't read the Project #1 board (Status field), because the credential can't read `projectsV2`. Readiness here
comes from the issues, PRs and ticket files.

## 1. Where we stand

| Milestone | Open | Closed | Due |
|---|--:|--:|---|
| M1: 15 Oct demo | **10** (9 after #334 moved) | 118 | 2026-10-15 |
| M2: go-live 02 Jan | **37** (48 after this review: +9 created, +#334, +#342) | 2 (806, 808) | 2027-01-02 |
| No milestone | #342 (SKODA-608a) + 9 epic issues | – | – |

- **Open PRs:** #360 (SKODA-703 a11y), #358 (#274 re-test), #356 (#273 re-test), #235 (draft, don't merge).
- **Owners:** 2 of the 37 M2 issues have one: #280 SKODA-836 (larsauffarth) and #114 SKODA-815 (Vjyramesh).
- **Content: 313 of about 4,620 EN pages are live (≈ 7%).**
  - Stories: 69 of 1,303.
  - Press releases: 52 of 1,580.
  - Press kits: 104 of ≥ 790.
  - Taxonomy archives: 41 of 378.
  - Škodapedia: 0 of 190.
  - Pages: 0 of the company, legal, microsite, featured-image and newsletter pages.
- **The source sitemaps are incomplete.**
  - The post sitemaps stop at 4 × 1,000 URLs (August 2025) and miss 193 EN stories.
  - Press releases miss 72.
  - Press kits miss at least 95 pages, including every kit we published for the demo.
  - Bulk import must enumerate from REST and from the listings (coverage matrix §1).

## 2. M1 close-out (10 open issues)

| Issue | State on 15 Oct | Proposed action |
|---|---|---|
| #361 Rail arrow icons missing on 4 templates | opened today, no PR | **Demo risk.** Fix today, or note it as a known issue in the demo script |
| #295 SKODA-514 Media Box mask | PR #335 merged; QA posted 6 new observations the same day (title crop at 768, h3 headings, Media Box dates) | Triage the 6 against the 514 scope. Close 514; route the new points to #274's PR #358 (same h3 / date items) or to a new ticket |
| #333 SKODA-402d every source facet | PR #355 merged, "moving to QA" | Close after QA |
| #273 Media listings QA | PR #356 open; the 1920px cart add was kept as M2 by the developer | Merge after QA, then close. The 1920px point goes to M2 (with 515 / 902) |
| #274 Press releases QA | PR #358 open (re-test fixes) | Merge after QA, then close |
| #275 Press kits QA | PR #344 merged 10-15, re-test pending | Re-test, then close |
| #334 SKODA-516 model-page media rails empty | data gap, needs a DAM ingest | **Moved to M2** (2026-10-15), with 511 / 608a |
| #43 SKODA-703 a11y | PR #360 open (audit + fixes) | Review and merge; move the remainder to M2 (e.g. the Škodapedia modal with 206) |
| #44 SKODA-704 sign-off, #247 E2E QA | human gates (jkondalu) | Sign off after the demo, then close |
| #342 SKODA-608a media feed refresh | had no milestone | **Set to M2** (2026-10-15), with 511 |

## 3. M2 tickets the team can work on now

All 37 open M2 issues are classified below, along with the follow-ups this review created (📝, all M2 on 2026-10-15): 843 #363, 844 #364, 845 #365, 847 #366, 848 #367, 801b #368, 806a #369, 808a #370, 504a #371.

### A. Ready now: no client decision, dependencies done

| Ticket (issue) | Scope | SP | Notes |
|---|---|--:|---|
| SKODA-509 (#182) | `skoda-images` hook signature | 0.5 | Labelled for an agent. **Run it first and on its own**: it touches 7 importers |
| SKODA-814 (#75) | SiteOrigin body flatten contract (1,614 pages) | 5 | Foundation for 801b / 813 / 843 |
| SKODA-813 (#74) | Page base shell (STO + MR) | 2 | Unblocks 810a, 843, 844, 845 |
| SKODA-706 (#76) | Branded 404 | 1 | The source's 404 content page is `/en/youve-reached-a-dead-end/` |
| SKODA-405 (#52) | RSS feed | 2 | Labelled `agent-fit`. **Keep `/en/feed/` and `/en/press-releases/feed/`**: the footer links them on every page |
| SKODA-209 (#58) | Archive template remainder | 3 | The volume moves to 848 |
| SKODA-836 (#280) | Press-kit `template-press-release` importer (22 hubs, 51 pages) | – | In progress (larsauffarth) |
| SKODA-226 (#292) / 227 (#293) | Story parity: charging-profile sizing, Related Stories spacing | small | Files mirrored today |
| SKODA-810a (#71) | Contacts + board of management | ~3 | **Re-scope 810 first** (§4) |
| 📝 SKODA-801b | Story corpus run, REST-enumerated (1,303) | 3–5 | After 814; volume per D7 |
| 📝 SKODA-847 | Press-kit corpus: enumerate + run the 3 importers | 3–5 | After 836 |
| 📝 SKODA-845 | Media Room Newsletter page (carousels by plant) | 1–2 | After 813 |

### B. Close-ready or nearly done

| Ticket (issue) | State |
|---|---|
| SKODA-840 (#318) | Delivered 2026-10-11 (PRs #325 / #326 merged; fragment + 67 stories published). **Ready for QA → close** |
| SKODA-842 (#320) | PR #322 merged. Open: the library documents need a DA upload by a person, then the editor checks, then the bulk-metadata publish (which waits on 9 previewed language rows) |

### C. Can start on a stated default (the assumption is recorded, the client confirms)

| Ticket (issue) | Default | SP |
|---|---|--:|
| SKODA-810b (#71) | App promo + company logo (18 assets, now on the microsite shell) | ~3 |
| 📝 SKODA-843 | Legal set + BGC + sustainability page; drop the empty pages (Q-1) | 2–3 |
| 📝 SKODA-844 | Featured-image mini-pages kept on the page base (Q-3) | 1–2 |
| 📝 SKODA-848 | Taxonomy keep / redirect rule (Q-4) | 2 |
| SKODA-802 (#63) | Škodapedia pre-baked terms + the remaining pages | 5 |
| SKODA-803 (#64) | Bulk automation; REST enumeration; a person publishes | 8 |
| SKODA-805 (#66) | Full press-kit template, sections optional | 5 |
| SKODA-841 (#319) | Tags entered once (facet pick lists) | ~3 d |
| SKODA-811 (#72) | Embargo, ungated version | 3 |
| SKODA-1001 (#83) | EN + CS trees and index first; CS adds 1,056 non-EN items | 5 |
| SKODA-206 (#20) | Škodapedia block as a pattern proof | 5 |
| SKODA-515 (#294) | Fly-to-cart feedback: **starts after 514 closes** | small |

### D. Blocked: a decision or the environment is needed

| Ticket (issue) | Waiting on |
|---|---|
| 210 microsite (#59) | Q-5 / D7: ~111 event galleries, ~36 legacy press-kit pages, ~54 campaign pages |
| 511 (#178), 512 (#179), 513 (#289), #219, 📝 504a, 📝 806a | D5 (instance, renditions, rights), AEM tag admin, DAM machine, the WebP activation 404 |
| 804 (#65), 905 (#81) | D10, GTM spec and credentials |
| 📝 808a | MR-PK03 |
| 809 (#70), 812 (#73) | D15, D16 |
| 815 (#114) | whether the client wants the timeline visual (otherwise close it; the content is already recovered) |
| 901 (#77), 902 (#78), 903 (#79), 904 (#80), 906 (#82) | D6, D2, D3, D4 + ESP access, D17 / D14 |
| 1002 (#84), 1003 (#85) | D1, translation connector, routing rule |

## 4. Pages that hadn't been checked

Full table: [coverage matrix](../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §2–3.

### Company and Media Room "Company" pages (SKODA-810)

The MR nav **Company** menu has 6 entries. Against the 15 Sep spec:

- **Annual reports is gone.** `/en/annual-reports/` returns 404 and is not in the sitemap. The `download-list` sub-type
  has no page (Q-2).
- **Company logo moved** to `template-custom-full-width` and has 18 assets, not 36. The spec needs re-measuring.
- **Brand Group CORE (BGC)** is in the menu but in no ticket. It is a simple default page, which goes to 843.
- **Newsletter** is in the menu but in no ticket. It is `template-carousel-listing`, with 30 press-release teasers in
  2 carousels, which goes to 845.
- Board, contacts and mobile app are as specified.
- **None of them is imported to DA or live.** The importer exists (`import-company-page`) but has only flattened
  to default content.

### Other families with no ticket or no analysis

- **Generic pages (41):** a legal set linked from the footer (copyright, consent), cookies, 2 sets of terms, 7 IIHF
  campaign legal pages, and empty or obsolete pages (`impressum` has 1 word). Goes to 843.
- **Featured-image (29):** 22 Road to Christmas days and 7 classic-car pages. Goes to 844.
- **Sustainability template (1):** `/en/sustainable-offices/`, 2,193 words, 28 images. Goes to 843.
- **Press kits on `template-layout-article` (12 hubs):** single long pages, e.g. `new-skoda-superb-press-kit` with
  69 images and 314 teasers. They have no importer. Goes to 847.
- **Taxonomy archives (378):** 41 live, and no keep rule. Goes to 848.
- **Custom full-width (201):** mostly event galleries; the decision is 210 / Q-5.
- **Other languages:** 2,478 stories and press releases have no EN version, 1,056 of them in CS. That is input for D1
  and SKODA-1001. The follow-up pass over all five non-EN locales,
  [`SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20`](SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md), puts the non-EN
  corpus at ≈ 12,000 docs (CS ≈ 5,100) with no import ticket.
- **Integrations and untouched areas:** the gap review
  [`SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21`](SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) covers third-party
  touchpoints, Škodapedia, podcasts, video, attachment pages, the launch and operations. 152 findings (two top-up rounds); the production
  launch (CDN, DNS, TLS) has no owner.

### Confirmed

- Podcast is a category archive (`/en/category/podcast-en/`); `/en/podcast/` 301s to a story.
- `/en/speeches/` is a 404 (it is not a page type).

## 5. Execution waves (collision-checked, per `AGENTS-TEAM.md`)

Two tickets share a wave only if they touch different files, blocks, templates and importers. Where it's uncertain,
they're serialized.

| Wave | Importer lane | Template lane | Block lane | Press-kit lane | Media / data lane (developer machine) |
|---|---|---|---|---|---|
| **W1 (now)** | 509, alone | 813 | 706 · 405 · 226 | 836 (in progress; must not touch `skoda-images.js` until 509 merges) | 608a + 516 (feed rebuild + facets) |
| **W2** | 814 | 810a · 845 | 227 · 209 remainder | 847 (enumerate first) | 504a (once D5 is answered) |
| **W3** | 801b (batched) | 810b · 843 · 844 | 515 (after 514 closes) | 805 remainder · 806a | 511 → 512 → 513 |
| **W4** | 803 (automation) + corpus pushes; a person publishes | 802 / 206 | 841 | – | – |

- Decision-gated tickets (§3 D) join a wave once their decision lands.
- After every wave, the Architect recalculates collisions.
- QA (visual parity against origin, measured) closes each ticket.

### Proposed lane owners (to confirm)

Based on who did similar work in M1:

| Lane | Owner |
|---|---|
| Importer + press kits | larsauffarth |
| Templates | Vjyramesh |
| Blocks | vijayr-adobe |
| Media / data + listings | saran-adobe |
| QA | jkondalu |

## 6. Before the requirements can be finalised

The [decision register](../planning/SKODA-DECISION-REGISTER.md) lists every decision (D1–D19, MR-PK03, the FAQ pool,
and Q-1–Q-6 from this review), with what each blocks and a proposed default.

The ones that change the go-live volume most:

| Decision | Why it matters |
|---|---|
| **D7** content cutoff | Sets the volume of 801b, 847 and 803 |
| **D1 / Q-6** CS-only content | 1,056 extra items |
| **Q-5** event galleries | ~150 pages |
| **Q-4** taxonomy archives | 378 pages |
| **D5** media rights and renditions | Sets the media volume |

## 7. Changes made in this PR (docs only)

- **OVERVIEW synced with GitHub:**
  - 45 rows marked done where the issue is closed;
  - 13 rows added (226, 227, 229, 230, 208a, 402b, 402d, 513, 515, 516, 705, 707, 805d);
  - M2 remainders noted on 801, 806, 808, 504 and 507;
  - 811 re-milestoned to M2, 608a flagged as unmilestoned.
- **Ticket files mirrored from GitHub:** 226, 227, 303a, 402d, 513, 514, 515, 516.
- **Follow-up tickets:** 801b, 806a, 808a, 504a, 843, 844, 845, 847, 848; created on GitHub as #363–#371 (M2) after the go-ahead.
- **Census amendments:** 209, 210, 405, 803, 810, 1001.
- **New documents:** the coverage matrix and the decision register.

**Done on GitHub after the go-ahead (2026-10-15):** created #363–#371; #342 → M2; #334 → M2; the 810 re-scope posted on #71.

**Still open, needs a go-ahead:**

- closing #318;
- assigning lane owners;
- splitting #71 into two issues.
