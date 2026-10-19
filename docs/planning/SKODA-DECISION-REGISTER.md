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
| **Q-1** (new) | Which company and legal pages exist at go-live | 🔴 | 810, 843 | 4 company sub-types + BGC + the footer-linked legal set; drop `impressum` (empty), `server-status`, `soon-also-in-german` |
| **Q-2** (new) | Annual reports: the source page now 404s | 🔴 | 810 | Drop the sub-type |
| **Q-3** (new) | Featured-image mini-pages (Road to Christmas + classic cars, 29) | 🟡 | 844 | Keep on the page base; Advent days linked from their index |
| **Q-4** (new) | Which taxonomy archives exist (378 EN) | 🟡 | 848 | Keep the linked ones + terms with ≥ N items; redirect the rest to the filtered listing |
| **Q-5** (new) | Event galleries and campaign microsites (~150 pages) | 🔴 | 210 | Keep the event galleries (gallery grid); drop the near-empty campaign pages |
| **Q-6** (new) | Pages that exist only outside EN (2,478 items) | 🔴 | 1001, 1002 | In scope for CS at go-live (1,056 items); others per D1 |
