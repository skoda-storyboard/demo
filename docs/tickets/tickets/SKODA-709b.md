# SKODA-709b, Document host: deliver PDFs, MP4s and originals from a Škoda host, not the raw AEM publish host

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** infrastructure / decision (CDN or Cloud Manager configuration)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The host must be decided **before the M2 bulk ingest**
  (SKODA-517–520) writes more page links.
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d, excluding Škoda AEM / Cloud Manager time *(planning estimate,
  not a quote)*. The review sizes G-T8-01 at 1–2 SP across tickets; the `public_url` base (503/520), the 103b target
  and the robots rule (713) are counted there.
- **GitHub issue:** [#438](https://github.com/skoda-storyboard/demo/issues/438) (created 2026-10-21, sub-issue of #416)
- **Parent:** SKODA-709
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-T8-01 (High, CONFIRMED), G-T8-04;
  decision **Q-21** (🔴).

## Why
- Every verified PDF, MP4 and original gets a `public_url` on the raw host
  `publish-p220607-e2281243.adobeaemcloud.com` (under `/content/dam/storyboard/`), and the import writes it into DA
  pages (the demo Elroq page links its TD PDF there).
- That host's `robots.txt` is `User-agent: * / Disallow: /`, and the PDF is sent with `content-disposition:
  attachment` and `max-age=600` (reproduced 2026-10-21). 2,831 manifest rows point at it (2,513 image, 227 document,
  91 video), and `scripts/media-cart-resolver.js:13` hard-codes it.
- SKODA-103b T5 sends the source CDN and `/direct-download/` there, so a Google-indexed CDN PDF would 301 to a
  robots-blocked URL and leave the index. The host name carries program and environment ids, so an environment
  change breaks every page link, the cart and every PDF written after go-live.
- `media.skoda-storyboard.com` is an alias with no role today (a CNAME to the apex, SKODA-709a). It could be the
  document host. 0 docs mention a custom domain or the publish host's robots.

## Scope
**Client (Škoda AEM / Cloud Manager admin):**
- Is a custom domain available on the publish tier of program p220607, and who controls the publish `robots.txt`?

**Team:**
- **Q-21 proposal:** a branded host (e.g. `media.skoda-storyboard.com`) in front of AEM publish, or `/content/dam/*`
  routed through the production CDN. Compare: certificate, DNS change (in 709's change requests), headers, cost.
- **Set-up** of the chosen route: certificate, DNS record, and headers that can be set there (`robots.txt`,
  `content-disposition`, cache lifetime).
- **Hand-off:** the final base URL to SKODA-503/520 (`public_url` from a configurable base), 103b T5 (redirect
  target), 713 (the document index policy and robots rule) and 523.
- **Inventory row:** the host's role in SKODA-709a.

## Not in scope
- Rewriting `public_url` in the manifest and the DA pages: SKODA-503, 520.
- The index policy for documents (canonical header or noindex): SKODA-713.
- The `cdn.skoda-storyboard.com` redirect host: SKODA-520, 103b.

## Acceptance criteria
- [ ] Q-21 is 🟢 in the register, with the route and its owner.
- [ ] A migrated PDF loads from the chosen host with a valid certificate; its `robots.txt` doesn't disallow the
      documents (unless the 713 policy says so), and the headers match the agreed set.
- [ ] The base URL is handed to 503/520, 103b and 713 before the M2 bulk ingest starts, and no new page link is
      written to the raw publish host after that.

## Dependencies
**Q-21**, D5/D14; SKODA-709 (CDN, change requests), 709a (alias row), 503, 517–520 (ingest), 103b, 713, 523. Client:
Škoda AEM / Cloud Manager admin.
