# SKODA-849, In-body widget census and handling: Škodapedia glossary spans, ys-embed-share HTML, embeds, quizzes

- **Epic:** E06, Import Pilot Content
- **Type:** import (transformers, parser, run report) + a small `scripts/` enhancement
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Must land **before the SKODA-803 bulk run**; after it, about
  300 docs need a re-import for the glossary alone.
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–5d, excluding the package copy (size unmeasured) *(planning
  estimate, not a quote)*. A client-side quiz block (Q-19 option b, 3–5 SP in the finding) is not included.
- **GitHub issue:** to create
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-C-01 (High, CONFIRMED, browser-checked),
  G-KI-01 (High, CONFIRMED), G-KI-02, G-KI-03, G-KI-05 (Medium, not re-verified), the inventory challenge to G-B-07.

## Why
Every case below is lost **silently** today: no error, no log line in the run report.
- **Glossary spans (G-C-01).** Bodies mark terms as `span.term-explain` with inline JSON (`data-explain`). The source
  turns each into a Škodapedia teaser with a "Read More" link. html2md keeps the text and drops the attribute.
  - 106 of 3,374 sampled docs carry 386 spans for 146 distinct terms. The corpus estimate is 250–400 docs (the CS
    and DE story windows were not sampled). Still in use: the 2026-01-27 4x4 story (EN, CS, SK).
  - Locales cross: 10 of 11 SK spans point to CS term ids, and an SL post points to 3 EN terms.
  - The browser check: the teaser can't take keyboard focus and Escape doesn't close it.
  - `SKODA-EN-BLOCK-INVENTORY.md` concluded the glossary is "skodapedia-only", so the backlog believes it doesn't exist.
- **`ys-embed-share` is content, not share chrome (G-KI-01).** 30 of 30 cached widgets wrap an iframe to first-party
  HTML (360° tours, before/after sliders, animations): 26 on `cdn.skoda-storyboard.com/iframes/`, 4 on
  `skoda-storyboard.s3.amazonaws.com/Assets/`, 22 distinct packages. `story-flatten.js` maps it to `share`, which is
  in `DROPPED`; SKODA-801, the widget census and the flatten review call that correct. Page counts differ by source
  (cache 8, census 12 stories, EN dataset 23), all non-zero. The source also handed the embed code to third parties.
- **Embeds other than YouTube and Vimeo (G-KI-02).** The story path's `videoUrl()` knows only those two, and
  hast-util-to-mdast keeps an iframe only if it has a `title`; Spotify's embed has none. 29 of 30 EN podcast episodes
  use Spotify (36 EN story pages in the dataset). The cache adds 2 Instagram, 1 LinkedIn and 2 VW-stream embeds. The
  press-release importer and the embed block (`EMBED_HOSTS`) already handle Spotify.
- **Quizzes (G-KI-03).** 54 quiz stories by slug (EN 21, CS 22, SR 4, SK 3, SL 3, DE 1; the slug match misses some).
  4 of 4 sampled are `.knowledge-test` widgets, 9–14 questions, graded by POST to `/wp-json/skt/result`.
  `flattenQuiz` keeps a static list with no answers. The keys exist only in the WordPress database.
- **Widgets the census never saw (G-KI-05).** The census covered EN + CS (2,773 stories). `widget_skoda_iframe` has no
  `WIDGET_KINDS` entry, so it is dropped with a `console.warn`: 30 of 200 cached SL docs, 88 YouTube iframes (about
  45–50 SL stories, extrapolated). Also unmapped: `sow-google-map` (3 docs), `skoda-video-embed-with-skoda-cdn-support`
  and `skoda-external-links` (1 SL doc each). DE, SK, SR and SL have no census.
- **The gate can't see drops.** SKODA-520's zero-reference gate (all locales via SKODA-523) passes a page whose
  importer dropped a source reference instead of rewriting it.

