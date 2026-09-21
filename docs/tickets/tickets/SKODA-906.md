# SKODA-906 — Restricted end-user article access (QR-code journey)
- **Epic:** E09 — Dynamic Services
- **Type:** service / investigation
- **Phase:** C  ·  **Pilot:** No · **Milestone:** M2+ (investigation; scope once model defined)
- **Estimate:** 5 SP · AI-assisted 2–3d / manual 4–8d *(planning estimate, not a quote — provisional; re-point once the access model is defined)*

## Summary
Support restricted public access to selected articles/content via a QR-code-initiated journey (§6.6, decision D17). Closes traceability gap **G4**. **Access model is undefined** — this ticket is an investigation + build once the business clarifies it.

## Description
Client §6.6: the public experience must support restricted access to selected articles where required — a known use case is **selected subscriber/user access through a QR-code journey**. This is distinct from author-side embargo (SKODA-811): it's **end-user gated delivery**, which EDS does not do natively (the platform serves published static content from a public CDN; there is no per-user gate).

The access model is **fully open** and must be clarified by the business before build (tracked as **D17**):
- is authentication required?
- are QR codes unique or shared?
- expiry rules?
- subscriber/entitlement validation?
- access duration?
- forwarding/sharing behaviour?

No end-user auth exists on the site today. Until the model is defined, this is an **investigation** (feasible EDS patterns: signed/tokenised URLs, an edge-function gate on Adobe App Builder, or a time-boxed unlisted publish) with a follow-on build.

## Requirements / Spec
- Drive D17 to a defined access model (auth? QR uniqueness? expiry? entitlement? duration? forwarding).
- Evaluate EDS-compatible gating patterns (signed URL / edge-function gate / time-boxed unlisted publish) against the model.
- Build the chosen approach for the confirmed use case; integrate the QR-generation/journey.

## Acceptance Criteria
- [ ] D17 access model documented + agreed with the business.
- [ ] A feasible EDS gating pattern selected with trade-offs recorded.
- [ ] For the confirmed use case: a QR journey grants access per the rules; unauthorised access is prevented; expiry/entitlement honoured.

## Dependencies
- Upstream: **D17** (access model — blocking), SKODA-101 (any auth/IDP touchpoints), D14 (Adobe CDN / App Builder edge functions available)
- Related: SKODA-811 (author-side embargo — different mechanism, don't conflate)

## Risks / Flags
- 🔴 **Blocked on D17** — model fully undefined; SP is provisional and will re-point once scoped.
- No native EDS end-user gating — introduces delivery-side auth the platform doesn't do by default; treat as an M2+ investigation, not a demo item.
- Keep distinct from the author-side embargo (SKODA-811).
