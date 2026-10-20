# SKODA-1004d, SR corpus import (Serbian Latin, Autočačak)

- **Epic:** E10, Localization
- **Type:** import
- **Phase:** D · **Milestone:** M2; timing per **Q-7**
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d *(planning estimate, not a quote)*
- **GitHub issue:** to create
- **Status (2026-10-20):** 🔵 TODO (M2), no owner. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-SR-01 … L-SR-16.

## Why
SR is live and maintained:
- 549 stories (41 in 2026) and 351 press releases (31 in 2026), mostly human translations, plus local items from the
  Serbian importer (Autočačak);
- 571 press-kit URLs that no list counts; 11 series hubs;
- no model pages: the 17 SR models are tag archives.

## Scope
- **Import** every SR template with the SKODA-1004 tooling.
- **Script:** SR is 100% Serbian Latin (Q-14). Any automated text step must not produce Cyrillic; add a check that
  rejects Cyrillic code points in the imported title, description and body.
- **Language tags:** hreflang `sr`; `<html lang>` `sr-Latn`, because bare `sr` reads as Cyrillic to CLDR and `Intl`.
  Analytics value `sr-latn-cs`, importerBid 457 (SKODA-804).
- **Bases and feeds:** `/sr/press_release/` (EN `/press-releases/`), `/sr/press-kits/`, `/sr/feed/` and
  `/sr/press_release/feed/`. Add the slug-only 301s to the redirect rows.
- **Facets:** a mixed vocabulary (`-sr`, `-rs`, `-sl`, `-de`, `-en` suffixes; untranslated names). Drop the SL
  category from 76 SR posts. The 29 permalinks under `/sr/modeli-si/` keep their paths or get redirect rows.
- **Models:** the 17 tag archives become a facet listing or redirect (1001 model-page strategy). Fill or drop the
  empty SR Media Room "Modeli" menu.
- **Chrome:** SR nav, footer and MR nav/footer from SKODA-1006. "Modeli" must link the SR models page, not
  `/sl/category/modeli-si/`; the demo `/sr/nav` copied the SL link.
- **Placeholders:** the full EN key set with SR values from the source ("Učitaj više", "Pretraga").
- **Legal and newsletter:** the SR set from SKODA-843 (6 URLs, last edited 2020-08-31). The SR newsletter uses list 389
  with `lang=sr` (904).

## Acceptance criteria
- [ ] Imported counts per type match the enumeration report; 0 Cyrillic code points in the imported SR text.
- [ ] `<html lang="sr-Latn">` and hreflang `sr` on the sampled pages; dates stay numeric.
- [ ] No `/sr/` chrome link points to another locale, except the switcher.
- [ ] 20 sampled SR URLs 200 or 301 on the preview host.

## Dependencies
Q-7, Q-9, Q-14; SKODA-1004, 1001, 1003, 1006, 103a, 804, 843, 904.
