# SKODA-609, M1 link containment (demo set) + alias redirect

- **Epic:** E06, Import Pilot Content
- **Type:** import transformer + config (redirects) + policy
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d *(planning estimate, not a quote)*
- **GitHub issue:** [#118](https://github.com/skoda-storyboard/demo/issues/118)
- **Discovered in:** M1 gap review, 2026-09-24

## Status (2026-09-30)
🟡 **Code done; content steps pending** (they need DA/admin credentials). Dead-link report:
[`docs/reviews/SKODA-609-DEAD-LINKS.md`](../../reviews/SKODA-609-DEAD-LINKS.md) (`npm run import:deadlinks`).
The crawl covers 226 index pages plus `/nav`, `/footer`, `/media-room/nav` and `/media-room/footer`. It found
61 dead in-site targets before this ticket and 9 after.

Committed policy (runtime, [`scripts/links.js`](../../../scripts/links.js); applied in `decorateMain`, which also
runs on the nav/footer fragments, again after blocks load, and on click as a catch-all):

| Link | Result |
|---|---|
| Live host (`[www.]skoda-storyboard.com`) | unchanged, `target=_blank` + `rel="noopener noreferrer"` (D-3 b; SKODA-306) |
| Live host → demo listing (`DEMO_LISTINGS`: `/en`, `/en/media-room`, `/en/news`, `/en/press-kits`, `/en/images`, `/en/videos`, `/en/series-2`, `/en/search`) | site-relative, same tab, query + hash kept (the DA Media Room nav) |
| Site-relative → `LIVE_ONLY` (other locales, `/en/skodapedia`, `/en/feed`, `/en/press-releases/feed`, `/en/contacts`, `/en/documents/…`, `/en/newsletter-settings`, `/direct-download/…`) | absolute to live, new tab. The nav's `/en/category/podcast/` goes to the live `/en/category/podcast-en/` (the source slug) |
| Site-relative with a trailing slash (`/en/`, `/en/media-room/`, `/en/news/?filter…`) | slash dropped (EDS 404s it); this also covers `skoda-model-tags.js` |

Import side: the Elroq sustainable-interior story 404s on the source, so it is dropped from the corpus. The allow-list
is regenerated (227 paths + the alias), and all 18 bundles are rebuilt (`esbuild --bundle --format=iife
--global-name=CustomImportScript --target=es2017`). The 3 listing bundles also pick up the Press Kits listing variant
that #223 did not bundle. The index already holds exactly one mixed-reality row.

Remaining (content, needs credentials):
1. ✅ Done 2026-09-30: DA `/redirects` sheet row `Source` `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality`
   → `Destination` `/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality`; sheet previewed + published. The
   older press-kit rows now point to `/en/press-kits` (no trailing slash, since EDS 404s it). A stale DA doc still sits at
   the alias path. Redirects should take precedence; if the alias still serves it, unpublish/delete that doc.
   ✅ Added 2026-09-30: `/en/press-kits/skoda-peaq-press-kit` and `/en/press-kits/skoda-peaq-press-kit/` →
   `/en/press-kits/skoda-peaq-press-kit-2` (the source redirects the old kit URL the same way). Matching is exact, so
   both forms are listed. The sheet (5 rows) is previewed + published; both paths return 301 on `.aem.page` and `.aem.live`.
2. SKODA-603 backlog imports clear 8 of the 9 dead targets: `/en/press-kits/skoda-peaq-press-kit-2/images`
   (13 links), the 5 press releases and the 2 press kits listed in the report.
3. Re-import + push `/en/models/skoda-elroq-through-designers-eyes` so its Elroq sustainable-interior link turns
   absolute (the 9th).
4. Optional cleanup: fix the DA nav/footer hrefs to the policy targets (the runtime already does it), and re-push
   the 3 press releases with relative `/direct-download/` links (transformer rule 2 already makes them absolute).
5. Card swaps: out-of-set promo/related cards are absolute to live + new tab. No 404, so no swap is needed for M1.

## Summary
M1 imports the 43-URL set ([`skoda-m1-url-set.txt`](../../planning/skoda-m1-url-set.txt)) plus the rail-feed corpus.
Most links on those pages point **outside** that set:
- **chrome:** mega-menu categories, `/en/news/`, `/en/media-room/`, company pages, Škodapedia, `/en/media-cart/`,
  search
- **tags:** `/en/tag/...` archives, which are M2 (SKODA-209)
- **series:** `/en/series-2/`
- **home promo targets** that are not in the set
- **press-kit chapter tiles:** 50 child pages
- **related rails** in press releases and stories

Once SKODA-605 rewrites these to site-relative paths, each of them becomes a **404 on the EDS demo** instead of a
jump to the live site.

The set also lists the mixed-reality story twice:
- `/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality/` returns 200 with
  canonical `/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality/`

So it is an **alias, not a second page**.

## Requirements / Spec
Link policy is decision **D-3** in the gap review. Default until decided: **(b)**.

| Link class | Policy options | Recommended default |
|---|---|---|
| Chrome to ruled-out pages (company, Škodapedia, category/tag archives, RSS) | (a) keep absolute to live source, (b) keep absolute with a `rel`/new tab, (c) remove | **(b)**, absolute to live with `target=_blank`, recorded in SKODA-306 |
| Chrome to in-scope listings (`/en/`, `/en/images/`, `/en/videos/`) | site-relative | site-relative |
| Press-kit chapter tiles | import (SKODA-805b), or absolute to live | per decision D-1 |
| Tag links | absolute to live until SKODA-209 | absolute (b). **Superseded 2026-09-26:** the 41 tag/category archives are demo pages (SKODA-209 M1 slice) and are on the SKODA-605 allow-list; all tag/category links on the site are site-relative |
| Promo/related cards to out-of-set stories | import the target (add to corpus) or swap the card | add to corpus when it is a story; otherwise swap |
| `/en/media-cart/`, `/en/series-2/` | point to the SKODA-505b cart UI / hide the "All series" link | hide/redirect |
| `/en/media-cart/` (2026-10-02) | done: the demo's own cart page (SKODA-505b). `scripts/links.js` has it in `DEMO_LISTINGS` (a live-host link comes to it), not `LIVE_ONLY` | stays on the demo |

- Implement the policy in one shared transformer step that runs after SKODA-605 rewriting and is driven by an
  allow-list (the URL set + corpus). Out-of-set targets follow the table.
- **State after SKODA-605 (2026-09-25):** `tools/importer/transformers/skoda-links.js` already rewrites only
  links whose target is on the allow-list (URL set + corpus, generated by `npm run import:allowlist`), and maps the
  alias to its canonical. Every other source-host link stays **absolute to the live site in the same tab**, which is
  D-3 (b) without the new tab. What 609 still has to do: `target=_blank` for those links (runtime or import), the card
  swaps, the redirect, and the crawl. It also has to cover the nav and footer fragments, which are already relative
  to non-demo pages (`/en/tag/…`, `/en/category/…`, `/en/skodapedia/`, `/en/media-room/`, `/en/`), and
  `skoda-model-tags.js`'s hard-coded `/en/news/?filter…`. All of these 404 on EDS today.
- Add a DA `redirects` sheet entry (SKODA-103) that sends the mixed-reality alias to its canonical. Import the page
  once only.
- Produce a **dead-link report**: crawl the demo preview and list any in-site 404 (see the gap review §13 verification).

## Acceptance Criteria
- [ ] A crawl of all imported demo pages finds **0 in-site 404s**. Every out-of-set link follows the agreed policy.
- [ ] The mixed-reality alias 301s to the canonical, and the index holds exactly one row for it.
- [ ] The policy table and allow-list are committed. `.hlxignore` covers `*.md` only, so a `.txt`/`.json`
      allow-list is served publicly. That is acceptable for a list of public URLs; otherwise add it to `.hlxignore`.

## Dependencies
- Upstream: SKODA-605 (absolute → relative), SKODA-103 (redirects sheet), SKODA-603 (URL set + corpus).
- Related: SKODA-306 (new-tab behaviour), SKODA-805b (press-kit children), SKODA-209 (tag archives, M2).
