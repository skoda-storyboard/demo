# EN page coverage matrix (census 2026-10-15)

Every English page on the source, grouped by WordPress template, against what is imported and what is live on the demo.
It is the scope input for M2 (go-live 02 Jan 2027) and for [`SKODA-M2-READINESS-REVIEW-2026-10-15`](../reviews/SKODA-M2-READINESS-REVIEW-2026-10-15.md).

**Method (read-only, 2026-10-15):**

- Sources:
  - every non-attachment sitemap from `/sitemap_index.xml`;
  - the WordPress REST lists for `posts`, `press_release` and `pages` (all 6 locales, with Polylang `translations`);
  - one GET per EN page of the structural families, to read the `<body class>` and a few content signatures (1,647 pages).
- **Imported** means the URL is in a `tools/importer/urls-*.txt` list.
- **Live** means the URL is in [`skoda-published-url-set.txt`](skoda-published-url-set.txt), the live index of 15 Oct.
- Scripts and raw data are in `.migration/m2-review/` (`census.mjs`, `rest-lists.mjs`, `aggregate.mjs`, `profile.mjs`; output in `census/`).

## 1. The sitemaps are not a complete URL source

| Sitemap | EN URLs in the sitemap | EN on REST | Missing from the sitemap | Why |
|---|--:|--:|--:|---|
| `post-sitemap[1-4]` | 1,110 | **1,303** | 193 | 4 × 1,000 URLs, the newest `lastmod` is 2025-08-12, so the sitemap stops there |
| `press_release-sitemap[1-6]` | 1,509 | **1,580** | 72 | newest `lastmod` 2026-01-15 |
| `press_kit-sitemap[1-3]` | 697 | no REST (`wp/v2/press_kit` 404) | ≥ 95 | 95 of our 104 live press-kit URLs are not in the sitemap (Peaq, Epiq, Classic Days 2026, 125 years) |
| `page-sitemap` | 331 | 333 | 2 | – |

**Consequence:** enumerate from REST, never from the sitemaps. This affects bulk import (SKODA-803), the story corpus run
(801b) and the press-kit run (847).

Press kits have no REST list. Their full EN list has to come from the `/en/press-kits/` listing (load-more), with the
3 sitemaps as the older backfill.

## 2. Matrix

| Family | WordPress template (body class) | Side | EN pages | Imported | Live | Ticket | Notes |
|---|---|---|--:|--:|--:|---|---|
| Story | `single-post` | STO | **1,303** | 20 | **69** | 801 → **801b**, 803 | 2015–2026, ~110 per year |
| Press release | `single-press_release` | MR | **1,580** | 52 | **52** | 607, 803 | 2015–2026 |
| Press kit, hub | `single-press_kit` (3 templates) | MR | 80 + new | – | 25 | 805, 836, **847** | 46 default, 22 `template-press-release`, 12 `template-layout-article` |
| Press kit, chapter / resource | `single-press_kit` | MR | 617 + new | – | 79 | 805, 836, **847** | 565 default, 51 `template-press-release`, 1 `template-layout-article` |
| Taxonomy archives (16 taxonomies) | `archive` (tag + category) | STO + MR | **378** (+4 redirects) | 41 | **41** | 209, **848** | 77 category, 90 `history`, 33 `company`, 33 `technology`, 28 `concept`, 16 `model`, 16 `derivative`, 15 `vip`, 14 `years`, 12 `happening`, 11 `equipment`, 10 `environment`, 7 `sponsorship`, 7 `bodywork`, 7 Škodapedia categories, 2 `view`, 2 post formats, 1 `motorsport` |
| Škodapedia | `post-type-archive-skodapedia` | MR | **190** | 1 | **0** | 206, 802 | directory + 189 terms |
| Series hub | `single-skoda_series` | STO | 24 | 15 | 15 | 207 | 9 hubs not imported (e.g. `number-of-the-month`, `120-years-of-skoda-motorsport`) |
| Model page | `single-skoda_model` | MR | 23 | 23 | 23 | 208 ✅ | complete |
| **Custom full-width** | `template-custom-full-width` | STO | **201** | 0 | **0** | 210 | ~111 event-gallery pages (60+ colorbox images each), ~36 legacy press-kit pages, ~54 other (campaigns, Czech-slug event pages with ~4 words, **Company Logo**) |
| **Generic page** | `page-template-default` | STO | **41** | 1 | **0** | 813, **843** | legal set (copyright, impressum, documents, cookies, consent, terms, newsletter T&C, competition T&C), 7 IIHF campaign legal pages, ~17 event-photo pages, **Brand Group CORE (BGC)**, `server-status`, `soon-also-in-german` |
| Tiles shell | `template-tiles` | STO | 35 | 1 | 1 | 207, 210 | series directory + event-gallery hubs + legacy press-kit hubs |
| **Featured-image mini-pages** | `template-featured-image` | STO | **29** | 0 | **0** | **844** | 22 Road to Christmas (Advent) days, 7 classic-car mini pages |
| Faceted listings | `template-search-results` | MR | 5 | 5 | 5 | 402 ✅ | news, images, videos, search, press kits |
| **Company / utility** | `template-media-room-page` | MR | **3** | 1 | **0** | 810 | board of management, contacts, mobile app |
| Media cart | `template-media-cart` | MR | 2 | 1 | 1 | 505 ✅ | `/en/media-cart/` + `/en/your-downloads/` |
| 404 content | `template-404` | STO | 2 | 0 | 0 | 706 | `youve-reached-a-dead-end`, `welcome-to-our-remote-car-park` |
| Homes | `template-homepage` / `template-media-room` | STO / MR | 2 | 2 | 2 | 611 ✅ | – |
| **Newsletter** | `template-carousel-listing` | MR | 1 | 0 | 0 | **845** | 2 carousels, 30 press-release teasers grouped by plant |
| **Newsletter settings** | `template-newsletter-subscription-settings` | STO | 1 | 0 | 0 | 904 | the mailguide subscriber form; a service, not a page |
| **Sustainability** | `template-sustainability` | STO | 1 | 0 | 0 | **843** | `/en/sustainable-offices/`: 2,193 words, 28 images, 75 editor widgets |
| **IIHF 2021** | `template-iihf-2021` | STO | 1 | 0 | 0 | 210 | campaign page |
| Redirects | 301 / 302 | – | 7 + 4 | – | – | 609 (redirects) | `/en/iihf/*`, `/en/media/`, legacy press-kit pages → `/en/press-kits/…` |
| **Total** | | | **≈ 4,620** (4,526 enumerated + ≥ 95 newer press-kit pages) | | **313 (≈ 7%)** | | |

