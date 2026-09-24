# SKODA-818, Story flatten: `lite-youtube` video imported as broken "Play" links
- **Epic:** E08, Editorial at Scale
- **Type:** import (importer only; the block is SKODA-204 / PR #109)
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **Estimate:** 1 SP · AI-assisted 0.25–0.5d / manual 0.5–1d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO (blocked on PR #109 merge for rendering; importer can land first)
  **Update (late 2026-09-24):** 🟢 importer merged in PR #113 (commit `e763378`). What remains is the render check
  once #109 merges.

## Origin
Side-by-side QA of `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/` (1440, 2026-09-24).

## Problem (measured)
Source: a YouTube player (16:9, in the 819px column) behind the third-party consent notice.
EDS: a poster `<picture>`, a stray "Play" text node and **two raw "Play" links** to
`youtube-nocookie.com/embed/…?autoplay=1`. There is no player, and clicking leaves the page.

## Cause
The source `sow-editor` widget contains `<lite-youtube videoid="1Y3QHmZeLxk">` plus a
`.page-embed.yt-embed-cookie` consent shell. The importer captures lite-youtube's hydrated DOM
(poster + play buttons) as rich text instead of the video ID.

## Scope (importer only)
- `tools/importer/parsers/story-flatten.js` (or the story cleanup, beforeTransform): replace each
  `lite-youtube[videoid]` with a paragraph holding **only** the bare URL
  `https://www.youtube.com/watch?v=<videoid>`. Remove the `.page-embed` consent shell.
- That matches the **SKODA-204 embed block contract (PR #109, branch `skoda-204-embeds`)**:
  `buildEmbedAutoBlocks` turns a bare provider URL on its own line into an `embed` block. No block
  code in this ticket.
- Also cover plain `iframe[src*="youtube"]` / `iframe[src*="vimeo"]` in bodies (same bare-URL output).

## Acceptance Criteria
- [ ] Re-imported Epiq story has one `<p><a href="https://www.youtube.com/watch?v=1Y3QHmZeLxk">…</a></p>` in place of the video, with no poster, "Play" text or nocookie links.
- [ ] With PR #109 merged: renders one 16:9 YouTube embed at column width.
- [ ] Unit test in `story-flatten.test.mjs` (lite-youtube → bare URL paragraph).

## Dependencies
SKODA-204 / PR #109 (embed block + autoblock), SKODA-801.
