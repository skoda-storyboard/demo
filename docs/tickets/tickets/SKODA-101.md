# SKODA-101 — Provision DA/EW site + GitHub repo + AEM Code Sync
- **Epic:** E01 — Foundation & Setup
- **Type:** setup
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

## Summary
Provision the `da.live` (Experience Workspace) site, the GitHub code repo, and the AEM Code Sync bot so content and code deliver through `*.aem.page`/`*.aem.live`.

## Description
Establishes the target platform substrate for the whole migration: DA/EW as the content source, a buildless GitHub repo as the code source, and Code Sync stitching them into Edge Delivery. Grounded in `SKODA-EDS-DA-ARCHITECTURE.md` §2 (Target Platform Model) and §1 (five decisions) — the site is explicitly DA/EW, *not* AEM Author / Universal Editor / JCR. This is the precondition for authoring, previewing, and publishing any pilot content.

## Requirements / Spec
- Create/confirm the DA org+site in `da.live` (`{org}/{repo}` path space used by the DA source API `POST admin.da.live/source/{org}/{repo}/{path}.html`).
- Create the GitHub repo from the aem-boilerplate; install the **AEM Code Sync** GitHub app on it.
- Wire `fstab.yaml` / mountpoint so DA content resolves to the code repo.
- Verify delivery endpoints resolve:
  - Preview: `https://{branch}--{repo}--{owner}.aem.page/`
  - Production: `https://main--{repo}--{owner}.aem.live/`
- Confirm `da.live` visual + document editor, and MCP endpoint availability (`/docs/ew/authoring/mcp`) for later import orchestration.
- No secrets in repo; DA source-API credentials are harness-injected, never pasted.

## Acceptance Criteria
- [ ] `da.live` site opens and a test doc can be authored + previewed.
- [ ] GitHub repo exists with AEM Code Sync installed and green on a trivial commit.
- [ ] Preview (`*.aem.page`) and production (`*.aem.live`) URLs both serve a boilerplate page.
- [ ] `fstab`/mountpoint resolves DA content to the repo.
- [ ] No credentials committed; source-API auth confirmed working via harness.

## Dependencies
- Upstream: none
- Downstream: SKODA-102, SKODA-105

## Risks / Flags
- Assumption (arch §13): DA/EW licensed and available; the `da.live` org/site exists. If not licensed, entire pilot blocks — escalate.
- Doc-gap: the `POST admin.da.live/source/...` source-API contract is project-established (repo `AGENTS.md`), not aem.live-doc-cited — treat as project convention.
- Git operations are performed by the platform/Code Sync + Console UI, never by the agent.
