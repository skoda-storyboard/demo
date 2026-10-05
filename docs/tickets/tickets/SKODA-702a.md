# SKODA-702a, Epiq story performance: YouTube click-to-load facade (desktop TBT)
- **Epic:** E07, QA, Perf, A11y & Launch (follow-up to SKODA-702, #42)
- **Type:** performance + source parity
- **Phase:** A · **Milestone:** M1 (15 Oct demo)
- **GitHub issue:** [#239](https://github.com/skoda-storyboard/demo/issues/239) (sub-issue of #42)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-10-01):** 🔵 TODO

## Origin
The `aem-psi-check` failed on PR #232 (SKODA-303) with **Lighthouse 74** on the **desktop** Epiq story
(`/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds`, TBT about 570ms).
- In the same run, the page scores 98 on mobile (TBT 100ms), and every other page scores 96–100.
- The failure isn't caused by PR #232: `main` scores the same or worse (see below).

## Problem (measured 2026-10-01)
**Local Lighthouse 12, desktop preset, three runs each, interleaved** (the Google PSI API was over its daily quota):

| Run | `main`: score / TBT | PR #232 branch: score / TBT |
|---|---|---|
| 1 | 69 / 1,090ms | 88 / 240ms |
| 2 | 64 / 1,810ms | 71 / 710ms |
| 3 | 66 / 1,930ms | 70 / 870ms |

**The YouTube player boots during page load.**
- The story's video (`1Y3QHmZeLxk`) is an `embed` block right under the hero: y977 at 1350×940, y737 at 412×823.
- `observeLazyEmbed` (`blocks/embed/embed.js`) promotes `data-src` → `src` within `rootMargin: 200px`, so on this
  page it fires on load, at every width.
- Result: a full `youtube.com/embed/…?enablejsapi=1` iframe, **10 requests, about 1,050 KB** of the page's 2.4 MB
  (92 requests, 32 scripts), and most of the long tasks.
  - The long tasks run 260–440ms each. Most are "unattributable", which is typical for in-iframe work. The
    attributed ones are `embed.js` 438ms, `gallery.js` 290ms and the page's own inline work.
- LCP isn't affected: 0.6–1.1s, on the hero image.

**The live site doesn't do this.**
- The same story renders `<lite-youtube videoid="1Y3QHmZeLxk" params="enablejsapi=1">`: the poster
  `i.ytimg.com/vi/1Y3QHmZeLxk/maxresdefault.jpg` plus a play button.
- It loads **no** YouTube iframe and makes **one** request (the poster) until the visitor clicks.
- So EDS is both slower and different from the source here. SKODA-818 turned `lite-youtube` into a bare YouTube URL
  for the embed autoblock and lost the facade.

**Secondary: three `Gallery (slider)` blocks** (y1529 / 2365 / 3178 at 1350×940).
- `gallery.js` shows up as a 290ms long task in one run.
- Check whether the sliders build, or decode their images, before they're near the viewport.

## Scope
- **YouTube facade** in the `embed` block, as on the source `lite-youtube`:
  - render the poster (`i.ytimg.com/vi/{id}/maxresdefault.jpg`, with the `hqdefault` fallback) and a play button, in
    the same 16:9 box, so there's no CLS;
  - create the iframe only on click, with `autoplay=1`, so one click plays;
  - accessible: a real `<button>` named "Play video: {title}", focus kept, and the iframe gets focus after the swap.
- Keep the poster's visual identical to the live facade (play-button glyph, size, hover).
- **Vimeo and the other providers** keep today's lazy iframe unless the same facade is cheap (decide in implementation).
- **Coordinate with SKODA-204a (#215)**, which adds the consent click-to-load gate in `embed.js`:
  - the facade and the consent placeholder must be one click, not two (with consent, the play click loads the
    player; without consent, the consent gate shows first);
  - **land after #215** (same file; collision rule).
- **Sliders:** confirm they build and decode only when near the viewport; fix it if not.

## Acceptance Criteria
- [ ] Epiq story, desktop (Lighthouse desktop preset, median of 3): **TBT < 200ms**, performance **≥ 90** (`aem-psi-check`
      green), with **0 YouTube requests** before interaction apart from the poster image.
- [ ] Mobile stays at least 95; LCP stays on the hero image; CLS stays below 0.01 (the poster box keeps 16:9).
- [ ] Click (or Enter / Space on the play button) loads and plays the video in place; keyboard focus and the
      accessible name are correct; the poster matches the live `lite-youtube` (side-by-side screenshot at 1280 / 390).
- [ ] With consent declined (`?consent=decline`, SKODA-204a), no YouTube request at all until consent, then one click
      plays.
- [ ] Other embeds (Vimeo, Buzzsprout, generic iframes) and the in-body sliders unchanged, or measured better.
- [ ] `npm run lint` and `npm test` pass; PR with before/after PSI links for the Epiq story (desktop + mobile).

## Dependencies
- SKODA-702 (#42, the parent performance ticket); SKODA-204a (#215, consent click-to-load hook, same file, land
  first); SKODA-818 (the story YouTube embed autoblock).
- Related: SKODA-704 / 804 (the consent stub → OneTrust).

## Risks / Flags
- YouTube `maxresdefault.jpg` doesn't exist for every video. Use the `hqdefault` fallback on poster load error.
- The facade adds a click before playback on iOS. Pass `autoplay=1` on the iframe created by the click (the same
  trade-off as the source).
