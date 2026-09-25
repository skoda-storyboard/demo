# SKODA M1 Gap Review: 43-URL revalidation, cut line and wave plan

**Date:** 2026-09-24 · **Author:** Architect pass (Lars Auffarth + agent team, per [`AGENTS-TEAM.md`](../../AGENTS-TEAM.md))
**Milestone:** M1 demo **Thu 15 Oct 2026** · **Build freeze:** Thu 8 Oct EOD · **Dry run + fixes:** Fri 9 – Wed 14 Oct
**Scope:** [`docs/planning/skoda-m1-url-set.txt`](../planning/skoda-m1-url-set.txt): 43 URLs (42 unique pages) plus
everything the docs **require and don't rule out** for them.
**Supersedes for M1 planning:** [`M1-BACKLOG-REVIEW.md`](./M1-BACKLOG-REVIEW.md) (21 Sep). That review is still valid for
board hygiene, but it predates the 43-URL scope.
**Status:** proposal. **No DA changes have been applied.** The GitHub side of §11 was applied **partially** in
the 2026-09-25 sync (issue creation, milestone alignment for 206/405/815, body sync, Status/Priority/Estimate on
the new items). Assignees, epic milestones and the other re-milestones (403, 216, 507) are still pending; see §11.

---

## 1. Executive summary

1. **Content is the critical path.**
   - `main` has **3 rows** in `/en/query-index.json` (`/en`, `/en/skoda-model/elroq`, `/en/test/listing-demo`).
   - **42 of 43 demo URLs return 404** on preview.
   - The P0 content tickets **602/603** have not started, and 602 needs DA credentials (a human gate).
     *Update 2026-09-25: the gate is resolved — the environment injects the DA/admin credentials, and SKODA-602 is built and piloted (`tools/importer/push-to-da.mjs`).*
   - Rendered QA shows the effect: the `/en` Latest Stories feed (SKODA-214, "Done") renders **0 cards**, only
     because there are no story rows.
2. **The scope has outgrown the ticket set.** The 43 URLs pull in four things the M1 backlog did not plan:
   - **4 press kits**: all of SKODA-805–808 were M2, and there was no importer.
   - **5 model pages**: SKODA-208 was M2 in the docs. Its 3 runtime blocks don't exist.
   - **21 story URLs**: every one has an in-body image carousel, and nothing covers it.
   - **2 media listings**: no image or video item rows exist.
3. **The biggest unplanned gap is `skoda-carousel-widget`.**
   - Verified live, it is an in-body autoplay image gallery (Flickity `autoPlay:3000`, captions,
     `media-cart-image`) on **21/21** story URLs.
   - SKODA-801 describes it as "related-content teasers", `carousel-rails.md` says there are none, and the importer
     drops it together with the Media Box (21/21) and Vimeo embeds (2/21).
   - Without a fix, every demo story is text-only. Two new tickets cover it: **SKODA-219** and **SKODA-801a**.
     (219 is now superseded by **SKODA-819**, the Gallery `slider` variant; see §15.)
4. **Remaining Must work ≈ 57.5 SP** in the build window, plus **≈ 11 SP** of QA gates in the dry-run window.
   (≈ 59.5 SP after the 816–823 fold-in, §15.)
   - Build-window capacity is **≈ 28 dev-days**, which is **46–75 SP (mid ≈ 57)** at the OVERVIEW ratio of 0.37–0.61
     AI-day/SP.
   - So **Must fills 100% of mid-velocity capacity** (≈ 104% after §15).
   - About 8 SP of Must (603 import runs, 605/606, 701) is planned as agent-executed under human review. If that
     holds, human demand is ≈ 24 dev-days, leaving **≈ 3–4 days of slack** (≈ 25.3 d and ≈ 2.7 d after §15). If
     the agents under-deliver, slack is zero. §9–§10 give the overflow order.
   - Should items (8.5 SP) start only if the **Thu 1 Oct checkpoint** shows at least 45% of Must burned down.
   - §9 lists the de-scopes (403 search paused, 216, 405, 507, 705, 706, 811, 1001, 209, 806–808).
5. **Every developer is fully used, in collision-safe streams** (§10):
   - saran: media, cart, listings and link containment
   - vijay: blocks, chrome, stories and models
   - extra resource: Media-Room importers (PR, press kit, series), packed into Mon 28 Sep – Fri 2 Oct
   - Lars: content ops and architect/QA gates, with agent-executed tickets
6. **Ten decisions and three human gates are needed this week** (§12):
   - **Decisions:** press-kit child pages, CS in the demo, link containment, series-hub cards, the cart fallback,
     confirming the 216 deferral, and (from §14) embargo, search sample, sidebar and the client-scope adds.
   - **Gates:** MR footer unify-vs-distinct by Fri 25 Sep; DA credentials by Mon 28 Sep; AEM Assets CORS by Thu 1 Oct.
7. **The client scope doc (16 Sep) promises more than the 43-URL set covers** (§14):
   - Pages missing from the set: the MR homepage, the series directory, and CS pages.
   - Promises this review puts below Must: a press kit end to end (sub-page, whole-kit ZIP) and social share.
   - Promises that contradict this review's rulings: embargo, search on a sample, and the article sidebar.
   - Net Must would rise to ≈ 65.5 SP. The recommendation is to extend the extra resource by about 4–5 days and to
     send the client a corrected scope doc before Thu 1 Oct.
8. **Eight story-fidelity tickets (SKODA-816–823) arrived from the Epiq side-by-side QA** (§15):
   - PR #113 already shipped 822 (the 801 two-column layout) and the importer halves of 816, 817, 818 and 820.
   - 819 supersedes 219. 818 takes 801a's embed part, which shrinks 801a to the Media Box plus the 21-story run.
   - 823 (newsletter stub) is Could.
   - Net Must **+2 SP → ≈ 59.5 SP**, all of it on vijay (15.5 → 17.5 SP, 86%). Plan A still fits without the
     extension. With §14 accepted, plan B is ≈ 67.5 SP, which needs the 5-day extension.

---

## 2. Method and evidence

The review ran as an Architect → parallel read-only agents → synthesis pass. Evidence is kept in the session
workspace; the findings are reproduced here.

| Step | What was checked | Evidence |
|---|---|---|
| Baseline | Project board #1: 89 items, M1 = 32 open / 21 closed. Open PRs, `origin/main` tree, DA tree, preview status of all 43 URLs | `gh project item-list`, `gh pr view`, `git ls-tree origin/main`, `curl -I` against `main--demo--skoda-storyboard.aem.page` |
| URL census | All 43 source URLs, split into 5 groups: body template, blocks/widgets, embeds, media, interactions, outbound links | live HTML via `curl`; `SKODA-BLOCK-RECOUNT-DATASET.csv`; `SKODA-STORY-WIDGET-DATASET.csv`; mediabox API |
| Doc requirements | Traceability, client mapping, fallback confirm, template models, rail-feed map, `ui-specs/*` ACs, and a ruled-out list with citations | §6 |
| Ticket revalidation | Every M1 issue, plus the M2 issues the 43 URLs touch: status vs code, ACs vs census, dependencies, remaining SP | §7 |
| Rendered QA | Done and in-review blocks on `main`/PR previews at 375/768/992/1080/1280. Headless Chrome via CDP, because the shared DevTools MCP profile was locked. Lighthouse was not run (tooling). | §5 |

**Confidence.** High for code state, preview state and story widget composition, which were re-verified live on
2026-09-24. Medium for per-model rail counts, which are inferred from tags in the census datasets.

---

## 3. Scope: the 43 URLs by template

