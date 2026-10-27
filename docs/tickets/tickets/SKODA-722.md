# SKODA-722, Approved ASA and technical security-control baseline with platform evidence and IRMA decisions

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** governance / security configuration and assurance
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before production acceptance
- **Owner:** SA information owner/security SPOC with supplier architect and platform owners
- **Estimate:** unestimated pending ASA and component responsibilities
- **GitHub issue:** [#520](https://github.com/skoda-storyboard/demo/issues/520)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_SE_01/04, A01.050/070/080, A02.030/031, A03.020,
A04.010/030/040 and A10.010/020/030.
Existing identity, CSP and service credential tickets do not constitute an approved ASA
or evidence for this complete control set. Missing repo evidence is not proof SaaS controls are absent.

## Scope

- Obtain the approved/current ASA and business information classification; identify the responsible
  implementation layer, control owner and evidence source for each clause.
- Validate/configure protected service credentials and rotation, approved storage/transport encryption,
  applicable mutual system authentication, external-access decoupling and malware checks on imports/uploads.
- Verify server-side/interface validation and safe error/output handling for custom services and imports;
  define responsibilities for third-party services rather than adding a backend to static EDS pages.
- Collect provider evidence for inherited controls; implement missing applicable controls, with
  explicit architecture/security decisions where SaaS capabilities cannot meet the requirement.
- Maintain an IRMA risk/exception record with approver, scope, compensating controls and validity.
  A comment saying an exception will be created is not an accepted risk.

## Acceptance criteria

- [ ] Business classification and the current ASA are approved and linked from the coverage report.
- [ ] Every listed control has tested configuration/implementation evidence, applicable provider
      assurance, or the required accepted risk; no clause is silently marked not applicable.
- [ ] Service secrets are absent from source, protected in operation and covered by an owned rotation process.
- [ ] Import/upload malware handling, interface validation, error disclosure and encryption/authentication
      controls are exercised at their actual owning layer, including denied/invalid cases.
- [ ] Security owner signs the control disposition; remaining prohibited findings block release.

## Dependencies and boundaries

Use SKODA-719 boundaries and existing SKODA-521/511b, 714, 101a and 809.
Access lifecycle is SKODA-809a, logs SKODA-712a, scans/patching SKODA-721,
FOSS SKODA-723, privacy SKODA-725 and independent testing SKODA-726.
Do not reopen client-marked DONE IdP clauses without contradictory evidence.
