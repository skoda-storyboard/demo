# SKODA-1004b, DE corpus import (Škoda Auto Deutschland)

- **Epic:** E10, Localization
- **Type:** import
- **Phase:** D · **Milestone:** M2; timing per **Q-7** (freeze and import before DNS, or keep WordPress behind a path route)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–5d *(planning estimate, not a quote)*
- **GitHub issue:** to create
- **Status (2026-10-20):** 🔵 TODO (M2), no owner, blocked on Q-7 and Q-8. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-DE-01 … L-DE-18.

## Why
DE is a live German-market site authored by Škoda Auto Deutschland, not a translation target:
- 80 stories in 2026, 72% of them with no EN version;
- 736 stories, 1,260 press releases, 26 pages, 570 press-kit URLs and 188 Škodapedia terms.

The DE press releases have been frozen since 2023-03-16. The DE header links "Media Room" to skoda-media.de, and
1,259 of the 1,260 releases have an EN twin.

## Scope
- **Stories and pages:** import with the SKODA-1004 tooling and the DE path map. The category bases are German with a
  `-de` suffix (e.g. `emobilitat-de`), and many slugs stay English.
- **Press releases, DE Media Room and DE press kits:** per **Q-8**. The proposed default is a 301 per release to its EN
  twin, and DE Media Room and press-kit URLs to skoda-media.de: redirect rows only, no import.
- **Pkw-EnVKV:** 218 stories (30%) carry legally required consumption and CO2 statements. The importer must keep them
  verbatim; check the count before and after.
- **Protected posts:** skip the 11 password-protected posts and redirect them (Q-13).
- **Back-dated posts:** 23 posts are dated 2000–2009, 11 of them competition T&Cs. They are exempt from any cutoff
  (Q-12) and hidden from date-sorted listings (1001 flag).
- **Škodapedia:** 188 DE terms through the per-locale generator (802).
- **Facets:** the DE taxonomy holds foreign terms (`peaq-en`, `kushaq-modely-cs`) and no Peaq/Epiq model term. Map it
  by translation group and give the client a clean-up list.
- **Chrome:** the DE nav and footer from SKODA-1006: own categories, German social accounts, no Series/Podcast, no
  newsletter entry.
- **Newsletter:** off on the source. Don't show the newsletter card on `/de/` until 904 says otherwise.
- **Legal:** the DE set from SKODA-843: `/de/impressum/` is Must, plus the privacy notice per Q-9 (two controllers
  today).

## Acceptance criteria
- [ ] Imported stories and pages match the enumeration report. Releases and press kits are redirected or imported
      as decided in Q-8.
- [ ] On 10 sampled stories, the Pkw-EnVKV sentence count matches the source.
- [ ] `/de/impressum/` renders on the preview; the protected posts redirect.
- [ ] 20 sampled DE URLs 200 or 301 on the preview host.

## Dependencies
Q-7, Q-8, Q-9, Q-12, Q-13; SKODA-1004, 1001, 1006, 103a, 843, 802.
