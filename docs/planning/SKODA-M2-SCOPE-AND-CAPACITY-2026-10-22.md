# M2 scope and capacity (2026-10-22)

Where open M2 work stands after the gap review, its follow-ups and the hygiene decisions of 2026-10-22, against the time
left to go-live (02 Jan 2027). It is input for one decision: **staff up, cut scope, or both**.

**Method:**
- **Open work:** every open GitHub issue on the M2 milestone (fetched 2026-10-22), joined to its ticket's estimate in
  [OVERVIEW](../tickets/OVERVIEW.md). Parents count only their own share, and sub-tickets count separately (as
  SKODA-1004 and its 1004a–e do).
- **Units:**
  - SP are planning estimates, not quotes;
  - "AI-assisted" and "manual" are person-days at the midpoint of each ticket's range;
  - issues without an estimate count as 0 and are listed in §5.
- **Calendar:** Czech working days, without 28 Oct, 17 Nov and 24–26 Dec.

## 1. Summary
- **Open M2:** **110 issues, ≈ 312 SP**, which is **≈ 157.9 person-days AI-assisted** or
  ≈ 315.9 manual. 14 issues still have no estimate.
- **Time left:** **47 working days** to 02 Jan, and **39** to an 18 Dec content freeze
  (Q-20's default). Only 7 working days fall in the last two weeks.
- **People needed** to finish by the freeze: **≈ 4.0 full-time AI-assisted** (≈ 8.1 manual).
  To finish by 02 Jan without a freeze: ≈ 3.4 AI-assisted (≈ 6.7 manual).
- **What these numbers leave out:** review, QA and coordination overhead (an assumption of +20–30% is common), the
  unestimated issues, and the client's lead time on the items in §4, which no staffing shortens.
- **Five scope levers** remove ≈ **38.5 SP / 18.5 AI-assisted days** (§3), which leaves ≈ 273.5 SP /
  139.4 AI-assisted days, or ≈ 3.6 full-time to the freeze.
- Already done on 2026-10-22: SKODA-901, 903 and 906 moved to M3 (−21 SP).

## 2. Open M2 by epic
| Epic | Issues | SP | AI-assisted days | Manual days | Without estimate |
|---|--:|--:|--:|--:|--:|
| ? No epic label | 3 | 0 | 0 | 0 | 3 |
| E01 Foundation & setup | 6 | 18 | 10 | 20 | – |
| E02 Core blocks | 9 | 21.5 | 8.4 | 16.8 | 2 |
| E04 Listings & search | 3 | 10.5 | 3.8 | 7 | – |
| E05 Media pipeline | 20 | 43.5 | 24 | 49.1 | 3 |
| E06 Import | 5 | 13 | 8 | 17.5 | – |
| E07 QA, perf, a11y & launch | 17 | 41.5 | 21 | 41 | – |
| E08 Editorial at scale | 28 | 84.5 | 42.3 | 86.5 | 6 |
| E09 Dynamic services | 8 | 40.5 | 21 | 41.5 | – |
| E10 Localization | 11 | 39 | 19.5 | 36.5 | – |
| **Total** | **110** | **312** | **157.9** | **315.9** | **14** |

## 3. Scope levers (decisions that remove work)
Each lever needs a client answer, and each has a register row. Taking all five is not a recommendation; they are the
options, sized.

| Lever | Tickets it removes from M2 | SP | AI-assisted days | Manual days |
|---|---|--:|--:|--:|
| Q-7: DE/SK/SR/SL imports after go-live (WordPress keeps /de, /sk, /sr, /sl behind a path route) | SKODA-1004e, SKODA-1004d, SKODA-1004c, SKODA-1004b | 10 | 5 | 13 |
| D8: retire or prune Škodapedia instead of migrating it | SKODA-206a, SKODA-802a, SKODA-849a, SKODA-206 | 17 | 8 | 16.5 |
| Day-2 authoring extras after go-live (originals have a DAM-URL workaround; new press kits by hand) | SKODA-850e, SKODA-850b | 6 | 3 | 5 |
| Q-5: plain event galleries, no download tiles | SKODA-210a | 2.5 | 1 | 2 |
| Q-19: drop the quizzes and keep the HTML packages as static assets only | SKODA-849b | 3 | 1.5 | 3.5 |
| **All five** | | **38.5** | **18.5** | **40** |

**Notes on the levers:**
- **Q-7** keeps the four national WordPress trees running after go-live. That adds a legacy-origin route to SKODA-709
  and delays the decommission (SKODA-711).
- **D8** removes Škodapedia from the migration. Then the in-body glossary spans (849a) need a plain-text fallback.
- **Q-19:** the SP shown are the interactive HTML packages (849b). Dropping the quizzes saves less, and that part sits
  in 849's parent share.

## 4. Lead time no staffing shortens (client side)
- **DNS, CDN and certificates for www, the bare domain and 11 alias hosts** (SKODA-709, 709a; D14). This needs 2
  change requests at Škoda IT, before its year-end change freeze.
- **App Builder entitlement and credentials** (SKODA-521, C1–C7). Blocked behind it:
  - 511a (media feed orchestration);
  - 522 (asset changes reaching pages);
  - V1 (the DA token test).
- **Škoda IdP federation and the publish roles** (SKODA-101a, I1–I4, Q-15). Every local author needs it.
- **Vendors:**
  - iComVision (mobile app, 908a);
  - mailguide (send triggers and consent renewal, 908c);
  - Buzzsprout (podcast channel owner);
  - Vimeo (allow-list).
- **Legal owners and the legal set per locale** (Q-9, SKODA-843).
- **Decisions:** 18 red and 16 amber rows in the [decision register](SKODA-DECISION-REGISTER.md). The ones that move SP
  or block a build are Q-7, Q-16 to Q-21, D14 and D20.

## 5. Issues without an estimate
- #412 Media listings: missing meta descriptions on Images/Videos (baseline SEO)
- #387 Story aside "Explore more" teaser titles are h3; origin uses h2
- #386 Story body links render in ink with no underline; origin is green #419468, spec says under
- #366 SKODA-847, Press-kit corpus: enumerate every EN kit and run the three importers
- #364 SKODA-844, Featured-image mini-pages: Road to Christmas + classic-car pages (29)
- #363 SKODA-843, Generic pages: legal set, BGC, sustainability page, and the keep / drop list fo
- #319 SKODA-841, Tags entered once: facet metadata with pick lists, derived visible tags and arc
- #318 SKODA-840, Story newsletter card as one shared fragment
- #294 SKODA-515, Media Box bulk-add fly-to-cart feedback
- #293 SKODA-227, Related Stories heading-to-card spacing parity
- #292 SKODA-226, Charging profile heading and portrait sizing parity
- #289 SKODA-513, Native delivery for Images lightbox previews and fallback links
- #280 SKODA-836, Press-kit article importer for the `template-press-release` variant (Octavia RS
- #219 AEM Assets WebP activation succeeds but published originals remain 404

## 6. What to decide this week
1. **Staffing through 18 Dec:** at least 4.0 people full-time on AI-assisted delivery, plus review and
   QA, or fewer people with levers from §3.
2. **Levers:** the answers to Q-7 and D8 move the most work (≈ 27 SP).
   Ask for both first.
3. **Client lead-time asks (§4), sent this week** as one request pack with due dates in working days.
4. **Estimates for the 14 unestimated issues,** so the total is complete.

**Sources:** [M2 gap review](../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md),
[locale review](../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md), [OVERVIEW](../tickets/OVERVIEW.md).
