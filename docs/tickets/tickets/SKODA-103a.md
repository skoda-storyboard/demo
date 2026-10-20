# SKODA-103a, Inbound trailing-slash rule: 301 `/{path}/` to `/{path}` in every locale

- **Epic:** E01, Foundation & Setup
- **Type:** infrastructure (CDN config)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). Must be live **before the DNS switch**.
- **Estimate:** 2 SP · AI-assisted 1d / manual 1–2d, excluding client CDN lead time *(planning estimate, not a quote)*
- **GitHub issue:** to create
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
