# SKODA-712a, Logging Concept and Solution: CLA, event coverage, retention and accepted SaaS exceptions

- **Epic:** E07, QA, Perf, A11y & Launch
- **Parent:** SKODA-712 (#419), operating model
- **Type:** integration / logging and documentation
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before operational acceptance
- **Owner:** supplier engineering with SA Logging Architect, security and platform owners
- **Estimate:** unestimated pending log access and CLA/SaaS applicability
- **GitHub issue:** [#525](https://github.com/skoda-storyboard/demo/issues/525)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_OM_01–04, NFR_AI_01 and A08.175/200/220/270/300/315/320.
Deliverables: Logging Concept and Logging Solution.
SKODA-812 covers editorial change history; 511b sync-job operations; neither covers the
complete log contract or formal acceptance of AEM/IMS forwarding limitations.

## Scope

- Catalogue audit/security, operational/performance and infrastructure logs for every applicable
  application/stage, with provider-owned versus custom responsibilities and event/attribute coverage.
- Specify secure collection/transport, VWG ECS format, synchronised timestamps, access roles,
  retention/deletion, analysis frequency, incident contacts and log-release procedures.
- Implement/test available CLA forwarding and applicable Azure Application Insights routing;
  do not invent an Azure application solely to satisfy an inapplicable platform clause.
- Obtain provider retention/access evidence for AEM/IMS/DA. Where forwarding is unavailable,
  obtain the required accepted IRMA exception and compensating investigation/monitoring process.
- Apply the SKODA-719 decision on runtime MLOps; development AI use alone does not establish a runtime log source.

## Acceptance criteria

- [ ] SA/Logging Architect review the complete event/source/retention matrix and DM approves the Concept.
- [ ] Representative login/admin/content-write, operational and infrastructure events are traceable
      at their owning layer; format, timestamps, access control, transport and retention are verified.
- [ ] Applicable central destinations receive events and an authorised reviewer retrieves evidence.
- [ ] Unsupported forwarding has an accepted, bounded risk record with owner, compensating process
      and validity; source comments promising future exceptions do not close this gate.
- [ ] Logging Solution matches the Concept, covers agreed stages and is accepted by the DM.

## Dependencies and boundaries

SKODA-719/722 (boundaries/risks), 812 (author history), 101a/809a (identity/admin events),
511b (sync logs), 725 (privacy/retention) and 712 (operations). Coordinate with 712b without
duplicating its alerts/Watch Center work. Adobe remains responsible for contracted infrastructure operation.
