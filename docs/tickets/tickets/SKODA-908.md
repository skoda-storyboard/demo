# SKODA-908, External consumers at cutover: mobile app, newsletter manage pages, RSS delivery, podcasts, consent renewal

- **Epic:** E09, Dynamic Services
- **Type:** integration / cutover (client and vendor contracts, coordination ticket with sub-tickets)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The feeds and the manage pages must answer on the day of
  the DNS switch. The long poles are the vendors: iComVision (app), mailguide (ESP) and Buzzsprout (podcasts).
- **Estimate:** 1 SP for this ticket (client and vendor questions, the motorsport deep link, podcasts, coordination)
  · AI-assisted 0.5d / manual 1d, excluding vendor time *(planning estimate, not a quote)*. The first draft said
  5 SP, holding only if the app reads an index-shaped JSON or the RSS feed. The findings sum to more: app 3–8 SP by
  contract (G-B-01) plus 0–2 for the notification trigger (G-T6-02), RSS delivery 2–3 (G-KJ-06), manage pages and
  renewal 2–4 (G-B-06, G-KJ-05, G-KT-04), mailguide send triggers 0–2 (G-T6-04). Feed variants, full text and guids
  moved to SKODA-405 (amended 2026-10-21). Total 12 SP: 908a app 4, 908b RSS delivery 3, 908c newsletter 4.
- **GitHub issue:** [#424](https://github.com/skoda-storyboard/demo/issues/424) (created 2026-10-21, sub-issue of epic #95)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-B-01 (High, PLAUSIBLE), G-B-06
  (Medium, CONFIRMED, was High), G-KJ-05, G-KJ-06, G-B-03, G-T3-03, G-KT-04 (Medium), G-D-04 (Low); the last six
  were not re-verified. Round 2: G-T6-02, G-T6-04 (Medium), G-T5-09 (Low), not re-verified.

## Why
Systems outside the site read Storyboard URLs, and no ticket switches them over (detail in each sub-ticket):
- **Mobile app (908a, G-B-01, G-T6-02).** The Škoda Media Room app (iOS id420627875, Android
  `com.icomvision.skodamediaservices`, v7.1.37 of 2026-03-10, seller ŠKODA AUTO a.s.) promises releases, kits,
  Stories and new-article notifications. Its likely sources stop at the switch, and EDS has no outbound webhook on
  publish. It becomes Critical if the client confirms the app reads WordPress.
- **RSS (908b, G-KJ-06, G-B-03, G-T3-03).** 405 generates RSS and leaves delivery to "a separate human/infra step"
  that no ticket owns. Feedly counts 356 subscribers on 5 feed URLs; the demo 404s all 4 probed feed paths.
- **Newsletter (908c, G-B-06, G-KJ-05, G-KT-04, G-T6-04).** skoda-motorsport.com and the CS and SK lists manage
  subscriptions on Storyboard pages; the consent-renewal form has no rebuild; 4 mailguide lists exist (389, 339,
  386, 342) and nobody has asked what starts a send.
- **Motorsport deep link (G-KJ-05).** skoda-motorsport.com's Media Room menu links
  `/en/news/?filter[search]=motorsport&_search_type[]=press_release&sortby=newest`, which `listing-logic.mjs:94`
  ignores.
- **Podcasts (G-D-04).** #ExploreŠkoda Podcast (Buzzsprout 1878301, 252 episodes) and #ExploreŠkoda News CZ
  (1730804, 421) syndicate to Apple, Spotify, Amazon Music and YouTube. Their channel links point to
  `/en/category/podcast-en/` and `/cs/category/podcast-cz/`; 29 episode notes link 21 distinct Storyboard URLs, all
  slashed. Audio and artwork are on Buzzsprout. The EN show's owner email is a personal account, and nobody owns the
  account or the cutover update.
- **skodamedia.com (G-T5-09).** A separate Digital News Press newsroom (Nuxt on S3/CloudFront, probably Škoda UK)
  that shares no infrastructure with the origin; its `en-gb` paths suggest a market press site that may reuse
  Storyboard releases or images.

## Scope
**Client and vendors:**
- **C1 Škoda + iComVision:** which URLs the app calls (REST routes, feeds), with which parameters and auth; what
  triggers the new-article notification (WordPress hook, vendor poll of RSS or REST, or manual) and its
  de-duplication key. Can the app switch to the EDS index or RSS? (908a)
- **C2 Škoda marketing + mailguide:** which other sites send subscribers to the Storyboard settings page and which
  lists it must manage; how long consent is valid, when re-permission emails go out and which URL they link to; the
  redirect URLs configured in mailguide for subscribe, confirm and unsubscribe. For lists 389, 339, 386 and 342:
  what starts each send (an RSS campaign on which feed URL, an API call from WordPress, or a person), how often, and
  which Storyboard URLs and images the e-mail template pulls (G-T6-04). (908c)
- **C3 Buzzsprout owner:** name the account owner and who updates the channel links at cutover.
- **C4** Which systems or partners subscribe to the feeds; the www logs for feed user agents (with SKODA-103b C2).
- **C5 Škoda UK / Digital News Press (G-T5-09):** does the skodamedia.com newsroom take Storyboard releases or images
  by feed or by link? If yes, it joins 908b's feed test or C4's partner list.

**Team (this ticket):**
- **T4 Motorsport deep link.** Map `filter[search]=motorsport` + `_search_type[]=press_release` to an EDS filter
  (amends SKODA-402) or a redirect row (SKODA-103).
- **T7 Podcasts.** Add both show links, the 21 episode-note URLs and the archive pages to the cutover runbook
  (SKODA-710): verify the 301 and the archive 200.
- **Register rows.** Enter the app notification (C1) and each mailguide send trigger (C2) in SKODA-710b's publish
  side-effect register, with an owner and a launch test.

## Sub-tickets
| Ticket | Covers | SP |
|---|---|--:|
| [SKODA-908a](SKODA-908a.md) | Mobile app: content contract and new-article notification with de-duplication | 4 |
| [SKODA-908b](SKODA-908b.md) | RSS delivery: mechanism, content type, refresh, slash rule, feed decisions | 3 |
| [SKODA-908c](SKODA-908c.md) | Newsletter manage and landing pages, consent renewal, mailguide send triggers | 4 |

## Not in scope
- The newsletter form block and ESP integration: SKODA-904. The `/en/newsletter/` carousel page: SKODA-845.
- Feed generation, the feed set, full text and guids: SKODA-405. Podcast archive pages: SKODA-848 (G-D-03).
- Referrer outreach and inbound file links: SKODA-103b. skoda-motorsport.com's shared hosting: SKODA-711. Vendor
  renewal dates: SKODA-712.

## Acceptance criteria
- [ ] C1–C5 are answered in writing and recorded in the sub-tickets or the register.
- [ ] The motorsport deep link lands on a filtered press-release list or a documented redirect.
- [ ] The podcast owner is named, and both channel links resolve with at most 2 hops after the switch.
- [ ] SKODA-710b's register has the app-notification and mailguide rows, each with an owner and a test.
- [ ] The criteria of 908a–908c are met.

## Dependencies
- Client and vendors C1–C5; D4 (ESP), D14 (CDN), Q-7 (SK timing).
- Sub-tickets SKODA-908a–c. SKODA-904 and 405 (amended), 402, 103, 103a (slash order), 103b, 709 (edge worker host),
  710 and 710b (runbook, register), 521, 848, 1004a, 1004c.
