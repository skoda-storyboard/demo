# SKODA-523, Media beyond images: MP4 library, annual reports and release PDFs, non-EN CDN references, captions

- **Epic:** E05, Media Pipeline
- **Type:** migration / media (decisions, census tooling, ingest planning). Amends SKODA-520, 504a, 204, 608, 703, 810.
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). **Go-live gate for CS:** D1 puts CS at go-live with EN,
  and 520's source-CDN sunset would break CS pages if it follows the EN gate alone (G-B-07).
- **Estimate:** 5 SP team time · AI-assisted 2–3d / manual 4–6d, excluding the MP4 transfer runtime and client
  decisions *(planning estimate, not a quote)*. The source findings sum to ≈ 6.5–10 SP (MP4 ingest and ops +3–5,
  non-EN census +2–3, PDF link census +1, orphans < 1, Vimeo < 0.5), so 5 SP holds only with an in-use-only Q-18.
- **GitHub issue:** to create
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-D-01 (High, CONFIRMED), G-B-07 (High,
  CONFIRMED), G-D-02 (Medium, CONFIRMED), G-KO-02 (Medium, not re-verified; spot-checked by hand), G-KO-04 (Low,
  not re-verified). G-KO-01 is merged into G-B-08 (SKODA-103b); its PDF link census is done here.

## Why
The M2 media tickets plan images on EN pages. Four other sets have no plan:
- **The MP4 library (G-D-01).** SKODA-204 says "no self-hosted media … zero video-migration workstream". WordPress
  holds 2,602 `video/mp4` + 61 `video/quicktime` attachments. The 1,724 records REST exposes (en 658, cs 568, de
  224, sk 177, sr 95, sl 2) resolve to **867 distinct files, 406 GB**: median 207 MB, 138 files over 1 GB, max
  4.5 GB, 52 h. At the same ratio all 2,663 records are ≈ 1,340 files, ≈ 0.6 TB (an extrapolation). They are the
  download originals beside the Vimeo players on press releases (32/100 recent EN, 25/100 CS, 25/100 SK) and inline
  clips, served through `/direct-download/` signed S3. SKODA-520 plans only the 162 MP4s in the EN feed. aem.live
  caps MP4 at 36 MB, and 71 of the 91 MP4 rows in the manifest are larger (G-T1-01), so they can't go through DA.
- **Non-EN references (G-B-07).** 520's census covers the 408 indexed `/en` pages, and 504a's sweep "every migrated EN
  page". The importer writes the same absolute `/direct-download/` and CDN links in every locale; after the switch
  that host is EDS, so they 404 on the page itself. Non-EN press releases outnumber EN 3:1 (4,711 vs 1,580), and the
  one CS page in the local store has 34 `/direct-download/` and 43 CDN references. No locale ticket mentions either.
  The adversarial pass adds: a zero-reference gate passes when the importer *drops* a reference, and the census
  also needs `skoda-storyboard.s3.amazonaws.com/Assets/`.
- **Documents with no page (G-KO-02).** The annual reports 2011–2025 (EN + CZ) exist only as CDN files, e.g. the
  Annual Report 2024 EN (22.5 MB) and the Výroční zpráva 2025 CZ (27.9 MB). Wikipedia cites 11 of them 26 times;
  Wikidata's Škoda Auto item (Q29637) uses 3 as references, and a board member's CV (.docx) is also on the CDN.
  `/en/annual-reports/` is 404, 0 of the 26 Wikipedia-cited CDN files have a manifest row, and 520 ingests only what
  pages reference, so they die with the CDN. Q-2 proposes dropping the page; the app (SKODA-908) lists annual reports.
- **Links inside PDFs (G-KO-01, in SKODA-103b).** 9 of 13 sampled release PDFs link CDN photos or MP4s (22 links), and
  9 link slashed Storyboard pages; the 2026-10 template adds a `file://` link to an internal share. The binaries
  migrate unchanged, and 520's census reads only DA pages, fragments, the feed and code.
