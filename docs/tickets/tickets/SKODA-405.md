# SKODA-405, RSS feed generation (query-index → RSS 2.0)
- **Epic:** E04, Listings & Search
- **Type:** integration · **Phase:** A · **Pilot:** stretch · **Milestone:** ~~M1~~ **M2**, aligned to the board (GitHub #52) on 2026-09-25, per the M1 gap review §7/§11
- **Estimate:** ~2 SP

## Summary
Generate an RSS 2.0 feed from the per-locale query-index (footer link continuity, requirements §9). Top autonomous-agent eval pick: a machine-readable output with a public-standard oracle and zero visual judgment.

## Acceptance Criteria
- [ ] Feed passes the W3C Feed Validator / RSS 2.0 schema.
- [ ] Item count == filtered query-index rows; per-item fields diff clean vs the index.
- [ ] pubDate is RFC-822; links resolve (no 404/loop).

## Dependencies
- Upstream: SKODA-401 (query-index). Generation has no other deps.
- Delivery (/en/feed/ content-type / edge function) is a separate human/infra step.

## Agent handoff
agent-fit + first agent-eval pick (handoff candidate A1): success == a green validator run.

## M2 readiness review (2026-10-15)
- **Output paths to keep:** the source footer links **`/en/feed/`** (RSS) and **`/en/press-releases/feed/`**, which 302s to `/en/feed/?post_type=press_release`. Both are on every page. The EDS feeds need these URLs, or redirect rows from them, so existing subscribers keep working.
- Census: [coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §3.

## Amendment (2026-10-21, M2 gap review)
Source: [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2 and §7.6.
- **Estimate (amended):** 4 SP · AI-assisted 1.5–2d / manual 3–4d *(planning estimate, not a quote)*. ~2 SP above,
  plus 1–1.5 SP for the feed set and full text (G-B-03), plus 0.5–1 SP for the post-id guid and its metadata field
  (G-T6-03). Delivery stays with SKODA-908 T5 (G-KJ-06, +2–3 SP there).

**Added scope:**
- **Feed set (G-B-03, G-T3-03).** Generate the per-locale feeds for the locales live at go-live (Feedly counts
  `/en/feed/` 236, `/cs/feed/` 12, `/de/feed/` 2 subscribers; DE timing per Q-7) and the release feed
  (`/en/press-releases/feed/` 94, `/en/feed/?post_type=press_release` 12). The press-kit feed
  (`/en/feed/?post_type=press_kit`) and the Škodapedia feed (`/en/skodapedia/feed/`) also answer 200 on the source:
  generate them, or record redirect rows, as SKODA-908 T6 decides. `/feed/atom/` and `/feed/rdf/` 301 to the RSS
  URL (908 T6), so no Atom or RDF output is needed.
- **Content (G-B-03).** The source feeds carry the full article in `content:encoded` (10 of 10 items, 139 `<img>`
  tags on the source CDN in the EN feed). Build the mode 908 T6 decides: summary from the index, or full text from
  each item's page. Image URLs come from the DAM or Media Bus, never `cdn.skoda-storyboard.com`.
- **Item identity (G-T6-03, Medium).** WordPress guids are `https://www.skoda-storyboard.com/?p=<id>`
  (`isPermaLink="false"`, 10 of 10 items). The EDS index (24 columns) and page meta carry no source post id. The
  importers write the post id to page metadata (e.g. `source-id`), the index carries it, and the feed emits the
  WordPress guid for migrated items and a stable path guid for new ones. Otherwise Feedly's 356 subscribers and any
  RSS-driven mail or app get old items again on switch day. Re-import the field with SKODA-710's delta import.
- **Delivery (G-KJ-06).** Not in this ticket: SKODA-908 T5 owns the mechanism, the content type, the refresh on
  publish and the slash-rule exemption. This ticket hands T5 one generator per feed and its output path.

**Added acceptance criteria:**
- [ ] Every feed in the set passes the W3C Feed Validator; item counts and fields match its filtered index rows
      (G-B-03).
- [ ] The first EDS `/en/feed/` carries the same 10 guids as the last WordPress `/en/feed/` (G-T6-03).
- [ ] Every migrated EN and CS index row has a source post id; a new item's guid doesn't change on re-publish
      (G-T6-03).
- [ ] No feed item contains a `cdn.skoda-storyboard.com` URL; in full-text mode every item has `content:encoded`
      (G-B-03).
- [ ] The generator output paths are documented for SKODA-908 T5 (G-KJ-06).
- **Dependencies (added):** SKODA-908 (T5 delivery, T6 content decisions), the story, release, press-kit and
  Škodapedia importers (post id field), 401/402 (index column), 710 (delta import), 103b (`?p=` routes).
