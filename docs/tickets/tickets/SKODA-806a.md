# SKODA-806a, Press kit: whole-kit ZIP as a DAM-hosted package (follow-up to SKODA-806)
- **Epic:** E08, Editorial at Scale (follow-up to SKODA-806, #67, closed 2026-10-12)
- **Type:** media / integration · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** none yet (draft from the M2 readiness review, 2026-10-15)
- **Estimate:** 2 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 📝 Draft, proposed.

## Why
SKODA-806 shipped the grouped media and download areas. The source's whole-kit ZIP is a pre-built static `.zip` on the
source CDN. Today the demo still links it there, so the link breaks when the source CDN goes away at go-live.

## Scope
- Ingest each kit's ZIP into AEM Assets as an `archive` kind row in `tools/importer/media/media-manifest.json`. This is
  the same DAM path as the PDFs and MP4s (SKODA-503 gate), run on a developer machine.
- The importer rewrites the ZIP link to the DAM delivery URL.
- Kits that have no ZIP on the source keep no ZIP button.

## Acceptance criteria
- [ ] Every live press-kit hub with a ZIP on the source links to an AEM Assets URL that downloads the same file (size + name).
- [ ] No hub links `cdn.skoda-storyboard.com` for the ZIP.

## Dependencies
806 ✅, 503 (DAM binary gate), D2 (production cart; only if the client wants a cart-built ZIP instead).