- **Captions (G-D-02).** 204 says "captions all handled by the provider". Of 12 sampled release videos on Vimeo, 1 has
  human captions, 2 auto-generated only, 9 none (incl. the 297 s Peaq launch). 0 of 673 Buzzsprout episodes carry a
  transcript; ≈ 35 human interviews on the EN show have no text alternative. SKODA-703 doesn't test WCAG 1.2.x.
  This is source parity, so it needs a client decision, not build work.
- **Vimeo allow-list (G-KO-04).** 6 of 30 distinct media-library Vimeo ids play only on skoda-storyboard.com (403 on
  aem.live). SKODA-608 doesn't emit them, so production loses them too. The allow-list is Škoda's Vimeo setting.

## Scope
**Client:**
- **C1 Q-18:** which MP4 originals migrate (in use only, or the library), where they live (AEM Assets or Vimeo
  downloads only), and how files over 1 GB are delivered. Default: AEM Assets originals with Media Bus posters; the
  CDN stays read-only until no page or PDF references it.
- **C2 Communications / IR (Q-2):** where the annual reports and other page-less corporate documents live after
  go-live, and who owns them.
- **C3** Do migrated videos and podcasts need captions or transcripts at go-live (WCAG 1.2.1 / 1.2.2, EAA), or is
  parity accepted?
- **C4 Vimeo account owner:** add `*.aem.page` and `*.aem.live` to the allow-list for QA, or confirm
  production-only playback.

**Team:**
- **T1 MP4 sizing (amends 520 and 504a).** A per-file list (record, locale, bytes, pages that link it) from REST and
  the manifest; the volume, upload time and batch plan on the SKODA-518 ledger (PDF/MP4 stay serial, 504a). HEAD the
  largest file on the DAM publish tier before the bulk run. Correct 204's de-risking note.
- **T2 Every locale (amends 520, 504a, 1004a–e).** `media:source-census`, the rewrite and the zero-reference gate
  cover all locales and both source origins. The gate reports rewritten + logged-dropped references per page against
  the source count. One census run per locale before that locale's publish.
- **T3 Orphan documents (amends 520 and 810).** A list of externally referenced files with no page, seeded from the
  Wikipedia and Wikidata lists and SKODA-103b's inbound inventory: manifest rows, ingest, and a redirect from each
  CDN path. 810 keeps or redirects the annual-reports sub-type to the C2 home.
- **T4 PDF link census.** Extract `/URI` links from every `kind: document` row in the media manifest; count CDN,
  slashed-page and `file://` links per PDF. Results feed 103b T5 and its CDN keep-or-sunset decision (103b C3).
- **T5 Captions (amends 204 and 703).** Drop the 204 claim; 703 records the WCAG 1.2.x result either way.
- **T6 Restricted Vimeo ids (amends 608, with 511).** Emit them on the production build, or after C4 everywhere.

## Not in scope
- Inbound `/direct-download/`, CDN and `wp-json` URLs, and the Master Press Release template: SKODA-103b.
- Author uploads of MP4s, PDFs and kit ZIPs after go-live: SKODA-850. Self-hosted interactive embeds: SKODA-849.
- Producing captions or transcripts: client content cost if C3 asks for them.

## Acceptance criteria
- [ ] Q-18 is answered; the MP4 list with bytes and linking pages is attached, and the batch plan has a runtime.
- [ ] `media:source-census` covers every locale and both source origins, and reports dropped references; CS reaches
      0 source references before the CS publish.
- [ ] Each orphan document on the list resolves from its old CDN URL to its new home (200), or C2 records a drop.
- [ ] The PDF census report counts links per document row and is handed to 103b.
- [ ] 204 and 703 are amended; C3's answer is recorded.
- [ ] The 6 restricted Vimeo ids play on the production host, or C4's answer is recorded.

## Dependencies
- **Q-18**, Q-2, D5, D7 (volume), D1; client C1–C4.
- SKODA-520, 504a, 518 (ledger), 503 (MP4/PDF links), 204, 608, 511, 703, 810, 1004a–e; SKODA-103b (inbound
  inventory, CDN host decision), 908 (the app's annual reports).
