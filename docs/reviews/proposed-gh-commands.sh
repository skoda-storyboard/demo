#!/usr/bin/env bash
#
# proposed-gh-commands.sh — M1 backlog changeset for skoda-storyboard/demo
# =========================================================================
# Companion to M1-BACKLOG-REVIEW.md. THIS SCRIPT IS NOT MEANT TO BE RUN BLINDLY.
# Read the review, read this script, then run it deliberately:
#
#     I_HAVE_REVIEWED=yes bash proposed-gh-commands.sh
#
# It creates labels + tickets, moves two tickets to M2, retargets the media
# cart, and refreshes stale wording. Assignee lines are left commented for you
# to fill (owners are a human decision). All numbers were verified against the
# live board on 2026-09-21.
#
set -euo pipefail

REPO="skoda-storyboard/demo"
M1="M1: 15 Oct demo"
M2="M2: go-live 02 Jan"

if [[ "${I_HAVE_REVIEWED:-}" != "yes" ]]; then
  echo "Refusing to mutate the shared board until reviewed."
  echo "Re-run with:  I_HAVE_REVIEWED=yes bash $0"
  exit 1
fi

# -------------------------------------------------------------------------
# 0. Read-only sanity checks (do not mutate). Confirm the assumptions hold.
# -------------------------------------------------------------------------
echo "== read-only checks =="
gh issue view 45 --repo "$REPO" --json number 2>/dev/null \
  && echo "WARNING: #45 now resolves — investigate before proceeding" \
  || echo "OK: #45 is empty (no live issue), nothing dropped"
if gh issue list --repo "$REPO" --state all --search "504 in:title" --json number --jq 'length' | grep -q '^0$'; then
  echo "OK: no SKODA-504 issue exists yet"
else
  echo "WARNING: a 504 issue already exists — skip the create below"
fi

# -------------------------------------------------------------------------
# 1. Routing / priority labels
# -------------------------------------------------------------------------
echo "== labels =="
gh label create agent-fit     --repo "$REPO" --color 0e8a16 --description "Coherent closed task; deterministic oracle; no visuals/creds in the agent loop" --force
gh label create human-gate    --repo "$REPO" --color b60205 --description "Visual fidelity, provisioning, or live credentials/publish; stays with a human" --force
gh label create hybrid        --repo "$REPO" --color fbca04 --description "Agent-owned logic half + human-gated visual/creds half; split stated in body" --force
gh label create agent-eval    --repo "$REPO" --color 1d76db --description "Ranked first picks for the autonomous-agent eval loop" --force
gh label create critical-path --repo "$REPO" --color d93f0b --description "On the M1 pilot critical path; schedule driver" --force

# -------------------------------------------------------------------------
# 2. Create missing / split tickets. Capture new numbers for cross-linking.
# -------------------------------------------------------------------------
echo "== create tickets =="

URL_504=$(gh issue create --repo "$REPO" \
  --title "SKODA-504 — Map S3 images → AEM DAM (mapping manifest)" \
  --milestone "$M1" \
  --label "epic:E05,type:import,agent-fit" \
  --body "$(cat <<'EOF'
- **Epic:** E05, Media Pipeline
- **Type:** import · **Phase:** A · **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP (demo subset; scale-out is M2)

## Summary
Build the deterministic S3 → AEM DAM mapping manifest for the pilot asset set. AEM DAM is the confirmed asset store (decision D5). This manifest is the upstream contract the media cart (SKODA-505a) and pilot import (SKODA-603) consume, and it unlocks the CORS-enabled DAM delivery URLs the client-side cart zip needs.

## Requirements / Spec
- Input: the S3 image URLs referenced by the pilot page set (from SKODA-501 masters ingest).
- Output: a manifest mapping each source URL → AEM DAM delivery path + rendition scheme, with dedup.
- Scenario A (asset already in DAM → match) vs B (needs ingest); record an unmatched fallback.
- Path-scheme + rendition-URL construction is a pure transform once the DAM instance + scheme are frozen.

## Acceptance Criteria
- [ ] Manifest reconciles 1:1 against the pilot asset set (no unmapped references).
- [ ] Dedup count is correct; duplicate source URLs collapse to one DAM entry.
- [ ] DAM delivery paths validate against the frozen path scheme.
- [ ] Unmatched assets are listed with the documented fallback.

## Dependencies
- Upstream: SKODA-501 (masters ingest), SKODA-601 (import infra).
- Downstream: SKODA-505a/505b (cart, needs CORS-enabled DAM delivery URLs), SKODA-603 (pilot pages).

## Agent handoff
`agent-fit`: mapping is a deterministic transform; oracle = manifest reconciliation + path-scheme validation + dedup count. The actual DAM upload/ingest execution stays behind a human/credentialed gate.

## Risks / Flags
- 🟠 The DAM instance + API/path scheme must be frozen before the transform is final (D5 follow-up).
EOF
)" | grep -oE '[0-9]+$')
echo "created 504 as #$URL_504"

