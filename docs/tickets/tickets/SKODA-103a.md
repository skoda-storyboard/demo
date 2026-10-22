# SKODA-103a, Inbound trailing-slash rule: 301 `/{path}/` to `/{path}` in every locale

- **Epic:** E01, Foundation & Setup
- **Type:** infrastructure (CDN config)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Must be live **before the DNS switch**.
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d, excluding client CDN lead time *(planning estimate, not a quote)*
- **GitHub issue:** [#402](https://github.com/skoda-storyboard/demo/issues/402) (created 2026-10-20)
- **Status (2026-10-20):** 🔵 TODO (M2), no owner. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-X-01, L-X-06.

## Why
- **Every legacy URL ends in a slash.** On the source, 68 of 68 sampled canonicals are slashed, and the slashless
  locale homes (`/en`, `/cs`, …) 301 to the slashed form.
- **EDS 404s the slashed form.** On the demo, `/en/` and `/en/media-room/` return 404, while `/en/media-room` returns
  200.
- **The redirects sheet can't help.** It matches exact paths, so covering the ≈ 15,000 indexed URLs (3,216 EN and
  8,803 non-EN REST items, plus press kits, Škodapedia and archives) would need one row each.
- **Who is affected:** bookmarks, search results, backlinks and the source's own RSS links would all land on 404s
  after the switch.

SKODA-609 removed the slash from links *inside* our content; nothing handles inbound requests.

## Scope
- **CDN rule:** on the production CDN in front of aem.live (Adobe-managed or BYO, per D14), any `GET`/`HEAD` path
  that ends in `/` (except `/` itself) gets a 301 to the same path without the slash. The query string is kept.
- **Order:** the slash rule runs **before** the redirects sheet, so sheet rows are written slashless only. The root
  stays with SKODA-1003 (Accept-Language), and its targets are slashless (`/cs`, not `/cs/`).
- **Exclusions:** the API and asset paths that EDS serves as-is (`/media_*`, `*.json`, `/blocks/`, `/scripts/`,
  `/styles/`, `/icons/`, `/fonts/`), and none of them takes a slash.
- **Single hop:** a slashed legacy URL that also has a redirect row (e.g. `/sk/press_kit/x/`) reaches its final
  target in at most 2 hops: slash rule, then sheet row. Document the chain.
- **Test list:** 50 slashed URLs, 10 per locale (homes, stories, releases, press kits, archives), kept with the CDN
  config.

## Acceptance criteria
- [ ] On the production host, `/en/`, `/cs/`, `/de/`, `/sk/`, `/sr/` and `/sl/` 301 to the slashless form, and their
      targets 200.
- [ ] The 50 test URLs end in a 200 after at most 2 hops; none 404s.
- [ ] `/en/media-room/?filter=x` keeps the query string.
- [ ] `/media_*`, `/query-index.json`, `/scripts/*` and `/blocks/*` are unaffected.

## Dependencies
D14 (which CDN), SKODA-103 (redirects sheet), SKODA-1003 (root routing), SKODA-609 (internal links). Needed by
SKODA-1004a–e QA.

## Amendment (2026-10-21, M2 gap review)
Source: [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.6, round 2.

**Why (G-T7-02, Medium, not re-verified):** WordPress matches slugs case-insensitively, and Polylang adds the default
`/en/`. On the source, `/EN/EMOBILITY/MEET-THE-PEAQ-INTUITIVE-AND-COMFORTABLE-CONTROLS/` and
`/emobility/meet-the-peaq-intuitive-and-comfortable-controls/` both 301 to the lowercase `/en/…` page; on the demo the
uppercase, a mixed-case and the locale-less path all 404 (3 of 3). Uppercase links come from print, PDFs and social
posts: 3 of the 161 archived EN release 301 URLs are all-caps. No ticket has a case rule.

**Added scope:**
- **Lowercase rule** (G-T7-02): any `GET`/`HEAD` page path containing `[A-Z]` gets a 301 to the lowercase path,
  query string kept. It runs before the slash rule and in the same hop, so a slashed uppercase URL still reaches its
  final target in at most 2 hops.
- **Exclusions** (G-T7-02): `/media_*`, `/direct-download/*` and paths with a file extension (CDN file names are
  case-sensitive), plus the existing API and asset exclusions.
- **Locale-less paths** (G-T7-02): the rule that treats a non-locale first segment as `en` is SKODA-103b T4; this
  ticket's test list covers the chain end to end.
- **Test list** (G-T7-02): add uppercase cases (the 3 all-caps archived release URLs and a mixed-case path) and
  locale-less cases to the 50 URLs.

**Added acceptance criteria:**
- [ ] `/EN/EMOBILITY/MEET-THE-PEAQ-INTUITIVE-AND-COMFORTABLE-CONTROLS/` and a mixed-case variant end on
      `/en/emobility/meet-the-peaq-intuitive-and-comfortable-controls` with a 200 in at most 2 hops (G-T7-02).
- [ ] `/emobility/meet-the-peaq-intuitive-and-comfortable-controls/` ends on the same page in at most 2 hops, once
      SKODA-103b's locale-less rule is live (G-T7-02).
- [ ] A `/media_*` path and a `/direct-download/` path with uppercase letters, and a file with an uppercase name, are
      not rewritten (G-T7-02).

**Estimate after this amendment:** 2.5 SP · AI-assisted 1–1.5d / manual 2d, excluding client CDN lead time
*(planning estimate, not a quote)*. The review adds +0.5 SP for the case rule.

**Added dependencies:** SKODA-103b T4 (locale-less lookup), SKODA-713 (harness), SKODA-709 (production CDN).
