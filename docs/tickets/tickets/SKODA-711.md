# SKODA-711, WordPress decommission: read-only archive, personal data, licences, hosting end, shared hosting

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** launch / governance (mostly client and hosting work)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02) plus the weeks after it. The plan and the exports are due
  before go-live; the switch-off follows the rollback window (SKODA-710).
- **Estimate:** 3 SP team time · AI-assisted 1–2d / manual 2–3d, excluding client-side hosting work *(planning
  estimate, not a quote)*
- **GitHub issue:** [#418](https://github.com/skoda-storyboard/demo/issues/418) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-G-03 (High, CONFIRMED), with G-B-13
  merged; G-B-10, G-B-09; the inventory and time challenges in §6.

## Why
The requirements say "full migration = WordPress switched off" (MIG01-07), but no ticket owns the switch-off. A docs
grep finds only AR-01 (rewrite images before the origin goes), the media-cart doc and SKODA-1005's "once WordPress is
switched off".
- **Personal data.** `newsletter/v1` is a 10-route subscriber front (the subscriber backend is mailguide.cz, so what
  WordPress itself stores is **unverified**); `media-cart/v1/history` keeps per-browser package history; wp-2fa
  stores author second factors and passkeys; the user table holds every agency author. The refuters rated this High,
  not Critical, because the PII held in WordPress itself is partly inferred.
- **3 environments** (G-B-13, Low, not re-verified): `stage.` and `test.skoda-storyboard.com` resolve to an AWS ELB
  in eu-central-1, separate from `www`, and presumably hold database copies. The IIHF 2021 template still loads
  scripts from `iihf-app.skoda-storyboard.loc` (a local dev host), and `/en/iihf/gdpr/` is 404, so the campaign's
  photo submissions and their retention are undocumented.
- **Shared hosting** (inventory challenge): `skoda-motorsport.com` (its own theme) is served from the same two IPs
  (18.157.207.232, 18.157.226.196). Ending the hosting or load balancer would take a sister site down. The hosting
  agency is unknown.
- **The same nginx** terminates the 11 alias hosts (SKODA-709), so they must move first.
- **Data only WordPress holds:** the answer keys of the 54 quizzes and the ~22 self-hosted HTML packages
  (SKODA-849), the Real Media Library folder tree, and the cart history.
- **Licences** (G-B-10, Medium, not re-verified): Real Media Library 4.22.38 (devowl.io, licensed through
  `real-product-manager-wp-client`, which also has a telemetry route) organises the ~28.3k logical media items in
  an editor-curated folder tree. `/realmedialibrary/v1/tree` is 403 anonymously; an `/export` route exists. No doc
  maps the folders to AEM Assets (0 mentions in the asset-ingestion design).
- **Download history** (G-B-09, Medium, not re-verified): `/en/your-downloads/` renders "Your packages" from
  `media-cart/v1/history`, keyed by the cookie `skoda_media_cart_history_{lang}`; 1 page per locale (6). D2 has no
  history, the page is 404 on the demo, and SKODA-902 doesn't mention it.
- **Time bounds:** the rollback window ends when the WordPress Let's Encrypt certificate lapses (it can't renew by
  HTTP-01 once DNS moves: ≤ 90 days). Without a dated deletion, an "archive copy" means keeping PII indefinitely.

## Scope
**Client:**
- Must a read-only copy of the WordPress site be kept after go-live? In what form, for how long, where, and who signs
  off deleting the databases and backups?
- List every WordPress environment, database copy and backup, with deletion dates. Does IIHF submission data exist?
- Who owns the shared hosting, and what happens to `skoda-motorsport.com`? (Its newsletter link is SKODA-908.)
- Do editors rely on the Real Media Library folders, and should AEM Assets mirror them?
- Retention period for generated download packages; end dates for the plugin licences and the AWS hosting.

**Team:**
- **Decommission plan:** the order (aliases moved, rollback window closed, exports verified, archive taken, data
  deleted, licences and hosting ended), with a date and an owner per step.
- **Exports before deletion:** quiz keys and HTML packages (with SKODA-849); the Real Media Library tree through its
  authenticated export, if mirrored (amends SKODA-504a with a folder mapping).
- **Read-only archive** in the form the client chooses (static crawl or database dump), with its retention date.
- **Amend SKODA-902:** package history is dropped (D2); redirect rows for `/{loc}/your-downloads/` to the EDS cart
  page; delete the stored packages and history records with the switch-off.
- **Personal data:** confirm what WordPress itself stores for subscribers; export any subscriber or consent data
  it holds to the ESP chosen under D4 (SKODA-904) before deletion.
- **Deletion record:** dated, per environment, scoped to Storyboard's databases, files and vhosts only.

## Not in scope
- The DNS and alias moves: SKODA-709. Rollback mechanics: SKODA-710.
- `cdn.skoda-storyboard.com` and its S3 bucket: SKODA-520. The ESP and its subscriber flows: SKODA-904 (D4).
- Author sign-in replacing wp-2fa: SKODA-101a.

## Acceptance criteria
- [ ] The client's answers are recorded: archive yes/no, form, retention and the deletion sign-off owner.
- [ ] An inventory lists all 3 environments plus every database copy and backup, with owner and deletion date.
- [ ] Before any deletion, the quiz keys, HTML packages and (if mirrored) the folder tree are exported and their
      targets checked.
- [ ] `skoda-motorsport.com` still answers 200 after the Storyboard vhosts are removed, or its owner has accepted an
      end date in writing.
- [ ] `/en/your-downloads/` (and the other locales) redirects to the EDS cart page on the production host.
- [ ] A dated deletion record exists per environment, signed off by the client. The licences and hosting have end
      dates.

## Dependencies
SKODA-709 (aliases first), SKODA-710 (rollback window end), SKODA-849 (quiz and package exports), SKODA-504a (folder
tree), SKODA-902 (history), SKODA-908 (motorsport newsletter), D2, D4. Client: hosting owner and privacy sign-off.
