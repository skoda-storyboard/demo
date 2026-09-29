# SKODA-204a, Embeds: consent placeholder + click-to-load hook (follow-up to SKODA-204)
- **Epic:** E02, Core Blocks
- **Type:** block JS (small), AC gap on a closed ticket
- **Phase:** A · **Milestone:** M1 (demo)
- **GitHub issue:** [#152](https://github.com/skoda-storyboard/demo/issues/152) · follow-up to [#18](https://github.com/skoda-storyboard/demo/issues/18) (SKODA-204, Done)
- **Estimate:** 0.5 SP · AI-assisted 0.25d / manual 0.5d *(planning estimate, not a quote)*
- **Priority:** P1
- **Status (2026-09-29):** 🟡 Ready for review (branch `skoda-204a-consent-hook`, not pushed yet).

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
- [x] With the stub set to "no consent", no third-party iframe `src` is set and **0 requests** go to
      youtube.com, vimeo.com, buzzsprout.com or spotify.com (network log). A labelled placeholder button is shown
      instead.
- [x] Activating the placeholder (click or Enter/Space) loads that one embed, and focus moves to it.
- [x] With the default stub ("consent"), behaviour is byte-identical to today: lazy load on intersection, the 16:9
      wrapper and no CLS.
- [x] Unit tests cover both branches; `npm run lint` is clean.
- [ ] Preview link: `https://skoda-204a-consent-hook--demo--skoda-storyboard.aem.page/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company`

## Implementation notes (2026-09-29, branch `skoda-204a-consent-hook`)
- **Live check (fresh visitor, no cookie consent):**
  - The Epiq story's YouTube embed is replaced by `.page-embed_cookie`: 819×400, `#c4c6c7` with a 1px `#9f9f9f`
    border; inner 694×318 `#e4e4e4`, 16px padding, shadow. The text is 16/24, centred, with a 32px gap. The button
    reads "I acknowledge and confirm" (a pill, 2px ink outline, 14px 24px, 16px/600). There are 0 YouTube requests.
    The live button hands off to OneTrust.
  - The Klaus Buzzsprout audio and Vimeo load ungated on live.
  - Embeds appear on M1 stories (Epiq, Peaq ×3, Women's cycling, Mixed reality), 5 press releases (Buzzsprout;
    936 km also has Vimeo), 5 model pages, the first-glimpse press kit and Videos.
- **Decisions (2026-09-29):** match the live wording and styling; gate all four providers (per the ACs); reuse
  the `?consent=` switch.
- **Code:**
  - `scripts/embed-consent.js` provides `hasEmbedConsent()`, which defaults to **granted**, deliberately separate
    from `consent-check.js`'s declined analytics default. `?consent=decline|accept` overrides it.
  - `setEmbedConsent(bool | fn)` is the SKODA-704/804 hook. It dispatches `embed-consent.update`, and a grant
    loads every waiting embed.
  - `blocks/embed`: without consent the iframe is kept out of the DOM, and the placeholder is built synchronously
    (final size from the first frame, consent listener live at once). It shows the provider host. The optional
    placeholder-sheet wording (`Embed Consent Text` with `{host}`, `Embed Consent Button`) is loaded afterwards
    and only on the gated path.
  - The button's accessible name is its visible label; the host text is its `aria-describedby`, so it stays
    correct in any locale. The live check icon is a masked `icons/check.svg` (16px, 4 → 8px gap at 720).
  - A grant moves focus to the iframe if the button had it; detached placeholders unsubscribe.
  - `consent-check.js` now uses the shared `consentFromQuery()` parser.
  - **M1 limit:** withdrawing consent doesn't unload players that already loaded (SKODA-804 owns that).
  - Activating the placeholder loads that one embed and focuses the iframe. The colour tokens are in `brand.css`
    (`--embed-consent-*`).
- **Verified (local preview):**
  - `?consent=decline`: no provider frames or resources on the Epiq, Klaus and 936 km pages. The placeholder
    matches live (819×400 box, inner 694×320, same type and button).
  - Click or Enter loads only that embed (936 km: one of two placeholders released) and focuses the iframe.
  - At 375 the text wraps inside the panel, with no overflow.
  - Default (no switch): identical to main (markup, 819×460 / 812×200 boxes, lazy iframes, embed CLS 0).
  - The button measures 270×52 with a 16px icon and an 8px gap, identical to live. Embed CLS is 0 in the gated state.
  - The analytics stub is unchanged: consented.js is not loaded by default or with decline, and is loaded with accept.
  - Mobile 390 (touch): the placeholder fits (370×400, no overflow), and a tap loads only that embed.
  - 32 embed tests (21 existing + 11 new): stub default, shared parser, hook and event, exact default markup with
    no sheet fetch, 4 providers gated, click, grant with focus kept, detached placeholder. Code-reviewed; the
    findings are fixed.

## Dependencies
204 (#18, merged in #109). 704 wires the stub; 804 (M2) wires OneTrust.
