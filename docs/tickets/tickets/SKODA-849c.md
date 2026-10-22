# SKODA-849c, Third-party embeds and unmapped widgets: a verdict per host, new widget kinds, image maps, charge map

- **Epic:** E06, Import Pilot Content
- **Type:** import (story parser, transformers, tests)
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Before the SKODA-803 bulk run and the 1004a–e runs.
- **Estimate:** 4 SP · AI-assisted 2d / manual 4–5d *(planning estimate, not a quote)*. Parts: other embeds 1, new
  widget kinds 1, core widgets 0.5–1, the 17-host verdict table 0.5, image maps and art direction < 0.5 each, the
  charge-map verdict ≈ 0.
- **GitHub issue:** [#446](https://github.com/skoda-storyboard/demo/issues/446) (created 2026-10-21, sub-issue of #426)
- Parent: SKODA-849 ([#426](https://github.com/skoda-storyboard/demo/issues/426))
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KI-02, G-KI-05 (Medium), G-T4-01,
  G-T4-02 (Medium), G-T4-04, G-T4-05, G-T4-07 (Low); none re-verified by a refuter.

## Why
- **Embeds other than YouTube and Vimeo (G-KI-02, G-T4-02).** The story path's `videoUrl()` knows only those two, and
  html2md drops an iframe that has no `title` and turns a titled one into a plain link. 29 of 30 EN podcast episodes
  use Spotify. The corpus has 17 iframe hosts, not 8. In neither this ticket nor `EMBED_HOSTS`: koala360 (4 docs),
  Roundme (2), Matterport (1), the old `embed.spotify.com` player (1), Anchor, Slido, Livebox PPV and a
  countingdownto timer (1 SK doc each). LinkedIn iframes are in 6 docs; Instagram (9 docs) and X/Twitter (2) come
  as script + blockquote: the script is stripped and the blockquote stays as text. None of this is logged.
- **Widget kinds (G-KI-05, G-T4-01).** `widget_skoda_iframe` has no `WIDGET_KINDS` entry and is dropped with a
  `console.warn`: 18 SL posts + 1 each EN, CS, SK + 2 pages (below the earlier 45–50 estimate). Also unmapped:
  `sow-google-map` (3 docs), `skoda-video-embed-with-skoda-cdn-support` and `skoda-external-links` (1 SL doc each),
  and the core widgets `widget_text` (3 DE posts + 1 EN page), `widget_media_video` (10 posts + 1 SK release),
  `widget_media_image` (4 posts) and `ys-row-toggle` in a story (1 SK). Dry runs lose the 4 h3 headings in the DE
  Octavia story, the YouTube videos in 2 DE motorsport stories, the image in the DE Enyaq Coupé RS story and 7 toggle
  headings in the SK Škoda Plus story.
- **Image maps (G-T4-04).** 14 EN stories use `<img usemap>` + `<map><area href>` hotspots; html2md drops every area.
- **Art direction (G-T4-05).** 36 stories (EN 29, SK 4, SR 3) swap src and alt per breakpoint through an `rb_*`
  script; only the default image and alt survive. This is parity, not breakage.
- **Charge map (G-T4-07).** `k2tools-charge-map` loads through `data-script-src` in 41 stories (EN 17, SK 12, CS 5,
  SL 3, DE 2, SR 2), not 30, and the calculator in 2 (EN, SK). Both are logged drops with no replacement decided.

## Scope
- **Per-host verdict table** for all 17 iframe hosts plus X/Twitter: embed, link or drop, each logged. `videoUrl` /
  `videosToUrls` emit the bare URL for every `EMBED_HOSTS` iframe and log any other host.
- **`WIDGET_KINDS`:** `skoda_iframe` and `skoda-video-embed` keep the provider URL (embed block); `text` → heading +
  body; `media_video` → provider URL for YouTube/Vimeo sources, an Embed for MP4; `media_image` → image; story
  `ys-row-toggle` → Accordion, as the press-release cleanup does. `classifyWidget` test cases for each.
- **`sow-google-map`:** a static map image, a link or a drop, decided and recorded.
- **Image maps:** each `<area href>` becomes a link list (or Cards) after the image; the conversion is logged.
- **Art direction:** accept the default image (logged), or emit the desktop and mobile images as a picture pair.
- **Charge map and calculator:** record the verdict per locale (a link to the Škoda charge-map service, or a drop)
  in the run report.

## Not in scope
- Consent categories for the hosts kept (SKODA-907, 204a). HTML packages: SKODA-849b.

## Acceptance criteria
- [ ] Unit tests: `skoda_iframe`, `skoda-video-embed`, `text`, `media_video`, `media_image` and story `ys-row-toggle`
      classify as above; `videosToUrls` emits a Spotify URL.
- [ ] Dry run on 3 Spotify episodes and the 5 DE/SK stories above: headings, players, image and toggles survive, and
      `import:validate-blocks` passes.
- [ ] The verdict table covers 18 hosts; each iframe in the dry run is an embed, a link or a logged drop.
- [ ] A sampled image-map story keeps its area links; the charge-map verdict is in the run report per locale.

## Dependencies
SKODA-204 / 204a (embed block, consent placeholders), 907 (consent categories), 801 (widget map), 849 census and drop
count. Feeds 803, 801b and 1004a–e. Parent: SKODA-849.
