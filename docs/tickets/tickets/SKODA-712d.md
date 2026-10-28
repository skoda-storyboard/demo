# SKODA-712d, Backup and Technical Recovery Plan with supplier-independent RTO/RPO restore rehearsal

- **Epic:** E07, QA, Perf, A11y & Launch
- **Parent:** SKODA-712 (#419), operating model
- **Type:** setup / backup, recovery and documentation
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P0, recovery acceptance before production
- **Owner:** supplier engineering with SA operations and Adobe/service owners
- **Estimate:** unestimated pending service scope, backup access and restore procedures
- **GitHub issue:** [#528](https://github.com/skoda-storyboard/demo/issues/528)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_AD_01, NFR_DO_03/04.
Deliverables: Backup and Technical Recovery Plan.
SKODA-710's cutover rollback and SKODA-711's legacy archive are not ongoing recovery of the new service.
AEM Author/Publisher snapshot comments do not establish DA/EDS/configuration coverage.

## Scope

- Inventory recovery sources and owners for DA source/fragments/sheets, EDS configuration,
  code/release versions, Assets originals/metadata, feeds/ledgers, integration configuration/state
  and applicable external services. Separate regenerable caches from authoritative data.
- Establish retention, archive, access/encryption and backup-success/failure handling per application.
- Prepare the required SA Technical Recovery Plan: infrastructure (where applicable), application
  and data recovery, aligned with the Installation Manual and agreed RTO/RPO.
- Use approved provider references for AEM where allowed; do not invent an AEM infrastructure recovery plan.
  Close any DA or extension gaps explicitly.

## Acceptance criteria

- [ ] Every authoritative dataset/configuration has a documented recoverable copy or accepted provider
      recovery procedure, including retention, responsibility and measured restore-point coverage.
- [ ] Backup and per-application Recovery Plan are reviewed by SA and approved by the DM in the required format.
- [ ] A recipient outside the supplier follows the plan in an isolated/non-destructive rehearsal, restoring
      application/data/configuration and validating content, assets, permissions, feeds and integrations.
- [ ] Timed evidence demonstrates RTO <12h and RPO <12h for the approved scope, or the formally amended targets
      from SKODA-712c; provider averages alone do not satisfy the rehearsal.
- [ ] Failed steps and missing data are remediated/retested; recovery access, contacts and recurring
      backup/restore checks are handed to operations without exposing credentials.

## Dependencies and boundaries

SKODA-719/712c establish scope/targets; coordinate early with 712e (manuals), 720 (source/deploy),
521/511b (integration state) and 522 (asset lifecycle). Distinct from SKODA-710 DNS rollback.
