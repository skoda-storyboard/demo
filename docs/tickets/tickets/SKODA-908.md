# SKODA-908, External consumers at cutover: mobile app, newsletter manage pages, RSS delivery, podcasts, consent renewal

- **Epic:** E09, Dynamic Services
- **Type:** integration / cutover (client and vendor contracts, feed delivery, newsletter pages)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02). The feeds and the manage pages must answer on the day of
  the DNS switch. The long poles are the vendors: iComVision (app), mailguide (ESP) and Buzzsprout (podcasts).
- **Estimate:** 5 SP team time · AI-assisted 2–3d / manual 4–6d, excluding vendor time *(planning estimate, not a
  quote)*. The source findings sum to more (app 3–8 SP depending on the contract, RSS delivery +2–3, feed variants
  +1–2, manage pages and renewal 2–4). 5 SP holds only if the app can read an index-shaped JSON or the RSS feed.
- **GitHub issue:** to create
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-B-01 (High, PLAUSIBLE), G-B-06
  (Medium, CONFIRMED, was High), G-KJ-05, G-KJ-06, G-B-03, G-T3-03, G-KT-04 (Medium), G-D-04 (Low); the last six
  were not re-verified.

## Why
Systems outside the site read Storyboard URLs, and no ticket switches them over:
- **Mobile app (G-B-01, PLAUSIBLE).** The Škoda Media Room app (iOS id420627875, Android
  `com.icomvision.skodamediaservices`) is live: v7.1.37 of 2026-03-10, seller ŠKODA AUTO a.s., Android package by
  iComVision. Its listing promises press releases, press kits, Stories, annual reports, images and videos, and
  new-article notifications. The docs know only its store badges (304, 810). The likely sources (`wp/v2` posts and
  releases, the uncalled `site-info` routes of G-B-02, `/{loc}/feed/`) all stop at the switch. **Not observed:** the
  app may read its own iComVision backend. It becomes Critical if the client confirms it reads WordPress.
- **Newsletter manage pages (G-B-06, G-KJ-05).** skoda-motorsport.com links "Manage subscription" twice to
  `/en/newsletter-settings/`, and its Media Room menu deep-links
  `/en/news/?filter[search]=motorsport&_search_type[]=press_release&sortby=newest`, which `listing-logic.mjs:94`
  ignores. CS manages at `/cs/sprava-newsletteru/` (mailguide login form); SK lands on `/sk/odber-noviniek/` and
  `/sk/odhlasenie-z-odberu-noviniek/` after subscribe and unsubscribe. 0 docs name the 3 locale pages, and a page
  import drops the form. The refuters note that mailguide emails carry their own unsubscribe link.
- **Consent renewal (G-KT-04).** The settings page has a `mailguide-extend` form ("Predĺženie súhlasu") posting to
  `newsletter/v1/subscription/extend`, plus an `extend/{email}` route. 904 lists both routes but builds only
  subscribe and double opt-in, so re-permission emails after 2 Jan land on a page with no renewal.
- **RSS (G-KJ-06, G-B-03, G-T3-03).** 405 generates RSS and leaves delivery to "a separate human/infra step" that no
  ticket owns. EDS doesn't serve query-index as RSS; the demo 404s all 4 probed feed paths. Feedly counts 356
  subscribers on 5 URLs:

  | Feed URL | Feedly subscribers |
  |---|--:|
  | `/en/feed/` | 236 |
  | `/en/press-releases/feed/` (302 to `?post_type=press_release` on the source; footer link) | 94 |
  | `/cs/feed/` | 12 |
  | `/en/feed/?post_type=press_release` | 12 |
  | `/de/feed/` | 2 |

  Feedly is one reader; others show only in the www logs. The source feeds are full text (`content:encoded`, 10/10
  items, 139 CDN images in the EN feed), and `/en/feed/atom/`, `/en/feed/rdf/`, `?post_type=press_kit` and
  `/en/skodapedia/feed/` also answer 200. The 103a slash rule would 301 `/en/feed/` to `/en/feed`.
- **Podcasts (G-D-04).** #ExploreŠkoda Podcast (Buzzsprout 1878301, 252 episodes) and #ExploreŠkoda News CZ
  (1730804, 421) syndicate to Apple, Spotify, Amazon Music and YouTube. Their channel links point to
  `/en/category/podcast-en/` and `/cs/category/podcast-cz/`; 29 episode notes link 21 distinct Storyboard URLs, all
  slashed. Audio and artwork are on Buzzsprout. The EN show's owner email is a personal Gmail address (in the
  review's working files), and nobody owns the account or the cutover update.

