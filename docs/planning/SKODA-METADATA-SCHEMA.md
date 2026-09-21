# Škoda Demo — Canonical Metadata Schema (Phase 1 #8)

The metadata contract every imported item must carry so the published query-index can drive every rail
and listing. This is the single source of truth for: the DA page `<head>` meta each importer emits, the
`query.yaml` indexer config submitted to admin.hlx.page, and the filter contract of the rail/listing
blocks (`stories`, `story-rail`, `carousel`, `faceted-listing`).

**Status:** extends the already-live story schema (`blocks/stories/stories.js`,
`tools/importer/query-index-config.yaml`) to the new content types. Story fields are unchanged and
back-compatible; new fields (`tags`, `model`, plus new `template` values) are additive.

## Fields

| Meta name | Type | Required | Purpose / consumed by |
|---|---|---|---|
| `title` | text | yes | card title (og:title) |
| `description` | text | rec. | card summary (meta description) |
| `image` | URL | rec. | card image (og:image) |
| `publisheddate` | ISO `YYYY-MM-DD` | yes | sort key (newest-first) for all rails |
| `category` | slug | stories/PR | positive-include filter for category rails (`emobility`, `lifestyle`, `skoda-world`, `press-releases`, `podcast`) |
| `template` | enum (below) | yes | primary content-type filter for every block |
| `tags` | comma-separated slugs | model-related | model-tag rails ("Based on tags: `peaq`"), tag/model listings; values drawn from the 15-facet taxonomy + model slugs |
| `model` | slug | model items | convenience single-model tag; equals the model slug (also present in `tags`) |

### `template` enum

| Value | Content type | Feeds |
|---|---|---|
| `story` | editorial story article | Latest Stories, category rails, model Stories rail |
| `skoda_model` | model page | Models rails (STO + MR home) |
| `skoda_series` | series hub | Series rail + directory |
| `press_release` | press release | Latest News, MR News feed, `/en/news/`, model News rail |
| `press_kit` | press-kit hub | MR Press Kits rail, model Press Kits rail |
| `image` | image attachment page | Images listing + Images rails |
| `video` | video attachment page | Videos listing + Videos rails |
| `page` | generic/company page | (not indexed for rails; nav/direct only) |

## Query-index consequences

The current `query.yaml` indexes only `/en/stories/**`. It must be widened to index the new content
paths and emit the new properties:

- Add `include` globs: `/en/models/**` (or `/en/skoda-model/**`), `/en/series/**`, `/en/press-releases/**`,
  `/en/press-kits/**`, `/en/images/**`, `/en/videos/**` — mapped to the DA target paths the importer writes.
- Add properties: `tags` (`head > meta[name="tags"]`), `model` (`head > meta[name="model"]`).
- Keep one shared `target: /en/query-index.json` so all blocks read one index (they already memoize the
  fetch via `scripts/query-index.js`).

## Block filter-contract changes (Phase 2)

- **`story-rail`** currently hardcodes `template === 'story'` and filters only `category`. Extend to accept
  an optional `template` config row (default `story`) and an optional `tags` config row (OR-match against
  the entry's `tags`), so one block powers category rails **and** model-tag rails **and** Models/Series
  rails. Keep the dedupe-against-shown behaviour.
- **`stories`** already supports `category`/`exclude`/`excludecategory`/`offset`/`limit` + load-more.
  Add an optional `template` row (default `story`) and optional `tags` row so it can also drive the
  MR News feed and paginated listings.
- **`carousel`** stays presentation-only; rails build it via `buildBlock` (existing pattern).

## Author-facing (DA library plugins, already POC'd)

`poc/tag-multiselect/` writes a `Tags` block from the 15-facet taxonomy; `poc/stories-tag/` writes a
`stories` block pre-filtered by category. These are the authoring surface for the `tags`/`category`
fields — no App Builder. Production can swap the hardcoded lists for a governed DA sheet fetch.

## The 15-facet taxonomy (from `poc/tag-multiselect/taxonomy.js`)

`model, bodywork, derivative, motorsport, equipment, technology, years, view, company, concept,
environment, happening, history, sponsorship, vip` — plus model slugs (`peaq`, `elroq`, `enyaq-iv-2`,
`epiq`, `octavia`, `scala`, `kamiq`, `karoq-6`, `new-fabia`, `new-kodiaq`, `new-superb`) used as `tags`
values for the model-tag rails.
