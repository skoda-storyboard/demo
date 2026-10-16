# SKODA-511b, Media feed sync operations: monitoring, credential lifecycle, runbook and handover
- **Epic:** E05, Media Pipeline
- **Type:** service / governance
- **Phase:** B · **Milestone:** M2 (go-live)
- **GitHub issue:** [#383](https://github.com/skoda-storyboard/demo/issues/383) (created 2026-10-16)
- **Estimate:** 1.5 SP · AI-assisted 0.5–1d / manual 1–2d *(planning estimate, not a quote)*
- **Status (2026-10-16):** 🔵 TODO (M2), no owner. Needs SKODA-511a on Stage.

## Why
After go-live the client's team runs the sync. Nothing in the platform warns when the feed goes stale:
- activations and logs are kept 7 days;
- failed event deliveries are retried for 24 h and then dropped, with no dead-letter queue;
- the only built-in alert is an email to org admins when a registration turns unstable.

Credentials also expire on their own schedule: the site API key after at most 365 days, and the AEM service
credential on its certificate.

## Scope
- **Freshness monitor:** a scheduled check outside the app (a GitHub Action, so it still works if the app is down).
  It alerts when the registry's build timestamp is older than 2 h, or when the last run report shows failures or a
  skip count above a threshold.
- **Alert routing:** to an agreed channel (client to name it), plus the event-registration emails to a shared
  mailbox rather than one person.
- **Logs:** forward Runtime logs to the client's log tool (Splunk, Azure Log Analytics or New Relic are supported),
  or record the decision not to.
- **Credential lifecycle:** an expiry register for the site API key, the AEM service credential and the S2S
  secret. Each has an owner, a rotation procedure (create new → swap secret → redeploy → delete old) and a reminder
  ahead of expiry.
- **Runbook:** how to read the run report; force a full reconcile; replay events from the 7-day journal; pause the
  sync (disable rules); roll back to the previous registry build; switch to the GitHub Action fallback.
- **Handover:** a walkthrough with the client's team; the runbook goes into the client handover docs.

## Acceptance Criteria
- [ ] A stale registry on Stage (sweep disabled for >2 h) raises an alert in the agreed channel within 15 min.
- [ ] Every credential has an expiry date, an owner and a tested rotation; one rotation was done on Stage end to end.
- [ ] The runbook's procedures were each run once on Stage (full reconcile, journal replay, pause, roll back,
      fallback).
- [ ] Handover held; the client names the operating owner.

## Dependencies
SKODA-511a (running app), SKODA-511 (run report), SKODA-521 (credentials). Client: an alert channel, a log tool
decision and the operating owner.
