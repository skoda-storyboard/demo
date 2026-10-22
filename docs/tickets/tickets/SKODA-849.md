# SKODA-849, In-body widget census and handling: Škodapedia glossary spans, HTML packages, embeds, quizzes

- **Epic:** E06, Import Pilot Content
- **Type:** import (coordination ticket with sub-tickets: transformers, parser, run report, a `scripts/` enhancement)
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Must land **before the SKODA-803 bulk run**; after it, about
  300 docs need a re-import for the glossary alone.
- **Estimate:** 2 SP for the shared scope (census completion, the drop count in the run report and gate, quizzes,
  Q-19) · AI-assisted 1d / manual 2d *(planning estimate, not a quote)*. The handling is in sub-tickets: 849a
  glossary 3 SP; 849b HTML packages 3 SP; 849c embeds and widget kinds 4 SP. Total 12 SP: the round-1 findings sum to
  ≈ 7–10 SP (glossary 3–5, packages 2–3, embeds 1, widget kinds 1, quiz export XS), so the earlier 5 SP was below
  them, and round 2 adds ≈ 2–3.5 SP. Not included: the package copy (size unmeasured) and a client-side quiz block
  (Q-19 option b, 3–5 SP in the finding).
- **GitHub issue:** [#426](https://github.com/skoda-storyboard/demo/issues/426) (created 2026-10-21, sub-issue of epic #7)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-C-01 (High, CONFIRMED, browser-checked),
  G-KI-01 (High, CONFIRMED), G-KI-02, G-KI-03, G-KI-05 (Medium, not re-verified), the inventory challenge to G-B-07;
  round 2: G-T4-01 … G-T4-03 (Medium), G-T4-04, G-T4-05, G-T4-06, G-T4-07 (Low), none re-verified.

## Why
Every case below is lost **silently** today: no error, no log line in the run report.
- **Glossary spans (G-C-01, 849a):** `span.term-explain` Škodapedia teasers lose their link; 106 of 3,374 sampled docs.
- **HTML packages (G-KI-01, G-T4-03, 849b):** `ys-embed-share` wraps first-party 360° tours, sliders and animations,
  and `story-flatten.js` drops it as share chrome. 30 package entry URLs in 30 docs, on three origins.
- **Embeds and widgets (G-KI-02, G-KI-05, G-T4-01, G-T4-02, G-T4-04, G-T4-05, G-T4-07, 849c):** 17 iframe hosts, not
  8; core WordPress widgets and `skoda_iframe` have no `WIDGET_KINDS` entry; image maps, art-directed images and the
  charge map (41 stories) have no rule.
- **Quizzes (G-KI-03).** 54 quiz stories by slug (EN 21, CS 22, SR 4, SK 3, SL 3, DE 1). 4 of 4 sampled are
  `.knowledge-test` widgets, 9–14 questions, graded by POST to `/wp-json/skt/result`. `flattenQuiz` keeps a static
  list with no answers. The keys exist only in the WordPress database. By widget, round 2 found 40 quiz posts in 89%
  of the corpus (EN 23, CS 7 of 553 scanned, SK 4, SL 3, SR 2, DE 1), consistent with 54 once the unscanned CS posts
  are added. 2 quizzes (EN, SR) play MP3 clips (G-T4-06).
- **The census is incomplete.** The widget census covered EN + CS (2,773 stories). Round 2 scanned 10,686 of 12,019
  REST docs (89%; not scanned: CS posts 900, EN pages 233, SR posts 200). `SKODA-EN-BLOCK-INVENTORY.md` concluded the
  glossary is "skodapedia-only", so the backlog believed it didn't exist.
- **The gate can't see drops.** SKODA-520's zero-reference gate (all locales via SKODA-523b) passes a page whose
  importer dropped a source reference instead of rewriting it.
- **Positives:** the press-release importer never drops an iframe without a trace and turns row toggles into an
  Accordion; the press-kit parser throws on an iframe it doesn't know.

## Sub-tickets
| Ticket | Scope | SP |
|---|---|--:|
| [SKODA-849a](SKODA-849a.md) | Glossary spans → links to the term page per locale; optional accessible teaser | 3 |
| [SKODA-849b](SKODA-849b.md) | `ys-embed-share` HTML packages: inventory, separate origin, resize contract, audit | 3 |
| [SKODA-849c](SKODA-849c.md) | Embeds per host (17 + X), new widget kinds, image maps, art direction, charge map | 4 |

## Scope (shared, this ticket)
**Client:**
- **Q-19:** keep the interactive HTML as static assets on a separate origin (default), or replace it with a video or
  still image (849b); and keep the 54 quizzes as static lists, rebuild them client-side with the exported keys, or
  retire them with redirects.
- Glossary: an accessible teaser like the source's, or plain links to the term page (849a).

**Team:**
- **Census first.** Finish the in-body census for the 11% not scanned, and make it a per-locale script for all 6
  locales: widget classes, iframe hosts, embed scripts, `span.term-explain`, `.knowledge-test`. Find quizzes by
  widget, not slug. Re-run it before each locale's bulk run (1004a–e).
- **Drop count in the gate:** per page, source references (iframes, embeds, spans, widgets) = embeds and links in the
  output + logged drops. An unknown widget is a failing count in the run report, not a `console.warn`. The run report
  and the SKODA-520 / 523b gate fail on any unexplained difference.
- **Quizzes:** apply the Q-19 answer, including the 2 MP3 clips (keep via 523c's audio kind, or drop). In every case,
  export the `skt` answer keys and result texts before WordPress is deleted (with SKODA-711).

## Not in scope
- Škodapedia term pages, their scope and URLs (SKODA-802 / 206, G-C-02) and the term authoring flow (G-C-07).
- Embed consent placeholders (SKODA-204a) and consent groups (SKODA-907). The MP4 library and documents (SKODA-523).
- A client-side quiz block, if Q-19 picks it: a follow-up ticket. CSP `frame-src` for the package origin: SKODA-714.

## Acceptance criteria
- [ ] The census report covers all 6 locales and 100% of REST docs, with counts per widget kind and embed host;
      0 unknown kinds, or each one listed with its handling.
- [ ] The run report shows source references = output + logged drops per page; a planted unmapped iframe fails it.
- [ ] Q-19 is answered in the register; the quiz keys and result texts are exported and stored outside WordPress
      before SKODA-711 deletes anything.
- [ ] 849a, 849b and 849c are done.

## Dependencies
**Q-19**; G-C-02 (term pages must exist: SKODA-802 / 206). Lands before SKODA-803 and 801b; feeds the 1004a–e runs.
Amends SKODA-801 (widget map), 204 (generic iframe), 520 / 523b (inventory and gate), 504a (S3 prefixes). Needed by
SKODA-711 (exports), 714 (package origin), 907 (hosts kept). Sub-tickets: SKODA-849a, 849b, 849c.