| Template | URLs | Source template (live) | Primary tickets |
|---|--:|---|---|
| Storyboard home `/en/` | 1 | STO home | 212, 213, 214, 217, 218 |
| Images / Videos listings | 2 | faceted listing (12 + 12 load-more, 15 facets) | 402, **608**, 203, 505a/b, 503 |
| Press release | 5 | `single-press_release` | 607, 502, 204 (Buzzsprout AI-audio + Vimeo), 205, 305 |
| Press-kit tiles hub | 3 | `press_kit-template-template-tiles`: Peaq 13, Epiq 13, Motorsport 24 tiles | **805a**, **805b**, 305 |
| Press-kit default article | 1 | `press_kit-template-default` (first-glimpse: 8 accordions, 60-image Media Box) | **805c** |
| Model page | 5 | `single-skoda_model` | 208, **608**, 212, 305 |
| Series hub | 5 | `single-skoda_series` | 207 (hub half) |
| Story detail | 21 (20 unique) | `template-layout-article`: `sow-editor` + `skoda-offset` + `skoda-carousel-widget` only | 801, **801a**, ~~219~~ **819**, 816–821, 502, 204, 205, 604 |
| Chrome (all) | 43 | STO or MR header/footer | 301, 302, 303, 304, 305, 306, **609** |

**Alias.** `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality/` returns 200 with
canonical `/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality/`. Import it once, redirect the alias, and
index it once (SKODA-609).

---

## 4. Coverage matrix

**Legend:**

| Mark | Meaning |
|---|---|
| ✅ | built and QA-verified (rendered) |
| 🟢 | on `main`, QA partial or blocked by missing content |
| 🟡 | in an open PR |
| 🔵 | open M1 ticket, not built |
| 🟣 | M2 ticket; an M1 slice was created in this review |
| 🔴 | **no ticket before this review**; a new ticket was created |
| ⚫ | ruled out for M1 (§6) |

