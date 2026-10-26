# SKODA-204, Embeds block (Vimeo/YouTube/Buzzsprout/Spotify, dnt=1, lazy)
- **Epic:** E02, Core Blocks
- **Type:** block
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/embeds.md`](../../ui-specs/embeds.md)** (captured via Chrome DevTools). Read it before implementing.

Key facts from capture that change this ticket:
- Video: `.video-container` = **16:9** (`padding-bottom:56.25%`, measured); Vimeo `?dnt=1`; YouTube uses the standard `youtube.com/embed` host with `?feature=oembed&enablejsapi=1` (measured live — the source does **not** use the nocookie host).
- **Audio (Buzzsprout) is fixed `200px` height, NOT 16:9**, use a separate audio aspect/height, not the video wrapper.
- Lazy **confirmed live**: `.embed-controller-wrapper` (`ys-embed-controller`) swaps `data-src`→`src` on scroll-in → replace with native `loading="lazy"` + click-to-load.
- Consent placeholder: `.page-embed_cookie` (`#c4c6c7` box, pill button) + OneTrust; M1 gate is a stub (consent OUT of Adobe scope, D10).
- New tokens: `--embed-consent-bg:#c4c6c7`, `--embed-consent-border:#9f9f9f`, `--embed-audio-height:200px`.

## Summary
Build the rich-media Embeds block covering Vimeo/YouTube/Buzzsprout/Spotify via URL autoblocking, preserving `dnt=1` and using native lazy iframes. **Also carries the generic third-party script embed used by MR-PR03, the AI-generated audio-reading widget** on press releases (see below).