URL_505A=$(gh issue create --repo "$REPO" \
  --title "SKODA-505a — Media-cart download logic (device-ID state + originals + multi-select zip)" \
  --milestone "$M1" \
  --label "epic:E05,type:block,agent-fit,agent-eval" \
  --body "$(cat <<'EOF'
- **Epic:** E05, Media Pipeline
- **Type:** block (logic layer) · **Phase:** A · **Pilot:** Yes (mission-critical demo) · **Milestone:** M1
- **Estimate:** ~5 SP (logic half of the former SKODA-505)
- **Split from:** SKODA-505 (paired with SKODA-505b presentation). Supersedes the download-contract wording in the old 505.

## Summary
The coherent, self-contained media-cart **download process**: device-ID collect/persist, cart operations, and the download itself. Press users download the **originals from AEM DAM** (NOT the web-optimized media-bus renditions EDS generates for on-page display). A single selected asset downloads directly; **multiple selected assets are zipped client-side with `fflate`** and downloaded as one bundle.

## Requirements / Spec
- **Device-ID cart (no login):** UUID minted on first add, stored in `localStorage`; cart contents (asset id, title, DAM delivery URL) persisted client-side; add/remove/dedupe/list/clear; count + review state.
- **Download originals:** cart items reference **CORS-enabled AEM DAM original-delivery URLs** (dep SKODA-501/504), not the on-page optimized renditions.
- **Single vs multi:** one asset → direct `<a download>` of the original; multiple → fetch each original as a Blob, `fflate` zip (store, no deflate for already-compressed JPEG/PNG/MP4), trigger one Blob download.
- **Item/size caps:** re-implement `skoda-media-cart-limit` as a client check (item count AND total-bytes cap); also protects the browser-memory ceiling.
- **Analytics hooks:** emit MediaCart (add/remove/view) + download/bulk-download dataLayer events (coordinate SKODA-804/905 stubs).

## Acceptance Criteria
- [ ] Anonymous visitor adds/removes assets across pages with no login; cart persists on the device and exposes a count + review model.
- [ ] Single-asset download returns the **DAM original**; multi-select returns **one client-side zip** of the originals with a sensible filename.
- [ ] Item + total-size caps enforced.
- [ ] Cart ops (add/remove/dedupe/persist/clear) and zip-manifest are covered by unit tests.
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-501 + SKODA-504 (CORS-enabled AEM DAM delivery, the linchpin), SKODA-502 (mediabox data), SKODA-601 (import wires per-asset hooks).
- Paired: SKODA-505b (presentation + live delivery wiring).
- Downstream: SKODA-603; SKODA-902 (production hardening).

## Agent handoff
`agent-fit` + first-wave `agent-eval`: the download process is a closed unit with a deterministic oracle (unit tests over cart ops + zip-manifest reconciliation), no visual judgment, no live credentials in the loop. The live CORS/DAM delivery hookup is in 505b (human).
EOF
)" | grep -oE '[0-9]+$')
echo "created 505a as #$URL_505A"

