# M2 locale review: what the requirements miss outside EN (2026-10-20)

An adversarial pass over the five non-EN locales of the source, against the M2 (go-live 02 Jan 2027) requirements,
tickets and decisions. It follows [`SKODA-M2-READINESS-REVIEW-2026-10-15`](SKODA-M2-READINESS-REVIEW-2026-10-15.md),
which counted the other languages but analysed EN only.

**Method (read-only, 2026-10-20):**

- **Reviewers.** Five per-locale reviewers (CS, DE, SK, SR, SL) and one cross-locale reviewer ran in parallel.
- **Lenses.** Each locale reviewer worked through eight lenses:
  1. inventory and cutoff;
  2. templates and widgets;
  3. locale chrome;
  4. legal;
  5. language mechanics;
  6. URLs and redirects;
  7. media and services;
  8. index and facets.
  
  The cross-locale reviewer covered:
  - X1 switcher;
  - X2 hreflang;
  - X3 translation pairs;
  - X4 routing;
  - X5 demo state;
  - X6 editorial model against requirement 6.8.
- **Requests.** HTTP and REST only, capped at 2 requests per second and 150 pages per reviewer. The cross-locale reviewer
  measured 69 pages in an isolated browser.
- **Verification.** A separate verifier tried to refute every High and Critical finding. It re-fetched the evidence
  and grepped `docs/` for existing coverage. Two findings were also re-checked by hand: L-CS-01 (the CS volume) and
  L-DE-09 (the DE Impressum).
- **Inputs.** The REST census of 15 Oct (`.migration/m2-review/census/`) and a baseline of what the docs already know.
  Findings already covered by a ticket or decision were dropped as KNOWN.
- **Classes.** Each finding is **NEW** (nothing covers it), **UNDER-SCOPED** (a ticket exists but misses it),
  **CONTRADICTED** (the docs say otherwise) or **ESTIMATE-RISK** (the volume or effort assumption is wrong).
- **Working files.** Per-locale reports, JSON records, scratch data and the run transcripts are in
  `.migration/m2-locale-review/` (local, not committed).

## 1. Summary

**90 findings survived verification: 0 Critical, 8 High, 56 Medium, 26 Low. None were rejected; 19 were downgraded.**

The other languages are not an EN translation that M2 fills in later. Three of them are **separately authored national
sites** with their own owners, newsrooms, legal entities, newsletter lists, menus and taxonomies. M2 has no ticket that
moves their existing content.

1. **No ticket imports the non-EN corpus (≈ 12,000 URLs).**
   - SKODA-803 enumerates EN only.
   - SKODA-1002 plans DE/SK/SR/SL as Experience Workspace (EW) machine-translation projects.
   - SKODA-1001 sets up empty trees.
   - CS, the go-live partner of D1, is ≈ 5,100 docs, not the 1,056 in Q-6 (L-X-03, L-CS-01, L-SK-01, L-SR-01).
2. **DE, SK and SR are written locally, not translated.**
   - DE: 72% of 2026 DE stories have no EN version, and they are authored by Škoda Auto Deutschland. 218 DE stories
     carry German Pkw-EnVKV consumption and CO2 statements that no machine translation from EN can produce.
   - SK: 456 SK items have no translation anywhere.
   - SR: written by the Serbian importer. It is 100% Serbian **Latin**, while the default Google `sr` target writes
     Cyrillic.
   
   D1's "on demand" leaves these sites without a platform at the 02 Jan cutover (L-DE-02, L-DE-04, L-SK-01, L-SR-01/03).