Bold rows have **never been analysed**, or the analysis found a change.

## 3. The company / Media Room "Company" pages

The Media Room nav **Company** menu links to 6 pages. The footer adds the legal set and 2 RSS feeds.

| Page | Linked from | Template today | 15 Sep spec (`company-pages.md`) | Change |
|---|---|---|---|---|
| `/en/board-of-management/` | MR nav "Management" | `template-media-room-page` | exec-bio | – (6 row toggles, 34 gallery images) |
| `/en/contacts/` | MR nav + footer | `template-media-room-page` | contact-directory | – |
| `/en/skoda-media-services-application/` | MR nav "Mobile App" | `template-media-room-page` | app-promo | – |
| `/en/company-logo/` | MR nav | **`template-custom-full-width`** | brand-asset grid, "36 assets" | **template changed**; 18 assets / 18 PDF links |
| `/en/brand-group-core-bgc/` | MR nav | `page-template-default` | – | **not in the spec**: 380 words, 1 image, 1 embed. A page-base page (813) |
| `/en/newsletter/` | MR nav | `template-carousel-listing` | – | **not in the spec**: press-release carousels by plant (845) |
| `/en/annual-reports/` | – | **404 on the source** | download-list | **removed from the source**: drop the sub-type from 810 or confirm it with the client |

Footer links: `/en/copyright/`, `/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing/`,
`/en/newsletter-settings/`, `/en/feed/` (RSS) and `/en/press-releases/feed/` (302 → `/en/feed/?post_type=press_release`).
None of these is live on the demo. The RSS URLs are SKODA-405's output paths.

## 4. Other languages

From REST, with Polylang `translations`. "no EN" means the item has no English translation.

| Type | EN | CS | DE | SK | SR | SL |
|---|--:|--:|--:|--:|--:|--:|
| Stories | 1,303 | 1,453 (162 no EN) | 736 (527 no EN) | 832 (286 no EN) | 549 (45 no EN) | 314 (157 no EN) |
| Press releases | 1,580 | 2,455 (**894 no EN**) | 1,260 (1 no EN) | 641 (354 no EN) | 351 (50 no EN) | 4 (2 no EN) |
| Pages | 333 | 119 (7 no EN) | 26 (7 no EN) | 30 (4 no EN) | 21 | 12 |

- **2,478 stories and press releases exist only in a language other than English**: 1,056 in CS, 528 in DE, 640 in SK,
  95 in SR, 159 in SL.
- EN + CS is the confirmed primary pair (D1). CS alone adds 1,056 items that no EN import will ever create.
- Input for SKODA-1001 / 1002 and the D1 / D7 decisions.
