# SKODA-726, Independent security source review and penetration test, remediation and retest

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** QA / independent security acceptance
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P0, formal source and solution release gates
- **Owner:** SA Security Code Review/Penetration Test SPOCs with supplier engineering and DM
- **Estimate:** unestimated; reserve external reviewer and retest lead time
- **GitHub issue:** [#524](https://github.com/skoda-storyboard/demo/issues/524)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: A10.040/060/065, NFR_SE_01.
Deliverables: Source Code Solution and Solution.
Lint, unit tests, CSP checks and automated dependency scans are not the required independent
Security Code Review and Penetration Test Reports.

## Scope

- Agree authorised review scope, applications, APIs, repositories, exact production release branches,
  environments, test accounts, rules of engagement and review/retest booking with SA SPOCs.
- Submit the agreed source set and stage/production-equivalent service for the standard SA assessments.
- Triage findings with the authorised security owner, implement required remediation in owning
  code/platform tickets and obtain the specified follow-up assessment on the corrected version.
- Reconcile report closure criteria and any proposed IRMA acceptance with SA; do not assume a risk
  waiver overrides the deliverable's no-open-issue criterion.

## Acceptance criteria

- [ ] Security review and penetration testing are booked early, authorised and scoped to all applicable
      repositories/applications, including extensions and relevant integrations.
- [ ] Standard Security Code Review and Penetration Test Reports identify the exact tested source
      revision, deployment/configuration and scope; results are stored with appropriate access.
- [ ] Each required finding has remediation and independent retest evidence; final reports have no
      prohibited open issue. Any exception has explicit authorised acceptance under the applicable criteria.
- [ ] SA security SPOCs and release approvers accept the results; coverage and go/no-go records link
      the approved reports and any residual-risk decisions.

## Dependencies and boundaries

Start scheduling alongside SKODA-718/719; execution uses SKODA-720 release source/environment,
722 control baseline, 721 scans and completed integration/media/governance work.
SKODA-724 aggregates release acceptance. This ticket commissions authorised assessments;
it is not a request for an agent to perform an unscoped security test now.
