# SKODA-204a, Embeds: consent placeholder + click-to-load hook (follow-up to SKODA-204)
- **Epic:** E02, Core Blocks
- **Type:** block JS (small), AC gap on a closed ticket
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** follow-up to [#18](https://github.com/skoda-storyboard/demo/issues/18) (SKODA-204, Done)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Priority:** P1
- **Status (2026-09-25):** 🔵 TODO

## Origin
- Parallel demo sweep [`SKODA-DEMO-SWEEP-REPORT.md`](../../reviews/SKODA-DEMO-SWEEP-REPORT.md) §5, amendment 204.
- Validated in [`SKODA-M1-URL-BLOCK-SWEEP.md`](../../reviews/SKODA-M1-URL-BLOCK-SWEEP.md) §11.1:
  - **Host claim, refuted.** 204's AC (l.43) deliberately uses the source host `youtube.com/embed`, not
    `youtube-nocookie`. Nothing changes here.
  - **Gate claim, confirmed.** 204's ACs require a "Consent placeholder + click-to-load hook present (stub for M1)"
    (l.47) and a "Consent-gating hook present (click-to-load / delayed phase)" (l.49). As merged in #109,
    `blocks/embed/embed.js` (`observeLazyEmbed`) promotes `data-src` → `src` on intersection only. It has no
    consent check and no click gate.

## Scope
- One gate in `observeLazyEmbed` (or just before it): `hasEmbedConsent()`, a stub in `/scripts/` that returns `true`
  by default for M1, so the demo behaviour is unchanged.
- When consent is absent, render a placeholder button (poster or provider name + "Load video"). Clicking it
  promotes `data-src` → `src`, and focus moves to the iframe.
- Expose the hook so SKODA-704 (consent stub) and later SKODA-804 (OneTrust) can flip it. The hook takes an event
  or a function; no CMP integration in M1.
- Audio embeds (Buzzsprout/Spotify) use the same gate.

## Acceptance Criteria
- [ ] With the stub set to "no consent", no third-party iframe `src` is set and **0 requests** go to
      youtube.com, vimeo.com, buzzsprout.com or spotify.com (network log). A labelled placeholder button is shown
      instead.
- [ ] Activating the placeholder (click or Enter/Space) loads that one embed, and focus moves to it.
- [ ] With the default stub ("consent"), behaviour is byte-identical to today: lazy load on intersection, the 16:9
      wrapper and no CLS.
- [ ] Unit tests cover both branches; `npm run lint` is clean.
- [ ] Preview link: `https://skoda-204a-consent-hook--demo--skoda-storyboard.aem.page/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company`

## Dependencies
204 (#18, merged in #109). 704 wires the stub; 804 (M2) wires OneTrust.
