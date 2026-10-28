# SKODA-712c, Approved BIA and availability commitment: resolve 99.95 percent versus Adobe 99.9 percent

- **Epic:** E07, QA, Perf, A11y & Launch
- **Parent:** SKODA-712 (#419), operating model
- **Type:** governance / service-level and resilience acceptance
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P0, unresolved contractual and recovery baseline
- **Owner:** SA Business Owner/service owner with Adobe contract/platform owners and supplier architect
- **Estimate:** unestimated; distinguish team effort from contract/BIA lead time
- **GitHub issue:** [#527](https://github.com/skoda-storyboard/demo/issues/527)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_AD_01/04, with NFR_SC_01/02 platform evidence.
NFR_AD_04 requires 24x7 availability of at least 99.95 percent, while its comments cite
99.9 percent author/delivery contracts. NFR_AD_01 assumes GOLD BIA, RTO <12h and RPO <12h.
The existing operating calendar does not resolve this contradiction.

## Scope

- Obtain approved BIA, protection/service classification and confirmation of recovery targets.
- Define the measured service boundary, dependencies, calculation period, exclusions, planned
  maintenance, responsibilities and contract coverage for authoring, public delivery and integrations.
- Compare required versus contracted availability and resilience/scaling capabilities. Obtain a
  justified solution or authorised requirement/contract/risk disposition; do not silently lower the target.
- Set measurement/reporting ownership and the consequences for monitoring, recovery and go/no-go.

## Acceptance criteria

- [ ] BIA and service scope are approved by authorised SA roles; targets and contract references are recorded.
- [ ] The 99.95/99.9 mismatch has an explicit approved resolution, with required architecture/contract
      changes or accepted exception and compensating measures; it is not marked compliant from comments alone.
- [ ] RTO and RPO remain strictly below 12h unless SA formally changes the requirement; SKODA-712d
      receives the agreed values and complete recovery scope.
- [ ] Provider evidence and custom-service responsibilities cover scaling, resilience and dependency
      failures without assuming a SaaS SLA covers the entire Product.
- [ ] Monitoring/reporting and operational owners accept the service commitments and release-gate disposition.

## Dependencies and boundaries

SKODA-719 (application boundaries), 712b (measurement), 712d (recovery validation),
715/401a/517 (capacity evidence), 709 (delivery stack) and SA/Adobe contract stakeholders.
This decision can start immediately; it must not wait until the cutover rehearsal.