## Scope
**Client:**
- **Q-19:** keep the interactive HTML as static assets (default), or replace it with a video or still image; and keep
  the 54 quizzes as static lists, rebuild them client-side with the exported keys, or retire them with redirects.
- Glossary: an accessible teaser like the source's, or plain links to the term page.

**Team:**
- **Census first.** Re-run the widget census for DE, SK, SR and SL (the script exists) and add an in-body census per
  locale: iframe hosts, embed scripts, `span.term-explain`, `.knowledge-test`. Find quizzes by widget, not slug.
- **Glossary** (story and release transformers): rewrite each span to a marked link to the term at the target
  locale's public path (`data-explain.id` → term path), with a written fallback when the locale has no term (SK → CS,
  SL → EN as found). If the client wants the teaser: a `scripts/` popover with a focusable trigger, Escape to close and
  no hover-only behaviour. Add the author pattern to the DA library (SKODA-842).
- **`ys-embed-share`:** an Embed of the iframe URL that keeps the aspect ratio, plus a first-party generic-iframe branch
  in the embed block (amends SKODA-204). Host the packages per Q-19: in the code repo under `/iframes/` (same origin),
  or a static bucket Škoda keeps. Add the packages and the S3 `/Assets/` prefix to the SKODA-520 / 504a inventory.
- **Other embeds:** `videoUrl` / `videosToUrls` emit the bare URL for every `EMBED_HOSTS` iframe and log any other host.
  Instagram, LinkedIn and VW-stream: link or drop, recorded per type.
- **New widget kinds:** `skoda_iframe` and `skoda-video-embed` keep the provider URL (embed block); `classifyWidget`
  test cases. `sow-google-map`: a static map image, a link or a drop, decided and recorded. An unknown widget becomes a
  failing count in the run report, not a `console.warn`.
- **Quizzes:** apply the Q-19 answer. In every case, export the `skt` answer keys and result texts before WordPress is
  deleted (with SKODA-711).
- **Drop count in the gate:** per page, source references (iframes, embeds, spans, widgets) = embeds and links in the
  output + logged drops. The run report and the SKODA-520/523 gate fail on any unexplained difference.

## Not in scope
- Škodapedia term pages, their scope and URLs (SKODA-802 / 206, G-C-02) and the term authoring flow (G-C-07).
- Embed consent placeholders (SKODA-204a) and consent groups (SKODA-907). The MP4 library and PDFs (SKODA-523).
- A client-side quiz block, if Q-19 picks it: a follow-up ticket.

## Acceptance criteria
- [ ] The census report covers all 6 locales, with counts per widget kind and embed host; 0 unknown kinds, or each one
      listed with its handling.
- [ ] Unit tests: `ys-embed-share`, `skoda_iframe` and `skoda-video-embed` classify to embeds; `videosToUrls` emits a
      Spotify URL; a `span.term-explain` becomes a link to the right locale's term, including the SK → CS fallback.
- [ ] Dry run on the Octavia Euro NCAP release, the 4x4 story, the SK Scala story, the 8 cached `ys-embed-share`
      pages and 3 Spotify episodes: terms link to term pages, the packages render from their new host, the players
      play, and `import:validate-blocks` passes.
- [ ] If the teaser ships: Tab reaches the trigger, Enter opens it and Escape closes it.
- [ ] The run report shows source references = output + logged drops per page; a planted unmapped iframe fails it.
- [ ] Q-19 is answered in the register; the quiz keys and result texts are exported and stored outside WordPress
      before SKODA-711 deletes anything.

## Dependencies
**Q-19**; G-C-02 (term pages must exist: SKODA-802 / 206). Lands before SKODA-803 and 801b; feeds the 1004a–e runs.
Amends SKODA-801 (widget map), 204 (generic iframe), 520 / 523 (inventory and gate), 504a (S3 prefix). Needed by
SKODA-711 (exports). Library pattern in SKODA-842.