## Description
Embeds appear across story + press-release pages (Vimeo 246, YouTube 201, Buzzsprout 195, Spotify 36, `SKODA-EN-BLOCK-INVENTORY.md` §2A; §7 #5). Fully static, no backend (`SKODA-SYSTEM-BUILD-SPECS.md` §6). Replace the source's `IntersectionObserver` `data-src` swap with native `loading="lazy"`; autoblock a bare provider URL on its own line (`/docs/aem-embed`, auto-blocking in markup-sections-blocks). Preserve Vimeo `dnt=1` (do-not-track) privacy param.

**Why this is low-risk (de-risking note):** all video/audio is **externally hosted** (Vimeo / YouTube / Buzzsprout / Spotify) and merely embedded, client-confirmed there is **no MAM / no AEM Assets video / no self-hosted media**. Therefore this block has **zero video-migration workstream**: no video files to move, transcode, or host; **no video counts toward the ~28,300-item / ~200k-file media footprint**; and **no player to rebuild** (playback, streaming, adaptive bitrate, captions all handled by the provider). We only reproduce the embed markup + `dnt=1` + lazy-load + consent gate. This narrows the demo's media effort to **images (masters-only ingest) + the media-cart**, video is essentially free.

## Requirements / Spec
**DA content model:** author pastes a provider URL on its own line → auto-blocked into Embed (no table needed for the common case). Table form supported for options.

**`decorate(block)` outline:**
1. Detect provider from URL host (Vimeo / YouTube / Buzzsprout / Spotify).
2. Build the correct iframe embed URL:
   - Vimeo: `player.vimeo.com/video/{id}?dnt=1&app_id=…`, **preserve `dnt=1`**.
   - YouTube: `www.youtube.com/embed/{id}?feature=oembed&enablejsapi=1`, matching the live source.
   - Buzzsprout / Spotify: audio embed URL (audio variant of the same block).
3. `loading="lazy"` (native), replaces IntersectionObserver `data-src` swap.
4. Aspect-ratio CSS wrapper (no CLS); `<iframe title>` set.
5. Optional poster / click-to-load for perf + consent gating.
6. **Consent:** gate third-party iframes behind OneTrust when required (click-to-load); third-party loads in delayed phase.
7. **Generic / AI-audio embed (MR-PR03):** the press-release AI-generated audio-reading is an **arbitrary third-party JS widget** (not one of the four named oEmbed providers), reproduce the vendor's embed as-is (no rebuild, per §11.2 / D-none). Route it through the project's **`widget` autoblock** (`buildWidgetAutoBlocks`, DEVELOPER-GUIDE §3) if a raw `<script>` widget rather than an iframe, or as a generic-provider branch of this block if iframe-based. Per-language; consent-gated like the other embeds (consent is OUT of Adobe scope per D10, so the M1 gate is a stub).

## Acceptance Criteria
Measurable gates live in [`embeds.md` §9](../../ui-specs/embeds.md); summary:
- [ ] All four providers render from a pasted URL (autoblock).
- [ ] Vimeo embeds carry `dnt=1`; YouTube uses the live source's `youtube.com/embed` URL (`feature=oembed&enablejsapi=1`).
- [ ] Video wrapper = **16:9** (`padding-bottom:56.25%` or `aspect-ratio:16/9`), no CLS.
- [ ] Audio (Buzzsprout/Spotify) uses a **fixed `200px`** height, not the video aspect.
- [ ] iframes use native `loading="lazy"` and have a `title`.
- [ ] Consent placeholder + click-to-load hook present (stub for M1).
- [ ] The MR-PR03 AI-audio vendor widget renders as-is (via the `widget` autoblock or a generic-embed branch), per-language, without rebuilding the vendor.
- [ ] Consent-gating hook present (click-to-load / delayed phase); `npm run lint` clean.

## Dependencies
- Upstream: SKODA-102
- Downstream: SKODA-603 (pilot pages with embeds), SKODA-703 (a11y), SKODA-804/905 (consent + analytics wiring, later phase)

## Risks / Flags
- Consent/analytics coupling: third-party iframes must respect OneTrust and re-emit `skoda-analytics` events (specs §7), full wiring is Phase B/C (SKODA-804/905), pilot uses the gate hook.
- [RUNTIME-UNCONFIRMED]: embed lazy-load timing (specs §8), verify in browser.

## Amendment (2026-10-22, M2 gap review §7.2)
Source: [M2 integration gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2, finding G-D-05
(Medium). G-A-08 (Low, confirmed) is merged into G-D-05. This ticket is done on M1 scope (merged in #109); the
amendment is new M2 work.

**Added scope**
- Correct step 7 and the MR-PR03 acceptance criterion: the AI audio box is a 200px Buzzsprout iframe of AI-voiced
  readings, not an arbitrary third-party JS widget for the `widget` autoblock (G-D-05, G-A-08). The demo already
  renders it through the embed block, and 204a already gates Buzzsprout, so this is a text correction (G-A-08).
- Locale coverage: the box appears on 89 of the 100 most recent EN releases and 91 of 100 CS releases; DE 1/100
  (an older 2022-23 sample), SK 0/100, SR 0/100. Treat it as EN + CS only, not "per-language" (G-D-05).
- Show paths: of the 89 EN embeds, 56 use show 1878301 (the EN AI show) and 33 use the CS show path
  (`/1730804/episodes/<EN id>`). These play only because Buzzsprout resolves by episode id. The Buzzsprout branch
  must accept any show id in the path and must not rewrite it (G-D-05).
- Authoring path: the episode is produced outside WordPress and pasted into each release, and nothing regenerates
  it. After go-live, DA authors paste the episode URL per release on EN and CS. Step 7 should say so and point to
  the SKODA-842 "AI audio" library entry and the author guide, which carry the workflow (G-D-05).
- The AI-voice disclosure sits only inside the iframe; the label work is in SKODA-204a (G-G-09).

**Added acceptance criteria**
- [ ] Step 7 and the MR-PR03 criterion describe a Buzzsprout iframe through the embed block, EN + CS only
      (G-D-05, G-A-08).
- [ ] A test covers a Buzzsprout URL with each show path (1878301 and 1730804) and checks that the iframe keeps
      the authored show and episode ids at the 200px audio height (G-D-05).
- [ ] Step 7 links the SKODA-842 library entry and the author-guide paste-URL steps for EN and CS (G-D-05).

**Estimate**
- Estimate after the amendment: 3 SP (M1, done) + 0.25 SP new M2 work · AI-assisted 0.1d / manual 0.25d
  *(planning estimate, not a quote)*. The rest of G-D-05's +0.5 SP (library entry, author guide) sits in
  SKODA-842; the D19 AI-voice notice sits with D19.
