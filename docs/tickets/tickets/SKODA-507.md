# SKODA-507, Native AEM Assets picker in DA / Experience Workspace (Media Bus delivery)
- **Epic:** E05, Media Pipeline
- **Type:** integration · **Phase:** A · **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** ~2 SP (config + verification; no code)
- **Relates to:** decision D5 (AEM Assets is the approved-asset source), D13 (DA vs Universal Editor), E05 media pipeline. Sibling of SKODA-211 (DA library plugin) but this is the DA-native picker, not a custom plugin.
- **Flag:** 🔴 BLOCKED

## Summary
Give authors a native "insert asset from AEM Assets" experience inside the DA / Experience Workspace editor by turning on DA's built-in asset picker via **site config only** (no code, no App Builder, no custom plugin). The client has a live AEM Assets as a Cloud Service instance. Delivery goes through **Media Bus** (Edge Delivery's image optimization service), not Dynamic Media.

Note: the aem.live "AEM Assets Sidekick Plugin" doc targets document-based authoring (Word/Google Docs) and does **not** apply to demo's DA authoring. The DA-native equivalent (below) is the correct path. Options B (Adobe-hosted Media Library apps-tab plugin) and D (build our own DA asset-picker plugin) were considered and not chosen.

## Requirements / Spec
- **AEM env (client / Cloud Manager):** set `ADOBE_PROVIDED_CLIENT_ID = darkalley`; saving triggers a full restart (~10-20 min). A publish server must exist ("author only is not supported").
- **DA site config** at `da.live/config#/skoda-storyboard/demo/` (site-level overrides org-level):
  - `aem.repositoryId` (**required**), the AEM host, `author-pXXXXX-eYYYYY.adobeaemcloud.com` or `delivery-pXXXXX-eYYYYY.adobeaemcloud.com`. Prefix only sets which mode DA browses in.
  - `aem.assets.prod.origin`, `aem.assets.prod.basepath` (default `/adobe/assets`), optional overrides, only if the auto-derived values are wrong.
  - `aem.asset.smartcrop.select = on`, optional, lets authors pick a Smart Crop rendition.
  - `aem.asset.dm.delivery`, **leave OFF** (no Dynamic Media license; delivery uses Media Bus).
- **Delivery = Media Bus:** authors pick a **published** asset; on the published site Media Bus ingests and optimizes it (WebP/AVIF, resizing). Dynamic Media reference-in-place stays a documented future upgrade.
- **Constraint:** the AEM DA MCP cannot write DA site config, so these keys are applied via the `da.live/config` UI (or the admin config service with a DA-scoped token). Document exact keys/values for reproducibility.

## Acceptance Criteria
- [ ] `aem.repositoryId` (and any optional keys) present in DA site config; `aem.asset.dm.delivery` is off.
- [ ] The asset/image icon appears in the DA/EW editor toolbar and opens the AEM Assets picker, authenticated against the client repository, showing published assets.
- [ ] An author can insert a published asset into a document.
- [ ] After Preview/Publish, the asset renders on `https://main--demo--skoda-storyboard.aem.page/<page>` optimized via Media Bus, with no CSP/CORS errors in the console.
- [ ] Smart Crop rendition selectable and renders (if `aem.asset.smartcrop.select=on`).
- [ ] `head.html` CSP `img-src` allows the delivered image host (only widened if a block is observed).

## Dependencies
- Upstream: a live AEM Assets ACS instance with a publish server (client-provided repositoryId), `ADOBE_PROVIDED_CLIENT_ID=darkalley` env set + restart completed, target assets published.
- Related: SKODA-504 (S3 -> AEM Assets manifest), SKODA-505b (live AEM DAM delivery wiring for the media cart). This ticket is the author-facing picker; those are the import/delivery pipeline.
- Reference: docs/architecture/SKODA-DA-EW-EXTENSIBILITY.md (rung-4/§6 asset-pick), https://docs.da.live/administrators/guides/setup-aem-assets, https://www.aem.live/docs/ew/administering/media-library.

## Agent handoff
Not a clean agent slice: setting the AEM env + DA site config needs client credentials and the `da.live/config` UI, and the picker/render check is a human visual + console gate. Agent-supportable part: the CSP `img-src` check in head.html and a short reproducibility doc capturing the applied keys.