3. **Every locale has its own legal set and its own data controller, and SKODA-843 is EN only.**
   - **/de/impressum/** is the legally required imprint of Škoda Auto Deutschland GmbH (HRB 5242, MStV §18, VSBG).
     Q-1's "drop impressum" is right only for the empty EN page (L-DE-09).
   - CS consent and newsletter terms are linked from every CS form, and the newsletter terms still cite Act
     101/2000 Sb., repealed in 2019 (L-CS-05).
   - SK uses ŠKODA AUTO Slovensko as controller but shows the EN consent text. SR's texts date from 2020. SL is Porsche
     Slovenija, and two of its legal links return 404 (L-SK-08, L-SR-08, L-SL-07).
4. **The census under-counts.**
   - Press kits: about 2,600 non-EN press-kit URLs are in the sitemaps.
   - A fourth press-kit sitemap (`press_kit-sitemap4.xml`, 540 URLs, 2025–2026) exists but isn't in the sitemap index.
     It adds **158 EN URLs** that coverage matrix §2 doesn't count either.
   - Škodapedia, model pages and series per locale were never counted.
   - Polylang REST `translations` include 100 unpublished targets (L-SK-02, L-SR-13, L-CS-07, L-X-07).
5. **The site after go-live has no workflow for translation pairs.** hreflang, and so the switcher, comes from one
   central bulk sheet built from the WordPress heads. Nothing describes how an author links a new translation once
   WordPress is off. Requirement 6.8 says translation is a manual copy (L-X-02).
6. **Legacy URLs end in a slash, and EDS 404s the slashed form.** No M2 ticket adds a site-wide inbound rule. This
   affects about 15,000 indexed URLs in 6 locales, the locale homes included (L-X-01).
7. **Media metadata is per locale.** SK and CS media items carry their own titles and alt text. The M2 media feed
   (511/517) is a single EN feed on deduplicated assets, so the SK and CS Images/Videos rails would lose them. This
   matters at go-live, because CS has its own Media Room rails (L-SK-15, L-CS-10).
8. **Smaller, broad patterns:**
   - six different Media Room menus;
   - DE's Media Room points to skoda-media.de, and its press releases have been frozen since March 2023;
   - SR and SL menus link to other locales;
   - per-locale taxonomies have mixed slug suffixes, so facets must map by Polylang translation group, not by slug;
   - feeds, URL bases and placeholders differ per locale;
   - 11 DE posts are password-protected, and EDS has no page passwords.

**Held up (tested):**
- COM05's "show only existing languages" rule (69 of 69 pages);
- hreflang reciprocity;
- the story widget set is the same in EN and CS;
- the brand font covers Serbian Latin and Cyrillic;
- banners per locale match SKODA-903;
- the demo code already loads `/{locale}/query-index.json`.

### What changes for M2

| Locale | Stories / releases / pages (REST, 20 Oct) | + press kits (sitemaps 1–4, a floor) | + Škodapedia / models / series | ≈ Docs | Editorial status | Owner the docs don't name |
|---|---|--:|---|--:|---|---|
| CS | 1,454 / 2,456 / 119 | 845 | 189 / 23 / 25 | **5,100** | live national newsroom (35 CS-only releases in 2026) | HQ (D1) |
| DE | 736 / 1,260 / 26 | 570 | 188 / – / – | **2,800** | stories live; press releases frozen since 2023-03 (MR → skoda-media.de) | Škoda Auto Deutschland |
| SK | 833 / 642 / 30 | 626 | 159 / 13 / 13 | **2,300** | live, own Media Room and PR contact | ŠKODA AUTO Slovensko |
| SR | 549 / 351 / 21 | 571 | – / 0 / 11 | **1,500** | live (72 items in 2026), human-translated | Autočačak (importer) |
| SL | 314 / 4 / 12 | 0 | – / – / 5 | **335** | launched 2024, fed by EN translations | Porsche Slovenija |

**Totals.** ≈ 12,000 non-EN docs against ≈ 4,800 EN docs (4,620 in the matrix plus the 158 found in sitemap 4).

**Effect on the decisions:**
- D1 decides *when* each locale goes live, but every locale still needs an import. "On demand" is only a choice of
  timing.
- The real choice per non-go-live locale is what happens to its WordPress tree at the DNS cutover: keep it, freeze it,
  or redirect it.

## 2. Matrix

Lenses: 1 inventory · 2 templates · 3 chrome · 4 legal · 5 language · 6 URLs · 7 media/services · 8 index/facets ·
X1 switcher · X2 hreflang · X3 pairs · X4 routing · X5 demo · X6 editorial model. Each cell gives the number of
findings and, in brackets, the highest severity (H, M or L).

| File | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | X1 | X2 | X3 | X4 | X5 | X6 | Total |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| cs | 4 (H) | 2 (L) | 1 (M) | 1 (H) | 2 (M) | 1 (L) | 3 (M) | 1 (M) | – | – | – | – | – | – | 15 |
| de | 3 (H) | 3 (M) | 2 (M) | 3 (H) | 2 (M) | 1 (L) | 2 (M) | 2 (M) | – | – | – | – | – | – | 18 |
| sk | 3 (M) | 2 (L) | 2 (M) | 2 (M) | 2 (M) | 3 (M) | 1 (H) | 2 (M) | – | – | – | – | – | – | 17 |
| sr | 2 (M) | – | 2 (M) | 1 (M) | 5 (M) | 1 (M) | 3 (M) | 2 (M) | – | – | – | – | – | – | 16 |
| sl | 2 (M) | 1 (L) | 3 (M) | 1 (M) | 2 (L) | 1 (M) | 3 (L) | 1 (M) | – | – | – | – | – | – | 14 |
| cross-locale | – | – | – | – | – | – | – | – | 1 (M) | 1 (M) | 1 (M) | 3 (H) | 1 (L) | 3 (H) | 10 |

| Severity | Kept | of which CONFIRMED |
|---|--:|--:|
| Critical | 0 | 0 |
| High | 8 | 8 |
| Medium | 56 | 15 |
| Low | 26 | 1 |

Rejected by the verifier: 0.

## 3. High findings

| Id | Locale | Class | Finding | Evidence (verified) | Proposed action |
|---|---|---|---|---|---|
| L-X-03 | all | UNDER-SCOPED | No ticket imports the existing non-EN corpus; SKODA-1002 treats it as a machine-translation rollout | 8,803 REST items + ~2,900 press-kit/Škodapedia/series/model URLs; 803 enumerates EN REST lists only | **New ticket** "non-EN corpus import" per locale (REST and listing enumeration, the EN importers + locale chrome, media, redirects), sized per D1. Reword 1002 as post-go-live authoring of new translations, MT optional |
| L-CS-01 | cs | UNDER-SCOPED | The CS go-live corpus has no import ticket; it is ≈ 5,100 docs, not 1,056 | REST 20 Oct: 1,454 / 2,456 / 119; 845 CS press-kit URLs in sitemaps 1–4 (hand-checked) | Amend 803 with a CS run (hreflang columns from Polylang); amend D1/Q-6 to the real volume; correct the 1002 milestone note (the M1 CS demo set isn't the CS corpus) |
| L-DE-02 | de | CONTRADICTED | DE is a live German-market site authored by Škoda Auto Deutschland, not a translation target | 80 DE stories in 2026, 72% with no EN version; Impressum names Škoda Auto Deutschland GmbH | Amend D1: name the DE owner and add a cutover plan for locales not live on 02 Jan (keep WP `/de/` behind a path route, or freeze and import); amend 1002 |
| L-DE-09 | de | CONTRADICTED | `/de/impressum/` is the legally required imprint; Q-1/843 propose dropping "impressum" | 187-word imprint (HRB 5242, MStV §18, VSBG), linked 3× from the DE footer (hand-checked) | Amend Q-1/843: drop `/en/impressum/` only; `/de/impressum/` is Must for DE, with legal owner Škoda Auto Deutschland (D15) |
| L-CS-05 | cs | UNDER-SCOPED | The CS legal set (6 pages + IIHF T&C) is outside 843; every CS form links its consent page | the newsletter terms cite Act 101/2000 Sb. (repealed 2019); the CS footer legal links go to skoda-auto.cz | Amend 843 with a CS column; legal question to D15's owner on the newsletter terms |
| L-SK-15 | sk | UNDER-SCOPED | SK media titles and alt text are localised; the M2 media feed is one EN feed on deduplicated assets | SK MR Images rail: 25 items with SK titles; the Epiq Sportline release pair shares 19 files with different alt text per locale; 504 deduplicates into one asset, 511 builds `/en/media-feed.json` only. Kept High because CS goes live with its own Images/Videos rails | New decision on per-locale media metadata (AEM localised fields vs an overlay sheet); amend 511/517: feed per locale or a lang-keyed title column |
| L-X-01 | all | NEW | Legacy URLs end in a slash and EDS 404s the slashed form; no site-wide inbound rule | `/en/media-room/` 404, `/en/media-room` 200 on the demo; slashless source homes 301 to the slashed form | **New ticket** (before the DNS switch): a CDN rule that 301s `/{path}/` to `/{path}` in every locale; amend 1003 (root targets `/cs`, not `/cs/`) |
| L-X-02 | all | UNDER-SCOPED | Translation pairs live in one bulk sheet built from WordPress heads; nothing keeps them after go-live | 9,649 rows for all locales (5,928 EN+CS); 4,524 EN/CS rows are rewritten when other locales arrive | New decision on where pairs live after go-live (page hreflang metadata, per-locale sheets, or a translation-group id resolved at runtime) + **new ticket** for the author "link a translation" workflow in DA/EW |

## 4. All findings

Sorted by severity. "Was" shows the reviewer's severity when the verifier changed it. Medium and Low findings were not
individually verified ("not required"), except where the verifier checked them as CONTRADICTED.

| Id | Sev | Class | Verdict | Title | Tickets / reqs | Proposed action |
|---|---|---|---|---|---|---|
| L-CS-01 | High | UNDER-SCOPED | CONFIRMED | No ticket imports the CS corpus at go-live; the real CS volume is ~5,000 docs, not the 1,056 in D1/Q-6 | SKODA-803, SKODA-1001, SKODA-1002, MIG04, 6.8 | Amend SKODA-803: add a CS run (REST ?lang=cs for posts, releases, pages and Škodapedia; the /cs/tiskove-mapy/ listing for press kits), with Polylang translations written to hreflang columns. Amend D1/Q-6 so 'CS at go-live' means about 5,000 docs. Correct the SKODA-1002 milestone note: the M1 CS demo set is not the go-live CS corpus. |
| L-CS-05 | High | UNDER-SCOPED | CONFIRMED | The CS legal set (6 pages plus the IIHF T&C) is outside SKODA-843; the consent page every CS form links to is not scoped | SKODA-843, SKODA-809, Q-1, D15 | Amend SKODA-843: add a CS column (Must: copyright, consent; Keep/confirm: newsletter terms, privacy, documents, cookies; IIHF: decision). Legal question to D15's owner: 'Is /cs/podminky-zasilani-novinek/ (cites Act 101/2000 Sb.) still valid, or must it be replaced before go-live?' |
| L-DE-02 | High | CONTRADICTED | CONFIRMED | DE is a live German-market editorial site (Škoda Auto Deutschland), not a translation target; D1 "on demand" leaves it without a platform at cutover | SKODA-1002, SKODA-1001, 6.8, COM05 | amend D1: name Škoda Auto Deutschland as DE content owner; add cutover plan for locales not live on 02 Jan 2027 (keep WP /de/ behind a path route, or freeze-and-import). Client question: "Who in Weiterstadt authors /de/ today, and must they keep publishing without a gap on 02 Jan 2027?" Amend 1002: DE is local authoring + author onboarding, not translation. |
| L-DE-09 | High (was Critical) | CONTRADICTED | CONFIRMED | DE Impressum is the legally required imprint of Škoda Auto Deutschland GmbH; Q-1 and SKODA-843 propose dropping "impressum" | SKODA-843, SKODA-1001, Q-1 | amend SKODA-843 + Q-1: "drop impressum" applies to /en/impressum/ only; /de/impressum/ is Must for the DE go-live with legal owner (D15) = Škoda Auto Deutschland. Client question: "Please confirm the current managing directors for the DE Impressum." |
| L-SK-15 | High | UNDER-SCOPED | CONFIRMED | SK media items carry Slovak titles and alt text, but the M2 media feed (511/517) is one EN feed keyed on one deduplicated asset. SK Images/Videos rails would show EN or no titles | SKODA-504, SKODA-511, SKODA-517, SKODA-512, SKODA-608, MIG04, MR-H06 | new decision Q-n: how are per-locale media titles/alt stored (AEM localized metadata fields, e.g. dc:title per language, vs a per-locale overlay sheet) + amend 511/517: feed per locale (/{locale}/media-feed.json) or a lang-keyed title column |
| L-X-01 | High | NEW | CONFIRMED | Every legacy URL ends in a slash and EDS 404s the slashed form; no M2 ticket adds a site-wide inbound slash rule | SKODA-103, SKODA-803, SKODA-609, SKODA-1003, 8.1, MIG04 | new ticket (M2, before DNS switch): CDN rule that 301s /{path}/ to /{path} for every locale (BYO-CDN edge or the production CDN). Amend SKODA-1003: root targets are /cs, not /cs/ |
| L-X-02 | High | UNDER-SCOPED | CONFIRMED | Translation pairs live in one central bulk sheet built from the WordPress heads; no workflow keeps them after go-live | SKODA-1001, SKODA-1002, SKODA-303a, 6.8, COM05, MIG04 | new decision Q-n: where translation pairs live after go-live (page-level hreflang metadata, per-locale sheets, or a translation-group id in the index that the switcher resolves at runtime) + new ticket for the author "add/link a translation" workflow in DA/EW; amend SKODA-1001 AC with reciprocity checks after every locale batch |
| L-X-03 | High | UNDER-SCOPED | CONFIRMED | No ticket imports the existing non-EN corpus (~11.7k URLs); SKODA-1002 treats it as machine-translation rollout | SKODA-1001, SKODA-1002, SKODA-803, SKODA-801b, SKODA-847, 6.8, MIG04, D1, Q-6 | new ticket "non-EN corpus import" per locale (REST- and listing-enumerated, reuse the EN importers + locale chrome), sized per D1; reword SKODA-1002 as post-go-live authoring of new translations, MT optional |
| L-CS-02 | Medium (was High) | ESTIMATE-RISK | CONFIRMED | The 894 CS-only press releases are a live Czech domestic newsroom (2015-2026) with no cutoff decision | SKODA-803, SKODA-1001, MIG04 | Add a CS row to D7 (proposed: all CS releases from 2015, 2,456). Client question: 'Do the Czech-only releases (local pricing, plant community newsletters, CSR) move with the site, or can releases before year X be dropped with a redirect?' |
| L-CS-03 | Medium | CONTRADICTED | CONFIRMED | 'CS-only' stories are really CS+SK: 138 of 162 have an SK twin, and 130 are one 2025 series (/cs/130let/) | SKODA-1001, SKODA-1002, COM05, 6.8 | Amend SKODA-1001: count CS+SK pairs separately from true CS-only items, and add a backfill step that writes hreflang:sk into CS docs when SK launches. Add the /cs/130let/ redirect (https) to the redirect sheet. |
| L-CS-04 | Medium (was High) | UNDER-SCOPED | CONFIRMED | Newsletter: 4 Mailguide lists (2 per locale, Storyboard vs Media Room); the docs know only EN list 389 | SKODA-904, SKODA-840, D4 | Amend SKODA-904: add a list map {en: stories 389 / MR 339, cs: stories 386 / MR 342, others TBD}, plus the per-locale consent and management URLs. Client question to mailguide.cz: are the 4 lists still active, and should CS keep separate Storyboard and Media Room lists? |
| L-CS-06 | Medium | UNDER-SCOPED | not required | The CS Media Room chrome isn't authored; its nav differs from EN in podcast show, model slugs and anchors | SKODA-303, SKODA-309, SKODA-1001, COM05 | Amend SKODA-1001 (or 309): author /cs/media-room/nav and the MR footer for CS. Set explicit ids on the /cs/kontakty/ headings (podnik, produkt, sponzoring), or rewrite the footer anchors. |
| L-CS-07 | Medium | UNDER-SCOPED | not required | CS press kits (~691+ URLs under /cs/tiskove-mapy/) aren't in the census and have no REST endpoint | SKODA-847, SKODA-805, SKODA-803, MIG04 | Amend SKODA-847/803: enumerate CS kits from the /cs/tiskove-mapy/ listing (as for EN), and include the CS page-based kits. |
| L-CS-08 | Medium | UNDER-SCOPED | not required | The 15 facet groups hold in CS, but the facet values are a separate CS vocabulary with CS-only terms | SKODA-1001, SKODA-401, D12, MIG04 | Amend SKODA-1001: the per-locale index stores locale labels (or slugs), with a term translation map from Polylang; add CS-only terms; clean up the mis-filed terms. |
| L-CS-09 | Medium | NEW | not required | Source hreflang is per-item and partly wrong; x-default only on the homes; 9 CS slugs contain non-ASCII code points | SKODA-1001, SKODA-103, SKODA-609, 8.1, COM05 | Amend SKODA-1001: generate hreflang from the Polylang translations map with a denylist (test pages, mis-pairs), and decide an x-default policy. Amend SKODA-103: add a slug-normalisation + redirect rule for non-ASCII slugs. |
| L-CS-10 | Medium | UNDER-SCOPED | not required | CS media metadata lives in separate attachment records; file dedup must keep Czech titles, captions and labels | SKODA-517, SKODA-520, SKODA-1003, MIG04 | Amend the M2 asset ingest (517/520): dedup the binary but keep locale metadata (title/caption/alt per locale, keyed by the Polylang translations map). Add the media-cart strings to the CS placeholders. |
| L-DE-01 | Medium (was High) | ESTIMATE-RISK | CONFIRMED | DE press releases are a frozen archive: the German Media Room moved to skoda-media.de in 2023; 1,259 of 1,260 have an EN twin | SKODA-1001, SKODA-1002, SKODA-609, SKODA-303, MIG04, 8.1 | new decision Q-n: DE press releases = archive; migrate as-is, or 301 each to its EN twin / skoda-media.de (redirect rows via 609). Client question: "Is the German Media Room on the Storyboard retired in favour of skoda-media.de? May we redirect /de/pressemitteilungen-archive/* and /de/media-room/?" |
| L-DE-03 | Medium | NEW | not required | 23 DE posts are back-dated to 2000-2009 (20 to the year 2000), incl. 11 competition T&Cs; a date cutoff or date sort breaks them | SKODA-843, SKODA-1001, MIG04 | amend D7: cutoff applies by type, never to legal/T&C posts; amend 1001: add a hide-from-listing flag (or keep publish date) for back-dated evergreen posts |
| L-DE-04 | Medium (was High) | CONTRADICTED | CONFIRMED | 218 DE stories (30%) carry German Pkw-EnVKV fuel/energy/CO2 statements, also inside translations of EN stories; machine translation from EN cannot produce them | SKODA-1002, SKODA-801, 6.8, MIG04 | amend SKODA-1002: DE rollout = translate + mandatory local legal review (Pkw-EnVKV values) by Škoda Auto Deutschland; no auto-publish of machine-translated DE. Add an importer check that the consumption/CO2 sentences survive (count before/after). Client question: "Who in Germany signs off Pkw-EnVKV values on the Storyboard, and must values be refreshed when type approvals change?" |
| L-DE-05 | Medium (was High) | NEW | CONFIRMED | 11 DE posts are password-protected (dealer/retail content); EDS has no page passwords | SKODA-1001, SKODA-803, SKODA-609, MIG04 | new decision: exclude protected posts from every import (filter content.protected) and redirect them; client question: "Who uses the passwords for these 11 German pages, and are they still needed?" Check other locales for the same flag. |
| L-DE-07 | Medium | NEW | not required | DE nav and footer are a different menu: own categories, no Series/Podcast/Škoda World/eMobility, German social accounts, no newsletter entry, no Whistleblower link | SKODA-304, SKODA-302, SKODA-1001, 6.8, COM05 | amend 302/304: per-locale nav + footer fragments authored from the source menus (DE list attached); client question on Whistleblower link for DE |
| L-DE-10 | Medium (was High) | NEW | CONFIRMED | DE legal set mixes two controllers: SAD Datenschutzerklärung (copied from welovecycling.com) is unlinked, footer links Czech HQ EN privacy + EN cookie PDF | SKODA-843, SKODA-904, Q-1 | amend SKODA-843: add a DE legal set (impressum, datenschutzerklaerung, consent info, cookie info, competition T&Cs) with keep/drop per page; D15: legal owner for DE. Client question: "Which privacy notice is valid for skoda-storyboard.com/de: Škoda Auto a.s. or Škoda Auto Deutschland GmbH?" |
| L-DE-11 | Medium | UNDER-SCOPED | not required | DE competition T&Cs (Teilnahmebedingungen) live in 12 items across posts and pages, outside the EN legal set | SKODA-843, Q-1 | amend SKODA-843: DE competition terms group, client keep/drop |
| L-DE-12 | Medium | UNDER-SCOPED | not required | DE newsletter is switched off in the source (popup inactive, no Subscribe entry) but posts to the same mailguide list 389 as EN with lang=de | SKODA-904, D4 | amend SKODA-904: per-locale config (active flag, lang field, list id); client question: "Is there a German newsletter audience in mailguide list 389 (lang=de)?" |
| L-DE-13 | Medium | UNDER-SCOPED | not required | DE paths do not follow EN: category bases are German with a -de suffix, many slugs stay English; a Translation-project copy of an EN doc lands on the wrong DE URL | SKODA-1001, SKODA-1002, SKODA-103, 8.1, MIG04 | amend SKODA-1001: per-locale path map (EN category base to DE base, e.g. emobility to emobilitat-de); amend SKODA-1002: Translation projects must rewrite the target path with that map |
| L-DE-16 | Medium | UNDER-SCOPED | not required | DE press kits: 277 /de/pressemappe/ URLs with no REST list and no census row; they retire with the DE Media Room | SKODA-847, SKODA-1001, MIG04 | fold into the L-DE-01 decision; if kept, amend SKODA-847 with a DE listing enumeration |
| L-DE-17 | Medium | UNDER-SCOPED | not required | Škodapedia exists in DE with 188 terms (EN 189); SKODA-802 generates EN term docs only | SKODA-802, SKODA-206, MIG04 | amend SKODA-802: the generator runs per locale (path /{locale}/modals/skodapedia/{slug}); DE = +188 docs |
| L-DE-18 | Medium | NEW | not required | DE taxonomy has leaked foreign terms and no Peaq/Epiq model term; facet values must map by translation group, not slug | SKODA-1001, SKODA-601, MIG04, D12 | amend SKODA-1001: per-locale facet value map keyed on Polylang term translations; a data clean-up list for the client (assign Peaq/Epiq model terms in DE) |
| L-SK-01 | Medium (was High) | UNDER-SCOPED | CONFIRMED | No ticket imports the existing SK corpus; SKODA-1002 treats SK as a translation job, but SK is a separately authored, actively maintained locale | SKODA-1002, SKODA-803, SKODA-1001, 6.8, MIG04, Q-6 | new ticket: 'SK source import' (REST enumeration of all SK posts/press_release/press_kit/skodapedia/skoda_model/series/pages, run the existing importers with SK chrome, media, redirects). Amend SKODA-1002 so it only covers the gaps that remain after the import. |
| L-SK-02 | Medium (was High) | UNDER-SCOPED | CONFIRMED | The census (coverage matrix §4, Q-6) leaves out SK press kits, Škodapedia, model pages and series: about 660 more SK URLs | SKODA-1001, SKODA-1002, SKODA-802, SKODA-805, Q-6, MIG04, MR-H06 | amend coverage matrix §4 / Q-6: add per-locale rows for press_kit (enumerated from /sk/tlacove-mapy/ load-more, not the sitemap), skodapedia, skoda_model and series |
| L-SK-03 | Medium | ESTIMATE-RISK | not required | SK cutoff is a different shape from EN: there are no SK press releases before Feb 2020, and the 2025 story spike is the CS-shared '130 rokov' series | SKODA-1001, SKODA-1002, D7, Q-6 | new decision row under D7: a per-locale cutoff for SK (all SK content is 2017+; propose 'all SK', ~1.5k docs before press kits) |
| L-SK-06 | Medium | UNDER-SCOPED | not required | A full Slovak Media Room exists: local releases, a named local PR contact, local press kits, SK-only nav and footer. Its chrome differs from EN in more than language | SKODA-305, SKODA-309, SKODA-810, SKODA-1002, COM18, MR-H06, 6.8 | amend SKODA-1002 (or a new SK chrome ticket): /sk/media-room/nav and /sk/media-room/footer fragments authored from the SK source, an SK contacts page, per-locale MR rail labels as placeholders. Client question: 'Is the SK PR contact on /sk/kontakty/ current, and who owns it after go-live?' |
| L-SK-07 | Medium | UNDER-SCOPED | not required | SK Storyboard footer is market-specific: local social handles, Czech-language legal targets, no Series/Newsletter links. Several chrome strings are English or Czech | SKODA-303, SKODA-304, SKODA-1003, SKODA-843, COM05, 6.8, Q-1 | amend SKODA-1003: an SK placeholders sheet incl. chrome strings; new task: /sk/footer from the SK source (social, legal targets per client answer). Client question: 'Should the SK footer keep pointing to the Czech privacy/cookie documents, or is there an SK version?' |
| L-SK-08 | Medium (was High) | NEW | CONFIRMED | SK newsletter consent names a different data controller (ŠKODA AUTO Slovensko s.r.o.), but the SK form shows the EN Škoda Auto consent text. Neither SKODA-843 nor SKODA-904 varies consent by locale | SKODA-904, SKODA-843, D4, D15, Q-1 | amend SKODA-904: per-locale consent text + consent-document link + list/lang mapping as config (placeholders), not hard-coded. Amend SKODA-843: add the SK legal set. Client question (D15 legal owner): 'For SK sign-ups, is the controller ŠKODA AUTO Slovensko s.r.o.? Which mailguide list receives SK Media Room subscriptions?' |
| L-SK-09 | Medium | UNDER-SCOPED | not required | The SK legal set is 10 pages: the cookie notice body is Czech, not Slovak; 1 internal legal link 404s, 1 goes through a 301; 3 pages are empty shells | SKODA-843, SKODA-609, Q-1, D15 | amend SKODA-843: a per-locale keep/drop table (SK rows as listed) + redirect rows for the 404/301 targets. Client question: 'Is there a Slovak cookie notice, or should /sk/ keep the Czech one?' |
| L-SK-10 | Medium | UNDER-SCOPED | not required | SK search must ignore diacritics, but EDS search-suggest only lowercases, and its result-type labels are hard-coded English | SKODA-1003, SKODA-403, COM05, 6.8 | amend SKODA-1003: list search-suggest labels + listing facet labels as placeholders; fold with NFD + strip \p{M} on both sides of the match (works for cs/sk/sl/sr-Latn too) |
| L-SK-12 | Medium | NEW | not required | SK press kits and series live under underscore bases (/sk/press_kit/, /sk/skoda_serialy/), which EDS cannot serve as-is: about 490 SK URLs need a rename rule and redirects | SKODA-103, SKODA-609, SKODA-805, SKODA-1001, 8.1, MIG04 | new decision (with SKODA-1001): the target base for SK press kits/series (e.g. /sk/tlacove-mapy/<hub>/ to match the SK listing page) + a pattern redirect /sk/press_kit/* in the redirects sheet |
| L-SK-16 | Medium | UNDER-SCOPED | not required | The 15-facet schema holds as columns, but SK facet values are separate per-locale terms with '-sk' slugs: 3 groups are absent, SK-only values exist, and the SK 'years' facet has no 2025 | SKODA-1001, SKODA-401, SKODA-512, SKODA-402, D12, MIG04 | amend SKODA-1001: normalise facet values to locale-neutral keys at import (strip the locale suffix; map through Polylang term translations, with a reviewed exception list), keep SK-only values, add a per-locale facet-label sheet; fix the missing 2025 year tag at import from the publish date |
| L-SL-01 | Medium | ESTIMATE-RISK | not required | SL is a 2024 launch fed mainly by EN translations; its 157 'SL-only' stories are a back-dated 2024 re-upload, and SL-only output stopped in 2025-08 | SKODA-1001, SKODA-1002, SKODA-803, 6.8, MIG04 | amend D1/Q-6 scope table: SL = one-off import of 314 stories + 4 releases + 12 pages + 5 series hubs, then EN->SL translation; amend D7 with a per-locale rule (SL: everything, ignore publish year); client question: 'Does Porsche Slovenija still write SL-only stories, or only translate EN?' |
| L-SL-03 | Medium | UNDER-SCOPED | not required | The SL Media Room exists but is a 3-item shell (Images, Videos, Contacts); it has no news listing, press kits, model pages, company menu, Škodapedia or newsletter | SKODA-1001, SKODA-309, SKODA-847, COM05, 6.8 | amend SKODA-1001: a per-locale MR section matrix (SL: home, images, videos, contacts, media cart only; no news listing, kits, models, company); the SL /media-room/nav and footer are their own fragments, not EN copies |
| L-SL-04 | Medium | NEW | not required | The SL nav and footer send Elroq and Enyaq to Slovak tag pages (/sk/tag/model/*-sk/) and lack Scala, Epiq, Peaq, Concepts, Series, Podcast, Škodapedia and Newsletter | SKODA-1001, SKODA-301, SKODA-609, COM05, 6.8 | amend SKODA-1001 (SL chrome): build /sl/nav and /sl/footer from the SL menu, repoint Elroq/Enyaq to SL model terms (or drop them), decide whether to add Podcast/Series; add a check that no chrome link goes to another locale except the switcher |
| L-SL-07 | Medium (was High) | UNDER-SCOPED | CONFIRMED | SL has its own legal footer run by the importer (Porsche Slovenija), outside SKODA-843; the Impressum link and the privacy-statement link both 404 | SKODA-843, SKODA-809, Q-1 | amend SKODA-843: add a per-locale legal matrix (SL: Impressum, privacy, cookies-sl, whistleblower; owner Porsche Slovenija); add a D15 row for the SL legal owner; client question: 'Porsche Slovenija: what are the current Impressum and privacy URLs? The two linked today return 404.' |
| L-SL-10 | Medium | UNDER-SCOPED | not required | SL has two competing model vocabularies (38 model sub-categories with other-locale slugs, plus 16 model terms), so the 15-facet model facet won't map 1:1 | SKODA-1001, SKODA-401, MIG04, D12 | amend SKODA-1001: a per-locale term map (strip locale suffixes, merge model categories into the model facet, drop the 24 unused SL categories); empty-facet behaviour for SL (no Škodapedia/kit/model-page facets) |
| L-SL-11 | Medium | UNDER-SCOPED | not required | SL URLs embed foreign or EN category slugs (/sl/podcast-en/, /sl/modeli-si/), use a /sl/press_release/ base where EN uses /press-releases/, and SL feeds aren't in SKODA-405 | SKODA-405, SKODA-103, SKODA-1001, 8.1 | amend SKODA-405: per-locale feed paths (/sl/feed/, /sl/press_release/feed/); amend SKODA-103: SL redirect rows for /sl/press-releases/, the two e-mobility bases and the slug-only pattern; decide whether to keep 'podcast-en' in SL paths |
| L-SR-01 | Medium (was High) | UNDER-SCOPED | CONFIRMED | SR is a live, maintained locale (41 stories + 31 releases in 2026) with ~920 human-translated items, but no ticket imports it; 1002 treats it as a translation job | SKODA-1002, SKODA-1001, SKODA-803, 6.8, MIG04 | amend SKODA-1002: split 'import the existing SR corpus' (921 docs, an 803-style REST import per locale) from 'translate gaps'; amend D7 with a per-locale cutoff (SR: all, 2018+); client question: 'Will Škoda Serbia (Autočačak) keep publishing on Storyboard after go-live, and on which date should /sr/ move?' |
| L-SR-02 | Medium | NEW | not required | The 50 SR-only press releases come from the Serbian importer's newsroom (Autočačak, Borac cycling, BG Car Show); the docs don't name this editorial owner | SKODA-1002, 6.8 | new decision Q-n / D15 row: name the SR content owner (Autočačak marketing) and say whether they get DA author access at go-live |
| L-SR-03 | Medium (was High) | CONTRADICTED | PLAUSIBLE | SR content is 100% Serbian Latin, but Google's 'sr' target (EW's default) writes Cyrillic, so 1002's translation path would produce the wrong script | SKODA-1002, 6.8 | amend SKODA-1002: set the SR target to Serbian Latin (sr-Latn) and add a check that rejects or transliterates Cyrillic output; client question: 'Confirm SR stays Latin-only (no Cyrillic edition).' |
| L-SR-04 | Medium | UNDER-SCOPED | not required | Language tags differ: the source uses html lang 'sr-RS', hreflang 'sr' and analytics 'sr-latn-cs'; EDS sets lang='sr', which CLDR reads as Cyrillic | SKODA-1001, SKODA-1003, 8.1, COM05 | amend SKODA-1001: add a code table (hreflang 'sr', html lang 'sr-Latn', analytics value 'sr-latn-cs'); keep date formatting numeric, or pass 'sr-Latn' to Intl explicitly |
| L-SR-05 | Medium | NEW | not required | The SR nav and footer 'Modeli' links go to a Slovenian page (/sl/category/modeli-si/), so the SR menu can't be copied 1:1 | SKODA-1001, SKODA-609, COM05 | amend SKODA-1001 (SR chrome): point 'Modeli' in /sr/nav to the SR models page (term 53526 'modeli-sl'); add a check that no /sr/ chrome link points to another locale, except the switcher |
| L-SR-06 | Medium | NEW | not required | SR chrome differs from EN: local social accounts, footer legal links to global EN documents, and an MR nav whose 'Logo Kompanije' links to an EN attachment page | SKODA-1001, SKODA-303, COM05, 6.8 | amend SKODA-1001: author /sr/footer, /sr/media-room/nav and /sr/media-room/footer as SR fragments (social, legal, RSS, contacts), not EN fallbacks |
| L-SR-07 | Medium | UNDER-SCOPED | not required | The SR taxonomy is a mixed vocabulary: 77 terms with -sr/-rs/-sl/-de/-en slug suffixes, untranslated EN/DE names, and an SL category on 76 SR posts | SKODA-1001, SKODA-401, MIG04, D12 | amend SKODA-1001: add a per-locale facet value map keyed on the Polylang term translation group; drop the SL term from SR items; keep source paths as-is for redirects (no slug clean-up without a redirect row) |
| L-SR-08 | Medium (was High) | UNDER-SCOPED | CONFIRMED | SR has its own legal set (6 URLs, last edited 2020-08-31) outside SKODA-843, and the SR newsletter consent links to one of them | SKODA-843, SKODA-904, Q-1 | amend SKODA-843: add a per-locale keep/drop list (SR: keep 4; drop /sr/uslovi/ with a redirect; keep the 302 to skoda-auto.com as a redirect row); the legal owner (D15) confirms the 2020 SR texts |
| L-SR-09 | Medium | UNDER-SCOPED | not required | The SR newsletter shares Mailguide list 389 with EN and differs only by a hidden lang=sr field, which 904 doesn't carry | SKODA-904, D4 | amend SKODA-904: carry list + lang per locale (SR: 389/sr) and the per-locale consent link; confirm with Mailguide that lang segments the list |
| L-SR-10 | Medium | UNDER-SCOPED | not required | Per-locale analytics values ('sr-latn-cs', importerBid 457, localized page types such as 'Vesti') aren't in SKODA-804/905 | SKODA-804, SKODA-905, D10 | amend SKODA-804: add a per-locale table {language, importerBid} for all 6 locales and a rule for localized page-type labels; confirm the values with the Škoda analytics team |
| L-SR-13 | Medium (was High) | ESTIMATE-RISK | CONFIRMED | SR has 46 press kits / 499 press-kit URLs that the census and SKODA-847 (EN only) don't count | SKODA-847, SKODA-1002, SKODA-1001, MIG04 | amend SKODA-847: enumerate kits per locale from the listings (SR: /sr/press-kits/); add the SR volume to the D1/Q-6 scope table |
| L-SR-14 | Medium | UNDER-SCOPED | not required | SR has no model pages (0 skoda_model vs 23 in EN); SR models are 17 tag archives, and the SR Media Room 'Modeli' menu is empty | SKODA-208, SKODA-1001, MIG04, D12 | amend SKODA-1001: per-locale model-page strategy (SR: tag archives -> facet listing or redirect); fill or drop the SR MR 'Modeli' menu; add the 11 SR series hubs to the series-hub scope |
| L-SR-15 | Medium | UNDER-SCOPED | not required | SR placeholders on the demo have 2 keys (showMore/showLess) and none of EN's 8, and the copy doesn't match the source's 'Učitaj više' | SKODA-1003, SKODA-103, COM05 | amend SKODA-1003: one shared key list for all locales (EN as master), SR values taken from the source UI ('Učitaj više', 'Pretraga', ...); a check that each locale sheet has every EN key |
| L-SR-16 | Medium | UNDER-SCOPED | not required | SR URL patterns and feeds differ from EN (/sr/press_release/ base, /sr/press_release/feed/, slug-only 301s), and there is no per-locale sitemap | SKODA-405, SKODA-103, SKODA-1001, 8.1 | amend SKODA-405: list both feed paths per locale (SR: /sr/feed/, /sr/press_release/feed/; language sr-RS); amend SKODA-103: SR redirect rows (/sr/press-releases/*, /sr/media/, /sr/dokumenta/koja-su-vasa-prava/) and a rule for slug-only story URLs |
| L-X-04 | Medium | CONTRADICTED | CONFIRMED | The DE -> skoda-media.de override covers every Media Room page, not only the MR home, and EDS drops it while DE is unmigrated | SKODA-303a, SKODA-303, COM05 | amend SKODA-303a + spec §8a: MR-side pages show DE -> skoda-media.de when the source declares DE (keep that fact in the import, e.g. a source-locales column), not only when DE is migrated; exclude skoda_model singles |
| L-X-05 | Medium | UNDER-SCOPED | not required | Six different Media Room menus and translated MR base paths; EDS has one /media-room/nav and 22 bulk rows keyed by EN paths only | SKODA-1001, SKODA-303a, 6.8, COM05 | amend SKODA-1001: per-locale /{loc}/media-room/nav + footer fragments and MR bulk rows on the translated bases; extend build-locale-alternates --chrome to the MR chrome |
| L-X-06 | Medium | UNDER-SCOPED | not required | The root negotiates all 6 locales with q-values and a 301 without Vary; the demo root redirects to a feature-branch draft | SKODA-1003, 8.1 | amend SKODA-1003 AC: all 6 locales, q-value/region matching, 302 (or 301) + Vary: Accept-Language, slashless targets (/cs), remove the demo root row; optional /cz -> /cs |
| L-X-07 | Medium | NEW | not required | Polylang REST translations include 100 unpublished targets the source hides; REST-based pairs and "no EN" counts are off | SKODA-1001, SKODA-303a, COM05, MIG04 | amend SKODA-1001: pairs from the source head (as build-locale-alternates does) or REST filtered to published ids; recount locale-only items against published EN; add the DE duplicate to the content-cleanup list |
| L-X-08 | Medium | NEW | not required | Škodapedia term URLs canonicalise to the archive, and their hreflang names only the archives (no SR/SL) | SKODA-802, SKODA-206, SKODA-1001, COM05, MIG04 | amend SKODA-802: decide term canonical (self vs archive) and take term pairs from REST skodapedia translations (filtered to published) |
| L-X-09 | Medium | UNDER-SCOPED | not required | Listing and rail config is EN-keyed: facet labels and per-page option lists exist only for /en paths and in English | SKODA-402, SKODA-402d, SKODA-401, SKODA-1001, SKODA-1003, 6.8 | amend SKODA-1001/402d: per-locale facet-labels (generated per locale) or placeholders, and per-locale rail/feed rows in the RAIL-FEED-MAP |
| L-CS-11 | Low | UNDER-SCOPED | not required | Story templates layout-article-full (46 CS) and default (39 CS) are missing from _TEMPLATES.md, for EN too | SKODA-801, MIG04 | Amend SKODA-801 / _TEMPLATES.md: add rows for layout-article-full (stretch/zigzag rows) and the default post template. |
| L-CS-12 | Low | NEW | not required | Of the 7 CS-only pages, 4 are password-protected test pages; 2 are employee event galleries for SKODA-210 | SKODA-210, SKODA-827, SKODA-843, D7 | Add to the keep/drop list: drop the 4 test pages; route the 2 galleries to SKODA-210. |
| L-CS-13 | Low | UNDER-SCOPED | not required | CS RSS feeds and translated CPT bases aren't in SKODA-405 / the redirect plan | SKODA-405, SKODA-103, 8.1 | Amend SKODA-405: per-locale feed outputs including the CS paths. |
| L-CS-14 | Low | UNDER-SCOPED | not required | CS UI strings: 10 placeholder keys exist, but downloads.js hard-codes 'Show more'; CS dates use 'd. m. yyyy' | SKODA-1003, COM05 | Amend SKODA-1003: string audit of all blocks + a locale date format. |
| L-CS-15 | Low (was Medium) | CONTRADICTED | PLAUSIBLE | SKODA-1002's 'CS adds volume, not complexity' holds for story widgets only, not for CS as a locale | SKODA-1002, 6.8 | Amend SKODA-1002: scope the claim to story widgets and point CS go-live work to the findings above. |
| L-DE-06 | Low | UNDER-SCOPED | not required | DE stories: 177 have no SiteOrigin panels and 7 show a raw [youtube URL] shortcode as text | SKODA-801, MIG04 | amend SKODA-801: add DE to the widget census; handle no-panel posts and convert [youtube] text to an embed |
| L-DE-08 | Low | NEW | not required | /de/kontakte/ lists only Prague HQ press contacts (stale roles, "Enyaq iV"), no German press office | SKODA-309 | drop with the DE Media Room (see L-DE-01) or client to supply DE contacts |
| L-DE-14 | Low | NEW | not required | DE pages show Czech-style dates ("13. 10. 2026") and the DE-only stories carry no hreflang at all | SKODA-1003, SKODA-1001, COM05 | amend SKODA-1003: date format as a per-locale placeholder; client question on the DE date style |
| L-DE-15 | Low | NEW | not required | A published DE story has the slug "__trashed" and DE has 5 public test pages; both need drop or redirect rows | SKODA-1001, SKODA-609, SKODA-843, 8.1 | importer guard: reject slugs matching __trashed or test-*; give the story a real slug + redirect; drop the test pages |
| L-SK-04 | Low | NEW | not required | SK home and SK Media Room are SiteOrigin-panels pages (EN ones are not), wrapped in an empty sow-editor panel | SKODA-1002, MIG04 | amend the home/MR import scripts: skip empty SiteOrigin panels before the promo-box when SK is imported |
| L-SK-05 | Low | NEW | not required | /sk/skoda-model/elroq/ canonicalises to the CS page (cross-locale canonical); the other SK model pages checked self-canonicalise | SKODA-1001, SKODA-103, 8.1 | amend SKODA-1001: do not import source canonicals; EDS self-canonical per locale; list source cross-locale canonicals as a QA check |
| L-SK-11 | Low | NEW | not required | 7 SK slugs contain non-ASCII Unicode (math-bold 𝗶 U+1D5F6, superscript ᵉ). EDS will rename these paths, so each needs a redirect | SKODA-609, SKODA-103, 8.1 | amend SKODA-609/103: the importer emits a redirect row whenever the sanitised path differs from the source path (covers these 7 and any CS/SR equivalents) |
| L-SK-13 | Low | UNDER-SCOPED | not required | SK RSS feeds are separate per-locale endpoints. /sk/tlacova-sprava/feed/ is served directly (200), not by the 302 that SKODA-405 documents for EN | SKODA-405, §9 | amend SKODA-405: a per-locale feed path table (sk: /sk/feed/, /sk/tlacova-sprava/feed/) |
| L-SK-14 | Low | NEW | not required | SK legacy redirects to seed: /sk/iihf/ 302s to a CS story over plain http; /sk/media/ 301s to /sk/hladat/; /sk/dokumenty/vase-prava/ 302s off-site | SKODA-103, SKODA-609, SKODA-843, 8.1 | amend SKODA-103: seed these 4 SK rows; the IIHF decision in 843 covers /sk/iihf/* |
| L-SK-17 | Low | NEW | not required | SK category translations are partly wrong (r5-sk and kushaq-modely-sk both map to EN kushaq; SK 'peaq-cs' slug; two Elroq categories), so a translation-based facet mapping needs an exception list | SKODA-1001, SKODA-401, MIG04, D12 | amend SKODA-1001: a reviewed SK category map (79 rows) as an importer input instead of trusting Polylang links |
| L-SL-02 | Low | NEW | not required | Two SL stories are dated 1022 and 1023 (typos), and the back-catalogue keeps pre-2024 dates, which breaks date sort, cutoffs and 'newest' rails | SKODA-1001, SKODA-803, MIG04 | amend SKODA-1001/803: an import-time date sanity check (year < 2000 or > today -> flag for an editor); fix the 2 dates in the source or in the mapping |
| L-SL-05 | Low | NEW | not required | The SL Series page (/sl/serije/) holds one tile with the body text 'TODO' and doesn't link any of the 5 SL series hubs | SKODA-506, SKODA-1001, MIG04 | client question: 'Should /sl/serije/ list the 5 SL series, or be dropped with a redirect?' |
| L-SL-06 | Low | NEW | not required | SL stories use a subset of the EN widget set, plus Spotify podcast embeds and 2 YouTube iframes on back-catalogue stories | SKODA-204a, MR-PR03 | none beyond confirming that 204a's embed allow-list covers Spotify episode URLs |
| L-SL-08 | Low (was High) | NEW | PLAUSIBLE | The SL newsletter is switched off on the source and its form has an empty consent label, but EDS adds the newsletter card to every story in every locale | SKODA-904, SKODA-840, SKODA-843, Q-1 | amend SKODA-840/904: a per-locale newsletter switch (no card when /{locale}/fragments/newsletter-card is absent, and SL stays off until Porsche Slovenija supplies the consent text and list); client question: 'Is the SL newsletter retired, or should it run on list 389 with SL consent wording?' |
| L-SL-09 | Low (was Medium) | CONTRADICTED | CONFIRMED | SL does have media (61 attachments, 59 images + 2 videos in the SL Media Room), contradicting 'Slovenian absent'; 42 of 49 titles are file names and none has alt text | SKODA-406, SKODA-517, SKODA-1001, MIG04 | correct SKODA-MEDIA-DEEP-DIVE/MASTER (SL has ~61 items); amend SKODA-406/517: title fallback when the title is a file name, and an alt-text gap list for SL (114 story images) |
| L-SL-12 | Low | UNDER-SCOPED | not required | SL UI strings, placeholders and chrome don't exist on the demo (nav, footer, placeholders, query-index, newsletter fragment all 404), and the source leaves 'Stories'/'Media Room' in English | SKODA-1003, SKODA-303, COM05 | amend SKODA-1003: SL placeholder sheet with the source strings above; move SKIP_LINK_LABELS into placeholders |
| L-SL-13 | Low | NEW | not required | Search is diacritic-sensitive: 'pogacar' finds 16 SL stories on the source vs 25 for 'pogačar', and the EDS matcher doesn't fold č/š/ž either | SKODA-401, SKODA-1003, COM05 | amend the search ticket: fold diacritics (normalize('NFD') and strip combining marks) on both the query and the index fields |
| L-SL-14 | Low | NEW | not required | The only SL banner is a June 2024 'We Love Cycling' campaign that is still served in 2026, and SL analytics use importer id 298 / language 'sl-si' | SKODA-903, SKODA-804, SKODA-905 | client question: 'Drop the 2024 SL cycling banner?'; amend 804/905 with the per-locale analytics value table |
| L-SR-11 | Low | NEW | not required | SR search: the corpus mixes 'đ' and 'dj' spellings, and the EDS search matches exact lowercase substrings only | SKODA-1001 | note for the search ticket: optional diacritic folding incl. đ; pass the page lang to localeCompare |
| L-SR-12 | Low | NEW | not required | 14 SR items keep the EN slug under a Serbian title, and SR-only items have no hreflang at all | SKODA-1001, SKODA-103, 8.1 | note: keep source slugs; x-default only on locale homes |
| L-X-10 | Low | NEW | not required | Demo: no locale serves on live; preview hreflang points at live URLs that 404, and the sheet has no sl/x-default columns | SKODA-303a, SKODA-1001, COM05 | note for SKODA-1001: publish order is translations first, then the sheet; add hreflang:sl and hreflang:x-default columns when SL/home rows arrive; decide the html lang form (region or bare) |

## 5. Proposed changes

**Applied 2026-10-20:** the new tickets (5.1) and the register rows (5.3), with GitHub issues #394–#402. **Not applied yet:** the ticket amendments (5.2) and the client questions (5.4).

### 5.1 New tickets
| # | Ticket | Covers | Rough size |
|---|---|---|---|
| N1 | **[SKODA-1004](../tickets/tickets/SKODA-1004.md) (#394) Non-EN corpus import**, one sub-ticket per locale: 1004a CS (#395), 1004b DE (#396), 1004c SK (#397), 1004d SR (#398), 1004e SL (#399): enumerate REST + listings, run the EN importers with locale chrome, media manifest rows, hreflang columns, redirects | L-X-03, L-CS-01, L-SK-01, L-SR-01, L-SL-01, L-DE-02, L-CS-07, L-SR-13, L-SK-02 | CS 5 SP; DE/SK/SR 3 SP each; SL 1 SP (volume runs on the 803 tooling) |
| N2 | **[SKODA-103a](../tickets/tickets/SKODA-103a.md) (#402) Inbound trailing-slash rule** on the production CDN: `/{path}/` → `/{path}` in every locale, before DNS | L-X-01, L-X-06 | 1–2 SP |
| N3 | **[SKODA-1005](../tickets/tickets/SKODA-1005.md) (#400) Translation pairs after go-live**: where pairs live + the author "link a translation" step in DA/EW + a check that pairs stay reciprocal | L-X-02, L-X-07, L-CS-03, L-CS-09 | 3 SP, after decision Q-10 |
| N4 | **[SKODA-1006](../tickets/tickets/SKODA-1006.md) (#401) Per-locale chrome**: `/{loc}/nav`, `/{loc}/footer`, `/{loc}/media-room/nav` and `/footer` from the source menus; a check that no chrome link goes to another locale except the switcher | L-X-05, L-CS-06, L-DE-07, L-SK-06/07, L-SR-05/06, L-SL-03/04 | 2 SP |

### 5.2 Ticket amendments
| Ticket | Amendment | From |
|---|---|---|
| SKODA-1001 | Per-locale facet value map keyed on Polylang term translation groups (strip `-sk`/`-cs`/… suffixes, merge SL model categories, keep locale-only values); per-locale facet labels; per-locale MR section matrix; code table (`sr`: hreflang `sr`, html lang `sr-Latn`); pairs from source heads or REST filtered to published ids; x-default policy; hide-from-listing flag for back-dated evergreen posts | L-CS-08, L-DE-18, L-SK-16, L-SR-07, L-SL-10, L-SL-03, L-SR-04, L-X-07, L-CS-09, L-DE-03, L-X-09, L-SR-14 |
| SKODA-1002 | Rescope: authoring of *new* translations after the N1 import; DE = local authoring + Pkw-EnVKV legal review, no auto-publish of MT; SR target `sr-Latn` with a Cyrillic check; Translation projects rewrite target paths with the per-locale base map | L-DE-02, L-DE-04, L-SR-03, L-DE-13, L-CS-15 |
| SKODA-1003 | Root negotiation for all 6 locales (q-values, regions, `Vary: Accept-Language`, slashless targets); one shared placeholder key list with EN as master and a completeness check; search-suggest diacritic folding (NFD, strip marks) and localised type labels; remove the demo root row | L-X-06, L-SR-15, L-SK-10, L-CS-14, L-SK-07 |
| SKODA-843 | A per-locale legal matrix (CS, DE, SK, SR, SL) with keep/drop, owner and redirects; `/de/impressum/` Must; DE competition terms group | L-DE-09, L-CS-05, L-DE-10, L-DE-11, L-SK-08/09, L-SR-08, L-SL-07 |
| SKODA-904 / 840 | Per-locale config: active flag, list id + lang (EN 389/339, CS 386/342, SK/SR/SL on 389 with `lang`), consent text and consent link per locale; the story newsletter card only where the locale's newsletter is on | L-CS-04, L-DE-12, L-SK-08, L-SR-09, L-SL-08 |
| SKODA-511 / 517 / 520 | Keep per-locale media titles, captions and alt when deduplicating binaries; a feed per locale or a lang-keyed column | L-SK-15, L-CS-10, L-SL-09 |
| SKODA-803 / 847 / 802 | Enumerate per locale (REST `?lang=`, listings for press kits, all 4 press-kit sitemaps); filter `content.protected`; Škodapedia generator per locale | L-CS-07, L-SR-13, L-DE-16, L-DE-05, L-DE-17, L-X-08 |
| SKODA-405 | Feed paths per locale (`/{loc}/feed/` and the translated release-feed path) | L-CS-13, L-SL-11, L-SR-16 |
| SKODA-103 / 609 | Per-locale redirect rows: translated and underscore bases (`/sk/press_kit/`, `/sl/press_release/`), slug-only 301s, non-ASCII slugs, `/cs/130let/` | L-SK-12, L-SL-11, L-SR-16, L-CS-09, L-CS-03 |
| SKODA-303a | DE → skoda-media.de on every MR page whose source declares DE (keep a source-locales column at import), not on model pages | L-X-04 |
| SKODA-804 | Per-locale analytics values (language code, importerBid, localised page types) | L-SR-10 |
| Coverage matrix §1/§4 | Add `press_kit-sitemap4.xml` (+158 EN); per-locale rows for press kits, Škodapedia, models, series; recount "no EN" against published targets | L-SK-02, L-X-07, verifier note |

### 5.3 Decision register (new rows, added to the [register](../planning/SKODA-DECISION-REGISTER.md); Q-1 and Q-6 amended)
| # | Question | Proposed default | From |
|---|---|---|---|
| Q-7 | What happens to each locale's WordPress tree at the 02 Jan cutover if it doesn't go live with EN + CS? | Freeze + import DE/SK/SR/SL before DNS (import is cheap on the 803 tooling); open for authoring per local office | L-X-03, L-DE-02 |
| Q-8 | DE press releases and the DE Media Room: migrate the 1,260 frozen releases, or 301 them to their EN twins or skoda-media.de? | 301 to the EN twin (1,259 of 1,260 have one); DE MR pages → skoda-media.de | L-DE-01, L-DE-16, L-X-04 |
| Q-9 | Legal owner and legal set per locale (extends D15 and Q-1) | Owners: HQ (EN/CS), Škoda Auto Deutschland, ŠKODA AUTO Slovensko, Autočačak, Porsche Slovenija; each confirms its set | L-DE-09/10, L-CS-05, L-SK-08, L-SR-08, L-SL-07 |
| Q-10 | Where translation pairs live after go-live | A translation-group id in page metadata and the index; the switcher resolves it at runtime | L-X-02 |
| Q-11 | Per-locale media titles and alt text | AEM localised metadata fields, exported per locale into the feed | L-SK-15, L-CS-10 |
| Q-12 | Content cutoff per locale (D7 is EN only) | Everything for CS/SK/SR/SL; DE per Q-8; legal and T&C posts exempt from any date rule | L-CS-02, L-SK-03, L-SR-01, L-SL-01, L-DE-03 |
| Q-13 | Password-protected posts (11 DE) | Exclude and redirect; check other locales | L-DE-05 |
| Q-14 | SR script | Serbian Latin only; no Cyrillic edition | L-SR-03 |

### 5.4 Questions for the client
1. **Owners (DE, SK, SR, SL).** Who authors each locale today (Škoda Auto Deutschland, ŠKODA AUTO Slovensko,
   Autočačak, Porsche Slovenija)? Must they keep publishing without a gap on 02 Jan 2027?
2. **DE Media Room.** Has the German Media Room on the Storyboard been retired in favour of skoda-media.de, and may we
   redirect `/de/media-room/` and the DE press releases?
3. **Legal sets.** Per locale: which legal set and which controller apply? Specifically:
   - the current managing directors for the DE Impressum;
   - whether the CS newsletter terms (Act 101/2000 Sb.) are still valid;
   - whether SK keeps the Czech cookie notice;
   - the current SL Impressum and privacy URLs (both links 404).
4. **Newsletter lists.** Are the Mailguide lists 386/342 (CS) and the `lang` segments of list 389 (SK, SR, DE) still
   active?
5. **Pkw-EnVKV.** Who in Germany signs off the consumption and CO2 values on DE stories?
6. **Protected pages.** Who uses the 11 password-protected DE pages?
7. **SR script.** Please confirm that SR stays Latin-only.

### 5.5 Traceability gap register (to add)
- **G-L1.** No requirement covers the import of existing non-EN content: MIG04 says "preserve locale", but no
  requirement or ticket moves the content (N1).
- **G-L2.** No requirement covers per-locale legal obligations: §6 and Q-1 are EN only.
- **G-L3.** 6.8's manual copy-and-translate model has no target-state workflow for linking translations (N3).
- **G-L4.** The URL-preservation requirement 8.1 has no inbound trailing-slash rule (N2).

## 6. Rejected and downgraded

- **Rejected: none.** 24 of 27 High and Critical claims reproduced (CONFIRMED). 3 are PLAUSIBLE:
  - L-SR-03: EW's Google target was not exercised;
  - L-CS-15: an umbrella finding;
  - L-SL-08: the EDS side was inferred from code.
- **Downgraded: 19.** Most were High → Medium because the gap is only in an on-demand locale under D1 (DE, SK, SR, SL),
  or because an open decision already owns it (D4 for the newsletter lists).
- **L-DE-09: Critical → High.** DE is on demand under D1, and 843 names only the EN URL, so "contradicted" is
  overstated. The imprint stays a legal gate for whichever date `/de/` moves.
- **Known and dropped by the reviewers:**
  - the Accept-Language root routing itself (1003);
  - uneven translation (C8);
  - banner counts per locale (903);
  - COM05's omit rule.

## 7. Limits

- **Sampling.** Each reviewer fetched at most 150 pages. Lens status per reviewer is listed below; "partial" lenses are
  not a clean bill of health.
- **Not checked:**
  - the cookie/consent banner per locale (GTM-injected; only the cross-locale reviewer had a browser);
  - search and sort with diacritics in a browser (DE);
  - the AI-audio box per language (not found on the SK and SR samples);
  - banners per locale (left at the 903 counts).
- **Counts:**
  - press-kit counts come from the sitemaps, which are known to be stale, so they are floors;
  - DE media items weren't counted (`wp/v2/media?lang=de` timed out);
  - DE model and series counts weren't taken.
- **Volumes** are URL counts, not effort. The 803 tooling makes import volume cheap; chrome, legal, facets and
  redirects are the work.

### Lens status per reviewer

- **cs:** 1-inventory done; 2-templates done; 3-chrome partial: header/footer/MR nav compared; home band-by-band diff not done; 4-legal done; 5-language done; 6-urls partial: 12 HEAD probes; no 404 crawl of all CS chrome links; 7-media partial: media items, newsletter, cart labels and audio sampled; banners per locale not checked (D3 has counts); 8-index done
- **de:** 1-inventory done; 2-templates done; 3-chrome done; 4-legal done (consent banner: no CMP in static HTML on DE or EN; GTM-injected, not verified without a browser); 5-language done (sample: 21 posts + 5 pages + 2 homes; search/sort with umlauts not tested, needs a browser); 6-urls done (14 URL probes + root Accept-Language; full redirect audit not attempted); 7-media partial: press kits via sitemap only; DE media items not counted (wp/v2/media times out); media-cart labels not checked; 8-index done
- **sk:** 1-inventory done; 2-templates done; 3-chrome done; 4-legal done; 5-language done; 6-urls done; 7-media partial: AI-audio box not found on any of the 6 SK/EN story and release pages checked, so per-language audio is unverified; banners left at the known sk=2; 8-index done
- **sr:** 1-inventory done; 2-templates done; 3-chrome done; 4-legal partial: SR legal pages and footer links checked; OneTrust per-locale banner config not inspected (no browser); 5-language done; 6-urls partial: 16 probes (feeds, bases, legacy, slash, sitemaps); no 404 crawl of all 71 SR chrome links; 7-media partial: newsletter, analytics, contacts, press kits and media alt text checked; AI audio vendor not identified, banners per locale not checked (D3 has sr 0); 8-index done
- **sl:** 1-inventory done; 2-templates done (31 SL pages rendered: 18 stories, 3 releases, 1 series hub, 9 pages); 3-chrome done; 4-legal partial: footer legal links, /sl/copyright/ and the newsletter consent checked; the consent-banner config lives in the shared GTM container and was not inspected (no browser); 5-language done; 6-urls partial: 18 probes (feeds, bases, legacy 301s, slash, slug-only, sitemap); no 404 crawl of all 71 SL chrome links; 7-media partial: media REST, listings, banners, newsletter and analytics checked; AI-audio box not found on 31 SL pages (no audio embed), media-cart labels not checked; 8-index done
- **cross-locale:** X1-switcher done: 69 source pages (stories, releases, press kits, Škodapedia, series, model pages, category/tag/years archives, MR listings, homes, MR homes) with 1-6 translations; demo live + preview; X2-hreflang done: hreflang/canonical/html lang/og:locale on the same 69 pages; reciprocity on 2 full groups; X3-pairs done: script over rest.json (posts/press_release/pages x 6). Not covered: press kits, Škodapedia, series, models (not in rest.json; press kits have no REST); X4-routing done: 14 Accept-Language variants, 21 prefix/slash paths, MR per locale (6) + MR nav per locale; X5-demo done: 42 live/preview status checks, both bulk metadata sheets, redirects.json, rendered switcher on 3 demo pages; X6-editorial-model done: SKODA-1001/1002/1003, 801b, 803, 847, 103, 303a, 401/402, RAIL-FEED-MAP, IMPORT-PIPELINE, build-locale-alternates.mjs, requirements mapping 6.8
