# Decision register (M2), D1–D19 + new questions

The repo had no single decision log:

- `SKODA-DELIVERY-PLAN.md` §8, which tickets cite, isn't in the repo.
- [`SKODA-MASTER.md`](../analysis/SKODA-MASTER.md) §12 lists D1–D11, and
  [`SKODA-CLIENT-REQUIREMENTS-MAPPING.md`](SKODA-CLIENT-REQUIREMENTS-MAPPING.md) §7 lists D17–D19.
- D12–D16 were only referenced inside tickets.

This register collects all of them as of **2026-10-15**, with what each one blocks and the default we propose if
the client doesn't answer. It is the input for finalising the M2 requirements.

Status: 🟢 resolved · 🟡 open, a default is proposed · 🔴 open and blocking.

| # | Decision | Status | Blocks | Proposed default (to confirm) |
|---|---|---|---|---|
| D1 | Language scope | 🟡 refined: EN + CS primary; DE/SK/SR/SL on demand | 1001, 1002, 1003 | EN + CS at go-live; other locales on a later date set per local office. CS alone has 1,056 items with no EN version ([coverage §4](SKODA-PAGE-COVERAGE-MATRIX.md)) |
| D2 | Media cart | 🟢 demo: device-ID, no login, client-side ZIP · 🟡 production approach | 902, 806a | Keep the client-side ZIP; add a serverless ZIP only above the item limit |
| D3 | Banners: keep, rebuild or drop | 🔴 | 903 | Drop the ad server; use an authored featured-promo block if the client wants promos |
| D4 | Newsletter service (ESP) | 🔴 | 904, `/en/newsletter-settings/` | Keep mailguide.cz behind a form block (double opt-in); need ESP API access |
| D5 | Media / DAM | 🟢 AEM Assets · 🟢 renditions: **Media Bus** (2026-10-16) · 🟡 rights rule | 504a, 511, 512, 513, 520, #219 | Masters-only in Assets; every display size + the 1920 download from the Media Bus, no Dynamic Media; >10 MiB masters get one processing-profile rendition as Media Bus input; source CDN removed first (520). See [asset-ingestion review](../architecture/SKODA-ASSET-INGESTION-M2.md) |
| D6 | Search: index-only or hosted | 🟡 index-only today | 901 | Index-only at go-live; hosted search as a post-go-live project |
| D7 | Content cutoff / archive scope | 🔴 | 801b, 803, 847, 210, 844, 848 | Migrate everything EN from 2015 on (≈ 4,620 pages); drop empty pages with a redirect |
| D8 | Owners for Škodapedia and press kits | 🟡 commerce closed; owners open | 206, 802 | Škodapedia stays in Storyboard (pre-baked terms) unless the client moves it out |
| D9 | Embargo mechanism | 🟢 approach agreed (staged publish) | 811 | Build the ungated version now; the group gate follows D15 |
| D10 | Analytics: `skoda-analytics` or GA + FB pixel | 🔴 | 804, 905 | GA4 + FB pixel via GTM behind OneTrust; no bespoke dataLayer |
| D11 | Figma-to-AEM showcase | 🟡 (demo item) | – | Close after the demo |
| D12 | Facet subset (which of the 15 facets are normalised and shown) | 🟡 | 401, 808a, 512, 848 | All 15 as on the source (402d already ships them on News / Press Kits) |
| D13 | DA or Universal Editor | 🟢 DA; the Assets picker is live (#62, 12 Oct) | 507 ✅, 805, 802 | DA / Experience Workspace |
| D14 | Adobe CDN / App Builder edge functions available | 🔴 | 906, 511 runtime, 902 | Not assumed; design without edge functions. **2026-10-16:** the 511 sync job runs on **App Builder** (serverless, not edge): needs the entitlement + an OAuth S2S technical account |
| D15 | Editorial RACI / roles | 🔴 | 809, 811 (group gate), 812, 843 (legal owner) | 7 groups as in the requirements §6.4 |
| D16 | NFRs / logging | 🔴 | 812 | DA version history as the audit trail; confirm whether it is enough |
| D17 | QR-code restricted access | 🔴 | 906 | Out of go-live scope until the access model is defined |
| D18 | Page-type split | 🟢 resolved 2026-09-14 | – | – |
| D19 | AI-tool usage reporting | 🟡 compliance notice owed | – | Lars sends the notification |
| MR-PK03 | Press-kit variant selector | 🔴 | 808a | Not built (the source has none) unless the client asks for it |
| §11.10 | FAQ: per-kit or a shared pool | 🟡 | 807 ✅ | Per kit (as built) |
| **Q-1** (new) | Which company and legal pages exist at go-live | 🔴 | 810, 843 | 4 company sub-types + BGC + the footer-linked legal set; drop `/en/impressum/` (empty), `server-status`, `soon-also-in-german`. **`/de/impressum/` is not droppable**: it is the required imprint of Škoda Auto Deutschland GmbH, Must whenever `/de/` moves (Q-9; [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-DE-09) |
| **Q-2** (new) | Annual reports: the source page now 404s | 🔴 | 810 | Drop the sub-type |
| **Q-3** (new) | Featured-image mini-pages (Road to Christmas + classic cars, 29) | 🟡 | 844 | Keep on the page base; Advent days linked from their index |
| **Q-4** (new) | Which taxonomy archives exist (378 EN) | 🟡 | 848 | Keep the linked ones + terms with ≥ N items; redirect the rest to the filtered listing |
| **Q-5** (new) | Event galleries and campaign microsites (~150 pages) | 🔴 | 210 | Keep the event galleries (gallery grid); drop the near-empty campaign pages |
| **Q-6** (new) | Pages that exist only outside EN (2,478 items) | 🔴 | 1001, 1002, 1004 | In scope for CS at go-live (1,056 items); others per D1. **2026-10-20:** the CS-only count understates the work: the whole CS corpus (≈ 5,100 docs incl. press kits) needs an import, see **Q-7** and SKODA-1004 |
| **Q-7** (new) | Non-EN corpus at the cutover: what happens to each locale's WordPress tree on 02 Jan 2027 if it doesn't go live with EN + CS | 🔴 | 1004, 1004a–e, 1002, D1 | No ticket imports the ≈ 12,000 existing non-EN docs (CS ≈ 5,100, DE ≈ 2,800, SK ≈ 2,300, SR ≈ 1,500, SL ≈ 335). DE, SK and SR are written locally, not translated. Proposed: import CS for go-live (1004a); freeze and import DE/SK/SR/SL before DNS (1004b–e), opened for authoring per local office. Alternative: keep their WordPress trees behind a path route. See the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) |
| **Q-8** (new) | DE press releases and the DE Media Room (frozen since 2023-03; the DE header links skoda-media.de) | 🟡 | 1004b, 303a, 609 | 301 each DE release to its EN twin (1,259 of 1,260 have one); DE Media Room pages and DE press kits → skoda-media.de. See the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) |
| **Q-9** (new) | Legal owner and legal set per locale (extends D15 and Q-1) | 🔴 | 843, 904, 1004a–e | Owners: HQ (EN, CS), Škoda Auto Deutschland (DE), ŠKODA AUTO Slovensko (SK), Autočačak (SR), Porsche Slovenija (SL). Each confirms its set: DE Impressum, CS newsletter terms (cite Act 101/2000 Sb., repealed), SK cookie notice (Czech text), SL Impressum + privacy (both 404). See the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) |
| **Q-10** (new) | Where translation pairs live after go-live (today: one bulk sheet built from the WordPress heads) | 🔴 | 1005, 1001, 303a | A translation-group id in page metadata and the index; the switcher and hreflang resolve it at runtime. See the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) |
| **Q-11** (new) | Per-locale media titles, captions and alt text (the M2 media feed is one EN feed on deduplicated assets) | 🟡 | 511, 517, 520, 504 | AEM localised metadata fields, exported per locale into the feed; binaries stay deduplicated. See the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) |
| **Q-12** (new) | Content cutoff per locale (D7 covers EN only) | 🟡 | 1004a–e, D7 | Everything for CS, SK, SR and SL; DE per Q-8; legal and T&C posts exempt from any date rule (23 DE posts are back-dated to 2000–2009). See the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) |
| **Q-13** (new) | Password-protected posts (11 DE; EDS has no page passwords) | 🟡 | 1004, 803 | Exclude `content.protected` posts from every import and redirect them; check the other locales. See the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) |
| **Q-14** (new) | Serbian script | 🟡 | 1002, 1004d | Serbian Latin only, no Cyrillic edition (0 Cyrillic in 900 SR titles); any machine translation targets `sr-Latn`. See the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) |

Q-7 to Q-14 were added on 2026-10-20 from the [locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md).
