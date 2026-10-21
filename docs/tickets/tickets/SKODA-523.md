# SKODA-523, Media beyond images: MP4 library, documents and release PDFs, non-EN CDN references, captions

- **Epic:** E05, Media Pipeline
- **Type:** migration / media (coordination ticket with sub-tickets). Amends SKODA-520, 504a, 204, 608, 703, 810.
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). **Go-live gate for CS:** D1 puts CS at go-live with EN,
  and 520's source-CDN sunset would break CS pages if it follows the EN gate alone (G-B-07).
- **Estimate:** 1 SP for the shared scope (client decisions C1–C4, captions, Vimeo ids, hand-offs) · AI-assisted
  0.5d / manual 1d, excluding client decisions *(planning estimate, not a quote)*. The build is in sub-tickets: 523a
  MP4 library 4 SP; 523b every-locale census and gate 3 SP; 523c documents and the PDF link census 3 SP. Total
  11 SP: round 1 sized the parts at ≈ 6.5–10 SP (MP4 ingest and ops +3–5, non-EN census +2–3, PDF link census +1,
  orphans < 1, Vimeo < 0.5), and round 2 adds ≈ 1–1.5 SP (document kinds +0.5–1, REST-sourced census +0.5). An
  in-use-only Q-18 brings 523a down to about 3 SP.
- **GitHub issue:** [#425](https://github.com/skoda-storyboard/demo/issues/425) (created 2026-10-21, sub-issue of epic #6)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-D-01 (High, CONFIRMED), G-B-07 (High,
  CONFIRMED), G-D-02 (Medium, CONFIRMED), G-KO-02 (Medium, not re-verified; spot-checked by hand), G-KO-04 (Low,
  not re-verified); round 2: G-T8-02, G-T8-05 (Medium), G-T4-06 (Low), the G-T8-03 correction (none re-verified).
  G-KO-01 is merged into G-B-08 (SKODA-103b); its PDF link census is done here (523c).

## Why
The M2 media tickets plan images on EN pages. These sets have no plan:
- **The MP4 library (G-D-01, 523a).** WordPress holds 2,602 `video/mp4` + 61 `video/quicktime` attachments; the
  1,724 records REST exposes resolve to 867 distinct files, 406 GB. SKODA-520 plans only the 162 MP4s in the EN feed,
  and DA can't take them (36 MB cap). SKODA-204 says there is no video-migration workstream.
- **Non-EN references (G-B-07, 523b).** 520's census covers the 408 indexed `/en` pages, and 504a's sweep "every
  migrated EN page". The importer writes the same absolute `/direct-download/` and CDN links in every locale, and
  non-EN press releases outnumber EN 3:1 (4,711 vs 1,580).
- **Documents (G-T8-02, G-T8-05, G-KO-02, 523c).** The binary pipeline knows only `.pdf` and `.mp4`; REST also lists
  489 `.docx`, 219 `.doc`, 107 `.zip` and 2 `.pptx` attachments. The planned PDF census read the media manifest
  (242 document rows, all EN) against 11,254 PDFs in REST. The annual reports and other page-less documents that
  Wikipedia and Wikidata cite live only on the CDN. 2 quizzes play MP3 clips that no media kind covers (G-T4-06).
- **Captions (G-D-02).** 204 says "captions all handled by the provider". Of 12 sampled release videos on Vimeo, 1 has
  human captions, 2 auto-generated only, 9 none (incl. the 297 s Peaq launch). 0 of 673 Buzzsprout episodes carry a
  transcript; ≈ 35 human interviews on the EN show have no text alternative. SKODA-703 doesn't test WCAG 1.2.x.
  This is source parity, so it needs a client decision, not build work.
- **Vimeo allow-list (G-KO-04).** 6 of 30 distinct media-library Vimeo ids play only on skoda-storyboard.com (403 on
  aem.live). SKODA-608 doesn't emit them, so production loses them too. The allow-list is Škoda's Vimeo setting.

## Sub-tickets
| Ticket | Scope | SP |
|---|---|--:|
| [SKODA-523a](SKODA-523a.md) | MP4 library: per-file list, sizing, batch plan, files over 1 GB | 4 |
| [SKODA-523b](SKODA-523b.md) | Source census, rewrite and zero-reference gate in every locale and source origin | 3 |
| [SKODA-523c](SKODA-523c.md) | Document kinds beyond PDF, the REST-sourced PDF link census, orphan documents | 3 |

## Scope (shared, this ticket)
**Client:**
- **C1 Q-18:** which MP4 originals migrate (in use only, or the library), where they live (AEM Assets or Vimeo
  downloads only), and how files over 1 GB are delivered. Default: AEM Assets originals with Media Bus posters. The
  CDN stays read-only until SKODA-103e's permanent redirect-only host replaces it: release PDFs keep linking CDN files
  (35 of 37 from 2026), so "until no page or PDF references it" never comes true (G-T8-04).
- **C2 Communications / IR (Q-2):** where the annual reports and other page-less corporate documents live after
  go-live, and who owns them.
- **C3** Do migrated videos and podcasts need captions or transcripts at go-live (WCAG 1.2.1 / 1.2.2, EAA), or is
  parity accepted?
- **C4 Vimeo account owner:** add `*.aem.page` and `*.aem.live` to the allow-list for QA, or confirm
  production-only playback.

**Team:**
- **T5 Captions (amends 204 and 703).** Drop the 204 claim; 703 records the WCAG 1.2.x result either way.
- **T6 Restricted Vimeo ids (amends 608, with 511).** Emit them on the production build, or after C4 everywhere.
- **Hand-offs:** the document host base URL from Q-21 / SKODA-709b goes into 523a and 523c (`public_url`); the PDF
  census goes to 103b / 103e (CDN links) and 713c (page links); the orphan list goes to 810 and 103e.
- **Order:** 523c's document kinds land before 523b's per-locale runs; each locale's 523b run passes before that
  locale's publish (1004a–e).

## Not in scope
- Inbound `/direct-download/`, CDN and `wp-json` URLs, and the Master Press Release template: SKODA-103b / 103e.
- The document host itself (Q-21): SKODA-709b. The document index policy: SKODA-713a.
- Author uploads of MP4s, PDFs and kit ZIPs after go-live: SKODA-850. Self-hosted interactive embeds: SKODA-849.
- Producing captions or transcripts: client content cost if C3 asks for them.

## Acceptance criteria
- [ ] Q-18 and C2 are answered in the register; Q-18's wording no longer depends on PDFs dropping CDN links.
- [ ] 204 and 703 are amended; C3's answer is recorded.
- [ ] The 6 restricted Vimeo ids play on the production host, or C4's answer is recorded.
- [ ] 523a, 523b and 523c are done.

## Dependencies
- **Q-18**, Q-2, **Q-21** (document host), D5, D7 (volume), D1; client C1–C4.
- SKODA-520, 504a, 518 (ledger), 503 (MP4/PDF links), 204, 608, 511, 703, 810, 1004a–e; SKODA-103b / 103e (inbound
  inventory, CDN host), 709b (document host), 713a / 713c, 849 (packages, drop count), 908 (the app's annual reports).
- Sub-tickets: SKODA-523a, 523b, 523c.
