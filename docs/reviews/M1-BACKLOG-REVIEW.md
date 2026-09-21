# M1 Backlog Review, Škoda Storyboard `demo` GitHub Project

**Date:** 2026-09-21 · **Reviewer:** backlog-alignment pass · **Board:** [`skoda-storyboard/demo` project #1](https://github.com/orgs/skoda-storyboard/projects/1)
**Companion changeset:** [`proposed-gh-commands.sh`](./proposed-gh-commands.sh) (unexecuted, review before running)
**Sources of truth:** `docs/tickets/OVERVIEW.md`, `docs/planning/SKODA-M1-DEMO-TARGET.md`, `docs/planning/SKODA-AGENT-HANDOFF-CANDIDATES.md`, `docs/media/SKODA-MEDIA-CART-DOWNLOAD.md`, `docs/planning/SKODA-DEMO-FALLBACK-CONFIRM.md`.

## Why this review exists

The backlog was ported to GitHub from `docs/tickets/` in stages between 2026-09-05 and 09-15, while scope was still settling. A few tickets carry wording or milestones from an earlier, less complete understanding. With M1 (the demo) due **15 Oct 2026** and today being 2026-09-21, this pass checks the board against the one goal that matters, deliver a working demo, and answers four questions: is it aligned, what's missing, what needs restructuring, what's obsolete. It also lays out how to split the work between human developers and AI agents.

Nothing here has been applied to the live board. The changes are proposed in `proposed-gh-commands.sh` for you to run after review.

## What M1 actually is (the yardstick)

M1 is a **capability pilot**, not a one-page throwaway. It stands up the reusable EN machinery, the block set, the chrome fragments, a query-index-backed faceted listing (replacing ElasticPress "Load more"), an index-only search, the media pipeline, and the content-import pipeline, validated end to end on a **press-release article + its listing + a couple of representative pages**. On top of that it delivers the **mission-critical media cart (505)** and a reduced-fidelity story slice with 1 to 2 full-fidelity hero stories.

The source M1 ticket set (Pilot: Yes / Milestone M1) is **36 tickets** per `OVERVIEW.md` §3:

- **E01:** 101, 102, 103, 104, 105, 106
- **E02:** 201, 202, 203, 204, 205, 206, 207  (208/209/210 are M2)
- **E03:** 301, 302, 303, 304, 305
- **E04:** 401, 402, 403
- **E05:** 501, 502, 503, **504**, 505, 506
- **E06:** 601, 602, 603, 604
- **E07:** 701, 702, 703, 704  (706 is M2)
- **E08 (M1 ticket in a B-phase epic):** 607

Pilot critical path: `101 → 102 → 106 → 201 → 402` and `… 601 → 602 → 603 → 703 → 704`, converging at **603** (the integration fan-in). The schedule drivers inside the pilot are **402** (faceted listing, 8 SP) and **603**.

## Alignment verdict

The board is in good shape. Every M1 ticket is present except one, and the three extra tickets that aren't in `OVERVIEW.md` are legitimate QA-finding fixes added after the doc set. This is a tightening pass, not a rebuild.

| Epic | Board issues | Verdict |
|---|---|---|
| E01 | 101 (Done), 102, 103, 104, 105, 106 | Complete |
| E02 | 201–207 | Complete (208/209/210 correctly absent = M2) |
| E03 | 301–305 | Complete |
| E04 | 401, 402, 403 | Complete |
| E05 | 501, 502, 503, 505, 506 | **504 missing** |
| E06 | 601, 602, 603, 604, **605, 606** | Complete + 2 new QA-fix tickets (F1/F2) |
| E07 | 701, 702, 703, 704, **705** | Complete + 1 new QA-fix ticket (F3, held for design) |
| E08 | 607, **801** | 607 correct (M1); 801 milestone needs restructuring |

**Board hygiene:** 46 open / 1 closed (101 is Done). Every open ticket is unassigned. All concrete tickets sit on the `M1: 15 Oct demo` milestone (including 801 and 705). Column counts: 40 Backlog, 5 Ready, 1 In-progress, 1 Done. Existing labels are `epic:E01`–`E08` and `type:*` only, no agent/human routing labels, no owners. Both milestones exist (`M1: 15 Oct demo` #1, `M2: go-live 02 Jan` #2).

**Issue-number map (for reference):** epics = #1 (E01), #3 (E02), #4 (E03), #5 (E04), #6 (E05), #7 (E06), #8 (E07), #9 (E08). Tickets: 101=#2, 102=#10, 103=#11, 104=#12, 105=#13, 106=#14, 201=#15, 202=#16, 203=#17, 204=#18, 205=#19, 206=#20, 207=#21, 301=#22, 302=#23, 303=#24, 304=#25, 305=#26, 401=#27, 402=#28, 403=#29, 501=#30, 502=#31, 503=#32, 505=#33, 506=#34, 601=#35, 602=#36, 603=#37, 604=#38, 605=#39, 606=#40, 701=#41, 702=#42, 703=#43, 704=#44, 705=#46, 607=#47, 801=#48.

## Findings

### A. Missing

1. **SKODA-504 (map S3 images → AEM DAM, manifest), an M1 ticket that never made it to the board.** AEM DAM is the confirmed asset store (decision D5 resolved), so 504 is firmly in scope, not a demo-only fallback. It sits on the media-cart critical path (505 depends on 501 + 504) and the CORS-enabled AEM DAM delivery it produces is the linchpin for the cart download. **Action: create it under epic E05.**

2. **No RSS-generation ticket.** RSS is un-ticketed deferred work, and per `SKODA-AGENT-HANDOFF-CANDIDATES.md` it's candidate A1, the single best first agent-eval pick (deterministic W3C-feed-validator oracle, zero visual judgment). Not strictly required for the demo, but it's the cleanest way to prove the autonomous-agent loop. **Action: create as an `agent-eval` ticket.**

3. **No owners on any open ticket.** Nothing can be split between developers and agents until routing labels and assignees exist. **Action: add the routing labels (below) and fill assignees.**

4. **No demo assembly / dry-run ticket.** The whole milestone is a live demo on 15 Oct. 604's body references "→ demo script" but nothing owns stitching the pilot pages into a narrative and rehearsing it. **Action: create a small M1 "demo dry-run + script" ticket in E07.**

5. **No DA tag-management authoring plugin ticket.** The capability is build-confirmed (decision D13) with two shipped PoCs (`skoda-storyboard/poc/tag-multiselect/`, `poc/stories-tag/`) and written up in `docs/architecture/SKODA-DA-EW-EXTENSIBILITY.md`, but nothing in the backlog productionizes it. SKODA-205 is tag *rendering* only. It lets authors pick taxonomy tags in DA/EW without App Builder/UE, and the user confirmed it's part of the M1 demo. **Action: create SKODA-211 (E02, `hybrid`, M1).**

6. **The #45 gap.** Issue numbers run 1–48 with #45 absent. Confirmed: #45 resolves to neither a live issue nor a PR, so it's an empty/deleted number. Every M1 SKODA id is accounted for by the other numbers, so nothing known was dropped. Low concern; worth a one-line check with whoever ran the port in case a ticket was deleted by accident.

### B. Restructure

1. **SKODA-801 milestone (issue #48).** The board tags it M1, but the source scopes it as Phase B: only a reduced-fidelity M1 slice (~2 to 3 SP) is a demo deliverable, and the full SiteOrigin Page-Builder parser plus its long tail is M2. The M1 story deliverable is already largely covered by **604** (full-fidelity restore on 1 to 2 hero stories). **Action: move 801 to the M2 milestone, and add a note to 604 (and 801) that the M1 story slice lives in 604.** This keeps the hardest parser in the program out of the M1 milestone.

2. **Epic board statuses out of sync.** All 8 epics sit in Backlog while their child tickets are Ready/active (only epic #1 is In-progress). **Action: either reflect real status on the epics or stop tracking status on epics and track only on children.**

3. **Stale retired-config wording.** SKODA-104 (#12) is titled "helix-query.yaml skeleton" and SKODA-205 (#19) references `helix-query.yaml`, but that file is retired: config now lives as a `query.yaml` PUT to the admin config service (`AGENTS.md`, "Outdated"). **Action: retitle 104 and refresh the wording in 104/205/401.**

4. **SP reconciliation and doc/board drift.** The E02 epic body cites 35 SP via 208/209/210, which are correctly not created (M2); annotate that the E02 M1 subset is 24 SP (201–207). Board-only tickets 605/606/705 aren't in `OVERVIEW.md`'s register. **Action: back-port 605/606/705 into the register or note them as post-doc board additions so docs and board stop drifting.**

5. **SKODA-505 media-cart download contract is stale (user decision, 2026-09-21).** The demo cart must let press users download the **originals from AEM DAM**, not the web-optimized media-bus renditions EDS generates for on-page display. When multiple assets are selected, **zip them client-side** (`fflate`); a single asset downloads directly. Device-ID / no-login / `localStorage` state stands. This supersedes two docs (see §E). 505's current body still frames the download around `data-size="giant|original"` off the legacy S3 CDN and hedges zip-vs-serverless. **Action: split and retarget 505 (below).**

### C. Obsolete / re-scoped (created with earlier, incomplete understanding)

1. **SKODA-206 Škodapedia glossary (issue #20).** Adversarial finding F6: the client (§9) says Škodapedia continues *outside* Storyboard. The ticket itself flags it as a drop-candidate. With ~3.5 weeks to the demo, **move it to M2** and free the 5 SP. The bulk term pre-bake was already M2 (802).

2. **Retired-config references** (same as B3): not obsolete tickets, just obsolete wording to correct.

3. **Historically re-scoped M2 tickets** (902 → prod hardening, 802 → split into 805–808, 801 → re-pointed) are already reflected in the docs and mostly aren't on the board. No M1 board action.

### D. Splitting work between developers and AI agents

**The primary driver (user, 2026-09-21): a slice is a good agent handoff when it's a coherent, self-contained, closed task.** Clear boundaries, its own well-defined input and output, minimal cross-dependencies, so an agent can own it end to end. The `SKODA-AGENT-HANDOFF-CANDIDATES.md` filters are the supporting tests a coherent task also has to pass: it must be Decided (not blocked on an open decision), have a deterministic oracle (**no LLM visual-fidelity judgment**, that stays with a human), and have low blast radius (no live credentials, publish, or reindex inside the agent's own loop). The corollary that follows: **split a mixed block into a self-contained logic/data layer (agent) and a presentation layer (human).**

**Labels to create:** `agent-fit`, `human-gate`, `hybrid`, `agent-eval` (a subset of agent-fit, the ranked first eval picks), and `critical-path` (a schedule signal, orthogonal to the routing labels).

**SKODA-505 is split into two tickets** so the coherent closed task lands cleanly on an agent:

- **505a, media-cart download logic (`agent-fit`, new ticket):** device-ID collect/persist (`localStorage`), add/remove/dedupe/clear, item and total-size caps, single-asset direct download, and multi-select client-side `fflate` zip of AEM DAM originals. Oracle: unit tests over the cart operations plus zip-manifest reconciliation (handoff candidate U1). No visual judgment, no live credentials in the loop. This is the whole download process, a self-contained unit.
- **505b, media-cart presentation + live delivery (`human-gate`, new ticket):** the cart's pixel design per `ui-specs/media-cart.md` (add button, `.in-cart` scrim, red count badge, review page) and the live CORS / AEM DAM delivery-URL wiring. Depends on 505a + 501/504.

**Routing table (M1 tickets):**

| Label | Tickets | Why |
|---|---|---|
| `agent-fit` | **505a** (cart download logic), 506 (media pre-conditioning), 103 (redirects sheet), 104 (`query.yaml` authoring), 504 (S3→AEM-DAM mapping manifest), new RSS, sitemap/JSON-LD slice (under 205) | Coherent closed task, deterministic oracle, no visuals/creds in-loop |
| `agent-eval` | new RSS (first), 401 metadata-normalization slice, 505a cart download logic, then 802 Škodapedia pre-bake (M2) | Ranked eval picks, run in this order |
| `hybrid` | 201, 203, 402, 401, 601, **211** (DA tag plugin) | Self-contained logic half hands off; visual or creds half stays human. State the split in the body. |
| `human-gate` | **505b** (cart presentation + live delivery), 101, 105, 106, 202, 205 (render), 301, 302, 303, 304, 305, 602 (DA push creds), 603 (publish/validate), 604, 607, 701, 702, 703, 704 | Visual fidelity, provisioning, or live credentials/publish |

Which specific human or agent owns each ticket is yours to set. The changeset applies the labels and leaves `--add-assignee` lines commented for you to fill.

### E. Doc reconciliation (small, flagged not silent)

1. **`docs/planning/SKODA-DEMO-FALLBACK-CONFIRM.md`** records the opposite media-cart decision (2026-09-17: "keep cart UI-side, download individual per-asset, no zip"). The 2026-09-21 decision supersedes it: originals from AEM DAM plus client-side zip on multi-select. That row is being updated.
2. **`docs/media/SKODA-MEDIA-CART-DOWNLOAD.md`**'s headline ("purpose = size REDUCTION") no longer holds. The goal is full-quality originals, not smaller files. A correction banner is being added; the A–F options analysis stays intact for the production question.

## Prioritized actions (ordered for the 15 Oct deadline)

1. **Create 504** (unblocks the media-cart critical path) and **split 505 into 505a/505b** with the corrected originals-from-DAM + zip-on-multi contract.
2. **Create the routing labels and apply them**; add `critical-path` to 102, 106, 201, 402, 601, 602, 603.
3. **Milestone reconciliation:** move 206 and 801 to M2; note the M1 story slice on 604.
4. **Create the RSS `agent-eval` ticket** and hand it to the agent loop first (smallest, purest oracle).
5. **Create the demo dry-run + script ticket** in E07.
6. **Fix stale wording** (104 title, 104/205/401 `helix-query.yaml`), sync epic statuses, back-port 605/606/705 into `OVERVIEW.md`.
7. **Assign owners** (fill the commented assignee lines) so the dev/agent split is real, not just labeled.
8. **Reconcile the two media-cart docs** (§E).

## Verification

- Diff the live board against the 36-ticket M1 yardstick after applying the changeset (504 present, 206/801 on M2, labels applied).
- `bash -n proposed-gh-commands.sh` before running (syntax check only).
- Every label referenced in the script is created by it; every edited issue number exists (cross-referenced to the map above).
- The script is run only after you review it; board mutation is a separate, deliberate step.