URL_505B=$(gh issue create --repo "$REPO" \
  --title "SKODA-505b — Media-cart presentation + live AEM DAM delivery wiring" \
  --milestone "$M1" \
  --label "epic:E05,type:block,human-gate" \
  --body "$(cat <<'EOF'
- **Epic:** E05, Media Pipeline
- **Type:** block (presentation layer) · **Phase:** A · **Pilot:** Yes · **Milestone:** M1
- **Estimate:** ~3 SP (presentation half of the former SKODA-505)
- **Split from:** SKODA-505 (paired with SKODA-505a, the download logic).

## Summary
The visual and live-delivery half of the media cart: pixel design per `docs/ui-specs/media-cart.md` and the live CORS / AEM DAM delivery-URL wiring that feeds SKODA-505a.

## Requirements / Spec (from ui-specs/media-cart.md)
- Add affordance = round 40x40 `+` button; added state = `.in-cart` scrim + centered glyph.
- Header cart badge = red #ff6666 24px circle showing count, hidden at 0.
- Cart surface = "Your downloads" review page (confirm page vs drawer for EDS).
- New tokens: `--cart-badge-bg:#ff6666`, `--cart-added-scrim`, `--cart-dropdown-shadow`.
- Add a visible item/size-cap indicator (source has none).
- Wire cart items to CORS-enabled AEM DAM delivery URLs (dep 501/504).

## Acceptance Criteria
- [ ] Matches the measured spec at the captured breakpoints (visual review, human gate).
- [ ] Live cart fetches DAM originals via CORS; single + multi-select downloads work end to end.
- [ ] Controls keyboard-operable and screen-reader labelled; block not in the eager phase.

## Dependencies
- Upstream: SKODA-505a (download logic), SKODA-501 + SKODA-504 (CORS-enabled DAM delivery).
- Downstream: SKODA-603.

## Human gate
Visual fidelity + live CORS/DAM delivery are not agent-handoffable (pixel judgment + live endpoint).
EOF
)" | grep -oE '[0-9]+$')
echo "created 505b as #$URL_505B"

URL_RSS=$(gh issue create --repo "$REPO" \
  --title "SKODA-405 — RSS feed generation (query-index → RSS 2.0)" \
  --milestone "$M1" \
  --label "epic:E04,type:integration,agent-fit,agent-eval" \
  --body "$(cat <<'EOF'
- **Epic:** E04, Listings & Search
- **Type:** integration · **Phase:** A · **Pilot:** stretch · **Milestone:** M1
- **Estimate:** ~2 SP

## Summary
Generate an RSS 2.0 feed from the per-locale query-index (footer link continuity, requirements §9). This is the top autonomous-agent eval pick: a machine-readable output with a public-standard oracle and zero visual judgment.

## Acceptance Criteria
- [ ] Feed passes the W3C Feed Validator / RSS 2.0 schema.
- [ ] Item count == filtered query-index rows; per-item fields diff clean vs the index.
- [ ] `pubDate` is RFC-822; links resolve (no 404/loop).

## Dependencies
- Upstream: SKODA-401 (query-index). Generation has no other deps.
- Delivery (`/en/feed/` content-type / edge function) is a separate human/infra step.

## Agent handoff
`agent-fit` + first `agent-eval` pick (handoff candidate A1): success == a green validator run.
EOF
)" | grep -oE '[0-9]+$')
echo "created RSS as #$URL_RSS"

URL_DEMO=$(gh issue create --repo "$REPO" \
  --title "SKODA-707 — Demo assembly + dry-run + script (15 Oct)" \
  --milestone "$M1" \
  --label "epic:E07,type:qa,human-gate,critical-path" \
  --body "$(cat <<'EOF'
- **Epic:** E07, QA / Launch
- **Type:** qa · **Phase:** A · **Pilot:** Yes · **Milestone:** M1
- **Estimate:** ~2 SP

## Summary
Own the demo itself: assemble the validated pilot pages into a narrative, write the demo script, and rehearse it end to end so the 15 Oct demo runs cleanly. Nothing currently owns this (604 only references "→ demo script").

## Acceptance Criteria
- [ ] A written demo script walks the rail/load-more narrative + media cart + a full-fidelity hero story.
- [ ] Dry-run completed against preview/live; fallbacks (per-story pre-zipped bundle, CS-structural) exercised.
- [ ] Known gaps and their fallbacks documented for demo day.

## Dependencies
- Upstream: SKODA-603 (pilot pages), SKODA-604 (hero stories), SKODA-505a/505b (cart), SKODA-704 (sign-off).
EOF
)" | grep -oE '[0-9]+$')
echo "created demo dry-run as #$URL_DEMO"

