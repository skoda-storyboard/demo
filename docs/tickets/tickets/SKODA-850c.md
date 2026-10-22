# SKODA-850c, Embargo asset gate: a marker, a feed-sync skip and a launch preview without published URLs

- **Epic:** E08, Editorial at Scale
- **Type:** setup / configuration + a feed-sync filter (amends SKODA-811 and 511a)
- **Phase:** B · **Milestone:** M2 (go-live, 2027-01-02). Not a go-live blocker alone, but until it lands a launch
  page can't be prepared ahead without making its assets public.
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 2–3d, excluding the client DAM process decision *(planning
  estimate, not a quote)*. From the review: G-KJ-03 2–3 SP on 511a/811, with G-T1-02 merged (+3–5 SP on 811 in that
  finding). Planned at the low end, assuming the DAM team answers with a restricted folder or a field.
- **GitHub issue:** [#449](https://github.com/skoda-storyboard/demo/issues/449) (created 2026-10-21, sub-issue of #427)
- **Parent:** SKODA-850
- **Status (2026-10-21):** 🔵 TODO (M2), no owner. Source:
  [gap review](../../reviews/SKODA-M2-INTEGRATION-GAP-REVIEW-2026-10-21.md) G-KJ-03 (High, CONFIRMED; + G-T1-02).

## Why
- The DA Assets picker inserts only a *published* asset ("author only is not supported").
- The AEM publish tier answers anonymously: HEAD 200, `access-control-allow-origin: *`.
- The 511a feed sync lists published assets (`SKODA-MEDIA-ITEMS-OPTIONS.md`: "the sync reads published assets
  only").
- So building a launch page ahead of time makes its assets public. D9 is green, but it has no asset mechanism.
- Preview-only images are also served on `.aem.live` (2 of 2); low impact alone, as hashes can't be enumerated.

## Scope
- **Client:** the DAM team's answer from the parent (how launch assets stay hidden until release, who releases
  them).
- **Embargo marker:** a field or a restricted folder on the asset, per that answer.
- **Feed sync (amends SKODA-511a):** skip marked assets until the release date; list them at the first sync after
  it.
- **Launch preview (amends SKODA-811):** the preview of an embargoed page links no published delivery URL; it uses
  the marker-aware path the DAM answer allows.
- **Docs:** state in the guide that Media Bus preview images are public by URL, and what authors may preview.

## Not in scope
- Preview protection and the group gate: SKODA-101a T3, SKODA-811. Asset-to-page lifecycle: SKODA-522, D20.
- Scheduling the release: SKODA-850a.

## Acceptance criteria
- [ ] Before release, an embargoed asset is in no media feed and its delivery URL isn't linked from any public page.
- [ ] At the first feed sync after the release time, the asset is in the media feed.
- [ ] SKODA-811 and 511a carry the amendment; the guide states what preview exposes.

## Dependencies
D9, D20; the client DAM team. SKODA-850 (parent), 811, 511a, 522, 101a (T3), 850a (timed release), 712 (guide).
