# SKODA-823, Story sidebar newsletter sign-up widget (UI stub)
- **Epic:** E08, Editorial at Scale (UI); production service stays E09 / SKODA-904
- **Type:** block + import
- **Phase:** A · **Milestone:** M1 (demo, UI only, no ESP wiring)
- **GitHub issue:** [#126](https://github.com/skoda-storyboard/demo/issues/126)
- **Estimate:** 2 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-09-24):** 🔵 TODO

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
- [ ] 1440: widget at the top of the aside, 345px wide, matching newsletter.md (colours, button, input).
- [ ] Accessible form: labelled input, real button, visible focus, and an error for an invalid e-mail.
- [ ] No network submission in M1; after valid local input, the user sees
      "Newsletter signup is not available yet" in an accessible status region.
      Neither a success message nor an email-confirmation promise appears.
- [ ] Consent/management links use verified published destinations. The source
      sidebar links to `/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/`
      and `/en/newsletter-settings/`; verify their migrated targets before
      authoring. Until then, use client-approved plain text, not fake links.

## Dependencies
SKODA-801 (aside rebuild). SKODA-904 (M2 ESP) and SKODA-903 (banner
platform) are explicitly out of scope, not upstream dependencies.
