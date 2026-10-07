# SKODA-823, Story sidebar newsletter sign-up widget (UI stub)
- **Epic:** E08, Editorial at Scale (UI); production service stays E09 / SKODA-904
- **Type:** block + import
- **Phase:** A · **Milestone:** M1 (demo, UI only, no ESP wiring)
- **GitHub issue:** [#126](https://github.com/skoda-storyboard/demo/issues/126)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-10-06):** 🟡 IN QA. Block slice merged (#199). **Importer slice done on
  `skoda-830-story-import-validity` (SKODA-830 developer result 2):** `skoda-story-aside.js` emits the
  card at the top of the aside, `block-contracts.json` registers `newsletter-stub` / `card`, and the
  scratch re-import puts it in 59/59 stories (not pushed to DA yet; it goes with the 830 push).

## Origin
Side-by-side QA of the Epiq story (2026-09-24). No existing ticket covers the **inline sidebar**
presentation. SKODA-904 is the M2 subscriber backend. The `newsletter-stub` block already
renders the Media Room footer form (SKODA-305); its sidebar presentation is not built.

## Problem
The source sidebar opens with `.sidebar .newsletter-subscribe-widget` (345×355 at 1440, top of the
aside, above "Explore more"). It has a car image header with "Be the first / to get the latest
stories", an e-mail field, and a mint "Subscribe now!" pill on dark green. `skoda-story-aside.js`
drops it, so the EDS aside starts directly with "Explore more".

## Scope
- Extend the existing `newsletter-stub` for the measured inline sidebar presentation in
  **`docs/ui-specs/newsletter.md`**: image header + heading, e-mail input, consent, and
  "Subscribe now!" button. Reuse its key/value authoring contract and accessible form;
  keep the footer variant unchanged. The production honeypot belongs to SKODA-904.
  In M1 the form posts nothing:
  validate locally, then show an honest **"Newsletter signup is not available yet"**
  status, not "check your email" or any other success/confirmation message.
  Never imply a subscription or confirmation email was sent.
- Reuse the footer block's form and design tokens; the topbar host remains a header concern.
- Importer: `skoda-story-aside.js` emits the stub block at the top of the sidebar section instead
  of dropping the widget. Heading text + image come from the source widget, so it stays authorable.
- Out of scope: the side banner (`.side-banner .sa-bnr`, 345×345) → **SKODA-903** banner platform.

## Acceptance Criteria
- [x] 1440: widget at the top of the aside, 345px wide, matching newsletter.md (colours, button, input).
- [ ] Accessible form: labelled input, real button, visible focus, and an error for an invalid e-mail.
- [ ] No network submission in M1; after valid local input, the user sees
      "Newsletter signup is not available yet" in an accessible status region.
      Neither a success message nor an email-confirmation promise appears.
- [ ] Consent/management links use verified published destinations. The source
      sidebar links to `/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/`
      and `/en/newsletter-settings/`; verify their migrated targets before
      authoring. Until then, use client-approved plain text, not fake links.

## Build notes (block slice, 2026-09-28)
- Authoring: `Newsletter Stub (card)`, with the footer keys plus `image`, `heading`, `error` and
  `consent-error` (see `docs/ui-specs/newsletter.md` §7).
- Consent links (2026-09-29, on request): the draft links "consent to the processing" and
  "Manage subscription" to the live skoda-storyboard.com pages (both return 200). The EDS paths
  don't exist yet (404), so switch the links to relative `/en/…` paths once those pages are
  migrated. Both are emerald and underlined, and slide open together. With both links the
  opened card is 345×491.83 at 1440 and 370×495.39 at 390, the same as the source.
- Measured against the live Epiq story at 1440: card 345×355, header 343×189, field 295×50 and
  pill 177×44 all match; the gap to "Explore more" is 16px. At 390 the card is 370, the header 202,
  the field 320 and the pill 192, also matching.
- **Deliberate deviation, 768–1200:** the source lets the field overflow the narrow card
  (about 11px at 768) and the pill label spill out of its 60% pill. The card keeps the field
  inside and lets the pill grow to its label (`fit-content`). Below 240px of card width a
  container query tightens the insets.
- PR #199 review (2026-09-29):
  - The heading now has the source's `translateY(-20%)`: it sits 18.7px below the image top at
    1440 and 0.7px at 768, the same as the source.
  - The field-to-pill gap is 24px at 576px and below (16px above). The card at 390 is 370×376.39,
    matching the source.
  - The error text is `#e11825`, the source red darkened to 4.82:1 on white; the source `#e82b37`
    is 4.35:1 and fails WCAG AA.
- Consent opens on first focus and stays open; the source's opened card also carries the
  manage link, so ours is shorter until that link is authored.
- Found in passing, not this ticket: the header nav overflows the viewport at 1080 (about 101px)
  and at 280 (`.nav-mobile-tools`, about 22px). It affects every page.

## Importer slice (2026-10-06, on SKODA-830)
- `transformers/skoda-story-aside.js` builds the table on the `preprocess` hook, which
  `import-story-detail.js` calls (the shared page cleanup removes `.newsletter-subscribe-widget` in
  beforeTransform). Only the widget inside `.sidebar` is converted.
- Rows: `image` (the widget's `newsletter_subscribe.webp`, alt ""), `heading` (the widget h3, line
  break kept), `label` "Email address", `placeholder` and `button` from the widget, `consent` (label
  text + its link), `manage`, `message` "Newsletter signup is not available yet", `error`,
  `consent-error` (from the widget's `.checkbox-error`), `list` 389, `language` en_GB.
- Consent / "Manage subscription" link to the live skoda-storyboard.com pages, as the draft does
  (their EDS paths 404). skoda-links leaves them absolute; switch them when those pages migrate.
- `.side-banner` stays dropped (SKODA-903).
- Rendered from the re-import against the origin (wireless charging story): 345.3×354.8 (1440),
  260×307.9 (992), 185.3×266.8 (768), 355×368.1 (375); equal to the origin, top of the aside, 16px
  above "Explore more".

## Dependencies
SKODA-801 (aside rebuild). SKODA-904 (M2 ESP) and SKODA-903 (banner
platform) are explicitly out of scope, not upstream dependencies.