URL_TAGPLUGIN=$(gh issue create --repo "$REPO" \
  --title "SKODA-211 — DA tag-management library plugin (DA_SDK multi-select, productionize PoC)" \
  --milestone "$M1" \
  --label "epic:E02,type:integration,hybrid" \
  --body "$(cat <<'EOF'
- **Epic:** E02, Core Blocks (authoring)
- **Type:** integration · **Phase:** A · **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** ~3 SP
- **Relates to:** decision D13 (DA vs Universal Editor), build-confirmed in this tenant 2026-09-16.

## Summary
Give authors a real tag-management control inside DA / Experience Workspace so they can pick taxonomy tags without App Builder or Universal Editor. Productionize the build-confirmed PoC (`skoda-storyboard/poc/tag-multiselect/`) into a demo DA library plugin: a hosted HTML/JS page that talks to the editor over the `DA_SDK` postMessage bridge and writes a Tags block via `sendHTML`. This is rung 4 of the extensibility ladder in `docs/architecture/SKODA-DA-EW-EXTENSIBILITY.md`, the answer to the recurring client question "can the WYSIWYG editor manage tags".

## Requirements / Spec
- Host the plugin under the demo repo (e.g. `poc/tag-multiselect/`), served at the preview URL (localhost will not load inside the https canvas).
- Register a `library` config sheet row: `title | path | experience=dialog` (mind the exact `path` header, a missing one throws and blanks the whole Library).
- Vocabulary: the 15-facet taxonomy + 4 story categories, hardcoded initially, with the option to `fetch()` a governed DA Sheet later (no redeploy to change the list).
- Multi-select with select-all / clear / search; render-first, connect-in-background pattern so the panel never hangs.
- On confirm, `actions.sendHTML(<Tags block table>)` aligned to the SKODA-205 Tags-block markup and the SKODA-401 facet taxonomy; then `closeLibrary()`.
- Must surface in BOTH the classic DA editor Library palette and the Experience Workspace canvas panel.

## Acceptance Criteria
- [ ] An author opens the plugin, multi-selects tags, and it inserts a Tags block that SKODA-205 renders and SKODA-401 facets recognise.
- [ ] Emitted Tags-block HTML matches the expected markup for a given selection (unit/smoke test).
- [ ] Works in the DA editor Library AND the EW canvas panel.
- [ ] Vocabulary can be swapped to a DA Sheet without code change (documented, even if hardcoded for the demo).
- [ ] `npm run lint` clean.

## Dependencies
- Upstream: SKODA-102 (repo + preview hosting), SKODA-205 (Tags block output contract), SKODA-401 (facet taxonomy).
- Reference: `skoda-storyboard/poc/tag-multiselect/`, `docs/architecture/SKODA-DA-EW-EXTENSIBILITY.md` §3/§8.

## Agent handoff
`hybrid`: the vocabulary handling + `DA_SDK` `sendHTML` write logic is a self-contained agent slice (oracle: emitted Tags-block HTML matches expected for a given selection; openable standalone for a smoke test). The picker UI/UX and the in-editor verification are the human visual gate.
EOF
)" | grep -oE '[0-9]+$')
echo "created DA tag plugin as #$URL_TAGPLUGIN"

# -------------------------------------------------------------------------
# 3. Repoint the original SKODA-505 (#33) into the split, then close it
# -------------------------------------------------------------------------
echo "== repoint old 505 (#33) =="
gh issue comment 33 --repo "$REPO" --body "Split into #$URL_505A (download logic, agent-fit) and #$URL_505B (presentation + live delivery, human-gate). Download contract corrected 2026-09-21: originals from AEM DAM (not web-optimized media-bus renditions); single = direct download, multi-select = client-side fflate zip. Closing in favour of the split tickets."
gh issue close 33 --repo "$REPO" --reason "not planned"

