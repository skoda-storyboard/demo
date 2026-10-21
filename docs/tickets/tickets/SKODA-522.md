# SKODA-522, Asset changes reach pages: re-publish on update, report on unpublish and expiry

- **Epic:** E05, Media Pipeline
- **Type:** integration / service
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02)
- **GitHub issue:** [#389](https://github.com/skoda-storyboard/demo/issues/389) (created 2026-10-19)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*
- **Status (2026-10-19):** 🔵 TODO (M2), no owner. The approach depends on decision **D20**
  ([register](../../planning/SKODA-DECISION-REGISTER.md)).

## Why
With Media Bus delivery (D5), an image on a page is a **copy**:
- At preview, Edge Delivery fetches the URL in the DA document and serves `./media_<hash>`. The picker inserts a
  plain AEM URL: our DA config sets `aem.repositoryId` only, not `aem.asset.dm.delivery`.
- The alt text is copied into the document when the image is inserted.
- aem.live documents automatic propagation of updates, expiry and deletion only for **Dynamic Media with OpenAPI**
  references ([AEM Assets sidekick plugin](https://www.aem.live/docs/aem-assets-sidekick-plugin)).

So, without this ticket:

| Change in AEM | Pages using the asset |
|---|---|
| New version of the binary | Keep the old copy until each page is previewed and published again |
| Alt text / metadata | Unchanged; the text lives in the document |
| Unpublished, deleted or expired | **Keep serving the copy** (rights risk). Re-publishing doesn't remove it; the image must come out of the document |

The feed-driven listings and rails are covered by SKODA-511; this ticket covers the images **inside pages**.

## Scope
In the App Builder app of SKODA-511a, with SKODA-521's credentials:
- **Usage index:** asset → the pages and fragments whose DA source references it.
  - Built nightly by listing DA (`/list`) and reading each document's source. The `<img src>` and links are matched
    to an asset by DAM path or asset id.
  - It covers authored pages too, not only imported ones, so it can't rely on the import ledger (SKODA-518) alone.
  - Kept as keyed shards in App Builder State or Files; it isn't served.
- **On update** (`published` of an asset that is already in use; also caught by the 511a sweep for Touch UI
  publishes):
  - re-preview, then re-publish, every **published** page in the asset's usage list;
  - previewed-only pages are re-previewed only;
  - batched through the admin API's bulk jobs (10 req/s, ≤500 pending jobs).
- **On unpublish, delete or expiry** (`unpublished` / `deleted` events, the reconcile, and a daily check of
  `prism:expirationDate`):
  - nothing is re-published, because the fetch would fail;
  - the pages go on an **author report**: page, image, reason and date, plus assets expiring in the next 14 days;
  - the report is delivered as a DA sheet `/en/reports/asset-usage` (not published) plus an alert through 511b's
    channel.
- **Alt text:** report a page when its asset's AEM title or alt changed after the image was inserted. Never
  overwrite authored alt text.

## Not in scope
- Removing or replacing images in documents automatically: an author decides. Revisit if D20 asks for an automatic
  placeholder.
- Dynamic Media with OpenAPI: if D20 chooses it, this ticket shrinks to the usage report.

## Acceptance criteria
- [ ] The usage index lists every page and fragment whose DA source references a given test asset; a page edited to
      add that asset appears after the next nightly build.
- [ ] Publishing a new version of a test asset updates the image on every published page that uses it within one
      sweep plus the bulk job time. This verifies that a re-preview fetches the new binary (new `media_<hash>`).
- [ ] Unpublishing a test asset puts its pages on the report the same day, with nothing re-published.
- [ ] An asset expiring within 14 days is on the report with its pages.
- [ ] No authored alt text is changed.
- [ ] Bulk: an update to an asset used on 500 pages finishes without admin API 429s left unretried.

## Dependencies
- **D20** (decision).
- **SKODA-520**: until DA source carries AEM URLs, a re-publish fetches the old source CDN, not AEM.
- **SKODA-521** (credentials), **SKODA-511a** (app, events, sweep), **SKODA-511b** (alert channel), SKODA-518
  (DAM identity for matching).
- Verification: whether the Media Bus re-fetches an already-ingested URL on re-preview when the binary behind it
  changed (open check in [`SKODA-ASSET-INGESTION-M2.md`](../../architecture/SKODA-ASSET-INGESTION-M2.md) §5).
