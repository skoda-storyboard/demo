# SKODA-818, Story flatten: `lite-youtube` video imported as broken "Play" links
- **Epic:** E08, Editorial at Scale
- **Type:** import (importer only; the block is SKODA-204 / PR #109)
- **Phase:** A/B · **Milestone:** M1 (demo story fidelity)
- **GitHub issue:** [#121](https://github.com/skoda-storyboard/demo/issues/121)
- **Estimate:** 1 SP · AI-assisted 0.25–0.5d / manual 0.5–1d *(planning estimate, not a quote)*
- **Status (2026-09-25):** ✅ **Done, QA accepted.** Importer merged in PR #113 (commit `e763378`); embed block
  merged in PR #109; the Epiq player is verified (#121 closed).

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
- [x] Re-imported Epiq story has one `<p><a href="https://www.youtube.com/watch?v=1Y3QHmZeLxk">…</a></p>` in place of the video, with no poster, "Play" text or nocookie links.
- [x] With PR #109 merged: renders one 16:9 YouTube embed at column width.
- [x] Unit test in `skoda-story-importer.test.mjs` (lite-youtube → bare URL paragraph).

## QA (2026-09-25)
- Published Epiq `.plain.html` contains exactly one canonical watch-URL paragraph and no
  `lite-youtube`, `youtube-nocookie`, consent shell, or stray "Play".
- On the `main` preview at 1440px, the article renders exactly one loaded YouTube embed with
  iframe `https://www.youtube.com/embed/1Y3QHmZeLxk?feature=oembed&enablejsapi=1`,
  measuring 736 × 414px (16:9, full article-column width). At 768px it measures 448 × 252px;
  at the browser's 500px minimum viewport it measures 452 × 254px, with no horizontal overflow.
- The native YouTube player is visible in the browser; all 11 story-importer tests pass
  (including the lite-youtube and YouTube/Vimeo iframe cases).

## Dependencies
SKODA-204 / PR #109 (embed block + autoblock), SKODA-801.
