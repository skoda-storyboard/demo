# Component Spec: Embeds (video / audio / social)

Status: **CAPTURED** (measured 2026-09-15 via Chrome DevTools MCP + source CSS
`media-room-515d2d102b.css`; lazy swap + consent verified live; screenshot saved).
Foundations: [`_FOUNDATIONS.md`](_FOUNDATIONS.md). Method: [`_CAPTURE-PROTOCOL.md`](_CAPTURE-PROTOCOL.md).

## 1. Identity

- **Component:** Responsive third-party embed (Vimeo / YouTube video, Buzzsprout / Spotify audio,
  and social) inside a fixed-aspect, lazy-loaded, consent-gated wrapper.
- **EDS block(s):** the `/widgets/` autoblock -> `widget` block (`blocks/widget/*`, auto-built by
  `buildWidgetAutoBlocks` in `scripts/scripts.js`), or a dedicated `embed` block. No embed-specific
  block exists yet.
- **Client PDF IDs:** STO-D03 (Story embedded media); MR-PR03 / MR-PR06 (press-release video / podcast);
  MR-V03 (Video detail embed).
- **Ticket:** SKODA-204.
- **Source reference:** Vimeo video on
  `https://www.skoda-storyboard.com/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon/`
  (also carries a Buzzsprout podcast); Buzzsprout on the Superb-25-years press release.
- **Top-level selectors:** `.video-container` (video iframe wrapper), `.embed-controller-wrapper`
  (lazy audio/embed wrapper), `.ratio-container.ratio-16x9 > iframe` (aspect wrapper),
  `.page-embed_cookie` (consent placeholder), OneTrust `.otPcCenter` / `.ot-*` (consent manager).

## 2. Source anatomy

```
# Video (Vimeo) - verified live, iframe present with ?dnt=1
.entry-content > .columns > .column-primary
└── .media-cart-item.attachment
    └── .video-container            (position:relative; padding-bottom:56.25%; overflow:hidden)
        └── iframe[src="https://player.vimeo.com/video/…?dnt=1&app_id=122963"]
                   (position:absolute; inset:0; width/height:100%; allow="autoplay; fullscreen; …")

# Audio (Buzzsprout) - verified live: data-src swapped to src on scroll into view
.entry-content
└── .embed-controller-wrapper       (static; height 200px; the lazy controller root)
    └── iframe[data-src="https://www.buzzsprout.com/…?iframe=true"] width="100%" height="200"
        (IntersectionObserver swaps data-src -> src when the wrapper nears the viewport)

# Consent-gated placeholder (shown when a provider is blocked)
.page-embed_cookie (background #c4c6c7; border 1px #9f9f9f; height 25em)
└── .page-embed_cookie-inner (background #e4e4e4; padding 16px; box-shadow)
    ├── .page-embed_cookie-inner_text  ("Enable X to view this content")
    └── button (pill; icon-font \e00d; box-shadow inset 0 0 0 2px #161718)
# Consent decisions are managed by OneTrust (.otPcCenter, .ot-* iframes present on every page).
```

**Aspect-ratio system (`.ratio-container`, source CSS):** the source uses the classic
`padding-bottom` percentage trick, not CSS `aspect-ratio`. `.ratio-container{position:relative;
overflow:hidden}` + `.ratio-container > *{position:absolute; inset:0; width:100%; height:100%}`, with:
`ratio-16x9 -> 56.25%`, `ratio-16x10 -> 62.5%`, `ratio-4x3 -> 75%`, `ratio-3x2 -> 66.67%`,
`ratio-2x1 -> 50%`, `ratio-1x1 -> 100%`, `ratio-3x1 -> 33.33%`, `ratio-4x1 -> 25%`. The
`.video-container` uses the same math (measured `padding-bottom:456.75px` on a `812px` box = `56.25%`
= **16:9** · Octavia PR · 1280).

**Lazy mechanism (verified live):** the `ys-embed-controller` (rendered as `.embed-controller-wrapper`)
holds the iframe's URL in `data-src` and swaps it into `src` via an `IntersectionObserver` when the
wrapper approaches the viewport. Confirmed: after scrolling the Buzzsprout wrapper into view,
`data-src` became `null` and `src` populated with the Buzzsprout URL.

**Privacy flags (verified live 2026-09-24 on the innovation-and-technology article):** Vimeo carries
`?dnt=1` (do-not-track) + `app_id`. YouTube embeds use the **standard `www.youtube.com/embed/{id}`
host with `?feature=oembed&enablejsapi=1`** (and a `si=` share token when present) — NOT the
nocookie host (an earlier note here was wrong; corrected after measuring the live article embeds).
Per-provider `allow` lists differ and are copied verbatim: YouTube =
`accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share`;
Vimeo = `autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share`.

**Libraries to retire (do not port):** `ys-embed-controller` (custom Stimulus-style controller),
jQuery, colorbox popups. Replace with native `loading="lazy"` iframes + a small consent gate.

