# SKODA-711, WordPress decommission: read-only archive, personal data, licences, hosting end, shared hosting

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** launch / governance (mostly client and hosting work)
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02) plus the weeks after it. The plan and the exports are due
  before go-live; the switch-off follows the rollback window (SKODA-710).
- **Estimate:** 3 SP team time · AI-assisted 1–2d / manual 2–3d, excluding client-side hosting work *(planning
  estimate, not a quote)*. Round 2 adds no SP: the shared-asset inventory and the dates are client and agency
  questions plus rows in the existing plan.
- **GitHub issue:** [#418](https://github.com/skoda-storyboard/demo/issues/418) (created 2026-10-21, sub-issue of epic #8)
- **Status (2026-10-21, amended after round 2):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-G-03 (High, CONFIRMED), with G-B-13
  merged; G-B-10, G-B-09; the inventory and time challenges in §6. Round 2: G-T5-01 (Medium, CONFIRMED), G-T5-02,
  G-T5-06, G-T9-02, G-T9-07.

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
- **Shared hosting** (inventory challenge, G-T5-06): `skoda-motorsport.com` (its own theme) shares more than the two
  production IPs (18.157.207.232, 18.157.226.196):
  - the stage/test ELB: `stage.` and `test.` of both domains resolve to the same ELB, all 4 behind basic auth (401);
  - the server-side GTM IP: `sgtm.skoda-storyboard.com` and `sgtm.skoda-motorsport.com` resolve to the same Google
    Cloud IP (136.110.149.253);
  - the same Bedrock layout and mu-plugins `data-store`, `skoda-analytics`, `skoda-banner` and `skoda-carousel`.

  Removing the stage ELB or "the" sGTM container would hit the sister site. Both themes name YS.cz as author; whether
  YS.cz is also the hosting and maintenance contractor is not confirmed.
- **The same nginx** terminates the 11 alias hosts (SKODA-709a). 3 of them follow `www` on switch day (CNAME chains,
  G-T5-01); the 8 own-record aliases must move before the bundled Let's Encrypt renewals fail (G-T5-02, dated in
  SKODA-710's calendar). Alias moves are a cutover step, not a decommission step.
- **Data only WordPress holds:** the answer keys of the 54 quizzes and the ~22 self-hosted HTML packages
  (SKODA-849), the Real Media Library folder tree, and the cart history.
- **Licences** (G-B-10, Medium, not re-verified): Real Media Library 4.22.38 (devowl.io, licensed through
  `real-product-manager-wp-client`, which also has a telemetry route) organises the ~28.3k logical media items in
  an editor-curated folder tree. `/realmedialibrary/v1/tree` is 403 anonymously; an `/export` route exists. No doc
  maps the folders to AEM Assets (0 mentions in the asset-ingestion design).
- **Download history** (G-B-09, Medium, not re-verified): `/en/your-downloads/` renders "Your packages" from
  `media-cart/v1/history`, keyed by the cookie `skoda_media_cart_history_{lang}`; 1 page per locale (6). D2 has no
  history, the page is 404 on the demo, and SKODA-902 doesn't mention it.
- **Time bounds** (G-T9-02): the rollback window ends when the WordPress Let's Encrypt certificate lapses (it can't
  renew by HTTP-01 once DNS moves). For a switch in the week of 4 Jan, that is about 2027-01-29 or about 2027-03-30,
  depending on the late-December renewal; SKODA-710 fixes the date with a forced renewal before the switch. The
  `stage.` and `test.` certificates expire on 2026-12-28, during the freeze. Without a dated deletion, an "archive
  copy" means keeping PII indefinitely.

## Scope
**Client:**
- Must a read-only copy of the WordPress site be kept after go-live? In what form, for how long, where, and who signs
  off deleting the databases and backups?
- List every WordPress environment, database copy and backup, with deletion dates. Does IIHF submission data exist?
- Is YS.cz the hosting and maintenance contractor for Storyboard and Škoda Motorsport, under one contract or two, and
  who holds the AWS account? What happens to `skoda-motorsport.com`? (Its newsletter link is SKODA-908.)
- Do editors rely on the Real Media Library folders, and should AEM Assets mirror them?
- Retention period for generated download packages; end dates for the plugin licences and the AWS hosting.

**Team:**
- **Decommission plan:** the order (rollback window closed, exports verified, archive taken, data deleted, licences
  and hosting ended), with a date and an owner per step. The switch-off, the PII deletion and the backup deletion are
  dated from the measured rollback deadline (SKODA-710), not left open. Precondition: the own-record aliases have
  moved (SKODA-709a).
- **Shared-asset inventory:** the EC2 pair, the stage/test ELB, the sGTM endpoint, the shared mu-plugins and any
  shared banner or data-store backend, each with what Storyboard removes and what stays for Motorsport.
- **Exports before deletion:** quiz keys and HTML packages (with SKODA-849); the Real Media Library tree through its
  authenticated export, if mirrored (amends SKODA-504a with a folder mapping).
- **Read-only archive** in the form the client chooses (static crawl or database dump), with its retention date.
- **Amend SKODA-902:** package history is dropped (D2); redirect rows for `/{loc}/your-downloads/` to the EDS cart
  page; delete the stored packages and history records with the switch-off.
- **Personal data:** confirm what WordPress itself stores for subscribers; export any subscriber or consent data
  it holds to the ESP chosen under D4 (SKODA-904) before deletion.
- **Deletion record:** dated, per environment, scoped to Storyboard's databases, files and vhosts only.
- **End dates:** the Real Media Library licence and the AWS hosting go into SKODA-712's register (G-T9-07).

## Not in scope
- The DNS and alias moves: SKODA-709, 709a. Rollback mechanics and the deadline: SKODA-710.
- `cdn.skoda-storyboard.com` and its S3 bucket: SKODA-520. The ESP and its subscriber flows: SKODA-904 (D4).
- Author sign-in replacing wp-2fa: SKODA-101a.

## Acceptance criteria
- [ ] The client's answers are recorded: archive yes/no, form, retention and the deletion sign-off owner.
- [ ] An inventory lists all 3 environments plus every database copy and backup, with owner and deletion date.
- [ ] Before any deletion, the quiz keys, HTML packages and (if mirrored) the folder tree are exported and their
      targets checked.
- [ ] After the Storyboard vhosts and target groups are removed, `skoda-motorsport.com` still answers 200,
      `stage.` and `test.skoda-motorsport.com` still answer (401 today) and `sgtm.skoda-motorsport.com/healthy` still
      returns 200; or the owner has accepted an end date in writing.
- [ ] `/en/your-downloads/` (and the other locales) redirects to the EDS cart page on the production host.
- [ ] The switch-off, PII deletion and backup deletion dates are derived from the rollback deadline in SKODA-710,
      and a dated deletion record exists per environment, signed off by the client.
- [ ] The licences and hosting have end dates, entered in SKODA-712's register.

## Dependencies
SKODA-709, 709a (alias moves), SKODA-710 (rollback deadline), SKODA-849 (quiz and package exports), SKODA-504a (folder
tree), SKODA-902 (history), SKODA-908 (motorsport newsletter), SKODA-907 (sGTM endpoint), SKODA-712 (register), D2,
D4. Client: hosting owner (YS.cz?) and privacy sign-off.
