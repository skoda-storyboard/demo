# SKODA-702a, Epiq story performance: YouTube click-to-load facade (desktop TBT)
- **Epic:** E07, QA, Perf, A11y & Launch (follow-up to SKODA-702, #42)
- **Type:** performance + source parity
- **Phase:** A · **Milestone:** M1 (15 Oct demo)
- **GitHub issue:** [#239](https://github.com/skoda-storyboard/demo/issues/239) (sub-issue of #42)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status:** 🟡 built 2026-10-06, see below (was 🔵 TODO 2026-10-01)

## Status (2026-10-06): 🟡 built on branch `skoda-702a-youtube-facade` (local)
**Measured on the live `lite-youtube`** (Epiq story; after the OneTrust banner and the "I acknowledge and confirm"
notice, which hide it until then):
- The poster `i.ytimg.com/vi/{id}/maxresdefault.jpg` covers the 16:9 box on black.
- A 99px top shade (`lite-youtube::before`).
- The 68×48 YouTube glyph, centred, grayscale until hover / focus.
- The whole box is one button, named "Play". There's no focus ring, and focus stays on the page after the click.
- The click loads `youtube.com/embed/{id}?enablejsapi=1&autoplay=1&playsinline=1`.
- Before the click, there's one request: the poster.

**Built.**
- **`blocks/embed/embed.js`:** YouTube renders a poster button (`.embed-play`: an `<img alt="">` poster plus the glyph) in place of the iframe.
  - The click swaps in the player with `autoplay=1&playsinline=1` and moves focus into it.
  - The poster falls back to `hqdefault` once, when `maxresdefault` errors or is YouTube's 120×90 placeholder.
  - The accessible name is "Play video: {title}", or "Play YouTube video" for a bare-URL embed. Its only label is the generic "YouTube video", and the real title would cost a YouTube request.
- **Consent (SKODA-204a):** with consent declined, nothing reaches YouTube, not even the poster.
  - "I acknowledge and confirm" loads **and plays** the video, in one click.
  - A grant through the hook shows the poster, and keyboard focus moves to it.
  - If consent is withdrawn after the poster showed, its click shows the placeholder (focused) instead of loading YouTube.
- **Video ids are validated** (`[A-Za-z0-9_-]`, first path segment for `youtu.be`). A malformed id (a `/`, `#` or quote in `v=`) is rejected like any invalid embed URL, with a console warning and nothing rendered. Before, it built a broken player URL.
- **Unchanged:** Vimeo, Buzzsprout, Spotify, MP4 and generic embeds. Vimeo has no thumbnail without an API request, so a facade isn't cheap there.
- **`embed.css` + `icons/youtube-play.svg`:** the live glyph, shade and states.
  - The focus ring (2px, offset 2px, as the consent button) is drawn on the media box, whose `overflow` would clip a ring around the button. It's `currentcolor`: ink in the light story body, white in a dark section.
  - Reduced motion drops the glyph transition.

**Verified (local, branch vs `main`, same dev server):**
- **Poster geometry** equals live at 390 / 768 / 992 / 1080 / 1280: 370×208.1, 498.7×280.5, 648×364.5, 706.7×397.5 and 818.7×460.5, with the glyph centred.
- **Lighthouse 12** (interleaved, 3 runs each, median):

  | Run | `main` | Branch |
  |---|---|---|
  | Desktop score / TBT | 99 / 0ms | 99 / 0ms |
  | Desktop weight | 2,473 KB, 99 requests | **1,509 KB, 85 requests** |
  | YouTube on load | 8 requests, 1,027 KB | **1 request (the 142 KB poster)** |
  | Mobile score | 98 | 97 (TBT 0–290ms on both, noise) |
  | LCP | hero image | hero image |

  This machine scores `main` far higher than the 2026-10-01 runs did, so the **`aem-psi-check` on the PR is the deciding gate** for the desktop ≥ 90 / TBT < 200ms criterion.
- **Keyboard:** Tab reaches the poster (the ring shows, the glyph turns red), and Enter (1280) / Space (390) plays it, with focus in the player.
- **Other pages** (scrolled end to end, YouTube player requests `main` → branch):
  - 2024 year-in-review: 11 posters, 93 → 0 requests. Its Vimeo is unchanged.
  - Motorsport press-kit videos: 6 posters, 54 → 0. Its 11 MP4s are unchanged.
  - RS four ways: 2 posters, 23 → 0.
  - Park-your-Škoda: 1 poster, 9 → 0, plus 2 Vimeo unchanged.
  - Octavia 30 (Vimeo + Buzzsprout) and Enyaq gaming (MP4) are identical to `main`.
  - No script errors.
- **Sliders (secondary):** no change needed.
  - All images are `loading="lazy"`.
  - At 1350×940 only the first slider (y1529, inside Chrome's lazy margin) fetches images (5 of 7); the 2nd/3rd fetch none.
  - Autoplay pauses offscreen.
  - With the poster there are no long tasks during load.
- **Spacing and fonts vs live** (390 / 768 / 992 / 1080 / 1280): the poster box and x match, the gap above is 20px on both, and the paragraphs around it are Škoda Next 16/24 w400 ink on both. The poster has no visible text, as on live.
- **Accessibility:** the accessibility tree shows one `button "Play YouTube video"`, with the poster image decorative (`alt=""`). The whole box is the touch target, and the focus ring is visible.
- **Tests:** `embed.test.mjs` 43/43. 12 are new or reworked:
  - the poster, the fallback and the second click;
  - consent then play, a grant through the hook, and consent withdrawn after the poster;
  - multiple instances, Shorts, `list=` / extra `youtu.be` segments, and rejected malformed ids.

  The test DOM now honours `{ once: true }`. `npm run lint` is clean.
  - Outside this change, failing the same on `main`: `header-locales` (SKODA-303a), and `media-cart-download` / `media-lib` (this machine's missing `fflate` and temp-dir cleanup).

**Notes.**
- **CLS < 0.01 (AC 2) can't be ticked by this ticket.** The mobile Epiq story is 0.066–0.070 on `main` **and** the branch. The shift is the header brand and the hero caption at start-up (SKODA-828, PR #253), not the poster, whose 16:9 box adds no shift. Desktop is 0.004–0.008.
- **AC 3 "side-by-side screenshot":** replaced by the measured geometry above, per the AGENTS.md review protocol (measured values, no screenshots).
- **Spacing below the video** (story import fidelity, not this block): live has 24px between the video and the next paragraph from 768 up; `main` and the branch have 0.
  - On live it's an authored SiteOrigin spacer widget (`so-widget-skoda-offset`, 24px tall at ≥ 768, none at 390) that the story import doesn't carry over.
  - Belongs with the story-body fidelity work (SKODA-801a).
- **The Oliver Solberg press release** (`/en/press-releases/when-driving-fun-meets-comfort-rally-ace-oliver-solberg-tests-the-skoda-octavia-rs`) still has the SKODA-818 problem: the video was imported as a poster `<picture>` plus "Play" links to `youtube-nocookie.com/embed/…`.
  - SKODA-818 fixed the story importer only, not the press-release importer.
  - It's the same on `main`, and it isn't an embed block, so this change doesn't affect it.
- **Playlists** (`/embed/videoseries?list=…`): `list` was already dropped on `main`, so the player shows "unavailable". With the poster, the box shows black and the glyph, because there's no thumbnail. No migrated page uses a playlist.
- **iOS:** autoplay inside the swapped-in player may still need a second tap, the same trade-off as live.
- **Language:** the "Play" label is English, like the rest of the M1 chrome. Locale copy belongs to SKODA-1001.

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
