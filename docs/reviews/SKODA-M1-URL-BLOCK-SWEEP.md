# SKODA M1 URL → Block Sweep: coverage, visual deltas, missed blocks

**Date:** 2026-09-25 · **Author:** Architect (Lars) with a 7-agent gpt-6-sol DevTools fleet · **Status:** for sign-off
(the new tickets are drafts on disk only; no board or DA changes were made)
**Registry:** [`../analysis/SKODA-M1-URL-BLOCK-REGISTRY.md`](../analysis/SKODA-M1-URL-BLOCK-REGISTRY.md) (catalog, URL×component matrix, per-page rows) and
[`.json`](../analysis/SKODA-M1-URL-BLOCK-REGISTRY.json)
**Builds on:** [`SKODA-M1-GAP-REVIEW.md`](SKODA-M1-GAP-REVIEW.md) §9–§15 (capacity, cut line, fold-in)

## 1. Bottom line

1. **The block inventory is complete.** Every one of the 687 UI element rows on the 43 M1 URLs maps to a component
   spec and a ticket. That is 659 from the fleet plus 28 float-dock rows the Architect added from the fleet's own
   captures. The shared chrome is also recorded per URL (registry §4.7). Only three gaps needed a new ticket:
   - **SKODA-827** (first drafted as 824): page float dock (share + scroll-top). ⚠️ **Duplicate of SKODA-215**, which
     the parallel sweep put on main first. 215 owns the build.
   - **SKODA-825:** Media Room side resolution (MR nav + per-path nav/footer routing). ⚠️ **Duplicate of SKODA-309**,
     which is on main first. 309 owns the build.
   - **SKODA-826:** global page gutter

   Those three add **+3.5 SP**. After the dedupe (§11) the owners are 215, 309 and 826. Three unspecced source
   elements fold into existing ACs:
   - model **Key Facts** and **Technical Data** → 208
   - press-kit **WhatsApp/ZIP** promos → 805a
   - press-kit **PDF/mail** banners → 805c
2. **Visual parity is far off, and three systemic causes account for most of it:**
   - Only **6 of 687** rows match, all of them story rich text.
   - **45% of rows cannot be measured yet** (171 content-blocked + 137 import-gap). The cause is content and data:
     32 of 43 pages are not previewed on main, and the index has no image, video, press-kit or series rows.
   - **The MR side renders Storyboard chrome** on all 16 MR URLs (309).
   - **A 10px vs 24/40px page gutter** explains most of the per-block width deltas at every viewport (826).
3. **93 rows (⚠️) are ticketed, but the element or variant is missing from the ticket's ACs.** They cluster in model
   rails (208/212), the series mosaic + hero (207), the Media Box (502/801a), faceted listings (402/608) and press-kit
   media (805a/c). §6 lists the AC amendments per ticket, with a route for the closed or M2 tickets.
