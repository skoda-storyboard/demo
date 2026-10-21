# SKODA-304, Footer fragment (nav repeat + social + app badges + legal + brand SVG)
- **Epic:** E03, Chrome Fragments
- **Type:** fragment
- **Phase:** A  ·  **Pilot:** Yes · **Milestone:** M1 (15 Oct demo)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–4d *(planning estimate, not a quote)*

## UI Specification
**Build-ready measured spec: [`docs/ui-specs/footer.md`](../../ui-specs/footer.md)** (captured via Chrome DevTools, token-mapped, pixel-perfect AC). Read it before implementing.

Key facts from capture that change this ticket:
- Dark-green band `#0e3a2f` (`--skoda-green`), padding `4rem 0`, container `1248px` (`--content-max-width`).
- Social icons: `40×40` **black circles** (`border-radius:50%`, `#000` bg, white glyph), per-network hover tints (FB `#3b5998`, YT red, IG gradient, WA `#43d854`); icon-font `\e0xx` → convert to inline SVG. App badges `135×40` SVGs.
- **Real source nav breakpoints are `768 / 968 / 1024`** (the block's `700/1000` are wrong); mega-sitemap = 7 columns (`float:left; width:14.25%` at ≥1024), Newsletter column hidden; sub-links `12px`/500/letter-spacing `1px`.
- Legal/feed row: 1px white `hr`, usage text, `© Škoda Auto a.s. 2026` (weight 600), "RSS | RSS (News)" emerald `#78faae` float-right.
- **Correction:** the COM-15 legal bar (Data Protection / Cookies / Whistleblower) is **NOT in the footer DOM** on either page (only a cookie banner exists), likely the consent tool / a utility bar. Treat those legal links as **unconfirmed**, not a hard footer requirement (see AC).
- New tokens: `--social-icon-size:40px`, `--social-icon-bg:#000`, per-network hover colors, `--app-badge` dims `135×40`, footer padding `4rem`.

## Summary
Author the `footer` DA fragment and load it via the Block Collection Footer block into `<footer>`: a repeat of the nav menu plus social links, app-store badges, a legal bar, and the brand SVG.

## Description
`SKODA-HEADER-FOOTER-ANALYSIS.md` §3 found the footer is **content, not code**, largely a **repeat of the same nav menu** (the full nav tree reused, ~32 items) plus social icons, app-store badges, RSS/feeds, and a legal bar. It's authored as a `footer` DA fragment and loaded by `footer.js`. Notable press-specific detail: the app badges point to the **"Škoda Media Room" journalist app** (iOS + Android) and there is a WhatsApp channel. Social icons are an icon-font in the source and must be converted to inline SVG per EDS convention.

## Requirements / Spec
- **Footer block** (Block Collection Footer) loaded into `<footer>`; `footer` DA fragment as the content source.
- **Nav-menu repeat**, the site nav tree reused as footer navigation.
- **Social links:** Facebook, Instagram, YouTube, WhatsApp, rendered as **inline SVG** (convert from source icon-font `icon-*` classes).
- **App-store badges:** "Škoda Media Room" app, iOS (`apps.apple.com/.../id420627875`) + Android (`play.google.com/.../com.icomvision.skodamediaservices`); plus WhatsApp channel (`go.skoda.eu/whatsapp`).
- **Legal bar:** Data Protection, Copyright, Cookies, Whistleblower system links + copyright notice.
- **Brand SVG** in the footer brand region (per `BRAND_LOGO` pattern).
- RSS/feed links preserved (RSS from the EDS index).
- Per-locale fragment (one `footer` doc per language); EN for the pilot.

## Acceptance Criteria
Measurable gates live in [`footer.md` §9](../../ui-specs/footer.md); summary:
- [ ] `<footer>` renders the Footer block from the `footer` fragment; dark-green band `#0e3a2f`, padding `4rem 0`, container `1248px`.
- [ ] 7-column nav-sitemap repeat at ≥1024 (`width:14.25%`), collapsing at `968`/`768`; Newsletter column hidden.
- [ ] Social links (FB/IG/YT/WhatsApp) render as inline SVG `40×40` black circles with per-network hover tints (no icon-font).
- [ ] App-store badges (`135×40`) link to the Škoda Media Room iOS + Android apps; WhatsApp channel link present.
- [ ] Legal/feed row: usage text + `© Škoda Auto a.s. 2026` + "RSS | RSS (News)" emerald float-right.
- [ ] Legal links (Data Protection/Cookies/Whistleblower) added **only if confirmed** (not in source footer DOM, see UI spec).
- [ ] Brand SVG renders; tokens-only CSS; `npm run lint` passes.
- [ ] Visual diff vs source at 1280/1024/768/mobile ≤ 2% per-pixel.

## Dependencies
- Upstream: SKODA-102 (boilerplate scaffold), SKODA-106 (design tokens + global CSS) / Downstream: SKODA-904 (newsletter/subscriber service references footer links)

## Risks / Flags
- 🟢 Low–Med effort; footer is a fragment, not bespoke IA.
- Icon-font → inline SVG conversion is a small but required conversion.
- Preserve the press-specific Škoda Media Room app + WhatsApp channel links (brand/press assets to retain).
- **Media Room footer is DIFFERENT from the Storyboard footer** *(client walkthrough 2026-09-14, provisional pending transcript)*, this ticket delivers the **Storyboard** footer only. A **distinct MR footer variant** (a second `footer` fragment + block variant) is net-new scope; the exact deltas (links/legal/app-badge set) are unconfirmed until the transcript is reviewed. **Likely a separate ticket**, hold for transcript before scoping/estimating. Cross-ref COM18.

## Amendment (2026-10-21, M2 gap review)
Source: [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) §7.2 and §7.6. The M1 delivery
(#25) stands; this is new M2 scope, due before go-live (2027-01-02).

**Why:** the copyright year is hard-coded `© Škoda Auto a.s. 2026` in the authored footers (`/footer` and
`/media-room/footer`), so it is stale on launch day (G-KT-10, Low). With the locale footers (SKODA-1003) it becomes up
to 12 fragments to edit every 1 January (G-T9-04, Medium, not re-verified).

**Added scope:**
- The footer block replaces a 4-digit year in `.copyright-notice` (set in `blocks/footer/footer-sections.js`) with
  the current year at render time, so no fragment needs a yearly edit (G-KT-10).
- If the client prefers an authored year, the 1 January edit of every footer fragment goes on SKODA-712's calendar
  instead (G-T9-04). Record which.

**Added acceptance criteria:**
- [ ] With the clock set to 2027-01-02, the Storyboard and Media Room footers show `© Škoda Auto a.s. 2027` without
      an edit to either fragment (G-KT-10).
- [ ] A footer whose notice has no year renders unchanged; a unit test in `blocks/footer/footer.test.mjs` covers
      both cases; `npm run lint` passes (G-KT-10).
- [ ] Or: the 1 January step is on SKODA-712's calendar with an owner and the list of footer fragments (G-T9-04).

**Estimate for this amendment:** 0.5 SP · AI-assisted 0.5d / manual 0.5d *(planning estimate, not a quote)*. The
review sizes it at ≈0.25 SP. The original 3 SP is delivered.

**Added dependencies:** SKODA-1003 (locale footers), SKODA-712 (run calendar).
