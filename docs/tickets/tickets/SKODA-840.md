# SKODA-840, Story newsletter card as one shared fragment

- **Epic:** E08, Editorial at Scale
- **Type:** fragment + block + import (re-push of the stories)
- **Phase:** A · **Milestone:** M2
- **GitHub issue:** [#318](https://github.com/skoda-storyboard/demo/issues/318)
- **Origin:** authoring review [`SKODA-AUTHORING-REVIEW-2026-10-10.md`](../../reviews/SKODA-AUTHORING-REVIEW-2026-10-10.md), AR-05 (user, 2026-10-10: "present a fix", tickets only)
- **Related:** SKODA-823 (the `newsletter-stub (card)` variant), SKODA-904 (newsletter service, M2), SKODA-1003 (per-locale content)
- **Status (2026-10-10):** 🔵 TODO

## Problem
- **Every story repeats the card.** All 68 live stories carry their own 12-row `Newsletter Stub (card)` table (about
  1.2 KB) in the sidebar: `image`, `heading`, `label`, `placeholder`, `button`, `consent`, `manage`, `message`, `error`,
  `consent-error`, `list`, `language`.
  - `transformers/skoda-story-aside.js` writes it from the source widget, plus `NEWSLETTER_DEFAULTS`.
- **The cost:** changing the copy, consent wording or list id means editing 68 documents, and every new story copies
  the table along.
- **The pattern already exists:** the header's newsletter panel does this right, as one fragment (`/nav-newsletter`,
  `Newsletter Stub (topbar)`).

## Fix
1. **Fragment:** `/en/fragments/newsletter-card` holds the single `Newsletter Stub (card)` table. Per-locale copies
   (`/cs/fragments/newsletter-card`, …) come later with SKODA-1003.
2. **Story layout:**
   - The story decoration (`scripts.js`, `decorateStorySections`) inserts the card from the locale's fragment at the
     top of `.section.sidebar`, the source position, when the sidebar has no `newsletter-stub` block.
   - An authored card still wins, so there is no regression during the switch.
   - The insertion uses `loadFragment` (`blocks/fragment/fragment.js`, the allowed cross-block import).
3. **Importer:** `skoda-story-aside.js` stops emitting the card table. Story importer tests are updated.
4. **Content:**
   - Re-import and push the 68 stories with the push conflict guard (no `--force`; conflicts are inspected).
   - The DA diff must show only the removed card table.
   - Publish the fragment **before** the stories.

## Acceptance criteria
- [ ] One `/en/fragments/newsletter-card` document. No story document contains a `Newsletter Stub (card)` table.
- [ ] Measured on 3 stories at 375 / 768 / 1440, before vs after: the card renders identically.
  - Image, heading with its line break, field, button.
  - Consent slides open on first focus; the invalid-e-mail and missing-consent errors show; the sent state works.
- [ ] Editing the fragment text and publishing it changes the card on every story (checked on 3).
- [ ] A story with an authored card keeps it (unit test).
- [ ] No CLS from the late insertion: the card's slot is reserved, or it's inserted before the sidebar is shown
  (Lighthouse CLS unchanged on 2 stories).
- [ ] `npm test` and `npm run lint` are clean. DA push: only the card table removed, 0 unexpected changes.
  Publishing needs a separate go-ahead.

## Effort
About half a day of code and tests, plus one re-push of 68 stories with QA.
