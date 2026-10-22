# SKODA-523b, Source references in every locale: census, rewrite and a zero-reference gate that sees drops

- **Epic:** E05, Media Pipeline
- **Type:** migration / media (census tooling, import gate). Amends SKODA-520, 504a, 1004a–e.
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). **Go-live gate for CS:** the CS run passes before the CS
  publish (D1).
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d, excluding the per-locale run time *(planning estimate, not a
  quote)*. The finding sizes the non-EN census at +2–3 SP; the extra kinds and origins from round 2 fit inside it.
- **GitHub issue:** [#442](https://github.com/skoda-storyboard/demo/issues/442) (created 2026-10-21, sub-issue of #425)
- Parent: SKODA-523 ([#425](https://github.com/skoda-storyboard/demo/issues/425))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-B-07 (High, CONFIRMED), with G-T8-02
  and G-T4-03 (Medium, not re-verified).

## Why
- **The census is EN only.** 520's census covers the 408 indexed `/en` pages, and 504a's sweep "every migrated EN
  page". The importer writes the same absolute `/direct-download/` and CDN links in every locale; after the switch
  that host is EDS, so they 404 on the page itself.
- **Volume:** non-EN press releases outnumber EN 3:1 (4,711 vs 1,580). The one CS page in the local store has 34
  `/direct-download/` and 43 CDN references. No locale ticket mentions either.
- **The gate can't see drops.** A zero-reference gate passes when the importer *drops* a reference instead of
  rewriting it (adversarial pass).
- **More origins and kinds.** The census also needs `skoda-storyboard.s3.amazonaws.com/Assets/`; the bodies embed
  packages from `skoda-storyboard.s3.eu-central-1.amazonaws.com/iframes/` too (G-T4-03). `.docx`, `.doc`, `.zip`,
  `.pptx` and `.mp3` links are counted by nothing today (G-T8-02, G-T4-06; the kinds come from SKODA-523c).

## Scope
- **Census per locale:** `media:source-census` runs over every locale's DA pages, fragments and feed rows, and counts
  references per page, per kind (image, document, video, audio) and per source origin:
  - `www.skoda-storyboard.com/direct-download/`;
  - `cdn.skoda-storyboard.com`;
  - `skoda-storyboard.s3.amazonaws.com/Assets/` and `skoda-storyboard.s3.eu-central-1.amazonaws.com/iframes/`.
- **Rewrite** every reference with a manifest row to its new URL, in every locale.
- **Gate:** per page, source references = rewritten + logged drops (with the reason). Any unexplained difference
  fails the run; the HTML packages count as logged hand-offs to SKODA-849b, not as passes.
- **Runs:** one run per locale before that locale's publish (1004a–e), and a final run at the content freeze.

## Not in scope
- The document kinds in `binary-media.mjs` and the PDF census: SKODA-523c. The MP4 list: SKODA-523a.
- Moving the HTML packages: SKODA-849b. Inbound links to the old hosts: SKODA-103e.

## Acceptance criteria
- [ ] The census report covers all 6 locales and all four source hosts, with counts per kind.
- [ ] A test page with a planted reference the importer drops fails the gate; the same page with the drop logged passes.
- [ ] CS reaches 0 unexplained source references before the CS publish; each other locale before its own publish.
- [ ] The freeze run is recorded in the SKODA-710 runbook.

## Dependencies
D1, Q-7 (locale timing); SKODA-520, 504a, 1004a–e, 523c (kinds), 849 (drop count, packages), 710 (freeze).
Parent: SKODA-523.
