# SKODA-843, Generic pages: legal set, BGC, sustainability page, and the keep / drop list for the rest
- **Epic:** E08, Editorial at Scale
- **Type:** import / template · **Phase:** B · **Milestone:** M2 (go-live 02 Jan 2027)
- **GitHub issue:** [#363](https://github.com/skoda-storyboard/demo/issues/363) (created 2026-10-15 from the M2 readiness review)
- **Estimate:** 2–3 SP *(planning estimate, not a quote)*
- **Status (2026-10-15):** 🔵 TODO (M2), no owner. Rides on the SKODA-813 page base shell.

## Why
The census ([coverage matrix](../../planning/SKODA-PAGE-COVERAGE-MATRIX.md) §2) found 41 EN `page-template-default` pages
and 1 `template-sustainability` page. None of them is imported or live. Some of them are linked from the footer on every
page: copyright and the consent document. Others are empty or obsolete.

## Scope
| Group | Pages | Proposal |
|---|---|---|
| Legal, footer-linked | `/en/copyright/`, `/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/` | **Must** at go-live: page base (813) |
| Legal, other | `/en/documents/`, `/en/documents/cookies/` (2,132 words), `/en/terms-and-conditions-2/`, `/en/newsletter-terms-and-conditions/`, `/en/botas-x-skoda-guess-where-are-we-competition-terms-conditions/` | Keep: page base. Confirm with the client's legal owner |
| Company | `/en/brand-group-core-bgc/` (MR nav Company menu; 380 words, 1 image, 1 embed) | **Must**: page base on the MR side (nav/footer metadata as 309) |
| Sustainability | `/en/sustainable-offices/` (`template-sustainability`, 2,193 words, 28 images) | Page base + Columns / images. Check one representative render |
| IIHF campaign legal | 7 pages under `/en/iihf/…` (`/en/iihf/` itself 302s) | Client decision: keep or redirect |
| Empty / obsolete | `/en/impressum/` (1 word), `/en/server-status/`, `/en/soon-also-in-german/` | Drop and redirect. Client to confirm |
| Event photo pages on this template | ~17 (`/en/scd2021/*`, `skoda-digilab-rebranding-event`, `ivet23`) | Go with SKODA-210 (event galleries) |

## Acceptance criteria
- [ ] Client-confirmed keep / drop list. Every dropped URL has a redirect row (609 pattern).
- [ ] Every kept page is imported with `import-page-base` and previews with valid metadata; the footer-linked legal pages
      and BGC are published before go-live.
- [ ] The footer links to copyright and consent resolve on `.aem.live` (no 404).

## Dependencies
813 (shell), 809/D15 (who owns legal copy), 609 (redirect sheet).
