# SKODA-710a, Link release at the switch: `scripts/links.js` on the own host, and the DA relink

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** code release (`scripts/links.js`) plus a content pass over DA
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02; date open, **Q-20**). **Go-live blocker:** merged at the
  switch, as one runbook step (SKODA-710).
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d *(planning estimate, not a quote)*. The review sized the link
  release at 2–3 SP; the relink pass over 2,750 links (or the runtime rewrite) puts it at the top of that range.
- **GitHub issue:** to create
- **Parent:** SKODA-710
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KT-02 (High, CONFIRMED, go-live
  blocker).

## Why
- **`links.js` turns on itself at the switch.** `LIVE_ORIGIN` / `LIVE_HOST` hard-code `[www.]skoda-storyboard.com`,
  and `policyHref()` checks `LIVE_HOST` before the same-origin branch. Once pages are served from `www`, every
  site-relative internal link resolves to `LIVE_HOST` and gets `target=_blank` with `rel="noopener noreferrer"`,
  except the 9 `DEMO_LISTINGS` paths, and the slash trim is skipped (simulated with the module).
- The 8 `LIVE_ONLY` patterns (non-EN locales, `/en/skodapedia`, podcast archives, feeds, contacts, `/en/documents/`,
  newsletter settings, `/direct-download/`) then point at EDS, and unmigrated targets 404.
- DA content holds 2,750 absolute source-page links in the 408 EN pages (520 census), written by the import-time
  allow-list. SKODA-605 and 609 are closed M1; AR-19 maps only to them.

## Scope
- **`scripts/links.js`:** shrink `LIVE_ONLY` to what is really absent at go-live, drop the new-tab rule for the own
  host, make own-host links site-relative (AR-19). Each remaining `LIVE_ONLY` pattern is listed with its reason.
- **Absolute links in DA:** a relink pass over DA after the last import (delta import, SKODA-710), or a runtime
  rewrite, for the 2,750 absolute links (and the locale runs' links, 1004a–e).
- **Crawl** of the production CDN, reached before the DNS change, with the release applied.
- Unit tests for the new policy.

## Not in scope
- The `/direct-download/` links and source-CDN references: SKODA-520. Legacy URL rules: SKODA-103a, 103b.
- The runbook order and timing: SKODA-710.

## Acceptance criteria
- [ ] Unit test: with base `https://www.skoda-storyboard.com/en/news/x`, `policyHref('/en/models/fabia')` returns no
      new tab, and `/en/models/fabia/` is trimmed. Each remaining `LIVE_ONLY` pattern is listed with its reason.
- [ ] Before go/no-go, a crawl of the production CDN (reached before the DNS change) with the link release finds 0
      internal 404s and 0 internal links with `target=_blank`; DA holds 0 absolute `www` links to migrated pages (or
      the runtime rewrite covers them).
- [ ] `npm run lint` passes; the release is merged in the runbook's switch step, not before.

## Dependencies
SKODA-710 (runbook, delta import), 709 (production host), 605, 609 (M1 link policy), 1004a–e (locale links), 520.
Supersedes AR-19 for M2.