## 3. Measured visual spec

`OCT` = Octavia press-release URL. Values `measured (source · selector · viewport) -> token`.

### Video wrapper (`.video-container`, Vimeo)
- `position:relative; overflow:hidden; padding-bottom: 56.25%` = **16:9** (measured `456.75px` on
  `812px` · OCT · 1280).
- iframe: `position:absolute`, fills the box, `width/height:100%`; HTML attrs `width="500" height="281"`
  (the intrinsic 16:9 fallback); `title` = the video title (good, keep); `allow="autoplay; fullscreen;
  picture-in-picture; clipboard-write; encrypted-media; web-share"`.
- No border, no radius on the video box (photographic edge-to-edge).

### Audio wrapper (`.embed-controller-wrapper`, Buzzsprout)
- `position:static; padding-bottom:0; height:200px; overflow:visible` (measured · OCT · 1280), audio
  players are **fixed-height (200px), NOT 16:9**. iframe `width="100%" height="200"`.
- On mobile the widget-scoped rule forces `.widget .ratio-container{padding-bottom:56.25%}` for
  embeds that DO use a ratio box (single-post/press-kit templates, `@media (max-width:767px)`).

### Consent placeholder (`.page-embed_cookie`)
- Box: `height:25em`, background `#c4c6c7`, `border:1px solid #9f9f9f`, `z-index:100`, centered column.
  No token for these greys -> **candidate** `--embed-consent-bg: #c4c6c7`, `--embed-consent-border:
  #9f9f9f`.
- Inner (`.page-embed_cookie-inner`): `width:85%; height:80%`, background `#e4e4e4`, `padding:16px`
  (-> `--spacing-m`), `box-shadow:0 0 10px 0 #7e7e7e`.
- Button: pill `border-radius:2em`, background `#fff` -> `--skoda-white`, color `#161718` ->
  `--skoda-ink`, `box-shadow:inset 0 0 0 2px #161718` (ink outline), `padding:.5rem`
  (`.875rem 1.5rem` at `>=720`), icon-font `content:"\e00d"`, `transition:.25s`. Hover/focus/active
  background `#f1f1f1` (-> reuse `--dropdown-hover-bg` candidate from `_FOUNDATIONS` §8).
- Placeholder text `.page-embed_cookie-inner_text`: centered, `margin-bottom:1.25rem` (<768) /
  `2rem` (>=768).
- `--colorbox` variant (`.page-embed_cookie--colorbox`) is a fixed-position modal (retire with colorbox).

## 4. Responsive behavior

- **Video box:** fluid width, fixed `16:9` (`padding-bottom:56.25%`) at every viewport (the iframe
  scales inside). No breakpoint changes the ratio.
- **Audio box:** fixed `200px` height at every viewport (fluid width).
- **Consent button padding:** `.5rem` -> `.875rem 1.5rem` at `>=720` (secondary breakpoint; source
  uses `720`, matches `_FOUNDATIONS` §1 secondary step). Icon gap `4px` -> `8px` at `>=720`.
- **Consent text margin:** `1.25rem` -> `2rem` at `>=768`.

## 5. Interaction states

- **Lazy load:** iframe `src` is empty until the wrapper nears the viewport (`IntersectionObserver`
  swap). Verified: Buzzsprout `data-src -> src` on scroll-in.
- **Consent gate:** while the provider category is not consented, the `.page-embed_cookie` placeholder
  shows with an "enable" button; clicking it (and/or accepting the OneTrust category) reveals the
  iframe. Button hover/focus/active -> background `#f1f1f1`.
- **Playback:** delegated to the provider iframe (Vimeo/YouTube native controls).

## 6. Accessibility

- iframe must have a `title` (source Vimeo already does; Buzzsprout's `title` carries the episode
  name, keep). Missing titles are a gap to enforce.