| Template | Component / function | State | Ticket(s) | Severity if missing |
|---|---|:-:|---|---|
| **All** | STO header + mega-menu (desktop) | 🟢 | 301 | – |
| | Mobile nav: drawer, `aria-expanded` on the button, 68×64 hit target | 🔵 | 302 | demo-visible / a11y |
| | Language switcher (EN+CS, existing locales only, `aria-current`) | 🔵 | 303 | cosmetic / a11y |
| | STO footer | 🟢 | 304 (typography/column QA findings) | demo-visible |
| | MR footer on MR pages (PR, kits, models, listings) | 🔵 | 305 | demo-visible |
| | Footer outbound links open in a new tab | 🔵 | 306 | cosmetic |
| | Absolute → relative links; consent residue stripped | 🔵 | 605, 606 | demo-blocking (links jump to live) |
| | Link containment for out-of-set targets; alias redirect | 🔴 | **609** | demo-blocking (in-site 404s) |
| | Search UI (hosted search) | ⚫ | 403 paused, 901 M2 | – |
| **Home** | Promo box mosaic | 🟡 | 213 (#110 draft, QA PASS on branch) | demo-blocking (main renders a raw 1200×2167 column) |
| | Latest Stories feed + load more | 🟢 | 214 (code) + 603 (index rows) | demo-blocking (0 cards today) |
| | 6 story rails | 🟢 | 212 (cell widths 270/216/294 vs 281/230/338) | demo-visible |
| | Social profile cards + dark bands | 🔵 | 217, 218 (Lars WIP) | demo-visible |
| | Promo/rail targets outside the set | 🔴 | **609** / 603 corpus | demo-blocking |
| **Listings** | Faceted listing, load more, deep links | ✅ desktop and mobile; 768 facet bar should hide | 402 | demo-visible |
| | Image and video **item rows**, ≥18 each | 🔴 | **608** | demo-blocking (empty listings) |
| | Lightbox on items | 🟢 | 203 (focus trap / arrows still to verify) | demo-visible |
| | Original/1920 download; MP4 download | 🟡 / 🔵 | 502 (#111) / 503 | demo-visible |
| | Add to cart, collect, ZIP | 🔵 | 505a, 505b | demo-blocking (mission-critical) |
| **Press release** (5) | Two-column shell, no hero, MR chrome | 🔵 (importer partial) | 607 | demo-blocking (404) |
| | Buzzsprout AI-audio (MR-PR03 M1), Vimeo | 🟡 block / 🔴 mapping | 204 (#109), 607 update | demo-visible |
| | Media Box → downloads | 🟡 | 502 + 607 | demo-visible |
| | Related-PR dark rail (optional; 4 of 5) | 🔵 (not modelled) | 607 update, 218 | demo-visible |
| | Tags | 🟢 | 205 | – |
| | Newsletter / side banner | ⚫ | 904 / 903 | – |
| **Press-kit hubs** (3) | Overlay hero + tile grid + importer | 🟣 | **805a** | demo-blocking (404) |
| | 50 chapter/resource child pages | 🟣 | **805b** (decision D-1) | demo-visible (dead tiles) |
| | Variant selector, FAQ, whole-kit ZIP | ⚫ M2 | 806, 807, 808 | – |
| **Press-kit default** (1) | Article, 8 accordions, embeds, 60-image Media Box | 🟣 | **805c** | demo-visible (degrades to 607 shell) |
| **Model page** (5) | Hero | 🟢 | 202, 208 | – |
| | In-page nav, key facts, spec table **blocks** | 🔵 (importer emits them, blocks missing) | 208 | demo-blocking (raw tables) |
| | News / Press Kits / Stories rails | 🟢 block / 🔵 content | 212 + 603 corpus | demo-visible (thin or empty) |
| | Images / Videos rails | 🔴 | **608** | demo-visible (0 rows for every model) |
| | Hide empty rails | 🔴 | 208 update | demo-visible |
| **Series hub** (5) | Hero + story grid | 🔵 (importer on main, index-driven) | 207 | demo-visible (130y, jobs and minutes empty) |
| | `/en/series-2/` directory | ⚫ M1 (not in set) | 207 → M2; 609 | – |
| **Story** (21) | Default content, hero, metadata | 🟢 importer | 801 | – |
| | **In-body image carousel** (21/21) | 🟡 importer emits plain Gallery (#113); slider variant unbuilt | ~~219~~ → **819**, **801a** | demo-blocking (text-only stories) |
| | Media Box → downloads + cart hook (21/21) | 🔴 mapping (importer drops it) | **801a**, 502, 505a | demo-visible |
| | Vimeo embeds (2/21) | 🟢 importer (818, #113); renders once #109 merges | 818, 204 | demo-visible |
| | Visible tags | 🟢 | 205 / 801a | – |
| | Story hero (title above 16:9 image), sidebar dedupe, bottom related-stories band, body inset | 🟡 importer on main (#113); block/CSS follow-ups open | **816**, **817**, **820**, **821** (§15) | demo-visible |
| | `.sb-gallery` Favorit gallery | ⚫ M1 (0/21 in set) | 216 → Could | – |
| | Share cluster | 🔵 | 215 (no issue) → Could | cosmetic |
| | Sidebar (STO-D07), newsletter | 🟡 sidebar built by 801 (#113) + 817; newsletter ⚫ 904 | 801, **817**; 823 Could | – |
| | 2 full-fidelity hero stories | 🔵 | 604 (re-pointed to in-set stories) | demo-visible |
| **Cross-cutting** | Media: masters-only, pre-conditioning gate | 🔵 | 501, 506 | demo-blocking (publish 409s) |
| | DA push, bulk preview/publish, reindex | 🟢 | 602 (built 2026-09-25; gate resolved) | demo-blocking |
| | 43 + corpus import, per-URL tracker | 🔵 | 603 (re-scoped, 5 SP) | demo-blocking |
| | Lint, Lighthouse ≥90, WCAG 2.1 AA, ≤2% visual diff, dry run | 🔵 | 701, 702, 703, 704, 707 | demo-blocking (gates) |
| | CS locale proof | 🔵 | 303 / decision D-2 | cosmetic (Should) |
| | Embargo (ungated, narrative only) | ⚫ M2 | 811 | – |

---

## 5. Rendered QA results (Done and in-review blocks)

All measurements were taken on 2026-09-24 against `https://www.skoda-storyboard.com/en/` and the EDS
`main`/PR previews.

| # | Ticket | Result | Finding (WHAT / WHERE / VIEWPORT / EXPECTED → ACTUAL) | Severity | Action |
|--:|---|:-:|---|---|---|
| 1 | 204 (#109) | PASS | YouTube 16:9 at 1280 (1200×675) and 375; audio frames 200px; lazy loading | – | Merge after the review findings are fixed |
| 2 | 204 | FAIL (minor) | iframe `title` attributes are raw URLs, not labels | a11y | Fix in #109 |
| 3 | 213 (#110) | PASS on branch | Mosaic at 1280: 812×466 + 400×225 (source 832×467 / 416×225); 375 one-up with 44×44 dots | – | Undraft, fix PSI, merge |
| 4 | 213 | FAIL on `main` | `.promo-box` renders a raw column, 1200×2167 | demo-blocking | Merged by #110 |
| 5 | 502 (#111) | PASS | 4-col grid at 1280, 288×162 thumbnails, 40×40 buttons, dropdown `aria-expanded` | – | **Merge now** |
| 6 | 203 | PASS (partial) | Lightbox `role=dialog`, Escape closes, focus returns. Arrow keys and full Tab trap not measured | a11y | 703 targeted pass |
| 7 | 402 | PASS / FAIL | Desktop and mobile OK; deep link `?filter[model][]=elroq`. **At 768 the facet bar is visible (720×35)** where the source hides it | demo-visible | Small fix (saran) |
| 8 | 214 | FAIL | `/en` Latest Stories: 0 cards, no load more (source: 5 cards at 624/624/416/416/416 + 178×44 button). **Root cause: no story rows in the index** | demo-blocking | 603 import; re-QA |
| 9 | 212 | FAIL | Rail cell widths are 270/216/294px at 1280/768/375 vs source 281/230/338 (22.5% / 30% / 90%, 20px gap, 1248px cap) | demo-visible | 212 fix in `blocks/carousel` (219 is superseded by 819, which lives in `blocks/gallery`) |
| 10 | 217/218 | FAIL | 0 dark bands, 0 social cards on `/en` | demo-visible | Lars WIP → merge |
| 11 | 301/302 | PARTIAL / FAIL | Header 108/44/64px OK. Hamburger is **20×22** (source 68×64), `aria-expanded` sits on the nav not the button, and the drawer is right-anchored at 85% (source is full width) | demo-visible / a11y | 302 |
| 12 | 303 | FAIL (minor) | Links are weight 400 (source 300); no `aria-current` | cosmetic | 303 (Should) |
| 13 | 304 | PARTIAL | Band, colours and icons OK. Columns are 155px × 441px equal height (source 175px, varied); font 13/400 (source 12/≈500) | demo-visible | Fix under #25 |
| 14 | 202, 205 | UNVERIFIABLE | No imported story or model page on `main` | – | Re-QA after 603 |
| 15 | Lighthouse | NOT RUN | Shared DevTools MCP profile locked; no local Lighthouse | – | 702 in the dry-run window |

**Side finding.** The #93 (402) PR body links to the preview root. The working fixture is `/en/test/listing-demo`.

---

## 6. Ruled out or deferred for M1 (with citations)

| Item | Status | Citation |
|---|---|---|
| Side banners / ads (903, D3) | deferred M2 | Traceability §2.E: "deferred, bespoke ad server (D3)" |
| Newsletter backend (904) | UI stub only | Client mapping §1: "UI-only for PoC" |
| Cookie consent / OneTrust (D10) | out of Adobe scope; strip | `SKODA-DEMO-FALLBACK-CONFIRM.md`: "Out of Adobe delivery scope." |
| Analytics / dataLayer rebuild (804/905) | M2; hooks only | Traceability §6 |
| Hosted search (901) | M2 (index-only in M1) | Traceability §1 COM06 |
| QR restricted access (906) | M2+ | Traceability §4 |
| Roles (809), audit (812) | M2 | Traceability §4 |
| Group-gated embargo (811) | M2; ungated is stretch only | Traceability §4: "M1-Stretch only in *ungated* form" |
| Locales beyond EN+CS | M2 | Fallback confirm: "DE/SK/SR/SL on-demand for M2" |
| Production ZIP service (902) | M2; M1 uses a client-side `fflate` ZIP | `E09-dynamic-services.md`; fallback confirm (corrected 2026-09-21) |
| Škodapedia, company pages, category/tag archives | not in the set | `SKODA-BLOCK-DATA-MODEL.md` §2; `skoda-demo-content-urls.txt` §Not in demo |
| Bulk automated migration, RSS (405) | M2 / stretch | Traceability §5; OVERVIEW register |
| Press-kit variant selector, FAQ, whole-kit ZIP (806–808) | M2 | Traceability §3.D |
| Series directory `/en/series-2/` | not in the set → M2 | this review |
| Story sidebar (STO-D07) | ~~M2~~ **M1 via 801 + 817** (review §15); newsletter → 823 Could | Traceability §2.E (updated) |

**Required by the 43 URLs but tagged M2 in the docs.** These are resolved by this review:
- press kits → 805a/b/c
- model page → 208 moved to M1
- PR structured downloads → static in 607 + 502
- MR-V04 video download → a static MP4 link via 503 (Should)
- CS → decision D-2

---

## 7. Ticket revalidation: status corrections

| Ticket | Board says | Reality (2026-09-24) | Correction |
|---|---|---|---|
| 505 (#33) | Done | Closed as superseded by 505a (#50) / 505b (#51), both **unassigned P0** | Exclude from delivered SP. Add the D-5 fallback AC (default: single-file download + client ZIP) to 505a |
| 214 | Done | Code OK; renders empty with no index rows | "Done (code)"; the QA gate moves to 603 |
| 304 (#101) | Done | Merged with `CHANGES_REQUESTED`; QA finding #13 | Fix typography/columns under #25 |
| 203 | Done | Share affordance split to 215 (**no issue**); focus trap not verified | Create the 215 issue (Could); verify in 703 |
| 208 | M1 (board), M2 (docs) | Importer on main; 3 blocks missing | **Docs moved to M1** (ticket updated) |
| 207 | Ready | Importer on main; the directory is out of the set | **Re-scoped to the 5 hubs** (ticket updated) |
| 603 | Ready, 3 SP | Pilot definition obsolete | **Re-scoped** to 43 + corpus + tracker, 5 SP (ticket updated) |
| 604 | Ready | The olive-oil reference is not in the set | **Re-pointed** to Octavia-365 + Peaq-production (ticket updated) |
| 607 | Backlog | Importer drops Buzzsprout, doesn't model the related rail, and flattens the downloads | ACs extended (ticket updated) |
| 801 | In progress | Widget mapping wrong for `skoda-carousel-widget` | Corrected. The M1 fidelity work is split into **801a**. **Update:** 801 merged in PR #113 (two-column layout, carousel routed by content to Gallery/Cards); see §15 |
| 805 | M2 | 4 kits are in M1 | M1 slices **805a/805b/805c** |
| 306 (#102) | Ready | No ticket file | **File created** |
| 403 | In progress (saran) | No search URL in the set; index-only search is M1 in the docs but not needed by these URLs | **Pause** and move to M2/Could; this frees saran |
| 405 | M2 (board), M1 stretch (docs) | Not needed | Align the docs to M2 |
| 216 | Ready | `.sb-gallery` appears on 0 of the 21 in-set stories | Move to Could / M2 unless a demo page needs it (D-6) |
| 507 | Blocked | Authoring picker not needed for the runtime demo | Move to M2 |
| Epics E01–E10 | no milestone | – | Set milestones |
| 38 issues | no priority; size/estimate empty | – | Fill from ticket SP (§11) |

Missing referenced docs: `SKODA-DELIVERY-PLAN.md`, `SKODA-M1-DEMO-TARGET.md` and `SKODA-DISCOVERY-SESSION-OCT15.md` are
cited across `docs/` but absent. Treat those references as stale. This review and `OVERVIEW.md` are the current M1
plan.

---

## 8. Gap register (new in this review)

| ID | Gap | Evidence | Severity | Resolution |
|---|---|---|---|---|
| G-01 | Content not imported; the index has 3 rows | 42/43 previews 404 | demo-blocking | 602 + **603 re-scope** |
| G-02 | `skoda-carousel-widget` unspecced, unbuilt, dropped (21/21 stories) | live markup; importer | demo-blocking | ~~219~~ **819** (Gallery `slider`) **+ 801a** (§15) |
| G-03 | Story importer drops the Media Box (21/21) and Vimeo (2/21) | `skoda-story-cleanup.js` drop list | demo-visible | **801a** (Media Box); Vimeo fixed by **818** in PR #113 |
| G-04 | No image or video item rows → empty listings and 10 empty model rails | index; RAIL-FEED-MAP §6 | demo-blocking | **608** |
| G-05 | Press-kit hubs: no importer, M2 tickets | census | demo-blocking | **805a** |
| G-06 | 50 press-kit child pages outside the set | tile census | demo-visible | **805b** / D-1 |
| G-07 | First-glimpse is a default-template kit, not a hub | body class | demo-visible | **805c** |
| G-08 | Model blocks `in-page-nav` / `key-facts` / `spec-table` missing | `blocks/` on main | demo-blocking | 208 |
| G-09 | Series hubs are index-driven → 3 of 5 empty | importer + census | demo-visible | 207 update / D-4 |
| G-10 | Most chrome, tag, promo and related links leave the set → 404 after 605 | census link sweep | demo-blocking | **609** / D-3 |
| G-11 | Mixed-reality alias duplicated in the set | canonical tag | cosmetic | **609** redirect |
| G-12 | PR importer drops Buzzsprout (MR-PR03 M1) and the related rail | importer | demo-visible | 607 update |
| G-13 | Rendered QA regressions on Done tickets (212, 302, 304, 402, 204 titles) | §5 | demo-visible | fixes assigned in §10 |
| G-14 | 505 parent closed; P0 split tickets unassigned; the original fallback AC was not carried to 505a/505b | #33 comment | demo-blocking | assign; add the D-5 fallback AC to 505a |
| G-15 | 215 has no issue; 306 had no file | board vs docs | cosmetic | create the issue / file created |
| G-16 | CS required by the fallback doc but not in the set | fallback confirm vs URL set | cosmetic | D-2 |

---

## 9. Capacity model and cut line

**Build window.** Fri 25 Sep – Thu 8 Oct is 10 working days.

| Person | Days available | Coding days | Notes |
|---|--:|--:|---|
| saran-adobe | 10 | 10 | 403 paused |
| vijayr-adobe | 10 | 10 | |
| extra resource | 5 | 5 | ideally from Mon 28 Sep |
| larsauffarth | ≈6 (3 d/wk) | ≈3 | the rest goes to architect, QA gates and human gates |
| **Total** | | **≈28 dev-days** | |

**SP conversion.** At the OVERVIEW ratio of 0.37–0.61 AI-day/SP, that is **46–75 SP (mid ≈ 57)**.

**Dry-run window.** Fri 9 – Wed 14 Oct is 4 days × ~2.6 people ≈ 10 dev-days. It covers 702, 703, 704 and 707
(11 SP ≈ 5.4 d), plus about 4.5 d for fixes. The gates are split across people, not all on Lars:
- 702 → saran
- 703 → vijay, with the QA agents
- 704 and 707 → Lars

### Must (build window, ≈ 59.5 SP after §15; was 57.5): the demo fails without these

| Stream | Tickets (remaining SP) |
|---|---|
| Land PRs | 502 #111 (0.5) · 204 #109 (1) · 213 #110 + 217 + 218 (2) |
| QA fixes | 212 rail widths (0.5) · 402 tablet facets (0.5) · 302 nav ARIA/geometry (1) |
| Chrome | 305 MR footer (2) · 306 new-tab links (1) |
| Media / cart | 501 (3) · 506 (2) · 505a (5) · 505b (3) · **608** (3) |
| Content ops | 602 (3) · 603 (5) · 605 + 606 (2) · **609** (2) · 701 lint (1) |
| Stories | **819** (3, supersedes 219) · **801a** (1.5, was 3) · **816** (0.5) · **817** (1) · **820** (1) · **821** (1) (§15) |
| MR templates | 607 (5) · **805a** (3) · 208 (4) · 207 (2) |

### Must (dry-run window, ≈ 11 SP)

702 Lighthouse (3) · 703 a11y (3) · 704 visual sign-off (3) · 707 demo script + rehearsal (2).

### Should (≈ 8.5 SP): start only after the Thu 1 Oct checkpoint shows at least 45% of Must burned

| Item | SP | Owner if opened | Fallback if not done |
|---|--:|---|---|
| **805c** first-glimpse | 3 | vijay (W3) | import with the 607 PR shell, without accordions |
| 604 hero stories | 2 | vijay (W3, after 801a) | the 801a baseline only |
| 503 MP4 / PDF routing | 2 | saran (W3) | the MP4 URL shown as a plain link (608 records it as metadata) |
| 303 switcher + CS proof (D-2) | 1.5 | vijay (W3) | EN only; switcher hides locales that don't exist |

### Could (≈ 8 SP): unowned, pulled only if capacity opens

805b option B, Peaq children (3) · 216 `.sb-gallery` (3) · 215 share (1) · 705 button variant (1) · **823**
newsletter UI stub (2, §15; not counted in the ≈ 8 SP).

### Won't in M1

403 (paused) · 405 · 507 · 706 · 811 (narrative only) · 1001–1003 · 209 · 806–808 · everything in §6.

**Risk statement.** Must equals mid-velocity capacity. Mitigations:
1. Pause 403 today.
2. Start the extra resource Mon 28 Sep. **If they're late:** 607 moves to vijay, and 805a/207 fall back to static
   hub content (curated cards, tiles linking out).
3. Run the agent-fit tickets (605/606, 609, 701, 603 import runs) as AI-agent tickets. Lars reviews 603 and 605/606;
   saran reviews 609; vijay reviews 701. This follows the AGENTS-TEAM loop.
4. **Overflow order:** the spare days (vijay ≈ 1.4 d after §15, saran ≈ 0.7 d) first absorb Lars's overflow (import runs), then
   QA-loop fixes. Then Should opens.
5. Hold the Should gate strictly.
6. If 505b's CORS gate slips past 1 Oct, ship the D-5 fallback: single-file direct download plus client ZIP. Move
   the freed effort to 608/609.

---

## 10. Execution waves and per-developer plan (collision-safe)

Collision surfaces, per [`AGENTS-TEAM.md`](../../AGENTS-TEAM.md) §Non-Colliding Parallel Execution. Each has one owner,
or is serialized:

| Surface | Owner | Rule |
|---|---|---|
| `blocks/carousel` | vijay | 212 fix only (219 is superseded by 819, §15) |
| `blocks/gallery` | vijay | 819 `slider` variant first (Must), then 216 `.sb-gallery` (Could) |
| `blocks/hero-image` | vijay | 816 caption styling |
| `blocks/story-rail` | vijay | 820 curated-mode fix first, then the hide-empty rails in 208; 608 just supplies the rows |
| `blocks/footer` | vijay | 305 → 306 |
| `blocks/header` | vijay | 302, then 303 |
| `blocks/cards`, `card-teaser`, global `styles/*` | Lars | the 213/217/218 WIP; no other global CSS edits until it merges (W1). 805a/207 `cards` CSS waits for that merge. The WIP must rebase onto the `body.story` CSS that PR #113 added. 817/820/821 story CSS then goes into that `body.story` section (vijay) |
| `blocks/listing`, `query-index-config.yaml` | saran | 402 fix, 608 |
| `blocks/downloads`, `blocks/embed` | saran (downloads follow-ups) | merged in W0 **before** 607, 801a and 805c map to them. The 805c lazy/paginated Media Box is a saran follow-up |
| Shared `transformers/skoda-page-cleanup.js` (used by all importers), the new link-policy step, and all generated `*.bundle.js` | Lars → saran | 605 → 606 merge **before** the 607/801a PRs open. 609 is implemented *inside* the shared cleanup (saran, after 606). PR #113 already changed the shared cleanup (D4 href normalisation), so 605/606 rebase onto it. Regenerate bundles only after rebasing |
| `import-story-detail.js` + bundle, `parsers/story-flatten.js`, `parsers/story-hero.js`, `skoda-story-cleanup.js`, `skoda-story-aside.js` | vijay | 801 is merged (#113), so there is no handover. Serialized: 819 importer switch → 801a Media Box → any 816/820 follow-ups |
| `import-press-release.js`, new press-kit/series importers | extra | 607, 805a, 207 |
| `page-templates.json` | Lars owns the `urls` lists (603) | new template entries (607, 805a, 805c, 608) are small PRs merged the same day; rebase before pushing |

| Wave | Dates | saran | vijay | extra resource | Lars (architect + content ops) |
|---|---|---|---|---|---|
| **W0** | Thu 24 – Fri 25 Sep | Pause 403. Review/merge **#111** (502) | Fix #109 review findings + iframe titles → merge **#109** (204) | onboarding (if available) | Finish 217/218 WIP → PR; undraft/merge **#110**. **Request DA credentials + AEM CORS; MR-footer decision.** Decisions D-1…D-6. Create the issues in §11 |
| **W1** | Mon 28 Sep – Thu 1 Oct | 501 masters-only → 506 pre-conditioning gate → **609** containment + alias redirect (agent-run, saran reviews; starts once 606 merges Tue, merged by Thu 1 Oct) → start 505a | **Mon: pin the 819 `Gallery (slider)` table with Lars** (the importer already emits `Gallery`; only the variant is added). Then 305 MR footer → 306; 302 nav; 212 rail fix; 816 caption + 820 story-rail curated fix → start 819 slider rendering | **607** PR importer + template (Buzzsprout, related rail, downloads) → **805a** hubs (805a PR closes after 609 merges) | 602 DA push/publish; 605/606 (agent) merged by Tue; 603 tracker + first import (home, listings); **story pass 1 on Wed 30 Sep** (preview-only QA of the #113 importer output) |
| **Checkpoint** | Thu 1 Oct | | | | Re-QA 214/213/217/218 on the imported `/en`. Recompute collisions. **Should gate.** CORS go/no-go (D-5). **609 merged** is a precondition for W2 imports |
| **W2** | Fri 2 – Tue 6 Oct | finish 505a → 505b (live DAM) → **608** image/video items + 402 fix | 819 importer switch → **801a** Media Box → finish 819 rendering → 817/820/821 story CSS (after the styles WIP merges) → 208 blocks + hide-empty rails | Fri 2: **207** hubs (D-4). Budget spent | Re-import home + listings with 609 applied; 603 imports: 5 PRs, 5 models, 3 hubs, corpus; **the 21 stories get their final import after 819 + 801a merge (target Mon 5)** |
| **W3 (freeze)** | Wed 7 – Thu 8 Oct | cart end-to-end on listings and stories; 609 crawl = 0 in-site 404s; 503 if Should | 208 QA; if Should opens, in order: 805c → 604 → 303/CS | – | full reindex; kits/series QA (QA agents); 701 lint (agent, reviewed by vijay). **Freeze EOD 8 Oct** |
| **Dry run** | Fri 9 – Wed 14 Oct | **702** Lighthouse + media/cart fixes | **703** a11y (with QA agents) + block/chrome fixes | – | **704** sign-off; **707 rehearsal Mon 12 Oct**; fixes Tue 13 – Wed 14; demo Thu 15 |

**Per-person load at mid velocity (0.49 d/SP):**

| Person | Assigned Must SP | Days needed | Share of capacity |
|---|--:|--:|--:|
| saran | 19: 502, 402 fix, 501, 506, 505a, 505b, 608, 609 (agent-run, saran reviews) | 9.3 of 10 | 93% |
| vijay | 17.5: 204, 212 fix, 302, 305, 306, 819, 801a (1.5), 816, 817, 820, 821, 208 (§15) | 8.6 of 10 | 86% |
| extra | 10: 607, 805a, 207, packed into Mon 28 Sep – Fri 2 Oct | 4.9 of 5 | 98% |
| Lars | 13: hands-on 213/217/218 and 602 (5 SP ≈ 2.5 d); agent-executed 603, 605/606 and 701 (8 SP) under review | ≈ 2.5 of ≈ 3 coding days, plus review time | ≈ 85% + review |
| **Total** | **59.5** (= Must) | ≈ 25.3 human dev-days | of ≈ 28 |

The remaining margin (vijay ≈ 1.4 d, saran ≈ 0.7 d) goes in the risk-statement order: first Lars's overflow, then
QA-loop fixes, then Should.

---

## 11. Proposed GitHub board changes (partially applied 2026-09-25)

> **Applied in the 2026-09-25 disk↔GitHub sync:**
> - Item 1: all issues were created (numbers below). 219 was also created, for parity only, and closed as not
>   planned (#116 → #122). 822 was created and closed as completed (#125, PR #113). 818 (#121) stays open until
>   the #109 render check. SKODA-215 still has no ticket file on `main`, so it has no issue yet.
> - Item 3: 405 → M2 (docs aligned). 206 docs aligned to its board milestone M2. #114 (815) had no milestone and
>   is now M2.
> - Item 5: the disk bodies of all 21 drifted issues were synced, which covers the listed files plus 212–214, 306,
>   505/505a/505b, 507, 601, 707, 814 and others.
> - Item 6: Status/Priority/Estimate are set on the new items. Existing items are unchanged.
>
> **Still pending (needs sign-off):** item 2 (assignees), the rest of item 3 (403, 216, 507 re-milestones, epic
> milestones) and item 4.

1. **Create issues** from the new ticket files, then add them to Project #1 with milestone M1:
   - ~~SKODA-219~~ (#116, closed as not planned): superseded by SKODA-819 (§15)
   - [SKODA-801a](../tickets/tickets/SKODA-801a.md) (#127): P0, 1.5 SP (was 3, §15), vijay, parent #48
   - [SKODA-608](../tickets/tickets/SKODA-608.md) (#117): P0, 3 SP, saran
   - [SKODA-609](../tickets/tickets/SKODA-609.md) (#118): P0, 2 SP, saran (agent-executed)
   - [SKODA-805a](../tickets/tickets/SKODA-805a.md) (#128): P0, 3 SP, extra, parent #66
   - [SKODA-805b](../tickets/tickets/SKODA-805b.md) (#129): P2 Could, unowned
   - [SKODA-805c](../tickets/tickets/SKODA-805c.md) (#130): P1 Should, vijay
   - SKODA-215: P2 Could, unowned
   - From §15: [SKODA-819](../tickets/tickets/SKODA-819.md) (#122, P0, 3 SP), [816](../tickets/tickets/SKODA-816.md)
     (#119, P0, 0.5 SP remaining), [817](../tickets/tickets/SKODA-817.md) (#120, P0, 1),
     [820](../tickets/tickets/SKODA-820.md) (#123, P0, 1), [821](../tickets/tickets/SKODA-821.md) (#124, P0, 1), all
     vijay. [823](../tickets/tickets/SKODA-823.md) (#126): P2 Could, unowned. [818](../tickets/tickets/SKODA-818.md)
     (#121): close when the #109 render check passes. [822](../tickets/tickets/SKODA-822.md) (#125): closed, done by
     PR #113
2. **Assign:**

   | Owner | Must | Should |
   |---|---|---|
   | saran | 502, 402 fix, 501, 506, 505a, 505b, 608, 609, 702 | 503 |
   | vijay | 204, 212 fix, 302, 305, 306, 819, 801a, 816, 817, 820, 821, 208, 703 | 805c, 604, 303 |
   | extra resource | 607, 805a, 207 | – |
   | Lars | 213, 217, 218, 602, 603, 605, 606, 701, 704, 707 | – |

   - Unowned Could: 805b, 216, 215, 705, 823.
3. **Milestones:**
   - 208 → keep M1 (docs now match)
   - 403 → M2 (pause)
   - 216 → M2 or Could
   - 507 → M2
   - 405 → M2 (align docs)
   - set a milestone on each epic, E01–E10
4. **Status:**
   - 214 → add a note "QA gated on 603"
   - #33 (505) → exclude from delivered SP
   - 304 → keep open follow-ups under #25 for QA finding #13
5. **Bodies:** sync the re-scoped ticket files (207, 208, 603, 604, 607, 801, 805) into their issues. Add the D-5
   fallback AC to #50.
6. **Fields:** fill Priority, Size and Estimate from the ticket SP for all M1 items.

---

## 12. Decisions and human gates (owner: Lars, by Fri 25 Sep unless noted)

| # | Decision | Options | Default if undecided |
|---|---|---|---|
| D-1 | Press-kit child pages (50) | A: import all (5–8 SP) · **B: Peaq children only (3 SP, Could)** · C: link out to live (inside 609) | **C** for M1; upgrade to B if Could capacity opens |
| D-2 | CS in the demo | none · **switcher filtered to existing locales + 1 CS story counterpart** · full CS | switcher shows only locales that exist; CS page is Should |
| D-3 | Link policy for out-of-set targets | see the [SKODA-609](../tickets/tickets/SKODA-609.md) table | absolute to live + new tab for ruled-out pages; import or swap for stories |
| D-4 | Series hub cards | index-driven + import linked stories · **static curated cards** | static cards for hubs whose stories are not in the corpus |
| D-5 | Cart if AEM CORS is late (after Thu 1 Oct) | wait · **single-file direct download + client ZIP over the CDN mirror** · pre-zipped per story | the fallback in bold; record it in 505a |
| D-6 | 216 `.sb-gallery` | keep M1 · **defer** (0/21 in-set stories use it) | defer |
| D-7 | Embargo demo (client doc 6.5 vs 6.3; §14 C-7) | scripted native walk-through (≈ 1 SP) · **correct the client doc to "go-live"** | correct the doc |
| D-8 | "Search on a sample" (COM06 note; §14 C-8) | resume 403 as Should · **correct the note** | correct the note |
| D-9 | Article sidebar STO-D07 (§14 C-9) | build the sidebar · **related rail + promo, doc wording corrected** | **Resolved by §15:** the sidebar is built (801 in #113, parity in 817). Subscription = 823 (Could) or doc wording "go-live" |
| D-10 | Client-scope adds C-1…C-6 (§14) | accept + **extend the extra resource about 4–5 days** · accept with the §14.3 trims · reject (tell the client) | accept + extend; decide by Mon 28 Sep |

**Human gates:**

| Gate | Blocks | Needed by | Owner |
|---|---|---|---|
| DA / EW credentials + bulk publish rights | 602, 603 | **Mon 28 Sep** | client / Adobe |
| AEM Assets CORS + original delivery URLs | 505b (and 507 in M2) | **Thu 1 Oct** | client |
| MR footer: unify vs distinct | 305 | Fri 25 Sep | client |

---

## 13. Verification plan (what "Done" means for M1)

- **Per URL:** the SKODA-603 tracker row is green for imported, previewed, published, indexed and QA. QA follows
  AGENTS-TEAM §Pixel-Perfect QA: ≤2% diff at 375/768/1280, or documented deviations.
- **Site:**
  - 0 in-site 404s (609 crawl)
  - Lighthouse mobile ≥90 on one page per template (702)
  - WCAG 2.1 AA checks on nav, lightbox, carousel, cart, accordion (703)
  - lint clean (701)
- **Functional script (707):**
  1. home → story (carousel, lightbox, download, add to cart)
  2. images listing (facet, load more, cart ZIP)
  3. model page (rails)
  4. press release (audio, downloads)
  5. press-kit hub → chapter
  6. series hub

  Run on `main--demo--skoda-storyboard.aem.page`, rehearsed Mon 12 Oct.

---

## 14. Client-scope reconciliation (added 2026-09-24 evening)

**What was compared.** The 43-URL set and this review were checked against the client-facing scope walk-through,
`SKODA-CLIENT-SCOPE-DISCUSSION.html`, dated 2026-09-16. It lives in the `larsauffarth/skoda-storyboard` repo at
`docs/planning/`. Its §3 capability grid, §4 requirement table and §6 demo narrative are what Škoda saw as the
15 Oct target.

**Result.** The 43-URL set covers most of the promise and goes further in several places. However:
- three promised pages are **not in the set**
- five promised capabilities sit **below Must** in this review, or were ruled out

The live source checks behind this section ran on 2026-09-24:
- The Peaq-2 and Epiq-2 press kits each link a pre-built whole-kit ZIP on `cdn.skoda-storyboard.com`. The
  Motorsport and first-glimpse kits have none.
- CS counterparts exist for 5/5 models, 5/5 series hubs, 20/21 story URLs, and the images and videos listings.
  Press releases and press kits have none.

### 14.1 Promised, but missing or under-tiered

| # | Client promise (doc §) | Status in the set / this review | Delta | Recommendation | SP |
|---|---|---|---|---|--:|
| C-1 | **Media Room homepage** (§3, §6, MR-H01–H10) | **Not in the 43 URLs.** `/en/media-room/` returns 404 on preview | page missing | Add `/en/media-room/` to the set. `import-home-mr.js` already exists on `main`. Its rails reuse `story-rail` and are fed by the 603/608 rows | 1.5 |
| C-2 | **Series: directory → hub**, two-level (§3, STO-S01–S03) | `/en/series-2/` is not in the set, and this review moved it to M2 | directory missing | Add `/en/series-2/`. `import-series-directory.js` already exists. The index-driven grid shows the 5 imported hubs | 1 |
| C-3 | **English + Czech**, with the switcher showing only languages that exist (§3, §6, COM05) | The set is **EN only**. 303/CS is a Should (D-2) | CS pages missing; tier too low | Promote **303 to Must**. Add 3 CS counterparts: Peaq model, the Peaq-production story, and one series hub. Add the CS header/footer fragments. Do **not** import `/cs/` home, because it needs a per-locale index (1001, M2) | 1.5 + 1 |
| C-4 | **One press kit end to end**: chaptered hub, a sub-page, spec table, grouped media and downloads (§3, §6, MR-PK01/02/04/06) | Hub = 805a (Must). The default article 805c is a Should. Children (805b) are Could | sub-page and narrative below Must | Promote **805c to Must**. Import **one** Peaq-2 chapter sub-page with the 805c importer. Reuse the 208 `spec-table` block | 3 + 1 |
| C-5 | **Whole-kit ZIP**, "a pre-built file, so easy" (MR-PK07, marked Demo) | Explicitly excluded from 805a (listed as 806, M2) | promise contradicted | Add a download link to the existing CDN ZIP on the Peaq-2 and Epiq-2 hubs. This is a 805a AC, not 806 | 0.5 |
| C-6 | **Social share** on story detail, with configurable channels (COM15, STO-D10) | 215 is Could, unowned, and has no issue | tier too low | Create the 215 issue and make it **Must** (vijay) | 1 |
| C-7 | **Embargoed content**: group-restricted page, previewed privately, published on schedule (§3, §6, 6.5) | Ruled out: 811 is M2, and only the ungated form is stretch | contradicted | **Decision D-7.** The client doc contradicts itself: its 6.3 says "scheduling, review and embargo at go-live". Either (a) script a native walk-through (restricted preview + scheduled publish; Lars, ≈ 1 SP, proven on one page), or (b) correct the doc to the 6.3 wording before the demo. Default: **(b)**, unless the client confirms 6.5 | 0–1 |
| C-8 | **Search on a sample**: "the demo proves the search experience on a sample" (COM06 note, §3) | 403 paused → M2 | soft contradiction | **Decision D-8.** Default: correct the note, because the tier is already Go-live. Otherwise resume 403 as a Should (saran) | 0 |
| C-9 | **Article sidebar**: related / promo / subscription (STO-D07, marked Demo) | M2 in traceability §2.E and in this review | contradicted | **Decision D-9.** Default: meet it with the related-stories rail (212) and in-body promo. Subscription is the newsletter, which is Go-live per COM16. Correct the doc wording. **Update (§15):** the sidebar itself is now built (801 + 817) | 0 |

**Covered, but only by a fallback the client will notice:**
- **6.9, "AEM Assets as the approved source in the demo".** The D-5 cart fallback (a CDN mirror) would break this.
  Keep the Thu 1 Oct CORS gate strict. If the fallback ships, say so in the demo script.
- **MR-PR06 / MR-V video "source download".** The 503 fallback (a plain MP4 link recorded by 608) meets this. 503
  can stay a Should.

### 14.2 Delivered beyond the client promise (levers if capacity is short)

| Client promise | The set delivers | Lever |
|---|---|---|
| "A model page" (§3, §6) | 5 model pages | Keep the 208 template. QA Peaq in depth; the other 4 get smoke checks only (≈ −0.5 SP) |
| "A press-release page" (§6) | 5 PRs | None needed: it's one importer (607) |
| "1–2 hero stories in full richness" | 801a baseline richness on all 21 stories | Keep. Without 801a + 819 the other 19 stories render with no carousels or Media Box. 604 stays a Should, because 801a on the 2 hero stories already meets the promise's wording |
| COM18: "Storyboard footer in the demo; **Media Room variant at go-live**" | 305 MR footer is Must (2 SP) | **Defer 305 to M2 (−2 SP).** Škoda already accepted this wording. Keep 306 |

### 14.3 Net effect on the cut line

- **Adds to Must:** C-1 1.5, C-2 1, C-3 2.5, C-4 4, C-5 0.5, C-6 1 = **+10.5 SP**. Of that, 4.5 SP (805c, 303) was
  already sized in Should, so **+6 SP is new**.
- **Levers:** defer 305 (−2) and smoke-test the other model pages (−0.5) = **−2.5 SP**.
- **Net Must ≈ 65.5 SP**, against a mid capacity of ≈ 57 (range 46–75). That is ≈ 4 dev-days over mid velocity. The
  §9 slack (≈ 3 d) does not cover it. After §15: ≈ 67.5 SP, ≈ 5 dev-days over, and slack ≈ 2.7 d.
- **Recommendation**, in order:
  1. **Extend the extra resource by about 4–5 days** (Mon 5 – Fri 9 Oct). Give them 805c, the C-4 sub-page, C-5, C-1
     and C-2 (≈ 7 SP ≈ 3.4 d). These sit on their own importers and templates (press kit, MR home, series), so they
     don't collide with other streams.
  2. If that isn't possible, take the C-7/C-8/C-9 doc corrections **plus** a client agreement to show CS on 3 pages
     only (C-3). Then move the C-4 sub-page to Should.
  3. In both cases, send the corrected client doc (C-7/C-8/C-9, COM18, and the CS page list) before the Thu 1 Oct
     checkpoint, so the demo matches what Škoda has in writing.
- **§11 is unchanged until Lars accepts §14.** If he does:
  - vijay takes 303 and 215 (+2.5 SP). 305 moves out (−2 SP) and smoke-only model QA saves −0.5 SP, so net
    ≈ 15.5 SP; ≈ 17.5 SP after §15.
  - The extra resource takes 805c, the C-4 sub-page, C-5, C-1 and C-2.
  - Lars adds the CS and extra URLs to the 603 tracker and to `skoda-m1-url-set.txt` (43 → 49 URLs: MR home, series
    directory, 3 CS pages, 1 press-kit chapter).
  - The 707 script gains: MR home → images, and EN ⇄ CS on a story.

---

## 15. Fold-in of SKODA-816–823 (Epiq side-by-side QA, added 2026-09-24 late)

**What arrived on `main`:**
- Commit `231110f` added eight story-fidelity tickets. They come from a side-by-side QA of the in-set Epiq story
  (`/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`).
- At 21:35, **PR #113** merged SKODA-801: the 17-widget flatten, the two-column body + aside, and the 815
  milestones flatten. The same PR carried commit `e763378`, which holds the importer halves of 816, 817, 818 and 820.
- GitHub issues were created in the 2026-09-25 sync: 816–823 → #119–#126 (822 closed, PR #113).
- On `main`, all eight ticket files read 🔵 TODO. This change updates the status lines of 816, 817, 818, 820 and
  822; 819, 821 and 823 stay TODO. The state below was checked against `main` at `6af751e`.

### 15.1 Ticket by ticket

| Ticket | What | State on `main` | Remaining SP | Relation to this review | Tier | Owner | Wave |
|---|---|---|--:|---|---|---|---|
| [822](../tickets/tickets/SKODA-822.md) | Ship the 801 two-column layout | ✅ done (PR #113) | 0 | Removes the §10 "Lars hands over 801" step | close | – | done |
| [818](../tickets/tickets/SKODA-818.md) | `lite-youtube` and YouTube/Vimeo iframes → bare URL for the 204 autoblock | ✅ importer done | 0 (render check is part of the #109 QA) | Takes over 801a's embed part (G-03) | Must (verify only) | vijay | W0, with #109 |
| [816](../tickets/tickets/SKODA-816.md) | Story hero: title above a 16:9 image, then perex, date and Tags | 🟡 importer done; the `hero-image` story variant exists; caption styling (20px/600) is open | 0.5 | New; STO-D01 layout | Must | vijay | W1 |
| [817](../tickets/tickets/SKODA-817.md) | Aside dedupe (6 → 3 cards) plus sidebar visual parity | 🟡 importer dedupe and Tags heading done; parity CSS open | 1 | **Resolves C-9 / D-9:** the sidebar is in M1 via 801 + 817 | Must | vijay | W2, after the styles WIP merges |
| [820](../tickets/tickets/SKODA-820.md) | Bottom "Related Stories" dark band | 🟡 importer emits a `Style: dark` section with a curated Story Rail (and an index-rail fallback). Open: story-rail curated mode double-wraps cells; the band needs a full-width grid rule | 1 | STO-D06. Needs 218 (Lars's WIP). Its Media Box pointer is corrected to 801a | Must: the importer already emits the band on every story, so unfixed it renders broken | vijay | W1 rail fix, W2 band CSS |
| [819](../tickets/tickets/SKODA-819.md) | In-body carousel → Gallery `slider` variant (stakeholder decision 2026-09-24) | 🔴 importer emits a plain Gallery for link-free carousels; the slider variant is unbuilt | 3 | **Supersedes SKODA-219** (same widget; Gallery variant instead of a `carousel` variant). G-02 → 819 + 801a | Must | vijay | pin the table Mon (W1), build W1–W2 |
| [821](../tickets/tickets/SKODA-821.md) | Body-column text inset (34px per side) | 🔴 | 1 | New; CSS in the `body.story` section of `styles/styles.css` | Must (cheap; needed for the 704 visual sign-off) | vijay | W2, after the styles WIP merges |
| [823](../tickets/tickets/SKODA-823.md) | Sidebar newsletter UI stub | 🔴 | 2 | 904 is ruled out (§6), and the client doc puts the newsletter at go-live (COM16) | Could | unowned | – |

### 15.2 Dedupe and corrections

- **219 → 819.** Same widget, same 3 SP. 819 already carries the source measurements. 219 is marked superseded; its
  issue (#116) exists for parity only and is closed as not planned.
- **801a shrinks from 3 to 1.5 SP.**
  - Carousel → 819.
  - Embeds → 818, already done.
  - Sidebar and tags → 801 / 817, already done.
  - What remains: Media Box → `downloads` on 21/21 stories (after #111 merges), plus the 21-story batch run with a
    coverage report.
- **Media Box owner.** The 801 code comments (`story-flatten.js`, `skoda-story-cleanup.js`) and 820 still say
  "deferred to 604". This review's decision stands: **801a maps the Media Box on all 21 stories**. 604 keeps the
  full-fidelity extras on the 2 hero stories.
- **`blocks/gallery` now has two variants in flight:** 819 `slider` (Must) and 216 `.sb-gallery` (Could; Lars's
  `docs/skoda-216-story-gallery` branch). Serialize them: 819 first.
- **815** (ys-milestones): flatten-to-content shipped in 801. The timeline block stays M2. No M1 impact.

### 15.3 Collisions and sequencing (reflected in §10)

- **Story importer lane (vijay, serialized, one PR at a time):**
  - Files: `import-story-detail.js` + bundle, `parsers/story-flatten.js`, `parsers/story-hero.js`,
    `skoda-story-cleanup.js`, `skoda-story-aside.js`.
  - Order: 819 importer switch (emit `Gallery (slider)`) → 801a Media Box → any 816/820 follow-ups.
- **Block lane (vijay, parallel to the importer lane):** `blocks/gallery` (819), `blocks/story-rail` (820 curated
  fix), `blocks/hero-image` (816 caption).
- **Global CSS:**
  - PR #113 added about 108 lines of `body.story` CSS to `styles/styles.css`. Lars's uncommitted 213/217/218 WIP
    must rebase onto it.
  - 817 parity, 820 band grid and 821 inset then go into that `body.story` section, after the WIP merges (target
    Thu 1 Oct).
- **Shared cleanup:** #113 also changed `skoda-page-cleanup.js` (D4 href normalisation). 605/606/609 rebase onto it.
- **Story content in two passes:**
  - Pass 1, Wed 30 Sep (Lars): preview-only QA of the #113 output (hero, aside, embeds, related band).
  - Final pass, Mon 5 Oct: after 819 + 801a merge. This keeps the §10 target.

### 15.4 Cut line, timeline and staffing

- **Must delta:**

  | Change | SP |
  |---|--:|
  | 819 replaces 219 | 0 |
  | 801a | −1.5 |
  | 816 | +0.5 |
  | 817 | +1 |
  | 820 | +1 |
  | 821 | +1 |
  | 818, 822 | 0 |
  | **Net** | **+2** |

  So **Must ≈ 59.5 SP**. The face value of the eight tickets is 14 SP, but most of that arrived pre-built or
  replaces planned work.
- **Plan A (§14 not accepted):**
  - 59.5 SP, which is ≈ 25.3 human dev-days of 28 (the 8 agent-executed SP are excluded).
  - Slack ≈ 2.7 d; vijay's share is ≈ 1.4 d of it.
  - The §14.2 lever (defer 305, −2 SP) takes Must back to 57.5 SP if needed.
  - **No extension is required.**
- **Plan B (§14 accepted):**
  - 65.5 + 2 = **≈ 67.5 SP**. That is at par with the mid capacity of the 5-day extension (57 + ≈ 10 SP).
  - It leaves ≈ 3–4 human dev-days of slack if the 8 agent SP hold, and none if they don't.
  - First trim if the Thu 1 Oct checkpoint is behind: the C-4 sub-page → Should (−1).
- **Freeze and demo dates are unchanged:**
  - freeze Thu 8 Oct
  - rehearsal Mon 12 Oct
  - demo Thu 15 Oct
- **Per person, plan A (0.49 d/SP):**

  | Person | Must SP | Days | Share | Change vs §10 |
  |---|--:|--:|--:|---|
  | saran | 19 | 9.3 of 10 | 93% | none |
  | vijay | 17.5 | 8.6 of 10 | 86% | +2 SP: the whole story lane (819, 801a, 816, 817, 820, 821) plus 204/212/302/305/306/208 |
  | extra | 10 | 4.9 of 5 | 98% | none |
  | Lars | 13 | ≈ 2.5 of ≈ 3 | ≈ 85% + review | the 801 handover is gone; adds story pass 1 (Wed 30 Sep) |

- **Per person, plan B:**
  - vijay 17.5 SP: 305 out, 303 + 215 in, and smoke-only QA on 4 of the 5 models.
  - extra 17 SP over 10 days: adds 805c, the C-4 sub-page, C-5, C-1 and C-2.
  - saran 19.
  - Lars 14: adds the CS content, C-3.
- **Why vijay keeps the whole story lane:**
  - The importer files are one serialized surface, and he already owns `blocks/story-rail` and `carousel`.
  - Splitting the lane would add a handover per PR.
  - If vijay slips, the first thing to move is **208** (4 SP). It goes to the extended extra resource in plan B, or
    its hide-empty rails part moves to saran in plan A.
- **Board changes:** see §11 (issues for 819/816/817/820/821/823/818; no issue for 219 or 822).
