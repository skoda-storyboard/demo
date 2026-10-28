# SKODA-712b, Monitoring Concept and Solution: health checks, SC3 tickets and Watch Center integration

- **Epic:** E07, QA, Perf, A11y & Launch
- **Parent:** SKODA-712 (#419), operating model
- **Type:** integration / monitoring and operational acceptance
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before operational acceptance
- **Owner:** supplier engineering with SA operations/Watch Center and service owners
- **Estimate:** unestimated pending monitoring interfaces and support routing
- **GitHub issue:** [#526](https://github.com/skoda-storyboard/demo/issues/526)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_OM_05 and NFR_AD_03.
Deliverables: Monitoring Concept and Monitoring Solution.
SKODA-712 already owns RUM, basic uptime/JS-error checks and on-call; 511b owns sync-job monitoring.
The additional scope is enterprise health/event integration and accepted coverage across environments.

## Scope

- Reuse the existing checks and define active/passive coverage, health-check contracts, failure
  thresholds, recipients and BUS/IT event flows for applicable services and stages.
- Connect service-unavailability detection to SC3 incident creation and relevant events to Watch Center,
  with deduplication/recovery behaviour and named operational ownership.
- Cover development/testing visibility and the specified UAT/Stage/Production monitoring solution,
  recording platform boundaries. Do not duplicate Adobe's contracted AEM infrastructure monitoring.

## Acceptance criteria

- [ ] SA reviews and DM approves the Monitoring Concept, including environments, event/health contracts,
      support routes, escalation, maintenance suppression and recovery/duplicate-event behaviour.
- [ ] A controlled service failure generates the intended alert and SC3 ticket, reaches the named
      owner and appears in Watch Center where required; recovery and repeated failure are verified.
- [ ] Published checks include relevant content/index/feed/integration dependencies, not homepage uptime alone.
- [ ] Operators can access dashboards/runbooks and diagnose a sample incident using SKODA-712a logs.
- [ ] Monitoring Solution matches the approved Concept and is accepted with evidence for each agreed stage;
      unsupported interfaces have an explicit approved disposition.

## Dependencies and boundaries

SKODA-712 (support model/basic checks), 511b (job checks), 719 (service boundary),
712a (logs), 712c (availability measure), 709 (production host) and SA monitoring/SC3 access.
Feeds the SKODA-710 go/no-go check; it does not replace existing RUM or sync monitoring.