## Scope
**Client and vendors:**
- **C1 Škoda + iComVision:** which URLs the app calls (REST routes, feeds, push trigger), with which parameters and
  auth, and who triggers the new-article notification. Can the app switch to the EDS index or RSS?
- **C2 Škoda marketing + mailguide:** which other sites send subscribers to the Storyboard settings page and which
  lists it must manage; how long consent is valid, when re-permission emails go out and which URL they link to; the
  redirect URLs configured in mailguide for subscribe, confirm and unsubscribe.
- **C3 Buzzsprout owner:** name the account owner and who updates the channel links at cutover.
- **C4** Which systems or partners subscribe to the feeds; the www logs for feed user agents (with SKODA-103b C2).

**Team:**
- **T1 App contract.** Write the contract C1 returns: an index- or sheet-shaped JSON with the fields the app reads,
  the RSS feed, or an App Builder adapter (credentials per SKODA-521). Test it with the app before DNS.
- **T2 Manage pages (amends SKODA-904).** One manage page per locale with a list (EN, CS), and the ESP landing pages
  (subscribe confirmed, unsubscribed; SK today). The EN page manages every list the account holds, including the
  motorsport lists. Add the 3 locale URLs to the 1004a / 1004c lists as "rebuild, not import". Update the mailguide
  redirect URLs at cutover.
- **T3 Renewal (amends SKODA-904).** An extend flow on the manage page, or an ESP-hosted page, per C2; a redirect
  for the extend links in emails already sent.
- **T4 Motorsport deep link.** Map `filter[search]=motorsport` + `_search_type[]=press_release` to an EDS filter
  (amends SKODA-402) or a redirect row (SKODA-103).
- **T5 RSS delivery (amends SKODA-405).** Pick the mechanism: an edge worker on the production CDN (default, per
  D14 / SKODA-709), an App Builder route, or a file republished on every publish. Set the content type and the
  refresh on publish. Exempt the feed routes from the 103a slash rule, or test the 2-hop chain.
- **T6 Feed content (amends SKODA-405).** Decide summary vs full text; images from the DAM, not the source CDN.
  Per-locale and release feeds; press-kit and Škodapedia feeds or redirect rows; `/feed/atom/` and `/feed/rdf/` 301
  to the RSS URL.
- **T7 Podcasts.** Add both show links, the 21 episode-note URLs and the archive pages to the cutover runbook
  (SKODA-710): verify the 301 and the archive 200.

## Not in scope
- The newsletter form block and ESP integration: SKODA-904. The `/en/newsletter/` carousel page: SKODA-845.
- Podcast archive pages: SKODA-848 (G-D-03). Referrer outreach and inbound file links: SKODA-103b.
- skoda-motorsport.com's shared hosting: SKODA-711. Vendor renewal dates: SKODA-712.

## Acceptance criteria
- [ ] C1 is answered in writing, and the app shows current releases and Stories against the EDS host (tested before
      DNS with the vendor, then on launch day).
- [ ] The 5 feed URLs (and `/en/press-releases/feed` slashless) answer 200 `application/rss+xml` or one 301 to the
      EDS feed; a new item appears within the agreed refresh time; Feedly refreshes after the switch.
- [ ] `/en/feed/atom/`, `/en/feed/rdf/`, press-kit and Škodapedia feed URLs answer 200 or 301; none 404s.
- [ ] A motorsport test subscriber and an EN test subscriber can change and withdraw consent on the EN manage page.
- [ ] The CS manage page and the SK landing pages work after cutover; mailguide's redirect URLs point at them.
- [ ] A consent-extension link from a re-permission email renews the subscription.
- [ ] The motorsport deep link lands on a filtered press-release list or a documented redirect.
- [ ] The podcast owner is named, and both channel links resolve with at most 2 hops after the switch.

## Dependencies
- Client and vendors C1–C4; D4 (ESP), D14 (CDN), Q-7 (SK timing).
- SKODA-904 and 405 (amended), 402, 103, 103a (slash order), 103b, 709 (edge worker host), 710 (runbook), 521,
  848, 1004a, 1004c.
