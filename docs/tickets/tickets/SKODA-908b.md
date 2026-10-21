# SKODA-908b, RSS delivery at cutover: mechanism, content type, refresh on publish, slash rule, feed decisions

- **Epic:** E09, Dynamic Services
- **Type:** integration / cutover (feed delivery on the production edge; amends SKODA-405)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The 5 subscribed feed URLs must answer on the day of the
  DNS switch.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d, excluding the D14 decision *(planning estimate, not a quote)*.
  From the review: G-KJ-06 +2–3 SP; G-T3-03 is inside delivery (+0 SP, a 1 h test). Feed generation, the feed set,
  full text and guids are sized in SKODA-405 (amended 2026-10-21).
- **GitHub issue:** [#453](https://github.com/skoda-storyboard/demo/issues/453) (created 2026-10-21, sub-issue of #424)
- **Parent:** SKODA-908
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KJ-06, G-B-03, G-T3-03 (Medium, not
  re-verified).

## Why
- 405 generates RSS and leaves delivery to "a separate human/infra step" that no ticket owns. EDS doesn't serve
  query-index as RSS; the demo 404s all 4 probed feed paths.
- Feedly counts 356 subscribers on 5 URLs; other readers show only in the www logs:

  | Feed URL | Feedly subscribers |
  |---|--:|
  | `/en/feed/` | 236 |
  | `/en/press-releases/feed/` (302 to `?post_type=press_release` on the source; footer link) | 94 |
  | `/cs/feed/` | 12 |
  | `/en/feed/?post_type=press_release` | 12 |
  | `/de/feed/` | 2 |

- The source feeds are full text (`content:encoded`, 10/10 items, 139 CDN images in the EN feed), and
  `/en/feed/atom/`, `/en/feed/rdf/`, `?post_type=press_kit` and `/en/skodapedia/feed/` also answer 200.
- The 103a slash rule would 301 `/en/feed/` to `/en/feed`.
- WordPress guids are `?p=<id>`; SKODA-405 now carries them, so Feedly doesn't re-receive old items (G-T6-03).

## Scope
- **T5 Delivery (amends SKODA-405).** Pick the mechanism: an edge worker on the production CDN (default, per D14 /
  SKODA-709), an App Builder route, or a file republished on every publish. Set the content type and the refresh on
  publish. Exempt the feed routes from the 103a slash rule, or test the 2-hop chain.
- **T6 Feed decisions (SKODA-405 builds them).** Summary vs full text; images from the DAM, not the source CDN.
  Per-locale and release feeds; press-kit and Škodapedia feeds or redirect rows; `/feed/atom/` and `/feed/rdf/` 301
  to the RSS URL.
- **Consumers:** the C4 answers (and C5, skodamedia.com, if it reads a feed) join the launch test.

## Not in scope
- Generating the feeds, the post-id guids and the importer field: SKODA-405. CDN set-up: SKODA-709.

## Acceptance criteria
- [ ] The 5 feed URLs (and `/en/press-releases/feed` slashless) answer 200 `application/rss+xml` or one 301 to the
      EDS feed; a new item appears within the agreed refresh time; Feedly refreshes after the switch.
- [ ] `/en/feed/atom/`, `/en/feed/rdf/`, press-kit and Škodapedia feed URLs answer 200 or 301; none 404s.
- [ ] The first EDS `/en/feed/` shows Feedly no old item as new (guids per SKODA-405).
- [ ] The T6 decisions are recorded in SKODA-405.

## Dependencies
D14 (CDN). SKODA-908 (parent), 405 (generator, guids), 709 (edge worker host), 103a (slash order), 710 (runbook),
710b (register), 850a (refresh order after a timed publish).
