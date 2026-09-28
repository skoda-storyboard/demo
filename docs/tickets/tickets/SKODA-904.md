# SKODA-904 — Newsletter/subscriber (ESP + consent + double-opt-in)
- **Epic:** E09 — Dynamic Services
- **Type:** service
- **Phase:** C  ·  **Pilot:** No · **Milestone:** M2 (go-live)
- **Estimate:** 8 SP · AI-assisted 3–5d / manual 6–10d *(planning estimate, not a quote)*

## Summary
Rebuild the newsletter/subscriber system as an ESP-fronted vanilla form block with double-opt-in, GDPR consent, and honeypot — preserving the source's account-system flow behind a clean API boundary.

## Description
The source `newsletter/v1` is a **full subscriber account system**, not a fire-and-forget form: **10 routes** (`subscriber/create`, `subscriber/login`, `subscriber/logout`, `subscription/save`, `subscription/extend`, `login/{email}`, `extend/{email}`, `fetchConfirmationUrl/{email}`, `fetchConfirmationUrl/batch`, root), backed by **mailguide.cz** (Czech ESP), with **double-opt-in** via confirmation URLs. The form (`NewsletterFormWidgetV2` / `NewsletterFormShortcode`) has fields `email`, `terms` (consent checkbox), and `titel-nme-field` (**honeypot**).

EDS has no subscriber backend, so the rebuild fronts the ESP (mailguide or a replacement) with a **vanilla form block**: render email + consent + hidden honeypot → validate (email valid, `terms` checked, honeypot empty) → `POST` to the ESP → show "check your email" (double-opt-in) success; the confirmation link completes subscription server-side. Consent-gated (OneTrust), loaded in the delayed phase, GDPR consent preserved, and emits form events to the dataLayer (SKODA-905). The existing footer `newsletter-stub` sends nothing; the M1 sidebar variant is planned under SKODA-823. This ticket delivers the M2 production service.

## Requirements / Spec
- Vanilla form block: email field, consent checkbox (`terms`) linking to privacy, hidden honeypot (`titel-nme-field`).
- Client validation: valid email, consent required, honeypot must be empty; accessible labels + error messaging + focus-on-error.
- `POST` to the ESP/newsletter endpoint (mailguide or replacement); double-opt-in "check your email" success state.
- Consent-gated (OneTrust); loaded in delayed phase; GDPR consent record preserved.
- Form events (submit/success/error) emitted to the dataLayer.

## Acceptance Criteria
- [ ] Form validates email + consent + honeypot client-side before submit; bots hitting the honeypot are rejected.
- [ ] Valid submission POSTs to the ESP and shows the double-opt-in "check your email" success state.
- [ ] Consent is required and recorded; the form does not submit without it.
- [ ] Accessible: real labels, error messaging, focus moves to the error.
- [ ] Form events feed the dataLayer per the analytics contract.

## Dependencies
- Upstream: SKODA-304 (footer fragment — newsletter form lives in/near footer chrome) / Downstream: SKODA-905 (form event wiring)

## Risks / Flags
- **High (🔴):** ESP POST body + consent contract were **not exercised** (non-mutating probe) — described from route shape + form fields only.
- **Open:** capture the exact mailguide.cz POST body/consent contract from the vendor spec before build.
- Newsletter double-opt-in UX is `[RUNTIME-UNCONFIRMED]` — verify with a real account in a browser.
- ESP choice (keep mailguide vs. replace) is a stakeholder decision affecting the contract.
