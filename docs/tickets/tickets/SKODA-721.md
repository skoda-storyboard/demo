# SKODA-721, Blocking SA SonarQube and JFrog gates with recurring vulnerability remediation

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** integration / CI quality and security policy
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P0, mandatory merge/release controls
- **Owner:** engineering with SA Sonar/JFrog administrators and security owner
- **Estimate:** unestimated pending SA access and policy configuration
- **GitHub issue:** [#519](https://github.com/skoda-storyboard/demo/issues/519)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_SE_05/06, NFR_ST_03, NFR_TP_01, A05.010/020/030.
Deliverables: DevOps Solution and Source Code Solution.
Main's inspected workflow runs block tests and lint, not these enterprise policy gates.

## Scope

- Provision approved SonarQube/JFrog projects and securely connect every applicable source,
  dependency and build/artifact set, including vendored runtime code and integration repositories.
- Make SA Quality/Policy gates required merge checks; retain test, coverage and lint evidence
  appropriate to the code, including shared scripts/importers rather than block tests alone.
- Handle scanner outages, skipped results and new repositories explicitly: no success-shaped bypass.
- Schedule scans at least monthly during development and maintenance; name the vulnerability owner,
  prioritisation/escalation process, critical-fix handling and regular patch cycle.

## Acceptance criteria

- [ ] SA confirms repository/artifact coverage, policies, thresholds and project ownership.
- [ ] A controlled failing finding blocks merge/release; a passing result is required for the exact
      proposed revision. Skipping/disabling a scan or an unavailable scanner cannot silently pass.
- [ ] Full relevant test/lint/coverage results reach the selected quality gate; exclusions are reviewed.
- [ ] The release has no open issues prohibited by the source deliverable criteria; any proposed
      exception is explicitly approved through the applicable SA process, not assumed permissible.
- [ ] Recurring scans run, findings reach the named owner and one remediation/retest cycle is evidenced;
      the cadence and patch obligations join SKODA-712's operational calendar.

## Dependencies and boundaries

Coordinate toolchain enforcement with SKODA-720, licence/FOSS assessment with SKODA-723 and
security assurance with SKODA-722/726. Scanner credentials and project provisioning are human gates.
This is not satisfied by existing ESLint/Stylelint or a one-time clean CI build.