- The consent gate button must be a real `<button>` with a clear accessible label ("Load video from
  Vimeo") and a visible `:focus-visible` ring.
- Placeholder text must state the provider and that a third party will be contacted.
- Do not autoplay with sound; keep provider controls keyboard-reachable (native to the iframe).
- Provide `allow`/`allowfullscreen` only as needed; avoid unnecessary permissions.

## 7. EDS target

**Primary path: the `/widgets/` autoblock -> `widget` block** (already wired). `buildWidgetAutoBlocks`
(`scripts/scripts.js`) turns any `a[href*="/widgets/"]` into a `widget` block; `widget.js` fetches
`/widgets/<path>/<name>.{html,css,js}` and decorates. Video/audio embeds authored as widget links fit
this path directly. **Alternative: a dedicated `embed` block** for plain provider URLs pasted as links.

### DA authoring model (worked examples)
Widget link (autoblocked): a paragraph whose only content is a widget link
`https://…/widgets/embed/video.html?src=https://vimeo.com/1221703335` becomes a `widget` block; query
params land on `dataset` (e.g. `data-src`).

`Embed` block (dedicated, provider URL):
| Embed |                                              |
|-------|----------------------------------------------|
| url   | https://vimeo.com/1221703335                 |
| ratio | 16x9                                          |
| title | Škoda Octavia turns 30 (optional iframe title) |

The URL must be an absolute `http(s)` provider URL; missing, relative or non-http(s) values (and
YouTube/Vimeo URLs without a media id) are rejected with a console warning and render nothing
(block flagged `.embed-invalid`). The iframe `title` comes from the `title` row / link `title`
attribute, else descriptive link text, else a readable provider label (e.g. "YouTube video") —
never the raw URL.

### decorate() outline (repo conventions, `_FOUNDATIONS` §7)
- Read the provider URL (cell/link/`data-src`); detect provider (vimeo / youtube / buzzsprout /
  spotify) and normalize the embed URL: Vimeo `player.vimeo.com/video/ID?dnt=1`, YouTube
  `www.youtube.com/embed/ID?feature=oembed&enablejsapi=1` (measured live, §2), Buzzsprout / Spotify
  their iframe URLs.
- Build a ratio wrapper: `<div class="embed-video">` with CSS `aspect-ratio: 16 / 9` (modern
  replacement for the `padding-bottom:56.25%` hack) for video; a fixed-height wrapper for audio
  (`--embed-audio-height: 200px`).
- Create the iframe with `loading="lazy"`, a `title`, and a minimal `allow`; **do not** set `src`
  eagerly if the consent gate is in play, set `data-src` and swap on consent/first-interaction, or
  render the `.embed-consent` placeholder until consented.
- Any `innerHTML` must be Trusted-Types-safe (`_FOUNDATIONS` §7): build the iframe with
  `document.createElement` + attribute assignment, never string-concat a `src`.
- CSS scoped to `.embed` / `.widget`; tokens for the consent placeholder (see §8).

## 8. Open decisions + recommended default

- **Aspect implementation:** recommend CSS `aspect-ratio: 16 / 9` over the legacy `padding-bottom`
  hack (no visual change; simpler). Support authored ratios (`16x9` default, `4x3`, `1x1`, `16x10`).
  Assumption to confirm: 16:9 is the default for video.
- **Lazy + consent:** recommend native `loading="lazy"` for the iframe PLUS a click-to-load consent
  gate for privacy (double win: perf + GDPR). Keep `?dnt=1` (Vimeo); YouTube uses the measured
  live `youtube.com/embed` host (§2), not `youtube-nocookie`.
- **Consent integration:** reuse the site's existing consent manager (OneTrust) category signal where
  available; otherwise the local `.embed-consent` placeholder gates the load. Confirm which is
  authoritative in EDS.
- **New tokens:** `--embed-consent-bg: #c4c6c7`, `--embed-consent-border: #9f9f9f`,
  `--embed-consent-inner-bg: #e4e4e4`, `--embed-audio-height: 200px`, plus reuse `--skoda-white`,
  `--skoda-ink`, `--pill-radius` (2em here vs 50px card pill, keep separate or pick one; assumption
  to confirm).

## 9. Pixel-perfect acceptance criteria

WHAT / WHERE / viewport / expected / actual.

- [ ] Video ratio: `.embed-video` / all / rendered box = **16:9** (`padding-bottom:56.25%` or
      `aspect-ratio:16/9`); iframe fills it absolutely, no letterbox gaps.
- [ ] Audio height: `.embed-audio` / all / fixed `200px`, fluid width.
- [ ] Lazy: iframe `src` empty on load; populated only when scrolled near viewport (or on consent).
- [ ] Privacy: Vimeo URL keeps `?dnt=1`; YouTube matches the live source,
      `www.youtube.com/embed/{id}?feature=oembed&enablejsapi=1` (§2).
- [ ] `loading="lazy"` present on the iframe; `title` non-empty.
- [ ] Consent gate: unconsented -> `.embed-consent` placeholder (`#c4c6c7` box, `#e4e4e4` inner, pill
      button with ink outline); button hover/focus -> `#f1f1f1`; button padding `.5rem` (<720) /
      `.875rem 1.5rem` (>=720).
- [ ] Consent action loads the iframe; placeholder is removed.
- [ ] A11y: consent button is a labeled `<button>` with visible `:focus-visible`; iframe has `title`;
      no autoplay-with-sound; provider controls keyboard-reachable.
- [ ] Providers covered: Vimeo, YouTube, Buzzsprout, Spotify.
- [ ] Visual diff vs source at 1280/768/mobile <= 2% per-pixel (excluding iframe content).

## 10. Reference screenshots

`assets/embeds/`: `vimeo-embed-1280.png` (16:9 Vimeo player in `.video-container`). Consent-placeholder
capture pending (requires clearing OneTrust consent to trigger `.page-embed_cookie`).
