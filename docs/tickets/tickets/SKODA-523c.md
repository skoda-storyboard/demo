# SKODA-523c, Documents: Word, ZIP, PowerPoint and audio kinds, the REST-sourced PDF link census, orphan documents

- **Epic:** E05, Media Pipeline
- **Type:** migration / media (pipeline kinds, census tooling). Amends SKODA-520, 503, 810.
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). The kinds land before the 523b locale runs; the census
  re-runs at the content freeze.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3d, excluding the census download runtime (≈ 11k PDFs, ≈ 7.5 GB at
  the manifest mean of 0.67 MB) *(planning estimate, not a quote)*. Parts: PDF link census +1, REST sourcing +0.5,
  document kinds +0.5–1, orphan documents < 1.
- **GitHub issue:** to create
- Parent: SKODA-523 ([#425](https://github.com/skoda-storyboard/demo/issues/425))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-T8-02, G-T8-05 (Medium), G-KO-02
  (Medium), G-T4-06 (Low), G-KO-01 (census part, merged into G-B-08), G-T8-03 (correction); none re-verified.

## Why
- **Kinds (G-T8-02, G-T4-06).** `binary-media.mjs` classifies only `.pdf` (document) and `.mp4` (video), so a Word,
  ZIP or PowerPoint link gets no manifest row, no ingest, no rewrite and no validator error. REST lists 489 `.docx`,
  219 `.doc`, 107 `.zip` and 2 `.pptx`. All 6 sampled SK press releases offer the release text as a `.docx` (2 links
  each), and the board-of-management page links a photo-set ZIP per member. DA refuses ZIP (SKODA-850). 2 quiz
  stories (EN, SR) play MP3 clips that become bare CDN links.
- **The census source (G-T8-05).** The planned census read the manifest: 242 document rows, all EN. REST counts
  11,254 PDF attachments (en 3,407, cs 4,155, de 2,024, sk 502, sr 1,161). CS goes live with EN. Most recent release
  PDFs have no parent post in REST (16 of 18 and 26 of 27 search hits).
- **Links inside PDFs (G-KO-01, round 2).** Of the 96 DAM-delivered PDFs, 48 link 126 CDN files (35 of 37 release
  PDFs from 2026), 24 contain 46 Storyboard page links (42 slashed), and 54 carry a `file://` link. That link is
  the Master template's `skoda-storyboard.com` hyperlink without `https://`, which Word made relative to the internal
  share. It has been dead for readers since 2024 (2 of 5 PDFs from 2024, 4 of 5 from 2025), not only in the 2026-10
  template (G-T8-03). The binaries migrate unchanged; 520's census reads only DA pages, fragments, the feed and code.
- **Documents with no page (G-KO-02).** The annual reports 2011–2025 (EN + CZ) exist only as CDN files, e.g. the
  Annual Report 2024 EN (22.5 MB) and the Výroční zpráva 2025 CZ (27.9 MB). Wikipedia cites 11 of them 26 times;
  Wikidata's Škoda Auto item (Q29637) uses 3 as references; a board member's CV (.docx) is also on the CDN.
  `/en/annual-reports/` is 404, and 0 of the 26 Wikipedia-cited files have a manifest row.

## Scope
- **Kinds:** add `.docx`, `.doc`, `.zip` and `.pptx` (document) with their MIME types to `binary-media.mjs`, the
  manifest and the validator; MP3 as a document or a new `audio` kind, recorded. ZIPs go to AEM Assets directly,
  not through DA. Unit tests per kind.
- **PDF link census:** extract `/URI` links from the REST PDF list for every locale
  (`/wp/v2/media?mime_type=application/pdf`) or 103b's database export. Count CDN, slashed-page and `file://` links
  per PDF; report per locale. Re-run at the freeze.
- **Hand-offs:** CDN links → 103b / 103e (the redirect-only host); page links → 713c (harness inventory, G-T8-07);
  the `file://` root cause → 103b C4 (Master template checklist).
- **Orphan documents:** a list of externally referenced files with no page, seeded from the Wikipedia and Wikidata
  lists and 103b's inbound inventory: manifest rows, ingest, and a redirect from each CDN path (103e). 810 keeps or
  redirects the annual-reports sub-type to the C2 home.

## Not in scope
- The Master Press Release template and its Title, Lang and Author defaults: SKODA-103b C4.
- The document host and its index policy: SKODA-709b, 713a. Per-page rewrite and the gate: SKODA-523b.

## Acceptance criteria
- [ ] A `.docx`, a `.zip` and an `.mp3` link each get a manifest row and are rewritten in a dry run; an unknown binary
      extension fails the validator.
- [ ] The census report covers every locale's REST PDFs, with per-PDF counts; it is handed to 103b and 713c.
- [ ] Each orphan document on the list resolves from its old CDN URL to its new home (200), or C2 records a drop.

## Dependencies
Q-2 (C2), Q-21; SKODA-520, 503, 810, 850 (ZIP), 103b / 103e, 713c, 1004; 523b uses the kinds. Parent: SKODA-523.
