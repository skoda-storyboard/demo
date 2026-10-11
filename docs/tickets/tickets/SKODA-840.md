# SKODA-840, Story newsletter card as one shared fragment

- **Epic:** E08, Editorial at Scale
- **Type:** fragment + block + import (re-push of the stories)
- **Phase:** A · **Milestone:** M2
- **GitHub issue:** [#318](https://github.com/skoda-storyboard/demo/issues/318)
- **Origin:** authoring review [`SKODA-AUTHORING-REVIEW-2026-10-10.md`](../../reviews/SKODA-AUTHORING-REVIEW-2026-10-10.md), AR-05 (user, 2026-10-10: "present a fix", tickets only)
- **Related:** SKODA-823 (the `newsletter-stub (card)` variant), SKODA-904 (newsletter service, M2), SKODA-1003 (per-locale content)
- **Status (2026-10-11):** 🟡 IN REVIEW: [PR #325](https://github.com/skoda-storyboard/demo/pull/325). The fragment `/en/fragments/newsletter-card` is in DA and previewed. Content rollout (publish the fragment, re-push 67 stories) waits for the merge and a go-ahead. See "Progress".

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

## Progress (2026-10-11, PR #325)
- **Runtime:**
  - `scripts/story-newsletter.js` adds a Fragment block for `/{locale}/fragments/newsletter-card` at the top of `.section.sidebar`, before decorateBlocks, so it loads with the hidden sidebar section.
  - An authored card, or an authored Fragment block for it, wins.
- **Importer:**
  - The story no longer carries the card. The builder is the `skoda-story-aside` `newsletter-card` hook, used by the new `import-newsletter-card.js`.
  - A widget-only sidebar gets an explicit Fragment block (`dropEmptySections` would drop it otherwise).
- **Push:** `import:push` requires the card fragment live for story batches.
- **Measured (before = live story with its own card; after = draft copy on the branch):**
  - On 3 stories at 375 / 768 / 1440 the card renders identically: box, image, heading with its line break, field, button, and the "Explore more" position.
  - Consent opens on focus, and both errors show.
  - No layout shift comes from the sidebar or the card.
- **Re-import of the 68 live stories vs DA:**
  - 67 differ only by the removed card table.
  - 1 (`enyaq-and-elroq-now-double-as-gaming-consoles…`) is an older DA import without a card. It stays out of the push, and the runtime adds the card there.
- **Decision:** the fragment path is `/en/fragments/newsletter-card`, as in this ticket. DA already keeps `/en/fragments/` (media-feed fragments), and none of it is indexed.
- **Open:**
  1. Merge #325.
  2. Publish the fragment.
  3. Push the 67 stories (after `media:apply`, conflict guard, card-only diff), preview, then publish.
  4. Edit-the-fragment QA on 3 stories.
  5. Delete `/drafts/840/*`.