# -------------------------------------------------------------------------
# 4. Milestone reconciliation
# -------------------------------------------------------------------------
echo "== milestones =="
gh issue edit 20 --repo "$REPO" --milestone "$M2"   # SKODA-206 Škodapedia → M2 (adversarial F6 drop-candidate)
gh issue edit 48 --repo "$REPO" --milestone "$M2"   # SKODA-801 full SiteOrigin parser → M2
gh issue comment 48 --repo "$REPO" --body "Moved to M2: the full SiteOrigin Page-Builder parser + long tail is Phase B. The M1 story deliverable is the reduced-fidelity slice covered by SKODA-604 (#38)."
gh issue comment 38 --repo "$REPO" --body "This ticket carries the M1 story deliverable (full-fidelity restore on 1–2 hero stories + reduced-fidelity slice). The full parser is SKODA-801 (#48), now M2."

# -------------------------------------------------------------------------
# 5. Refresh stale retired-config wording (helix-query.yaml is retired)
# -------------------------------------------------------------------------
echo "== stale wording =="
gh issue edit 12 --repo "$REPO" \
  --title "SKODA-104 — query.yaml skeleton (per-locale index defs, admin config service)"
gh issue comment 12 --repo "$REPO" --body "Wording note: 'helix-query.yaml' is retired. Index config is a query.yaml PUT to the admin config service (tools.aem.live), not a repo file. See AGENTS.md 'Outdated'."
gh issue comment 19 --repo "$REPO" --body "Wording note: any 'helix-query.yaml' reference here is stale; index config is now the admin-service query.yaml. See AGENTS.md 'Outdated'."
gh issue comment 27 --repo "$REPO" --body "Wording note: query-index config is a query.yaml PUT to the admin config service, not repo helix-query.yaml (retired)."

# -------------------------------------------------------------------------
# 6. Apply routing / priority labels to existing M1 tickets
# -------------------------------------------------------------------------
echo "== routing labels =="
# agent-fit (existing tickets)
gh issue edit 34 --repo "$REPO" --add-label "agent-fit"     # 506 media pre-conditioning
gh issue edit 11 --repo "$REPO" --add-label "agent-fit"     # 103 redirects sheet
gh issue edit 12 --repo "$REPO" --add-label "agent-fit"     # 104 query.yaml authoring
# hybrid (logic half hands off, visual/creds half human)
for n in 15 17 27 28 35; do gh issue edit "$n" --repo "$REPO" --add-label "hybrid"; done  # 201 203 401 402 601
gh issue comment 27 --repo "$REPO" --body "Agent slice: the metadata-normalization layer (category-from-URL, 4-way date fallback, per-facet extraction) is a fixture-testable agent handoff (handoff candidate B1, second eval pick). Selectors/config + facet UX stay human."
# human-gate (visual / provisioning / live creds / publish)
for n in 2 13 14 16 19 22 23 24 25 26 36 37 38 47 41 42 43 44; do gh issue edit "$n" --repo "$REPO" --add-label "human-gate"; done
# critical-path (schedule drivers)
for n in 10 14 15 28 35 36 37; do gh issue edit "$n" --repo "$REPO" --add-label "critical-path"; done  # 102 106 201 402 601 602 603

# -------------------------------------------------------------------------
# 7. Owners — fill in and uncomment (which human / which agent per ticket)
# -------------------------------------------------------------------------
# gh issue edit <N> --repo "$REPO" --add-assignee <github-handle>
# e.g. hand the first agent-eval pick to whoever drives the agent loop:
# gh issue edit "$URL_RSS"   --repo "$REPO" --add-assignee <owner>
# gh issue edit "$URL_505A"  --repo "$REPO" --add-assignee <owner>

echo "== done =="
echo "Created: 504=#$URL_504 505a=#$URL_505A 505b=#$URL_505B rss=#$URL_RSS demo=#$URL_DEMO tag-plugin=#$URL_TAGPLUGIN"
echo "Next: fill assignees (step 7), sync epic statuses in the Project board UI, back-port 605/606/705 into docs/tickets/OVERVIEW.md."
