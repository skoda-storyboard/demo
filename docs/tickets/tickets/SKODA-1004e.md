# SKODA-1004e, SL corpus import (Porsche Slovenija, Media Room shell)

- **Epic:** E10, Localization
- **Type:** import
- **Phase:** D · **Milestone:** M2; timing per **Q-7**
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1–2d *(planning estimate, not a quote)*
- **GitHub issue:** to create
- **Status (2026-10-20):** 🔵 TODO (M2), no owner. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-SL-01 … L-SL-13.

## Why
SL launched in January 2024 and is mostly EN translations:
- 314 stories, 4 press releases, 12 pages and 5 series hubs, ≈ 335 docs.
- The 157 "SL-only" stories are a back-catalogue re-uploaded in 2024 under their old dates. New SL-only writing
  stopped in 2025-08.
- The SL Media Room is a 3-item shell (Images, Videos, Contacts). It has no news listing, press kits, model pages or
  Škodapedia.

## Scope
- **Import** everything with the SKODA-1004 tooling. Ignore the publish year: the cutoff for SL is "everything"
  (Q-12).
- **Dates:** 2 stories are dated 1022 and 1023. Fix them in the import (or ask the client) so date sort and cutoffs
  hold.
- **Media Room section matrix:** home, images, videos, contacts and media cart only. The SL listings must not show
  empty news, kit or model facets.
- **Facets:** 38 "Modeli" sub-categories carry other-locale slugs (`enyaq-sk`, `fabia-sr`, `epiq-cs`) next to 16 model
  terms. Merge them into the model facet and drop the 24 unused categories.
- **Media:** 61 SL attachments; 42 of the 49 titles are file names and all 49 alt texts are empty. Report this to the
  client; don't invent alt text.
- **URLs and feeds:** `/sl/press_release/`, `/sl/podcast-en/`, `/sl/modeli-si/`, `/sl/feed/` and
  `/sl/press_release/feed/` (405); redirect rows for `/sl/press-releases/` and the two e-mobility bases.
- **Chrome:** `/sl/nav` and `/sl/footer` from SKODA-1006. Elroq and Enyaq currently go to Slovak tag pages, and 9 EN
  entries are missing.
- **Newsletter:** off on the source, with an empty consent label. No newsletter card on `/sl/` (904/840).
- **Legal:** the SL set from SKODA-843. The Impressum and privacy links 404 (Q-9).

## Acceptance criteria
- [ ] ≈ 335 SL docs imported, matching the enumeration report.
- [ ] No SL page shows the newsletter card.
- [ ] No SL chrome link points to another locale, except the switcher.
- [ ] The 2 mis-dated stories carry a valid date.

## Dependencies
Q-7, Q-9, Q-12; SKODA-1004, 1001, 1006, 103a, 405, 843, 840/904.
