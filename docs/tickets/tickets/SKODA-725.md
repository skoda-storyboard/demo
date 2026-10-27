# SKODA-725, Formal GDPR, legal and regulatory acceptance across the production service

- **Epic:** E07, QA, Perf, A11y & Launch
- **Type:** governance / privacy and legal acceptance
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Priority:** P1, required before production acceptance
- **Owner:** SA privacy/legal/compliance and cookie SPOCs with supplier architect
- **Estimate:** unestimated pending ASA and controller/processor responsibilities
- **GitHub issue:** [#523](https://github.com/skoda-storyboard/demo/issues/523)
- **Status (2026-10-27):** TODO

## Source and gap

Client NFR pack: NFR_RC_01/02; Deliverables: Solution and Requirements Coverage Report.
Consent integration (SKODA-804/907), newsletter integration (904/908c) and legal-page content
(843) are tracked, but they do not themselves constitute the formal GDPR/legal compliance gate.

## Scope

- Define controllers/processors and data flows per application, locale and external service,
  covering subscription records, consent/tracking identifiers, logs, shared accounts and any
  in-scope submissions. Identify data location, access, retention/deletion and subject-rights owners.
- Obtain the applicable ASA/GDPR/IT Guidebook checklist and assess the actual production configuration.
- Collect accepted privacy/legal texts, cookie/storage classification, processor/service terms and
  operating procedures; record which party implements each obligation and how it is evidenced.
- Exercise the agreed consent/subscription lifecycle and applicable deletion/retention processes;
  coordinate deletion of legacy personal data with SKODA-711.

## Acceptance criteria

- [ ] SA privacy/legal approves the data-flow and controller/processor inventory and applicable checklist.
- [ ] Retention, deletion, subject-rights handling and service/processor obligations have accountable
      owners and evidence for the relevant systems; no personal data or secrets are published in tickets.
- [ ] Cookie/storage notices, legal texts and consent/subscription behaviour match the accepted
      configuration and locale responsibilities, with recorded cookie SPOC results.
- [ ] GDPR and regulatory gate outcomes are explicitly approved by the authorised SA roles and
      linked to the release/coverage report; remaining findings have required dispositions.

## Dependencies and boundaries

SKODA-719/722 (architecture/ASA), 712a (log retention), 723 (licences), 843 (legal pages),
804/904/907/908c (implementation), 711 (legacy deletion) and 724 (release acceptance).
No duplicate consent platform or newsletter service is commissioned here.
