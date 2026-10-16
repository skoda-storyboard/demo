# SKODA-521, App Builder platform set-up: entitlement, project, credentials and connection checks

- **Epic:** E05, Media Pipeline
- **Type:** setup / integration (no product code)
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). **Blocks SKODA-511**; the long pole is the client's entitlement.
- **Estimate:** 2 SP team time · AI-assisted 1d / manual 2d, excluding client lead time *(planning estimate, not a quote)*
- **GitHub issue:** [#381](https://github.com/skoda-storyboard/demo/issues/381) (created 2026-10-16)
- **Status (2026-10-16):** 🔵 TODO (M2), no owner. Review done:
  [`SKODA-APP-BUILDER-INTEGRATION.md`](../../architecture/SKODA-APP-BUILDER-INTEGRATION.md).

## Why
SKODA-511 (the AEM Assets → media feed sync) runs on App Builder (decision 2026-10-16). Before any of it can be
built, four connections need four credentials, and some of them depend on the client's Adobe org:

| Connection | Credential |
|---|---|
| AEM Assets events → Runtime action | Workspace OAuth server-to-server (S2S) credential |
| Job → AEM author (QueryBuilder, metadata) | AEM **service credentials** (JWT technical account); classic endpoints don't take S2S |
| Job → admin.hlx.page (preview, publish) | Site admin API key, `publish` role |
| Job → DA (write the feed sheets) | Machine identity **undocumented**: to test (V1) |

The same project can later host SKODA-902 (server-side cart zip) and the SKODA-906 access gate, if those land on App
Builder.

## Scope
**Client (blocking; detail in the review §1):**
- **C1** App Builder entitlement on the IMS org that owns program `p220607` (sold in packs with AEM; no trial).
- **C2** Developer role and an App Builder product profile for the team's developers.
- **C4** I/O Events → AEM Assets (`e2281243`) subscribed by an **admin on an AEM product profile** of that
  environment: `aem.assets.asset.published`, `.unpublished`, `.deleted`, `.metadata_updated`.
- **C5/C6** AEM service credentials for author `e2281243`; a product profile for the technical account; read on
  `/content/dam/storyboard` for the AEM group it becomes.
- **C7** Answers: IP allow-list on author planned? DAM team on Touch UI or Assets View?

**Team (review §2):**
- **C3** Developer Console project from the App Builder template, Stage and Production workspaces.
- **T1** Site admin API key (`publish`), stored as a workspace secret; rotation noted (≤365 days).
- **T2** DA write for the machine identity on `/en/media-feed/**` (after V1), or a fallback from the review §6.
- **T3** Repository `skoda-storyboard/asset-sync`, a headless app skeleton (`aio app init`, `aio app add ci`) with the
  `app.config.yaml` shape from the review §3. Deploys to Stage from CI.
- **T4** Secrets per workspace (`.env` → action inputs; GitHub environment secrets for CI).
- **T5** Stage writes to a preview-only `/drafts/` path; only Production publishes.
- **T6** Registry `cache-control` via `headers.json`, if V2 passes.

**Verifications (review §5):**
- **V1** DA accepts an S2S token.
- **V2** A custom `cache-control` header on a JSON path.
- **V3** `published` fires for Touch UI Quick Publish, Manage Publication and workflow publishing.
- **V4** QueryBuilder with the service credential returns `skoda:*`, `cq:tags`, `cq:lastReplicated`.
- **V5** The Assets OpenAPI metadata call returns custom properties.
- **V6** An alarm-started action runs non-blocking past 60 s.

## Out of scope
The sync logic itself (SKODA-511), the feed shapes (SKODA-517) and the ledger (SKODA-518).

## Acceptance Criteria
- [ ] C1–C7 done or answered, each with its date and owner.
- [ ] Stage and Production workspaces exist, with the AEM Assets event registration on each; one test publish in
      `e2281243` reaches the Stage listener (Debug Tracing).
- [ ] From a Stage action: a QueryBuilder call on author with the service credential, a preview call with the API
      key, and a DA write under `/drafts/` all succeed. No credential is in any repository.
- [ ] V1–V6 recorded in the review with dated results. The DA path (T2 or the chosen fallback) is decided.
- [ ] CI deploys the skeleton to Stage; deploying to Production requires a manual approval.

## Dependencies
Client Adobe org admins (System Admin, AEM admin, Cloud Manager). Blocks SKODA-511. Informs SKODA-902 and SKODA-906.