4. **Capacity:** net **+2 human SP (≈ +1 dev-day)** after crediting the work that merged or opened since the
   review (#109, #134). Slack goes from ≈ 2.7 d to ≈ 1.7 d. The agent lane takes **+2.5 SP**: the float dock (215),
   the 607 importer amendments, and the listing slice of the lightbox. §9 has the details.
5. **A parallel sweep landed on main the same day** (`88c1b48`, [`SKODA-DEMO-SWEEP-REPORT.md`](SKODA-DEMO-SWEEP-REPORT.md)).
   We re-checked it with live CDP: 9 findings are confirmed, 3 are partial, and 0 are refuted. It found a **P1 this
   sweep missed**: rail cards don't navigate on a desktop click, and the rail doesn't drag (212). Its tickets add
   ≈ 16 SP net of duplicates, against ≈ 1.7 d of slack, so **§11 sets a combined cut line**. It also corrects this
   report's "refuted" verdict on SKODA-204: the host is fine, but the consent click-to-load hook is missing.

## 2. Scope and method (short; full provenance in the registry §1)

- **URLs:** the 42 unique pages of [`skoda-m1-url-set.txt`](../planning/skoda-m1-url-set.txt), plus the mixed-reality
  alias (checked as a redirect), plus the chrome states: the STO/MR header, mobile nav, language switcher, STO/MR
  footer, floats and cookie banner.
- **Evidence:**
  - Chrome DevTools Protocol captures: the DOM region tree, computed styles, matched CSS rules, widget config,
    media and links.
  - Viewports 375 / 768 / 992 / 1280.
  - **No screenshots were used as evidence.**
  - Thresholds: ±2px / ±2% boxes; exact font, colour and column count.
- **EDS side:**
  - main preview for the 11 previewed pages
  - a local render of the DA source for the other DA pages
  - PR branch previews for #109, #110, #111 and #131
  - The 4 press kits are not in DA, so they have no EDS side.
- **Main moved during and after the sweep** (`6af751e` → `752b919`):
  - #109 embeds (204), #111 downloads (502), #131 search (403) and #135 media masters ingest (501) merged
  - #132 DA push tool and #133 story flatten merged
  - SKODA-820 index rail landed
  - PR #134 (305 MR footer + `newsletter-stub`) opened

  These rows carry a `postSweep` note and were not re-measured.

## 3. Coverage totals

| Group | Pages | Rows | ✅ | 🟡 | 🔵 | 📋 | ⚠️ | ❌ | ⛔ |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| G1 emobility stories | 8 | 175 | 6 | 56 | 1 | 88 | 0 | 16 | 8 |
| G2 Škoda World + lifestyle stories (+ alias) | 13 | 190 | 0 | 9 | 0 | 137 | 20 | 24 | 0 |
| G3 press releases | 5 | 89 | 0 | 49 | 5 | 25 | 0 | 10 | 0 |
| G4 model pages | 5 | 71 | 0 | 16 | 0 | 15 | 30 | 10 | 0 |
| G5 series hubs | 5 | 35 | 0 | 5 | 0 | 0 | 20 | 10 | 0 |
| G6 press kits | 4 | 51 | 0 | 0 | 2 | 35 | 6 | 8 | 0 |
| G7 home, Images, Videos + chrome | 3 | 76 | 0 | 22 | 4 | 27 | 17 | 6 | 0 |
| **Total** | **43** | **687** | **6** | **157** | **12** | **327** | **93** | **84** | **8** |

Legend: ✅ built + matches · 🟡 built, measured delta · 🔵 in PR · 📋 ticketed, not built/imported · ⚠️ ticketed, AC gap
· ❌ no ticket at sweep time (→ drafted 827, now owned by 215) · ⛔ ruled out (M2).

The G4–G6 ❌ rows (28) are the Architect supplement. The fleet did not register the float dock on the model, series
and press-kit pages, but its own captures contain the same fixed `div.sticky-buttons` dock on all 43 pages at 375 and
1280 (`chrome-census`, evidence paths in the row notes).

EDS status: DELTA 176 · NOT-BUILT 185 · CONTENT-BLOCKED 171 · IMPORT-GAP 137 · IN-PR 12 · MATCH 6.

**Chrome per URL** (registry §4.7): the side was detected from each page's own capture (topnav + footer text). The
result is STO 27 (26 + the alias) and MR 16, and it matches the template side on every page:
- **STO pages** inherit the `/en/` header/footer measurement (🟡), because they use the same fragments.
- **MR pages:**
  - 🟡 where EDS renders the page, because it shows the STO chrome (309).
  - ❌ where the page is not on EDS yet (press kits).
  - ⚠️ on Images/Videos, which were measured.
- **Locales:** 38 of 42 pages list 2–5 locales on the source, but EDS always renders six (⚠️ → 303).

Measured deltas: 1,051 blocking · 1,136 visible · 212 cosmetic, spread over 245 rows with at least one blocking delta.
The component-level status is in the registry §3, and the per-URL status is in the registry §4.

## 4. What's covered

**Built on main and measured.** Status is 🟡 unless noted.
- Chrome:
  - header + mega-menu (301)
  - mobile nav (302)
  - language switcher (303)
  - STO footer (304/306)
- Hero (202/816)
- Story two-column shell (801/822) and story-rail Related Stories (212/820)
- Tags (205), cards (201/817) and the home stories feed (214)
- Gallery (203), the listing engine (402) and the in-body content flatten (801)
- Story rich text: ✅ on 6 stories

**In PR or merged since the sweep:**
- embeds (#109, merged)
- promo-box (#110, 213, open)
- downloads / Media Box (#111, 502, **merged** after the sweep, incl. QA fixes)
- search (#131, 403, **merged** after the sweep, incl. review fixes)
- MR footer + `newsletter-stub` (#134, 305, open)

The 🔵 rows for #109/#111/#131 were measured on the PR branches. They carry a `postSweep` note and need a
re-measure on main.

**Ticketed, not built** (📋, 327 rows). The biggest buckets:
- page content/imports: 603, 801a, 607, 805a/c, 207
- media cart (505a/b, 31 rows)
- sidebar newsletter (823, 20 rows)
- in-body slider (819, 20 rows)
- Media Box on stories (801a/502)
- cookie consent (704 stub)
- home social band (217/218)

**Missed blocks → new tickets (❌):**

| New ticket | What | Evidence | Rows / URLs | SP | Tier |
|---|---|---|---|--:|---|
| [SKODA-827](../tickets/tickets/SKODA-827.md) → **[215](../tickets/tickets/SKODA-215.md)** | Page float dock: share expander (5 intent links) + scroll-to-top + cart slot | On all 42 pages, same fixed 322×70 dock, 8 anchors. No block or script in `blocks/` / `scripts.js`. STO-D10 was mapped to 304, whose ACs are footer follow links only | 84 / 42 | 1.5 (215: 2) | Should (Plan A) · **Must if §14 is accepted**: COM-15 share is client-promised. Duplicate of 215; fold in and close |
| [SKODA-825](../tickets/tickets/SKODA-825.md) → **[309](../tickets/tickets/SKODA-309.md)** | MR side resolution: `/media-room/nav` fragment + bulk-metadata `nav`/`footer` rows + switcher active state | Main PR preview shows STO nav (Models, eMobility…) and the 7-col STO footer. No `nav`/`footer` meta. PR #134 lists routing as "not in this PR" | 5 chrome rows + every MR header/footer row / 16 | 1.5 (309: 2) | **Must** (blocks 704 sign-off on 16 URLs). Duplicate of 309; fold in and close |
| [SKODA-826](../tickets/tickets/SKODA-826.md) | Global gutter 10px at every width (EDS 24 < 992, 40 ≥ 992) | Architect CDP re-measure, Epiq + Klaus: source `left 10 / 355` @375, `26 / 1228` @1280. EDS `24 / 327` and `40–56 / 1168`. SKODA-106 is closed | root cause of most 🟡 width deltas | 0.5 | **Must** (cheap; otherwise every 704 diff fails) |

**Folded into existing ACs instead of new tickets:**
- **Key Facts** (5–6 illustrated rows) and **Technical Data** (dark band, 6 rows + PDF) on Superb, Octavia and Fabia
  → 208. Build them from `columns` + the 218 dark section + a download link. No new block.
- The WhatsApp/ZIP linked-image row → 805a.
- The PDF/mail banners → 805c.

## 5. Visual deltas by demo severity (built or PR elements)

**Blocking.** The demo visibly breaks.

| # | Where | Measured (source → EDS) | Owner |
|--:|---|---|---|
| B1 | All 16 MR URLs | nav `News/Press Kits/Models/Images/Videos/Company` → STO `Models/eMobility/Lifestyle/Škoda World…`. Footer `Contacts/Subscribe/Company` 706px → STO sitemap 842px | **309** + 305 (#134) |
| B2 | Home rails | Models 11 → 1 · Lifestyle 10 → 1 · Škoda World 10 → 4 · Series 24 → 0. Social dark band absent | 603 + 608 (index), 217/218 |
| B3 | Model rails (5 pages) | Every rail is fed by a hardcoded `tags=elroq` / "Based on tags: Elroq" (`import-model-page.bundle.js:200-203`). Config rows render as 4 fake cards per rail. 25 rail-nav checks FAIL | 208 + 212 AC |
| B4 | Series hubs (5) | A curated mosaic of 8/14/10/5/12 tiles became a generic listing. `listing.js` ignores the authored `tags`, so every hub shows the same stories | 207 + 402 AC (or the D-4 static fallback) |
| B5 | DA-only stories (11 + 2) | Stale pre-#113 flatten output: "View slide 1View slide 2…" text instead of sliders, and "Related Stories" as h3/p text (verified on `ouninpohja`) | 801a re-import with the #113/#133 importer |
| B6 | Story Media Box | Absent on all previewed stories (72 blocking "media box" deltas) | 801a + 502 |
| B7 | Mobile nav 375/992 | Hamburger has no `aria-expanded` and no scroll lock | 302 |
| B8 | Downloads (#111, measured on the PR branch) | `/direct-download/…` and `/video/1223262231` returned 404. #111 merged after the sweep; re-check on main | 502 |
| B9 | Mixed-reality alias | EDS 404. The source serves 200 + canonical, but EDS still needs a 301 | 609 |
| B10 | PR embeds | The importer does not emit the per-release Buzzsprout/Vimeo into Embeds, so the embed is missing on the imported PRs | 607 importer (803 is M2) |

**Visible.** A reviewer notices.
- **Gutter** (826): every block at 375 is 327 vs 355, and at 1280 the content is 1168 vs 1228. The story hero is
  1168 vs 1280/1228.
- **Story hero** (816): the perex is missing from the hero on the Epiq story, and the perex is 16px vs 20px at 375.
  Older previews still overlay white text.
- **PR meta** (607): the date is 16/400/24 vs 11px/600/11. There are two dark bands (Media Box, related), and the
  bullets are optional.
- **Language switcher** (303): six static locales on every page. The MR release has only cs/sk/en/sr.
- **Footer** (306/304): the RSS and social links lose `target=_blank`. Four legal links (incl. Whistleblower) and the
  STO/MR copyright wording.
- **In-body slider** (819): 476px of linear images vs a 259px 3:2 slider at 375.
- **Sidebar** (817/823): card and tag heights; the newsletter widget is missing.
- **Faceted listing** (402): sort row 21 vs 35px; page size and columns drift (see §7).
- **Rails** (212): at 1280 the home rail is 212 vs 319px, and the Related rail is 174 vs 256px at 375.

**Cosmetic.** Footer sitemap 441 vs 446px, footer 842 vs 830, story top margin 40 vs 0. These are left to the 704
critique.

## 6. AC amendments per ticket

Closed or M2 targets are **re-routed** to an open M1 ticket. The ⚠️ rows in the registry point at these.

| Ticket (board) | Add to ACs | Route |
|---|---|---|
| 208 (open) | 3/5/6 rails and 8/9 links. Key Facts + Technical Data sections (absent on Peaq/Epiq). Bodywork rail centred. Desktop sticky affix with an accessible mobile equivalent. Emit only nav links whose target exists. Per-model rail tags/subheading + an "All" deep link from the source (Fabia `model=fabia`, `bodywork=hatchback`); reject a hardcoded `elroq`. The 212 items: a two-cell subheading row is config, never a card; empty model rails remove their section | 208 (+1.5 SP, vijay) |
| 212 (closed) | A two-cell subheading row is config and never a card. Empty rails remove their whole section. Bodywork `cellAlign:center` | **Not** the 0.5 SP "212 rail widths" QA fix (`blocks/carousel` only). Config row + Bodywork alignment → **208** (`story-rail`, in 208's +1.5). Empty rail removes its section → **820** (story rails) and 208 (model rails) |
| 207 (open) | Exact authored tile count, URLs, titles and media. Editorial order. Mixed types (Press Kits on 130-years). 2/3-cell mosaic, 1-up on mobile. Series hero: 375 image then dark 48/300 H1; ≥768 white overlay at 61.8vh; SERIES badge; 20/600 perex | 207 (the hero part is from closed 202) |
| 402 (closed) | Scope by the authored `tags` / explicit paths **before** rendering. Hub mode: no facets, no sort, fixed count. Images/Videos 12 / +12, columns 1/3/4/4, facets collapsed until "Advanced filter" | The "402 tablet facets" QA fix, **widened from 0.5 to 1 SP** (+0.5, saran) and renamed "402 listing QA fix". Its ACs are the five items in the left column. Tag scoping only matters for series if 207 takes the D-4 listing fallback |
| 603 (open) | QA the 5 hubs against the source counts after reindex, or use the 207 static fallback | 603 |
| 608 (open) | ≥ 18 image and ≥ 18 video rows: JPG Original + 1920, MP4, Vimeo ID/poster, date, the 15 facets. Model-media rows keep the model/bodywork facets. An empty listing shell is not acceptable | 608 |
| 203 (closed) | Listing Colorbox asset variant: Original/1920 links, Vimeo modal, focus trap / Esc / arrows even while the iframe has focus | Build: a **listing-lightbox slice of 216** (open, gallery + lightbox), promoted to Must for Images/Videos. It is 0.5 SP in the **agent lane** (objective oracle: links, modal, keys), reviewed by saran. Keyboard/focus sign-off → **703**. 608 only supplies the rows |
| 801a (open) | Re-import every stale DA story with the #113/#133 importer. Assert the slider count per page. Media Box on every story that has one | 801a |
| 819 (open) | Slider counts, order, caption/alt and 3:2 crop across the 8 emobility stories. 3s autoplay is distinct from the related rail | 819 (the amendment came in on the closed 219) |
| 816 / 818 / 820 (open) | 816: re-import the overlaid heroes and put the perex in the hero. 818: the graffiti/cycling YouTube poster + stray "Play". 820: emit a rail only if the source has one, curated or tag-based; no "Based on tags" subtitle on curated rails. Re-verify after 5aed689 | the same tickets |
| 218 (open) | The dark SiteOrigin `panel-row-style` band (#0e3a2f) is preserved as a dark section with its source padding | 218 (814 is M2) |
| 604 (Should) | Media Box header, count and progressive reveal | 604; share → 215, cart → 505b |
| 502 (#111, merged) | Media Box tiles ≈ 292px, 4-up at 1280 (169px is the sidebar gallery). Plain-link PDF/video variants. Fix the 2 × 404 links. DAM originals | 502 |
| 607 (open) | Bullets, newsletter and the related band are optional. Media Box and related are two separate full-bleed bands. The importer emits Buzzsprout/Vimeo into Embeds | 607 (+0.5 in the **agent lane**, importer-only with an objective oracle; extra reviews; the 803 part is M2) |
| 305 (#134) | Contacts/Subscribe/Company + MR copyright are asserted on the MR URLs | 305 builds it; the routing is **309** |
| 303 (Should) | List only the locales that have a translated document | 303 |
| 306 (open) | 4 social links + RSS / RSS (News) keep `target=_blank` + a safe `rel`, on both footer variants. The 4 legal links + wording (from closed 304) | 306 |
| 302 (open) | `aria-expanded` on the button, scroll lock, focus trap + Esc at 375 and 992 | 302 |
| 213 (#110) | 3 sourced cards. Static mosaic ≥ 768. The mobile carousel advances every 10s and honours hover and reduced motion. First card 812×467 at 1280 | 213 |
| 805a (open) | The 2-up WhatsApp / direct-ZIP row on Peaq and Epiq, or a recorded ZIP deferral with a working direct file. 375 dark caption below the image. 768 h1 28px | 805a (the ZIP part is from M2 806) |
| 805b / 609 (open) | Record D-1 = C. Audit all 50 tile hrefs, incl. the cross-kit Enyaq RS Race card, for 0 in-site 404s. Alias → 301 | 609 |
| 805c (Should) | 6 intro PDF/JPG downloads, 2 PDF/share banners, 2 contact cards, the 3-link sidebar menu, the Images +51 preview, the 60-item mixed Media Box with Show more/less, **Vimeo (not Buzzsprout)**, 8 topical toggles (multi-open, keyboard/ARIA) | 805c (the toggles are from M2 807) |
| 403 (#131, merged) | Autocomplete arrow / Enter / Esc / focus at desktop and mobile | re-verify on main (c0cc2f7 addressed keyboard/a11y) |
| 106 (closed) | The gutter | **826** |

**Corrected (2026-09-25, §11):** the G1/G2 claim about the #109 YouTube embed was first dropped as refuted. It is
only **half** wrong:
- **Host: refuted.** The 204 AC (l.43) deliberately uses the source host `www.youtube.com/embed`, not
  `youtube-nocookie`.
- **Consent gate: confirmed.** The same ACs require a "consent placeholder + click-to-load hook (stub for M1)"
  (l.47, l.49). `blocks/embed/embed.js:150–176` loads on intersection and has no click gate.

This is a **204 AC gap**, owned by vijay, 0.5 SP; see §11.

## 7. Spec drift register (docs corrected in this PR)

The census disproved these spec statements. A dated "Sweep correction" callout was added to each file. The full
measured wording is in the JSON `specDrift`.

| Spec | Correction |
|---|---|
| `_TEMPLATES.md` | Press-kit hub ≠ chapter page (no chapter-nav, variant selector or accordion on the M1 hubs). Legal/copyright sits inside the footer DOM. The series hub is a curated mosaic. The MR side has 16 URLs (309). The float dock is on every template (215) |
| `faceted-listing.md` | Images/Videos 12 / +12. Columns 1/3/4/4. 15 facets collapsed until "Advanced filter" |
| `template-press-release.md` | Bullets are optional. No sidebar newsletter. Two separate dark bands. The Peaq Media Box is 1 video + 3 images + 1 PDF |
| `template-model-page.md` | 3–6 rails and 8–9 anchors. Desktop sticky affix. Dangling source anchors. Rail heading is h3 26/32.5/600. Key Facts / Technical Data are unspecced (→ 208) |
| `story-detail.md` | In-body carousel widget (19 on 8 stories). The Media Box and Related bands are separate. The hero date is optional |
| `press-kit-template.md` | The 375 caption sits below the image. The h1 steps 28 → 48 at 992. Motorsport card mix. First glimpse = Vimeo + 8 topical toggles + a 60-item mixed Media Box |
| `series.md` | Curated editorial mosaic and order. The 375 hero title sits below the image |
| `README.md` | Social share maps to **215** (page float dock), not 304 |

Not changed (recorded in the JSON for the spec owners):
- The G6 note that the local `/en/series/130-years` is not a press-kit comparator.
- The G4 note that model pages have no promo-box, so 213 is not a 208 dependency.

## 8. Ruled out for M1 (⛔, with citation)

- **Side banner / ad creative:** 8 rows. SKODA-903 is M2 (board #79). The slot stays empty.
- **Newsletter ESP:** SKODA-904 is M2 (#80). M1 ships the UI stub only: 823 (sidebar, Could) and `newsletter-stub`
  in #134 (MR footer).
- **OneTrust consent:** 3 rows. M1 is the SKODA-704 consent stub only. The full CMP is outside M1.
- **FAQ block** (807), **grouped media/ZIP service** (806) and **bulk import automation** (803) are M2. Their M1
  slices sit inside 805a/c and 607 (see §6).
- **Press-kit child pages (50):** D-1 = C, i.e. they are external source links in M1 (609 audits them).

## 9. Critical path and capacity impact

**Critical path.** In this order, because it gates 45% of the registry:
1. **Corpus and index** (603 + 608, using the #132 DA push tool). The index today has 31 rows (18 story,
   10 press_release, 1 model) and **0 image/video/press_kit/series rows**. Home rails, the Images/Videos listings and
   the model media rails are empty until 608 lands and 603 reindexes.
2. **Story re-import** (801a) with the #113/#133 importer, after 819. This fixes B5/B6 on 13 stories.
3. **Press-kit importer + DA content** (805a, 805c). The 4 pages are 0% measurable today and have no
   `page-templates` entry.
4. **309** (MR side; draft 825) as soon as #134 merges (the footer rows must not be activated earlier). **826** right after the
   213/217/218 styles WIP merges. Both must land before the 704 sign-off.

**Capacity.** Against review §9/§15 plan A (Must 59.5 SP, ≈ 25.3 human dev-days of 28, slack ≈ 2.7 d):

| Change | Human SP | Owner (collision rule §10) |
|---|--:|---|
| + 309 MR side (draft 825): DA nav doc + metadata rows (0.5, Lars) + header active-state (0.5, vijay) + QA on the 16 MR URLs (0.5, vijay) | +1.5 | Lars / vijay (header surface) |
| + 826 gutter | +0.5 | Lars (global `styles/*`, after the WIP merges) |
| + 208 amendments (Key Facts / Tech Data, per-model tags, sticky nav, plus the 212 model-rail items) | +1.5 | vijay |
| + 402 listing QA fix widened (0.5 → 1) | +0.5 | saran |
| − 204 landed (#109 merged) | −1 | vijay |
| − 305 built in #134 (review and merge only) | −1 | vijay |
| **Net Must (human)** | **+2 SP ≈ +1 d** | slack ≈ 1.7 d |

Not credited here: #111 (502) and #131 (403) merged after this ledger was drawn up. Whatever review or merge SP the
baseline still held for them is extra slack, not a new commitment.

**Agent lane: +2.5 SP** on top of the baseline's 8. Each item is isolated and has an objective oracle:

| Agent item | SP | Reviewer |
|---|--:|---|
| 215 float dock (draft 827; build-ready spec, new block) | 1.5 | saran (cart slot = 505b) |
| 607 importer amendments (optional bands, Embeds emission) | 0.5 | extra |
| 216 listing-lightbox slice (links, Vimeo modal, keys; focus sign-off in 703) | 0.5 | saran |

Per person (0.49 d/SP), reconciled to the +2 net:

| Person | Baseline | Change | New | Days |
|---|--:|---|--:|---|
| vijay | 17.5 | +0.5 (309 header) +0.5 (309 QA) +1.5 (208) −1 (204) −1 (305) | 18 | ≈ 8.8 of 10 |
| saran | 19 | +0.5 (402) | 19.5 | ≈ 9.6 of 10, plus 2 agent reviews |
| extra | 10 | 0 (607 goes to the agent lane) | 10 | ≈ 4.9 of 5, plus 1 agent review |
| Lars | 13 | +0.5 (309 DA) +0.5 (826) | 14 | ≈ 3 of ≈ 3 coding days (full) |
| **Total** | **59.5** | **+2** | **61.5** | |

- Lars is full, so 826 is the first item to hand to an agent if the 603 runs slip.
- If the agent lane under-delivers, the 215 fallback is Should (Plan A). The 607 and 216 slices fall back to extra and
  saran, which uses the remaining ≈ 1.7 d of slack.

**Plan B** (§14 accepted): C-6 social share is delivered by the page float dock, **215**. Main's 215 file now defines
215 as the page-level bar; the gallery share dropdown stays with 216. This corrects the earlier reading here that
215 was the gallery share, and that the dock would replace it.
- **Must** = 67.5 − 1 (the old 1 SP 215 estimate) + 2 (sweep, human) + 1.5 (215 as the dock) = **≈ 70 SP**. Of
  that, 215's 1.5 SP runs in the agent lane.
- **Agent lane** = 8 + 2.5 = **10.5 SP**. If it holds, human slack stays ≈ 2–3 d inside the 5-day extension. If it
  doesn't, 215 falls to vijay and that slack goes.

These figures predate the parallel sweep. **§11 supersedes them** with the combined cut line.

Freeze (8 Oct), rehearsal (12 Oct) and demo (15 Oct) are unchanged.

## 10. Verification and caveats

**Completeness gates** (from the sweep plan):

| Gate | Result |
|---|---|
| All 42 pages + chrome captured at 4 viewports | ✅ source: 43/43 captured, 0 failures. EDS side: 11 on the main preview, 14 rendered locally from DA, 13 DA-only stories assessed from the DA source (no local render; flagged), 4 press kits with no EDS side (CONTENT-BLOCKED), and the alias checked as a redirect. PR branches: #109/#110/#111/#131 |
| Every region has a registry row; 0 `UNMAPPED` without a disposition | ✅ **after the Architect supplement.** The fleet missed the float dock on the 14 model, series and press-kit pages; its own captures had it, so 28 rows were added (§3). Page-specific regions are rows on every page. The shared chrome (header, footer, locales, cookie, dock) is recorded **per URL** in registry §4.7: side detected from each capture, element rows measured once per side on the G7 pages. 7 unmapped, all dispositioned: OneTrust → 704; Key Facts / Tech Data → 208; WhatsApp/ZIP → 805a; PDF banners → 805c |
| Every element is ticketed, ruled out, or has a new ticket | ✅ the only ❌ rows are the 84 float-dock rows (draft 827 → 215). The MR chrome rows carry 309 (draft 825) |
| Every built or PR element is measured or flagged CONTENT-BLOCKED | ✅ |
| All ❌ items + a 🟡 sample re-verified by the Architect | ✅ see below. The chrome-devtools MCP profile was locked, so the same CDP method ran in a fresh profile |

**Architect re-verification:**
- **Confirmed:**
  - Float dock absent: no share or scroll-top code in `blocks/` or `scripts/`. The dock is present on all 43 source
    captures at 375 and 1280, identical 322×70 fixed `div.sticky-buttons`.
  - MR chrome = STO on the Klaus preview (DOM text of the nav and footer columns).
  - Gutter at 375/768/992/1280 on two templates.
  - Home rail counts.
  - `query-index.json` has 31 rows with no media or press-kit rows.
  - `listing.js` ignores the authored `tags`.
  - The model importer hardcodes `elroq`.
  - Stale DA stories (`ouninpohja`).
  - The Epiq hero is missing its perex.
- **Partly refuted:** the claim that the Epiq hero is overlaid (it is not; the perex is missing).
- **Refuted:** the youtube-nocookie host. The consent gate half was later confirmed (§6, §11).

**Caveats:**
- 11 G2 stories and 2 G1 stories could not be rendered locally. Their IMPORT-GAP status rests on reading the DA
  source.
- Local renders do not apply bulk metadata.
- Interaction probes (lightbox focus, autoplay, cart, ZIP, share click) were only partly run. They are reported as
  N/A (140 checks), not as passes. **This gap hid the 212 desktop click/drag P1**, which the parallel sweep found
  and §11 confirms.
- The rows touched by the post-sweep merges (#109, 820, #134) need a re-measure. Run the harness again after the W2
  imports.
- The raw captures are kept in the session artifact store, not in the repo. The registry JSON is generated from them;
  do not hand-edit it.

## 11. Validation of the parallel sweep (main `88c1b48`) and combined cut line

A second sweep landed on main the same day:
[`SKODA-DEMO-SWEEP-REPORT.md`](SKODA-DEMO-SWEEP-REPORT.md) + [`SKODA-DEMO-URL-BLOCK-REGISTRY.md`](SKODA-DEMO-URL-BLOCK-REGISTRY.md).
It was measured at 1440/390, which is why its pixel values differ from ours (375/768/992/1280). It added 9 tickets.

**Method:**
- 2 gpt-6-sol agents re-ran its headline findings live, over CDP, on 2026-09-25, against `main--`/`.aem.live` and
  the source.
- Rail interaction used **trusted input events** (`Input.dispatchMouseEvent` / touch), not `el.click()`.
- The raw evidence is in the session artifact store (not committed), as with §2.

### 11.1 Verdicts

| Their finding | Verdict | Live evidence | Action |
|---|---|---|---|
| **V1** rail mouse click / drag (212) | ✅ **Confirmed, P1** | At 1440, a click on home eMobility, Latest News and Epiq Related Stories cards focuses the link but never navigates. A 300px drag leaves `scrollLeft` at 0: `pointerdown` captures on the track, then the link's native `dragstart` → `pointercancel`. Keyboard Enter and 390 touch (swipe 0→328px, tap navigates) work. `carousel.js:204–237`, `story-rail.js:219–224` | **Reopen 212**. This sweep missed it: the interaction probes were N/A (§10) |
| **V2** rail geometry | ✅ Confirmed | Home eMobility: source 3 fully visible cards at 354×199 → EDS 4 at 281×158. Epiq Related Stories: 3 → 4 at 263×148. "Based on tags" 16/32 `rgb(196,198,199)` → 16/24 white. Title hover turns green on EDS only. The models rail shows 1 dated overlay card vs 4 taxonomy cells | 212 geometry/hover (our §5 "Rails" row, same cause); 820 subheading |
| **V3** dark bands | 🟡 **Partial** | Heading `rgb(22,23,24)` on `rgb(14,58,47)`: **confirmed** (the global `h*` colour wins). "Band is 1248, not full-bleed": **refuted** for Epiq, because its `::before` paints the green to 1440; the PR band is 1440 | 218: heading contrast only |
| **V7** PR single column | ✅ Confirmed | Source prose 812 + sidebar 342 inside 832 + 416 columns → EDS prose 1248, no sidebar | 607 (open; already 📋 in the registry) |
| **§5 SKODA-824** highlight panel | ✅ Confirmed | Epiq source panel 839×772, bg `rgb(14,58,47)`, white text → EDS heading in a transparent parent, ink text. `story-flatten.js` `cellsOf()` unwraps the styled row (l.308–316, 393–401) | 824. Its dark variant overlaps our §6 218 amendment; build them together |
| **§5 SKODA-220** quote | ✅ Confirmed | Zellmer source: centred quote, 81.2×2 black rule, centred attribution → EDS left-aligned, no rule | 220 |
| **§5 SKODA-610** index titles | ✅ Confirmed | 28 of 31 `/en/query-index.json` titles end in " - Škoda Storyboard" (the source `og:title` does too) | 610 |
| **§5 SKODA-611** home composition | ✅ Confirmed | `stories.js:73–79` `isFeatured()` reads fields the index doesn't have. EDS `/en` has **1** main section, and its feed starts with the 24/22/17 Sep promo posts (the source starts with Epiq, 15 Sep) | 611 |
| **§5 SKODA-309** MR side | ✅ Confirmed, **undercounted** | All 5 model pages have the MR nav + Contacts/Corporate Communications footer, so the count is 16 URLs, not 11. The 309 active-tab path list omits `/en/skoda-model/` | 309; fold in draft 825 (16 URLs, activation guards, 307 empty-no-throw) |
| **§5 SKODA-215** float bar | 🟡 **Partial** | Present on story, model, 2 kits **and** home, PR, Images and Videos (desktop ≈ [1102,822,322,70]). This matches our census: all 43 captures | 215 scope = every template; fold in draft 827 |
| **§5 amendment 204** nocookie + consent gate | 🟡 **Partial** | Host claim **refuted** (AC l.43 uses `youtube.com/embed`). Gate claim **confirmed**: AC l.47/49 require a click-to-load hook, and `embed.js:150–176` is intersection-only | 204 AC gap, 0.5 SP. **Corrects this report's earlier "refuted"** (§6, §10) |
| Missing blocks (not in their list) | ✅ **New** | Elroq references `in-page-nav` + `spec-table`, `/en` references `promo-box` and the older Epiq story references `version`. All four block JS files return 404 on preview and live | `in-page-nav`/`spec-table` → **208** importer (emit existing blocks; +0.5). `version` → 801a re-import. `promo-box` → 213 (#110) |
| V4/V5/V6/V8/V9/V10, 225, 221, 308 | Not re-measured | They agree with this registry's 🟡/⚠️ rows (816, 821 + **826** gutter, 817, 202/207/805a, 301–306, 402). 221 is the build of our unsized §6 207/805a mosaic amendment | Accept as written. 308 and 821 rebase on 826 (see 826) |
| §6 doc errors | Mostly overlapping | §7 already corrects `story-detail` (skoda-carousel-widget), `series` (mosaic), `faceted-listing` (collapsed facets) and `_TEMPLATES` (press-kit hub). The rest are accepted for the spec owners | — |
| §7 "close the 219 issue" | Already done | #116 was closed as not planned on 2026-09-25 (OVERVIEW, disk↔GitHub sync) | — |

**Ticket IDs:**
- The main-first IDs are kept.
- Our float-dock draft was renumbered **824 → 827** (824 = the highlight panel on main) and marked a duplicate of
  **215**.
- Draft **825** is marked a duplicate of **309**.
- Both drafts stay on disk only to carry their extra ACs into 215/309 at sign-off; neither gets a GitHub issue.
- **826** is not a duplicate. It is the section-gutter token that 308 (topbar padding) and 821 (story body inset)
  rebase onto.

### 11.2 Combined capacity and cut line

- **Their 9 tickets total 20 SP.** Removing the two duplicates already counted in §9 (215 ≈ 827, 309 ≈ 825) leaves
  **16 SP**, plus 2 × 0.5 because we adopt their 2 SP estimates for 215/309.
- **The re-check adds:**

  | Item | SP |
  |---|--:|
  | 212 desktop click/drag fix | 1 |
  | 204 consent gate | 0.5 |
  | 208 missing block names | 0.5 |

- **Total new demand: ≈ 19 SP ≈ 9.3 dev-days, against ≈ 1.7 d of slack** (§9: vijay 1.2, saran 0.4, extra 0.1).
  Most of it must go below the line.

| Tier | Items | SP | Owner |
|---|---|--:|---|
| **Must (human)** | 212 click/drag fix (P1, every rail on every page) | 1 | saran (`carousel`/`story-rail`) |
| | 309 at 2 SP (+0.5 over 825) | 0.5 | vijay (header) |
| | 204 click-to-load consent hook | 0.5 | vijay |
| | 208 importer emits existing blocks for `in-page-nav` / `spec-table` | 0.5 | vijay |
| | **611a**: home promo exclusion (`isFeatured` → path/template rule), feed starts on the right story, section structure | 1.5 | vijay |
| | 218 heading colour on dark bands | (in 218) | owner of 218 |
| | *Offset:* 208 Key Facts / Technical Data (from §9 +1.5) → Should | −1 | vijay |
| | **Net** | **+3 SP ≈ 1.5 d** | fits within the 1.7 d; **≈ 0.2 d margin** |
| **Must (agent lane)** | 610 title normalisation + reindex (oracle: 0 suffixed titles) | 1 | reviewer: extra |
| | 215 at 2 SP (+0.5 over 827) | 0.5 | reviewer: saran |
| **Should (agent, only if a reviewer has slack)** | 220 quote (oracle: centred, 81×2 rule) | 2 | reviewer: extra |
| | 225 columns split (cosmetic) | 1 | reviewer: extra |
| **Should (human, Plan B extension)** | 308 chrome parity | 3 | vijay/saran (header/footer surfaces) |
| | 824 highlight panel (dark = 218 section + flatten fix; grey variant) | 3 | saran |
| | **611b** full 9-band home stack spacing | 1.5 | vijay |
| | 208 Key Facts / Technical Data | 1 | vijay |
| **Could / fallback** | 221 tiles mosaic: series use the D-4 static fallback; press kits get plain cards until 221 | 3 | — |

**Per person after this cut:**

| Person | SP | Days |
|---|--:|---|
| vijay | 20 | ≈ 9.8 of 10 |
| saran | 20.5 | ≈ 10.0 of 10 |
| extra | 10 | 4.9 of 5, plus 3 agent reviews |
| Lars | 14 | full |

- **There is no margin left in Plan A.** If the 603 import runs or the 212 fix slip, 611a falls back to the promo
  exclusion only (0.5 SP), and the section structure moves to 611b.
- **Plan B** (§14 accepted, 5-day extension): the extension's ≈ 2–3 d of human slack takes 308 + 611b first, then
  824. 221 stays on the D-4 fallback.
- **Agent lane:** Must 10.5 → **12 SP** (Should +3).

### 11.3 Board actions (proposals only; no GitHub changes made)

1. **Reopen SKODA-212** as P1 with the V1 evidence.
2. At sign-off, create issues for 215, 220, 221, 225, 308, 309, 610, 611 (split a/b) and 824 from main, plus 826.
   Do **not** create 825/827; fold their ACs into 309/215 and delete the drafts.
3. Amend the ACs:
   - 204: the consent hook
   - 208: block names, and Key Facts/Tech Data moved to Should
   - 218: heading colour
   - 816/817/819/820/502/608: per their §5 and our §6
4. Re-measure the 3 stale imports (plates, Peaq record, Octavia) after the re-import. Re-run both sweeps' rail probes
   with trusted input after the 212 fix.
