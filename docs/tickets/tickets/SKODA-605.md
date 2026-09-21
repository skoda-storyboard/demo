# SKODA-605 — Rewrite absolute source URLs to site-relative in import
- **Epic:** E06 — Import Pilot Content
- **Type:** import / transformer
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (demo)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*

## Summary
Card links in the Models rail, the Series rail, and the "All"/heading links on the tag rails render as **absolute `https://www.skoda-storyboard.com/...` URLs**, so clicking them during the demo navigates off `localhost`/the EDS site to the live source. Rewrite absolute source-host hrefs to **site-relative** paths during import. Surfaced by QA finding **F1** (2026-09-14 homepage QA pass, this-cycle wave 1).

## Description
Confirmed in `content/en/index.plain.html` (4 absolute `skoda-storyboard.com` hrefs) — the landing transformer (`tools/importer/transformers/skoda-cleanup.js`) does **no link rewriting** today. The footer model links are already relative (`/en/tag/model/fabia`), so the fix is to normalize the rail/heading links to match. **Content-layer fix:** must be done in the transformer + re-import, NOT by hand-editing `content/` (project rule: content is produced only by the bundled import script).

## Requirements / Spec
- In the import transformer, rewrite any `href` whose host is `www.skoda-storyboard.com` (or `skoda-storyboard.com`) to a site-relative path (strip scheme+host, keep path+query+hash).
- Leave already-relative and genuinely-external (non-Škoda) links untouched.
- Applies to landing (`import-en-landing`) and should be reused by future page-type importers (rails appear on MR home, Model, Series too).
- Re-run the affected importer; preview; validate no absolute source-host links remain in the output.

## Acceptance Criteria
- [ ] No `skoda-storyboard.com` absolute hrefs remain in imported page content (grep clean).
- [ ] Models rail, Series rail, and tag-rail "All" links resolve to local/site-relative paths; a demo click-through stays on the EDS site.
- [ ] Genuinely-external links (if any) are preserved.
- [ ] Transformer change is reusable across page-type importers.

## Dependencies
- Upstream: SKODA-601 (transformer layer), SKODA-602 (re-import + publish)
- Blocked-by (to fully verify on the published site): DA publish credentials + reindex — the transformer fix is codeable now; end-to-end verification needs a re-import/publish cycle.

## Risks / Flags
- 🟢 Low-risk transformer change; the collision scope is the import layer only (no block/CSS impact).
- **Cannot be verified end-to-end without a re-import + DA publish** (index only sees published pages) — codeable now, verification gated on the publish cycle.

## Status (2026-09-14, agent-team cycle 1)
- **IMPLEMENTED** in `tools/importer/transformers/skoda-cleanup.js` (`after` hook): rewrites `http(s)://[www.]skoda-storyboard.com/<path>` hrefs → site-relative `/<path>`, external links untouched. `node --check` passes; the transformer-validation hook ran without errors.
- **QA-BLOCKED — not DONE.** The auto-validation ran against `migration-work/cleaned.html`, which is the **drifted Peaq snapshot** (page-analysis agents flagged this), not the `/en/` homepage — so it confirms the code *runs* but cannot confirm the F1 rails are rewritten. True QA needs a **clean `/en/` re-scrape → re-import → preview/publish**, which requires DA credentials + reindex (not available this cycle). Ticket stays open pending that cycle.
