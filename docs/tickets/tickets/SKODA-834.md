# SKODA-834, Widget autoblock: only same-origin `/widgets/` links, never insert a failed response
- **Epic:** E02, Core Blocks (runtime follow-up from the PR #253 / SKODA-828 review)
- **Type:** runtime fix (`scripts/scripts.js`, `blocks/widget`)
- **Phase:** A · **Milestone:** M1 (15 Oct demo)
- **Renumbered (2026-10-07):** registered as SKODA-830 in PR #257, which collided with the story-import ticket
  [SKODA-830](SKODA-830.md) (#259, PR #269). This one moved to SKODA-834; the branch name `skoda-830-widget-origin` is historical.
- **GitHub issue:** [#256](https://github.com/skoda-storyboard/demo/issues/256)
- **Estimate:** 1 SP · AI-assisted 0.25–0.5d / manual 0.5–1d *(planning estimate, not a quote)*
- **Status (2026-10-06):** 🔵 TODO

## Origin
Raised in the PR #253 (SKODA-828) review: the 9 overlay press kits now join the M1 URL set
(`docs/planning/skoda-m1-url-set.txt`), and 6 of them carry an external Twitter link that the widget runtime treats as a
local widget. The bug was already on `main` and isn't caused by PR #253.

## Problem (measured on `main`, 2026-10-06)
- `buildWidgetAutoBlocks` (`scripts/scripts.js`) selects every `a[href*="/widgets/"]`, whatever its origin.
- The 6 kits link `https://platform.twitter.com/widgets/widget_iframe.1227a5674072e080ffb1ba14ac0c1079.html?origin=…`:
  `4x4-winter-experience-press-kit`, `press-kit-skoda-at-the-iaa-2019`, `skoda-octavia-press-kit`,
  `skoda-octavia-press-kit-2`, `skoda-octavia-rs-and-octavia-scout-press-kit`, `skoda-rs-experience-press-kit`.
- `blocks/widget/widget.js` keeps only the pathname and loads `/widgets/widget_iframe.html|css|js` from this site.
  All three are **404**. `widget.innerHTML = await resp.text()` doesn't check `resp.ok`, so it inserts the site's 404
  document (with the "Page not found" text, `window.isErrorPage = true` and a header/h1). On
  `/en/press-kits/skoda-octavia-press-kit` at 1440×900 that is a `.widget.widget_iframe` box of 1440×900.

## Scope
- **Autoblock:** resolve each link with `new URL(href, window.location.href)`. Build a widget only when its origin equals
  `window.location.origin` and its pathname starts with `/widgets/`. Leave other links (e.g. platform.twitter.com) as
  ordinary links.
- **Block:** reject non-OK responses (`!resp.ok`) before inserting any HTML. On failure, keep the authored link (or
  remove the empty block) and log the error as today; never insert a fetched error document.
- **Tests (regression):**
  - an external Twitter `/widgets/` link isn't turned into a widget;
  - a same-origin `/widgets/x/y.html` link still is;
  - a failed local-widget response (404) inserts no HTML and doesn't load the widget's CSS/JS.
- **Out of scope:** what the Twitter timeline should become in content (an embed, a link or dropped) belongs to the
  press-kit import (SKODA-805c). Re-importing may remove the links, but it doesn't fix the runtime.

## Acceptance Criteria
- [ ] On the 6 kits listed above, no request to `/widgets/widget_iframe.*` and no "Page not found" text in `main`
      (branch preview, 1440 and 375).
- [ ] Existing same-origin widgets still render unchanged (spot check every page in the M1 URL set that has a local
      `/widgets/` link).
- [ ] The 3 regression tests above pass; `npm test` and `npm run lint` are clean (apart from known `main` failures,
      listed in the PR).
- [ ] PR with a `{branch}--demo--skoda-storyboard.aem.page` link to `/en/press-kits/skoda-octavia-press-kit`.

## Dependencies
- SKODA-828 (#196, PR #253): adds the 9 kits to M1; the review that found this.
- SKODA-805c (press-kit children import): the content-side decision on the Twitter links.
- Collision: `scripts/scripts.js` is shared; serialise with any open PR touching `buildAutoBlocks`.
